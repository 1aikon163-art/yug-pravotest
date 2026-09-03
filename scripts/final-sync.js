const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(path.join(rootDir, 'index.html'), '/var/www/yug-pravo/index.html', () => {
      sftp.fastPut(path.join(rootDir, 'js/main.js'), '/var/www/yug-pravo/js/main.js', () => {
        sftp.fastPut(path.join(rootDir, 'js/shared.js'), '/var/www/yug-pravo/js/shared.js', () => {
          conn.exec('systemctl reload nginx', () => {
            console.log('FINAL_SYNC_PERFECT_SUCCESS');
            conn.end();
          });
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
