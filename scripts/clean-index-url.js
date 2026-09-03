const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Function to clean href="index.html" -> href="/" across all HTML files
function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.agents') {
        results = results.concat(getHtmlFiles(fullPath));
      }
    } else if (file.endsWith('.html')) {
      results.push(fullPath);
    }
  });
  return results;
}

const htmlFiles = getHtmlFiles(rootDir);

htmlFiles.forEach(filePath => {
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace href="index.html" with href="/"
  if (html.includes('href="index.html"')) {
    html = html.replace(/href=["']index\.html["']/g, 'href="/"');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`Cleaned home links in: ${path.relative(rootDir, filePath)}`);
  }
});

// 2. Update Nginx configuration on VPS to 301 redirect /index.html -> /
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Updating Nginx config for clean URLs...');

  const nginxConfig = `
server {
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

    location / {
        try_files $uri $uri.html $uri/ /index.html;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Static assets caching
    location ~* \\.(mp4|webm|jpg|jpeg|png|gif|ico|svg|woff2|woff|ttf)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # API Proxy for Telegram / Legal Bot
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
`;

  conn.exec(`cat << 'EOF' > /etc/nginx/sites-available/yug-pravo.conf\n${nginxConfig}\nEOF\nnginx -t && systemctl reload nginx`, (err, stream) => {
    if (err) throw err;

    stream.on('close', () => {
      console.log('Nginx reloaded with canonical 301 redirect (/index.html -> /)!');
      
      // Upload root HTML files
      conn.sftp((err, sftp) => {
        if (err) throw err;
        let count = 0;
        const rootHtmlFiles = [
          'index.html',
          'about.html',
          'calculator.html',
          'events.html',
          'initiatives.html',
          'knowledge.html',
          'disclosure.html',
          'contacts.html',
          'services.html',
          'cases.html',
          'code.html',
          'privacy.html',
          'ustav.html'
        ];

        rootHtmlFiles.forEach(file => {
          const p = path.join(rootDir, file);
          if (fs.existsSync(p)) {
            sftp.fastPut(p, `/var/www/yug-pravo/${file}`, () => {
              count++;
              if (count === rootHtmlFiles.length) {
                console.log('CLEAN_URLS_DEPLOYED_SUCCESSFULLY');
                conn.end();
              }
            });
          }
        });
      });
    });
  });
}).connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
