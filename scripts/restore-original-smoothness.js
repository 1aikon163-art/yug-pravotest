const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Get exact js/main.js from commit 9bfdd9b
let mainJs = execSync('git show 9bfdd9b:js/main.js', { encoding: 'utf8' });

// Ensure serviceWorker and 45 counters don't interfere
mainJs = mainJs.replace(/if \('serviceWorker' in navigator[\s\S]*?\}\s*\}\s*$/i, '// SW disabled');
mainJs = mainJs.replace(/Все \$\{count\} \$\{word\}/g, 'Все 15 правовых алгоритмов');

fs.writeFileSync(path.join(rootDir, 'js/main.js'), mainJs, 'utf8');

// 2. Restore exact original hero heights and speed multipliers in HTML files
const pagesToRestore = [
  { file: 'index.html', height: 'md:h-[190vh]', mult: '1.0' },
  { file: 'events.html', height: 'md:h-[190vh]', mult: '1.0' },
  { file: 'initiatives.html', height: 'md:h-[220vh]', mult: '1.0' },
  { file: 'knowledge.html', height: 'md:h-[190vh]', mult: '1.0' },
  { file: 'disclosure.html', height: 'md:h-[190vh]', mult: '1.0' }
];

pagesToRestore.forEach(({ file, height, mult }) => {
  const p = path.join(rootDir, file);
  if (!fs.existsSync(p)) return;

  let html = fs.readFileSync(p, 'utf8');
  html = html.replace(/md:h-\[(?:125|130|135|190|220)vh\]/gi, height);
  html = html.replace(/data-speed-multiplier=["'][^"']*["']/gi, `data-speed-multiplier="${mult}"`);
  fs.writeFileSync(p, html, 'utf8');
  console.log(`Restored exact original physics track for ${file} (${height})`);
});

// 3. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading exact original smooth physics to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(path.join(rootDir, 'js/main.js'), '/var/www/yug-pravo/js/main.js', () => {
      let count = 0;
      pagesToRestore.forEach(({ file }) => {
        sftp.fastPut(path.join(rootDir, file), `/var/www/yug-pravo/${file}`, () => {
          count++;
          if (count === pagesToRestore.length) {
            conn.exec('systemctl reload nginx', () => {
              console.log('EXACT_ORIGINAL_BUTTER_SMOOTH_PHYSICS_RESTORED');
              conn.end();
            });
          }
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
