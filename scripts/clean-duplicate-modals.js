const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// Clean canonical donate modal markup
const getCanonicalDonateModal = (isSubfolder = false) => {
  const prefix = isSubfolder ? '../' : '';
  return `
    <!-- ── T-BANK ACQUIRING & LEGALTECH DONATION MODAL (ФИЗЛИЦА + ЮРЛИЦА) ── -->
    <div class="modal-overlay" id="modal-donate">
        <div class="modal-container p-6 sm:p-8 max-w-2xl max-h-[92vh] overflow-y-auto">
            <button class="modal-close-btn" onclick="closeModal('modal-donate')">
                <span class="material-symbols-outlined">close</span>
            </button>
            
            <!-- Modal Header -->
            <div class="flex items-center gap-2 mb-2">
                <span class="px-2.5 py-0.5 rounded-full bg-[#FAF4E6] text-[#8C6826] border border-[#E8DCC0] text-[10px] font-bold uppercase font-mono">
                    Т-Банк • Эквайринг & СБП • 0% комиссии
                </span>
                <span class="text-[10px] font-mono text-[#5f5e5e]">ст. 582 ГК РФ</span>
            </div>

            <h3 class="font-['Source_Serif_4'] text-2xl sm:text-3xl font-bold text-[#0F2439] mb-1.5 leading-tight">
                Поддержать АНО «ЮГ-ПРАВО»
            </h3>
            
            <p class="text-xs text-[#5f5e5e] mb-4 leading-relaxed">
                Официальное благотворительное пожертвование на ведение уставной некоммерческой деятельности социально ориентированной организации в Самарской области.
            </p>

            <!-- Mode Switcher Tabs (Физлица / Юрлица) -->
            <div class="flex p-1 bg-[#F0EFEA] rounded-xl mb-5 border border-[#E0E0E0]">
                <button type="button" id="tab-btn-person" onclick="window.TBankPayment.switchTab('person')" class="flex-1 py-2 text-xs font-bold rounded-lg transition-all shadow-xs bg-[#0F2439] text-white flex items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-sm">person</span>
                    <span>Гражданам (СБП / Карты)</span>
                </button>
                <button type="button" id="tab-btn-corp" onclick="window.TBankPayment.switchTab('corp')" class="flex-1 py-2 text-xs font-bold rounded-lg transition-all text-[#5f5e5e] hover:text-[#0F2439] flex items-center justify-center gap-1.5">
                    <span class="material-symbols-outlined text-sm">business</span>
                    <span>Организациям и ИП (Счёт)</span>
                </button>
            </div>

            <!-- ── PANEL 1: ФИЗИЧЕСКИМ ЛИЦАМ ── -->
            <div id="panel-person" class="space-y-4">
                <form class="space-y-4" onsubmit="return false;">
                    
                    <!-- Amount Selector -->
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <label class="text-xs font-bold uppercase tracking-wider text-[#0F2439]">
                                Выберите сумму пожертвования:
                            </label>
                            <span class="text-[11px] text-[#1E5631] font-semibold flex items-center gap-1">
                                <span class="material-symbols-outlined text-xs">savings</span>
                                Без комиссии (0%)
                            </span>
                        </div>
                        <div class="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-2.5">
                            <button type="button" class="amount-chip-btn py-2 px-2 border border-[#E0E0E0] bg-[#F8F7F4] rounded-lg text-xs font-bold text-[#0F2439] hover:border-[#0F2439] transition-all" data-amount="300" onclick="window.TBankPayment.selectAmount(300)">300 ₽</button>
                            <button type="button" class="amount-chip-btn py-2 px-2 border border-[#0F2439] bg-[#0F2439] text-white rounded-lg text-xs font-bold hover:border-[#0F2439] transition-all" data-amount="500" onclick="window.TBankPayment.selectAmount(500)">500 ₽</button>
                            <button type="button" class="amount-chip-btn py-2 px-2 border border-[#E0E0E0] bg-[#F8F7F4] rounded-lg text-xs font-bold text-[#0F2439] hover:border-[#0F2439] transition-all" data-amount="1000" onclick="window.TBankPayment.selectAmount(1000)">1 000 ₽</button>
                            <button type="button" class="amount-chip-btn py-2 px-2 border border-[#E0E0E0] bg-[#F8F7F4] rounded-lg text-xs font-bold text-[#0F2439] hover:border-[#0F2439] transition-all" data-amount="3000" onclick="window.TBankPayment.selectAmount(3000)">3 000 ₽</button>
                            <button type="button" class="amount-chip-btn col-span-4 sm:col-span-1 py-2 px-2 border border-[#E0E0E0] bg-[#F8F7F4] rounded-lg text-xs font-bold text-[#0F2439] hover:border-[#0F2439] transition-all" data-amount="5000" onclick="window.TBankPayment.selectAmount(5000)">5 000 ₽</button>
                        </div>
                        
                        <div class="relative">
                            <input id="donate-custom-amount" type="number" min="10" value="500" class="w-full bg-[#F8F7F4] border border-[#E0E0E0] rounded-xl px-4 py-3 text-sm font-bold text-[#0F2439] focus:border-[#0F2439] focus:ring-0 pl-4 pr-14" placeholder="Своя сумма"/>
                            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5f5e5e]">РУБ</span>
                        </div>
                    </div>

                    <!-- Email for receipt -->
                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-[#0F2439] mb-1">
                            Электронная почта (для отправки чека и квитанции):
                        </label>
                        <input id="donate-email" type="email" placeholder="ivanov@mail.ru" class="w-full bg-[#F8F7F4] border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-xs text-[#0F2439] focus:border-[#0F2439] focus:ring-0"/>
                    </div>

                    <!-- Legal Terms Checkbox -->
                    <div class="p-3 bg-[#F8F7F4] rounded-xl border border-[#E8E7E2]">
                        <label class="flex items-start gap-2.5 text-xs text-[#5f5e5e] cursor-pointer select-none">
                            <input id="donate-agree-terms" type="checkbox" required checked class="mt-0.5 rounded border-[#E0E0E0] text-[#0F2439] focus:ring-[#0F2439]"/>
                            <span>Я принимаю условия <a href="${prefix}doc-viewer.html?doc=donation-offer" target="_blank" class="underline font-medium text-[#0F2439] hover:text-[#8C6826]">Публичной оферты о добровольном пожертвовании</a> и даю согласие на <a href="${prefix}doc-viewer.html?doc=politika" target="_blank" class="underline font-medium text-[#0F2439] hover:text-[#8C6826]">обработку персональных данных (152-ФЗ)</a>.</span>
                        </label>
                    </div>

                    <!-- Submit Button -->
                    <button id="donate-submit-btn" onclick="window.TBankPayment.initiatePayment(event)" type="button" class="w-full py-4 bg-[#0F2439] text-white text-xs uppercase font-bold tracking-wider rounded-xl hover:bg-[#1e3a5f] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer button-glow">
                        <span class="material-symbols-outlined text-base">payments</span>
                        Перейти к оплате через Т-Банк / СБП →
                    </button>

                    <!-- Methods Badges -->
                    <div class="pt-2 border-t border-[#E8E7E2] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-[#5f5e5e] font-mono">
                        <span class="flex items-center gap-1 text-emerald-800 font-bold"><span class="w-1.5 h-1.5 rounded-full bg-[#1E5631]"></span> СБП (в 1 клик)</span>
                        <span>•</span>
                        <span>T-Pay</span>
                        <span>•</span>
                        <span>SberPay</span>
                        <span>•</span>
                        <span>МИР / Visa / MC</span>
                        <span>•</span>
                        <span class="text-[#8C6826]">Без НДС (ст. 251 НК РФ)</span>
                    </div>

                    <!-- Tax Deduct Note -->
                    <p class="text-[10px] text-center text-[#5f5e5e] pt-1">
                        💡 Жертвователи — налоговые резиденты РФ имеют право на социальный налоговый вычет по НДФЛ до 25% от дохода (ст. 219 НК РФ).
                    </p>
                </form>
            </div>

            <!-- ── PANEL 2: ЮРИДИЧЕСКИМ ЛИЦАМ И ИП ── -->
            <div id="panel-corp" class="hidden space-y-4">
                
                <!-- Tax benefit notice for companies -->
                <div class="p-3.5 bg-[#FAF7F0] border border-[#E8DFC8] rounded-xl text-xs text-[#0F2439]">
                    <div class="font-bold mb-1 flex items-center gap-1.5 text-[#8C6826]">
                        <span class="material-symbols-outlined text-base">account_balance</span>
                        Налоговая льгота для юридических лиц (пп. 19.6 п. 1 ст. 265 НК РФ)
                    </div>
                    <p class="text-[11px] text-[#5f5e5e] leading-relaxed m-0">
                        Пожертвования в пользу социально ориентированных некоммерческих организаций (СО НКО) <strong>уменьшают налог на прибыль организаций</strong> в пределах 1% от выручки компании.
                    </p>
                </div>

                <!-- Instant Invoice Generator Form -->
                <div class="p-4 bg-[#F8F7F4] rounded-xl border border-[#E0E0E0] space-y-3">
                    <h4 class="font-bold text-xs uppercase tracking-wider text-[#0F2439] flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-sm text-[#0F2439]">receipt_long</span>
                        Сформировать Счёт-оферту на оплату (от 3 000 ₽)
                    </h4>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[11px] font-bold text-[#0F2439] mb-1">ИНН организации / ИП:</label>
                            <input id="corp-inn" type="text" placeholder="6317000000" class="w-full bg-white border border-[#E0E0E0] rounded-lg px-3 py-2 text-xs text-[#0F2439] font-mono focus:border-[#0F2439]"/>
                        </div>
                        <div>
                            <label class="block text-[11px] font-bold text-[#0F2439] mb-1">Сумма пожертвования (₽):</label>
                            <input id="corp-amount" type="number" min="500" value="5000" step="500" class="w-full bg-white border border-[#E0E0E0] rounded-lg px-3 py-2 text-xs font-bold text-[#0F2439] font-mono focus:border-[#0F2439]"/>
                        </div>
                    </div>

                    <div>
                        <label class="block text-[11px] font-bold text-[#0F2439] mb-1">Наименование компании (плательщика):</label>
                        <input id="corp-name" type="text" placeholder="ООО «Название Компании»" class="w-full bg-white border border-[#E0E0E0] rounded-lg px-3 py-2 text-xs text-[#0F2439] focus:border-[#0F2439]"/>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-2 pt-1">
                        <button type="button" onclick="window.CorporateDonation.generateInvoice()" class="flex-1 py-2.5 px-4 bg-[#0F2439] text-white text-xs font-bold uppercase rounded-lg hover:bg-[#1e3a5f] transition-all flex items-center justify-center gap-1.5 shadow-sm">
                            <span class="material-symbols-outlined text-sm">print</span>
                            <span>Сформировать счёт (PDF / Печать)</span>
                        </button>
                        <button type="button" onclick="window.CorporateDonation.copyRequisites()" class="py-2.5 px-4 bg-white border border-[#E0E0E0] text-[#0F2439] text-xs font-bold rounded-lg hover:bg-[#F0EFEA] transition-all flex items-center justify-center gap-1.5 shadow-xs">
                            <span class="material-symbols-outlined text-sm">content_copy</span>
                            <span>Скопировать реквизиты</span>
                        </button>
                    </div>
                </div>

                <!-- Contract Download for Legal Dept -->
                <div class="p-3 bg-white border border-[#E0E0E0] rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div class="flex items-center gap-2.5">
                        <span class="material-symbols-outlined text-[#8C6826]">description</span>
                        <div>
                            <div class="font-bold text-[#0F2439]">Типовой Договор пожертвования (ст. 582 ГК РФ)</div>
                            <div class="text-[11px] text-[#5f5e5e]">Для юристов и бухгалтерии юрлиц (DOCX/TXT)</div>
                        </div>
                    </div>
                    <a href="${prefix}docs/dogovor-pozhertvovaniya-yurlicam.md" target="_blank" download class="px-3 py-1.5 bg-[#F8F7F4] hover:bg-[#0F2439] hover:text-white border border-[#E0E0E0] rounded text-[11px] font-bold transition-all flex items-center gap-1 flex-shrink-0">
                        <span class="material-symbols-outlined text-xs">download</span>
                        <span>Скачать</span>
                    </a>
                </div>

                <!-- Direct Requisites Accordion -->
                <div class="text-[11px] font-mono text-[#2C3E50] bg-[#F8F7F4] p-3 rounded-lg border border-[#E8E7E2] leading-relaxed">
                    <strong>Получатель:</strong> АНО «ЦПЗ ЮГ-ПРАВО» | <strong>ИНН:</strong> 6317174776 | <strong>КПП:</strong> 631701001<br/>
                    <strong>Банк:</strong> АО «ТБанк» (г. Москва) | <strong>БИК:</strong> 044525974 | <strong>К/с:</strong> 30101810145250000974<br/>
                    <strong>Р/с:</strong> 40703810600000751961 | <strong>Назначение:</strong> «Добровольное пожертвование на ведение уставной деятельности. Без НДС»
                </div>
            </div>

        </div>
    </div>
`;
};

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

