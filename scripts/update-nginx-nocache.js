const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH ready');
  conn.exec(`cat << 'EOF' > /etc/nginx/sites-available/yug-pravo.conf
server {
    listen 80;
    listen [::]:80;
    server_name yugpravo.ru www.yugpravo.ru xn----7sbf0aaj8ak7b.xn--p1ai;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yugpravo.ru www.yugpravo.ru xn----7sbf0aaj8ak7b.xn--p1ai;

    ssl_certificate /etc/letsencrypt/live/yugpravo.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yugpravo.ru/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/yug-pravo;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 256;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss image/svg+xml;

    # HTML files: never cache to avoid stale code
    location ~* \.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        try_files $uri $uri/ /index.html =404;
    }

    # API Proxy to Node.js Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static Assets Cache
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|mp4|webm)$ {
        expires 1d;
        add_header Cache-Control "public, must-revalidate";
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html =404;
    }

    # Deny hidden files
    location ~ /\. {
        deny all;
    }
}
EOF
nginx -t && systemctl reload nginx
`, (err, stream) => {
    stream.on('close', () => {
      console.log('Nginx config updated with no-cache on HTML');
      conn.end();
    }).on('data', d => process.stdout.write(d));
  });
}).connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
