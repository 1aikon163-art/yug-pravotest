const { Client } = require('ssh2');
const conn = new Client();

const conf = `server {
    listen 80;
    server_name yugpravo.ru www.yugpravo.ru 82.202.129.126;
    return 301 https://yugpravo.ru$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name www.yugpravo.ru;

    ssl_certificate /etc/letsencrypt/live/yugpravo.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yugpravo.ru/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://yugpravo.ru$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name yugpravo.ru;

    root /var/www/yug-pravo;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/yugpravo.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yugpravo.ru/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # GZIP High-Speed Compression for all assets
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 256;
    gzip_types text/plain text/css text/xml application/json application/javascript application/x-javascript text/javascript image/svg+xml font/woff2 font/woff;

    # 301 Canonical Redirect: /index.html -> /
    if ($request_uri ~* "^/index\\.html$") {
        return 301 /;
    }

    # API Proxy to Node.js backend (yug-pravo-web on port 8080)
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 5s;
        proxy_read_timeout 15s;
    }

    # High performance static assets caching (JS, CSS, fonts, images)
    location ~* \\.(css|js|mp4|webm|jpg|jpeg|png|gif|ico|svg|woff2|woff|ttf)$ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800, immutable";
        access_log off;
    }

    # HTML pages
    location / {
        try_files $uri $uri.html $uri/ /index.html;
        add_header Cache-Control "public, max-age=15, stale-while-revalidate=60";
    }
}
`;

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const stream = sftp.createWriteStream('/etc/nginx/sites-available/yug-pravo');
    stream.write(conf);
    stream.end(() => {
      conn.exec('nginx -t && systemctl reload nginx', (execErr, execStream) => {
        if (execErr) throw execErr;
        execStream.on('close', () => {
          console.log('⚡ Nginx Ultra-Fast Configuration Deployed and Reloaded!');
          conn.end();
        }).on('data', d => process.stdout.write(d));
      });
    });
  });
}).connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
