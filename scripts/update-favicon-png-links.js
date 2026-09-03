const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

function updateFaviconLinks(dir, prefix = '') {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file === 'knowledge') {
        updateFaviconLinks(fullPath, '../');
      }
    } else if (file.endsWith('.html')) {
      let html = fs.readFileSync(fullPath, 'utf8');

      // Replace favicon links to point directly to transparent favicon.png
      html = html.replace(/<link[^>]+rel=["']icon["'][^>]*>/gi, '');
      html = html.replace(/<link[^>]+rel=["']alternate icon["'][^>]*>/gi, '');
      html = html.replace(/<link[^>]+rel=["']apple-touch-icon["'][^>]*>/gi, '');

      const faviconTags = `
    <!-- Official Transparent Logo Favicons -->
    <link rel="icon" type="image/png" href="${prefix}favicon.png?v=2">
    <link rel="apple-touch-icon" href="${prefix}favicon.png?v=2">`;

      html = html.replace('</head>', `${faviconTags}\n</head>`);
      fs.writeFileSync(fullPath, html, 'utf8');
    }
  }
}

updateFaviconLinks(rootDir);

// Upload updated HTMLs to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading HTMLs with direct favicon.png link...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));
    let count = 0;
    for (const hf of htmlFiles) {
      sftp.fastPut(path.join(rootDir, hf), `/var/www/yug-pravo/${hf}`, () => {
        count++;
        if (count === htmlFiles.length) {
          conn.exec('systemctl reload nginx', () => {
            console.log('FAVICON_LINKS_UPDATED_EVERYWHERE');
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
