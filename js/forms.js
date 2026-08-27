// 152-FZ Compliant Form Handling & Document Upload Simulator for ЮГ-Право
document.addEventListener('DOMContentLoaded', () => {
  initPhoneMasks();
  initFormSubmissions();
  initFileUploaders();
});

// Phone Input Mask (+7 (XXX) XXX-XX-XX)
function initPhoneMasks() {
  const phoneInputs = document.querySelectorAll('input[type="tel"]');

  phoneInputs.forEach((input) => {
    input.addEventListener('input', (e) => {
      let val = input.value.replace(/\D/g, '');
      if (!val) {
        input.value = '';
        return;
      }
      if (val[0] === '7' || val[0] === '8') val = val.substring(1);
      
      let formatted = '+7 ';
      if (val.length > 0) formatted += '(' + val.substring(0, 3);
      if (val.length >= 4) formatted += ') ' + val.substring(3, 6);
      if (val.length >= 7) formatted += '-' + val.substring(6, 8);
      if (val.length >= 9) formatted += '-' + val.substring(8, 10);

      input.value = formatted;
    });
  });
}

// Form Validation & Submission
function initFormSubmissions() {
  const forms = document.querySelectorAll('form[data-ajax-form]');

  forms.forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const consentCheckbox = form.querySelector('input[name="fz152_consent"]');
      if (consentCheckbox && !consentCheckbox.checked) {
        if (window.showToast) {
          window.showToast('Необходимо согласие на обработку персональных данных (152-ФЗ)', 'error');
        }
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton ? submitButton.innerHTML : '';

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = `
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Регистрация обращения...
        `;
      }

      // Simulate secure SSL transmission to NGO reception
      setTimeout(() => {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.innerHTML = originalText;
        }

        form.reset();

        // Close any parent modal
        const parentModal = form.closest('.modal-container');
        if (parentModal) {
          parentModal.classList.add('hidden');
          parentModal.classList.remove('flex');
          document.body.style.overflow = '';
        }

        if (window.showToast) {
          window.showToast('Обращение №' + Math.floor(100000 + Math.random() * 900000) + ' зарегистрировано! Дежурный юрист свяжется с вами.', 'success');
        }
      }, 1200);
    });
  });
}

// Drag & Drop File Upload Simulation
function initFileUploaders() {
  const uploadZones = document.querySelectorAll('.file-upload-zone');

  uploadZones.forEach((zone) => {
    const input = zone.querySelector('input[type="file"]');
    const preview = zone.querySelector('.file-preview-list');

    if (!input || !preview) return;

    zone.addEventListener('click', () => input.click());

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('border-[#C5A059]', 'bg-[#FFF9EE]');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('border-[#C5A059]', 'bg-[#FFF9EE]');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('border-[#C5A059]', 'bg-[#FFF9EE]');
      if (e.dataTransfer.files.length) {
        handleFiles(e.dataTransfer.files, preview);
      }
    });

    input.addEventListener('change', () => {
      if (input.files.length) {
        handleFiles(input.files, preview);
      }
    });
  });

  function handleFiles(files, previewEl) {
    previewEl.innerHTML = '';
    Array.from(files).forEach((file) => {
      const fileBadge = document.createElement('div');
      fileBadge.className = 'inline-flex items-center space-x-2 bg-slate-100 text-slate-800 text-xs px-3 py-1.5 rounded-lg border border-slate-200 mt-2 mr-2';
      fileBadge.innerHTML = `
        <span class="material-symbols-outlined text-sm text-[#001F3F]">description</span>
        <span class="font-medium truncate max-w-[150px]">${file.name}</span>
        <span class="text-slate-400">(${(file.size / 1024).toFixed(0)} KB)</span>
      `;
      previewEl.appendChild(fileBadge);
    });
  }
}
