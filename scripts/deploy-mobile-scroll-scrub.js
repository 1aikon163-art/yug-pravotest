const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// Update js/main.js with unified mobile + desktop scroll-scrubbing
let mainJsPath = path.join(rootDir, 'js/main.js');

const universalScrubMainJs = `/**
 * ЮГ-ПРАВО — Единый кинематографичный скролл-скруббинг для ПК и Мобильных
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

  // Принудительно отключаем фоновый автолуп для работы скролл-скруббинга на смартфонах
  activeVideo.pause();
  activeVideo.loop = false;
  activeVideo.removeAttribute('loop');

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

  activeVideo.currentTime = 0;

  const onScroll = () => {
    const rect = heroSection.getBoundingClientRect();
    const maxScroll = rect.height - window.innerHeight;
    const currentScroll = -rect.top;

    if (maxScroll > 0) {
      const rawProgress = (currentScroll / maxScroll);
      const progress = Math.min(Math.max(rawProgress, 0), 1);
      targetTime = progress * maxDuration;
    } else {
      // Для мобильных экранов: прокрутка первых 450px страницы плавно крутит видео
      const scrollRange = Math.max(window.innerHeight * 0.75, 380);
      const progress = Math.min(Math.max(window.scrollY / scrollRange, 0), 1);
      targetTime = progress * maxDuration;
    }
  };

  const smoothRender = (now) => {
    if (document.hidden) return;

    const delta = Math.min((now - lastTimestamp) / 1000, 0.1);
    lastTimestamp = now;

    // Мягкое сглаживание кадров на сенсорных экранах и колесе мыши
    const lambda = 8.5;
    const t = 1.0 - Math.exp(-lambda * delta);
    smoothedTime += (targetTime - smoothedTime) * t;

    const clampedTime = Math.min(maxDuration, Math.max(0, smoothedTime));

    if (activeVideo.readyState >= 2 && !activeVideo.seeking) {
      if (Math.abs(activeVideo.currentTime - clampedTime) > 0.005) {
        activeVideo.currentTime = clampedTime;
      }
    }
    activeLoopFrameId = requestAnimationFrame(smoothRender);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('touchmove', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  
  onScroll();
  activeLoopFrameId = requestAnimationFrame(smoothRender);

  // IntersectionObserver для экономии батареи (0% нагрузки при прокрутке вниз)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        if (activeLoopFrameId) cancelAnimationFrame(activeLoopFrameId);
        activeVideo.pause();
      } else {
        lastTimestamp = performance.now();
        activeLoopFrameId = requestAnimationFrame(smoothRender);
      }
    });
  }, { threshold: 0.05 });

  observer.observe(heroSection);

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

fs.writeFileSync(mainJsPath, universalScrubMainJs, 'utf8');
console.log('js/main.js updated with universal mobile + desktop scroll-scrubbing!');

// Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading mobile scroll test to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(mainJsPath, '/var/www/yug-pravo/js/main.js', () => {
      conn.exec('systemctl reload nginx', () => {
        console.log('MOBILE_SCROLL_SCRUB_DEPLOYED_SUCCESSFULLY');
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
