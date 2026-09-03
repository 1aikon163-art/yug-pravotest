const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Revert HTML hero containers back to native mobile flow (no mobile sticky)
const scrollPages = [
  { file: 'index.html', height: 'md:h-[190vh]' },
  { file: 'events.html', height: 'md:h-[190vh]' },
  { file: 'initiatives.html', height: 'md:h-[220vh]' },
  { file: 'knowledge.html', height: 'md:h-[190vh]' },
  { file: 'disclosure.html', height: 'md:h-[190vh]' }
];

scrollPages.forEach(({ file, height }) => {
  const p = path.join(rootDir, file);
  if (!fs.existsSync(p)) return;

  let html = fs.readFileSync(p, 'utf8');

  // Revert outer section
  html = html.replace(
    /class=["']relative w-full h-\[145vh\]\s*md:h-\[[^\]]*\]\s*bg-\[#F8F7F4\]\s*hero-scroll-container[^"']*["']/i,
    `class="relative w-full min-h-[85vh] md:min-h-0 ${height} bg-[#F8F7F4] hero-scroll-container overflow-hidden md:overflow-visible"`
  );

  // Revert inner div
  html = html.replace(
    /class=["']sticky top-0 h-\[100dvh\] w-full/i,
    'class="relative md:sticky md:top-0 min-h-[85vh] md:h-screen w-full'
  );

  fs.writeFileSync(p, html, 'utf8');
  console.log(`Reverted mobile hero layout for ${file}`);
});

// 2. Update js/main.js: Mobile plays 1 time naturally, Desktop uses smooth scroll scrubbing
const mainJsPath = path.join(rootDir, 'js/main.js');

const cleanMainJs = `/**
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
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  if (!menuBtn || !mobileNav) return;

  const newMenuBtn = menuBtn.cloneNode(true);
  menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);

  newMenuBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isHidden = mobileNav.classList.contains('hidden');
    if (isHidden) {
      mobileNav.classList.remove('hidden');
    } else {
      mobileNav.classList.add('hidden');
    }
    
    const icon = newMenuBtn.querySelector('.material-symbols-outlined');
    if (icon) {
      icon.textContent = isHidden ? 'close' : 'menu';
    }
  });

  document.addEventListener('click', (e) => {
    if (!mobileNav.contains(e.target) && !newMenuBtn.contains(e.target)) {
      mobileNav.classList.add('hidden');
      const icon = newMenuBtn.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = 'menu';
    }
  });

  mobileNav.querySelectorAll('a, button').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.add('hidden');
      const icon = newMenuBtn.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = 'menu';
    });
  });
}
`;

fs.writeFileSync(mainJsPath, cleanMainJs, 'utf8');

// 3. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading reverted layout & clean main.js to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(mainJsPath, '/var/www/yug-pravo/js/main.js', () => {
      let count = 0;
      scrollPages.forEach(({ file }) => {
        sftp.fastPut(path.join(rootDir, file), `/var/www/yug-pravo/${file}`, () => {
          count++;
          if (count === scrollPages.length) {
            conn.exec('systemctl reload nginx', () => {
              console.log('MOBILE_SCROLL_CANCELLED_AND_RESTORED');
              conn.end();
            });
          }
        });
      });
    });
  });
}).connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
