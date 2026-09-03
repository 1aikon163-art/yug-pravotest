const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// Copy logo_orig.png -> logo.png and logo_orig.webp -> logo.webp
const origPng = path.join(rootDir, 'images/logo_orig.png');
const origWebp = path.join(rootDir, 'images/logo_orig.webp');

const targetPng = path.join(rootDir, 'images/logo.png');
const targetWebp = path.join(rootDir, 'images/logo.webp');

if (fs.existsSync(origPng)) {
  fs.copyFileSync(origPng, targetPng);
  console.log('Restored images/logo.png from images/logo_orig.png');
}

if (fs.existsSync(origWebp)) {
  fs.copyFileSync(origWebp, targetWebp);
  console.log('Restored images/logo.webp from images/logo_orig.webp');
}

// Upload restored logos to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading restored original logos to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(targetPng, '/var/www/yug-pravo/images/logo.png', () => {
      sftp.fastPut(targetWebp, '/var/www/yug-pravo/images/logo.webp', () => {
        conn.exec('systemctl reload nginx', () => {
          console.log('ORIGINAL_LOGO_RESTORED_SUCCESSFULLY');
          conn.end();
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
