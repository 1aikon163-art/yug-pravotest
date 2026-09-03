/**
 * Финальный патч: исправляет шапочные кнопки "Поддержать проект"
 * и заливает на VPS только изменённые файлы.
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const REMOTE = '/var/www/yug-pravo';

const PAGES = [
  'about.html', 'cases.html', 'calculator.html', 'contacts.html',
  'disclosure.html', 'doc-viewer.html', 'events.html', 'initiatives.html',
  'knowledge.html', 'privacy.html', 'services.html', 'ustav.html'
];

const TO_DEPLOY = ['js/effects.js', 'js/forms.js', 'index.html'];

// Патчим шапочные кнопки в остальных страницах
for (const page of PAGES) {
  const fp = path.join(ROOT, page);
  if (!fs.existsSync(fp)) continue;

  let html = fs.readFileSync(fp, 'utf8');
  const orig = html;

  // Убираем disabled + blocking style, добавляем onclick
  html = html.split('\n').map(line => {
    if (!line.includes('Поддержать') && !line.includes('disabled') && !line.includes('pointer-events:none')) return line;
    // Строка с кнопкой Поддержать и блокировкой
    if ((line.includes('Поддержать') || (line.includes('disabled') && line.includes('pointer-events'))) && line.includes('<button')) {
      return line
        .replace(/\s+disabled\b/g, '')
        .replace(/\s+style="pointer-events:none[^"]*"/g, '')
        .replace(/(<button\b(?:[^>(?!onclick)])*?)>/, (m, pre) => {
          if (pre.includes('onclick')) return m;
          return pre + " onclick=\"openModal('modal-donate')\">";
        });
    }
    return line;
  }).join('\n');

  if (html !== orig) {
    fs.writeFileSync(fp, html, 'utf8');
    TO_DEPLOY.push(page);
    console.log('Fixed:', page);
  }
}

console.log('\nDeploying', TO_DEPLOY.length, 'files to VPS...\n');

const conn = new Client();
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) { console.error('SFTP error:', err.message); conn.end(); return; }

    let i = 0;
    function uploadNext() {
      if (i >= TO_DEPLOY.length) {
        conn.exec('cd ' + REMOTE + ' && pm2 reload yug-pravo-web --update-env 2>&1 | tail -2', (e, stream) => {
          let out = '';
          stream.on('data', d => out += d);
          stream.stderr.on('data', d => out += d);
          stream.on('close', () => {
            console.log('\nPM2:', out.trim());
            console.log('\n✅ Deploy complete!');
            conn.end();
          });
        });
        return;
      }
      const local = TO_DEPLOY[i++];
      const lp = path.join(ROOT, local);
      const rp = REMOTE + '/' + local;
      if (!fs.existsSync(lp)) { uploadNext(); return; }
      sftp.fastPut(lp, rp, (e) => {
        if (e) console.error('  ❌', local, '-', e.message);
        else console.log('  ✅', local);
        uploadNext();
      });
    }
    uploadNext();
  });
}).on('error', e => console.error('SSH error:', e.message));

conn.connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: '4EuSRg&!W525'
});
