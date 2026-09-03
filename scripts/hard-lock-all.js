const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

function lockAllHtmlFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file === 'knowledge' || file === 'components') {
        lockAllHtmlFiles(fullPath);
      }
    } else if (file.endsWith('.html')) {
      let html = fs.readFileSync(fullPath, 'utf8');

      // 1. Remove all onclick="openModal('modal-donate')" and modal-consultation
      html = html.replace(/onclick=["']openModal\(['"]modal-donate['"]\)[;"']?/g, 'disabled style="pointer-events:none;opacity:0.6;cursor:not-allowed;"');
      html = html.replace(/onclick=["']openModal\(['"]modal-consultation['"]\)[;"']?/g, 'disabled style="pointer-events:none;opacity:0.6;cursor:not-allowed;"');
      html = html.replace(/onclick=["']openModal\(['"]modal-contact['"]\)[;"']?/g, 'disabled style="pointer-events:none;opacity:0.6;cursor:not-allowed;"');
      html = html.replace(/onclick=["']openModal\(['"]modal-constructor['"]\)[;"']?/g, 'disabled style="pointer-events:none;opacity:0.6;cursor:not-allowed;"');
      html = html.replace(/onclick=["']openModal\(['"]modal-youth-legal['"]\)[;"']?/g, 'disabled style="pointer-events:none;opacity:0.6;cursor:not-allowed;"');

      // 2. Change all form tags to onsubmit="return false;"
      html = html.replace(/<form\b([^>]*)>/gi, (match) => {
        let clean = match.replace(/onsubmit=["'][^"']*["']/gi, '');
        return clean.slice(0, -1) + ' onsubmit="return false;">';
      });

      // 3. Make all submit buttons disabled with pointer-events:none
      html = html.replace(/<button([^>]*type=["']submit["'][^>]*)>/gi, (match) => {
        if (!match.includes('disabled')) {
          return match.replace('<button', '<button disabled style="pointer-events:none !important;opacity:0.65 !important;cursor:not-allowed !important;"');
        }
        return match;
      });

      fs.writeFileSync(fullPath, html, 'utf8');
      console.log('Completely neutralized buttons in:', file);
    }
  }
}

lockAllHtmlFiles(rootDir);

// In index.html specifically, disable the contact form inputs
let indexPath = path.join(rootDir, 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');
indexContent = indexContent.replace(/<input\b([^>]*id=["']c-name["'][^>]*)>/i, '<input disabled style="background:#EBEAE5;cursor:not-allowed;opacity:0.75;" $1>');
indexContent = indexContent.replace(/<input\b([^>]*id=["']c-phone["'][^>]*)>/i, '<input disabled style="background:#EBEAE5;cursor:not-allowed;opacity:0.75;" $1>');
indexContent = indexContent.replace(/<textarea\b([^>]*id=["']c-msg["'][^>]*)>/i, '<textarea disabled style="background:#EBEAE5;cursor:not-allowed;opacity:0.75;" $1>');
fs.writeFileSync(indexPath, indexContent, 'utf8');

// Now upload everything directly to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading hardened files...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));
    let count = 0;

    // Upload js/standby-lock.js
    sftp.fastPut(path.join(rootDir, 'js/standby-lock.js'), '/var/www/yug-pravo/js/standby-lock.js', () => {
      for (const hf of htmlFiles) {
        sftp.fastPut(path.join(rootDir, hf), `/var/www/yug-pravo/${hf}`, () => {
          count++;
          if (count === htmlFiles.length) {
            // Upload knowledge files
            const kDir = path.join(rootDir, 'knowledge');
            const kFiles = fs.readdirSync(kDir).filter(f => f.endsWith('.html'));
            let kCount = 0;
            for (const kf of kFiles) {
              sftp.fastPut(path.join(kDir, kf), `/var/www/yug-pravo/knowledge/${kf}`, () => {
                kCount++;
                if (kCount === kFiles.length) {
                  conn.exec('systemctl reload nginx && pm2 reload all', () => {
                    console.log('ABSOLUTE_LOCKDOWN_DEPLOYED_EVERYWHERE');
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
}).connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
