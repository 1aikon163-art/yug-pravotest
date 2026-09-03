const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Add Universal Developer Contact Modal & Trigger to js/main.js
const mainJsPath = path.join(rootDir, 'js/main.js');
let mainJs = fs.readFileSync(mainJsPath, 'utf8');

const devModalCode = `
// ─── УНИВЕРСАЛЬНОЕ ОКНО СВЯЗИ С РАЗРАБОТЧИКОМ (БЕЗ БЛОКИРОВОК T.ME) ───
window.openDeveloperModal = function(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }

  let modal = document.getElementById('modal-developer-contact');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-developer-contact';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0F2439]/70 backdrop-blur-md transition-opacity duration-300';
    modal.innerHTML = \`
      <div class="relative w-full max-w-md bg-[#F8F7F4] border border-[#E0E0E0] rounded-2xl shadow-2xl p-6 sm:p-8 text-[#0F2439] animate-in fade-in zoom-in-95 duration-200">
        <!-- Close button -->
        <button type="button" onclick="closeDeveloperModal()" class="absolute top-4 right-4 p-2 text-[#5F5E5E] hover:text-[#0F2439] transition-colors rounded-full hover:bg-[#EBEAE5]">
          <span class="material-symbols-outlined text-xl">close</span>
        </button>

        <!-- Header -->
        <div class="flex items-center gap-3.5 mb-5 pb-4 border-b border-[#E0E0E0]">
          <div class="w-12 h-12 rounded-xl bg-[#0F2439] text-[#C5A059] flex items-center justify-center font-bold text-lg shadow-sm">
            ПШ
          </div>
          <div>
            <h3 class="font-bold text-base text-[#0F2439] leading-tight">Шарыпаев П. В.</h3>
            <p class="text-xs text-[#5F5E5E]">Архитектура, код и дизайн LegalTech</p>
          </div>
        </div>

        <p class="text-xs text-[#2C3E50] leading-relaxed mb-6">
          Разработка высокотехнологичных платформ, правовых калькуляторов, чат-ботов и веб-сервисов под ключ.
        </p>

        <!-- Actions -->
        <div class="flex flex-col gap-3">
          <!-- Direct App Link -->
          <a href="tg://resolve?domain=aikon163" class="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#2AABEE] hover:bg-[#229ED9] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all group">
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
            <span>Открыть приложение Telegram</span>
          </a>

          <!-- Web Telegram Link -->
          <a href="https://web.telegram.org/a/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3Daikon163" target="_blank" rel="noopener noreferrer" class="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-[#E0E0E0] hover:border-[#0F2439] text-[#0F2439] font-semibold text-xs tracking-wider rounded-xl transition-all">
            <span class="material-symbols-outlined text-sm">open_in_new</span>
            <span>Открыть в Telegram Web</span>
          </a>

          <!-- Copy Username Button -->
          <button type="button" onclick="copyTelegramUsername()" id="copy-tg-btn" class="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#EBEAE5] hover:bg-[#E0DFD8] text-[#2C3E50] font-mono text-xs rounded-xl transition-all">
            <span class="material-symbols-outlined text-sm">content_copy</span>
            <span id="copy-tg-text">Скопировать @aikon163</span>
          </button>
        </div>
      </div>
    \`;
    document.body.appendChild(modal);

    modal.addEventListener('click', (ev) => {
      if (ev.target === modal) closeDeveloperModal();
    });
  }

  modal.classList.remove('hidden');
};

window.closeDeveloperModal = function() {
  const modal = document.getElementById('modal-developer-contact');
  if (modal) modal.classList.add('hidden');
};

window.copyTelegramUsername = function() {
  navigator.clipboard.writeText('@aikon163').then(() => {
    const btnText = document.getElementById('copy-tg-text');
    if (btnText) {
      btnText.innerText = '✅ Скопировано в буфер!';
      setTimeout(() => { btnText.innerText = 'Скопировать @aikon163'; }, 3000);
    }
  }).catch(() => {
    prompt('Скопируйте никнейм в Telegram:', '@aikon163');
  });
};
`;

if (!mainJs.includes('openDeveloperModal')) {
  mainJs += devModalCode;
  fs.writeFileSync(mainJsPath, mainJs, 'utf8');
  console.log('Added openDeveloperModal to js/main.js');
}

// 2. Function to update all HTML files: replace direct t.me link with onclick="openDeveloperModal(event)"
function getHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.agents') {
        results = results.concat(getHtmlFiles(fullPath));
      }
    } else if (file.endsWith('.html')) {
      results.push(fullPath);
    }
  });
  return results;
}

const htmlFiles = getHtmlFiles(rootDir);

const modernDevLink = `<a href="javascript:void(0)" onclick="openDeveloperModal(event)" class="font-bold text-[#0F2439] hover:text-[#C5A059] transition-colors underline decoration-[#0F2439]/30 underline-offset-4 hover:decoration-[#C5A059] cursor-pointer">П. В. Шарыпаев</a>`;

htmlFiles.forEach(filePath => {
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (html.includes('https://t.me/aikon163')) {
    html = html.replace(/<a\s+href=["']https:\/\/t\.me\/aikon163["'][^>]*>П\. В\. Шарыпаев<\/a>/gi, modernDevLink);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`Updated dev link to modal in: ${path.relative(rootDir, filePath)}`);
  }
});

// 3. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading Developer Bridge Modal to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(mainJsPath, '/var/www/yug-pravo/js/main.js', () => {
      let count = 0;
      const rootHtmlFiles = [
        'index.html',
        'about.html',
        'calculator.html',
        'events.html',
        'initiatives.html',
        'knowledge.html',
        'disclosure.html',
        'contacts.html',
        'services.html',
        'cases.html',
        'code.html',
        'privacy.html',
        'ustav.html'
      ];

      rootHtmlFiles.forEach(file => {
        const p = path.join(rootDir, file);
        if (fs.existsSync(p)) {
          sftp.fastPut(p, `/var/www/yug-pravo/${file}`, () => {
            count++;
            if (count === rootHtmlFiles.length) {
              conn.exec('systemctl reload nginx', () => {
                console.log('DEVELOPER_BRIDGE_MODAL_DEPLOYED_SUCCESSFULLY');
                conn.end();
              });
            }
          });
        }
      });
    });
  });
}).connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
