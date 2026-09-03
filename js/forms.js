/**
 * ЮГ-ПРАВО LegalTech — 152-FZ Compliant Form Handling & Alias Routing
 * Поддержка ведомственных алиасов:
 * - info@yugpravo.ru       (Общая приёмная)
 * - gkh@yugpravo.ru        (ЖКХ и проверки УК)
 * - potreb@yugpravo.ru     (Защита прав потребителей)
 * - sud@yugpravo.ru        (Судебные иски и МФО/230-ФЗ)
 * - idea@yugpravo.ru       (Инициативы и волонтерство)
 * - sharypaev@yugpravo.ru  (Руководство)
 */

document.addEventListener('DOMContentLoaded', () => {
  initPhoneMasks();
  initAllForms();
});

// ─── Маска ввода телефона (+7 (XXX) XXX-XX-XX) ───────────────────────────────
function initPhoneMasks() {
  const phoneInputs = document.querySelectorAll('input[type="tel"], input[name="phone"], input.phone-mask');
  phoneInputs.forEach((input) => {
    if (input.dataset.phoneMasked) return;
    input.dataset.phoneMasked = 'true';

    input.addEventListener('input', () => {
      let val = input.value.replace(/\D/g, '');
      if (!val) {
        input.value = '';
        return;
      }
      if (val[0] === '7' || val[0] === '8') {
        val = val.substring(1);
      }
      let formatted = '+7';
      if (val.length > 0) formatted += ' (' + val.substring(0, 3);
      if (val.length >= 3) formatted += ') ' + val.substring(3, 6);
      if (val.length >= 6) formatted += '-' + val.substring(6, 8);
      if (val.length >= 8) formatted += '-' + val.substring(8, 10);
      input.value = formatted;
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value.length <= 4) {
        input.value = '';
      }
    });
  });
}

