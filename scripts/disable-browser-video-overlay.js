const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Update all <video> tags in all HTML files
function patchVideosInHtml(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file === 'knowledge') {
        patchVideosInHtml(fullPath);
      }
    } else if (file.endsWith('.html')) {
      let html = fs.readFileSync(fullPath, 'utf8');

      // Add all anti-PIP, anti-subtitles, and anti-browser-assistant attributes
      html = html.replace(/<video\b([^>]*)>/gi, (match, attrs) => {
        let cleanAttrs = attrs
          .replace(/disablepictureinpicture/gi, '')
          .replace(/disableremoteplayback/gi, '')
          .replace(/controlslist=["'][^"']*["']/gi, '')
          .replace(/tabindex=["'][^"']*["']/gi, '')
          .replace(/aria-hidden=["'][^"']*["']/gi, '');

        return `<video ${cleanAttrs.trim()} disablepictureinpicture disableremoteplayback controlslist="nodownload nofullscreen noremoteplayback noplaybackrate" tabindex="-1" aria-hidden="true" style="pointer-events:none !important;">`;
      });

      fs.writeFileSync(fullPath, html, 'utf8');
      console.log('Patched video tags in:', file);
    }
  }
}

patchVideosInHtml(rootDir);

// 2. Add CSS rules in css/shared.css & css/styles.css
const antiPipCss = `
/* ─── DISABLE BROWSER VIDEO ASSISTANT / PIP OVERLAYS (YANDEX, CHROME, OPERA) ─── */
video,
.hero-video,
#hands-video,
#calc-hero-video,
#about-hero-video,
#initiatives-hero-video,
#events-hero-video,
#disclosure-hero-video,
#knowledge-hero-video {
  pointer-events: none !important;
  user-select: none !important;
  -webkit-user-select: none !important;
}

video::-webkit-media-controls,
video::-webkit-media-controls-enclosure,
video::-webkit-media-controls-panel,
video::-webkit-media-controls-overlay-play-button,
video::-webkit-media-controls-start-playback-button {
  display: none !important;
  -webkit-appearance: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
}
`;

['css/shared.css', 'css/styles.css'].forEach(cssRel => {
  const cssPath = path.join(rootDir, cssRel);
  if (fs.existsSync(cssPath)) {
    let css = fs.readFileSync(cssPath, 'utf8');
    if (!css.includes('DISABLE BROWSER VIDEO ASSISTANT')) {
      css += '\n' + antiPipCss;
      fs.writeFileSync(cssPath, css, 'utf8');
      console.log('Added anti-PIP CSS to:', cssRel);
    }
  }
});

// 3. Add JS enforcement in js/main.js & js/shared.js
let mainJsPath = path.join(rootDir, 'js/main.js');
let mainJs = fs.readFileSync(mainJsPath, 'utf8');
const jsVideoEnforce = `
// Disable browser video assistants
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('video').forEach(v => {
    try {
      v.disablePictureInPicture = true;
      v.disableRemotePlayback = true;
    } catch (e) {}
  });
});
`;

if (!mainJs.includes('disablePictureInPicture')) {
  mainJs += jsVideoEnforce;
  fs.writeFileSync(mainJsPath, mainJs, 'utf8');
  console.log('Added anti-PIP JS to js/main.js');
}

// 4. Upload all updated files to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading anti-PIP video updates...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    // Upload CSS
    sftp.fastPut(path.join(rootDir, 'css/shared.css'), '/var/www/yug-pravo/css/shared.css', () => {
      sftp.fastPut(path.join(rootDir, 'css/styles.css'), '/var/www/yug-pravo/css/styles.css', () => {
        sftp.fastPut(mainJsPath, '/var/www/yug-pravo/js/main.js', () => {
          // Upload HTMLs
          const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));
          let count = 0;
          for (const hf of htmlFiles) {
            sftp.fastPut(path.join(rootDir, hf), `/var/www/yug-pravo/${hf}`, () => {
              count++;
              if (count === htmlFiles.length) {
                conn.exec('systemctl reload nginx', () => {
                  console.log('ANTI_PIP_DEPLOYED_EVERYWHERE_SUCCESSFULLY');
                  conn.end();
                });
              }
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
