const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Update all script and css tags in all HTML files with ?v=20260829_v10
function addCacheBustersToHtml(dir, prefix = 'js/') {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file === 'knowledge') {
        addCacheBustersToHtml(fullPath, '../js/');
      }
    } else if (file.endsWith('.html')) {
      let html = fs.readFileSync(fullPath, 'utf8');

      // Replace js script paths with version query
      html = html.replace(/src=["'](\.\.\/)?js\/([a-zA-Z0-9_\-\.]+?\.js)(\?[^"']*)?["']/gi, (match, dotdot, jsFile) => {
        const p = dotdot ? dotdot + 'js/' : 'js/';
        return `src="${p}${jsFile}?v=20260829_v10"`;
      });

      // Replace css paths
      html = html.replace(/href=["'](\.\.\/)?css\/([a-zA-Z0-9_\-\.]+?\.css)(\?[^"']*)?["']/gi, (match, dotdot, cssFile) => {
        const p = dotdot ? dotdot + 'css/' : 'css/';
        return `href="${p}${cssFile}?v=20260829_v10"`;
      });

      fs.writeFileSync(fullPath, html, 'utf8');
      console.log('Cache-busters added to:', file);
    }
  }
}

addCacheBustersToHtml(rootDir);

// 2. Connect to VPS, update Nginx config to no-cache for JS/CSS and upload all files
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Updating Nginx config and syncing files...');

  const nginxConf = `server {
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

    gzip on;
    gzip_vary on;
    gzip_min_length 256;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss image/svg+xml;

    # HTML, JS, CSS: always revalidate, no stale cache
    location ~* \\.(html|js|css)$ {
        add_header Cache-Control "no-cache, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
        try_files $uri =404;
    }

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

    location ~* \\.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|mp4|webm)$ {
        expires 1d;
        add_header Cache-Control "public, must-revalidate";
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html =404;
    }

    location ~ /\\. {
        deny all;
    }
}
`;

  conn.exec(`cat << 'EOF' > /etc/nginx/sites-available/yug-pravo.conf\n${nginxConf}\nEOF\nnginx -t && systemctl reload nginx`, (err, stream) => {
    stream.on('close', () => {
      console.log('Nginx config reloaded with NO-CACHE on JS/CSS/HTML.');

      conn.sftp((err, sftp) => {
        if (err) throw err;

        // Upload JS files
        const jsDir = path.join(rootDir, 'js');
        const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
        let jsCount = 0;

        for (const jf of jsFiles) {
          sftp.fastPut(path.join(jsDir, jf), `/var/www/yug-pravo/js/${jf}`, () => {
            jsCount++;
            if (jsCount === jsFiles.length) {
              console.log('All JS files uploaded to server.');

              // Upload HTML files
              const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));
              let hCount = 0;
              for (const hf of htmlFiles) {
                sftp.fastPut(path.join(rootDir, hf), `/var/www/yug-pravo/${hf}`, () => {
                  hCount++;
                  if (hCount === htmlFiles.length) {
                    console.log('ALL_FILES_SYNCED_AND_CACHE_PURGED');
                    conn.end();
                  }
                });
              }
            }
          });
        }
      });
    });
  });
}).connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
