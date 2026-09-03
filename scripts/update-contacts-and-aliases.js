const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const OLD_PHONE_DISPLAY = '8 (846) 989-07-68';
const NEW_PHONE_DISPLAY = '8 (846) 989-07-68';
const NEW_PHONE_TEL     = '+78469890768';

const OLD_EMAIL = 'info@yugpravo.ru';
const NEW_EMAIL = 'info@yugpravo.ru';

function getAllFiles(dir, exts = ['.html', '.js', '.txt', '.md', '.json']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (file === 'node_modules' || file === '.git' || file === '.gemini' || file === 'archive') continue;
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(full, exts));
    } else {
      const ext = path.extname(file).toLowerCase();
      if (exts.includes(ext)) results.push(full);
    }
  }
  return results;
}

const files = getAllFiles(ROOT);
console.log(`🔍 Сканируем ${files.length} файлов на замену контактов...`);

let updatedCount = 0;

for (const fp of files) {
  let content = fs.readFileSync(fp, 'utf8');
  let original = content;

  // 1. Телефоны
  content = content.replace(/\+7\s*\(999\)\s*172-43-53/g, NEW_PHONE_DISPLAY);
  content = content.replace(/tel:\+78469890768/g, `tel:${NEW_PHONE_TEL}`);
  content = content.replace(/tel:+78469890768/g, `tel:${NEW_PHONE_TEL}`);
  content = content.replace(/\+78469890768/g, NEW_PHONE_TEL);

  // 2. Email
  content = content.replace(/1aikon163@gmail\.com/g, NEW_EMAIL);
  content = content.replace(/mailto:1aikon163@gmail\.com/g, `mailto:${NEW_EMAIL}`);
  content = content.replace(/info@yugpravo\.ry/g, NEW_EMAIL); // опечатка .ry

  if (content !== original) {
    fs.writeFileSync(fp, content, 'utf8');
    console.log('  ✅ Обновлены контакты:', path.relative(ROOT, fp));
    updatedCount++;
  }
}

console.log(`\n🎉 Обновлено файлов: ${updatedCount}`);
