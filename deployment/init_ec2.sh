#!/bin/bash

sudo yum update -y
sudo yum install git -y

# install docker compose
sudo yum update -y 
sudo yum install docker -y
sudo systemctl start docker
sudo usermod -a -G docker ec2-user 

sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

cd /home/ec2-user
# clone repo
git clone https://github.com/FabianTraxler/decathlon_support_system.git
cd decathlon_support_system
# switch to deployment branch
git checkout origin/release/v.1.1.0

# go to deployment folder
cd deployment

# run application
sudo docker-compose up -d