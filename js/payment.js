/**
 * T-Bank Payment Gateway & Legal Donation Module
 * Organization: АНО «ЦПЗ ЮГ-ПРАВО»
 *
 * Вид платежа: Добровольное пожертвование на уставную деятельность АНО.
 * Правовое основание: ст. 582 ГК РФ, пп. 1 п. 2 ст. 251 НК РФ, ст. 265 НК РФ (льгота юрлицам).
 * Пожертвования не облагаются НДС и налогом на прибыль.
 *
 * Интеграция: T-Bank Acquiring API v2 → /api/payment/init
 * Сертификаты: Russian Trusted CA (НУЦ Минцифры России)
 * Status: ACTIVE
 */

window.TBankPayment = {
  PURPOSE_KEY: 'statutory',
  PURPOSE_LABEL: 'Добровольное пожертвование на уставную деятельность',
  PURPOSE_LEGAL: 'Добровольное пожертвование на ведение уставной деятельности АНО «ЦПЗ ЮГ-ПРАВО» (ст. 582 ГК РФ, пп. 1 п. 2 ст. 251 НК РФ)',

  selectedAmount: 500,
  isProcessing: false,
  currentTab: 'person',

  /**
   * Переключение между физическими и юридическими лицами
   */
  switchTab: function(tab) {
    this.currentTab = tab;
    const personTabBtn = document.getElementById('tab-btn-person');
    const corpTabBtn = document.getElementById('tab-btn-corp');
    const personPanel = document.getElementById('panel-person');
    const corpPanel = document.getElementById('panel-corp');

    if (tab === 'person') {
      if (personTabBtn) {
        personTabBtn.classList.add('bg-[#0F2439]', 'text-white');
        personTabBtn.classList.remove('bg-white', 'text-[#5f5e5e]');
      }
      if (corpTabBtn) {
        corpTabBtn.classList.remove('bg-[#0F2439]', 'text-white');
        corpTabBtn.classList.add('bg-white', 'text-[#5f5e5e]');
      }
      if (personPanel) personPanel.classList.remove('hidden');
      if (corpPanel) corpPanel.classList.add('hidden');
    } else {
      if (corpTabBtn) {
        corpTabBtn.classList.add('bg-[#0F2439]', 'text-white');
        corpTabBtn.classList.remove('bg-white', 'text-[#5f5e5e]');
      }
      if (personTabBtn) {
        personTabBtn.classList.remove('bg-[#0F2439]', 'text-white');
        personTabBtn.classList.add('bg-white', 'text-[#5f5e5e]');
      }
      if (corpPanel) corpPanel.classList.remove('hidden');
      if (personPanel) personPanel.classList.add('hidden');
    }
  },

  /**
   * Установка суммы пожертвования
   */
  selectAmount: function(amount) {
    this.selectedAmount = parseInt(amount, 10) || 500;
    document.querySelectorAll('.amount-chip-btn').forEach(btn => {
      const val = parseInt(btn.dataset.amount, 10);
      if (val === this.selectedAmount) {
        btn.classList.add('bg-[#0F2439]', 'text-white', 'border-[#0F2439]');
        btn.classList.remove('bg-[#F8F7F4]', 'text-[#0F2439]', 'border-[#E0E0E0]');
      } else {
        btn.classList.remove('bg-[#0F2439]', 'text-white', 'border-[#0F2439]');
        btn.classList.add('bg-[#F8F7F4]', 'text-[#0F2439]', 'border-[#E0E0E0]');
      }
    });

    const customInput = document.getElementById('donate-custom-amount');
    if (customInput) customInput.value = this.selectedAmount;
  },

  /**
   * Инициирует платёж через T-Bank Acquiring API v2.
   */
  initiatePayment: async function(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (this.isProcessing) return;

    const termsCb = document.getElementById('donate-agree-terms');
    if (termsCb && !termsCb.checked) {
      const msg = 'Необходимо согласиться с условиями публичной оферты о добровольном пожертвовании.';
      if (window.showToast) window.showToast(msg, 'warning');
      else alert(msg);
      return;
    }

    const customInput = document.getElementById('donate-custom-amount');
    let rubles = customInput ? parseInt(customInput.value, 10) : this.selectedAmount;
    if (isNaN(rubles) || !rubles || rubles < 1) {
      rubles = this.selectedAmount || 500;
    }

    if (rubles > 150000) {
      const msg = 'Максимальная сумма разового пожертвования онлайн: 150 000 ₽. Для больших сумм используйте безналичный счёт юридического лица/ИП.';
      if (window.showToast) window.showToast(msg, 'warning');
      else alert(msg);
      return;
    }

    this.isProcessing = true;
    this._setButtonState(true);

    try {
      if (window.showToast) {
        window.showToast('⏳ Подключаемся к платёжному шлюзу Т-Банк...', 'info');
      }

      if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }

      const baseUrl = window.location.origin;
      const successUrl = baseUrl + '/payment-success.html';
      const failUrl    = baseUrl + '/payment-fail.html';

      const response = await fetch('/api/payment/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          amount:     rubles * 100,           // в копейках
          purpose:    this.PURPOSE_KEY,        // 'statutory'
          successUrl: successUrl,
          failUrl:    failUrl
        })
      });

      const result = await response.json();

      if (result.success && result.paymentUrl) {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        if (window.showToast) {
          window.showToast('✅ Переходим на защищённую страницу оплаты Т-Банк...', 'success');
        }

        window.location.href = result.paymentUrl;

      } else {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        }
        const errorMsg = result.error || 'Ошибка инициализации платежа. Попробуйте позже.';
        if (window.showToast) {
          window.showToast('❌ ' + errorMsg, 'error');
        } else {
          alert(errorMsg);
        }
      }

    } catch (networkErr) {
      console.error('[TBankPayment] Network error:', networkErr);
      const errTxt = 'Ошибка соединения с платёжным шлюзом. Пожалуйста, повторите попытку.';
      if (window.showToast) window.showToast('❌ ' + errTxt, 'error');
      else alert(errTxt);
    } finally {
      this.isProcessing = false;
      this._setButtonState(false);
    }
  },

  _setButtonState: function(loading) {
    const selectors = [
      '#donate-submit-btn',
      '#btn-donate-submit',
      '.btn-donate-submit',
      'button[onclick*="initiatePayment"]'
    ];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(btn => {
        if (loading) {
          btn.disabled = true;
          if (!btn.dataset.originalText) {
            btn.dataset.originalText = btn.innerHTML;
          }
          btn.innerHTML = '<span class="material-symbols-outlined text-base animate-spin">autorenew</span> Подключение к Т-Банк...';
          btn.style.opacity = '0.75';
        } else {
          btn.disabled = false;
          if (btn.dataset.originalText) {
            btn.innerHTML = btn.dataset.originalText;
          }
          btn.style.opacity = '';
        }
      });
    });
  }
};
