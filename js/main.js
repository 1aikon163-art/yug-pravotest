/**
 * ЮГ-ПРАВО — Высокопроизводительное управление Hero-видео
 * Мобильные: естественное 1-кратное воспроизведение
 * Десктоп: кинематографичный скролл-скруббинг и ambient-режимы
 */

document.addEventListener('DOMContentLoaded', () => {
  const checkIsDesktop = () => {
    return window.innerWidth > 768;
  };

  const activeVideo = document.getElementById('hands-video') ||
                      document.getElementById('calc-hero-video') ||
                      document.getElementById('events-hero-video') ||
                      document.getElementById('initiatives-hero-video') ||
                      document.getElementById('knowledge-hero-video') ||
                      document.getElementById('disclosure-hero-video') ||
                      document.getElementById('about-hero-video') ||
                      document.querySelector('video');

  const heroSection = document.getElementById('hero-section') || document.querySelector('.hero-scroll-container');

  if (!activeVideo || !heroSection) return;

  activeVideo.muted = true;
  activeVideo.defaultMuted = true;
  activeVideo.playsInline = true;
  activeVideo.setAttribute('playsinline', '');
  activeVideo.setAttribute('webkit-playsinline', '');

  let isHeroVisible = true;
  let activeLoopFrameId = null;
  let scrollListener = null;
  let resizeListener = null;

  // IntersectionObserver для экономии батареи
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isHeroVisible = entry.isIntersecting;
      if (!isHeroVisible) {
        if (activeLoopFrameId) cancelAnimationFrame(activeLoopFrameId);
        if (checkIsDesktop()) activeVideo.pause();
      } else {
        initMode();
      }
    });
  }, { threshold: 0.05 });

  observer.observe(heroSection);

  // Page Visibility API
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
    const isPingPong = (activeVideo.id === 'about-hero-video') || (activeVideo.id === 'calc-hero-video');

    if (!isDesktop) {
      // 📱 МОБИЛЬНЫЕ: Естественное 1-кратное воспроизведение (без скролла)
      activeVideo.loop = false;
      activeVideo.removeAttribute('loop');
      
      const playPromise = activeVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const onTouch = () => {
            activeVideo.play().catch(() => {});
            document.removeEventListener('touchstart', onTouch);
            document.removeEventListener('click', onTouch);
          };
          document.addEventListener('touchstart', onTouch, { once: true, passive: true });
          document.addEventListener('click', onTouch, { once: true, passive: true });
        });
      }
    } else {
      // 💻 ДЕСКТОП
      activeVideo.pause();
      activeVideo.loop = false;
      activeVideo.removeAttribute('loop');

      if (isPingPong) {
        // PING-PONG РЕЖИМ (Калькулятор, Об организации)
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
        // ⚡ РЕЖИМ СКРАББИНГА ПО СКРОЛЛУ (Главная, События, Инициативы, База знаний, Раскрытие)
        const isHands = (activeVideo.id === 'hands-video');
        const maxDuration = (activeVideo.duration && !isNaN(activeVideo.duration) && activeVideo.duration > 0.5) ? activeVideo.duration : (isHands ? 10.0 : 4.8);
        
        let targetTime = 0;
        let smoothedTime = 0;
        let lastTimestamp = performance.now();
        const speedMultiplier = parseFloat(heroSection.dataset.speedMultiplier || '1.0');

        activeVideo.currentTime = 0;

        const onScroll = () => {
          const rect = heroSection.getBoundingClientRect();
          const maxScroll = rect.height - window.innerHeight;
          const currentScroll = -rect.top;

          if (maxScroll > 0) {
            const rawProgress = (currentScroll / maxScroll) * speedMultiplier;
            const progress = Math.min(Math.max(rawProgress, 0), 1);
            targetTime = progress * maxDuration;
          } else {
            targetTime = 0;
          }
        };

        const smoothRender = (now) => {
          if (!checkIsDesktop() || !isHeroVisible || document.hidden) return;

          const delta = Math.min((now - lastTimestamp) / 1000, 0.1);
          lastTimestamp = now;

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

// ─── УНИВЕРСАЛЬНОЕ МОБИЛЬНОЕ МЕНЮ ───
window.toggleMobileMenu = function(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const mobileNav = document.getElementById('mobile-nav');
  const menuBtn = document.getElementById('mobile-menu-btn');
  if (!mobileNav) return;

  const isHidden = mobileNav.classList.contains('hidden');
  if (isHidden) {
    mobileNav.classList.remove('hidden');
  } else {
    mobileNav.classList.add('hidden');
  }

  if (menuBtn) {
    const icon = menuBtn.querySelector('.material-symbols-outlined');
    if (icon) {
      icon.textContent = isHidden ? 'close' : 'menu';
    }
  }
};

function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  if (!menuBtn || !mobileNav) return;

  menuBtn.onclick = window.toggleMobileMenu;

  document.addEventListener('click', (e) => {
    if (!mobileNav.contains(e.target) && !menuBtn.contains(e.target)) {
      mobileNav.classList.add('hidden');
      const icon = menuBtn.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = 'menu';
    }
  });

  mobileNav.querySelectorAll('a, button').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.add('hidden');
      const icon = menuBtn.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = 'menu';
    });
  });
}

