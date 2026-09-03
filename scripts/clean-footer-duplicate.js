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

const cleanLebedevBadge = `
            <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5F5E5E] pt-4 border-t border-[#E0E0E0]/60 max-w-4xl mx-auto">
                <div>© 2026 АНО «ЦПЗ ЮГ-ПРАВО». Все права защищены.</div>
                <div class="inline-flex items-center gap-1.5 text-xs text-[#5F5E5E]">
                    <span class="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></span>
                    <span>Архитектура, код и дизайн:</span>
                    <a href="https://t.me/aikon163" target="_blank" rel="noopener noreferrer" class="font-bold text-[#0F2439] hover:text-[#C5A059] transition-colors underline decoration-[#0F2439]/30 underline-offset-4 hover:decoration-[#C5A059]">
                        П. В. Шарыпаев
                    </a>
                </div>
            </div>`;

htmlFiles.forEach(filePath => {
  let html = fs.readFileSync(filePath, 'utf8');

  // Remove the inline duplicate "| Архитектура, код и дизайн: ..."
  html = html.replace(/\s*\|\s*Архитектура, код и дизайн:\s*<a[^>]*>П\. В\. Шарыпаев<\/a>/gi, '');

  // Ensure clean structure
  html = html.replace(
    /<div class="flex flex-col sm:flex-row items-center justify-between[\s\S]*?<\/a>\s*<\/div>\s*<\/div>/gi,
    cleanLebedevBadge
  );

  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Cleaned footer duplicate in: ${path.relative(rootDir, filePath)}`);
});

// Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading deduplicated footers to VPS...');
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
              console.log('DEDUPLICATED_FOOTER_DEPLOYED_SUCCESSFULLY');
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
