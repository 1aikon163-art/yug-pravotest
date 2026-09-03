const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

const exactVideoMappings = [
  { file: 'index.html', id: 'hands-video', src: 'hands.mp4', mode: 'scrub' },
  { file: 'about.html', id: 'about-hero-video', src: '12.mp4', mode: 'pingpong' },
  { file: 'calculator.html', id: 'calc-hero-video', src: 'ves.mp4', mode: 'pingpong' },
  { file: 'events.html', id: 'events-hero-video', src: 'slow.mp4', mode: 'pingpong' },
  { file: 'initiatives.html', id: 'initiatives-hero-video', src: 'kling.mp4', mode: 'pingpong' },
  { file: 'knowledge.html', id: 'knowledge-hero-video', src: 'baza.mp4', mode: 'pingpong' },
  { file: 'disclosure.html', id: 'disclosure-hero-video', src: '13.mp4', mode: 'pingpong' }
];

exactVideoMappings.forEach(({ file, id, src, mode }) => {
  const filePath = path.join(rootDir, file);
  let html = fs.readFileSync(filePath, 'utf8');

  // Replace src in <video id="...">
  const videoRegex = new RegExp(`<video\\s+id=["']${id}["'][\\s\\S]*?<\\/video>`, 'i');

  const videoElement = `<video id="${id}" 
                    src="${src}" 
                    data-video-mode="${mode}"
                    autoplay
                    loop
                    muted 
                    playsinline 
                    webkit-playsinline
                    preload="auto" 
                    disablepictureinpicture
                    disableremoteplayback
                    controlslist="nodownload nofullscreen noremoteplayback noplaybackrate"
                    tabindex="-1"
                    aria-hidden="true"
                    class="absolute inset-0 md:right-0 md:top-0 h-full w-full object-cover object-right opacity-35 md:opacity-45 mix-blend-multiply pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_85%)] md:[mask-image:radial-gradient(ellipse_at_70%_50%,black_30%,transparent_80%)] md:[-webkit-mask-image:radial-gradient(ellipse_at_70%_50%,black_30%,transparent_80%)]" style="pointer-events:none !important;"></video>`;

  html = html.replace(videoRegex, videoElement);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log(`Restored ${src} in ${file}`);
});

// Restore full multi-page video controller in js/main.js
let mainJsPath = path.join(rootDir, 'js/main.js');
let mainJs = fs.readFileSync(mainJsPath, 'utf8');

const multiVideoController = `
/* ══════════════════════════════════════════════════════════════════════════
   1. HERO SECTION MULTI-PAGE VIDEO CONTROLLER
   Supports hands.mp4, 12.mp4, ves.mp4, slow.mp4, kling.mp4, baza.mp4, 13.mp4
   ══════════════════════════════════════════════════════════════════════════ */
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

  const startPlayback = () => {
    activeVideo.muted = true;
    const playPromise = activeVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const onFirstTouch = () => {
          activeVideo.play().catch(() => {});
          document.removeEventListener('touchstart', onFirstTouch);
          document.removeEventListener('click', onFirstTouch);
        };
        document.addEventListener('touchstart', onFirstTouch, { once: true, passive: true });
        document.addEventListener('click', onFirstTouch, { once: true, passive: true });
      });
    }
  };

  startPlayback();

  // Scroll-Scrubbing specifically for index.html hands.mp4 on desktop (> 1024px)
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
`;

mainJs = mainJs.replace(/\/\* ═+[\s\S]*?HERO SECTION VIDEO CONTROLLER[\s\S]*?\n\}\s*\n\s*\/\* ─── 2\./, `${multiVideoController}\n/* ─── 2.`);
fs.writeFileSync(mainJsPath, mainJs, 'utf8');
console.log('Multi-page video controller updated in js/main.js');

// Upload all updated files to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading exact restored video files to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(mainJsPath, '/var/www/yug-pravo/js/main.js', () => {
      let count = 0;
      exactVideoMappings.forEach(({ file }) => {
        sftp.fastPut(path.join(rootDir, file), `/var/www/yug-pravo/${file}`, () => {
          count++;
          if (count === exactVideoMappings.length) {
            conn.exec('systemctl reload nginx', () => {
              console.log('ALL_EXACT_VIDEOS_RESTORED_ON_VPS_SUCCESSFULLY');
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
