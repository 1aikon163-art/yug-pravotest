/**
 * ⚖️ АНО «ЦПЗ ЮГ-ПРАВО» — Telegram Mini App SDK Bridge
 * Полная интеграция с Telegram WebApp API 7.0+, тактильный отклик (Haptics),
 * безопасные отступы (Safe Area), синхронизация тем и отправка данных в бота.
 */
(function (global) {
  'use strict';

  class TelegramBridge {
    constructor() {
      this.isTelegram = typeof window !== 'undefined' && Boolean(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData);
      this.webApp = this.isTelegram ? window.Telegram.WebApp : this.createMockWebApp();
      this.user = this.webApp.initDataUnsafe?.user || null;
      this.startParam = this.webApp.initDataUnsafe?.start_param || '';

      this.init();
    }

    createMockWebApp() {
      return {
        initData: '',
        initDataUnsafe: {
          user: { id: 0, first_name: 'Гость', username: '' },
          start_param: ''
        },
        version: '7.10',
        platform: 'web',
        colorScheme: 'dark',
        themeParams: {
          bg_color: '#0a0c10',
          text_color: '#f8fafc',
          hint_color: '#94a3b8',
          link_color: '#c5a059',
          button_color: '#c5a059',
          button_text_color: '#0a0c10'
        },
        isExpanded: true,
        viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
        MainButton: {
          text: 'ОТПРАВИТЬ',
          color: '#c5a059',
          textColor: '#0a0c10',
          isVisible: false,
          show() { this.isVisible = true; },
          hide() { this.isVisible = false; },
          setText(t) { this.text = t; },
          onClick(fn) { this.callback = fn; }
        },
        BackButton: {
          isVisible: false,
          show() { this.isVisible = true; },
          hide() { this.isVisible = false; },
          onClick(fn) { this.callback = fn; }
        },
        HapticFeedback: {
          impactOccurred(style) { /* mock */ },
          notificationOccurred(type) { /* mock */ },
          selectionChanged() { /* mock */ }
        },
        setHeaderColor(c) {},
        setBackgroundColor(c) {},
        enableClosingConfirmation() {},
        ready() {},
        expand() {},
        close() {},
        sendData(data) { console.log('[TMA Mock sendData]', data); }
      };
    }

    init() {
      if (typeof window === 'undefined') return;

      try {
        this.webApp.ready();
        this.webApp.expand();
        
        if (this.webApp.enableClosingConfirmation) {
          this.webApp.enableClosingConfirmation();
        }

        if (this.webApp.setHeaderColor) {
          this.webApp.setHeaderColor('#0a0c10');
        }
        if (this.webApp.setBackgroundColor) {
          this.webApp.setBackgroundColor('#0a0c10');
        }

        // Помечаем DOM
        if (this.isTelegram) {
          document.documentElement.classList.add('is-telegram-webapp');
          document.body?.classList.add('is-telegram-webapp');
        }

        this.applyTheme();
        this.bindHaptics();
        this.setupBackButton();
        this.handleStartParam();
        this.interceptForms();
      } catch (err) {
        console.warn('[TelegramBridge Init Warning]', err);
      }
    }

    applyTheme() {
      if (!this.webApp?.themeParams) return;
      const root = document.documentElement;
      const tp = this.webApp.themeParams;

      if (tp.bg_color) root.style.setProperty('--tg-bg-color', tp.bg_color);
      if (tp.text_color) root.style.setProperty('--tg-text-color', tp.text_color);
      if (tp.hint_color) root.style.setProperty('--tg-hint-color', tp.hint_color);
      if (tp.link_color) root.style.setProperty('--tg-link-color', tp.link_color);
      if (tp.button_color) root.style.setProperty('--tg-button-color', tp.button_color);
      if (tp.button_text_color) root.style.setProperty('--tg-button-text-color', tp.button_text_color);
    }

    bindHaptics() {
      document.addEventListener('click', (e) => {
        const target = e.target.closest('button, .btn, a, input[type="submit"], .interactive-card, .tab-btn, .accordion-header');
        if (target) {
          this.hapticImpact('light');
        }
      }, { passive: true });
    }

    setupBackButton() {
      if (!this.webApp?.BackButton) return;

      const isSubPage = window.location.pathname !== '/' && !window.location.pathname.endsWith('index.html');
      if (isSubPage) {
        this.webApp.BackButton.show();
        this.webApp.BackButton.onClick(() => {
          this.hapticImpact('medium');
          if (window.history.length > 1) {
            window.history.back();
          } else {
            window.location.href = '/';
          }
        });
      } else {
        this.webApp.BackButton.hide();
      }
    }

    handleStartParam() {
      if (!this.startParam) return;
      console.log(`[TMA DeepLink] Start param: ${this.startParam}`);

      // Автоскролл или открытие соответствующего раздела
      setTimeout(() => {
        if (this.startParam === 'calculator' || this.startParam === 'duty') {
          if (!window.location.pathname.includes('calculator')) {
            window.location.href = '/calculator.html';
          }
        } else if (this.startParam === 'jkh') {
          const jkhEl = document.getElementById('jkh-section') || document.getElementById('initiatives');
          if (jkhEl) jkhEl.scrollIntoView({ behavior: 'smooth' });
        } else if (this.startParam === 'lapa') {
          const lapaEl = document.getElementById('charity') || document.getElementById('donation');
          if (lapaEl) lapaEl.scrollIntoView({ behavior: 'smooth' });
        } else if (this.startParam === 'consult') {
          const formEl = document.getElementById('consult-form') || document.getElementById('lead-form');
          if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }

    interceptForms() {
      // Автоматический перехват всех правовых заявок на странице для передачи в Telegram
      document.addEventListener('submit', (e) => {
        const form = e.target;
        if (!form) return;

        const formData = new FormData(form);
        const dataObj = {};
        formData.forEach((val, key) => { dataObj[key] = val; });

        if (this.isTelegram) {
          dataObj._tg_user = this.user;
          dataObj._source = 'Telegram Mini App (' + window.location.pathname + ')';
          
          this.hapticNotification('success');
          // Если форма не имеет собственного fetch, можем передать данные в бота
          if (form.getAttribute('data-tma-send') === 'true') {
            this.sendToBot(dataObj);
          }
        }
      }, { passive: true });
    }

    hapticImpact(style = 'medium') {
      try {
        if (this.webApp?.HapticFeedback) {
          this.webApp.HapticFeedback.impactOccurred(style);
        }
      } catch (e) {}
    }

    hapticNotification(type = 'success') {
      try {
        if (this.webApp?.HapticFeedback) {
          this.webApp.HapticFeedback.notificationOccurred(type);
        }
      } catch (e) {}
    }

    hapticSelection() {
      try {
        if (this.webApp?.HapticFeedback) {
          this.webApp.HapticFeedback.selectionChanged();
        }
      } catch (e) {}
    }

    sendToBot(data) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      this.hapticNotification('success');
      try {
        this.webApp.sendData(payload);
      } catch (e) {
        console.warn('[TMA sendData failed]', e);
      }
    }

    close() {
      try {
        this.webApp.close();
      } catch (e) {}
    }
  }

  global.TelegramBridge = new TelegramBridge();
})(typeof window !== 'undefined' ? window : global);
