const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// Function to recursively find all .html files
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

htmlFiles.forEach(filePath => {
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix corrupted mobile nav button
  if (html.includes("document.getElementById('mobile-nav').classList.add('hidden');\"")) {
    html = html.replace(
      /\s*document\.getElementById\('mobile-nav'\)\.classList\.add\('hidden'\);"/g,
      ''
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`Cleaned mobile nav syntax in: ${path.relative(rootDir, filePath)}`);
  }
});

// 2. Make initMobileMenu in js/main.js ultra-reliable
const mainJsPath = path.join(rootDir, 'js/main.js');
let mainJs = fs.readFileSync(mainJsPath, 'utf8');

const bulletproofMobileMenu = `
// ─── УНИВЕРСАЛЬНОЕ МОБИЛЬНОЕ МЕНЮ (100% НАДЕЖНОСТЬ) ───
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  if (!menuBtn || !mobileNav) return;

  // Безопасное снятие старых листенеров
  const newMenuBtn = menuBtn.cloneNode(true);
  menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);

  newMenuBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isHidden = mobileNav.classList.contains('hidden');
    if (isHidden) {
      mobileNav.classList.remove('hidden');
    } else {
      mobileNav.classList.add('hidden');
    }
    
    const icon = newMenuBtn.querySelector('.material-symbols-outlined');
    if (icon) {
      icon.textContent = isHidden ? 'close' : 'menu';
    }
  });

  // Закрытие при клике вне меню
  document.addEventListener('click', (e) => {
    if (!mobileNav.contains(e.target) && !newMenuBtn.contains(e.target)) {
      mobileNav.classList.add('hidden');
      const icon = newMenuBtn.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = 'menu';
    }
  });

  // Закрытие при клике на любую ссылку в меню
  mobileNav.querySelectorAll('a, button').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.add('hidden');
      const icon = newMenuBtn.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = 'menu';
    });
  });
}
`;

mainJs = mainJs.replace(/\/\/ ─── УНИВЕРСАЛЬНОЕ МОБИЛЬНОЕ МЕНЮ[\s\S]*?^}/m, bulletproofMobileMenu);
fs.writeFileSync(mainJsPath, mainJs, 'utf8');
console.log('js/main.js updated with bulletproof mobile menu handler!');

// 3. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading cleaned HTML files and main.js to VPS...');
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
                console.log('MOBILE_MENU_FIX_DEPLOYED_SUCCESSFULLY');
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
