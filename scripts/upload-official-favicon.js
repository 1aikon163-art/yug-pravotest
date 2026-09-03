const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';
const svgContent = fs.readFileSync(path.join(rootDir, 'favicon.svg'), 'utf8');

fs.writeFileSync(path.join(rootDir, 'images/favicon.svg'), svgContent, 'utf8');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading exact official favicon...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(path.join(rootDir, 'favicon.svg'), '/var/www/yug-pravo/favicon.svg', () => {
      sftp.fastPut(path.join(rootDir, 'images/favicon.svg'), '/var/www/yug-pravo/images/favicon.svg', () => {
        conn.exec('systemctl reload nginx', () => {
          console.log('OFFICIAL_FAVICON_DEPLOYED');
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
