const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';
const inputPath = 'C:/Users/aikon/.gemini/antigravity-ide/brain/a7bac012-06e1-4ff1-b06c-f6dfa5cdf168/yugpravo_glass_icon_1788000681609.jpg';

async function makeFaviconMaximumSize() {
  console.log('Generating maximum-scale Duo-Tone Glass Icon...');
  const img = sharp(inputPath);
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixelCount = info.width * info.height;
  const outputBuffer = Buffer.alloc(pixelCount * 4);

  // Background removal
  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    
    const minVal = Math.min(r, g, b);
    if (minVal > 248) {
      outputBuffer[i * 4] = r;
      outputBuffer[i * 4 + 1] = g;
      outputBuffer[i * 4 + 2] = b;
      outputBuffer[i * 4 + 3] = 0;
    } else if (minVal > 238) {
      const alpha = Math.floor(255 * (1 - (minVal - 238) / 10));
      outputBuffer[i * 4] = r;
      outputBuffer[i * 4 + 1] = g;
      outputBuffer[i * 4 + 2] = b;
      outputBuffer[i * 4 + 3] = alpha;
    } else {
      outputBuffer[i * 4] = r;
      outputBuffer[i * 4 + 1] = g;
      outputBuffer[i * 4 + 2] = b;
      outputBuffer[i * 4 + 3] = 255;
    }
  }

  // Convert raw buffer to PNG first, then trim tightly to boundaries
  const pngBuffer = await sharp(outputBuffer, {
    raw: { width: info.width, height: info.height, channels: 4 }
  }).png().toBuffer();

  const trimmed = await sharp(pngBuffer).trim().toBuffer();

  // Resize to fill 100% of 256x256 canvas (MAXIMUM scale for browser tabs)
  await sharp(trimmed)
    .resize(256, 256, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(rootDir, 'favicon.png'));

  await sharp(trimmed)
    .resize(256, 256, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(rootDir, 'images/favicon.png'));

  console.log('Maximum-scale favicon.png successfully generated!');

  // Upload to VPS
  const conn = new Client();
  conn.on('ready', () => {
    console.log('SSH connected. Uploading maximum-scale glass favicon...');
    conn.sftp((err, sftp) => {
      if (err) throw err;

      sftp.fastPut(path.join(rootDir, 'favicon.png'), '/var/www/yug-pravo/favicon.png', () => {
        sftp.fastPut(path.join(rootDir, 'images/favicon.png'), '/var/www/yug-pravo/images/favicon.png', () => {
          conn.exec('systemctl reload nginx', () => {
            console.log('MAX_SIZE_FAVICON_DEPLOYED');
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
}

makeFaviconMaximumSize().catch(console.error);
