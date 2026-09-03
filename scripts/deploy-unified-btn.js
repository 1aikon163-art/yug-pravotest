const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';
const indexPath = path.join(rootDir, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

console.log('Uploading index.html with 100% unified buttons...');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected.');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(indexPath, '/var/www/yug-pravo/index.html', (err) => {
      if (err) throw err;
      conn.exec('systemctl reload nginx', () => {
        console.log('CALCULATOR_BUTTON_UNIFIED_ON_LIVE_SERVER');
        conn.end();
      });
    });
  });
}).connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
