const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Restore original working native <video> tags in all HTML pages
const videoPageMappings = [
  { file: 'index.html', id: 'hands-video', src: '12.mp4', mode: 'scrub' },
  { file: 'about.html', id: 'about-hero-video', src: '12.mp4', mode: 'pingpong' },
  { file: 'calculator.html', id: 'calc-hero-video', src: '12.mp4', mode: 'pingpong' },
  { file: 'events.html', id: 'events-hero-video', src: '12.mp4', mode: 'pingpong' },
  { file: 'initiatives.html', id: 'initiatives-hero-video', src: '12.mp4', mode: 'pingpong' },
  { file: 'knowledge.html', id: 'knowledge-hero-video', src: '12.mp4', mode: 'pingpong' },
  { file: 'disclosure.html', id: 'disclosure-hero-video', src: '12.mp4', mode: 'pingpong' }
];

videoPageMappings.forEach(({ file, id, src, mode }) => {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) return;

  let html = fs.readFileSync(filePath, 'utf8');

  // Replace <canvas> back to <video> with autoplay, loop, muted, playsinline
  const canvasRegex = new RegExp(`<canvas\\s+id=["']${id}["'][\\s\\S]*?<\\/canvas>`, 'i');
  
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
                    yandex-video-translate="no"
                    data-yandex-video-assistant="false"
                    class="absolute inset-0 md:right-0 md:top-0 h-full w-full object-cover object-right opacity-35 md:opacity-45 mix-blend-multiply pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_85%)] md:[mask-image:radial-gradient(ellipse_at_70%_50%,black_30%,transparent_80%)] md:[-webkit-mask-image:radial-gradient(ellipse_at_70%_50%,black_30%,transparent_80%)]" style="pointer-events:none !important;"></video>`;

  if (canvasRegex.test(html)) {
    html = html.replace(canvasRegex, videoElement);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`Restored native video in ${file}`);
  }
});

// 2. Restore full working video controller in js/main.js
let mainJsPath = path.join(rootDir, 'js/main.js');

const originalVideoController = `
/* ══════════════════════════════════════════════════════════════════════════
   1. HERO SECTION VIDEO CONTROLLER (Smooth Autoplay / Scroll-Scrubbing)
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

  // Autoplay immediately
  const playVideo = () => {
    activeVideo.muted = true;
    const p = activeVideo.play();
    if (p !== undefined) {
      p.catch(() => {
        document.addEventListener('touchstart', () => activeVideo.play(), { once: true, passive: true });
        document.addEventListener('click', () => activeVideo.play(), { once: true, passive: true });
      });
    }
  };

  playVideo();

  // For index.html scroll-scrub
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
  }
}
`;

let mainJs = fs.readFileSync(mainJsPath, 'utf8');
mainJs = mainJs.replace(/\/\* ═+[\s\S]*?HERO CANVAS VIDEO ENGINE[\s\S]*?\n\}\s*\n\s*\/\* ─── 2\./, `${originalVideoController}\n/* ─── 2.`);
fs.writeFileSync(mainJsPath, mainJs, 'utf8');
console.log('js/main.js video controller restored!');

// 3. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading restored video setup...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(mainJsPath, '/var/www/yug-pravo/js/main.js', () => {
      let count = 0;
      videoPageMappings.forEach(({ file }) => {
        sftp.fastPut(path.join(rootDir, file), `/var/www/yug-pravo/${file}`, () => {
          count++;
          if (count === videoPageMappings.length) {
            conn.exec('systemctl reload nginx', () => {
              console.log('VIDEOS_RESTORED_AND_PLAYING_PERFECTLY');
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
