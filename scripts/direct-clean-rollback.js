const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Restore exact working js/main.js directly from git commit 9bfdd9b
let mainJs = execSync('git show 9bfdd9b:js/main.js', { encoding: 'utf8' });
mainJs = mainJs.replace(/if \('serviceWorker' in navigator[\s\S]*?\}\s*\}\s*$/i, '// SW disabled');
mainJs = mainJs.replace(/Все \$\{count\} \$\{word\}/g, 'Все 15 правовых алгоритмов');
fs.writeFileSync(path.join(rootDir, 'js/main.js'), mainJs, 'utf8');

// 2. Clean all HTML files: remove shields and ensure original video tags
const pageConfigs = [
  { file: 'index.html', id: 'hands-video', src: 'hands.mp4' },
  { file: 'about.html', id: 'about-hero-video', src: '12.mp4' },
  { file: 'calculator.html', id: 'calc-hero-video', src: 'ves.mp4' },
  { file: 'events.html', id: 'events-hero-video', src: 'slow.mp4' },
  { file: 'initiatives.html', id: 'initiatives-hero-video', src: 'kling.mp4' },
  { file: 'knowledge.html', id: 'knowledge-hero-video', src: 'baza.mp4' },
  { file: 'disclosure.html', id: 'disclosure-hero-video', src: '13.mp4' }
];

pageConfigs.forEach(({ file, id, src }) => {
  const p = path.join(rootDir, file);
  if (!fs.existsSync(p)) return;

  let html = fs.readFileSync(p, 'utf8');

  // Remove any interaction shield
  html = html.replace(/<!-- Interaction Shield Overlay[\s\S]*?<div class="hero-interaction-shield[^>]*><\/div>/gi, '');
  html = html.replace(/<div class="hero-interaction-shield[^>]*><\/div>/gi, '');

  // Restore clean video tag
  const videoRegex = new RegExp(`<(video|canvas)\\s+id=["']${id}["'][\\s\\S]*?<\\/(video|canvas)>`, 'i');
  const cleanVideoTag = `<video id="${id}" 
                    src="${src}" 
                    muted 
                    playsinline 
                    webkit-playsinline 
                    preload="auto" 
                    class="absolute inset-0 md:right-0 md:top-0 h-full w-full object-cover object-right opacity-35 md:opacity-45 mix-blend-multiply pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_85%)] md:[mask-image:radial-gradient(ellipse_at_70%_50%,black_30%,transparent_80%)] md:[-webkit-mask-image:radial-gradient(ellipse_at_70%_50%,black_30%,transparent_80%)]"></video>`;

  html = html.replace(videoRegex, cleanVideoTag);
  fs.writeFileSync(p, html, 'utf8');
  console.log(`Cleaned and restored ${file}`);
});

// 3. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading 100% clean rollback to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(path.join(rootDir, 'js/main.js'), '/var/www/yug-pravo/js/main.js', () => {
      let count = 0;
      pageConfigs.forEach(({ file }) => {
        sftp.fastPut(path.join(rootDir, file), `/var/www/yug-pravo/${file}`, () => {
          count++;
          if (count === pageConfigs.length) {
            conn.exec('systemctl reload nginx', () => {
              console.log('100_PERCENT_CLEAN_ROLLBACK_COMPLETE');
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
