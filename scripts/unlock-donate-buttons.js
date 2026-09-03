/**
 * Разблокировка кнопок пожертвования во всех HTML-файлах:
 * 1. Удаляет блок с purpose-radio-btn (Shelter, ЖКХ)
 * 2. Убирает disabled с кнопки submit
 * 3. Добавляет onclick=TBankPayment.initiatePayment
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const MAIN_PAGES = [
  'index.html', 'about.html', 'cases.html', 'calculator.html',
  'contacts.html', 'disclosure.html', 'doc-viewer.html', 'events.html',
  'initiatives.html', 'knowledge.html', 'privacy.html', 'services.html', 'ustav.html'
];

function getKnowledgePages() {
  const kdir = path.join(ROOT, 'knowledge');
  if (!fs.existsSync(kdir)) return [];
  return fs.readdirSync(kdir).filter(f => f.endsWith('.html')).map(f => path.join('knowledge', f));
}

const ALL_PAGES = [...MAIN_PAGES, ...getKnowledgePages()];

let totalUpdated = 0;

for (const file of ALL_PAGES) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) continue;

  let html = fs.readFileSync(fullPath, 'utf8');
  if (!html.includes('modal-donate')) continue;

  let changed = false;

  // ------------------------------------------------------------------
  // 1. Удаляем Purpose Selector с radio-кнопками (shelter, jkh)
  // ------------------------------------------------------------------
  if (html.includes('purpose-radio-btn')) {
    // Удаляем весь div-блок Purpose Selector (от комментария до конца секции)
    html = html.replace(
      /[ \t]*<!-- 1\. Purpose Selector -->[\s\S]*?(?=[ \t]*<!-- 2\. Amount)/,
      ''
    );
    // Исправляем нумерацию лейблов
    html = html.replace(/2\.\s*Выберите или укажите сумму/g, 'Выберите сумму');
    html = html.replace(/3\.\s*Электронная почта/g, 'Электронная почта');
    changed = true;
    console.log('  [purpose-radio removed]');
  }

  // ------------------------------------------------------------------
  // 2. Разблокируем кнопку submit
  //    Ищем donate-submit-btn или btn-donate-submit
  // ------------------------------------------------------------------

  // Убираем disabled атрибут с кнопки
  html = html.replace(
    /(<button\s[^>]*id="(?:donate-submit-btn|btn-donate-submit)"[^>]*)(\sdisabled)/g,
    '$1'
  );
  html = html.replace(
    /(<button\s[^>]*\sdisabled[^>]*id="(?:donate-submit-btn|btn-donate-submit)"[^>]*)/g,
    (m) => m.replace(/\sdisabled/g, '')
  );

  // Убираем инлайн-стиль блокировки (pointer-events:none, cursor:not-allowed)
  html = html.replace(
    /(\s+style="(?:[^"]*?)(?:pointer-events:\s*none|cursor:\s*not-allowed)[^"]*")([^>]*id="(?:donate-submit-btn|btn-donate-submit)")/g,
    '$2'
  );
  html = html.replace(
    /(id="(?:donate-submit-btn|btn-donate-submit)"[^>]*)(\s+style="(?:[^"]*?)(?:pointer-events:\s*none|cursor:\s*not-allowed)[^"]*")/g,
    '$1'
  );

  // Убираем !important блокировки из style
  html = html.replace(
    /style="pointer-events:none !important;opacity:0\.65 !important;cursor:not-allowed !important;"\s*/g,
    ''
  );

  // ------------------------------------------------------------------
  // 3. Добавляем onclick к кнопке если нет
  // ------------------------------------------------------------------
  if (!html.includes('TBankPayment.initiatePayment')) {
    html = html.replace(
      /(id="(?:donate-submit-btn|btn-donate-submit)")(\s*(?:type="submit")?[^>]*>)/g,
      '$1 onclick="window.TBankPayment.initiatePayment(event)"$2'
    );
    changed = true;
  }

  // Убедимся что changed=true если что-то изменилось
  const orig = fs.readFileSync(fullPath, 'utf8');
  if (html !== orig) changed = true;

  if (changed) {
    fs.writeFileSync(fullPath, html, 'utf8');
    console.log('✅ ' + file);
    totalUpdated++;
  }
}

console.log('');
console.log('Итого обновлено: ' + totalUpdated + ' файлов');
