const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// Update js/main.js: Mobile plays once and stops, Desktop uses smooth scroll scrubbing
let mainJsPath = path.join(rootDir, 'js/main.js');

const mobileOnceMainJs = `/**
 * ЮГ-ПРАВО — Высокопроизводительное управление Hero-видео
 * Мобильные: проигрывание 1 раз и остановка на финальном кадре
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
      // 📱 МОБИЛЬНЫЕ: ПРОИГРАТЬ 1 РАЗ И ОСТАНОВИТЬСЯ НА ФИНАЛЬНОМ КАДРЕ
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

          // Мягкое экспоненциальное демпфирование для шелковистой плавности
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
`;

fs.writeFileSync(mainJsPath, mobileOnceMainJs, 'utf8');
console.log('js/main.js updated: Mobile plays 1 time and stops gracefully!');

// Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading mobile play-once setup to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(mainJsPath, '/var/www/yug-pravo/js/main.js', () => {
      conn.exec('systemctl reload nginx', () => {
        console.log('MOBILE_PLAY_ONCE_DEPLOYED_SUCCESSFULLY');
        conn.end();
      });
    });
  });
}).connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
