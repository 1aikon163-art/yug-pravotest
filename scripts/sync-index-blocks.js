const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';
let indexPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// 1. Synchronize Knowledge Base CTA and Badge
indexHtml = indexHtml.replace(
  /<span class="text-xs font-bold uppercase tracking-widest text-\[#8C6826\]">Правовое просвещение • Практические инструкции<\/span>/g,
  '<span class="text-xs font-bold uppercase tracking-widest text-[#8C6826]">Правовое просвещение • Экспертные алгоритмы и статьи</span>'
);

indexHtml = indexHtml.replace(
  /Все (15|45) инструкций\s*<span class="material-symbols-outlined ml-1\.5 text-sm">arrow_forward<\/span>/g,
  'Все 15 правовых алгоритмов <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>'
);

// 2. Synchronize Events CTA
indexHtml = indexHtml.replace(
  /Все 8 мероприятий осени 2026\s*<span class="material-symbols-outlined ml-1\.5 text-sm">arrow_forward<\/span>/g,
  'Все события и общественный контроль (8) <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>'
);

// 3. Synchronize Initiatives CTA
indexHtml = indexHtml.replace(
  /Все 5 инициатив\s*<span class="material-symbols-outlined ml-1\.5 text-sm">arrow_forward<\/span>/g,
  'Все 5 проектов развития <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>'
);

// 4. Synchronize Calculator CTA
indexHtml = indexHtml.replace(
  /Все 8 модулей калькулятора\s*<span class="material-symbols-outlined ml-1\.5 text-sm">arrow_forward<\/span>/g,
  'Открыть правовой калькулятор (8 модулей) <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>'
);

fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('index.html synchronized perfectly across all blocks!');

// Upload index.html to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading synchronized index.html...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(indexPath, '/var/www/yug-pravo/index.html', (err) => {
      if (err) throw err;
      conn.exec('systemctl reload nginx', () => {
        console.log('SYNCED_INDEX_DEPLOYED');
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
