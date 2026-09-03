const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Optimize Hero Section Heights in HTML files (125vh instead of 190vh/220vh)
const scrubPages = [
  'index.html',
  'events.html',
  'initiatives.html',
  'knowledge.html',
  'disclosure.html'
];

scrubPages.forEach(file => {
  const p = path.join(rootDir, file);
  if (!fs.existsSync(p)) return;

  let html = fs.readFileSync(p, 'utf8');

  // Replace tall 190vh / 220vh with snappy 125vh and responsive speed multiplier
  html = html.replace(/md:h-\[(?:190|220)vh\]/gi, 'md:h-[125vh]');
  html = html.replace(/data-speed-multiplier=["'][^"']*["']/gi, 'data-speed-multiplier="1.35"');

  fs.writeFileSync(p, html, 'utf8');
  console.log(`Optimized scroll height for ${file} -> md:h-[125vh]`);
});

// 2. High-precision, Butter-smooth Video Engine in js/main.js
const mainJsPath = path.join(rootDir, 'js/main.js');

const ultraSmoothMainJs = `/**
 * ЮГ-ПРАВО — Кинематографичное и шелковистое управление Hero-видео
 */

document.addEventListener('DOMContentLoaded', () => {
  const isDesktop = window.innerWidth > 768;

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
      scrollListener = null;
    }

    if (!isHeroVisible || document.hidden) return;

    const isCurrentDesktop = window.innerWidth > 768;
    const isPingPong = (activeVideo.id === 'about-hero-video') || 
                       (activeVideo.id === 'calc-hero-video') || 
                       (activeVideo.dataset.videoMode === 'pingpong');

    if (!isCurrentDesktop) {
      // 📱 МОБИЛЬНЫЕ: 100% АППАРАТНЫЙ GPU LOOP
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
      // 💻 ДЕСКТОП
      activeVideo.pause();
      activeVideo.loop = false;
      activeVideo.removeAttribute('loop');

      if (isPingPong) {
        // PING-PONG РЕЖИМ (Калькулятор, Об организации)
        let startTimestamp = performance.now();

        const runDesktopPingPong = (now) => {
          if (window.innerWidth <= 768 || !isHeroVisible || document.hidden) return;

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
        // ⚡ УЛЬТРА-ПЛАВНЫЙ БЫСТРЫЙ СКРАББИНГ ПО СКРОЛЛУ (Главная, События, Инициативы, База знаний, Раскрытие)
        let targetTime = 0;
        let smoothedTime = 0;
        const maxDuration = (activeVideo.duration && !isNaN(activeVideo.duration) && activeVideo.duration > 0) ? activeVideo.duration : 4.8;
        let lastTimestamp = performance.now();
        const speedMultiplier = parseFloat(heroSection.dataset.speedMultiplier || '1.35');

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
          if (window.innerWidth <= 768 || !isHeroVisible || document.hidden) return;

          const delta = Math.min((now - lastTimestamp) / 1000, 0.1);
          lastTimestamp = now;

          // Оптимальное демпфирование: быстрый отзывчивый отклик без лагов и резины
          const lambda = 14.0;
          const t = 1.0 - Math.exp(-lambda * delta);
          smoothedTime += (targetTime - smoothedTime) * t;

          const clampedTime = Math.min(maxDuration, Math.max(0, smoothedTime));

          if (activeVideo.readyState >= 2 && !activeVideo.seeking) {
            if (Math.abs(activeVideo.currentTime - clampedTime) > 0.012) {
              activeVideo.currentTime = clampedTime;
            }
          }
          activeLoopFrameId = requestAnimationFrame(smoothRender);
        };

        scrollListener = onScroll;
        window.addEventListener('scroll', scrollListener, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
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

fs.writeFileSync(mainJsPath, ultraSmoothMainJs, 'utf8');
console.log('js/main.js updated with ultra-smooth responsive scrubbing physics!');

// 3. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading snappy scroll improvements to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(mainJsPath, '/var/www/yug-pravo/js/main.js', () => {
      let count = 0;
      scrubPages.forEach(file => {
        sftp.fastPut(path.join(rootDir, file), `/var/www/yug-pravo/${file}`, () => {
          count++;
          if (count === scrubPages.length) {
            conn.exec('systemctl reload nginx', () => {
              console.log('ULTRA_SMOOTH_SNAPPY_SCROLL_DEPLOYED_SUCCESSFULLY');
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
