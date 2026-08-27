/**
 * Telegram Mini App SDK Bridge & Mock Provider
 * Works seamlessly both inside Telegram and standalone in regular desktop/mobile browsers.
 */

(function (global) {
  class TelegramBridge {
    constructor() {
      this.isTelegram = typeof window !== 'undefined' && Boolean(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData);
      this.webApp = this.isTelegram ? window.Telegram.WebApp : this.createMockWebApp();
      this.init();
    }

    createMockWebApp() {
      console.info('[TelegramBridge] Running in standalone browser mock mode.');
      return {
        initData: '',
        initDataUnsafe: {
          user: {
            id: 99999999,
            first_name: 'Тестовый',
            last_name: 'Пользователь',
            username: 'legal_client_demo',
            language_code: 'ru'
          }
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
          button_text_color: '#0a0c10',
          secondary_bg_color: '#12161f'
        },
        isExpanded: true,
        viewportHeight: window.innerHeight,
        viewportStableHeight: window.innerHeight,
        headerColor: '#0a0c10',
        backgroundColor: '#0a0c10',
        MainButton: {
          text: 'ОТПРАВИТЬ ЗАЯВКУ',
          color: '#c5a059',
          textColor: '#0a0c10',
          isVisible: false,
          isActive: true,
          isProgressVisible: false,
          show() { this.isVisible = true; console.log('[TMA Mock] MainButton.show()'); },
          hide() { this.isVisible = false; console.log('[TMA Mock] MainButton.hide()'); },
          setText(t) { this.text = t; },
          onClick(fn) { this.callback = fn; },
          offClick(fn) { this.callback = null; },
          showProgress() { this.isProgressVisible = true; },
          hideProgress() { this.isProgressVisible = false; }
        },
        BackButton: {
          isVisible: false,
          show() { this.isVisible = true; },
          hide() { this.isVisible = false; },
          onClick(fn) { this.callback = fn; },
          offClick(fn) { this.callback = null; }
        },
        HapticFeedback: {
          impactOccurred(style) { console.log(`[TMA Haptic] impactOccurred: ${style}`); },
          notificationOccurred(type) { console.log(`[TMA Haptic] notificationOccurred: ${type}`); },
          selectionChanged() { console.log('[TMA Haptic] selectionChanged'); }
        },
        ready() { console.log('[TMA] ready()'); },
        expand() { console.log('[TMA] expand()'); },
        close() { console.log('[TMA] close()'); },
        sendData(data) { console.log('[TMA] sendData:', data); alert('Отправлено в бота: ' + data); },
        openLink(url) { window.open(url, '_blank'); },
        openTelegramLink(url) { window.open(url, '_blank'); }
      };
    }

    init() {
      try {
        this.webApp.ready();
        this.webApp.expand();
        this.applyTheme();
      } catch (e) {
        console.warn('[TelegramBridge] Init error:', e);
      }
    }

    /**
     * Trigger light/medium/heavy haptic vibration feedback
     * @param {'light'|'medium'|'heavy'|'rigid'|'soft'} style 
     */
    hapticImpact(style = 'medium') {
      try {
        if (this.webApp.HapticFeedback) {
          this.webApp.HapticFeedback.impactOccurred(style);
        }
      } catch (e) {
        console.debug('Haptic not supported on this device', e);
      }
    }

    /**
     * Trigger success/warning/error haptic feedback
     * @param {'success'|'warning'|'error'} type 
     */
    hapticNotification(type = 'success') {
      try {
        if (this.webApp.HapticFeedback) {
          this.webApp.HapticFeedback.notificationOccurred(type);
        }
      } catch (e) {
        console.debug('Haptic notification error', e);
      }
    }

    /**
     * Sync CSS variables with Telegram Theme Params
     */
    applyTheme() {
      if (!this.webApp.themeParams) return;
      const root = document.documentElement;
      const theme = this.webApp.themeParams;
      if (theme.bg_color) root.style.setProperty('--tg-bg-color', theme.bg_color);
      if (theme.text_color) root.style.setProperty('--tg-text-color', theme.text_color);
      if (theme.button_color) root.style.setProperty('--tg-button-color', theme.button_color);
      if (theme.button_text_color) root.style.setProperty('--tg-button-text-color', theme.button_text_color);
    }

    /**
     * Send structured payload back to the Telegram Bot
     * @param {Object} data 
     */
    sendToBot(data) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      this.hapticNotification('success');
      this.webApp.sendData(payload);
    }
  }

  global.TelegramBridge = new TelegramBridge();
})(typeof window !== 'undefined' ? window : global);
