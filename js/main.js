/**
 * ЮГ-ПРАВО — Высокопроизводительное управление Hero-видео
 * 
 * • ДЕСКТОП (> 768px):
 *   - Страницы со скроллом (Главная, База знаний, События, Раскрытие, Инициативы): кинематографичный скраббинг по скроллу.
 *   - Страницы Ping-Pong (Калькулятор, Об организации): гармонический синусоидальный цикл.
 *   - Автопауза через IntersectionObserver и Page Visibility API (0% CPU/GPU в фоне).
 * 
 * • МОБИЛЬНЫЕ (<= 768px):
 *   - Аппаратное нативное воспроизведение GPU (60–120 FPS без дерганий и лагов).
 *   - Умная автопауза при прокрутке вниз и переключении вкладок.
 */

document.addEventListener('DOMContentLoaded', () => {
  const checkIsDesktop = () => {
    const isWideScreen = window.innerWidth > 1024;
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia('(pointer: coarse)').matches;
    return isWideScreen && !isTouch;
  };

  // 1. Поиск видео элементов
  const pingPongVideo = document.getElementById('calc-hero-video') || 
                        document.getElementById('about-hero-video') || 
                        document.querySelector('video[data-video-mode="pingpong"]');

  const scrollVideo = document.getElementById('hands-video') || 
                      document.getElementById('initiatives-hero-video') || 
                      document.getElementById('dog-hero-video') || 
                      document.getElementById('knowledge-hero-video') || 
                      document.getElementById('events-hero-video') || 
                      document.getElementById('disclosure-hero-video') || 
                      document.querySelector('#hero-section video') ||
                      document.querySelector('.hero-scroll-container video');

  const activeVideo = pingPongVideo || scrollVideo;
  const heroSection = document.getElementById('hero-section') || document.querySelector('.hero-scroll-container');

  if (!activeVideo || !heroSection) return;

  // Базовые атрибуты для всех мобильных браузеров (iOS Safari / Android Chrome)
  activeVideo.muted = true;
  activeVideo.defaultMuted = true;
  activeVideo.playsInline = true;
  activeVideo.setAttribute('playsinline', '');
  activeVideo.setAttribute('webkit-playsinline', '');

  let isHeroVisible = true;
  let activeLoopFrameId = null;
  let scrollListener = null;
  let resizeListener = null;

  // ─── IntersectionObserver для экономии батареи (0% нагрузки вне экрана) ───
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isHeroVisible = entry.isIntersecting;
      if (!isHeroVisible) {
        if (activeLoopFrameId) cancelAnimationFrame(activeLoopFrameId);
        activeVideo.pause();
      } else {
        initMode();
      }
    });
  }, { threshold: 0.05 });

  observer.observe(heroSection);

  // ─── Page Visibility API (Пауза при смене вкладки) ───
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (activeLoopFrameId) cancelAnimationFrame(activeLoopFrameId);
      activeVideo.pause();
    } else if (isHeroVisible) {
      initMode();
    }
  });

  function initMode() {
    if (activeLoopFrameId) cancelAnimationFrame(activeLoopFrameId);
    if (scrollListener) {
      window.removeEventListener('scroll', scrollListener);
      window.removeEventListener('resize', resizeListener);
      scrollListener = null;
      resizeListener = null;
    }

    if (!isHeroVisible || document.hidden) return;

    const isDesktop = checkIsDesktop();

    if (!isDesktop) {
      // ══════════════════════════════════════════════════════════════
      // МОБИЛЬНЫЕ И ПЛАНШЕТЫ: 100% АППАРАТНЫЙ 60/120 FPS GPU LOOP
      // ══════════════════════════════════════════════════════════════
      activeVideo.loop = true;
      activeVideo.setAttribute('loop', '');
      
      const playPromise = activeVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const onFirstTouch = () => {
            activeVideo.play().catch(() => {});
            document.removeEventListener('touchstart', onFirstTouch);
          };
          document.addEventListener('touchstart', onFirstTouch, { once: true, passive: true });
        });
      }
    } else {
      // ══════════════════════════════════════════════════════════════
      // ДЕСКТОП С МЫШЬЮ (> 1024px)
      // ══════════════════════════════════════════════════════════════
      activeVideo.pause();
      activeVideo.loop = false;
      activeVideo.removeAttribute('loop');

      if (pingPongVideo) {
        // РЕЖИМ PING-PONG НА ДЕСКТОПЕ
        let startTimestamp = performance.now();

        const runDesktopPingPong = (now) => {
          if (!checkIsDesktop() || !isHeroVisible || document.hidden) return;

          const duration = (activeVideo.duration && !isNaN(activeVideo.duration) && activeVideo.duration > 0.5) ? activeVideo.duration : 4.6;
          const periodSeconds = duration * 2;
          const maxLimit = Math.max(0.1, duration - 0.05);

          const elapsed = (now - startTimestamp) / 1000;
          const progress = (1 - Math.cos((2 * Math.PI * elapsed) / periodSeconds)) / 2;
          const targetCurrentTime = progress * maxLimit;

          if (activeVideo.readyState >= 2 && !activeVideo.seeking) {
            if (Math.abs(activeVideo.currentTime - targetCurrentTime) > 0.01) {
              activeVideo.currentTime = targetCurrentTime;
            }
          }
          activeLoopFrameId = requestAnimationFrame(runDesktopPingPong);
        };

        activeLoopFrameId = requestAnimationFrame(runDesktopPingPong);

      } else {
        // РЕЖИМ СКРАББИНГА ПО СКРОЛЛУ НА ДЕСКТОПЕ (Плавная кинематографичная синхронизация)
        let targetTime = 0;
        let smoothedTime = 0;
        const maxDuration = (activeVideo.duration && !isNaN(activeVideo.duration) && activeVideo.duration > 0) ? activeVideo.duration : 4.8;
        let lastTimestamp = performance.now();
        const speedMultiplier = parseFloat(heroSection.dataset.speedMultiplier || activeVideo.dataset.speedMultiplier || '1.0');

        const onScroll = () => {
          const rect = heroSection.getBoundingClientRect();
          const maxScroll = rect.height - window.innerHeight;
          const currentScroll = -rect.top;

          if (maxScroll > 0) {
            const rawProgress = (currentScroll / maxScroll) * speedMultiplier;
            const progress = Math.min(Math.max(rawProgress, 0), 1);
            targetTime = progress * maxDuration;
          }
        };

        const smoothRender = (now) => {
          if (!checkIsDesktop() || !isHeroVisible || document.hidden) return;

          const delta = Math.min((now - lastTimestamp) / 1000, 0.1);
          lastTimestamp = now;

          // Мягкое экспоненциальное демпфирование для шелковистой плавности без рывков
          const lambda = 7.5;
          const t = 1.0 - Math.exp(-lambda * delta);
          smoothedTime += (targetTime - smoothedTime) * t;

          const clampedTime = Math.min(maxDuration, Math.max(0, smoothedTime));

          if (activeVideo.readyState >= 2 && !activeVideo.seeking) {
            if (Math.abs(activeVideo.currentTime - clampedTime) > 0.003) {
              activeVideo.currentTime = clampedTime;
            }
          }
          activeLoopFrameId = requestAnimationFrame(smoothRender);
        };

        scrollListener = onScroll;
        resizeListener = onScroll;
        window.addEventListener('scroll', scrollListener, { passive: true });
        window.addEventListener('resize', resizeListener, { passive: true });
        onScroll();
        activeLoopFrameId = requestAnimationFrame(smoothRender);
      }
    }
  }

  initMode();
  window.addEventListener('resize', initMode, { passive: true });
  initMobileMenu();
});

