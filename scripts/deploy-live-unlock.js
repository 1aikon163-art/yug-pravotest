const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REMOTE_ROOT = '/var/www/yug-pravo';
const NEW_VER = 'v=20260901_live7';

const SSH_CONFIG = {
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
};

const MAIN_PAGES = [
  'index.html','about.html','cases.html','calculator.html',
  'contacts.html','disclosure.html','doc-viewer.html','events.html',
  'initiatives.html','knowledge.html','privacy.html','services.html','ustav.html','payment-success.html'
];
const kDir = path.join(ROOT, 'knowledge');
const kPages = fs.existsSync(kDir)
  ? fs.readdirSync(kDir).filter(f => f.endsWith('.html')).map(f => 'knowledge/' + f)
  : [];

const ALL_PAGES = [...MAIN_PAGES, ...kPages];

// 1. Cache-busting update in HTML
for (const file of ALL_PAGES) {
  const fp = path.join(ROOT, file);
  if (!fs.existsSync(fp)) continue;
  let html = fs.readFileSync(fp, 'utf8');
  let updated = html.replace(/(\.css|\.js)\?v=[a-zA-Z0-9_]+/g, `$1?${NEW_VER}`);
  
  // ensure styles.css and shared.css have version query
  updated = updated.replace(/href=["']css\/styles\.css(\?[^"']*)?["']/g, `href="css/styles.css?${NEW_VER}"`);
  updated = updated.replace(/href=["']css\/shared\.css(\?[^"']*)?["']/g, `href="css/shared.css?${NEW_VER}"`);
  
  if (updated !== html) {
    fs.writeFileSync(fp, updated, 'utf8');
    console.log('✅ Bumped cache-version:', file);
  }
}

// 2. Files to deploy
const FILES_TO_DEPLOY = [
  // CSS
  ['css/styles.css',       'css/styles.css'],
  ['css/shared.css',       'css/shared.css'],
  // JS
  ['js/payment.js',        'js/payment.js'],
  ['js/invoice-generator.js','js/invoice-generator.js'],
  ['js/standby-lock.js',   'js/standby-lock.js'],
  ['js/shared.js',         'js/shared.js'],
  ['js/forms.js',          'js/forms.js'],
  ['js/main.js',           'js/main.js'],
  ['js/effects.js',        'js/effects.js'],
  ['js/telegram-bridge.js','js/telegram-bridge.js'],
  // Docs
  ['docs/donation-offer.txt', 'docs/donation-offer.txt'],
  ['docs/dogovor-pozhertvovaniya-yurlicam.md', 'docs/dogovor-pozhertvovaniya-yurlicam.md'],
  // Server
  ['server.js',            'server.js'],
  ['ecosystem.config.js',  'ecosystem.config.js'],
  // Pages
  ...ALL_PAGES.map(p => [p, p])
];

function uploadFile(sftp, localPath, remotePath) {
  return new Promise((resolve) => {
    const fullLocal = path.join(ROOT, localPath);
    const fullRemote = `${REMOTE_ROOT}/${remotePath}`;
    if (!fs.existsSync(fullLocal)) {
      console.log(`  ⏭️  Skip: ${localPath}`);
      return resolve();
    }
    sftp.fastPut(fullLocal, fullRemote, (err) => {
      if (err) console.error(`  ❌ ${localPath} → ${err.message}`);
      else console.log(`  ✅ ${localPath}`);
      resolve();
    });
  });
}

function execCommand(conn, cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let out = '', errOut = '';
      stream.on('data', d => out += d);
      stream.stderr.on('data', d => errOut += d);
      stream.on('close', () => resolve(out + errOut));
    });
  });
}

const conn = new Client();
conn.on('ready', async () => {
  console.log('🚀 SSH подключение установлено. Разворачиваем разблокированный сайт...');
  try {
    await new Promise((resolve, reject) => {
      conn.sftp(async (err, sftp) => {
        if (err) return reject(err);
        for (const [loc, rem] of FILES_TO_DEPLOY) {
          await uploadFile(sftp, loc, rem);
        }
        resolve();
      });
    });

    console.log('\n🔄 Перезагружаем Nginx и PM2...');
    await execCommand(conn, `systemctl reload nginx`);
    await execCommand(conn, `cd ${REMOTE_ROOT} && pm2 reload yug-pravo-web --update-env 2>&1`);

    console.log('\n🎉 Деплой полностью завершен! Кнопки активны и кэш сброшен.');
  } catch (e) {
    console.error('Ошибка:', e.message);
  } finally {
    conn.end();
  }
}).on('error', e => console.error('SSH Error:', e.message));

console.log('🔐 Подключаемся к VPS...');
conn.connect(SSH_CONFIG);
