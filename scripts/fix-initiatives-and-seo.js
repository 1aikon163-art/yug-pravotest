const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Fix orphan HTML in initiatives.html
const initPath = path.join(rootDir, 'initiatives.html');
let initHtml = fs.readFileSync(initPath, 'utf8');

// Clean up orphan donation text after modal-donate
initHtml = initHtml.replace(
  /<\/div>\s*<\/div>\s*<p class="text-xs text-\[#2C3E50\] mb-6 leading-relaxed">[\s\S]*?<\/div>\s*<\/div>\s*<!-- Modal: Constructor -->/i,
  '</div>\n    </div>\n\n    <!-- Modal: Constructor -->'
);

// Clean up orphan calculator text after modal-calculator
initHtml = initHtml.replace(
  /<\/a>\s*<\/div>\s*<\/div>\s*<p class="text-xs text-\[#2C3E50\] mb-4 leading-relaxed">[\s\S]*?<\/div>\s*<\/div>\s*<!-- Modal: Contact/i,
  '</a>\n        </div>\n    </div>\n\n    <!-- Modal: Contact'
);

fs.writeFileSync(initPath, initHtml, 'utf8');
console.log('Cleaned orphan HTML in initiatives.html!');

// 2. Add Favicon and clean SEO tags across ALL HTML files
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

const faviconTags = `
    <!-- Favicon & Brand Icons -->
    <link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png"/>
    <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png"/>
    <meta name="theme-color" content="#0F2439"/>
`;

htmlFiles.forEach(filePath => {
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Add favicon if not present
  if (!html.includes('rel="icon"')) {
    html = html.replace('<head>', '<head>' + faviconTags);
    changed = true;
  }

  // Canonical fix: /index.html -> /
  if (html.includes('https://yugpravo.ru/index.html')) {
    html = html.replace(/https:\/\/yugpravo\.ru\/index\.html/g, 'https://yugpravo.ru/');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`Updated SEO & Favicon in: ${path.relative(rootDir, filePath)}`);
  }
});

// 3. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading fixed initiatives.html and all HTML SEO/Favicons to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

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
              console.log('SEO_FAVICON_AND_INITIATIVES_FIX_DEPLOYED');
              conn.end();
            });
          }
        });
      }
    });
  });
}).connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