const allFiles = getAllHtmlFiles(rootDir);
console.log(`Found ${allFiles.length} HTML files to inspect and clean.`);

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const isSubfolder = path.relative(rootDir, file).includes(path.sep);

  const modalDonateIndex = content.indexOf('id="modal-donate"');
  
  if (modalDonateIndex !== -1) {
    const overlayStartRegex = /<!--\s*──\s*T-BANK[\s\S]*?-->\s*<div class="modal-overlay"[^>]*id="modal-donate"[^>]*>|<div class="modal-overlay"[^>]*id="modal-donate"[^>]*>/i;
    const match = content.match(overlayStartRegex);
    
    if (match) {
      const matchPos = content.indexOf(match[0]);
      const beforeModal = content.slice(0, matchPos);

      const afterContent = content.slice(matchPos);
      
      const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
      const scripts = afterContent.match(scriptRegex) || [];
      
      const uniqueScripts = [];
      const seenSrc = new Set();
      scripts.forEach(s => {
        const srcMatch = s.match(/src="([^"]+)"/);
        const key = srcMatch ? srcMatch[1] : s;
        if (!seenSrc.has(key)) {
          seenSrc.add(key);
          uniqueScripts.push(s);
        }
      });

      const cleanModal = getCanonicalDonateModal(isSubfolder);
      const scriptsBlock = uniqueScripts.length > 0 
        ? '\n    ' + uniqueScripts.join('\n    ') + '\n' 
        : `
    <script src="${isSubfolder ? '../' : ''}js/effects.js?v=20260901_live7"></script>
    <script src="${isSubfolder ? '../' : ''}js/main.js?v=20260901_live7"></script>
    <script src="https://securepay.tinkoff.ru/html/payForm/js/tinkoff_v2.js"></script>
`;

      const newContent = beforeModal.trimEnd() + '\n' + cleanModal + '\n' + scriptsBlock + '</body>\n</html>\n';
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`✅ Cleaned duplicates in: ${path.relative(rootDir, file)}`);
    }
  }
});

console.log('🎉 Cleanup complete!');
