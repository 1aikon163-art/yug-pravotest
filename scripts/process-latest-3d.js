const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';
const inputPath = 'C:/Users/aikon/.gemini/antigravity-ide/brain/a7bac012-06e1-4ff1-b06c-f6dfa5cdf168/.user_uploaded/media_1788000299628.jpg';

async function processLatest3DRender() {
  console.log('Processing latest 3D render...');
  const img = sharp(inputPath);
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixelCount = info.width * info.height;
  const outputBuffer = Buffer.alloc(pixelCount * 4);

  // Background removal with smooth alpha edge
  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    
    // Pure or near-white background
    const minVal = Math.min(r, g, b);
    if (minVal > 240) {
      outputBuffer[i * 4] = r;
      outputBuffer[i * 4 + 1] = g;
      outputBuffer[i * 4 + 2] = b;
      outputBuffer[i * 4 + 3] = 0; // Transparent
    } else if (minVal > 220) {
      const alpha = Math.floor(255 * (1 - (minVal - 220) / 20));
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

  // Full transparent 3D logo
  const fullTransparent = await sharp(outputBuffer, {
    raw: { width: info.width, height: info.height, channels: 4 }
  }).png().toBuffer();

  fs.writeFileSync(path.join(rootDir, 'images/logo-3d.png'), fullTransparent);
  fs.writeFileSync(path.join(rootDir, 'images/logo.png'), fullTransparent);

  // Crop shield specifically for favicon
  const trimmed = await sharp(fullTransparent).trim().toBuffer({ resolveWithObject: true });
  const trimmedMeta = await sharp(trimmed.data).metadata();
  console.log('Trimmed size:', trimmedMeta.width, trimmedMeta.height);

  const shieldHeight = Math.floor(trimmedMeta.height * 0.72);
  const shieldOnly = await sharp(trimmed.data)
    .extract({
      left: 0,
      top: 0,
      width: trimmedMeta.width,
      height: shieldHeight
    })
    .trim()
    .toBuffer();

  // Create 256x256 high-resolution favicon
  await sharp(shieldOnly)
    .resize(256, 256, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(rootDir, 'favicon.png'));

  await sharp(shieldOnly)
    .resize(256, 256, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(rootDir, 'images/favicon.png'));

  console.log('Latest 3D shield favicon created!');

  // Upload to VPS
  const conn = new Client();
  conn.on('ready', () => {
    console.log('SSH connected. Uploading latest 3D favicon & logo...');
    conn.sftp((err, sftp) => {
      if (err) throw err;

      sftp.fastPut(path.join(rootDir, 'favicon.png'), '/var/www/yug-pravo/favicon.png', () => {
        sftp.fastPut(path.join(rootDir, 'images/favicon.png'), '/var/www/yug-pravo/images/favicon.png', () => {
          sftp.fastPut(path.join(rootDir, 'images/logo.png'), '/var/www/yug-pravo/images/logo.png', () => {
            sftp.fastPut(path.join(rootDir, 'images/logo-3d.png'), '/var/www/yug-pravo/images/logo-3d.png', () => {
              conn.exec('systemctl reload nginx', () => {
                console.log('LATEST_3D_RENDER_DEPLOYED_SUCCESSFULLY');
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
}

processLatest3DRender().catch(console.error);
