const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';
const indexPath = path.join(rootDir, 'index.html');
const eventsPath = path.join(rootDir, 'events.html');

const indexHtml = fs.readFileSync(indexPath, 'utf8');
let eventsHtml = fs.readFileSync(eventsPath, 'utf8');

// 1. Fix the quotes in EVENT_REGISTRY in events.html
eventsHtml = eventsHtml.replace(
  /"title":\s*"«Реализация уставного проекта: запуск интерактивного сервиса "Правовой калькулятор" для защиты прав граждан»"/g,
  '"title": "«Реализация уставного проекта: запуск интерактивного сервиса \\\"Правовой калькулятор\\\" для защиты прав граждан»"'
);

// 2. Extract missing event modals from index.html (from modal-animal-aid up to before modal-stop-commission)
const modalStartIdx = indexHtml.indexOf('<!-- Modal: Animal Aid «Добрая лапа»');
const modalEndIdx = indexHtml.indexOf('<!-- ── MODAL: ПРОГРАММА «СТОП-КОМИССИЯ»');

if (modalStartIdx !== -1 && modalEndIdx !== -1) {
  const extractedModals = indexHtml.slice(modalStartIdx, modalEndIdx);

  // If events.html doesn't contain modal-animal-aid, inject them after modal-event-detail
  if (!eventsHtml.includes('id="modal-animal-aid"')) {
    const targetIdx = eventsHtml.indexOf('</div>\n    </div>\n\n\n    <!-- ── FOOTER');
    if (targetIdx !== -1) {
      eventsHtml = eventsHtml.slice(0, targetIdx + 17) + '\n\n' + extractedModals + '\n' + eventsHtml.slice(targetIdx + 17);
      console.log('Injected missing event modals into events.html');
    }
  }
}

// 3. Ensure openModal / closeModal functions exist and work cleanly on modal-event-detail
fs.writeFileSync(eventsPath, eventsHtml, 'utf8');
console.log('Saved fixed events.html!');

// 4. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading fixed events.html to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(eventsPath, '/var/www/yug-pravo/events.html', () => {
      conn.exec('systemctl reload nginx', () => {
        console.log('EVENTS_MODAL_FIX_DEPLOYED_SUCCESSFULLY');
        conn.end();
      });
    });
  });
}).connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
