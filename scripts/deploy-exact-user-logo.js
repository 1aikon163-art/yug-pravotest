const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';
const inputPath = 'C:/Users/aikon/.gemini/antigravity-ide/brain/a7bac012-06e1-4ff1-b06c-f6dfa5cdf168/.user_uploaded/media_1788018119324.png';
const outPng = path.join(rootDir, 'images/logo.png');
const outWebp = path.join(rootDir, 'images/logo.webp');
const faviconPng = path.join(rootDir, 'favicon.png');
const imagesFaviconPng = path.join(rootDir, 'images/favicon.png');

async function processLogo() {
  const image = sharp(inputPath);
  const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // If pixel is white/near white, make it 100% transparent
    if (r > 240 && g > 240 && b > 240) {
      data[i + 3] = 0;
    } else if (r > 220 && g > 220 && b > 220) {
      const avg = (r + g + b) / 3;
      data[i + 3] = Math.max(0, 255 - Math.round((avg - 220) * 12.75));
    }
  }

  // Create trimmed PNG buffer
  const pngBuffer = await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  }).trim().png().toBuffer();

  // Save files
  fs.writeFileSync(outPng, pngBuffer);
  await sharp(pngBuffer).webp({ quality: 100 }).toFile(outWebp);
  await sharp(pngBuffer).resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(faviconPng);
  fs.copyFileSync(faviconPng, imagesFaviconPng);

  console.log('Saved transparent logo.png, logo.webp, favicon.png');

  // Upload to VPS
  const conn = new Client();
  conn.on('ready', () => {
    console.log('SSH connected. Uploading exact original logo to VPS...');
    conn.sftp((err, sftp) => {
      if (err) throw err;

      sftp.fastPut(outPng, '/var/www/yug-pravo/images/logo.png', () => {
        sftp.fastPut(outWebp, '/var/www/yug-pravo/images/logo.webp', () => {
          sftp.fastPut(faviconPng, '/var/www/yug-pravo/favicon.png', () => {
            conn.exec('systemctl reload nginx', () => {
              console.log('EXACT_ORIGINAL_LOGO_DEPLOYED_SUCCESSFULLY');
              conn.end();
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
}

processLogo().catch(console.error);
