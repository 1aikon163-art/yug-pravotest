const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Add explicit Mobile Zoom-Out CSS rules to css/styles.css
const stylesPath = path.join(rootDir, 'css/styles.css');
let stylesCss = fs.readFileSync(stylesPath, 'utf8');

const mobileZoomOutCss = `
/* ==========================================================================
   MOBILE HERO VIDEO ADAPTIVE WIDE-ANGLE FRAMING
   ========================================================================== */
@media (max-width: 768px) {
  #hands-video,
  #about-hero-video,
  #calc-hero-video,
  #events-hero-video,
  #initiatives-hero-video,
  #knowledge-hero-video,
  #disclosure-hero-video {
    object-fit: contain !important;
    object-position: center center !important;
    transform: scale(0.68) !important;
    transform-origin: center center !important;
    opacity: 0.40 !important;
    width: 100% !important;
    height: 100% !important;
  }
}
`;

if (!stylesCss.includes('MOBILE HERO VIDEO ADAPTIVE WIDE-ANGLE FRAMING')) {
  stylesCss += mobileZoomOutCss;
  fs.writeFileSync(stylesPath, stylesCss, 'utf8');
  console.log('Added explicit mobile scale 0.68 CSS to styles.css');
}

// 2. Bump cache-busting version parameter across all 7 HTML files
const allPages = [
  'index.html',
  'about.html',
  'calculator.html',
  'events.html',
  'initiatives.html',
  'knowledge.html',
  'disclosure.html'
];

const newVersion = '20260829_wide_v11';

allPages.forEach(file => {
  const p = path.join(rootDir, file);
  if (!fs.existsSync(p)) return;

  let html = fs.readFileSync(p, 'utf8');
  html = html.replace(/styles\.css\?v=[^"']*/gi, `styles.css?v=${newVersion}`);
  html = html.replace(/main\.js\?v=[^"']*/gi, `main.js?v=${newVersion}`);
  fs.writeFileSync(p, html, 'utf8');
  console.log(`Cache-busted ${file} with ?v=${newVersion}`);
});

// 3. Upload styles.css and all HTML files to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading mobile zoom-out CSS & cache-busted HTML files to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(stylesPath, '/var/www/yug-pravo/css/styles.css', () => {
      let count = 0;
      allPages.forEach(file => {
        sftp.fastPut(path.join(rootDir, file), `/var/www/yug-pravo/${file}`, () => {
          count++;
          if (count === allPages.length) {
            conn.exec('systemctl reload nginx', () => {
              console.log('EXPLICIT_MOBILE_ZOOMOUT_DEPLOYED_SUCCESSFULLY');
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
