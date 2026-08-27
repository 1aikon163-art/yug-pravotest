/**
 * ЮГ-ПРАВО — Адаптивное управление Hero-видео
 * 1. Стандартный режим (Главная, База знаний, Инициативы, События):
 *    • Десктоп (> 768px): Кинематографичный Apple-Style скраббинг видео по скроллу (220vh)
 *    • Мобильные (<= 768px): Бесшовный гармонический маятник (Sinusoidal Pendulum Loop)
 * 2. Режим Ping-Pong (Калькулятор #calc-hero-video / [data-video-mode="pingpong"]):
 *    • Непрерывное плавное циклическое воспроизведение вперед-назад на 60/120 FPS без привязки к скроллу.
 */

document.addEventListener('DOMContentLoaded', () => {
  const pingPongVideo = document.getElementById('calc-hero-video') || 
                        document.getElementById('about-hero-video') || 
                        document.querySelector('video[data-video-mode="pingpong"]');
  
  if (pingPongVideo) {
    // ─── PING-PONG РЕЖИМ (БЕСКОНЕЧНЫЙ ГАРМОНИЧЕСКИЙ ЦИКЛ БЕЗ СКРОЛЛА) ───
    pingPongVideo.muted = true;
    pingPongVideo.playsInline = true;
    pingPongVideo.removeAttribute('loop');
    pingPongVideo.pause();

    let startTimestamp = performance.now();

    const runPingPong = (now) => {
      const duration = (pingPongVideo.duration && !isNaN(pingPongVideo.duration) && pingPongVideo.duration > 0.5) ? pingPongVideo.duration : 4.6;
      const periodSeconds = duration * 2; // Время полного круга (туда и обратно)
      const maxLimit = Math.max(0.1, duration - 0.05);

      const elapsed = (now - startTimestamp) / 1000;
      // Гармоническая синусоида: скорость плавно затухает до 0 в точках разворота
      const progress = (1 - Math.cos((2 * Math.PI * elapsed) / periodSeconds)) / 2;
      const targetCurrentTime = progress * maxLimit;

      if (pingPongVideo.readyState >= 2 && !pingPongVideo.seeking) {
        if (Math.abs(pingPongVideo.currentTime - targetCurrentTime) > 0.012) {
          pingPongVideo.currentTime = targetCurrentTime;
        }
      }
      requestAnimationFrame(runPingPong);
    };

    requestAnimationFrame(runPingPong);
    return;
  }

  // ─── СТАНДАРТНЫЙ РЕЖИМ (СКРАББИНГ ПО СКРОЛЛУ НА ДЕСКТОПЕ + МАЯТНИК НА МОБИЛЬНЫХ) ───
  const video = document.getElementById('hands-video') || 
                document.getElementById('initiatives-hero-video') || 
                document.getElementById('dog-hero-video') || 
                document.getElementById('knowledge-hero-video') || 
                document.getElementById('events-hero-video') || 
                document.getElementById('disclosure-hero-video') || 
                document.querySelector('#hero-section video') ||
                document.querySelector('.hero-scroll-container video');

  const hero = document.getElementById('hero-section') || document.querySelector('.hero-scroll-container');

  if (video && hero) {
    const isDesktop = window.matchMedia('(min-width: 769px)');
    let activeLoopFrameId = null;
    let scrollListener = null;
    let resizeListener = null;
    let isMobileRunning = false;

    function initHeroVideoMode() {
      if (activeLoopFrameId) cancelAnimationFrame(activeLoopFrameId);
      if (scrollListener) {
        window.removeEventListener('scroll', scrollListener);
        window.removeEventListener('resize', resizeListener);
        scrollListener = null;
        resizeListener = null;
      }
      isMobileRunning = false;

      if (isDesktop.matches) {
        // ─── ДЕСКТОП: СКРАББИНГ ПО СКРОЛЛУ (220vh STICKY) ───
        video.pause();
        video.removeAttribute('loop');
        video.currentTime = 0;
        
        let targetTime = 0;
        let smoothedTime = 0;
        const maxDuration = (video.duration && !isNaN(video.duration) && video.duration > 0) ? video.duration : 4.8;
        let lastTimestamp = performance.now();
        const speedMultiplier = parseFloat(hero.dataset.speedMultiplier || video.dataset.speedMultiplier || '1.0');

        const onScroll = () => {
          const rect = hero.getBoundingClientRect();
          const maxScroll = rect.height - window.innerHeight;
          const currentScroll = -rect.top;

          if (maxScroll > 0) {
            const rawProgress = (currentScroll / maxScroll) * speedMultiplier;
            const progress = Math.min(Math.max(rawProgress, 0), 1);
            targetTime = progress * maxDuration;
          }
        };

        const smoothRender = (now) => {
          if (!isDesktop.matches) return;
          const delta = Math.min((now - lastTimestamp) / 1000, 0.1);
          lastTimestamp = now;

          const lambda = speedMultiplier > 1.0 ? 16.0 : 10.0;
          const t = 1.0 - Math.exp(-lambda * delta);
          smoothedTime += (targetTime - smoothedTime) * t;

          const clampedTime = Math.min(maxDuration, Math.max(0, smoothedTime));

          if (video.readyState >= 2 && !video.seeking) {
            if (Math.abs(video.currentTime - clampedTime) > 0.003) {
              video.currentTime = clampedTime;
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

      } else {
        // ─── МОБИЛЬНЫЕ: ГАРМОНИЧЕСКИЙ МАЯТНИК (БЕСШОВНЫЙ СИНУСОИДАЛЬНЫЙ PING-PONG) ───
        isMobileRunning = true;
        video.muted = true;
        video.playsInline = true;
        video.removeAttribute('loop');
        video.pause();

        const speedMultiplier = parseFloat(hero.dataset.speedMultiplier || video.dataset.speedMultiplier || '1.0');
        const periodSeconds = 9.2 / speedMultiplier;
        const maxLimit = (video.duration && !isNaN(video.duration) && video.duration > 0.5) ? Math.max(0.1, video.duration - 0.05) : 4.70;
        let startTimestamp = performance.now();

        const harmonicLoop = (now) => {
          if (!isMobileRunning || isDesktop.matches) return;

          const elapsed = (now - startTimestamp) / 1000;
          const progress = (1 - Math.cos((2 * Math.PI * elapsed) / periodSeconds)) / 2;
          const targetCurrentTime = progress * maxLimit;

          if (video.readyState >= 2 && !video.seeking) {
            if (Math.abs(video.currentTime - targetCurrentTime) > 0.012) {
              video.currentTime = targetCurrentTime;
            }
          }
          activeLoopFrameId = requestAnimationFrame(harmonicLoop);
        };

        activeLoopFrameId = requestAnimationFrame(harmonicLoop);
      }
    }

    initHeroVideoMode();
    isDesktop.addEventListener('change', initHeroVideoMode);
  }
});

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
    
    // Кнопка перехода со счетчиком на Главной
    const kbAllBtn = document.getElementById('kb-all-btn');
    if (kbAllBtn) {
      kbAllBtn.innerHTML = `Все ${count} ${word} <span class="material-symbols-outlined ml-1.5 text-sm">arrow_forward</span>`;
    }

    // Все элементы с атрибутом data-kb-counter
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
  document.addEventListener('DOMContentLoaded', initDynamicCounters);
} else {
  initDynamicCounters();
}

// Service Worker Registration for Instant Offline Cache
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
