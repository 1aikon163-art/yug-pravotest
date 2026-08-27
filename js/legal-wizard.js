// Interactive Legal Aid Diagnostic Wizard for ЮГ-Право
document.addEventListener('DOMContentLoaded', () => {
  const wizardContainer = document.getElementById('legal-wizard');
  if (!wizardContainer) return;

  const steps = wizardContainer.querySelectorAll('.wizard-step');
  const progressBar = document.getElementById('wizard-progress-bar');
  const stepIndicators = document.querySelectorAll('.wizard-step-indicator');
  const prevBtn = document.getElementById('wizard-prev-btn');
  const nextBtn = document.getElementById('wizard-next-btn');
  const submitBtn = document.getElementById('wizard-submit-btn');

  let currentStep = 1;
  const totalSteps = steps.length;
  const answers = {
    clientType: '',
    category: '',
    urgency: '',
    details: '',
    region: 'Краснодарский край'
  };

  // Option selections
  wizardContainer.querySelectorAll('.wizard-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      const group = opt.getAttribute('data-group');
      const value = opt.getAttribute('data-value');

      // Deselect siblings in the same step
      opt.parentElement.querySelectorAll('.wizard-option').forEach((sibling) => {
        sibling.classList.remove('border-[#C5A059]', 'bg-[#FFF9EE]', 'shadow-md');
        sibling.classList.add('border-slate-200', 'bg-white');
      });

      // Highlight selected
      opt.classList.remove('border-slate-200', 'bg-white');
      opt.classList.add('border-[#C5A059]', 'bg-[#FFF9EE]', 'shadow-md');

      answers[group] = value;
      updateNavigationState();
    });
  });

  // Step changes
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentStep < totalSteps) {
        goToStep(currentStep + 1);
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        goToStep(currentStep - 1);
      }
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      const phoneInput = document.getElementById('wizard-phone');
      const nameInput = document.getElementById('wizard-name');

      if (!phoneInput || !phoneInput.value.trim()) {
        if (window.showToast) window.showToast('Пожалуйста, укажите ваш контактный телефон', 'error');
        return;
      }

      // Generate result summary
      const resultCard = document.getElementById('wizard-result-card');
      const wizardForms = document.getElementById('wizard-forms-area');

      if (wizardForms) wizardForms.classList.add('hidden');
      if (resultCard) {
        resultCard.classList.remove('hidden');
        document.getElementById('res-category').textContent = answers.category || 'Общие правовые вопросы';
        document.getElementById('res-type').textContent = answers.clientType || 'Физическое лицо';
        document.getElementById('res-status').textContent = 'Бесплатно в рамках программы правового просвещения СО НКО';
      }

      if (window.showToast) {
        window.showToast('Заявка на бесплатную консультацию зарегистрирована!', 'success');
      }
    });
  }

  function goToStep(stepNumber) {
    currentStep = stepNumber;

    steps.forEach((s) => s.classList.add('hidden'));
    const activeStepEl = wizardContainer.querySelector(`[data-step="${currentStep}"]`);
    if (activeStepEl) activeStepEl.classList.remove('hidden');

    // Update progress bar
    if (progressBar) {
      const pct = ((currentStep - 1) / (totalSteps - 1)) * 100;
      progressBar.style.width = `${pct}%`;
    }

    // Update indicators
    stepIndicators.forEach((ind, idx) => {
      if (idx + 1 < currentStep) {
        ind.className = 'wizard-step-indicator w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow';
        ind.innerHTML = '✓';
      } else if (idx + 1 === currentStep) {
        ind.className = 'wizard-step-indicator w-8 h-8 rounded-full bg-[#001F3F] text-white flex items-center justify-center font-bold text-xs ring-4 ring-[#C5A059]/30 shadow';
        ind.innerHTML = idx + 1;
      } else {
        ind.className = 'wizard-step-indicator w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs';
        ind.innerHTML = idx + 1;
      }
    });

    updateNavigationState();
  }

  function updateNavigationState() {
    if (prevBtn) {
      if (currentStep === 1) {
        prevBtn.classList.add('invisible');
      } else {
        prevBtn.classList.remove('invisible');
      }
    }

    if (nextBtn && submitBtn) {
      if (currentStep === totalSteps) {
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
      } else {
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
      }
    }
  }
});
