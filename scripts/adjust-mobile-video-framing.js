const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// Update index.html hero video for wider mobile framing (less zoom, more video in frame)
let indexPath = path.join(rootDir, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

// Replace hero video tag with optimized mobile framing (object-contain / wider aspect ratio fit on mobile, object-cover on desktop)
const oldVideoRegex = /<video\s+id=["']hands-video["'][\s\S]*?<\/video>/i;

const widerMobileVideo = `<video id="hands-video" 
                    src="hands.mp4" 
                    data-video-mode="scrub"
                    muted 
                    playsinline 
                    webkit-playsinline 
                    preload="auto" 
                    class="absolute inset-0 md:right-0 md:top-0 h-full w-full object-contain md:object-cover object-center md:object-right opacity-35 md:opacity-45 mix-blend-multiply pointer-events-none scale-100 [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_95%)] md:[mask-image:radial-gradient(ellipse_at_70%_50%,black_30%,transparent_80%)] md:[-webkit-mask-image:radial-gradient(ellipse_at_70%_50%,black_30%,transparent_80%)]"></video>`;

indexHtml = indexHtml.replace(oldVideoRegex, widerMobileVideo);
fs.writeFileSync(indexPath, indexHtml, 'utf8');
console.log('index.html updated with wider mobile video framing (less zoom)!');

// Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading mobile framing update to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(indexPath, '/var/www/yug-pravo/index.html', () => {
      conn.exec('systemctl reload nginx', () => {
        console.log('WIDER_MOBILE_FRAMING_DEPLOYED_SUCCESSFULLY');
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
