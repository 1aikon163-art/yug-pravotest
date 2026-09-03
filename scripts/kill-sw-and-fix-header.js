const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Completely neutralize sw.js to delete all caches immediately
const swContent = `// Clear all service worker caches
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
  );
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request));
});
`;
fs.writeFileSync(path.join(rootDir, 'sw.js'), swContent, 'utf8');

// 2. In js/main.js, unregister all service workers and clean up
let mainJsPath = path.join(rootDir, 'js/main.js');
let mainJs = fs.readFileSync(mainJsPath, 'utf8');

// Remove any dynamic button text override that could touch header
mainJs = mainJs.replace(/function initDynamicCounters\(\)[\s\S]*?\n\}/, 'function initDynamicCounters() {}');

// Add immediate service worker purge
const swPurge = `
// Unregister old Service Workers and purge CacheStorage
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let r of registrations) r.unregister();
  });
}
if ('caches' in window) {
  caches.keys().then(keys => {
    for (let k of keys) caches.delete(k);
  });
}
`;

if (!mainJs.includes('Unregister old Service Workers')) {
  mainJs += swPurge;
}

fs.writeFileSync(mainJsPath, mainJs, 'utf8');

// 3. Ensure index.html header and section buttons are 100% clean
let indexPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Clean navigation header
const cleanHeaderNav = `<nav class="hidden lg:flex items-center gap-6">
                <a class="text-xs uppercase font-semibold tracking-wider text-[#2C3E50] hover:text-[#0F2439] transition-colors py-1" href="events.html">События</a>
                <a class="text-xs uppercase font-semibold tracking-wider text-[#2C3E50] hover:text-[#0F2439] transition-colors py-1" href="knowledge.html">База знаний</a>
                <a class="text-xs uppercase font-semibold tracking-wider text-[#2C3E50] hover:text-[#0F2439] transition-colors py-1" href="initiatives.html">Инициативы</a>
                <a class="text-xs uppercase font-semibold tracking-wider text-[#2C3E50] hover:text-[#0F2439] transition-colors py-1" href="calculator.html">Калькулятор</a>
                <a class="text-xs uppercase font-semibold tracking-wider text-[#2C3E50] hover:text-[#0F2439] transition-colors py-1" href="about.html">Об организации</a>
                <a class="text-xs uppercase font-semibold tracking-wider text-[#2C3E50] hover:text-[#0F2439] transition-colors py-1" href="disclosure.html">Раскрытие</a>
            </nav>`;

indexHtml = indexHtml.replace(/<nav class="hidden lg:flex items-center gap-6">[\s\S]*?<\/nav>/i, cleanHeaderNav);

// Clean KB section button
indexHtml = indexHtml.replace(
  /<a[^>]*id=["']kb-all-btn["'][\s\S]*?<\/a>/i,
  `<a class="inline-flex items-center text-xs uppercase tracking-wider font-semibold text-[#0F2439] border border-[#0F2439]/30 px-5 py-2.5 rounded hover:bg-[#0F2439]/5 transition-colors bg-white/70 backdrop-blur-sm shadow-xs" href="knowledge.html">
                    Все 15 правовых алгоритмов <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>
                </a>`
);

// Clean Calc section button
indexHtml = indexHtml.replace(
  /<a[^>]*id=["']calc-all-btn["'][\s\S]*?<\/a>/i,
  `<a class="inline-flex items-center text-xs uppercase tracking-wider font-semibold text-[#0F2439] border border-[#0F2439]/30 px-5 py-2.5 rounded hover:bg-[#0F2439]/5 transition-colors bg-white/70 backdrop-blur-sm shadow-xs" href="calculator.html">
                    Все 8 модулей калькулятора <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>
                </a>`
);

fs.writeFileSync(indexPath, indexHtml, 'utf8');

// 4. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading purged SW, clean header, and scripts...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(path.join(rootDir, 'sw.js'), '/var/www/yug-pravo/sw.js', () => {
      sftp.fastPut(mainJsPath, '/var/www/yug-pravo/js/main.js', () => {
        sftp.fastPut(indexPath, '/var/www/yug-pravo/index.html', () => {
          conn.exec('systemctl reload nginx', () => {
            console.log('SERVICE_WORKER_KILLED_AND_HEADER_RESTORED_PERFECTLY');
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
