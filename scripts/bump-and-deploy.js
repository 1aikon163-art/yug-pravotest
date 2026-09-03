/**
 * Bump version params for cached JS files in ALL html pages.
 * Forces browser cache invalidation.
 * Then deploy to VPS.
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const REMOTE = '/var/www/yug-pravo';
const NEW_VER = 'v=20260831_v20';  // новая версия — сбрасывает кэш браузера

const MAIN_PAGES = [
  'index.html','about.html','cases.html','calculator.html',
  'contacts.html','disclosure.html','doc-viewer.html','events.html',
  'initiatives.html','knowledge.html','privacy.html','services.html','ustav.html'
];
const kDir = path.join(ROOT, 'knowledge');
const kPages = fs.existsSync(kDir)
  ? fs.readdirSync(kDir).filter(f => f.endsWith('.html')).map(f => 'knowledge/' + f)
  : [];

const ALL = [...MAIN_PAGES, ...kPages];
const TO_DEPLOY = ['js/effects.js', 'js/forms.js', 'js/shared.js', 'js/standby-lock.js', 'js/payment.js'];
let pagesUpdated = 0;

// Обновляем версии во всех страницах
for (const file of ALL) {
  const fp = path.join(ROOT, file);
  if (!fs.existsSync(fp)) continue;
  let html = fs.readFileSync(fp, 'utf8');
  const orig = html;

  // Обновляем cache-buster для всех JS файлов
  html = html.replace(/\?v=202608\d+_v\d+/g, '?' + NEW_VER);

  // ГЛАВНОЕ: убираем кнопку в шапке disabled/pointer-events
  html = html.replace(
    /disabled style="pointer-events:none;opacity:0\.6;cursor:not-allowed;"(>)/g,
    (m, end) => end
  );

  if (html !== orig) {
    fs.writeFileSync(fp, html, 'utf8');
    TO_DEPLOY.push(file);
    console.log('✅ Bumped + fixed:', file);
    pagesUpdated++;
  }
}

console.log('\nPages updated:', pagesUpdated);
console.log('Total files to deploy:', TO_DEPLOY.length);

// Deploy
const conn = new Client();
conn.on('ready', () => {
  console.log('\n🚀 SSH ready. Deploying...\n');
  conn.sftp((err, sftp) => {
    if (err) { console.error('SFTP error:', err.message); conn.end(); return; }

    let i = 0;
    function next() {
      if (i >= TO_DEPLOY.length) {
        // PM2 reload
        conn.exec('cd ' + REMOTE + ' && pm2 reload yug-pravo-web --update-env', (e, stream) => {
          let out = '';
          stream.on('data', d => out += d);
          stream.stderr.on('data', d => out += d);
          stream.on('close', () => {
            console.log('\nPM2:', out.trim().split('\n').slice(-1)[0]);
            console.log('\n🎉 Deploy complete!');
            conn.end();
          });
        });
        return;
      }
      const local = TO_DEPLOY[i++];
      const lp = path.join(ROOT, local);
      const rp = REMOTE + '/' + local;
      if (!fs.existsSync(lp)) { next(); return; }
      sftp.fastPut(lp, rp, (e) => {
        if (e) console.error('  ❌', local, '-', e.message);
        else console.log('  ✅', local);
        next();
      });
    }
    next();
  });
}).on('error', e => console.error('SSH error:', e.message));

conn.connect({ host: '82.202.129.126', port: 22, username: 'root', password: '4EuSRg&!W525' });
