const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// 1. Исправление initiatives.html
function fixInitiatives() {
  const filePath = path.join(ROOT, 'initiatives.html');
  let html = fs.readFileSync(filePath, 'utf8');

  // Найдем закрывающий тег </footer>
  const footerEndIdx = html.indexOf('</footer>');
  if (footerEndIdx === -1) {
    console.error('❌ Не найден </footer> в initiatives.html');
    return;
  }

  // Обрежем всё после </footer>
  const beforeFooter = html.substring(0, footerEndIdx + 9);

  // Сформируем чистые модалки
  const cleanModals = `

    <!-- ── 8. MODALS & SCRIPTS ── -->
    
    <!-- Modal: Donate (T-Bank Acquiring & Legal Donation) -->
    <div class="modal-overlay" id="modal-donate">
        <div class="modal-container p-6 sm:p-8 max-w-2xl max-h-[92vh] overflow-y-auto">
            <button class="modal-close-btn" onclick="closeModal('modal-donate')">
                <span class="material-symbols-outlined">close</span>
            </button>
            
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

            <!-- Mode Switcher Tabs -->
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

            <!-- PANEL 1: ФИЗИЧЕСКИМ ЛИЦАМ -->
            <div id="panel-person" class="space-y-4">
                <form class="space-y-4" onsubmit="return false;">
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

                    <div>
                        <label class="block text-xs font-bold uppercase tracking-wider text-[#0F2439] mb-1">
                            Электронная почта (для отправки чека и квитанции):
                        </label>
                        <input id="donate-email" type="email" placeholder="ivanov@mail.ru" class="w-full bg-[#F8F7F4] border border-[#E0E0E0] rounded-xl px-4 py-2.5 text-xs text-[#0F2439] focus:border-[#0F2439] focus:ring-0"/>
                    </div>

                    <div class="p-3 bg-[#F8F7F4] rounded-xl border border-[#E8E7E2]">
                        <label class="flex items-start gap-2.5 text-xs text-[#5f5e5e] cursor-pointer select-none">
                            <input id="donate-agree-terms" type="checkbox" required checked class="mt-0.5 rounded border-[#E0E0E0] text-[#0F2439] focus:ring-[#0F2439]"/>
                            <span>Я принимаю условия <a href="doc-viewer.html?doc=donation-offer" target="_blank" class="underline font-medium text-[#0F2439] hover:text-[#8C6826]">Публичной оферты о добровольном пожертвовании</a> и даю согласие на <a href="doc-viewer.html?doc=politika" target="_blank" class="underline font-medium text-[#0F2439] hover:text-[#8C6826]">обработку персональных данных (152-ФЗ)</a>.</span>
                        </label>
                    </div>

                    <button id="donate-submit-btn" onclick="window.TBankPayment.initiatePayment(event)" type="button" class="w-full py-4 bg-[#0F2439] text-white text-xs uppercase font-bold tracking-wider rounded-xl hover:bg-[#1e3a5f] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer button-glow">
                        <span class="material-symbols-outlined text-base">payments</span>
                        Перейти к оплате через Т-Банк / СБП →
                    </button>

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

                    <p class="text-[10px] text-center text-[#5f5e5e] pt-1">
                        💡 Жертвователи — налоговые резиденты РФ имеют право на социальный налоговый вычет по НДФЛ до 25% от дохода (ст. 219 НК РФ).
                    </p>
                </form>
            </div>

            <!-- PANEL 2: ЮРИДИЧЕСКИМ ЛИЦАМ И ИП -->
            <div id="panel-corp" class="hidden space-y-4">
                <div class="p-3.5 bg-[#FAF7F0] border border-[#E8DFC8] rounded-xl text-xs text-[#0F2439]">
                    <div class="font-bold mb-1 flex items-center gap-1.5 text-[#8C6826]">
                        <span class="material-symbols-outlined text-base">account_balance</span>
                        Налоговая льгота для юридических лиц (пп. 19.6 п. 1 ст. 265 НК РФ)
                    </div>
                    <p class="text-[11px] text-[#5f5e5e] leading-relaxed m-0">
                        Пожертвования в пользу социально ориентированных некоммерческих организаций (СО НКО) <strong>уменьшают налог на прибыль организаций</strong> в пределах 1% от выручки компании.
                    </p>
                </div>

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

                <div class="p-3 bg-white border border-[#E0E0E0] rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div class="flex items-center gap-2.5">
                        <span class="material-symbols-outlined text-[#8C6826]">description</span>
                        <div>
                            <div class="font-bold text-[#0F2439]">Типовой Договор пожертвования (ст. 582 ГК РФ)</div>
                            <div class="text-[11px] text-[#5f5e5e]">Для юристов и бухгалтерии юрлиц (DOCX/TXT)</div>
                        </div>
                    </div>
                    <a href="docs/dogovor-pozhertvovaniya-yurlicam.md" target="_blank" download class="px-3 py-1.5 bg-[#F8F7F4] hover:bg-[#0F2439] hover:text-white border border-[#E0E0E0] rounded text-[11px] font-bold transition-all flex items-center gap-1 flex-shrink-0">
                        <span class="material-symbols-outlined text-xs">download</span>
                        <span>Скачать</span>
                    </a>
                </div>

                <div class="text-[11px] font-mono text-[#2C3E50] bg-[#F8F7F4] p-3 rounded-lg border border-[#E8E7E2] leading-relaxed">
                    <strong>Получатель:</strong> АНО «ЦПЗ ЮГ-ПРАВО» | <strong>ИНН:</strong> 6317174776 | <strong>КПП:</strong> 631701001<br/>
                    <strong>Банк:</strong> АО «ТБанк» (г. Москва) | <strong>БИК:</strong> 044525974 | <strong>К/с:</strong> 30101810145250000974<br/>
                    <strong>Р/с:</strong> 40703810600000751961 | <strong>Назначение:</strong> «Добровольное пожертвование на ведение уставной деятельности. Без НДС»
                </div>
            </div>

        </div>
    </div>

    <!-- Modal: Constructor -->
    <div class="modal-overlay" id="modal-constructor">
        <div class="modal-container p-6 sm:p-8">
            <button class="modal-close-btn" onclick="closeModal('modal-constructor')" aria-label="Закрыть">
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-full bg-[#0F2439] text-[#C5A059] flex items-center justify-center">
                    <span class="material-symbols-outlined">description</span>
                </div>
                <div>
                    <h3 class="font-['Source_Serif_4'] text-xl font-bold text-[#0F2439]">Конструктор заявлений</h3>
                    <span class="text-xs text-[#8C7A5B] font-semibold uppercase tracking-wider">Правовой модуль</span>
                </div>
            </div>
            <p class="text-xs text-[#2C3E50] mb-4 leading-relaxed">Онлайн-конструктор процессуальных документов находится в финальной стадии тестирования.</p>
            <form class="space-y-3" onsubmit="event.preventDefault(); window.showToast ? window.showToast('✅ Вы успешно подписаны на уведомление о запуске!', 'success') : alert('Вы подписаны!'); closeModal('modal-constructor');">
                <div class="flex gap-2">
                    <input type="email" placeholder="Ваш e-mail" required class="flex-grow text-xs rounded border border-[#E0E0E0] px-3.5 py-2.5 bg-white text-[#0F2439] focus:border-[#C5A059] outline-none">
                    <button type="submit" class="px-5 py-2.5 bg-[#0F2439] text-white text-xs uppercase font-bold tracking-wider rounded hover:bg-[#1e3a5f] transition-all">Подписаться</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Modal: Calculator -->
    <div class="modal-overlay" id="modal-calculator">
        <div class="modal-container p-8">
            <button class="modal-close-btn" onclick="closeModal('modal-calculator')"><span class="material-symbols-outlined">close</span></button>
            <div class="flex items-center gap-3 mb-4">
                <span class="material-symbols-outlined text-3xl text-[#0F2439]">calculate</span>
                <div>
                    <h3 class="font-['Source_Serif_4'] text-2xl font-bold text-[#0F2439]">Правовой калькулятор</h3>
                    <span class="text-xs text-[#1E5631] font-bold">Сервис запущен и активен</span>
                </div>
            </div>
            <p class="text-sm text-[#2C3E50] mb-6">
                Интерактивный расчет неустоек, перерасчета платы за отопление по ПП РФ № 354, 1% и 3% по ЗоЗПП и процентов по ст. 395 ГК РФ.
            </p>
            <a href="calculator.html" class="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-[#0F2439] text-white text-xs uppercase font-bold tracking-wider rounded hover:bg-[#1e3a5f] button-glow shadow-sm">
                <span>Перейти к расчетам</span>
                <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
        </div>
    </div>

    <!-- ── MODAL: ПРОГРАММА «СТОП-КОМИССИЯ» (sud@yugpravo.ru) ── -->
    <div class="modal-overlay" id="modal-stop-commission">
        <div class="modal-container p-6 sm:p-9 max-w-4xl max-h-[90vh] overflow-y-auto">
            <button class="modal-close-btn" onclick="closeModal('modal-stop-commission')" aria-label="Закрыть">
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="flex items-center gap-3 mb-4 pb-4 border-b border-[#E8E7E2]">
                <div class="w-12 h-12 rounded-xl bg-[#0F2439] text-[#C5A059] flex items-center justify-center flex-shrink-0 shadow-md">
                    <span class="material-symbols-outlined text-2xl">account_balance</span>
                </div>
                <div>
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="text-xs font-mono font-bold text-[#8C6826] uppercase tracking-wider">Программа 01 • Код: PRG-FIN-2026</span>
                        <span class="px-2 py-0.5 rounded-full bg-[#EBF5EE] text-[#1E5631] border border-[#C8E6C9] text-[10px] font-bold uppercase font-mono">Активная работа</span>
                    </div>
                    <h3 class="font-['Source_Serif_4'] text-2xl sm:text-3xl font-bold text-[#0F2439] mt-1 leading-tight">
                        «Стоп-Комиссия: Институциональный аудит микрофинансового рынка, надзор и защита заемщиков»
                    </h3>
                </div>
            </div>

            <div class="pt-4 border-t border-[#E8E7E2]">
                <h4 class="font-['Source_Serif_4'] text-base font-bold text-[#0F2439] mb-2">
                    Передать материалы нарушений или присоединиться к проекту:
                </h4>
                <p class="text-xs text-[#5f5e5e] mb-4">
                    Материалы направляются в рабочую группу программы «Стоп-Комиссия» (e-mail: <a href="mailto:sud@yugpravo.ru" class="underline font-bold text-[#0F2439]">sud@yugpravo.ru</a>):
                </p>

                <form class="space-y-3 bg-[#FBF9F5] p-4 sm:p-5 rounded-xl border border-[#E8E0D0]" data-ajax-form data-source="Программа Стоп-Комиссия" data-alias="sud@yugpravo.ru">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" name="name" placeholder="Ваше имя / Организация *" required class="text-xs rounded border border-[#E0E0E0] px-3.5 py-2.5 bg-white text-[#0F2439] focus:border-[#C5A059] outline-none">
                        <input type="tel" name="phone" placeholder="Телефон для связи *" required class="text-xs rounded border border-[#E0E0E0] px-3.5 py-2.5 bg-white text-[#0F2439] focus:border-[#C5A059] outline-none">
                    </div>
                    <textarea name="message" rows="3" placeholder="Название МФО / Коллектора / Суть нарушения (230-ФЗ)..." required class="w-full text-xs rounded border border-[#E0E0E0] p-3 bg-white text-[#0F2439] focus:border-[#C5A059] outline-none resize-none"></textarea>
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <div class="text-[11px] text-[#5f5e5e]">
                            🔒 Конфиденциально • В рамках ФЗ № 152-ФЗ и ФЗ № 212-ФЗ
                        </div>
                        <button type="submit" class="w-full sm:w-auto px-6 py-2.5 bg-[#0F2439] text-white text-xs uppercase font-bold tracking-wider rounded hover:bg-[#1e3a5f] transition-all shadow-sm">
                            Отправить в рабочую группу →
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- ── MODAL: ПРОГРАММА «НАРОДНЫЙ АУДИТ ЖКХ» (gkh@yugpravo.ru) ── -->
    <div class="modal-overlay" id="modal-jkh-program">
        <div class="modal-container p-6 sm:p-9 max-w-4xl max-h-[90vh] overflow-y-auto">
            <button class="modal-close-btn" onclick="closeModal('modal-jkh-program')" aria-label="Закрыть">
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="flex items-center gap-3 mb-4 pb-4 border-b border-[#E8E7E2]">
                <div class="w-12 h-12 rounded-xl bg-[#0F2439] text-[#C5A059] flex items-center justify-center flex-shrink-0 shadow-md">
                    <span class="material-symbols-outlined text-2xl">home_work</span>
                </div>
                <div>
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="text-xs font-mono font-bold text-[#8C6826] uppercase tracking-wider">Программа 04 • Код: PRG-JKH-2026</span>
                        <span class="px-2 py-0.5 rounded-full bg-[#EBF5EE] text-[#1E5631] border border-[#C8E6C9] text-[10px] font-bold uppercase font-mono">ЖКХ & Общественный контроль</span>
                    </div>
                    <h3 class="font-['Source_Serif_4'] text-2xl sm:text-3xl font-bold text-[#0F2439] mt-1 leading-tight">
                        «Народный аудит ЖКХ: Общественный контроль, прозрачность УК и перерасчеты»
                    </h3>
                </div>
            </div>

            <div class="pt-4 border-t border-[#E8E7E2]">
                <h4 class="font-['Source_Serif_4'] text-base font-bold text-[#0F2439] mb-2">
                    Сообщить о проблеме в ЖКХ / Присоединиться к Совету домов:
                </h4>
                <p class="text-xs text-[#5f5e5e] mb-4">
                    Обращение направляется в отдел жилищного права и аудита (e-mail: <a href="mailto:gkh@yugpravo.ru" class="underline font-bold text-[#0F2439]">gkh@yugpravo.ru</a>):
                </p>

                <form class="space-y-3 bg-[#FBF9F5] p-4 sm:p-5 rounded-xl border border-[#E8E0D0]" data-ajax-form data-source="Программа Народный аудит ЖКХ" data-alias="gkh@yugpravo.ru">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" name="name" placeholder="Ваше имя и фамилия *" required class="text-xs rounded border border-[#E0E0E0] px-3.5 py-2.5 bg-white text-[#0F2439] focus:border-[#C5A059] outline-none">
                        <input type="tel" name="phone" placeholder="Телефон для связи *" required class="text-xs rounded border border-[#E0E0E0] px-3.5 py-2.5 bg-white text-[#0F2439] focus:border-[#C5A059] outline-none">
                    </div>
                    <input type="text" placeholder="Адрес (улица, дом, подъезд) и название УК *" required class="w-full text-xs rounded border border-[#E0E0E0] px-3.5 py-2.5 bg-white text-[#0F2439] focus:border-[#C5A059] outline-none">
                    <textarea name="message" rows="3" placeholder="Опишите суть вопроса (холодные батареи, завышенные сметы, протечки, грязь)..." required class="w-full text-xs rounded border border-[#E0E0E0] p-3 bg-white text-[#0F2439] focus:border-[#C5A059] outline-none resize-none"></textarea>
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <div class="text-[11px] text-[#5f5e5e]">
                            🔒 Бесплатная правовая поддержка для жителей Южного города (212-ФЗ)
                        </div>
                        <button type="submit" class="w-full sm:w-auto px-6 py-2.5 bg-[#0F2439] text-white text-xs uppercase font-bold tracking-wider rounded hover:bg-[#1e3a5f] transition-all shadow-sm">
                            Отправить в отдел ЖКХ →
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- ── MODAL: ПРОГРАММА «ШКОЛА ПРАВА И ВОЛОНТЁРСТВА» (idea@yugpravo.ru) ── -->
    <div class="modal-overlay" id="modal-youth-legal">
        <div class="modal-container p-6 sm:p-9 max-w-4xl max-h-[90vh] overflow-y-auto">
            <button class="modal-close-btn" onclick="closeModal('modal-youth-legal')" aria-label="Закрыть">
                <span class="material-symbols-outlined">close</span>
            </button>
            <div class="flex items-center gap-3 mb-4 pb-4 border-b border-[#E8E7E2]">
                <div class="w-12 h-12 rounded-xl bg-[#0F2439] text-[#C5A059] flex items-center justify-center flex-shrink-0 shadow-md">
                    <span class="material-symbols-outlined text-2xl">school</span>
                </div>
                <div>
                    <div class="flex flex-wrap items-center gap-2">
                        <span class="text-xs font-mono font-bold text-[#8C6826] uppercase tracking-wider">Программа 05 • Код: PRG-VOL-2026</span>
                        <span class="px-2 py-0.5 rounded-full bg-[#EBF5EE] text-[#1E5631] border border-[#C8E6C9] text-[10px] font-bold uppercase font-mono">Просвещение & Добро.рф</span>
                    </div>
                    <h3 class="font-['Source_Serif_4'] text-2xl sm:text-3xl font-bold text-[#0F2439] mt-1 leading-tight">
                        «Школа Права и Волонтёрства: Уроки в школах, часы Добро.рф и баллы к ЕГЭ»
                    </h3>
                </div>
            </div>

            <div class="pt-4 border-t border-[#E8E7E2]">
                <h4 class="font-['Source_Serif_4'] text-base font-bold text-[#0F2439] mb-2">
                    Записаться в волонтёрский корпус / Пригласить юриста в школу:
                </h4>
                <p class="text-xs text-[#5f5e5e] mb-4">
                    Заявки обрабатываются координатором молодёжных программ (e-mail: <a href="mailto:idea@yugpravo.ru" class="underline font-bold text-[#0F2439]">idea@yugpravo.ru</a>):
                </p>

                <form class="space-y-3 bg-[#FBF9F5] p-4 sm:p-5 rounded-xl border border-[#E8E0D0]" data-ajax-form data-source="Школа Права и Волонтерство" data-alias="idea@yugpravo.ru">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" name="name" placeholder="Ваше имя и фамилия *" required class="text-xs rounded border border-[#E0E0E0] px-3.5 py-2.5 bg-white text-[#0F2439] focus:border-[#C5A059] outline-none">
                        <input type="tel" name="phone" placeholder="Телефон / Telegram *" required class="text-xs rounded border border-[#E0E0E0] px-3.5 py-2.5 bg-white text-[#0F2439] focus:border-[#C5A059] outline-none">
                    </div>
                    <input type="text" placeholder="Школа / Класс / Статус (Школьник, Родитель, Педагог) *" required class="w-full text-xs rounded border border-[#E0E0E0] px-3.5 py-2.5 bg-white text-[#0F2439] focus:border-[#C5A059] outline-none">
                    <textarea name="message" rows="2" placeholder="ID на Добро.рф (если есть) или пожелания по теме урока..." class="w-full text-xs rounded border border-[#E0E0E0] p-3 bg-white text-[#0F2439] focus:border-[#C5A059] outline-none resize-none"></textarea>
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <div class="text-[11px] text-[#5f5e5e]">
                            🔒 Регистрация в соответствии с ФЗ № 135-ФЗ и ФЗ № 152-ФЗ
                        </div>
                        <button type="submit" class="w-full sm:w-auto px-6 py-2.5 bg-[#0F2439] text-white text-xs uppercase font-bold tracking-wider rounded hover:bg-[#1e3a5f] transition-all shadow-sm">
                            Отправить заявку куратору →
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="js/effects.js?v=20260901_live7"></script>
    <script src="js/main.js?v=20260901_live7"></script>
    <script src="js/forms.js?v=20260901_live7"></script>

</body>
</html>`;

  fs.writeFileSync(filePath, beforeFooter + cleanModals, 'utf8');
  console.log('✅ Исправлен initiatives.html (удалены дубликаты, восстановлена структура)');
}

fixInitiatives();
