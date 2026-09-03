const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// Helper to get all HTML files
function getAllHtmlFiles(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.agents') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getAllHtmlFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

// Map knowledge articles to exact alias
function getArticleAlias(filename) {
  const name = path.basename(filename, '.html');
  if (name.includes('zhkh') || name.includes('zaliv') || name.includes('shum')) {
    return 'jkh@yugpravo.ru';
  }
  if (name.includes('kollektor') || name.includes('kredit') || name.includes('strahovk') || name.includes('finombudsmen')) {
    return 'debt@yugpravo.ru';
  }
  if (name.includes('zozpp') || name.includes('tovar') || name.includes('vetklinik')) {
    return 'potreb@yugpravo.ru';
  }
  if (name.includes('sud') || name.includes('gosklyuch') || name.includes('zaderzhanie') || name.includes('calculator')) {
    return 'sud@yugpravo.ru';
  }
  if (name.includes('uvolnenie') || name.includes('trud')) {
    return 'trud@yugpravo.ru';
  }
  return 'info@yugpravo.ru';
}

const files = getAllHtmlFiles(rootDir);
let updatedCount = 0;

files.forEach(file => {
  let html = fs.readFileSync(file, 'utf8');
  let changed = false;
  const isKnowledge = file.includes('knowledge');
  const fileAlias = isKnowledge ? getArticleAlias(file) : (file.includes('initiatives') || file.includes('events') ? 'partner@yugpravo.ru' : 'info@yugpravo.ru');

  // 1. Fix corrupted modal-constructor form
  const corruptConstructorRegex = /<form class="space-y-3"[^>]*modal-constructor[^>]*>[\s\S]*?<\/form>/gi;
  if (corruptConstructorRegex.test(html)) {
    const cleanConstructorForm = `<form class="space-y-3" data-ajax-form data-source="Конструктор заявлений (Предзаказ)" data-alias="${fileAlias}">
                <div class="flex gap-3">
                    <input name="email" class="flex-grow bg-[#F8F7F4] border border-[#E0E0E0] rounded px-4 py-2.5 text-sm text-[#0F2439]" placeholder="Ваш e-mail" required type="email"/>
                    <button class="px-6 py-2.5 bg-[#0F2439] text-white text-xs uppercase font-bold rounded hover:bg-[#1e3a5f] transition-all button-glow" type="submit">Подписаться</button>
                </div>
            </form>`;
    html = html.replace(corruptConstructorRegex, cleanConstructorForm);
    changed = true;
  }

  // 2. Fix generic constructor modal form if present without corrupt string
  const modalConstructorBlockRegex = /(<div class="modal-overlay" id="modal-constructor">[\s\S]*?<p class="text-sm text-[#2C3E50] mb-4">[\s\S]*?<\/p>)\s*<form[\s\S]*?<\/form>/gi;
  if (modalConstructorBlockRegex.test(html)) {
    html = html.replace(modalConstructorBlockRegex, (match, prefix) => {
      changed = true;
      return `${prefix}
            <form class="space-y-3" data-ajax-form data-source="Конструктор заявлений (Предзаказ)" data-alias="${fileAlias}">
                <div class="flex gap-3">
                    <input name="email" class="flex-grow bg-[#F8F7F4] border border-[#E0E0E0] rounded px-4 py-2.5 text-sm text-[#0F2439]" placeholder="Ваш e-mail" required type="email"/>
                    <button class="px-6 py-2.5 bg-[#0F2439] text-white text-xs uppercase font-bold rounded hover:bg-[#1e3a5f] transition-all button-glow" type="submit">Подписаться</button>
                </div>
            </form>`;
    });
  }

  // 3. Ensure forms.js is included on every page before </body>
  const isSubfolder = path.relative(rootDir, file).includes(path.sep);
  const formsScriptTag = `<script src="${isSubfolder ? '../' : ''}js/forms.js?v=20260901_live8"></script>`;
  
  if (!html.includes('forms.js')) {
    html = html.replace('</body>', `    ${formsScriptTag}\n</body>`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, html, 'utf8');
    console.log(`✅ Updated forms in: ${path.relative(rootDir, file)} [Default Alias: ${fileAlias}]`);
    updatedCount++;
  }
});

console.log(`Finished: ${updatedCount} files updated with unified form logic.`);
