const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname + '/..';

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH ready. Processing hands.mp4 to reverse video frames (Open -> Close)...');

  const cmd = `
ffmpeg -y -i /var/www/yug-pravo/hands.mp4 -vf reverse -c:v libx264 -crf 20 -preset fast -pix_fmt yuv420p -movflags +faststart /var/www/yug-pravo/hands_reversed.mp4
mv /var/www/yug-pravo/hands_reversed.mp4 /var/www/yug-pravo/hands.mp4
`;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;

    stream.on('close', () => {
      console.log('hands.mp4 reversed on server. Downloading to local workspace...');
      conn.sftp((err, sftp) => {
        if (err) throw err;

        sftp.fastGet('/var/www/yug-pravo/hands.mp4', path.join(rootDir, 'hands.mp4'), (err) => {
          if (err) throw err;
          console.log('Downloaded reversed hands.mp4 locally.');

          // Update js/main.js to natural forward scroll (0 -> maxDuration)
          let mainJsPath = path.join(rootDir, 'js/main.js');
          let mainJs = fs.readFileSync(mainJsPath, 'utf8');

          // Since the video itself starts with hands wide apart (frame 0) and closes at the end:
          // targetTime is simply: progress * maxDuration!
          mainJs = mainJs.replace(
            /const onScroll = \(\) => \{[\s\S]*?targetTime = isHands \? \(1 - progress\) \* maxDuration : progress \* maxDuration;[\s\S]*?\};/,
            `const onScroll = () => {
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
        };`
          );

          // Reset initial frame to 0 (which is now naturally open hands)
          mainJs = mainJs.replace(
            /let targetTime = isHands \? maxDuration : 0;\s*let smoothedTime = targetTime;[\s\S]*?activeVideo\.currentTime = maxDuration;\s*\}\s*\}/,
            `let targetTime = 0;
        let smoothedTime = 0;
        activeVideo.currentTime = 0;`
          );

          fs.writeFileSync(mainJsPath, mainJs, 'utf8');

          // Upload updated js/main.js
          sftp.fastPut(mainJsPath, '/var/www/yug-pravo/js/main.js', () => {
            conn.exec('systemctl reload nginx', () => {
              console.log('NATURAL_OPEN_HANDS_START_DEPLOYED_SUCCESSFULLY');
              conn.end();
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
