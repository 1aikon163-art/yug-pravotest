#!/bin/bash
set -e

echo "=========================================================="
echo "🚀 АНО «ЮГ-ПРАВО» — Автоматическое развертывание на сервере"
echo "=========================================================="

# 1. Обновление репозиториев и установка системных пакетов
echo "📦 1/6. Обновление ОС и установка пакетов (Node.js 20, Nginx, PM2, UFW)..."
export DEBIAN_FRONTEND=noninteractive
apt update -y
apt install -y curl wget git nginx certbot python3-certbot-nginx ufw tar

# Установка Node.js 20 LTS если не установлен
if ! command -v node &> /dev/null; then
    echo "⚡ Установка Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Установка PM2 глобально
if ! command -v pm2 &> /dev/null; then
    echo "⚡ Установка PM2..."
    npm install -g pm2
fi

# 2. Создание директории сайта
echo "📁 2/6. Подготовка директории /var/www/yug-pravo..."
mkdir -p /var/www/yug-pravo
tar -xzf /tmp/yug-pravo-deploy.tar.gz -C /var/www/yug-pravo/

cd /var/www/yug-pravo

# 3. Установка npm зависимостей для работы ботов, PDF и API
echo "📥 3/6. Установка зависимостей проекта (npm install)..."
npm install --production

# 4. Настройка Nginx конфигурации
echo "🌐 4/6. Настройка веб-сервера Nginx..."
cat << 'EOF' > /etc/nginx/sites-available/yug-pravo.conf
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/yug-pravo;
    index index.html;

    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml application/javascript application/json application/xml+rss image/svg+xml;

    # Статические страницы сайта
    location / {
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, no-transform";
    }

    # Кэширование медиа и шрифтов
    location ~* \.(mp4|webm|jpg|jpeg|png|webp|svg|ico|woff2|woff|ttf|pdf|docx)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
        access_log off;
    }

    # Проксирование API (Т-Банк эквайринг, заявки граждан) на Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ~ /\. {
        deny all;
    }
}
EOF

# Активация сайта в Nginx
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/yug-pravo.conf /etc/nginx/sites-enabled/yug-pravo.conf
nginx -t
systemctl restart nginx
systemctl enable nginx

# 5. Запуск всех 6 процессов через PM2 (Web API + 5 ботов)
echo "🤖 5/6. Запуск веб-сервера и экосистемы ботов через PM2..."
cd /var/www/yug-pravo
pm2 delete all || true
pm2 start ecosystem.config.js
pm2 save
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root || true

# 6. Настройка сетевого экрана (UFW Firewall)
echo "🛡️ 6/6. Настройка безопасности Firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "=========================================================="
echo "✅ РАЗВЕРТЫВАНИЕ УСПЕШНО ЗАВЕРШЕНО!"
echo "🌐 Сайт доступен по IP: http://82.202.129.126/"
echo "🤖 Боты и API активны в PM2:"
pm2 status
echo "=========================================================="
