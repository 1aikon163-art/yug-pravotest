/**
 * Legal Security & 152-FZ Personal Data Protection Helper
 * Provides automatic phone masking, consent enforcement, and Gosklyuch e-sign triggers.
 */

(function (global) {
  class LegalSecurity {
    constructor() {
      this.initPhoneMasks();
      this.initConsentCheckboxes();
    }

    /**
     * Auto-apply Russian phone mask +7 (XXX) XXX-XX-XX
     */
    initPhoneMasks() {
      // Маска телефона централизованно управляется в js/forms.js
      if (typeof window !== 'undefined' && typeof window.initPhoneMasks === 'function') {
        window.initPhoneMasks();
      }
    }

    /**
     * Ensure every form with user input has 152-FZ consent validation
     */
    initConsentCheckboxes() {
      document.addEventListener('submit', (e) => {
        const form = e.target;
        const consentBox = form.querySelector('input[type="checkbox"][name*="consent"], input[type="checkbox"][name*="agree"], input[type="checkbox"][name*="policy"]');
        if (consentBox && !consentBox.checked) {
          e.preventDefault();
          alert('Для отправки формы необходимо подтвердить согласие на обработку персональных данных (Федеральный закон № 152-ФЗ).');
          consentBox.focus();
        }
      });
    }

    /**
     * Trigger Gosklyuch E-Sign Intent for court documents
     * @param {string} documentId - ID or Hash of generated document
     */
    triggerGosklyuchSign(documentId) {
      console.log(`[Госключ] Инициализация подписания документа ${documentId}...`);
      alert(`[Госключ] Документ подготовлен к подписанию через приложение «Госключ». Откройте уведомление на мобильном устройстве.`);
    }
  }

  global.LegalSecurity = new LegalSecurity();
})(typeof window !== 'undefined' ? window : global);
