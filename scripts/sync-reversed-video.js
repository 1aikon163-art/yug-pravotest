const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname + '/..';

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Downloading reversed hands.mp4 and syncing main.js...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastGet('/var/www/yug-pravo/hands.mp4', path.join(rootDir, 'hands.mp4'), (err) => {
      if (err) throw err;
      console.log('Successfully saved reversed hands.mp4 locally!');

      // Update js/main.js
      let mainJsPath = path.join(rootDir, 'js/main.js');
      let mainJs = fs.readFileSync(mainJsPath, 'utf8');

      // Update scroll scrubber: now the video naturally starts at frame 0 (open hands) and progresses forward to touch!
      const cleanScrubber = `
        const maxDuration = (activeVideo.duration && !isNaN(activeVideo.duration) && activeVideo.duration > 0.5) ? activeVideo.duration : 10.0;
        let targetTime = 0;
        let smoothedTime = 0;
        let lastTimestamp = performance.now();
        const speedMultiplier = parseFloat(heroSection.dataset.speedMultiplier || '1.0');

        activeVideo.currentTime = 0;

        const onScroll = () => {
          const rect = heroSection.getBoundingClientRect();
          const maxScroll = rect.height - window.innerHeight;
          const currentScroll = -rect.top;

          if (maxScroll > 0) {
            const rawProgress = (currentScroll / maxScroll) * speedMultiplier;
            const progress = Math.min(Math.max(rawProgress, 0), 1);
            targetTime = progress * maxDuration;
          } else {
            targetTime = 0;
          }
        };`;

      mainJs = mainJs.replace(/\/\/\s*⚡\s*РЕЖИМ СКРАББИНГА ПО СКРОЛЛУ[\s\S]*?const onScroll = \(\) => \{[\s\S]*?\};\s*\};/i, `// ⚡ РЕЖИМ СКРАББИНГА ПО СКРОЛЛУ (Начальный кадр: 0.0с - руки широко раскрыты)\n${cleanScrubber}`);

      fs.writeFileSync(mainJsPath, mainJs, 'utf8');

      // Upload updated js/main.js
      sftp.fastPut(mainJsPath, '/var/www/yug-pravo/js/main.js', () => {
        conn.exec('systemctl reload nginx', () => {
          console.log('REVERSED_HANDS_AND_MAIN_JS_DEPLOYED_PERFECTLY');
          conn.end();
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
