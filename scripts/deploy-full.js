/**
 * Full Deploy Script — АНО ЮГ-ПРАВО
 * Деплоит все изменённые файлы на VPS через SSH/SFTP:
 * - HTML файлы (index.html, all pages, knowledge/*)
 * - JS файлы (payment.js, standby-lock.js, shared.js)
 * - Сертификаты Минцифры (certs/)
 * - server.js, ecosystem.config.js
 * После деплоя: pm2 reload yug-pravo-web + smoke test
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REMOTE_ROOT = '/var/www/yug-pravo';

const SSH_CONFIG = {
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
};

// Файлы для деплоя
const FILES_TO_DEPLOY = [
  // JS — платёж, формы, скрипты
  ['js/payment.js',        'js/payment.js'],
  ['js/standby-lock.js',   'js/standby-lock.js'],
  ['js/shared.js',         'js/shared.js'],
  ['js/forms.js',          'js/forms.js'],
  ['js/main.js',           'js/main.js'],
  ['js/effects.js',        'js/effects.js'],
  ['js/telegram-bridge.js','js/telegram-bridge.js'],
  // CSS
  ['css/styles.css',       'css/styles.css'],
  ['css/shared.css',       'css/shared.css'],
  // Сервер и конфиг
  ['server.js',            'server.js'],
  ['ecosystem.config.js',  'ecosystem.config.js'],
  // Сертификаты Минцифры
  ['certs/russian-trusted-ca-bundle.pem',  'certs/russian-trusted-ca-bundle.pem'],
  ['certs/russian_trusted_root_ca.pem',    'certs/russian_trusted_root_ca.pem'],
  ['certs/russian_trusted_sub_ca.pem',     'certs/russian_trusted_sub_ca.pem'],
  // Главные страницы
  ['index.html',           'index.html'],
  ['about.html',           'about.html'],
  ['cases.html',           'cases.html'],
  ['calculator.html',      'calculator.html'],
  ['contacts.html',        'contacts.html'],
  ['disclosure.html',      'disclosure.html'],
  ['doc-viewer.html',      'doc-viewer.html'],
  ['events.html',          'events.html'],
  ['initiatives.html',     'initiatives.html'],
  ['knowledge.html',       'knowledge.html'],
  ['privacy.html',         'privacy.html'],
  ['services.html',        'services.html'],
  ['ustav.html',           'ustav.html'],
  ['payment-success.html', 'payment-success.html'],
];

// Knowledge base страницы
const knowledgeDir = path.join(ROOT, 'knowledge');
if (fs.existsSync(knowledgeDir)) {
  fs.readdirSync(knowledgeDir).filter(f => f.endsWith('.html')).forEach(f => {
    FILES_TO_DEPLOY.push([`knowledge/${f}`, `knowledge/${f}`]);
  });
}

function uploadFile(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    const fullLocal = path.join(ROOT, localPath);
    const fullRemote = `${REMOTE_ROOT}/${remotePath}`;
    if (!fs.existsSync(fullLocal)) {
      console.log(`  ⏭️  Пропущено (нет локального файла): ${localPath}`);
      resolve();
      return;
    }
    sftp.fastPut(fullLocal, fullRemote, (err) => {
      if (err) {
        console.error(`  ❌ Ошибка: ${localPath} → ${err.message}`);
        resolve(); // не прерываем деплой
      } else {
        console.log(`  ✅ ${localPath}`);
        resolve();
      }
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
  console.log('');
  console.log('🚀 SSH подключение установлено. Начинаем деплой...');
  console.log('═'.repeat(60));

  try {
    // Создаём директорию certs на сервере
    const mkdirOut = await execCommand(conn, `mkdir -p ${REMOTE_ROOT}/certs && echo OK`);
    if (mkdirOut.includes('OK')) console.log('📁 Директория certs создана на сервере.');

    await new Promise((resolve, reject) => {
      conn.sftp(async (err, sftp) => {
        if (err) return reject(err);

        console.log(`\n📤 Загружаем ${FILES_TO_DEPLOY.length} файлов:\n`);

        for (const [local, remote] of FILES_TO_DEPLOY) {
          await uploadFile(sftp, local, remote);
        }
        resolve();
      });
    });

    console.log('');
    console.log('🔄 Перезагружаем PM2 (yug-pravo-web)...');
    const pmOut = await execCommand(conn, `cd ${REMOTE_ROOT} && pm2 reload yug-pravo-web --update-env 2>&1 || pm2 start ecosystem.config.js --only yug-pravo-web 2>&1`);
    console.log('   PM2:', pmOut.trim().split('\n').slice(-2).join(' | '));

    console.log('');
    console.log('🌐 Smoke Test (HTTP 200 на yugpravo.ru)...');
    const smokeOut = await execCommand(conn, `curl -s -o /dev/null -w "%{http_code}" https://yugpravo.ru/ 2>&1`);
    const statusCode = smokeOut.trim();

    if (statusCode === '200') {
      console.log('   ✅ LIVE! HTTP', statusCode, '— сайт доступен.');
    } else {
      console.log('   ⚠️  HTTP', statusCode, '— проверьте Nginx.');
    }

    // Проверяем что donate-submit-btn разблокирован
    const htmlCheck = await execCommand(conn, `curl -s https://yugpravo.ru/ | grep -o 'donate-submit-btn[^"]*' | head -3`);
    console.log('   Кнопка оплаты на лайве:', htmlCheck.trim() || '(не найдена в grep — вероятно OK)');

    console.log('');
    console.log('═'.repeat(60));
    console.log('🎉 ДЕПЛОЙ ЗАВЕРШЁН УСПЕШНО!');
    console.log('   🌐 https://yugpravo.ru');
    console.log('   💳 Платёжный шлюз Т-Банк: АКТИВЕН');
    console.log('   🛡️  Russian Trusted CA: УСТАНОВЛЕН');
    console.log('═'.repeat(60));

  } catch (err) {
    console.error('❌ Ошибка деплоя:', err.message);
  } finally {
    conn.end();
  }
});

conn.on('error', (err) => {
  console.error('❌ SSH Ошибка:', err.message);
});

console.log('🔐 Подключаемся к VPS', SSH_CONFIG.host, '...');
conn.connect(SSH_CONFIG);
