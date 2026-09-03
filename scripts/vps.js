/**
 * ⚡ Unified VPS Bridge for Yug-Pravo LegalTech
 * Allows instantaneous file updates, database repair and PM2 reload
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
};

const action = process.argv[2] || 'sync';

const conn = new Client();
conn.on('ready', () => {
  if (action === 'sync' || action === 'update') {
    conn.sftp((err, sftp) => {
      if (err) throw err;
      const files = [
        ['bots/main-bot.js', '/var/www/yug-pravo/bots/main-bot.js'],
        ['scripts/appeals-manager.js', '/var/www/yug-pravo/scripts/appeals-manager.js'],
        ['scripts/excel-registry-generator.js', '/var/www/yug-pravo/scripts/excel-registry-generator.js'],
        ['scripts/yandex-disk-sync.js', '/var/www/yug-pravo/scripts/yandex-disk-sync.js'],
        ['scripts/sync-disk.js', '/var/www/yug-pravo/scripts/sync-disk.js'],
        ['scripts/mailer.js', '/var/www/yug-pravo/scripts/mailer.js'],
        ['server.js', '/var/www/yug-pravo/server.js'],
        ['js/forms.js', '/var/www/yug-pravo/js/forms.js'],
        ['assignment-viewer.html', '/var/www/yug-pravo/assignment-viewer.html'],
        ['calculator.html', '/var/www/yug-pravo/calculator.html'],
        ['index.html', '/var/www/yug-pravo/index.html']
      ];

      // Также исправляем записи в appeals.json на VPS и сразу синхронизируем с Яндекс Диском
      const fixDbCommand = `node -e "
        (async () => {
          const fs = require('fs');
          const p = '/var/www/yug-pravo/data/appeals.json';
          if (fs.existsSync(p)) {
            const db = JSON.parse(fs.readFileSync(p, 'utf-8'));
            db.appeals.forEach(a => {
              if (a.caseId && a.caseId.startsWith('ОБР')) {
                a.docType = 'appeal';
                a.docTypeLabel = 'Обращение';
                a.docPrefix = '📩';
              }
            });
            fs.writeFileSync(p, JSON.stringify(db, null, 2));
          }
          const m = require('./scripts/appeals-manager.js');
          await m.syncToYandexDisk();
          console.log('✅ Live Yandex Disk Registry Synchronized from VPS DB!');
        })();
      " && pm2 reload all`;

      let done = 0;
      files.forEach(([loc, rem]) => {
        sftp.fastPut(loc, rem, (e) => {
          if (e) console.error('Upload err:', loc, e);
          else console.log('✅ VPS Updated:', loc);
          done++;
          if (done === files.length) {
            // Also pull live database to local workspace:
            sftp.fastGet('/var/www/yug-pravo/data/appeals.json', './data/appeals.json', (eGet) => {
              if (!eGet) console.log('📥 Pulled live appeals.json to local workspace.');
              conn.exec(fixDbCommand, (err, stream) => {
                stream.on('data', d => process.stdout.write(d));
                stream.on('close', () => {
                  console.log('⚡ All live services reloaded.');
                  conn.end();
                });
              });
            });
          }
        });
      });
    });
  } else if (action === 'pull-db') {
    conn.sftp((err, sftp) => {
      if (err) throw err;
      sftp.fastGet('/var/www/yug-pravo/data/appeals.json', './data/appeals.json', (e) => {
        if (e) console.error('Pull err:', e);
        else console.log('✅ Live appeals.json successfully downloaded from VPS!');
        conn.end();
      });
    });
  } else if (action === 'status') {
    conn.exec('pm2 list', (err, stream) => {
      stream.on('data', d => process.stdout.write(d));
      stream.on('close', () => conn.end());
    });
  }
}).connect(config);
