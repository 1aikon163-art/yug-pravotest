const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Add Interaction Shield layer to all 7 hero sections
const allHeroPages = [
  'index.html',
  'about.html',
  'calculator.html',
  'events.html',
  'initiatives.html',
  'knowledge.html',
  'disclosure.html'
];

allHeroPages.forEach(file => {
  const p = path.join(rootDir, file);
  if (!fs.existsSync(p)) return;

  let html = fs.readFileSync(p, 'utf8');

  // Insert Interaction Shield over video if not present
  if (!html.includes('hero-interaction-shield')) {
    html = html.replace(
      /(<video[\s\S]*?<\/video>)/i,
      `$1\n                <!-- Interaction Shield Overlay (blocks browser hover extensions) -->\n                <div class="hero-interaction-shield absolute inset-0 z-[5] pointer-events-auto bg-transparent" aria-hidden="true"></div>`
    );
    fs.writeFileSync(p, html, 'utf8');
    console.log(`Added Interaction Shield to ${file}`);
  }
});

// 2. Configure index.html with data-scrub-direction="reverse" for hands.mp4
let indexPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');
indexHtml = indexHtml.replace(/id=["']hands-video["'][^>]*data-video-mode=["'][^"']*["']/i, 'id="hands-video" src="hands.mp4" data-video-mode="scrub" data-scrub-direction="reverse"');
fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('index.html configured with reverse scrub (Starts open -> Closes on scroll)');

// 3. Update js/main.js to handle initial open hands and reverse scroll smoothly
let mainJsPath = path.join(rootDir, 'js/main.js');
let mainJs = fs.readFileSync(mainJsPath, 'utf8');

// Update scroll-scrub calculations in main.js
mainJs = mainJs.replace(
  /const onScroll = \(\) => \{[\s\S]*?targetTime = progress \* maxDuration;\s*\}/,
  `const isReverse = activeVideo.dataset.scrubDirection === 'reverse';

        const onScroll = () => {
          const rect = heroSection.getBoundingClientRect();
          const maxScroll = rect.height - window.innerHeight;
          const currentScroll = -rect.top;

          if (maxScroll > 0) {
            const rawProgress = (currentScroll / maxScroll) * speedMultiplier;
            const progress = Math.min(Math.max(rawProgress, 0), 1);
            targetTime = isReverse ? (1 - progress) * maxDuration : progress * maxDuration;
          } else {
            targetTime = isReverse ? maxDuration : 0;
          }
        };`
);

// Ensure initial frame sets smoothedTime and currentTime to open hands if reverse
mainJs = mainJs.replace(
  /let targetTime = 0;\s*let smoothedTime = 0;/,
  `const isReverse = activeVideo.dataset.scrubDirection === 'reverse';
        let targetTime = isReverse ? maxDuration : 0;
        let smoothedTime = targetTime;
        if (isReverse && activeVideo.readyState >= 1) {
          activeVideo.currentTime = maxDuration;
        }`
);

fs.writeFileSync(mainJsPath, mainJs, 'utf8');
console.log('js/main.js updated with initial open hands and reverse closing on scroll!');

// 4. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading Shield and Reverse Hands Scrub...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(mainJsPath, '/var/www/yug-pravo/js/main.js', () => {
      let count = 0;
      allHeroPages.forEach(file => {
        sftp.fastPut(path.join(rootDir, file), `/var/www/yug-pravo/${file}`, () => {
          count++;
          if (count === allHeroPages.length) {
            conn.exec('systemctl reload nginx', () => {
              console.log('SHIELD_AND_OPEN_HANDS_DEPLOYED_SUCCESSFULLY');
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
