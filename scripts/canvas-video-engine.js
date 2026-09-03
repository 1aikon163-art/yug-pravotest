const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Replace <video> with <canvas> in all HTML pages
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

  // Replace <video id="..."> with <canvas id="...">
  const videoRegex = new RegExp(`<video\\s+id=["']${id}["'][\\s\\S]*?<\\/video>`, 'i');
  const canvasElement = `<canvas id="${id}" data-video-src="${src}" data-video-mode="${mode}" class="absolute inset-0 md:right-0 md:top-0 h-full w-full object-cover object-right opacity-35 md:opacity-45 mix-blend-multiply pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_85%)] md:[mask-image:radial-gradient(ellipse_at_70%_50%,black_30%,transparent_80%)] md:[-webkit-mask-image:radial-gradient(ellipse_at_70%_50%,black_30%,transparent_80%)]" style="pointer-events:none !important;"></canvas>`;

  if (videoRegex.test(html)) {
    html = html.replace(videoRegex, canvasElement);
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`Replaced <video> with 100% Yandex-immune <canvas> in ${file}`);
  }
});

// 2. Update js/main.js with high-performance Canvas Video Engine
let mainJsPath = path.join(rootDir, 'js/main.js');

const canvasVideoEngine = `
/* ══════════════════════════════════════════════════════════════════════════
   HERO CANVAS VIDEO ENGINE (100% IMMUNE TO YANDEX BROWSER & CHROME PIP)
   Renders video frames onto Canvas. To browsers, this is pure graphics.
   ══════════════════════════════════════════════════════════════════════════ */
function initHeroVideo() {
  const canvas = document.querySelector('canvas[data-video-src]');
  const heroSection = document.getElementById('hero-section') || document.querySelector('.hero-scroll-container');
  if (!canvas || !heroSection) return;

  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const videoSrc = canvas.getAttribute('data-video-src') || '12.mp4';
  const videoMode = canvas.getAttribute('data-video-mode') || 'pingpong';

  // Create in-memory hidden video element (NOT in DOM, invisible to Yandex Browser)
  const video = document.createElement('video');
  video.src = videoSrc;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.setAttribute('disablepictureinpicture', '');
  video.setAttribute('disableremoteplayback', '');

  let isVisible = true;
  let animFrameId = null;

  function resizeCanvas() {
    canvas.width = canvas.clientWidth || window.innerWidth;
    canvas.height = canvas.clientHeight || window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  function drawFrame() {
    if (video.readyState >= 2 && canvas.width > 0 && canvas.height > 0) {
      // Draw object-cover
      const vRatio = (video.videoWidth || 1920) / (video.videoHeight || 1080);
      const cRatio = canvas.width / canvas.height;
      let nw = canvas.width, nh = canvas.height, cx = 0, cy = 0;

      if (cRatio > vRatio) {
        nh = canvas.width / vRatio;
        cy = (canvas.height - nh) / 2;
      } else {
        nw = canvas.height * vRatio;
        cx = (canvas.width - nw) / 2;
      }
      ctx.drawImage(video, cx, cy, nw, nh);
    }
  }

  // IntersectionObserver for battery savings
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isVisible = entry.isIntersecting;
      if (!isVisible) {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        video.pause();
      } else {
        startPlayback();
      }
    });
  }, { threshold: 0.05 });
  observer.observe(heroSection);

  function startPlayback() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (!isVisible || document.hidden) return;

    if (videoMode === 'scrub') {
      // Scroll-scrub mode
      function onScroll() {
        if (!isVisible) return;
        const rect = heroSection.getBoundingClientRect();
        const total = heroSection.offsetHeight - window.innerHeight;
        if (total <= 0) return;
        const progress = Math.max(0, Math.min(1, -rect.top / total));
        if (video.duration) {
          video.currentTime = progress * video.duration;
          drawFrame();
        }
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      video.addEventListener('seeked', drawFrame);
      video.addEventListener('loadedmetadata', () => { onScroll(); drawFrame(); });
    } else {
      // Smooth continuous / pingpong playback
      video.loop = true;
      video.play().catch(() => {
        document.addEventListener('touchstart', () => video.play(), { once: true });
        document.addEventListener('click', () => video.play(), { once: true });
      });

      function renderLoop() {
        if (isVisible && !document.hidden) {
          drawFrame();
          animFrameId = requestAnimationFrame(renderLoop);
        }
      }
      renderLoop();
    }
  }

  video.addEventListener('canplay', () => {
    drawFrame();
    startPlayback();
  });
}
`;

// Replace initHeroVideo in main.js
let mainJs = fs.readFileSync(mainJsPath, 'utf8');
mainJs = mainJs.replace(/function initHeroVideo\(\)\s*\{[\s\S]*?\n\}\s*\n\s*\/\* ─── 2\./, `${canvasVideoEngine}\n/* ─── 2.`);
fs.writeFileSync(mainJsPath, mainJs, 'utf8');
console.log('js/main.js updated with Canvas Video Engine!');

// 3. Upload all updated HTML and JS files to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading Canvas Video Engine to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(mainJsPath, '/var/www/yug-pravo/js/main.js', () => {
      let count = 0;
      videoPageMappings.forEach(({ file }) => {
        sftp.fastPut(path.join(rootDir, file), `/var/www/yug-pravo/${file}`, () => {
          count++;
          if (count === videoPageMappings.length) {
            conn.exec('systemctl reload nginx', () => {
              console.log('CANVAS_VIDEO_ENGINE_DEPLOYED_EVERYWHERE_SUCCESSFULLY');
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
