/**
 * Скрипт: Обновление модалки пожертвования во всех HTML-файлах.
 * - Убирает purpose-radio-кнопки (shelter, jkh)
 * - Оставляет только уставную деятельность
 * - Упрощает модалку: единственное назначение + поле суммы + кнопка
 * - Добавляет юридическую формулировку (ст. 582 ГК РФ)
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const LEGAL_NOTE = `Добровольное пожертвование на ведение уставной деятельности АНО «ЦПЗ ЮГ-ПРАВО» (ст.&nbsp;582 ГК РФ, пп.&nbsp;1 п.&nbsp;2 ст.&nbsp;251 НК РФ). Пожертвования не облагаются НДС.`;

// Новая упрощённая модалка пожертвования (единственный вид — уставная деятельность)
const NEW_DONATE_MODAL = `<div id="modal-donate" class="modal-backdrop hidden" role="dialog" aria-modal="true" aria-labelledby="donate-modal-title">
  <div class="modal-container max-w-md w-full mx-auto p-6 rounded-2xl relative">
    <button class="modal-close absolute top-4 right-4 text-2xl leading-none opacity-60 hover:opacity-100 transition-opacity" onclick="window.closeModal('modal-donate')" aria-label="Закрыть">&times;</button>

    <h2 id="donate-modal-title" class="text-xl font-bold mb-1">Поддержать АНО «ЮГ-ПРАВО»</h2>
    <p class="text-sm opacity-70 mb-5 leading-relaxed">${LEGAL_NOTE}</p>

    <!-- Сумма -->
    <div class="mb-4">
      <p class="text-sm font-semibold mb-2 opacity-80">Выберите сумму пожертвования</p>
      <div class="flex flex-wrap gap-2 mb-3">
        <button class="amount-chip-btn border rounded-lg px-4 py-2 text-sm font-semibold transition-all bg-[#F8F7F4] text-[#0F2439] border-[#E0E0E0]" data-amount="100" onclick="TBankPayment.selectAmount(100)">100 ₽</button>
        <button class="amount-chip-btn border rounded-lg px-4 py-2 text-sm font-semibold transition-all bg-[#F8F7F4] text-[#0F2439] border-[#E0E0E0]" data-amount="300" onclick="TBankPayment.selectAmount(300)">300 ₽</button>
        <button class="amount-chip-btn border rounded-lg px-4 py-2 text-sm font-semibold transition-all bg-[#0F2439] text-white border-[#0F2439]" data-amount="500" onclick="TBankPayment.selectAmount(500)">500 ₽</button>
        <button class="amount-chip-btn border rounded-lg px-4 py-2 text-sm font-semibold transition-all bg-[#F8F7F4] text-[#0F2439] border-[#E0E0E0]" data-amount="1000" onclick="TBankPayment.selectAmount(1000)">1 000 ₽</button>
        <button class="amount-chip-btn border rounded-lg px-4 py-2 text-sm font-semibold transition-all bg-[#F8F7F4] text-[#0F2439] border-[#E0E0E0]" data-amount="3000" onclick="TBankPayment.selectAmount(3000)">3 000 ₽</button>
      </div>
      <div class="relative">
        <input id="donate-custom-amount" type="number" value="500" min="1" max="150000"
          class="w-full border border-[#E0E0E0] rounded-xl px-4 py-3 text-base font-semibold focus:outline-none focus:border-[#0F2439] transition-colors"
          placeholder="Или введите свою сумму"
          oninput="TBankPayment.selectedAmount = parseInt(this.value)||500" />
        <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[#0F2439] font-bold opacity-60">₽</span>
      </div>
    </div>

    <!-- Кнопка оплаты -->
    <button id="btn-donate-submit"
      class="w-full bg-[#0F2439] text-white font-semibold py-3.5 rounded-xl hover:bg-[#1a3a5c] active:scale-[0.98] transition-all text-base mt-2 flex items-center justify-center gap-2"
      onclick="TBankPayment.initiatePayment(event)">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
      Пожертвовать
    </button>

    <p class="text-xs opacity-50 text-center mt-3 leading-relaxed">
      🔒 Защищённый платёж через Т-Банк. Российские сертификаты НУЦ Минцифры.
    </p>
  </div>
</div>`;

function getAllHtmlFiles(dir) {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
      results.push(...getAllHtmlFiles(path.join(dir, item.name)));
    } else if (item.isFile() && item.name.endsWith('.html')) {
      results.push(path.join(dir, item.name));
    }
  }
  return results;
}

// Регулярка для поиска modal-donate блока (от открывающего div до закрывающего)
function replaceDonateModal(html, filePath) {
  // Находим modal-donate и заменяем
  // Паттерн: ищем <div ... id="modal-donate"...> и весь его контент до соответствующего </div>
  let changed = false;

  // Паттерн 1: ищем полный блок modal-donate с purpose-radio-btn (shelter/jkh)
  if (html.includes('purpose-radio-btn') || html.includes('selectPurpose(') ||
      (html.includes('modal-donate') && (html.includes('shelter') || html.includes('Добрая лапа') || html.includes('jkh')))) {

    // Находим начало modal-donate div
    const startMatch = html.match(/<div[^>]*id=["']modal-donate["'][^>]*>/);
    if (startMatch) {
      const startIdx = html.indexOf(startMatch[0]);
      // Найдём закрывающий тег на том же уровне вложенности
      let depth = 0;
      let i = startIdx;
      while (i < html.length) {
        if (html[i] === '<') {
          if (html.startsWith('</div', i)) {
            depth--;
            if (depth === 0) {
              const endIdx = html.indexOf('>', i) + 1;
              html = html.slice(0, startIdx) + NEW_DONATE_MODAL + html.slice(endIdx);
              changed = true;
              break;
            }
          } else if (html.startsWith('<div', i)) {
            depth++;
          }
        }
        i++;
      }
    }
  }

  return { html, changed };
}

const files = getAllHtmlFiles(ROOT);
let totalChanged = 0;

for (const filePath of files) {
  try {
    let html = fs.readFileSync(filePath, 'utf8');
    const rel = path.relative(ROOT, filePath);

    if (!html.includes('modal-donate')) continue;

    const { html: newHtml, changed } = replaceDonateModal(html, filePath);
    if (changed) {
      fs.writeFileSync(filePath, newHtml, 'utf8');
      console.log(`✅ Обновлено: ${rel}`);
      totalChanged++;
    } else {
      // Файл содержит modal-donate но без purpose-radio — уже простая версия или нет нужды менять
      console.log(`⏭️  Пропущено (нет purpose-radio): ${rel}`);
    }
  } catch (err) {
    console.error(`❌ Ошибка в ${filePath}: ${err.message}`);
  }
}

console.log('');
console.log(`✅ Итого обновлено файлов: ${totalChanged}`);
