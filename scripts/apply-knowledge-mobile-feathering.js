const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Update css/styles.css to include #knowledge-hero-video in subtle mobile framing & edge retouching
const stylesPath = path.join(rootDir, 'css/styles.css');
let stylesCss = fs.readFileSync(stylesPath, 'utf8');

stylesCss = stylesCss.replace(/\/\* === HANDS VIDEO SUBTLE MOBILE FRAMING & EDGE RETOUCHING ===[\s\S]*?\}\s*\}\s*/gi, '');

const featheredRule = `
/* === HERO VIDEO SUBTLE MOBILE FRAMING & EDGE RETOUCHING (Hands & Knowledge) === */
@media (max-width: 768px) {
  #hands-video,
  #knowledge-hero-video {
    transform: scale(0.85) !important;
    transform-origin: center right !important;
    -webkit-mask-image: radial-gradient(ellipse 95% 68% at 50% 50%, black 30%, transparent 80%) !important;
    mask-image: radial-gradient(ellipse 95% 68% at 50% 50%, black 30%, transparent 80%) !important;
  }
}
`;

stylesCss += featheredRule;
fs.writeFileSync(stylesPath, stylesCss, 'utf8');
console.log('css/styles.css updated with mobile feathering for knowledge-hero-video');

// 2. Bump cache version on knowledge.html
const knowledgePath = path.join(rootDir, 'knowledge.html');
let knowledgeHtml = fs.readFileSync(knowledgePath, 'utf8');
const newVersion = '20260829_v15';
knowledgeHtml = knowledgeHtml.replace(/styles\.css\?v=[^"']*/gi, `styles.css?v=${newVersion}`);
knowledgeHtml = knowledgeHtml.replace(/main\.js\?v=[^"']*/gi, `main.js?v=${newVersion}`);
fs.writeFileSync(knowledgePath, knowledgeHtml, 'utf8');

// 3. Upload styles.css and knowledge.html to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading knowledge base mobile framing to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(stylesPath, '/var/www/yug-pravo/css/styles.css', () => {
      sftp.fastPut(knowledgePath, '/var/www/yug-pravo/knowledge.html', () => {
        conn.exec('systemctl reload nginx', () => {
          console.log('KNOWLEDGE_MOBILE_FRAMING_DEPLOYED_SUCCESSFULLY');
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
