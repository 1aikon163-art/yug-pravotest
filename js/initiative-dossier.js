/**
 * ЮГ-ПРАВО LegalTech — Интерактивные паспорта программ и инициатив
 * Единый модуль для index.html, initiatives.html и всех разделов платформы
 */

window.INITIATIVE_DATABASE = {
  'stop_commission': {
    code: 'PRG-FIN-2026',
    statusBadge: 'Активная работа • Доклады в ведомства',
    statusColor: 'bg-[#EBF5EE] text-[#1E5631] border-[#C8E6C9]',
    category: 'Программа 01 • ФЗ № 230-ФЗ • ст. 37 ЗоЗПП',
    title: '«Стоп-Комиссия: Законотворческий надзор и защита заемщиков»',
    subtitle: 'Комплексный юридический аудит кредитного рынка, скрытых комиссий и спам-роботов взыскателей',
    desc: 'В рамках программы юристы АНО «ЦПЗ ЮГ-ПРАВО» осуществляют постоянный правовой мониторинг и фиксацию нарушений Федерального закона № 230-ФЗ со стороны микрофинансовых организаций (МФО) и профессиональных коллекторских агентств (ПКО). Подготавливаются и направляются доказательные доклады в Центральный аппарат ФССП России, Банк России и органы Прокуратуры для привлечения нарушителей по ст. 14.57 КоАП РФ, а также формулируются законодательные предложения в Государственную Думу РФ.',
    goals: [
      'Пресечение психологического давления и спам-автодозвонов с подменных номеров.',
      'Возврат гражданам 100% средств за скрытые навязанные страховки и телемедицинские сертификаты в 30-дневный «период охлаждения».',
      'Заключение некоммерческих соглашений о сотрудничестве с УФССП по Самарской области и Общественными советами.',
      'Внесение пакета выверенных поправок в Федеральный закон № 230-ФЗ и ст. 14.57 КоАП РФ.'
    ],
    modules: [
      'Блок 1: Анализ обращений заемщиков, фиксация аудиозаписей звонков роботов и детализаций операторов связи.',
      'Блок 2: Подача официальных заявлений в УФССП с расчетом штрафов (от 500 000 до 2 000 000 ₽ на юрлицо).',
      'Блок 3: Отзыв согласий на взаимодействие с работодателями и родственниками должника.',
      'Блок 4: Экспертная аналитика и передача материалов в Службу по защите прав потребителей Банка России.'
    ],
    npa: [
      { title: '230-ФЗ (в ред. 467-ФЗ)', desc: 'Ограничения частоты звонков, смс и запрет ночных контактов' },
      { title: 'Статья 14.57 КоАП РФ', desc: 'Административные штрафы за нарушения при взыскании долгов' },
      { title: 'Закон РФ «О защите прав потребителей» (ст. 16, 37)', desc: 'Запрет навязанных платных сервисов' },
      { title: '353-ФЗ «О потребительском кредите»', desc: '30-дневный период охлаждения для возврата страховок' }
    ],
    directionValue: 'fin'
  },
  'digital_law': {
    code: 'PRG-TECH-2026',
    statusBadge: 'Активная разработка • LegalTech & AI',
    statusColor: 'bg-[#EBF5EE] text-[#1E5631] border-[#C8E6C9]',
    category: 'Программа 02 • ФЗ № 149-ФЗ • ФЗ № 152-ФЗ',
    title: '«Цифровое Право: LegalTech-платформа, единая сеть и внедрение ИИ»',
    subtitle: 'Развитие омниканальной цифровой экосистемы бесплатной правовой помощи с ИИ-маршрутизацией',
    desc: 'Цель программы — устранить цифровое неравенство и сделать качественную процессуальную защиту доступной каждому жителю РФ бесплатно. Система объединяет официальный портал yugpravo.ru, сообщества в VK, ботов Telegram и отечественные языковые модели (GigaChat / YandexGPT) для автоматизированного расчета госпошлин, неустоек и моментальной генерации юридически безупречных претензий.',
    goals: [
      'Автоматизация процессуальных расчетов (калькуляторы неустоек, ст. 395 ГК РФ, госпошлины по 259-ФЗ).',
      'Омниканальная интеграция: подача обращений через веб, Telegram Mini Apps и социальные сети.',
      'Внедрение российских нейросетей для предварительной правовой классификации жалоб граждан.',
      '100% суверенная локализация персональных данных в РФ с защитой по ГОСТ Р 34.12-2015.'
    ],
    modules: [
      'Модуль 1: Интерактивный комплекс «Правовой калькулятор» (8 процессуальных калькуляторов онлайн).',
      'Модуль 2: Telegram Mini App шлюз с тактильным откликом и быстрой отправкой обращений.',
      'Модуль 3: Автоматический генератор судебных документов в форматах Microsoft Word (.DOCX) и PDF.',
      'Модуль 4: Интеллектуальный помощник правового просвещения на базе отечественных ИИ-моделей.'
    ],
    npa: [
      { title: '149-ФЗ «Об информации и защите информации»', desc: 'Стандарты доступности и надежности цифровых сервисов' },
      { title: '152-ФЗ «О персональных данных»', desc: 'Локализация баз данных в РФ и защита прав субъектов' },
      { title: 'Указ Президента РФ № 490', desc: 'Развитие искусственного интеллекта в Российской Федерации' },
      { title: 'ГОСТ Р 34.12-2015', desc: 'Криптографическая защита информации и протоколы TLS' }
    ],
    directionValue: 'tech'
  },
  'dog_park': {
    code: 'PRG-DOG-2026',
    statusBadge: 'Гражданская инициатива • Южный город',
    statusColor: 'bg-[#FAF4E6] text-[#8C6826] border-[#E8DCC0]',
    category: 'Программа 03 • ФЗ № 498-ФЗ, ст. 13 • СП 42.13330',
    title: '«Среда для людей и питомцев: Площадки для выгула собак в Южном городе»',
    subtitle: 'Инициативный проект по согласованию участков, установке снарядов и созданию цивилизованной городской среды',
    desc: 'В густонаселенном микрорайоне Южный город (Юг-1 и Юг-2) проживают тысячи владельцев собак, однако специализированные огороженные площадки для тренировок и выгула отсутствуют. АНО «ЦПЗ ЮГ-ПРАВО» формирует правовой пакет документов для Администрации Волжского района и девелопера «Древо» для выделения земельных участков, строительства площадок с безопасным покрытием и снарядами, установки дог-боксов и реализации волонтерских эко-субботников.',
    goals: [
      'Сбор не менее 1 000 верифицированных подписей жителей Южного города в поддержку проекта.',
      'Согласование размещения 2 огороженных площадок с соблюдением санитарных норм СП 42.13330.',
      'Установка специализированных урн (дог-боксов) с биоразлагаемыми пакетами в прогулочных зонах.',
      'Включение проекта в региональную программу поддержки местных инициатив «СОдействие».'
    ],
    modules: [
      'Этап 1: Разработка предпроектных схем локаций с учетом подземных коммуникаций.',
      'Этап 2: Сбор подписей жителей и проведение публичных слушаний.',
      'Этап 3: Круглый стол с Администрацией с.п. Лопатино, застройщиком и управляющими компаниями.',
      'Этап 4: Монтаж ограждений (2 м), освещения, барьеров и организация волонтёрских эко-дней.'
    ],
    npa: [
      { title: '498-ФЗ «Об ответственном обращении с животными»', desc: 'Статья 13: обязанность ОМСУ определять места выгула' },
      { title: 'Свод правил СП 42.13330.2016', desc: 'Градостроительные нормативы проектирования площадок' },
      { title: '131-ФЗ «Об общих принципах организации МСУ»', desc: 'Инициативные проекты жителей и общественный контроль' },
      { title: 'Программа «СОдействие»', desc: 'Губернаторский проект поддержки общественных инициатив' }
    ],
    directionValue: 'dog_park'
  },
  'jkh_program': {
    code: 'PRG-JKH-2026',
    statusBadge: 'Защита прав & Просвещение • Южный город',
    statusColor: 'bg-[#FAF4E6] text-[#8C6826] border-[#E8DCC0]',
    category: 'Программа 04 • ФЗ № 212-ФЗ • ПП РФ № 354 • ЖК РФ',
    title: '«Грамотное ЖКХ: Защита прав жителей, прозрачность УК и контроль услуг»',
    subtitle: 'Комплексный общественный аудит отчетов в ГИС ЖКХ, перерасчеты за некачественные услуги и поддержка Советов домов',
    desc: 'Программа направлена на повышение правовой грамотности собственников квартир, проверку прозрачности управляющих организаций и защиту интересов жителей. Юристы и эксперты центра проводят ревизии смет текущего ремонта, помогают составлять акты непредоставления коммунальных услуг и добиваются снижения платы по Постановлению Правительства РФ № 354.',
    goals: [
      'Анализ финансовых отчетов УК в ГИС ЖКХ за 3 года по проблемным домам района.',
      'Проведение независимых осмотров общего имущества домов (кровли, подвалы, лифты) с фотофиксацией.',
      'Обучение председателей Советов многоквартирных домов правилам приемки работ по формам КС-2/КС-3.',
      'Составление и подача жалоб в ГЖИ Самарской области, Прокуратуру и судебные иски по защите прав потребителей.'
    ],
    modules: [
      'Направление 1: Юридический разбор квитанций и перерасчеты за тепло, воду и ОДН.',
      'Направление 2: Документарный аудит выполнения плана текущего ремонта многоквартирного дома.',
      'Направление 3: Сопровождение очно-заочных Общих собраний собственников (ОСС).',
      'Направление 4: Пресечение незаконных перепланировок и захвата общего имущества.'
    ],
    npa: [
      { title: 'Постановление Правительства РФ № 354', desc: 'Правила предоставления коммунальных услуг и перерасчетов' },
      { title: 'Жилищный кодекс РФ (ст. 161, 162)', desc: 'Обязанности управляющей компании по содержанию МКД' },
      { title: '212-ФЗ «Об общественном контроле в РФ»', desc: 'Право НКО на проверки, рейды и общественные экспертизы' },
      { title: 'Постановление Правительства РФ № 290', desc: 'Минимальный перечень услуг и работ по содержанию дома' }
    ],
    directionValue: 'jkh'
  },
  'youth_legal': {
    code: 'PRG-VOL-2026',
    statusBadge: 'Правовое просвещение & Добро.рф',
    statusColor: 'bg-[#FAF4E6] text-[#8C6826] border-[#E8DCC0]',
    category: 'Программа 05 • ФЗ № 135-ФЗ «О волонтерстве» • ФЗ № 273-ФЗ',
    title: '«Школа Права и Волонтёрства: Правовые уроки, часы Добро.рф и баллы к ЕГЭ»',
    subtitle: 'Серия внеклассных правовых практикумов для школьников и молодежи, верификация волонтерских часов и развитие актива',
    desc: 'Правовое просвещение молодежи Южного города и Самарской области: интерактивные уроки по защите от вовлечения в мошеннические схемы (дропперство по ст. 187 УК РФ), грамотное заключение первого трудового договора (ст. 63 ТК РФ), защита прав покупателя в интернете. Вовлечение ребят в социально полезные проекты с начислением верифицированных часов в ЕИС Добро.рф, дающих до +10 дополнительных баллов к ЕГЭ при поступлении в ведущие вузы России.',
    goals: [
      'Проведение серии открытых интерактивных уроков в ГБОУ СО ОЦ «Южный город».',
      'Обучение старшеклассников финансовой гигиене и превенция преступлений в сфере платежных карт.',
      'Официальное начисление верифицированных волонтерских часов через Добро.рф.',
      'Организация экскурсий в судебные органы и юридические факультеты для профориентации.'
    ],
    modules: [
      'Урок 1: Кибербезопасность — почему нельзя передавать свою карту третьим лицам (ст. 187 УК РФ, 369-ФЗ).',
      'Урок 2: Трудовые права несовершеннолетних — испытательный срок, зарплата и защита от обмана.',
      'Урок 3: Потребительская грамотность — возврат товаров, покупки на маркетплейсах и отказ от подписок.',
      'Урок 4: Волонтёрство — регистрация на Добро.рф, участие в проектах «Добрая лапа» и эко-акциях.'
    ],
    npa: [
      { title: '135-ФЗ «О благотворительности и волонтерстве»', desc: 'Правовой статус волонтёров и учет добровольческих часов' },
      { title: '273-ФЗ «Об образовании в РФ»', desc: 'Учет индивидуальных достижений и волонтерства при поступлении' },
      { title: 'Уголовный кодекс РФ (ст. 187 УК)', desc: 'Ответственность за неправомерный оборот средств платежей' },
      { title: 'Трудовой кодекс РФ (гл. 42)', desc: 'Особенности регулирования труда работников до 18 лет' }
    ],
    directionValue: 'youth'
  }
};

