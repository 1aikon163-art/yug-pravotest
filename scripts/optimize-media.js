/**
 * Image & Media Asset Optimizer using Sharp
 * Converts and compresses PNG/JPG images to WebP with modern web standards.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const rootDir = path.resolve(__dirname, '..');
const imagesDir = path.join(rootDir, 'images');

async function optimizeImages() {
  console.log('====================================================');
  console.log('⚡ YUG-PRAVO LEGALTECH IMAGE OPTIMIZATION (SHARP)');
  console.log('====================================================\n');

  const filesToScan = [];

  // Root images
  if (fs.existsSync(rootDir)) {
    fs.readdirSync(rootDir).forEach(f => {
      if (/\.(png|jpg|jpeg)$/i.test(f) && !f.includes('dev-qr')) {
        filesToScan.push(path.join(rootDir, f));
      }
    });
  }

  // images/ directory
  if (fs.existsSync(imagesDir)) {
    fs.readdirSync(imagesDir).forEach(f => {
      if (/\.(png|jpg|jpeg)$/i.test(f) && !f.includes('dev-qr')) {
        filesToScan.push(path.join(imagesDir, f));
      }
    });
  }

  let totalOriginalBytes = 0;
  let totalOptimizedBytes = 0;

  for (const file of filesToScan) {
    const stat = fs.statSync(file);
    const originalSize = stat.size;
    totalOriginalBytes += originalSize;

    const parsed = path.parse(file);
    const webpPath = path.join(parsed.dir, `${parsed.name}.webp`);

    try {
      await sharp(file)
        .webp({ quality: 82, effort: 4 })
        .toFile(webpPath);

      const webpStat = fs.statSync(webpPath);
      totalOptimizedBytes += webpStat.size;

      const savedPercent = Math.round((1 - webpStat.size / originalSize) * 100);
      console.log(`✅ [CONVERTED] ${parsed.base.padEnd(25)} -> ${parsed.name}.webp (${Math.round(originalSize/1024)}KB -> ${Math.round(webpStat.size/1024)}KB, saved ${savedPercent}%)`);
    } catch (e) {
      console.error(`❌ Error processing ${parsed.base}:`, e.message);
    }
  }

  console.log('\n----------------------------------------------------');
  console.log(`Total Original:  ${Math.round(totalOriginalBytes / 1024)} KB`);
  console.log(`Total Optimized: ${Math.round(totalOptimizedBytes / 1024)} KB`);
  if (totalOriginalBytes > 0) {
    console.log(`🚀 Saved:        ${Math.round((1 - totalOptimizedBytes / totalOriginalBytes) * 100)}% bandwidth!`);
  }
  console.log('----------------------------------------------------');
}

if (require.main === module) {
  optimizeImages();
}

module.exports = optimizeImages;
