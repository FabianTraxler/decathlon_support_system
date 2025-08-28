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
resource "aws_key_pair" "test_ec2_key" {
  key_name   = "test-ec2-key"
  public_key = <<EOT
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCom6i1wZLZru4dfOMoFzYyfM/Lf68xadBKh5A+VYBl8ohr1W1In1GKoTfsxtMEffhzEUi5SoTHin7f/mW7XY6urj0AxakT50A3xTLzTW0pjZU+bkVcm/JK+1KuSXZsWlX8S6n+ZehAELG7nqX+chW4lV/poLRRx5UKVn4rRBRN6M+Unaw9Imb4iAG+w+YAmn+IMvkdEVVhMyEdlT83sqWayL3VoJRJhpl0OQtsRN+caQlp9O0QKMZPGAz/LsxjkyDSiZZ0xBBxOf2izxDuwhI419sLymDF0ytbaSppasQS6kuUBg1w00aFt4O0f+4NP+2g2xU8V6i9e/0cs2T/G0y7iJhPyawNWfvcIIGKMd4j1j4CEG347rI5hq223emscyrD9YzbKHIr2RsRczp7PALDBgcm1DAmkoJl8pgALKm/XLKiBp9qTZSqvtTsZPYq4KztioLVSWFin3iu0r5gVI6XO0i/FhW0PqoG82BH5wq+C76PGu7kLqNgNq5wwhAA0SE= fabian@ubuntus
EOT
}

# ---------- Security Group ----------
resource "aws_security_group" "ssh_sg" {
  name        = "test-ec2-ssh"
  description = "Allow SSH"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Restrict this to your own IP!
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
      ]
    })}
  END
}

data "cloudinit_config" "init_test_ec2" {
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


resource "aws_instance" "test_decathlon_support_system" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = "t2.micro"
  key_name               = aws_key_pair.test_ec2_key.key_name
  vpc_security_group_ids = [aws_security_group.ssh_sg.id]

  user_data = data.cloudinit_config.init_test_ec2.rendered

  tags = {
    Name = "test_decathlon_support_system"
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
  instance_id   = aws_instance.test_decathlon_support_system.id
}