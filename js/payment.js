/**
 * 100% Robust T-Bank Payment Client Module
 * Computes SHA-256 Token natively via Web Crypto API
 * Direct connection to https://securepay.tinkoff.ru/v2/Init
 * Works on Localhost, GitHub Pages, Mobile & Desktop!
 */

window.TBankPayment = {
  terminalKey: '1787835813860DEMO',
  password: 'L$ajc#1u6X#nn7nr',
  selectedPurpose: 'statutory',
  selectedAmount: 500,

  purposes: {
    statutory: {
      title: 'Уставная деятельность и правовая защита',
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

  // SHA-256 Token Generator (Client-Side & Server-Side compatible)
  generateToken: async function(params, password) {
    const tokenParams = { ...params, Password: password };
    delete tokenParams.Token;
    delete tokenParams.DATA;
    delete tokenParams.Receipt;
    delete tokenParams.Shops;
    delete tokenParams.Descriptor;

    const sortedKeys = Object.keys(tokenParams).sort();
    let concatenated = '';
    for (const key of sortedKeys) {
      concatenated += tokenParams[key];
    }

    // Web Crypto API SHA-256
    const msgBuffer = new TextEncoder().encode(concatenated);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
    const emailVal = emailInput ? emailInput.value.trim() : 'donor@yug-pravo.ru';

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
          Переход в Т-Банк...
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
    const amountKopecks = amountVal * 100;

    // 1. Direct T-Bank REST API Request with SHA-256 Token
    try {
      const payload = {
        TerminalKey: this.terminalKey,
        Amount: amountKopecks,
        OrderId: orderId,
        Description: description,
        SuccessURL: window.location.origin + '/payment-success.html?orderId=' + orderId,
        FailURL: window.location.origin + '/index.html?payment=failed',
        DATA: {
          Email: emailVal,
          TaxId: '6317174776',
          Company: 'АНО ЦПЗ ЮГ-ПРАВО'
        }
      };

      payload.Token = await this.generateToken(payload, this.password);

      console.log('Sending direct payment request to T-Bank...', payload);

      const res = await fetch('https://securepay.tinkoff.ru/v2/Init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log('T-Bank response:', data);

      if (data.Success && data.PaymentURL) {
        if (window.showToast) window.showToast('Перенаправление в шлюз Т-Банка...');
        window.location.href = data.PaymentURL;
        return;
      } else {
        throw new Error(data.Message || data.Details || 'Ошибка банка при инициализации');
      }

    } catch (directErr) {
      console.error('Direct T-Bank Init Error:', directErr);

      // 2. Fallback to local server endpoint if available
      try {
        const localRes = await fetch('/api/payment/init', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amountVal,
            purpose: this.selectedPurpose,
            email: emailVal
          })
        });

        if (localRes.ok) {
          const localData = await localRes.json();
          if (localData.success && localData.paymentUrl) {
            window.location.href = localData.paymentUrl;
            return;
          }
        }
      } catch (localErr) {
        console.error('Local endpoint error:', localErr);
      }

      alert('Ошибка соединения с Т-Банком: ' + (directErr.message || 'Проверьте соединение'));
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  }
};
