const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

function updateFaviconVersion(dir, prefix = '') {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file === 'knowledge') {
        updateFaviconVersion(fullPath, '../');
      }
    } else if (file.endsWith('.html')) {
      let html = fs.readFileSync(fullPath, 'utf8');

      html = html.replace(/href=["'][^"']*favicon\.png[^"']*["']/gi, `href="${prefix}favicon.png?v=3"`);
      html = html.replace(/href=["'][^"']*favicon\.svg[^"']*["']/gi, `href="${prefix}favicon.svg?v=3"`);

      fs.writeFileSync(fullPath, html, 'utf8');
    }
  }
}

updateFaviconVersion(rootDir);

// Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading HTMLs with v=3 cache buster...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));
    let count = 0;
    for (const hf of htmlFiles) {
      sftp.fastPut(path.join(rootDir, hf), `/var/www/yug-pravo/${hf}`, () => {
        count++;
        if (count === htmlFiles.length) {
          conn.exec('systemctl reload nginx', () => {
            console.log('FAVICON_CACHE_BUSTED_AND_DEPLOYED');
            conn.end();
          });
        }
      });
    }
  });
}).connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
