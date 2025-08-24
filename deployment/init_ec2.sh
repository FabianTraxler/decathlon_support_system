sudo yum update -y
sudo yum install git -y

# install docker compose
sudo yum update -y 
sudo yum install docker -y
sudo systemctl start docker
sudo usermod -a -G docker ec2-user 

sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose version

# clone repo
git clone https://github.com/FabianTraxler/decathlon_support_system.git
cd decathlon_support_system

# run application
sudo docker-compose up -d