const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Syncing entire project to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    function uploadDirectory(localDir, remoteDir, callback) {
      const items = fs.readdirSync(localDir);
      let pending = items.length;
      if (pending === 0) return callback();

      items.forEach(item => {
        const localPath = path.join(localDir, item);
        const remotePath = `${remoteDir}/${item}`;
        const stat = fs.statSync(localPath);

        if (stat.isDirectory()) {
          if (item === 'node_modules' || item === '.git' || item === '.agents' || item === 'docs' || item === 'scripts' || item === 'plugins') {
            pending--;
            if (pending === 0) callback();
            return;
          }
          sftp.mkdir(remotePath, () => {
            uploadDirectory(localPath, remotePath, () => {
              pending--;
              if (pending === 0) callback();
            });
          });
        } else {
          sftp.fastPut(localPath, remotePath, (err) => {
            pending--;
            if (pending === 0) callback();
          });
        }
      });
    }

    uploadDirectory(rootDir, '/var/www/yug-pravo', () => {
      conn.exec('systemctl reload nginx', () => {
        console.log('FULL_PERFECT_PROJECT_SYNC_COMPLETE');
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
