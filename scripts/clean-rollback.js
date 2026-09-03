const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Clean css/shared.css & css/styles.css (remove any injected anti-pip bloat)
['css/shared.css', 'css/styles.css'].forEach(cssRel => {
  const p = path.join(rootDir, cssRel);
  if (fs.existsSync(p)) {
    let css = fs.readFileSync(p, 'utf8');
    css = css.replace(/\/\* ─── DISABLE BROWSER VIDEO ASSISTANT[\s\S]*$/, '');
    fs.writeFileSync(p, css.trim() + '\n', 'utf8');
  }
});

// 2. Clean js/main.js (clean, standard video autoplay + scrub + mobile menu)
let mainJs = `/**
 * ЮГ-ПРАВО — Главный скрипт
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeroVideo();
  initMobileMenu();
});

/* ─── 1. HERO VIDEO CONTROLLER ─── */
function initHeroVideo() {
  const activeVideo = document.getElementById('hands-video') ||
                      document.getElementById('about-hero-video') ||
                      document.getElementById('calc-hero-video') ||
                      document.getElementById('events-hero-video') ||
                      document.getElementById('initiatives-hero-video') ||
                      document.getElementById('knowledge-hero-video') ||
                      document.getElementById('disclosure-hero-video') ||
                      document.querySelector('video');

  const heroSection = document.getElementById('hero-section') || document.querySelector('.hero-scroll-container');
  if (!activeVideo || !heroSection) return;

  activeVideo.muted = true;
  activeVideo.defaultMuted = true;
  activeVideo.playsInline = true;
  activeVideo.setAttribute('playsinline', '');
  activeVideo.setAttribute('webkit-playsinline', '');

  const start = () => {
    activeVideo.muted = true;
    const p = activeVideo.play();
    if (p !== undefined) {
      p.catch(() => {
        const onTouch = () => {
          activeVideo.play().catch(() => {});
          document.removeEventListener('touchstart', onTouch);
          document.removeEventListener('click', onTouch);
        };
        document.addEventListener('touchstart', onTouch, { once: true, passive: true });
        document.addEventListener('click', onTouch, { once: true, passive: true });
      });
    }
  };

  start();

  // Desktop scroll-scrub for hands.mp4 on index.html
  if (activeVideo.id === 'hands-video' && window.innerWidth >= 1024) {
    activeVideo.pause();
    activeVideo.loop = false;

    const onScroll = () => {
      const rect = heroSection.getBoundingClientRect();
      const total = heroSection.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const progress = Math.max(0, Math.min(1, -rect.top / total));
      if (activeVideo.duration) {
        activeVideo.currentTime = progress * activeVideo.duration;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }
}

/* ─── 2. MOBILE MENU ─── */
function initMobileMenu() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  if (!menuBtn || !mobileNav) return;

  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileNav.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!mobileNav.contains(e.target) && !menuBtn.contains(e.target)) {
      mobileNav.classList.add('hidden');
    }
  });
}
`;

fs.writeFileSync(path.join(rootDir, 'js/main.js'), mainJs, 'utf8');

// 3. Ensure all 7 HTML files have their exact native clean video tags
const cleanVideos = [
  { file: 'index.html', id: 'hands-video', src: 'hands.mp4', mode: 'scrub' },
  { file: 'about.html', id: 'about-hero-video', src: '12.mp4', mode: 'pingpong' },
  { file: 'calculator.html', id: 'calc-hero-video', src: 'ves.mp4', mode: 'pingpong' },
  { file: 'events.html', id: 'events-hero-video', src: 'slow.mp4', mode: 'pingpong' },
  { file: 'initiatives.html', id: 'initiatives-hero-video', src: 'kling.mp4', mode: 'pingpong' },
  { file: 'knowledge.html', id: 'knowledge-hero-video', src: 'baza.mp4', mode: 'pingpong' },
  { file: 'disclosure.html', id: 'disclosure-hero-video', src: '13.mp4', mode: 'pingpong' }
];

cleanVideos.forEach(({ file, id, src, mode }) => {
  const p = path.join(rootDir, file);
  let html = fs.readFileSync(p, 'utf8');

  // Replace video tag cleanly
  const videoRegex = new RegExp(`<(video|canvas)\\s+id=["']${id}["'][\\s\\S]*?<\\/(video|canvas)>`, 'i');
  const cleanTag = `<video id="${id}" 
                    src="${src}" 
                    data-video-mode="${mode}"
                    autoplay 
                    loop 
                    muted 
                    playsinline 
                    webkit-playsinline 
                    preload="auto" 
                    class="absolute inset-0 md:right-0 md:top-0 h-full w-full object-cover object-right opacity-35 md:opacity-45 mix-blend-multiply pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_85%)] md:[mask-image:radial-gradient(ellipse_at_70%_50%,black_30%,transparent_80%)] md:[-webkit-mask-image:radial-gradient(ellipse_at_70%_50%,black_30%,transparent_80%)]"></video>`;

  html = html.replace(videoRegex, cleanTag);
  fs.writeFileSync(p, html, 'utf8');
});

// 4. Upload all files to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading clean stable rollback...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(path.join(rootDir, 'js/main.js'), '/var/www/yug-pravo/js/main.js', () => {
      sftp.fastPut(path.join(rootDir, 'css/shared.css'), '/var/www/yug-pravo/css/shared.css', () => {
        sftp.fastPut(path.join(rootDir, 'css/styles.css'), '/var/www/yug-pravo/css/styles.css', () => {
          let count = 0;
          cleanVideos.forEach(({ file }) => {
            sftp.fastPut(path.join(rootDir, file), `/var/www/yug-pravo/${file}`, () => {
              count++;
              if (count === cleanVideos.length) {
                conn.exec('systemctl reload nginx', () => {
                  console.log('CLEAN_ROLLBACK_DEPLOYED_SUCCESSFULLY');
                  conn.end();
                });
              }
            });
          });
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
