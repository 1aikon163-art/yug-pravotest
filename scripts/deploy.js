const fs = require('fs');
const path = require('path');
const https = require('https');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Clean index.html
let indexPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Replace any remaining occurrence of 45 / инструкций in buttons
indexHtml = indexHtml.replace(/Все\s*(?:45|15)\s*инструкци[йя]/gi, 'Все 15 правовых алгоритмов');
indexHtml = indexHtml.replace(/45\s*инструкци[йя]/gi, '15 правовых алгоритмов');
fs.writeFileSync(indexPath, indexHtml, 'utf8');

// 2. Add client-side DOM fix in js/shared.js & js/effects.js just in case
let sharedPath = path.join(rootDir, 'js/shared.js');
let sharedJs = fs.readFileSync(sharedPath, 'utf8');
if (!sharedJs.includes('kb-all-btn-fix')) {
  sharedJs += `
// kb-all-btn-fix
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('kb-all-btn');
  if (btn) {
    btn.innerHTML = 'Все 15 правовых алгоритмов <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>';
  }
});
`;
  fs.writeFileSync(sharedPath, sharedJs, 'utf8');
}

// 3. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH ready. Uploading synced index.html and shared.js...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(indexPath, '/var/www/yug-pravo/index.html', () => {
      sftp.fastPut(sharedPath, '/var/www/yug-pravo/js/shared.js', () => {
        conn.exec('systemctl reload nginx', () => {
          console.log('DEPLOY_COMPLETE. Testing live website...');
          https.get('https://yugpravo.ru', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              const match = data.match(/<a[^>]*id=["']kb-all-btn["'][^>]*>([\s\S]*?)<\/a>/i);
              console.log('LIVE BUTTON HTML ON SERVER:');
              console.log(match ? match[0].replace(/\s+/g, ' ') : 'NOT FOUND');
              conn.end();
            });
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
