const { Client } = require('ssh2');
const conn = new Client();

const NGINX_CONF = `server {
    listen 80;
    server_name yugpravo.ru www.yugpravo.ru 82.202.129.126;
    return 301 https://yugpravo.ru$request_uri;
}

server {
    listen 443 ssl http2;
    server_name www.yugpravo.ru;

    ssl_certificate /etc/letsencrypt/live/yugpravo.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yugpravo.ru/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://yugpravo.ru$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yugpravo.ru;

    root /var/www/yug-pravo;
    index index.html;

    ssl_certificate /etc/letsencrypt/live/yugpravo.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yugpravo.ru/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

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
        proxy_connect_timeout 15s;
        proxy_read_timeout 30s;
    }

    location / {
        try_files $uri $uri.html $uri/ /index.html;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Static assets caching
    location ~* \\.(mp4|webm|jpg|jpeg|png|gif|ico|svg|woff2|woff|ttf)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
`;

conn.on('ready', () => {
  console.log('SSH connected. Updating Nginx config to proxy /api/ -> 127.0.0.1:8080...');
  
  conn.sftp((err, sftp) => {
    if (err) throw err;
    
    // Find the config file in /etc/nginx/sites-available/ or sites-enabled/
    const targetFile = '/etc/nginx/sites-available/yug-pravo';
    const stream = sftp.createWriteStream(targetFile);
    stream.write(NGINX_CONF);
    stream.end(() => {
      console.log('Written to ' + targetFile);
      
      const fixCmd = [
        'ln -sf /etc/nginx/sites-available/yug-pravo /etc/nginx/sites-enabled/yug-pravo',
        'nginx -t',
        'systemctl reload nginx',
        'pm2 reload yug-pravo-web --update-env'
      ].join(' && ');

      conn.exec(fixCmd, (err, cStream) => {
        let out = '';
        cStream.on('data', d => out += d);
        cStream.stderr.on('data', d => out += d);
        cStream.on('close', () => {
          console.log(out);
          console.log('\n🎉 Nginx config updated and reloaded!');
          conn.end();
        });
      });
    });
  });
}).on('error', e => console.error('SSH Error:', e.message));

conn.connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
