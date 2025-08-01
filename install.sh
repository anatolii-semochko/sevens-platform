#!/bin/bash
set -e

echo "🔧 Updating and installing PHP & MySQL..."
export DEBIAN_FRONTEND=noninteractive

apt update
apt install -y php-cli php-mbstring php-xml php-curl php-intl php-mysql unzip mysql-server curl git zip wget

echo "PHP version"
php -v

echo "⚙️ Starting MySQL..."
service mysql start

echo "🔐 Configuring MySQL user and database..."
mysql -uroot -proot -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';"
mysql -uroot -proot -e "CREATE DATABASE sevens_time CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "📦 Installing Composer..."
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer

echo "🔧 Installing Symfony CLI..."
wget https://get.symfony.com/cli/installer -O - | bash
mv ~/.symfony*/bin/symfony /usr/local/bin/symfony

echo "📁 Installing Symfony project dependencies..."
composer install

echo "🛠️ Setting up environment config..."
cp .env .env.dev || true

echo "📜 Running Symfony DB migrations..."
php bin/console doctrine:migrations:migrate --no-interaction

echo "💾 Available disk space:"
df -h /

echo "✅ Setup complete. Ready to run your app or tests!"
