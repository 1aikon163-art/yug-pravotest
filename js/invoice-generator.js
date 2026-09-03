/**
 * ЮГ-ПРАВО LegalTech — Invoice & Corporate Donation Generator
 * Модуль формирования счёта-оферты, QR-кода ГОСТ и договоров для юридических лиц
 * ст. 582 ГК РФ, пп. 19.6 п. 1 ст. 265 НК РФ, ст. 251 НК РФ.
 */

window.CorporateDonation = {
  REQUISITES: {
    name: 'АВТОНОМНАЯ НЕКОММЕРЧЕСКАЯ ОРГАНИЗАЦИЯ «ЦЕНТР ПРАВОВОЙ ЗАЩИТЫ И РАЗВИТИЯ ГРАЖДАНСКИХ ИНИЦИАТИВ ЮГ-ПРАВО»',
    shortName: 'АНО «ЦПЗ ЮГ-ПРАВО»',
    inn: '6317174776',
    kpp: '631701001',
    ogrn: '1266300015080',
    minjust: '6314010192',
    address: '446186, Самарская обл., Большеглушицкий р-н, п. Южный, ул. Центральная, д. 7, кв. 1',
    bank: 'АО «ТБанк» (г. Москва)',
    bik: '044525974',
    corrAccount: '30101810145250000974',
    account: '40703810600000751961',
    director: 'Шарыпаев Павел Валерьевич',
    purpose: 'Добровольное пожертвование на ведение уставной деятельности АНО «ЦПЗ ЮГ-ПРАВО». НДС не облагается'
  },

  selectedAmount: 5000,
  forceInvoiceMode: false,

  /**
   * Выбор суммы пожертвования для юрлиц (чипы)
   */
  selectAmount: function (amount) {
    this.selectedAmount = parseInt(amount, 10) || 5000;
    this.forceInvoiceMode = false;
    const input = document.getElementById('corp-amount');
    if (input) input.value = this.selectedAmount;

    document.querySelectorAll('.corp-amount-chip').forEach(btn => {
      const val = parseInt(btn.dataset.amount, 10);
      if (val === this.selectedAmount) {
        btn.classList.add('bg-[#0F2439]', 'text-white', 'border-[#0F2439]');
        btn.classList.remove('bg-[#F8F7F4]', 'text-[#0F2439]', 'border-[#E0E0E0]');
      } else {
        btn.classList.remove('bg-[#0F2439]', 'text-white', 'border-[#0F2439]');
        btn.classList.add('bg-[#F8F7F4]', 'text-[#0F2439]', 'border-[#E0E0E0]');
      }
    });

    this.updateFlowVisibility();
  },

  /**
   * Ручной ввод суммы в инпуте
   */
  onAmountInput: function (val) {
    this.selectedAmount = parseInt(val, 10) || 0;
    this.forceInvoiceMode = false;
    document.querySelectorAll('.corp-amount-chip').forEach(btn => {
      const bVal = parseInt(btn.dataset.amount, 10);
      if (bVal === this.selectedAmount) {
        btn.classList.add('bg-[#0F2439]', 'text-white', 'border-[#0F2439]');
        btn.classList.remove('bg-[#F8F7F4]', 'text-[#0F2439]', 'border-[#E0E0E0]');
      } else {
        btn.classList.remove('bg-[#0F2439]', 'text-white', 'border-[#0F2439]');
        btn.classList.add('bg-[#F8F7F4]', 'text-[#0F2439]', 'border-[#E0E0E0]');
      }
    });
    this.updateFlowVisibility();
  },

  /**
   * Принудительно показать счет-оферту для сумм <= 3000
   */
  forceShowInvoice: function () {
    this.forceInvoiceMode = true;
    this.updateFlowVisibility();
  },

  /**
   * Переключение между режимом онлайн-оплаты и безналичного счета по ст. 574 ГК РФ
   */
  updateFlowVisibility: function () {
    const cardFlow = document.getElementById('corp-flow-card');
    const invoiceFlow = document.getElementById('corp-flow-invoice');
    if (!cardFlow || !invoiceFlow) return;

    if (this.selectedAmount <= 3000 && !this.forceInvoiceMode) {
      cardFlow.classList.remove('hidden');
      invoiceFlow.classList.add('hidden');
    } else {
      cardFlow.classList.add('hidden');
      invoiceFlow.classList.remove('hidden');
    }
  },

  payByCard: function () {
    const emailEl = document.getElementById('corp-card-email');
    const email = emailEl ? emailEl.value.trim() : '';

    const agreeEl = document.getElementById('corp-card-agree-terms');
    if (agreeEl && !agreeEl.checked) {
      if (window.showToast) window.showToast('Необходимо подтвердить согласие с Публичной офертой.', 'warning');
      else alert('Необходимо подтвердить согласие с Публичной офертой о добровольном пожертвовании.');
      return;
    }

    if (window.TBankPayment) {
      window.TBankPayment.selectedAmount = this.selectedAmount || 3000;
      const donateCustomInput = document.getElementById('donate-custom-amount');
      if (donateCustomInput) donateCustomInput.value = this.selectedAmount;
      const donateEmailInput = document.getElementById('donate-email');
      if (donateEmailInput && email) donateEmailInput.value = email;

      window.TBankPayment.initiatePayment();
    }
  },

  /**
   * Скачать юридически выверенный индивидуализированный договор в формате DOCX
   */
  downloadContractDocx: function () {
    const innEl = document.getElementById('corp-inn');
    const nameEl = document.getElementById('corp-name');
    const amountEl = document.getElementById('corp-amount');

    const inn = innEl ? innEl.value.trim() : '';
    const name = nameEl ? nameEl.value.trim() : '';
    const amount = amountEl ? parseFloat(amountEl.value) : (this.selectedAmount || 5000);

    const query = new URLSearchParams();
    if (inn) query.set('inn', inn);
    if (name) query.set('name', name);
    if (amount) query.set('amount', amount);

    const downloadUrl = `/api/contract/docx?${query.toString()}`;

    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `Договор_пожертвования_АНО_ЮГ_ПРАВО_${Date.now()}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (window.showToast) {
      window.showToast('📄 Персонализированный договор (DOCX) сформирован и скачан!', 'success');
    }
  },

  /**
   * Скопировать полные реквизиты для платёжки в буфер обмена
   */
  copyRequisites: function () {
    const r = this.REQUISITES;
    const text = `Получатель: ${r.name}
Сокращенно: ${r.shortName}
ИНН: ${r.inn}
КПП: ${r.kpp}
ОГРН: ${r.ogrn}
Учетный номер Минюста: ${r.minjust}
Расчетный счет: ${r.account}
Банк: ${r.bank}
БИК: ${r.bik}
Корр. счет: ${r.corrAccount}
Назначение платежа: ${r.purpose}
Юридический адрес: ${r.address}`;

    navigator.clipboard.writeText(text).then(() => {
      if (window.showToast) {
        window.showToast('✅ Банковские реквизиты скопированы для бухгалтерии!', 'success');
      } else {
        alert('Реквизиты скопированы в буфер обмена!');
      }
    }).catch(() => {
      prompt('Скопируйте реквизиты:', text);
    });
  },

  /**
   * Генерация печатной формы Счёта-оферты с валидным QR-кодом ГОСТ Р 56042-2014,
   * факсимиле подписи и оттиском печати организации
   */
  generateInvoice: function () {
    const innEl = document.getElementById('corp-inn');
    const nameEl = document.getElementById('corp-name');
    const amountEl = document.getElementById('corp-amount');

    const inn = innEl ? innEl.value.trim() : '';
    const name = nameEl ? nameEl.value.trim() : 'Юридическое лицо / ИП';
    const amount = amountEl ? parseFloat(amountEl.value) : 5000;

    if (!amount || amount < 100) {
      if (window.showToast) window.showToast('Пожалуйста, укажите сумму пожертвования.', 'warning');
      return;
    }

    const r = this.REQUISITES;
    const now = new Date();
    const invoiceNum = `П-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;
    const dateStr = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

    // Чистый URL к эндпоинту ГОСТ QR-кода на сервере
    const qrUrl = `/api/qr/gost?sum=${amount}&t=${Date.now()}`;

    // Генерация окна печати счета
    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Пожалуйста, разрешите всплывающие окна в браузере для просмотра и печати счёта.');
      return;
    }

    printWin.document.write(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Счёт-оферта № ${invoiceNum} — АНО «ЦПЗ ЮГ-ПРАВО»</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; color: #000; padding: 25px 30px; font-size: 13px; line-height: 1.35; max-width: 820px; margin: 0 auto; background: #fff; }
    h1 { font-size: 16px; font-weight: bold; text-align: center; margin: 15px 0 10px 0; border-bottom: 2px solid #000; padding-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    .bank-table td { border: 1px solid #000; padding: 5px 8px; vertical-align: top; font-size: 12px; }
    .items-table th, .items-table td { border: 1px solid #000; padding: 6px 8px; font-size: 12px; text-align: left; }
    .items-table th { background: #f2f2f2; text-align: center; font-weight: bold; }
    .qr-box { float: right; margin-left: 20px; text-align: center; font-size: 10px; }
    .footer-signs { margin-top: 30px; position: relative; min-height: 140px; }
    .btn-print { background: #0F2439; color: #fff; padding: 9px 20px; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; font-family: sans-serif; font-weight: bold; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); }
    .btn-print:hover { background: #1e3a5f; }
    @media print { .btn-print { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <button class="btn-print" onclick="window.print()">🖨️ Распечатать / Сохранить в PDF</button>

  <div class="qr-box">
    <img src="${qrUrl}" alt="QR-код ГОСТ Р 56042-2014 для оплаты" width="140" height="140" style="border: 1px solid #ddd; padding: 3px; background: #fff;" onerror="this.style.display='none'"/><br/>
    <span style="font-family: sans-serif; font-size: 9px; color: #444; display: block; margin-top: 4px;">
      QR-код ГОСТ Р 56042-2014<br/>для оплаты в приложении любого банка
    </span>
  </div>

  <!-- Стандартная банковская таблица реквизитов (1С) -->
  <table class="bank-table">
    <tr>
      <td colspan="2" rowspan="2" style="min-width:300px;">
        ${r.bank}<br/>
        <span style="font-size:10px; color:#555;">Банк получателя</span>
      </td>
      <td style="width:70px;">БИК</td>
      <td style="font-family:monospace; font-weight:bold; font-size:13px;">${r.bik}</td>
    </tr>
    <tr>
      <td>Сч. №</td>
      <td style="font-family:monospace; font-size:12px;">${r.corrAccount}</td>
    </tr>
    <tr>
      <td style="width:140px;">ИНН ${r.inn}</td>
      <td style="width:140px;">КПП ${r.kpp}</td>
      <td rowspan="2">Сч. №</td>
      <td rowspan="2" style="font-family:monospace; font-weight:bold; font-size:14px;">${r.account}</td>
    </tr>
    <tr>
      <td colspan="2">
        ${r.name}<br/>
        <span style="font-size:10px; color:#555;">Получатель платежа</span>
      </td>
    </tr>
  </table>

  <h1>СЧЁТ-ОФЕРТА № ${invoiceNum} от ${dateStr}</h1>

  <p style="margin: 4px 0;"><strong>Поставщик (Одаряемый):</strong> ${r.name}, ИНН ${r.inn}, КПП ${r.kpp}, ОГРН ${r.ogrn}, учетный № Минюста ${r.minjust}, ${r.address}, тел.: +7 (927) 002-39-91, e-mail: info@yugpravo.ru</p>
  <p style="margin: 4px 0;"><strong>Плательщик (Жертвователь):</strong> ${name} ${inn ? '(ИНН ' + inn + ')' : ''}</p>
  <p style="margin: 4px 0;"><strong>Основание:</strong> Публичная оферта о добровольном пожертвовании на уставную некоммерческую деятельность (в ред. от 31.08.2026 № 04/ОД; ст. 582 ГК РФ, пп. 1 п. 2 ст. 251 НК РФ).</p>

  <table class="items-table" style="margin-top: 14px;">
    <thead>
      <tr>
        <th style="width:30px;">№</th>
        <th>Наименование назначения платежа</th>
        <th style="width:50px;">Кол-во</th>
        <th style="width:45px;">Ед.</th>
        <th style="width:110px;">Сумма</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="text-align:center;">1</td>
        <td>Добровольное благотворительное пожертвование на ведение уставной некоммерческой деятельности социально ориентированной организации АНО «ЦПЗ ЮГ-ПРАВО» (ст. 582 ГК РФ)</td>
        <td style="text-align:center;">1</td>
        <td style="text-align:center;">усл.</td>
        <td style="text-align:right; font-weight:bold;">${amount.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽</td>
      </tr>
    </tbody>
  </table>

  <div style="text-align:right; margin-bottom:12px;">
    <strong style="font-size: 14px;">Итого к оплате: ${amount.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽</strong><br/>
    <span style="font-size:11px; color:#555;">Без налога (НДС) согласно пп. 1 п. 2 ст. 251 Налогового кодекса РФ</span>
  </div>

  <p style="font-size:11px; background:#fafafa; border:1px solid #e2e8f0; border-radius: 4px; padding:7px 10px; margin: 10px 0;">
    <strong>Налоговая льгота для юридических лиц:</strong> Организации на ОСНО имеют право уменьшать налогооблагаемую базу по налогу на прибыль на сумму пожертвований социально ориентированным НКО в пределах 1% от выручки (пп. 19.6 п. 1 ст. 265 НК РФ).
  </p>

  <!-- Блок подписи, факсимиле и оттиска печати -->
  <div class="footer-signs" style="margin-top: 30px;">
    <div style="position: relative; min-height: 100px;">
      <div style="font-size: 13px; margin-bottom: 8px;">
        Руководитель организации (Директор): 
        <span style="display:inline-block; width: 140px; border-bottom: 1px solid #000; text-align: center;"></span>
        / Шарыпаев П. В. /
      </div>

      <!-- Подлинная печать и факсимиле подписи Директора -->
      <img src="images/official-seal-with-signature.png" alt="Оттиск печати и подпись директора АНО «ЦПЗ ЮГ-ПРАВО»" width="230" height="130" style="position: absolute; left: 160px; top: -45px; pointer-events: none;"/>
      
      <div style="margin-top: 55px; font-size: 10px; color: #64748b; line-height: 1.5; border-top: 1px dashed #cbd5e1; pt-2;">
        М.П. • Счёт действителен к оплате в течение 30 банковских дней. Перечисление денежных средств по настоящему счёту является безоговорочным акцептом Публичной оферты о добровольном пожертвовании (ст. 438, 582 ГК РФ). Назначение платежа: «Добровольное пожертвование на уставную некоммерческую деятельность по счёту № ${invoiceNum}. НДС не облагается (пп. 1 п. 2 ст. 251 НК РФ)».
      </div>
    </div>
  </div>
</body>
</html>`);
    printWin.document.close();
  },

  /**
   * Инициализация при загрузке страницы
   */
  init: function () {
    const input = document.getElementById('corp-amount');
    if (input && input.value) {
      this.selectedAmount = parseInt(input.value, 10) || 5000;
    }
    this.updateFlowVisibility();
  }
};

// Автоматическая инициализация
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.CorporateDonation) window.CorporateDonation.init();
  });
} else {
  if (window.CorporateDonation) window.CorporateDonation.init();
}
