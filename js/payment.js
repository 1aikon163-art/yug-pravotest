/**
 * Donation & Support Gateway Module
 * Organization: АНО «ЦПЗ ЮГ-ПРАВО»
 * Mode: Standby / Development
 */

window.TBankPayment = {
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

  initiatePayment: function(e) {
    if (e) e.preventDefault();

    const customInput = document.getElementById('donate-custom-amount');
    const amountVal = customInput ? parseInt(customInput.value, 10) : this.selectedAmount;

    if (window.showToast) {
      window.showToast('Спасибо за поддержку! Платёжный шлюз проходит регламентное подключение.');
    } else {
      alert('Спасибо за поддержку! Платёжный шлюз проходит регламентное подключение.');
    }

    if (typeof window.closeModal === 'function') {
      window.closeModal('modal-donate');
    }
  }
};
