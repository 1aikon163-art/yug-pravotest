const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('SSH connected. Diagnosing backend & nginx...');
  
  const cmd = [
    'echo "=== PM2 STATUS ==="',
    'pm2 list',
    'echo "=== PM2 LOGS ==="',
    'pm2 logs yug-pravo-web --lines 30 --nostream',
    'echo "=== NGINX SITES ==="',
    'cat /etc/nginx/sites-enabled/*',
    'echo "=== LISTENING PORTS ==="',
    'ss -tulpn | grep -E "8080|3000|80|443|node"'
  ].join(' && ');

  conn.exec(cmd, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
}).on('error', e => console.error('SSH Error:', e.message));

conn.connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
