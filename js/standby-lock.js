/**
 * ЮГ-ПРАВО LegalTech — Production Mode
 * Платёжный шлюз Т-Банк: АКТИВЕН
 * Пожертвования: РАЗБЛОКИРОВАНЫ
 *
 * Этот файл заменяет standby-lock.js.
 * Модальные окна и формы работают в штатном режиме.
 */
(function () {
  'use strict';

  // Снимаем все глобальные заглушки если они были установлены ранее
  // (например если файл загружается после shared.js)
  if (window.__standbyRemoved) return;
  window.__standbyRemoved = true;

  // Убираем любые кнопки в состоянии «disabled» от техработ
  function unlockButtons() {
    document.querySelectorAll(
      'button[disabled], input[type="submit"][disabled]'
    ).forEach(btn => {
      // Только те кнопки, которые были заблокированы стэндбаем
      if (
        (btn.style.cursor === 'not-allowed') ||
        (btn.innerHTML && btn.innerHTML.includes('Прием заявок приостановлен'))
      ) {
        btn.disabled = false;
        btn.style.opacity = '';
        btn.style.cursor = '';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', unlockButtons);
  } else {
    unlockButtons();
  }

  console.log('✅ [ЮГ-ПРАВО] Платёжный шлюз активен. Режим техработ отключён.');
})();
