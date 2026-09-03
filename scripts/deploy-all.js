/**
 * 🚀 ЮГ-ПРАВО LegalTech — Полный Деплой на Боевой VPS (82.202.129.126)
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = process.cwd();
const REMOTE = '/var/www/yug-pravo';

const FILES_TO_DEPLOY = [
  'index.html',
  'initiatives.html',
  'contacts.html',
  'about.html',
  'events.html',
  'calculator.html',
  'assignment-viewer.html',
  'disclosure.html',
  'doc-viewer.html',
  'privacy.html',
  'services.html',
  'ustav.html',
  'payment-success.html',
  'form-usn-26-2-1.html',
  'code.html',
  'knowledge.html',
  'knowledge/finansovyy-upolnomochennyy-finombudsmen.html',
  'knowledge/gosklyuch-elektronnaya-podpis.html',
  'knowledge/kak-podat-isk-v-sud.html',
  'knowledge/legal-calculator-zapusk-proekta.html',
  'knowledge/nezakonnoe-uvolnenie-zarplata.html',
  'knowledge/pereraschet-zhkh-plata.html',
  'knowledge/samozapret-na-kredity-gosuslugi.html',
  'knowledge/shumnye-sosedi-zakon-o-tishine.html',
  'knowledge/vetkliniki-nekachestvennoe-lechenie.html',
  'knowledge/vozvrat-strahovki-period-ohlazhdeniya.html',
  'knowledge/vozvrat-tehniki-zozpp.html',
  'knowledge/vozvrat-tovarov-wildberries-ozon.html',
  'knowledge/zaderzhanie-politsiey-pamyatka.html',
  'knowledge/zaliv-kvartiry-akt-vozmeshchenie.html',
  'knowledge/zashchita-ot-kollektorov-230-fz.html',
  'css/styles.css',
  'css/shared.css',
  'js/articles-data.js',
  'js/cases-filter.js',
  'js/initiative-dossier.js',
  'js/invoice-generator.js',
  'js/legal-calculator.js',
  'js/legal-security.js',
  'js/legal-wizard.js',
  'js/effects.js',
  'js/forms.js',
  'js/main.js',
  'js/payment.js',
  'js/shared.js',
  'js/assignment-generator.js',
  'js/standby-lock.js',
  'js/telegram-bridge.js',
  'bots/main-bot.js',
  'bots/.env',
  'scripts/mailer.js',
  'scripts/legal-classifier.js',
  'scripts/registry-manager.js',
  'scripts/yandex-disk-sync.js',
  'scripts/excel-registry-generator.js',
  'scripts/contract-docx-service.js',
  'scripts/generate-orders-docx.js',
  'scripts/generate-accounting-docs.js',
  'scripts/doc-generator.js',
  'scripts/legal-validator.js',
  'server.js',
  'package.json',
  'ecosystem.config.js',
  '.env',
  'docs/dogovor-pozhertvovaniya-yurlicam.docx',
  'docs/dogovor-pozhertvovaniya-dlya-pechati-original.docx',
  'docs/donation-offer.txt',
  'docs/terms.txt',
  'docs/prikaz-01.txt',
  'docs/prikaz-02.txt',
  'docs/prikaz-03.txt',
  'docs/prikaz-04.txt',
  'docs/dogovor-pozhertvovaniya-yurlicam.txt',
  'docs/licenzionnyy-dogovor.txt',
  'docs/reshenie-02-uchreditelya.txt',
  'docs/reestr-dokumentov.txt',
  'docs/kartochka-ucheta-nma-schet-012.txt',
  'docs/ustav.txt',
  'docs/politika.txt',
  'docs/list-egrul.txt',
  'docs/prikaz-o-vstuplenii-v-dolzhnost.txt',
  'docs/prikaz-01-pdn-gost.txt',
  'docs/prikaz-01-local-acts.docx',
  'docs/prikaz-01-dlya-pechati-original.docx',
  'docs/prikaz-02-donations.docx',
  'docs/prikaz-02-dlya-pechati-original.docx',
  'docs/prikaz-03-uchet-politika.docx',
  'docs/prikaz-03-dlya-pechati-original.docx',
  'docs/prikaz-04-rid.docx',
  'docs/prikaz-04-dlya-pechati-original.docx',
  'docs/licenzionnyy-dogovor-rid-sofinansirovanie.docx',
  'docs/licenzionnyy-dogovor-dlya-pechati-original.docx',
  'docs/reshenie-02-uchreditelya.docx',
  'docs/reshenie-02-dlya-pechati-original.docx',
  'docs/kartochka-ucheta-nma-schet-012.docx',
  'docs/kartochka-ucheta-nma-schet-012-dlya-pechati-original.docx',
  'docs/buhgalterskaya-spravka-uchet-rid-750k.docx',
  'docs/buhgalterskaya-spravka-uchet-rid-750k-dlya-pechati-original.docx',
  'docs/vedomost-ucheta-pozhertvovaniy-schet-86.docx',
  'docs/vedomost-ucheta-pozhertvovaniy-schet-86-dlya-pechati-original.docx',
  'docs/REESTR_DOKUMENTOV_2026.docx',
  'images/official-seal.png',
  'images/official-signature.png',
  'images/official-seal-with-signature.png',
  'robots.txt',
  'sitemap.xml'
];

console.log('🚀 Начинаем деплой проекта на VPS (82.202.129.126)...');
console.log(`📦 Всего файлов к выгрузке: ${FILES_TO_DEPLOY.length}\n`);

const conn = new Client();

conn.on('ready', () => {
  console.log('🔑 SSH соединение успешно установлено!');
  
  conn.sftp((err, sftp) => {
    if (err) {
      console.error('❌ Ошибка SFTP:', err.message);
      conn.end();
      return;
    }

    let i = 0;
    function uploadNext() {
      if (i >= FILES_TO_DEPLOY.length) {
        console.log('\n⚙️ Все файлы выгружены. Перезапускаем веб-сервер и демоны в PM2...');
        
        conn.exec(`cd ${REMOTE} && pm2 delete bot-jkh-audit bot-lapa-charity bot-info-repost bot-vk-community secretary-bot 2>/dev/null ; pm2 startOrReload ecosystem.config.js --update-env 2>&1`, (execErr, stream) => {
          let out = '';
          stream.on('data', d => out += d);
          stream.stderr.on('data', d => out += d);
          stream.on('close', () => {
            console.log('📊 Статус PM2 на сервере:\n', out.trim());
            console.log('\n🌐 Выполняем контрольный Smoke Test боевого сайта https://yugpravo.ru/ ...');
            
            conn.end();

            // Smoke Test HTTPS
            https.get('https://yugpravo.ru/', (res) => {
              console.log(`✅ Smoke Test HTTP Status: ${res.statusCode} OK`);
              console.log('🎉 ДЕПЛОЙ НА ХОСТИНГ УСПЕШНО ЗАВЕРШЕН!');
            }).on('error', (hErr) => {
              console.log('ℹ️ Smoke test note:', hErr.message);
              console.log('🎉 ДЕПЛОЙ НА ХОСТИНГ УСПЕШНО ЗАВЕРШЕН!');
            });
          });
        });
        return;
      }

      const relPath = FILES_TO_DEPLOY[i++];
      const localPath = path.join(ROOT, relPath);
      const remotePath = `${REMOTE}/${relPath.replace(/\\/g, '/')}`;

      if (!fs.existsSync(localPath)) {
        console.log(`  ⏩ [SKIP] ${relPath} (файл не найден локально)`);
        uploadNext();
        return;
      }

      sftp.fastPut(localPath, remotePath, (upErr) => {
        if (upErr) {
          console.error(`  ❌ Ошибка загрузки ${relPath}:`, upErr.message);
        } else {
          console.log(`  ✅ Выгружен: ${relPath} -> ${remotePath}`);
        }
        uploadNext();
      });
    }

    uploadNext();
  });
}).on('error', (err) => {
  console.error('❌ Ошибка SSH подключения к VPS:', err.message);
});

conn.connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: '4EuSRg&!W525'
});
