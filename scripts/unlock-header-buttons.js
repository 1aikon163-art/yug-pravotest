/**
 * Разблокировка кнопок «Поддержать проект» в шапке сайта.
 * Убирает disabled + pointer-events:none, добавляет onclick=openModal('modal-donate')
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MAIN_PAGES = [
  'index.html','about.html','cases.html','calculator.html',
  'contacts.html','disclosure.html','doc-viewer.html','events.html',
  'initiatives.html','knowledge.html','privacy.html','services.html','ustav.html'
];
const kDir = path.join(ROOT, 'knowledge');
const kPages = fs.existsSync(kDir)
  ? fs.readdirSync(kDir).filter(f => f.endsWith('.html')).map(f => 'knowledge/' + f)
  : [];

const ALL = [...MAIN_PAGES, ...kPages];
let total = 0;

for (const file of ALL) {
  const fp = path.join(ROOT, file);
  if (!fs.existsSync(fp)) continue;

  let html = fs.readFileSync(fp, 'utf8');
  const orig = html;

  // ---------------------------------------------------------------
  // Паттерн 1: button с disabled style="pointer-events:none..." 
  // и текстом "Поддержать"
  // ---------------------------------------------------------------
  // Ищем кнопки с pointer-events:none которые содержат "Поддержать"
  const btnRegex = /<button\b[^>]*disabled[^>]*style="[^"]*pointer-events:\s*none[^"]*"[^>]*>[\s\S]{0,200}?Поддержать[\s\S]{0,50}?<\/button>/g;
  html = html.replace(btnRegex, (match) => {
    let fixed = match;
    // Убрать disabled атрибут
    fixed = fixed.replace(/\s+disabled\b/g, '');
    // Убрать style с pointer-events/opacity/cursor блокировками
    fixed = fixed.replace(/\s+style="[^"]*(?:pointer-events:\s*none|cursor:\s*not-allowed)[^"]*"/g, '');
    // Добавить onclick если нет
    if (!fixed.includes("openModal('modal-donate')") && !fixed.includes('openModal("modal-donate")')) {
      fixed = fixed.replace(/(<button\b)/, "$1 onclick=\"openModal('modal-donate')\"");
    }
    return fixed;
  });

  // Паттерн 2: style="pointer-events:none !important;opacity:0.6 !important;cursor:not-allowed !important;"
  html = html.replace(
    /(\s+)style="pointer-events:none !important;opacity:0\.6[^"]*!important;cursor:not-allowed !important;"(\s+>|>)/g,
    '$2'
  );

  // Убираем оставшиеся standalone disabled на кнопках Поддержать
  html = html.replace(
    /(<button\b(?:[^>]*\n?)*?>\s*\n?\s*Поддержать проект)/g,
    (m) => m.replace(/\s+disabled\b/g, '').replace(/\sonclick="[^"]*"/, '').replace('<button', "<button onclick=\"openModal('modal-donate')\"")
  );

  if (html !== orig) {
    fs.writeFileSync(fp, html, 'utf8');
    console.log('✅ ' + file);
    total++;
  }
}

console.log('\nОбновлено файлов: ' + total);
