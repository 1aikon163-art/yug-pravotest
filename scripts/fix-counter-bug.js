const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Fix js/main.js
let mainJsPath = path.join(rootDir, 'js/main.js');
let mainJs = fs.readFileSync(mainJsPath, 'utf8');

// Replace the entire initDynamicCounters function in main.js
const newMainCounters = `// ─── ДИНАМИЧЕСКИЙ СЧЕТЧИК СТАТЕЙ И ИНИЦИАТИВ ───
function initDynamicCounters() {
  // Knowledge Base (15 Unique Articles)
  const kbAllBtn = document.getElementById('kb-all-btn');
  if (kbAllBtn) {
    kbAllBtn.innerHTML = 'Все 15 правовых алгоритмов <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>';
  }

  // Calculator (8 Modules)
  const calcAllBtn = document.getElementById('calc-all-btn');
  if (calcAllBtn) {
    calcAllBtn.innerHTML = 'Все 8 модулей калькулятора <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>';
  }

  // Events (8 Events)
  const eventsAllBtn = document.getElementById('events-all-btn');
  if (eventsAllBtn) {
    eventsAllBtn.innerHTML = 'Все события и общественный контроль (8) <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>';
  }

  // Initiatives (5 Projects)
  const initAllBtn = document.getElementById('init-all-btn');
  if (initAllBtn) {
    initAllBtn.innerHTML = 'Все 5 проектов развития <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>';
  }
}`;

mainJs = mainJs.replace(/\/\/\s*───\s*ДИНАМИЧЕСКИЙ СЧЕТЧИК СТАТЕЙ И ИНСТРУКЦИЙ\s*───[\s\S]*?function initDynamicCounters\(\)\s*\{[\s\S]*?\n\}/, newMainCounters);
fs.writeFileSync(mainJsPath, mainJs, 'utf8');
console.log('js/main.js bug fixed!');

// 2. Fix index.html
let indexPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Replace the calculator CTA button
const oldCalcBtnRegex = /<a[^>]*href=["']calculator\.html["'][^>]*class=["'][^"']*bg-\[#0F2439\][\s\S]*?<\/a>/i;
const unifiedCalcBtn = `<a id="calc-all-btn" class="inline-flex items-center text-xs uppercase tracking-wider font-semibold text-[#0F2439] border border-[#0F2439]/30 px-5 py-2.5 rounded hover:bg-[#0F2439]/5 transition-colors bg-white/70 backdrop-blur-sm shadow-xs" href="calculator.html">
                    Все 8 модулей калькулятора <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>
                </a>`;

indexHtml = indexHtml.replace(oldCalcBtnRegex, unifiedCalcBtn);

// Ensure KB button in index.html is 100% clean
indexHtml = indexHtml.replace(
  /<a[^>]*id=["']kb-all-btn["'][\s\S]*?<\/a>/i,
  `<a id="kb-all-btn" class="inline-flex items-center text-xs uppercase tracking-wider font-semibold text-[#0F2439] border border-[#0F2439]/30 px-5 py-2.5 rounded hover:bg-[#0F2439]/5 transition-colors bg-white/70 backdrop-blur-sm shadow-xs" href="knowledge.html">
                    Все 15 правовых алгоритмов <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>
                </a>`
);

fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('index.html updated with unified buttons!');

// 3. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading fixed main.js, index.html, shared.js...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(mainJsPath, '/var/www/yug-pravo/js/main.js', () => {
      sftp.fastPut(indexPath, '/var/www/yug-pravo/index.html', () => {
        sftp.fastPut(path.join(rootDir, 'js/shared.js'), '/var/www/yug-pravo/js/shared.js', () => {
          conn.exec('systemctl reload nginx', () => {
            console.log('PERFECT_SYNC_AND_UNIFICATION_COMPLETE');
            conn.end();
          });
        });
      });
    });
  });
}).connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
