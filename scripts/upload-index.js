const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    sftp.fastPut('index.html', '/var/www/yug-pravo/index.html', (err) => {
      if (err) throw err;
      console.log('index.html uploaded');
      conn.exec('tail -n 100 /var/www/yug-pravo/index.html | grep -E "(Онлайн|333.19|разработке)"', (err, stream) => {
        stream.on('close', () => {
          conn.exec('systemctl reload nginx', () => {
            console.log('Nginx reloaded');
            conn.end();
          });
        }).on('data', d => process.stdout.write(d));
      });
    });
  });
}).connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
