/**
 * T-Bank (Tinkoff) Official Frontend & Backend Payment Integration
 * Uses official T-Bank SDK (tinkoff_v2.js) + fallback to /api/payment/init
 */

window.TBankPayment = {
  selectedPurpose: 'statutory',
  selectedAmount: 500,

  purposes: {
    statutory: {
      title: 'Уставная деятельность и бесплатная помощь',
      description: 'Добровольное пожертвование на ведение уставной деятельности и бесплатную правовую помощь гражданам (ст. 582 ГК РФ, пп. 1 п. 2 ст. 251 НК РФ)'
    },
    shelter: {
      title: 'Программа «Добрая лапа» (Зооприюты)',
      description: 'Целевое благотворительное пожертвование на реализацию программы помощи зооприютам Самарской области «Добрая лапа» (ФЗ № 135-ФЗ)'
    },
    jkh: {
      title: 'Народный аудит ЖКХ и экспертизы',
      description: 'Целевое пожертвование на проведение независимых строительно-технических экспертиз и общественного контроля ЖКХ (ФЗ № 212-ФЗ)'
    }
  },

  selectPurpose: function(key) {
    this.selectedPurpose = key;
    document.querySelectorAll('.purpose-radio-btn').forEach(el => {
      const isCurrent = el.dataset.purpose === key;
      if (isCurrent) {
        el.classList.add('border-[#0F2439]', 'bg-[#F0EFEA]');
        el.classList.remove('border-[#E0E0E0]', 'bg-white');
        const radio = el.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      } else {
        el.classList.remove('border-[#0F2439]', 'bg-[#F0EFEA]');
        el.classList.add('border-[#E0E0E0]', 'bg-white');
      }
    });

    const hintEl = document.getElementById('payment-purpose-hint');
    if (hintEl && this.purposes[key]) {
      hintEl.textContent = this.purposes[key].description;
    }
  },

  selectAmount: function(amount) {
    this.selectedAmount = amount;
    document.querySelectorAll('.amount-chip-btn').forEach(btn => {
      const val = parseInt(btn.dataset.amount, 10);
      if (val === amount) {
        btn.classList.add('bg-[#0F2439]', 'text-white', 'border-[#0F2439]');
        btn.classList.remove('bg-[#F8F7F4]', 'text-[#0F2439]', 'border-[#E0E0E0]');
      } else {
        btn.classList.remove('bg-[#0F2439]', 'text-white', 'border-[#0F2439]');
        btn.classList.add('bg-[#F8F7F4]', 'text-[#0F2439]', 'border-[#E0E0E0]');
      }
    });

    const customInput = document.getElementById('donate-custom-amount');
    if (customInput) {
      customInput.value = amount;
    }
  },

  initiatePayment: async function(e) {
    if (e) e.preventDefault();

    const customInput = document.getElementById('donate-custom-amount');
    const amountVal = customInput ? parseInt(customInput.value, 10) : this.selectedAmount;

    if (!amountVal || amountVal < 10) {
      if (window.showToast) window.showToast('Минимальная сумма пожертвования — 10 ₽');
      else alert('Минимальная сумма пожертвования — 10 ₽');
      return;
    }

    const emailInput = document.getElementById('donate-email');
    const emailVal = emailInput ? emailInput.value.trim() : '';

    const agreeCheck = document.getElementById('donate-agree-terms');
    if (agreeCheck && !agreeCheck.checked) {
      if (window.showToast) window.showToast('Необходимо согласиться с условиями оферты');
      else alert('Необходимо согласиться с условиями оферты');
      return;
    }

    const submitBtn = document.getElementById('donate-submit-btn');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="inline-flex items-center gap-2">
          <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          Открытие шлюза Т-Банка...
        </span>
      `;
    }

    let description = 'Добровольное пожертвование на уставную деятельность АНО «ЦПЗ ЮГ-ПРАВО»';
    if (this.selectedPurpose === 'shelter') {
      description = 'Целевое благотворительное пожертвование на программу «Добрая лапа» (ФЗ № 135-ФЗ)';
    } else if (this.selectedPurpose === 'jkh') {
      description = 'Целевое пожертвование на общественный аудит ЖКХ и экспертизы МКД (ФЗ № 212-ФЗ)';
    }

    const orderId = 'YP-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    // 1. Try Backend API first (/api/payment/init)
    try {
      const res = await fetch('/api/payment/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountVal,
          purpose: this.selectedPurpose,
          email: emailVal
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.paymentUrl) {
          window.location.href = data.paymentUrl;
          return;
        }
      }
    } catch (apiErr) {
      console.log('Backend API unavailable, using T-Bank native widget fallback...', apiErr);
    }

    // 2. Official T-Bank SDK / Form fallback (Works everywhere, including GitHub Pages & static hosting!)
    try {
      let hiddenForm = document.getElementById('tinkoff-native-pay-form');
      if (!hiddenForm) {
        hiddenForm = document.createElement('form');
        hiddenForm.id = 'tinkoff-native-pay-form';
        hiddenForm.name = 'TinkoffPayForm';
        hiddenForm.style.display = 'none';
        document.body.appendChild(hiddenForm);
      }

      hiddenForm.innerHTML = `
        <input type="hidden" name="terminalkey" value="1787835813860DEMO">
        <input type="hidden" name="frame" value="false">
        <input type="hidden" name="language" value="ru">
        <input type="hidden" name="amount" value="${amountVal}">
        <input type="hidden" name="order" value="${orderId}">
        <input type="hidden" name="description" value="${description}">
        <input type="hidden" name="name" value="Благотворитель АНО ЮГ-ПРАВО">
        <input type="hidden" name="email" value="${emailVal || 'donor@yug-pravo.ru'}">
        <input type="hidden" name="data" value='{"TaxId":"6317174776","Company":"АНО ЦПЗ ЮГ-ПРАВО"}'>
      `;

      if (typeof window.pay === 'function') {
        window.pay(hiddenForm);
      } else {
        // Direct fallback to T-Bank payment init
        const script = document.createElement('script');
        script.src = 'https://securepay.tinkoff.ru/html/payForm/js/tinkoff_v2.js';
        script.onload = function() {
          if (typeof window.pay === 'function') {
            window.pay(hiddenForm);
          } else {
            alert('Шлюз Т-Банка загружен. Повторите нажатие.');
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalText;
            }
          }
        };
        document.head.appendChild(script);
      }
    } catch (widgetErr) {
      console.error('Widget error:', widgetErr);
      alert('Ошибка открытия платежной формы: ' + widgetErr.message);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  }
};
