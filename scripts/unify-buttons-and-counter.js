const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Update index.html
let indexPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Unify the Calculator section CTA button style to match other 3 sections
// Replace the dark solid button with the standard frosted glass outlined button
indexHtml = indexHtml.replace(
  /<a[^>]*href=["']calculator\.html["'][^>]*class=["'][^"']*bg-\[#0F2439\][^"']*["'][^>]*>([\s\S]*?)<\/a>/i,
  `<a id="calc-all-btn" class="inline-flex items-center text-xs uppercase tracking-wider font-semibold text-[#0F2439] border border-[#0F2439]/30 px-5 py-2.5 rounded hover:bg-[#0F2439]/5 transition-colors bg-white/70 backdrop-blur-sm shadow-xs" href="calculator.html">
    Все 8 модулей калькулятора <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>
</a>`
);

// Ensure all 4 section CTA buttons have IDs for dynamic sync
if (!indexHtml.includes('id="events-all-btn"')) {
  indexHtml = indexHtml.replace(/(<a[^>]*href=["']events\.html["'][^>]*)>/i, '$1 id="events-all-btn">');
}
if (!indexHtml.includes('id="kb-all-btn"')) {
  indexHtml = indexHtml.replace(/(<a[^>]*href=["']knowledge\.html["'][^>]*)>/i, '$1 id="kb-all-btn">');
}
if (!indexHtml.includes('id="calc-all-btn"')) {
  indexHtml = indexHtml.replace(/(<a[^>]*href=["']calculator\.html["'][^>]*)>/i, '$1 id="calc-all-btn">');
}
if (!indexHtml.includes('id="init-all-btn"')) {
  indexHtml = indexHtml.replace(/(<a[^>]*href=["']initiatives\.html["'][^>]*)>/i, '$1 id="init-all-btn">');
}

fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('index.html buttons unified!');

// 2. Add dynamic auto-counter into js/shared.js
let sharedPath = path.join(rootDir, 'js/shared.js');
let sharedJs = fs.readFileSync(sharedPath, 'utf8');

const dynamicSyncCode = `
/* ========================================================
   DYNAMIC SECTION REAL-TIME AUTO-COUNTER
   Automatically counts published cards in carousels/sections
   ======================================================== */
function autoSyncSectionCounters() {
  // 1. Knowledge Base Auto-Count
  const kbTape = document.querySelector('#kb-section .horizontal-scroll-container') ||
                 document.querySelectorAll('.horizontal-tape-wrapper')[1]?.querySelector('.horizontal-scroll-container');
  if (kbTape) {
    const count = kbTape.children.length;
    const btn = document.getElementById('kb-all-btn');
    if (btn && count > 0) {
      btn.innerHTML = 'Все ' + count + ' правовых алгоритмов <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>';
    }
  }

  // 2. Events Auto-Count
  const evTape = document.querySelector('#events-section .horizontal-scroll-container') ||
                 document.querySelectorAll('.horizontal-tape-wrapper')[0]?.querySelector('.horizontal-scroll-container');
  if (evTape) {
    const count = evTape.children.length;
    const btn = document.getElementById('events-all-btn');
    if (btn && count > 0) {
      btn.innerHTML = 'Все события и отчеты (' + count + ') <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>';
    }
  }

  // 3. Calculator Auto-Count
  const calcTape = document.querySelector('#calc-section .horizontal-scroll-container') ||
                   document.querySelectorAll('.horizontal-tape-wrapper')[2]?.querySelector('.horizontal-scroll-container');
  if (calcTape) {
    const count = calcTape.children.length;
    const btn = document.getElementById('calc-all-btn');
    if (btn && count > 0) {
      btn.innerHTML = 'Все ' + count + ' модулей калькулятора <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>';
    }
  }

  // 4. Initiatives Auto-Count
  const initTape = document.querySelector('#initiatives-section .horizontal-scroll-container') ||
                   document.querySelectorAll('.horizontal-tape-wrapper')[3]?.querySelector('.horizontal-scroll-container');
  if (initTape) {
    const count = initTape.children.length;
    const btn = document.getElementById('init-all-btn');
    if (btn && count > 0) {
      btn.innerHTML = 'Все ' + count + ' проектов развития <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>';
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoSyncSectionCounters);
} else {
  autoSyncSectionCounters();
}
`;

if (!sharedJs.includes('autoSyncSectionCounters')) {
  sharedJs += dynamicSyncCode;
  fs.writeFileSync(sharedPath, sharedJs, 'utf8');
  console.log('js/shared.js updated with dynamic real-time counter!');
}

// 3. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading unified UI and dynamic sync script...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(indexPath, '/var/www/yug-pravo/index.html', () => {
      sftp.fastPut(sharedPath, '/var/www/yug-pravo/js/shared.js', () => {
        conn.exec('systemctl reload nginx', () => {
          console.log('UNIFIED_SYNC_DEPLOYED_SUCCESSFULLY');
          conn.end();
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
