const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Clean up css/styles.css (remove mobile scale rules)
const stylesPath = path.join(rootDir, 'css/styles.css');
let stylesCss = fs.readFileSync(stylesPath, 'utf8');

stylesCss = stylesCss.replace(
  /\/\* ==========================================================================\s+MOBILE HERO VIDEO ADAPTIVE WIDE-ANGLE FRAMING[\s\S]*?@media \(max-width: 768px\) \{[\s\S]*?\}\s*\}\s*/gi,
  ''
);
fs.writeFileSync(stylesPath, stylesCss, 'utf8');
console.log('Cleaned css/styles.css: removed mobile scale override');

// 2. Restore original clean full-bleed object-cover classes across all 7 HTML files
const allPages = [
  'index.html',
  'about.html',
  'calculator.html',
  'events.html',
  'initiatives.html',
  'knowledge.html',
  'disclosure.html'
];

const originalCleanClasses = `class="absolute inset-0 md:right-0 md:top-0 h-full w-full object-cover object-right opacity-35 md:opacity-45 mix-blend-multiply pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_85%)] md:[mask-image:radial-gradient(ellipse_at_70%_50%,black_30%,transparent_80%)] md:[-webkit-mask-image:radial-gradient(ellipse_at_70%_50%,black_30%,transparent_80%)]"`;

const newVersion = '20260829_v12';

allPages.forEach(file => {
  const p = path.join(rootDir, file);
  if (!fs.existsSync(p)) return;

  let html = fs.readFileSync(p, 'utf8');

  // Replace video classes back to original
  html = html.replace(
    /(<(?:video|canvas)\s+id=["'][^"']*hero-video["'][^>]*?)class=["'][^"']*["']/i,
    `$1${originalCleanClasses}`
  );
  html = html.replace(
    /(<(?:video|canvas)\s+id=["']hands-video["'][^>]*?)class=["'][^"']*["']/i,
    `$1${originalCleanClasses}`
  );

  // Bump version parameter
  html = html.replace(/styles\.css\?v=[^"']*/gi, `styles.css?v=${newVersion}`);
  html = html.replace(/main\.js\?v=[^"']*/gi, `main.js?v=${newVersion}`);

  fs.writeFileSync(p, html, 'utf8');
  console.log(`Restored original framing and bumped version for ${file}`);
});

// 3. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading restored original framing to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(stylesPath, '/var/www/yug-pravo/css/styles.css', () => {
      let count = 0;
      allPages.forEach(file => {
        sftp.fastPut(path.join(rootDir, file), `/var/www/yug-pravo/${file}`, () => {
          count++;
          if (count === allPages.length) {
            conn.exec('systemctl reload nginx', () => {
              console.log('ORIGINAL_FRAMING_RESTORED_SUCCESSFULLY');
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
