const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

function processHtmlFiles(dir, prefix = 'js/') {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file === 'knowledge' || file === 'components') {
        processHtmlFiles(fullPath, '../js/');
      }
    } else if (file.endsWith('.html')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes('standby-lock.js')) {
        content = content.replace('</head>', `    <script src="${prefix}standby-lock.js"></script>\n</head>`);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Injected standby-lock into:', file);
      }
    }
  }
}

processHtmlFiles(rootDir);

// Now upload all files to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH ready, uploading updated files...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    // Upload js/standby-lock.js
    sftp.fastPut(path.join(rootDir, 'js/standby-lock.js'), '/var/www/yug-pravo/js/standby-lock.js', (err) => {
      if (err) console.error(err);
      console.log('standby-lock.js uploaded');

      // Upload HTML files
      const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));
      let count = 0;
      for (const hf of htmlFiles) {
        sftp.fastPut(path.join(rootDir, hf), `/var/www/yug-pravo/${hf}`, () => {
          count++;
          if (count === htmlFiles.length) {
            conn.exec('systemctl reload nginx && pm2 reload all', () => {
              console.log('ALL_HTML_SYNCED_WITH_STANDBY_LOCK');
              conn.end();
            });
          }
        });
      }
    });
  });
}).connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
