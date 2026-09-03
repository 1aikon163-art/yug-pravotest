const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// Create dedicated favicon.svg (crisp square for tab icons)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none">
  <rect width="128" height="128" rx="28" fill="#0F2439"/>
  <!-- Heraldic Shield -->
  <path d="M64 16L28 28V64C28 88 45 106 64 114C83 106 100 88 100 64V28L64 16Z" fill="#0F2439" stroke="#C5A059" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/>
  <!-- Scales Axis -->
  <path d="M64 36V82" stroke="#C5A059" stroke-width="3.5" stroke-linecap="round"/>
  <circle cx="64" cy="38" r="3" fill="#C5A059"/>
  <path d="M42 45L64 38L86 45" stroke="#C5A059" stroke-width="3" stroke-linecap="round"/>
  <!-- Scale Bowls -->
  <path d="M42 45L35 60M42 45L49 60" stroke="#C5A059" stroke-width="1.8"/>
  <path d="M33 60C33 66 51 66 51 60Z" fill="#C5A059"/>
  <path d="M86 45L79 60M86 45L93 60" stroke="#C5A059" stroke-width="1.8"/>
  <path d="M77 60C77 66 95 66 95 60Z" fill="#C5A059"/>
</svg>`;

fs.writeFileSync(path.join(rootDir, 'favicon.svg'), faviconSvg, 'utf8');
fs.writeFileSync(path.join(rootDir, 'images/favicon.svg'), faviconSvg, 'utf8');

// Title mappings per page
const titleMap = {
  'index.html': 'АНО «ЦПЗ ЮГ-ПРАВО» — Развитие гражданских инициатив и общественный контроль | Самара',
  'about.html': 'Об организации — АНО «ЦПЗ ЮГ-ПРАВО» | Уставные цели и программы развития',
  'initiatives.html': 'Региональные инициативы и проекты развития — АНО «ЮГ-ПРАВО»',
  'events.html': 'События, общественный контроль и доклады — АНО «ЦПЗ ЮГ-ПРАВО»',
  'knowledge.html': 'Правовое просвещение и алгоритмы действий — АНО «ЮГ-ПРАВО»',
  'calculator.html': 'Правовой калькулятор и LegalTech-сервисы — АНО «ЮГ-ПРАВО»',
  'disclosure.html': 'Раскрытие информации и официальная отчетность НКО — АНО «ЦПЗ ЮГ-ПРАВО»',
  'contacts.html': 'Контакты и реквизиты — АНО «ЦПЗ ЮГ-ПРАВО»',
  'privacy.html': 'Политика конфиденциальности — АНО «ЦПЗ ЮГ-ПРАВО»',
  'ustav.html': 'Устав организации — АНО «ЦПЗ ЮГ-ПРАВО»'
};

function updateMetaAndFavicon(dir, prefix = '') {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file === 'knowledge') {
        updateMetaAndFavicon(fullPath, '../');
      }
    } else if (file.endsWith('.html')) {
      let html = fs.readFileSync(fullPath, 'utf8');

      // Update title if present in map
      if (titleMap[file]) {
        html = html.replace(/<title>.*?<\/title>/is, `<title>${titleMap[file]}</title>`);
      }

      // Add favicon link if not present
      if (!html.includes('favicon.svg')) {
        const faviconTags = `
    <!-- Favicon & Icons -->
    <link rel="icon" type="image/svg+xml" href="${prefix}favicon.svg">
    <link rel="icon" type="image/png" href="${prefix}images/logo.png">
    <link rel="apple-touch-icon" href="${prefix}images/logo.png">`;
        html = html.replace('</head>', `${faviconTags}\n</head>`);
      }

      fs.writeFileSync(fullPath, html, 'utf8');
      console.log('Updated meta & favicon in:', file);
    }
  }
}

updateMetaAndFavicon(rootDir);

// Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading favicons and updated titles...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(path.join(rootDir, 'favicon.svg'), '/var/www/yug-pravo/favicon.svg', () => {
      sftp.fastPut(path.join(rootDir, 'images/favicon.svg'), '/var/www/yug-pravo/images/favicon.svg', () => {
        const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));
        let count = 0;
        for (const hf of htmlFiles) {
          sftp.fastPut(path.join(rootDir, hf), `/var/www/yug-pravo/${hf}`, () => {
            count++;
            if (count === htmlFiles.length) {
              conn.exec('systemctl reload nginx', () => {
                console.log('FAVICONS_AND_TITLES_DEPLOYED_SUCCESSFULLY');
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
