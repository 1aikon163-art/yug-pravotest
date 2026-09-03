const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/../knowledge';

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH ready, uploading knowledge directory...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const files = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));
    let count = 0;
    for (const f of files) {
      sftp.fastPut(path.join(rootDir, f), `/var/www/yug-pravo/knowledge/${f}`, () => {
        count++;
        if (count === files.length) {
          conn.exec('systemctl reload nginx', () => {
            console.log('KNOWLEDGE_DIR_SYNCED');
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
