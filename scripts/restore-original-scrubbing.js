const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Get exact js/main.js from git commit 9bfdd9b
let originalMainJs = execSync('git show 9bfdd9b:js/main.js', { encoding: 'utf8' });

// In original main.js, ensure:
// - All scroll scrubbing (lambda = 7.5, speedMultiplier, smoothedTime) is 100% active and pristine
// - Disable the old SW registration and fix kb-all-btn to not overwrite with 45
originalMainJs = originalMainJs.replace(
  /if \('serviceWorker' in navigator[\s\S]*?\}\s*\}\s*$/i,
  `// Clean exit`
);

// Fix dynamic counter to not say 45
originalMainJs = originalMainJs.replace(
  /const word = pluralize\(count, \['инструкция', 'инструкции', 'инструкций'\]\);[\s\S]*?kbAllBtn\.innerHTML = `Все \$\{count\} \$\{word\} <span class="material-symbols-outlined ml-1\.5 text-sm">arrow_forward<\/span>`;/i,
  `const kbAllBtn = document.getElementById('kb-all-btn');
    if (kbAllBtn) {
      kbAllBtn.innerHTML = 'Все 15 правовых алгоритмов <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>';
    }`
);

fs.writeFileSync(path.join(rootDir, 'js/main.js'), originalMainJs, 'utf8');
console.log('Restored 100% exact original js/main.js with scroll-scrubbing & mobile loops!');

// 2. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading exact original js/main.js to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(path.join(rootDir, 'js/main.js'), '/var/www/yug-pravo/js/main.js', () => {
      conn.exec('systemctl reload nginx', () => {
        console.log('EXACT_ORIGINAL_SCROLL_SCRUBBING_RESTORED_ON_VPS');
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
