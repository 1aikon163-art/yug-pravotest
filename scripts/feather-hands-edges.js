const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Update css/styles.css with soft feathering / gradient masking on top and bottom for hands-video
const stylesPath = path.join(rootDir, 'css/styles.css');
let stylesCss = fs.readFileSync(stylesPath, 'utf8');

stylesCss = stylesCss.replace(/\/\* === HANDS VIDEO SUBTLE MOBILE FRAMING ===[\s\S]*?\}\s*\}\s*/gi, '');

const featheredHandsRule = `
/* === HANDS VIDEO SUBTLE MOBILE FRAMING & EDGE RETOUCHING === */
@media (max-width: 768px) {
  #hands-video {
    transform: scale(0.85) !important;
    transform-origin: center right !important;
    -webkit-mask-image: radial-gradient(ellipse 95% 68% at 50% 50%, black 30%, transparent 80%) !important;
    mask-image: radial-gradient(ellipse 95% 68% at 50% 50%, black 30%, transparent 80%) !important;
  }
}
`;

stylesCss += featheredHandsRule;
fs.writeFileSync(stylesPath, stylesCss, 'utf8');
console.log('css/styles.css updated with soft top/bottom edge feathering mask for hands-video');

// 2. Bump cache version on index.html
const indexPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');
const newVersion = '20260829_v14';
indexHtml = indexHtml.replace(/styles\.css\?v=[^"']*/gi, `styles.css?v=${newVersion}`);
indexHtml = indexHtml.replace(/main\.js\?v=[^"']*/gi, `main.js?v=${newVersion}`);
fs.writeFileSync(indexPath, indexHtml, 'utf8');

// 3. Upload styles.css and index.html to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading edge retouching to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(stylesPath, '/var/www/yug-pravo/css/styles.css', () => {
      sftp.fastPut(indexPath, '/var/www/yug-pravo/index.html', () => {
        conn.exec('systemctl reload nginx', () => {
          console.log('EDGE_FEATHERING_DEPLOYED_SUCCESSFULLY');
          conn.end();
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
