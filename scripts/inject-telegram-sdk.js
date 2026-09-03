/**
 * Скрипт автоматического внедрения Telegram Mini App SDK во все HTML страницы сайта
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML_FILES = [
  'index.html',
  'calculator.html',
  'initiatives.html',
  'knowledge.html',
  'contacts.html',
  'services.html',
  'about.html',
  'events.html',
  'assignment-viewer.html',
  'disclosure.html',
  'doc-viewer.html',
  'privacy.html',
  'ustav.html',
  'code.html',
  'payment-success.html'
];

const SDK_TAGS = `
    <!-- Telegram Mini App SDK 7.0+ -->
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <script src="js/telegram-bridge.js" defer></script>`;

let updatedCount = 0;

for (const file of HTML_FILES) {
  const filePath = path.join(ROOT, file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf-8');

  // Проверяем, не внедрено ли уже
  if (!content.includes('telegram-web-app.js')) {
    if (content.includes('</head>')) {
      content = content.replace('</head>', `${SDK_TAGS}\n</head>`);
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Telegram Mini App SDK внедрен в: ${file}`);
      updatedCount++;
    }
  } else {
    console.log(`ℹ️ Уже содержит Telegram SDK: ${file}`);
  }
}

console.log(`\n🎉 Обработано страниц: ${updatedCount}`);
