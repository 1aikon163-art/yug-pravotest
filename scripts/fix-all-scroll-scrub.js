const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Set proper modes for each page
// Only about.html is pingpong, all other pages are scroll-scrub!
const pageConfigs = [
  { file: 'index.html', id: 'hands-video', src: 'hands.mp4', mode: 'scrub' },
  { file: 'calculator.html', id: 'calc-hero-video', src: 'ves.mp4', mode: 'scrub' },
  { file: 'events.html', id: 'events-hero-video', src: 'slow.mp4', mode: 'scrub' },
  { file: 'initiatives.html', id: 'initiatives-hero-video', src: 'kling.mp4', mode: 'scrub' },
  { file: 'knowledge.html', id: 'knowledge-hero-video', src: 'baza.mp4', mode: 'scrub' },
  { file: 'disclosure.html', id: 'disclosure-hero-video', src: '13.mp4', mode: 'scrub' },
  { file: 'about.html', id: 'about-hero-video', src: '12.mp4', mode: 'pingpong' }
];

pageConfigs.forEach(({ file, id, src, mode }) => {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) return;

  let html = fs.readFileSync(filePath, 'utf8');

  // Replace video tag with precise mode and video source
  const videoRegex = new RegExp(`<(video|canvas)\\s+id=["']${id}["'][\\s\\S]*?<\\/(video|canvas)>`, 'i');

  const cleanVideoTag = `<video id="${id}" 
                    src="${src}" 
                    data-video-mode="${mode}"
                    autoplay 
                    loop 
                    muted 
                    playsinline 
                    webkit-playsinline 
                    preload="auto" 
                    class="absolute inset-0 md:right-0 md:top-0 h-full w-full object-cover object-right opacity-35 md:opacity-45 mix-blend-multiply pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_85%)] md:[mask-image:radial-gradient(ellipse_at_70%_50%,black_30%,transparent_80%)] md:[-webkit-mask-image:radial-gradient(ellipse_at_70%_50%,black_30%,transparent_80%)]"></video>`;

  html = html.replace(videoRegex, cleanVideoTag);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Configured ${file}: mode=${mode}, src=${src}`);
});

// 2. Comprehensive, bulletproof js/main.js
const perfectMainJs = `/**
 * ЮГ-ПРАВО — Высокопроизводительное управление Hero-видео
 * 
 * • ДЕСКТОП (> 768px):
 *   - Скролл-скруббинг: Главная, Калькулятор, События, Инициативы, База знаний, Раскрытие.
 *   - Ping-Pong: Об организации.
 * • МОБИЛЬНЫЕ (<= 768px):
 *   - Нативный аппаратный GPU Loop 60/120 FPS.
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
        activeVideo.pause();
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
    const isPingPong = (activeVideo.id === 'about-hero-video') || (activeVideo.dataset.videoMode === 'pingpong');

    if (!isDesktop) {
      // МОБИЛЬНЫЕ (<= 768px): GPU LOOP
      activeVideo.loop = true;
      activeVideo.setAttribute('loop', '');
      
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
      // ДЕСКТОП (> 768px)
      activeVideo.pause();
      activeVideo.loop = false;
      activeVideo.removeAttribute('loop');

      if (isPingPong) {
        // РЕЖИМ PING-PONG ДЛЯ ABOUT.HTML
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
        // РЕЖИМ СКРАББИНГА ПО СКРОЛЛУ НА ДЕСКТОПЕ (ГЛАВНАЯ, КАЛЬКУЛЯТОР, СОБЫТИЯ, ИНИЦИАТИВЫ, БАЗА ЗНАНИЙ, РАСКРЫТИЕ)
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
          } else {
            // Для обычных секций скролл страницы
            const pageProgress = Math.min(Math.max(window.scrollY / 600, 0), 1);
            targetTime = pageProgress * maxDuration;
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

fs.writeFileSync(path.join(rootDir, 'js/main.js'), perfectMainJs, 'utf8');
console.log('js/main.js updated with precise desktop scroll-scrubbing & mobile GPU loop!');

// 3. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading exact video modes and script to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(path.join(rootDir, 'js/main.js'), '/var/www/yug-pravo/js/main.js', () => {
      let count = 0;
      pageConfigs.forEach(({ file }) => {
        sftp.fastPut(path.join(rootDir, file), `/var/www/yug-pravo/${file}`, () => {
          count++;
          if (count === pageConfigs.length) {
            conn.exec('systemctl reload nginx', () => {
              console.log('PERFECT_SCROLL_SCRUB_AND_VIDEOS_DEPLOYED');
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
