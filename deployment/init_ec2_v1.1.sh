#!/bin/bash

sudo yum update -y
sudo yum install git -y

sudo dnf update -y
# Remove old version
sudo dnf remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine
# Install dnf plugin
sudo dnf -y install dnf-plugins-core
# Add CentOS repository
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
# Adjust release server version in the path as it will not match with Amazon Linux 2023
sudo sed -i 's/$releasever/9/g' /etc/yum.repos.d/docker-ce.repo
# Install as usual
sudo dnf -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
# Enable the docker service
sudo systemctl enable --now docker

sudo usermod -a -G docker ec2-user 

sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

cd /home/ec2-user
# clone repo
git clone https://github.com/FabianTraxler/decathlon_support_system.git
cd decathlon_support_system
# switch to deployment branch
git checkout 5f7f0929eab95d14fa4e07932f153e04dcabbe99

# go to deployment folder
cd deployment

# run application
sudo docker-compose pull
sudo docker-compose up -d