let currentInitiativeKey = 'stop_commission';

function ensureInitiativeModalDOM() {
  if (document.getElementById('modal-initiative-dossier')) return;

  const modalHtml = `
    <div class="modal-overlay" id="modal-initiative-dossier" style="display:none; position:fixed; inset:0; z-index:99999; background:rgba(15,36,57,0.7); backdrop-filter:blur(6px); align-items:center; justify-content:center; padding:16px;">
        <div class="modal-container p-6 sm:p-8 max-w-2xl max-h-[92vh] overflow-y-auto w-full relative" style="border:1px solid #C5A059; border-radius:20px; background:#ffffff; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);">
            <button class="modal-close-btn absolute top-4 right-4 text-[#5f5e5e] hover:text-[#0F2439] p-2 cursor-pointer bg-transparent border-none" onclick="window.closeModal('modal-initiative-dossier')">
                <span class="material-symbols-outlined text-2xl">close</span>
            </button>

            <!-- Top Header Badges -->
            <div class="flex flex-wrap items-center gap-2 mb-3">
                <span id="init-dossier-status-badge" class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border">
                    Активная работа
                </span>
                <span id="init-dossier-code" class="px-2.5 py-0.5 rounded-full bg-[#FAF4E6] text-[#8C6826] border border-[#E8DCC0] text-[10px] font-mono font-bold uppercase">
                    PRG-FIN-2026
                </span>
                <span id="init-dossier-category" class="text-[11px] font-mono text-[#5f5e5e]">
                    Уставная программа
                </span>
            </div>

            <!-- Title & Subtitle -->
            <h3 id="init-dossier-title" class="font-['Source_Serif_4'] text-2xl sm:text-3xl font-bold text-[#0F2439] mb-2 leading-tight">
                Название инициативы
            </h3>
            <p id="init-dossier-subtitle" class="text-xs sm:text-sm text-[#8C6826] font-medium mb-5">
                Краткое описание направления
            </p>

            <!-- Procedural Description -->
            <div class="p-4 rounded-xl bg-[#F8F7F4] border border-[#E8E7E2] mb-5 text-xs sm:text-sm text-[#2C3E50] leading-relaxed">
                <p id="init-dossier-desc" class="m-0"></p>
            </div>

            <!-- Goals Box -->
            <div class="mb-5">
                <h4 class="font-['Source_Serif_4'] font-bold text-sm text-[#0F2439] mb-2.5 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-base text-[#8C6826]">flag</span>
                    <span>Ключевые цели и результаты:</span>
                </h4>
                <div id="init-dossier-goals" class="space-y-2 text-xs text-[#2C3E50]"></div>
            </div>

            <!-- Modules / Stages Box -->
            <div class="mb-5">
                <h4 class="font-['Source_Serif_4'] font-bold text-sm text-[#0F2439] mb-2.5 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-base text-[#8C6826]">account_tree</span>
                    <span>Этапы и ключевые направления реализации:</span>
                </h4>
                <div id="init-dossier-modules" class="space-y-2 text-xs text-[#2C3E50]"></div>
            </div>

            <!-- Legislative Norms (НПА РФ) -->
            <div class="mb-6">
                <h4 class="font-['Source_Serif_4'] font-bold text-sm text-[#0F2439] mb-2.5 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-base text-[#8C6826]">gavel</span>
                    <span>Нормативно-правовая база РФ:</span>
                </h4>
                <div id="init-dossier-npa" class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs"></div>
            </div>

            <!-- Modal Action Buttons -->
            <div class="pt-4 border-t border-[#E8E7E2] flex flex-col sm:flex-row gap-3">
                <button type="button" id="init-dossier-action-btn" onclick="window.handleInitiativeDossierAction()" class="flex-1 py-3.5 px-4 bg-[#0F2439] text-white text-xs uppercase font-bold tracking-wider rounded-xl hover:bg-[#1e3a5f] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer button-glow">
                    <span class="material-symbols-outlined text-sm">send</span>
                    <span id="init-dossier-action-text">Предложить решение / Участвовать</span>
                </button>
                <button type="button" onclick="window.closeModal('modal-initiative-dossier'); if(typeof openModal === 'function') openModal('modal-donate');" class="py-3.5 px-4 bg-[#FAF4E6] text-[#8C6826] border border-[#E8DCC0] hover:bg-[#F3EAD3] text-xs uppercase font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer">
                    <span class="material-symbols-outlined text-sm">favorite</span>
                    <span>Поддержать проект</span>
                </button>
            </div>
        </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.openInitiativeDossier = function(key) {
  ensureInitiativeModalDOM();
  const data = window.INITIATIVE_DATABASE[key];
  if (!data) return;
  currentInitiativeKey = key;

  const badgeEl = document.getElementById('init-dossier-status-badge');
  if (badgeEl) {
    badgeEl.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ' + data.statusColor;
    badgeEl.textContent = data.statusBadge;
  }

  const codeEl = document.getElementById('init-dossier-code');
  if (codeEl) codeEl.textContent = data.code;

  const catEl = document.getElementById('init-dossier-category');
  if (catEl) catEl.textContent = data.category;

  const titleEl = document.getElementById('init-dossier-title');
  if (titleEl) titleEl.textContent = data.title;

  const subEl = document.getElementById('init-dossier-subtitle');
  if (subEl) subEl.textContent = data.subtitle;

  const descEl = document.getElementById('init-dossier-desc');
  if (descEl) descEl.textContent = data.desc;

  const goalsEl = document.getElementById('init-dossier-goals');
  if (goalsEl) {
    goalsEl.innerHTML = data.goals.map((g, i) => `
      <div class="flex items-start gap-2 p-2.5 bg-white rounded-lg border border-[#E8E7E2]">
          <span class="w-5 h-5 rounded-full bg-[#FAF4E6] text-[#8C6826] font-mono font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-[#E8DCC0]">${i+1}</span>
          <span class="leading-relaxed">${g}</span>
      </div>
    `).join('');
  }

  const modEl = document.getElementById('init-dossier-modules');
  if (modEl) {
    modEl.innerHTML = data.modules.map(m => `
      <div class="p-2.5 bg-[#F8F7F4] rounded-lg border border-[#E8E7E2] flex items-start gap-2">
          <span class="material-symbols-outlined text-xs text-[#8C6826] mt-0.5 flex-shrink-0">check_circle</span>
          <span class="leading-relaxed">${m}</span>
      </div>
    `).join('');
  }

  const npaEl = document.getElementById('init-dossier-npa');
  if (npaEl) {
    npaEl.innerHTML = data.npa.map(n => `
      <div class="p-2.5 bg-white rounded-lg border border-[#E0E0E0]">
          <div class="font-bold text-[#0F2439] mb-0.5">${n.title}</div>
          <div class="text-[11px] text-[#5f5e5e] leading-snug">${n.desc}</div>
      </div>
    `).join('');
  }

  window.openModal('modal-initiative-dossier');
};

window.openStopCommissionModal = function() { window.openInitiativeDossier('stop_commission'); };
window.openDigitalLawModal = function() { window.openInitiativeDossier('digital_law'); };
window.openDogParkInitiativeModal = function() { window.openInitiativeDossier('dog_park'); };
window.openJkhProgramModal = function() { window.openInitiativeDossier('jkh_program'); };
window.openYouthLegalModal = function() { window.openInitiativeDossier('youth_legal'); };

window.handleInitiativeDossierAction = function() {
  window.closeModal('modal-initiative-dossier');
  const data = window.INITIATIVE_DATABASE[currentInitiativeKey];
  const select = document.getElementById('initiative-direction-select');
  if (select && data && data.directionValue) {
    select.value = data.directionValue;
  }
  const formEl = document.getElementById('propose-initiative') || document.getElementById('contact-form') || document.querySelector('form');
  if (formEl && window.location.pathname.includes('initiatives.html')) {
    formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    window.location.href = 'initiatives.html#propose-initiative';
  }
};

window.openModal = function(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = 'flex';
    el.classList.add('active', 'open');
    el.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
};

window.closeModal = function(id) {
  if (id) {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = 'none';
      el.classList.remove('active', 'open');
    }
  } else {
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.style.display = 'none';
      m.classList.remove('active', 'open');
    });
  }
  document.body.style.overflow = '';
};

// Event listener for backdrop click
document.addEventListener('click', (e) => {
  if (e.target && e.target.classList && e.target.classList.contains('modal-overlay')) {
    window.closeModal(e.target.id);
  }
});
