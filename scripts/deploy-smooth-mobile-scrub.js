const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Enable sticky hero track for mobile in scroll pages
const scrollPages = [
  'index.html',
  'events.html',
  'initiatives.html',
  'knowledge.html',
  'disclosure.html'
];

scrollPages.forEach(file => {
  const p = path.join(rootDir, file);
  if (!fs.existsSync(p)) return;

  let html = fs.readFileSync(p, 'utf8');

  // Ensure hero-section has sticky track on mobile: h-[145vh] on mobile, md:h-[190vh] on desktop
  html = html.replace(
    /class=["']relative w-full min-h-\[[^\]]*\]\s*(?:md:min-h-0)?\s*md:h-\[[^\]]*\]\s*bg-\[#F8F7F4\]\s*hero-scroll-container[^"']*["']/i,
    'class="relative w-full h-[145vh] md:h-[190vh] bg-[#F8F7F4] hero-scroll-container overflow-hidden md:overflow-visible"'
  );

  // Ensure inner hero div is sticky on mobile and desktop: sticky top-0 h-[100dvh]
  html = html.replace(
    /class=["']relative\s+md:sticky\s+md:top-0\s+min-h-\[[^\]]*\]\s+md:h-screen\s+w-full/i,
    'class="sticky top-0 h-[100dvh] w-full'
  );
  html = html.replace(
    /class=["']relative\s+min-h-\[[^\]]*\]\s+md:min-h-\[[^\]]*\]\s+w-full/i,
    'class="sticky top-0 h-[100dvh] w-full'
  );

  fs.writeFileSync(p, html, 'utf8');
  console.log(`Configured mobile sticky scroll track for ${file}`);
});

// 2. High-performance, butter-smooth universal scroll engine in js/main.js
const mainJsPath = path.join(rootDir, 'js/main.js');

const ultraSmoothMobileMainJs = `/**
 * ЮГ-ПРАВО — Кинематографичный скролл-скруббинг для Мобильных и ПК (60/120 FPS)
 */

document.addEventListener('DOMContentLoaded', () => {
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
  activeVideo.pause();
  activeVideo.loop = false;
  activeVideo.removeAttribute('loop');

  const isPingPong = (activeVideo.id === 'about-hero-video') || (activeVideo.id === 'calc-hero-video');
  const isHands = (activeVideo.id === 'hands-video');

  const getVideoDuration = () => {
    if (activeVideo.duration && !isNaN(activeVideo.duration) && activeVideo.duration > 0.5) {
      return activeVideo.duration;
    }
    return isHands ? 10.0 : 4.8;
  };

  let maxDuration = getVideoDuration();
  let targetTime = 0;
  let smoothedTime = 0;
  let lastTimestamp = performance.now();
  let activeLoopFrameId = null;
  let isHeroVisible = true;

  activeVideo.currentTime = 0;

  // IntersectionObserver для экономии батареи (0% нагрузки при прокрутке страницы)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isHeroVisible = entry.isIntersecting;
      if (!isHeroVisible) {
        if (activeLoopFrameId) cancelAnimationFrame(activeLoopFrameId);
        activeVideo.pause();
      } else {
        lastTimestamp = performance.now();
        initVideoMode();
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
      initVideoMode();
    }
  });

  function initVideoMode() {
    if (activeLoopFrameId) cancelAnimationFrame(activeLoopFrameId);
    if (!isHeroVisible || document.hidden) return;

    if (isPingPong) {
      // ⚖️ PING-PONG РЕЖИМ (Калькулятор, Об организации)
      let startTimestamp = performance.now();

      const runPingPong = (now) => {
        if (!isHeroVisible || document.hidden) return;

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
        activeLoopFrameId = requestAnimationFrame(runPingPong);
      };

      activeLoopFrameId = requestAnimationFrame(runPingPong);

    } else {
      // ⚡ ШЕЛКОВИСТЫЙ СКРОЛЛ-СКРУББИНГ (МОБИЛКИ + ДЕСКТОП)
      const onScroll = () => {
        const rect = heroSection.getBoundingClientRect();
        const maxScroll = rect.height - window.innerHeight;
        const currentScroll = -rect.top;

        maxDuration = getVideoDuration();

        if (maxScroll > 0) {
          const rawProgress = (currentScroll / maxScroll);
          const progress = Math.min(Math.max(rawProgress, 0), 1);
          targetTime = progress * maxDuration;
        } else {
          targetTime = 0;
        }
      };

      const smoothPhysicsRender = (now) => {
        if (!isHeroVisible || document.hidden) return;

        const delta = Math.min((now - lastTimestamp) / 1000, 0.1);
        lastTimestamp = now;

        // Мягкое экспоненциальное сглаживание: шелковистый отклик на инерцию пальца
        const lambda = 8.5;
        const t = 1.0 - Math.exp(-lambda * delta);
        smoothedTime += (targetTime - smoothedTime) * t;

        const clampedTime = Math.min(maxDuration, Math.max(0, smoothedTime));

        // Аппаратная синхронизация кадров без троттлинга
        if (activeVideo.readyState >= 2 && !activeVideo.seeking) {
          if (Math.abs(activeVideo.currentTime - clampedTime) > 0.004) {
            activeVideo.currentTime = clampedTime;
          }
        }
        activeLoopFrameId = requestAnimationFrame(smoothPhysicsRender);
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('touchmove', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });

      onScroll();
      activeLoopFrameId = requestAnimationFrame(smoothPhysicsRender);
    }
  }

  initVideoMode();
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

fs.writeFileSync(mainJsPath, ultraSmoothMobileMainJs, 'utf8');
console.log('js/main.js updated with ultra-smooth universal mobile scroll-scrubbing!');

// 3. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading ultra-smooth mobile scroll setup to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(mainJsPath, '/var/www/yug-pravo/js/main.js', () => {
      let count = 0;
      scrollPages.forEach(file => {
        sftp.fastPut(path.join(rootDir, file), `/var/www/yug-pravo/${file}`, () => {
          count++;
          if (count === scrollPages.length) {
            conn.exec('systemctl reload nginx', () => {
              console.log('ULTRA_SMOOTH_MOBILE_SCROLL_DEPLOYED_SUCCESSFULLY');
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
