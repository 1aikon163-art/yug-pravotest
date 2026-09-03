const { Client } = require('ssh2');

const CONFIG = {
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
};

const nginxConf = `server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name yugpravo.ru www.yugpravo.ru xn----7sbf0aaj8ak7b.xn--p1ai _;

    root /var/www/yug-pravo;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml application/javascript application/json application/xml+rss image/svg+xml;

    location / {
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, no-transform";
    }

    location ~* \\.(mp4|webm|jpg|jpeg|png|webp|svg|ico|woff2|woff|ttf|pdf|docx)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
        access_log off;
    }

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

    location ~ /\\. {
        deny all;
    }
}
`;

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) { console.error(err); conn.end(); return; }
    const stream = sftp.createWriteStream('/etc/nginx/sites-available/yug-pravo.conf');
    stream.write(nginxConf);
    stream.end(() => {
      conn.exec('nginx -t && systemctl reload nginx', (err, proc) => {
        proc.on('close', () => {
          console.log('✅ Nginx успешно обновлен для yugpravo.ru и юг-право.рф!');
          conn.end();
        }).on('data', d => process.stdout.write(d));
      });
    });
  });
}).connect(CONFIG);
