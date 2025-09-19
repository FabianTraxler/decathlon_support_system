terraform {
  required_version = ">= 1.4.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = "eu-central-1"
}

# ---------- EC2 SSH Key ----------
# Insert your own public key below (e.g. from id_rsa.pub)
resource "aws_key_pair" "backup_ec2_key" {
  key_name   = "backup-ec2-key"
  public_key = <<EOT
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCxl6dy5VaoVBq0z/BzbCKSX3PcnLbOBh7TwXChcKpH9lXydL+2LesCE6X/mPWZHUnwJzlvZnWUDl20csInLLDN0oCFWIysrfttOPdO3qRdZqL44UzRphjYSK9SYXBLDMfGVwMLSLzisIGcElQr/qAKXyrHnD63pRXbAlxgtw64kmYWo4gy/QJivvG+uPKaUOiNvyLUM0iNvNe7uPsQV6aEvaSAJqYYe9Y/5LQD3aYPLxNSh1modJLFoXFDAg0pLec8BmbhxdjtmVI7J8cOjk+rIHNDI1/RqhiB50jDQsQB6FJkfVZzCV19R5Lf8EfJl6zjtoJLFyuW86QcDM6P8uNzhquQR7aBs+Tb4UnbBTtK2E4USl2xEZr/KRFedz29pSSEnADlXO9f43RsgEZ2hu1yMHFLG4Jct1WDGr+RSphUTh4g3Vbv21AMYY7rvDJAz4bZuHi0yiP+1fiVjYr9iVwNWZL8J6cI5dgc4xzX1NRrXKVj3ru+paypG85zf8vsXRc= fabian@ubuntus
EOT
}

# ---------- Security Group ----------
resource "aws_security_group" "ssh_sg_backup" {
  name        = "backup-ec2"
  description = "Allow SSH and HTTPS inbound traffic"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] 
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

data "aws_vpc" "default" {
  default = true
}

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["137112412989"] # Amazon

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

# ---------- EC2 Instance ----------
locals {
  files = <<-END
    #cloud-config
    ${jsonencode({
      write_files = [
      {
        path        = "/home/ec2-user/.certs/private.key"
        permissions = "0644"
        owner       = "root:root"
        encoding    = "b64"
        content     = filebase64("${path.module}/../../.certs/private.key")
      },
      {
        path        = "/home/ec2-user/.certs/public.crt"
        permissions = "0644"
        owner       = "root:root"
        encoding    = "b64"
        content     = filebase64("${path.module}/../../.certs/public.crt")
      },
      {
        path        = "/home/ec2-user/.envs/backend.env"
        permissions = "0644"
        owner       = "root:root"
        encoding    = "b64"
        content     = filebase64("${path.module}/backend.env")
      },
      {
        path        = "/home/ec2-user/.aws/config"
        permissions = "0644"
        owner       = "root:root"
        encoding    = "b64"
        content     = filebase64("${path.module}/../aws_config")
      }
      ]
    })}
  END
}

data "cloudinit_config" "init_backup_ec2" {
  gzip          = false
  base64_encode = false

  part {
    content_type = "text/cloud-config"
    filename     = "file-upload.yaml"
    content      = local.files
  }
  part {
    content_type = "text/x-shellscript"
    filename     = "init_ec2.sh"
    content  = file("${path.module}/../init_ec2.sh")
  }
}
# --------------------------
# IAM Role for EC2 instance
# --------------------------
resource "aws_iam_role" "test_role" {
  name = "test_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = "ec2.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })
}

# Attach DynamoDB full access policy
resource "aws_iam_role_policy_attachment" "ec2_dynamodb_attach" {
  role       = aws_iam_role.test_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

# Instance profile (bridge between EC2 and IAM Role)
resource "aws_iam_instance_profile" "backup_profile" {
  name = "tf-ec2-backup-instance-profile"
  role = aws_iam_role.test_role.name
}


resource "aws_instance" "backup_decathlon_support_system" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = "t2.micro"
  key_name               = aws_key_pair.backup_ec2_key.key_name
  vpc_security_group_ids = [aws_security_group.ssh_sg_backup.id]

  user_data = data.cloudinit_config.init_backup_ec2.rendered
  iam_instance_profile = aws_iam_instance_profile.backup_profile.name
  tags = {
    Name = "backup_decathlon_support_system"
  }

  root_block_device {
    volume_size           = 10
  }
}

# ---------- Elastic IP ----------
resource "aws_eip" "ec2_eip" {
  domain = "vpc"
}

resource "aws_eip_association" "eip_assoc" {
  allocation_id = aws_eip.ec2_eip.id
  instance_id   = aws_instance.backup_decathlon_support_system.id
}

# ---------- Outputs ----------
output "ec2_public_ip" {
  value = aws_eip.ec2_eip.public_ip
}