// ─── УНИВЕРСАЛЬНОЕ МОБИЛЬНОЕ МЕНЮ (ДЛЯ ВСЕХ СТРАНИЦ) ───
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  if (!menuBtn || !mobileNav) return;
  if (menuBtn.dataset.menuBound === 'true') return;
  menuBtn.dataset.menuBound = 'true';

  menuBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const willOpen = mobileNav.classList.contains('hidden');
    if (willOpen) {
      mobileNav.classList.remove('hidden');
    } else {
      mobileNav.classList.add('hidden');
    }
    const icon = menuBtn.querySelector('.material-symbols-outlined');
    if (icon) {
      icon.textContent = willOpen ? 'close' : 'menu';
    }
  });

  // Закрытие при клике вне меню
  document.addEventListener('click', (e) => {
    if (!mobileNav.contains(e.target) && !menuBtn.contains(e.target)) {
      mobileNav.classList.add('hidden');
      const icon = menuBtn.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = 'menu';
    }
  });

  // Закрытие при клике на любую ссылку в меню
  mobileNav.querySelectorAll('a, button').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.add('hidden');
      const icon = menuBtn.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = 'menu';
    });
  });
}

// ─── ДИНАМИЧЕСКИЙ СЧЕТЧИК СТАТЕЙ И ИНСТРУКЦИЙ ───
function initDynamicCounters() {
  function pluralize(n, forms) {
    n = Math.abs(n) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return forms[2];
    if (n1 > 1 && n1 < 5) return forms[1];
    if (n1 === 1) return forms[0];
    return forms[2];
  }

  // 1. Подсчет карточек Базы Знаний
  const kbCards = document.querySelectorAll('#knowledge .horizontal-scroll-container > .material-glass-card, #kb-container > .kb-item, .kb-article-card');
  if (kbCards.length > 0) {
    const count = kbCards.length;
    const word = pluralize(count, ['инструкция', 'инструкции', 'инструкций']);
    
    const kbAllBtn = document.getElementById('kb-all-btn');
    if (kbAllBtn) {
      kbAllBtn.innerHTML = `Все ${count} ${word} <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>`;
    }

    document.querySelectorAll('[data-kb-counter]').forEach(el => {
      el.textContent = `${count} ${word}`;
    });
  }

  // 2. Подсчет событий
  const eventCards = document.querySelectorAll('#events-container > .event-card, [data-event-item]');
  if (eventCards.length > 0) {
    const eventCount = eventCards.length;
    const allEventsFilter = document.querySelector('[data-category="all"]');
    if (allEventsFilter) {
      allEventsFilter.textContent = `Все события (${eventCount})`;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initDynamicCounters();
    initMobileMenu();
  });
} else {
  initDynamicCounters();
  initMobileMenu();
}

// Service Worker Registration for Instant Offline Cache
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
