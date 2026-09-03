const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Update sitemap.xml to yugpravo.ru
let sitemap = fs.readFileSync(path.join(rootDir, 'sitemap.xml'), 'utf8');
sitemap = sitemap.replace(/https:\/\/yug-pravo\.ru/g, 'https://yugpravo.ru');
sitemap = sitemap.replace(/https:\/\/xn----7sbf0aaj8ak7b\.xn--p1ai/g, 'https://yugpravo.ru');
fs.writeFileSync(path.join(rootDir, 'sitemap.xml'), sitemap, 'utf8');
console.log('sitemap.xml updated with https://yugpravo.ru');

// 2. Update robots.txt
let robots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /bots/

Sitemap: https://yugpravo.ru/sitemap.xml
Host: https://yugpravo.ru
`;
fs.writeFileSync(path.join(rootDir, 'robots.txt'), robots, 'utf8');
console.log('robots.txt updated');

// 3. Update Schema.org and Meta across all HTML files
function updateSeoAndSchema(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file === 'knowledge') {
        updateSeoAndSchema(fullPath);
      }
    } else if (file.endsWith('.html')) {
      let html = fs.readFileSync(fullPath, 'utf8');

      // Replace LegalService with NGO
      html = html.replace(/"@type":\s*"LegalService"/g, '"@type": "NGO"');
      html = html.replace(/"@type":\s*"Attorney"/g, '"@type": "NGO"');
      
      // Replace old domains in canonical / meta
      html = html.replace(/https:\/\/yug-pravo\.ru/g, 'https://yugpravo.ru');
      html = html.replace(/https:\/\/xn----7sbf0aaj8ak7b\.xn--p1ai/g, 'https://yugpravo.ru');

      fs.writeFileSync(fullPath, html, 'utf8');
      console.log('Schema & domain updated in:', file);
    }
  }
}

updateSeoAndSchema(rootDir);

// 4. Update scripts/seo-validator.js to accept NGO
let validator = fs.readFileSync(path.join(rootDir, 'scripts/seo-validator.js'), 'utf8');
validator = validator.replace(
  `content.includes('"@type": "LegalService"') || content.includes('"@type":"LegalService"') ? 'LegalService' :`,
  `content.includes('"@type": "NGO"') || content.includes('"@type":"NGO"') ? 'NGO (Non-Profit)' : content.includes('"@type": "LegalService"') ? 'LegalService' :`
);
fs.writeFileSync(path.join(rootDir, 'scripts/seo-validator.js'), validator, 'utf8');

// 5. Upload everything to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading SEO updates...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(path.join(rootDir, 'sitemap.xml'), '/var/www/yug-pravo/sitemap.xml', () => {
      sftp.fastPut(path.join(rootDir, 'robots.txt'), '/var/www/yug-pravo/robots.txt', () => {
        const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));
        let count = 0;
        for (const hf of htmlFiles) {
          sftp.fastPut(path.join(rootDir, hf), `/var/www/yug-pravo/${hf}`, () => {
            count++;
            if (count === htmlFiles.length) {
              const kDir = path.join(rootDir, 'knowledge');
              const kFiles = fs.readdirSync(kDir).filter(f => f.endsWith('.html'));
              let kCount = 0;
              for (const kf of kFiles) {
                sftp.fastPut(path.join(kDir, kf), `/var/www/yug-pravo/knowledge/${kf}`, () => {
                  kCount++;
                  if (kCount === kFiles.length) {
                    conn.exec('systemctl reload nginx', () => {
                      console.log('SEO_DEPLOYMENT_COMPLETE');
                      conn.end();
                    });
                  }
                });
              }
            }
          });
        }
      });
    });
  });
}).connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
