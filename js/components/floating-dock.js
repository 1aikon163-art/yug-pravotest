/**
 * ЮГ-ПРАВО — Компонент «Левосторонняя плавающая панель мессенджеров и быстрой связи»
 * (Left-Docked Neoclassical Messenger & Civic Communication Dock)
 * Стилизован строго по дизайн-системе: слоновая кость, античная латунь, графит, фактура мрамора.
 */

class FloatingMessengerDock {
  constructor(options = {}) {
    this.containerId = options.containerId || 'floating-messengers';
    this.position = options.position || 'left'; // 'left' or 'right'
    this.scrollThreshold = options.scrollThreshold || 140;
    this.domElement = null;
    this.init();
  }

  init() {
    if (document.getElementById(this.containerId)) return;

    this.domElement = document.createElement('div');
    this.domElement.id = this.containerId;
    this.domElement.className = 'floating-messenger-capsule dock-left';
    this.domElement.setAttribute('aria-label', 'Быстрая связь в мессенджерах');

    this.domElement.innerHTML = 
      <span class="floating-messenger-label">Связь</span>

      <!-- MAX Messenger Group / Дежурный чат (Monochrome Neoclassical Medallion) -->
      <a href="https://max.ru" target="_blank" rel="noopener noreferrer" class="floating-messenger-btn btn-max" title="Группа в MAX">
        <svg class="w-4 h-4 sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3C6.5 3 2 6.8 2 11.5c0 2.6 1.4 4.9 3.6 6.4L4.5 21l3.9-1.2c1.1.4 2.3.7 3.6.7 5.5 0 10-3.8 10-8.5S17.5 3 12 3z"/>
          <path d="M8 14.5V9.5L12 12.5L16 9.5V14.5"/>
        </svg>
        <span class="messenger-tooltip">Группа в MAX</span>
      </a>

      <!-- Telegram Channel (Monochrome Neoclassical Medallion) -->
      <a href="https://t.me/yug_pravo" target="_blank" rel="noopener noreferrer" class="floating-messenger-btn btn-tg" title="Telegram-канал">
        <svg class="w-4 h-4 sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21.5 3.5L2.5 10.8c-.8.3-.8 1.1 0 1.4l4.9 1.5 1.8 5.6c.2.6.8.8 1.3.4l2.7-2.3 4.8 3.5c.7.5 1.6.2 1.8-.7l3.2-15.5c.2-.9-.6-1.5-1.5-1.2z"/>
          <path d="M9.2 13.7l8.8-7.7-6.8 8.8"/>
        </svg>
        <span class="messenger-tooltip">Telegram-канал</span>
      </a>

      <!-- VK Community (Monochrome Neoclassical Medallion) -->
      <a href="https://vk.com" target="_blank" rel="noopener noreferrer" class="floating-messenger-btn btn-vk" title="Группа ВКонтакте">
        <svg class="w-4 h-4 sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3.5 7.5c.3 5.5 3.5 10 9 10 2 0 3.5-.8 4.2-2 .6-1 .5-2 1.8-1 1 1 1.5 1.8 3 1.8h1.8c.8 0 1.2-.5 1-1.3-.4-1.5-2.2-3.3-2.4-3.8-.4-.7 0-1.1.5-1.8 1.8-2.6 2.5-4 2.1-4.9-.3-.5-1-.5-1.8-.5h-2.2c-.7 0-1 .4-1.2.9-.8 1.8-2 3.6-2.8 3.6-.4 0-.6-.5-.6-1.5V7.5c0-1.2-.3-1.8-1.5-1.8-1 0-2 .4-2.6 1-.3.3 0 .6.4.6.8.2 1 .7 1 1.8v3.2c0 .8-.3 1-.7 1-.9 0-2.3-2.1-3.2-4.5-.3-.7-.6-1.3-1.4-1.3H4.1C3.3 7.5 3.2 8 3.5 7.5z"/>
        </svg>
        <span class="messenger-tooltip">Группа ВКонтакте</span>
      </a>
    ;

    document.body.appendChild(this.domElement);
    this.bindScroll();
  }

  bindScroll() {
    const handleScroll = () => {
      if (window.scrollY > this.scrollThreshold) {
        this.domElement.classList.add('is-visible');
      } else {
        this.domElement.classList.remove('is-visible');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }
}

// Global export
if (typeof window !== 'undefined') {
  window.FloatingMessengerDock = FloatingMessengerDock;
}