// ─── УНИВЕРСАЛЬНОЕ ОКНО СВЯЗИ С РАЗРАБОТЧИКОМ (БЕЗ БЛОКИРОВОК T.ME) ───
window.openDeveloperModal = function(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }

  let modal = document.getElementById('modal-developer-contact');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-developer-contact';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0F2439]/70 backdrop-blur-md transition-opacity duration-300';
    modal.innerHTML = `
      <div class="relative w-full max-w-md bg-[#F8F7F4] border border-[#E0E0E0] rounded-2xl shadow-2xl p-6 sm:p-8 text-[#0F2439] animate-in fade-in zoom-in-95 duration-200">
        <!-- Close button -->
        <button type="button" onclick="closeDeveloperModal()" class="absolute top-4 right-4 p-2 text-[#5F5E5E] hover:text-[#0F2439] transition-colors rounded-full hover:bg-[#EBEAE5]">
          <span class="material-symbols-outlined text-xl">close</span>
        </button>

        <!-- Header -->
        <div class="flex items-center gap-3.5 mb-5 pb-4 border-b border-[#E0E0E0]">
          <div class="w-12 h-12 rounded-xl bg-[#0F2439] text-[#C5A059] flex items-center justify-center font-bold text-lg shadow-sm">
            ПШ
          </div>
          <div>
            <h3 class="font-bold text-base text-[#0F2439] leading-tight">Шарыпаев П. В.</h3>
            <p class="text-xs text-[#5F5E5E]">Архитектура, код и дизайн LegalTech</p>
          </div>
        </div>

        <p class="text-xs text-[#2C3E50] leading-relaxed mb-6">
          Разработка высокотехнологичных платформ, правовых калькуляторов, чат-ботов и веб-сервисов под ключ.
        </p>

        <!-- Actions -->
        <div class="flex flex-col gap-3">
          <!-- Direct App Link -->
          <a href="tg://resolve?domain=aikon163" class="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#2AABEE] hover:bg-[#229ED9] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all group">
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
            <span>Открыть приложение Telegram</span>
          </a>

          <!-- Web Telegram Link -->
          <a href="https://web.telegram.org/a/#?tgaddr=tg%3A%2F%2Fresolve%3Fdomain%3Daikon163" target="_blank" rel="noopener noreferrer" class="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-[#E0E0E0] hover:border-[#0F2439] text-[#0F2439] font-semibold text-xs tracking-wider rounded-xl transition-all">
            <span class="material-symbols-outlined text-sm">open_in_new</span>
            <span>Открыть в Telegram Web</span>
          </a>

          <!-- Copy Username Button -->
          <button type="button" onclick="copyTelegramUsername()" id="copy-tg-btn" class="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#EBEAE5] hover:bg-[#E0DFD8] text-[#2C3E50] font-mono text-xs rounded-xl transition-all">
            <span class="material-symbols-outlined text-sm">content_copy</span>
            <span id="copy-tg-text">Скопировать @aikon163</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (ev) => {
      if (ev.target === modal) closeDeveloperModal();
    });
  }

  modal.classList.remove('hidden');
};

window.closeDeveloperModal = function() {
  const modal = document.getElementById('modal-developer-contact');
  if (modal) modal.classList.add('hidden');
};

window.copyTelegramUsername = function() {
  navigator.clipboard.writeText('@aikon163').then(() => {
    const btnText = document.getElementById('copy-tg-text');
    if (btnText) {
      btnText.innerText = '✅ Скопировано в буфер!';
      setTimeout(() => { btnText.innerText = 'Скопировать @aikon163'; }, 3000);
    }
  }).catch(() => {
    prompt('Скопируйте никнейм в Telegram:', '@aikon163');
  });
};
