/**
 * Telegram Mini App SDK Bridge & Mock Provider for Client Pages
 */
(function (global) {
  class TelegramBridge {
    constructor() {
      this.isTelegram = typeof window !== 'undefined' && Boolean(window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData);
      this.webApp = this.isTelegram ? window.Telegram.WebApp : this.createMockWebApp();
      this.init();
    }

    createMockWebApp() {
      return {
        initData: '',
        initDataUnsafe: {
          user: { id: 99999999, first_name: 'Пользователь', username: 'client' }
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
          impactOccurred(style) { console.log('[TMA Haptic impact]', style); },
          notificationOccurred(type) { console.log('[TMA Haptic notification]', type); }
        },
        ready() {},
        expand() {},
        sendData(data) { console.log('[TMA sendData]', data); }
      };
    }

    init() {
      try {
        this.webApp.ready();
        this.webApp.expand();
      } catch (e) {}
    }

    hapticImpact(style = 'medium') {
      try {
        if (this.webApp.HapticFeedback) this.webApp.HapticFeedback.impactOccurred(style);
      } catch (e) {}
    }

    hapticNotification(type = 'success') {
      try {
        if (this.webApp.HapticFeedback) this.webApp.HapticFeedback.notificationOccurred(type);
      } catch (e) {}
    }

    sendToBot(data) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      this.hapticNotification('success');
      this.webApp.sendData(payload);
    }
  }

  global.TelegramBridge = new TelegramBridge();
})(typeof window !== 'undefined' ? window : global);
