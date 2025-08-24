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
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC5DQf4yZUMpWgtBO1GaG+awcscsmo7y3SPlj2Gt7j9Fx4eTubdmHMo9gvA3ayzu9ofsfp6azwVgV2JXR+Ow/JYXV2xuHzalW/r69O7wrw4moq1mP5dbOE+I/hX9i82uAl892mjXMqS5yBow8F8sKbOfrWVN02EGLROt1PGhdv1/JZ9aI5/joY9PsncyCBLM4V7nmoks3z8zfOwWW/j9vC461t6Fhx0ij/dfozIghx2dvz3vpL5P+xTQHr1XeiTj1bYa03PN/I6QWaPzKM1qxjI+0BdSpiBV0AI2w5NoEiCT+j+p+3XUwvrVhT8ch9aSAlNI4NqqBu99FYtOjyR6In6suWF6x2sNT0zkwsvW79Xz5TqoFU17MPK/cjkiaAuYR8F1xhFCqHr7Btygnb1LEeNh/II5tErR/dN8SCIsBmjuhQP5M+MiyhFoqjwseWgCn2qn67C1XcjU3vYX85G8fHUXB4s4yVkNoAIXpkSjePnbikUIl9J8rYSv9qRacEKL7s= fabian@Fabians-MBP.home
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
resource "aws_instance" "test_decathlon_support_system" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = "t2.micro"
  key_name               = aws_key_pair.test_ec2_key.key_name
  vpc_security_group_ids = [aws_security_group.ssh_sg.id]

  user_data = file("${path.module}/../init_ec2.sh")

  tags = {
    Name = "test_decathlon_support_system"
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

# ---------- Storage ----------

resource "aws_ebs_volume" "test_extra_volume" {
  availability_zone = aws_instance.test_decathlon_support_system.availability_zone
  size              = 15   # GB
  type              = "gp3"

  tags = {
    Name = "test-extra-volume"
  }
}

resource "aws_volume_attachment" "test_ec2_extra_volume_attach" {
  device_name = "/dev/xvdf"
  volume_id   = aws_ebs_volume.test_extra_volume.id
  instance_id = aws_instance.test_decathlon_support_system.id
}