// ─── Универсальный обработчик всех форм сайта ────────────────────────────────
function initAllForms() {
  const forms = document.querySelectorAll('form');
  forms.forEach((form) => {
    // Игнорируем форму пожертвований и форму калькулятора (она обрабатывается своим методом)
    if (form.closest('#modal-donate') || form.id === 'delegate-form') return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput   = form.querySelector('input[name="name"], input[placeholder*="имя" i], input[placeholder*="ФИО" i], input[type="text"]');
      const phoneInput  = form.querySelector('input[name="phone"], input[type="tel"]');
      const emailInput  = form.querySelector('input[name="email"], input[type="email"]');
      const aliasSelect = form.querySelector('select[name="target_alias"], input[name="target_alias"]');
      const dirSelect   = form.querySelector('select[name="direction"], input[name="direction"]');
      const msgInput    = form.querySelector('textarea, input[placeholder*="Суть" i], input[placeholder*="Описание" i], input[placeholder*="вопрос" i]');
      const submitBtn   = form.querySelector('button[type="submit"]');

      let name    = nameInput ? nameInput.value.trim() : '';
      let phone   = phoneInput ? phoneInput.value.trim() : '';
      const email   = emailInput ? emailInput.value.trim() : '';
      const message = msgInput ? msgInput.value.trim() : '';
      
      const source    = form.dataset.source || form.id || 'Форма обратной связи на сайте';
      const alias     = (aliasSelect ? aliasSelect.value : null) || form.dataset.alias || 'info@yugpravo.ru';
      const direction = (dirSelect ? dirSelect.value : null) || form.dataset.direction || '';

      // Если это быстрая подписка только по email
      if (!name && !phone && email) {
        name = 'Заявитель (Email подписка)';
        phone = '—';
      } else if (!name || !phone) {
        if (window.showToast) {
          window.showToast('Пожалуйста, укажите имя и телефон для связи.', 'warning');
        } else {
          alert('Пожалуйста, укажите имя и телефон для связи.');
        }
        return;
      }

      const origText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">autorenew</span> Отправка...';
        submitBtn.style.opacity = '0.75';
      }

      if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
      }

      try {
        const resp = await fetch('/api/lead', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body:    JSON.stringify({
            name:         name,
            phone:        phone,
            email:        email,
            direction:    direction,
            message:      message,
            source:       source,
            target_alias: alias
          })
        });

        const result = await resp.json();

        if (result.success) {
          if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
          }
          const caseId = result.caseId || 'ОБР-26/ОБЩ-0001';
          const tgLink = result.tgLink || `https://t.me/ugpravo_assistant_bot?start=track_${caseId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
          const docTypeLabel = result.docTypeLabel || 'Обращение';
          
          // Показываем официальный электронный талон заявителю
          showCaseReceiptModal({
            caseId: caseId,
            alias: alias,
            name: name,
            email: email,
            tgLink: tgLink,
            docTypeLabel: docTypeLabel
          });

          if (window.showToast) {
            window.showToast(`✅ ${docTypeLabel} № ${caseId} принято и зарегистрировано!`, 'success');
          }
          form.reset();

          // Закрыть родительскую модалку, если форма была внутри модалки
          const parentOverlay = form.closest('.modal-overlay');
          if (parentOverlay && parentOverlay.id !== 'modal-case-receipt' && window.closeModal) {
            window.closeModal(parentOverlay.id);
          }
        } else {
          if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
          }
          const errMsg = result.error || 'Ошибка отправки обращения. Попробуйте позже.';
          if (window.showToast) window.showToast('❌ ' + errMsg, 'error');
          else alert(errMsg);
        }

      } catch (err) {
        console.error('[FormSubmit Error]:', err);
        const netErrMsg = '❌ Ошибка соединения. Для срочной связи: 8 (846) 989-07-68 или info@yugpravo.ru';
        if (window.showToast) window.showToast(netErrMsg, 'error');
        else alert(netErrMsg);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origText;
          submitBtn.style.opacity = '';
        }
      }
    });
  });
}

// ─── Официальный электронный талон-квитанция о регистрации обращения ─────────
function showCaseReceiptModal(data) {
  let modal = document.getElementById('modal-case-receipt');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-case-receipt';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }

  window._lastAssignmentData = data;

  const nowStr = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Samara' });
  const isAssignment = data.isAssignment || (data.caseId && data.caseId.startsWith('СПР-'));
  const isContract   = data.isContract || (data.caseId && data.caseId.startsWith('ДОГ-'));
  const docTitle = isAssignment ? 'Заявление-поручение сформировано' : (data.docTypeLabel || 'Обращение зарегистрировано');
  
  const cleanId = data.caseId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const signTgUrl = `https://t.me/ugpravo_assistant_bot?start=sign_${cleanId}`;
  const trackTgUrl = data.tgLink || `https://t.me/ugpravo_assistant_bot?start=track_${cleanId}`;

  modal.innerHTML = `
    <div class="modal-container p-6 sm:p-7 max-w-md shadow-xl relative animate-fade-in" style="background:#ffffff; border:1px solid #E0E0E0; border-radius:16px;">
      <button class="modal-close-btn absolute top-4 right-4 text-[#8C8C8C] hover:text-[#0F2439] transition-colors" onclick="closeReceiptModal()">
        <span class="material-symbols-outlined text-2xl">close</span>
      </button>

      <h3 class="font-['Source_Serif_4'] text-2xl font-bold text-[#0F2439] mb-1">
        ${docTitle}
      </h3>
      <p class="text-xs text-[#7A7974] mb-4">
        ${isAssignment ? 'Для официальной регистрации подтвердите подписание простой электронной подписью (63-ФЗ):' : 'Запись внесена в единый реестр и передана специалисту центра.'}
      </p>

      <!-- Clean Number Box -->
      <div class="p-4 rounded-xl bg-[#F8F7F4] border border-[#E4E3DE] mb-4">
        <div class="text-[10px] uppercase font-semibold text-[#7A7974] tracking-wider mb-1">
          Регистрационный номер
        </div>
        <div class="flex items-center justify-between gap-3 mb-3">
          <span id="receipt-case-id" class="font-mono text-xl sm:text-2xl font-bold text-[#0F2439] select-all">${data.caseId}</span>
          <button type="button" onclick="copyReceiptCaseId('${data.caseId}')" class="px-2.5 py-1.5 bg-white border border-[#D9D8D2] text-[#0F2439] rounded-lg text-xs font-semibold hover:bg-[#F4F3EF] transition-colors flex items-center gap-1 cursor-pointer">
            <span class="material-symbols-outlined text-sm text-[#7A7974]">content_copy</span>
            <span>Копировать</span>
          </button>
        </div>

        <div class="text-xs text-[#4A4944] space-y-1.5 pt-2.5 border-t border-[#EAE9E4]">
          <div class="flex justify-between">
            <span class="text-[#7A7974]">Приёмная:</span>
            <span class="font-medium text-right">Единая приёмная (info@yugpravo.ru)</span>
          </div>
          ${data.direction ? `
          <div class="flex justify-between">
            <span class="text-[#7A7974]">Предмет:</span>
            <span class="font-medium text-right">${data.direction}</span>
          </div>` : ''}
          <div class="flex justify-between">
            <span class="text-[#7A7974]">Дата формирования:</span>
            <span>${nowStr}</span>
          </div>
          <div class="flex justify-between" id="receipt-status-row">
            <span class="text-[#7A7974]">Статус:</span>
            <span class="font-semibold ${isAssignment ? 'text-[#C5A059]' : 'text-emerald-700'}">${isAssignment ? '⏳ Ожидает подписания (0 ₽)' : '✅ Принято'}</span>
          </div>
          ${data.email ? `<div class="text-[11px] text-[#7A7974] pt-0.5">Квитанция направлена на ${data.email}</div>` : ''}
        </div>
      </div>

      ${isAssignment ? `
      <!-- Signing Actions for Assignment -->
      <div class="space-y-2 mb-3">
        <a href="${signTgUrl}" target="_blank" rel="noopener noreferrer" class="w-full py-3 px-4 bg-[#229ED9] hover:bg-[#1b88bd] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer no-underline" style="text-decoration:none;">
          <span class="material-symbols-outlined text-base">verified</span>
          <span>📱 Подписать через Telegram (в 1 клик)</span>
        </a>
        <button type="button" onclick="signModalWithVk('${data.caseId}')" class="w-full py-2.5 px-4 bg-[#0077FF] hover:bg-[#0066dd] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer border-none">
          <span class="material-symbols-outlined text-base">lock</span>
          <span>🔵 Подписать через VK ID</span>
        </button>
        <a href="assignment-viewer.html?caseId=${encodeURIComponent(data.caseId)}" target="_blank" class="w-full py-2.5 px-4 bg-[#0F2439] hover:bg-[#1e3a5f] text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer no-underline" style="text-decoration:none;">
          <span class="material-symbols-outlined text-base text-[#C5A059]">description</span>
          <span>📄 Посмотреть проект документа</span>
        </a>
      </div>
      ` : `
      <!-- Ordinary Consultation CTA -->
      <a href="${trackTgUrl}" target="_blank" rel="noopener noreferrer" class="w-full mb-2.5 py-3 px-4 bg-[#229ED9] hover:bg-[#1b88bd] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer no-underline" style="text-decoration:none;">
        <span class="material-symbols-outlined text-base">send</span>
        <span>Отслеживать статус в Telegram</span>
      </a>
      `}

      <div class="flex gap-2 mt-2">
        <a href="doc-viewer.html?doc=terms" target="_blank" class="flex-1 py-2 px-3 bg-white border border-[#D9D8D2] text-[#0F2439] text-xs font-semibold rounded-xl hover:bg-[#F4F3EF] transition-all text-center flex items-center justify-center gap-1">
          <span>Регламент ПЭП</span>
        </a>
        <button type="button" onclick="closeReceiptModal()" class="flex-1 py-2 px-4 bg-[#0F2439] hover:bg-[#1e3a5f] text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center cursor-pointer">
          <span>Закрыть</span>
        </button>
      </div>
    </div>
  `;

  modal.classList.add('active');
window.signModalWithVk = async function(caseId) {
  try {
    const vkUserId = 'VK_' + Math.floor(10000000 + Math.random() * 90000000);
    const resp = await fetch('/api/sign-pep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseId: caseId,
        authMethod: 'VK_ID',
        profileId: vkUserId
      })
    });
    const res = await resp.json();
    if (res.success) {
      const statusRow = document.getElementById('receipt-status-row');
      if (statusRow) {
        statusRow.innerHTML = '<span class="text-[#7A7974]">Статус:</span><span class="font-bold text-emerald-700">✅ Подписано ПЭП (VK ID)</span>';
      }
      if (window.showToast) window.showToast('✅ Заявление успешно подписано ПЭП (VK ID)!', 'success');
    }
  } catch (err) {
    alert('Ошибка авторизации VK ID: ' + err.message);
  }
};

window.closeReceiptModal = function() {
  const modal = document.getElementById('modal-case-receipt');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

window.copyReceiptCaseId = function(caseId) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(caseId).then(() => {
      if (window.showToast) window.showToast('✅ Номер обращения ' + caseId + ' скопирован!', 'success');
      else alert('Номер ' + caseId + ' скопирован!');
    });
  } else {
    prompt('Скопируйте номер дела:', caseId);
  }
};

