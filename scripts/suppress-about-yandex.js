const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Update about.html with yandex suppression tags
const aboutPath = path.join(rootDir, 'about.html');
let aboutHtml = fs.readFileSync(aboutPath, 'utf8');

// Add <html> yandex suppression
if (!aboutHtml.includes('yandex-video-translate="no"')) {
  aboutHtml = aboutHtml.replace(/<html\b([^>]*)>/i, '<html $1 yandex-video-translate="no" data-yandex-video-assistant="false">');
}

// Add <head> yandex suppression
if (!aboutHtml.includes('meta name="yandex"')) {
  aboutHtml = aboutHtml.replace(/<head>/i, '<head>\n    <meta name="yandex" content="notranslate">\n    <meta name="yandex-tableau-widget" content="ignore">');
}

// Update <video id="about-hero-video">
aboutHtml = aboutHtml.replace(
  /<video\s+id=["']about-hero-video["'][\s\S]*?<\/video>/i,
  `<video id="about-hero-video" 
                    src="12.mp4" 
                    data-video-mode="pingpong"
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
                    class="absolute inset-0 md:right-0 md:top-0 h-full w-full object-cover object-right opacity-35 md:opacity-45 mix-blend-multiply pointer-events-none [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_85%)] md:[mask-image:radial-gradient(ellipse_at_70%_50%,black_30%,transparent_80%)] md:[-webkit-mask-image:radial-gradient(ellipse_at_70%_50%,black_30%,transparent_80%)]"></video>`
);

fs.writeFileSync(aboutPath, aboutHtml, 'utf8');
console.log('about.html updated with Yandex video assistant suppression!');

// 2. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading about.html to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(aboutPath, '/var/www/yug-pravo/about.html', () => {
      conn.exec('systemctl reload nginx', () => {
        console.log('ABOUT_YANDEX_SUPPRESSION_DEPLOYED_SUCCESSFULLY');
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
