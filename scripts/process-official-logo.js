const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';
const inputPath = 'C:\\Users\\aikon\\.gemini\\antigravity-ide\\brain\\a7bac012-06e1-4ff1-b06c-f6dfa5cdf168\\.user_uploaded\\media_1787999398348.png';

async function processOfficialLogo() {
  console.log('Processing official logo with sharp...');
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  // Make white background transparent
  const channels = info.channels; // 3 or 4
  const pixelCount = info.width * info.height;
  const outputBuffer = Buffer.alloc(pixelCount * 4);

  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * channels];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];
    
    // Check if pixel is white or near-white background
    if (r > 235 && g > 235 && b > 235) {
      outputBuffer[i * 4] = r;
      outputBuffer[i * 4 + 1] = g;
      outputBuffer[i * 4 + 2] = b;
      outputBuffer[i * 4 + 3] = 0; // 100% transparent
    } else {
      outputBuffer[i * 4] = r;
      outputBuffer[i * 4 + 1] = g;
      outputBuffer[i * 4 + 2] = b;
      outputBuffer[i * 4 + 3] = 255; // opaque
    }
  }

  // Save transparent full logo
  await sharp(outputBuffer, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
  .png()
  .toFile(path.join(rootDir, 'images/logo.png'));
  console.log('images/logo.png created with transparent background');

  // Create square trimmed favicon focused on the shield
  const trimmed = await sharp(path.join(rootDir, 'images/logo.png'))
    .trim()
    .toBuffer({ resolveWithObject: true });

  // Create 128x128 and 64x64 favicon from the trimmed shield
  await sharp(trimmed.data)
    .resize(128, 128, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(rootDir, 'favicon.png'));

  await sharp(trimmed.data)
    .resize(128, 128, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(path.join(rootDir, 'images/favicon.png'));

  console.log('favicon.png created successfully!');

  // Now upload directly to VPS
  const conn = new Client();
  conn.on('ready', () => {
    console.log('SSH connected. Uploading authentic transparent logo & favicon...');
    conn.sftp((err, sftp) => {
      if (err) throw err;

      sftp.fastPut(path.join(rootDir, 'images/logo.png'), '/var/www/yug-pravo/images/logo.png', () => {
        sftp.fastPut(path.join(rootDir, 'favicon.png'), '/var/www/yug-pravo/favicon.png', () => {
          sftp.fastPut(path.join(rootDir, 'images/favicon.png'), '/var/www/yug-pravo/images/favicon.png', () => {
            conn.exec('systemctl reload nginx', () => {
              console.log('AUTHENTIC_TRANSPARENT_LOGO_DEPLOYED');
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

processOfficialLogo().catch(console.error);
