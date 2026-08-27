/**
 * QA & Mobile Viewport Audit Runner
 * Checks HTML pages for mobile compliance, missing assets, broken links, and viewport setup.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

console.log('====================================================');
console.log('🔍 YUG-PRAVO LEGALTECH QA & MOBILE AUDIT SUITE');
console.log('====================================================\n');

let totalErrors = 0;
let totalWarnings = 0;

htmlFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  const warnings = [];

  // 1. Check viewport
  if (!/<meta[^>]+name=["']viewport["']/i.test(content) && !/<meta[^>]+content=["'][^"']*width=device-width[^"']*["'][^>]*name=["']viewport["']/i.test(content)) {
    issues.push('Missing <meta name="viewport"> tag (breaks mobile layout)!');
  }

  // 2. Check title
  if (!content.includes('<title>') || !content.includes('</title>')) {
    warnings.push('Missing or empty <title> tag.');
  }

  // 3. Check for fixed desktop widths in style attributes
  const fixedWidthMatch = content.match(/style="[^"]*width:\s*([4-9]\d{2,}|\d{4,})px/gi);
  if (fixedWidthMatch) {
    warnings.push(`Potential mobile overflow: found inline style fixed width: ${fixedWidthMatch.join(', ')}`);
  }

  // 4. Check internal links
  const hrefMatches = [...content.matchAll(/href="([^"#?]+(?:\.html|\.pdf|\.mp4|\.css|\.js))"/gi)];
  hrefMatches.forEach(match => {
    const linkPath = match[1];
    if (!linkPath.startsWith('http') && !linkPath.startsWith('//') && !linkPath.startsWith('mailto:') && !linkPath.startsWith('tel:')) {
      const targetPath = path.join(rootDir, linkPath);
      if (!fs.existsSync(targetPath)) {
        issues.push(`Broken local link: href="${linkPath}" (file not found)`);
      }
    }
  });

  // 5. Check local image sources
  const srcMatches = [...content.matchAll(/src="([^"#?]+(?:\.png|\.jpg|\.jpeg|\.svg|\.webp|\.mp4|\.js))"/gi)];
  srcMatches.forEach(match => {
    const srcPath = match[1];
    if (!srcPath.startsWith('http') && !srcPath.startsWith('//') && !srcPath.startsWith('data:')) {
      const targetPath = path.join(rootDir, srcPath);
      if (!fs.existsSync(targetPath)) {
        issues.push(`Broken local asset: src="${srcPath}" (file not found)`);
      }
    }
  });

  // Output result for file
  if (issues.length === 0 && warnings.length === 0) {
    console.log(`✅ [PASS] ${file.padEnd(25)} (Mobile ready & valid links)`);
  } else {
    if (issues.length > 0) {
      console.log(`❌ [FAIL] ${file.padEnd(25)}:`);
      issues.forEach(i => console.log(`   - 🔴 Error: ${i}`));
      totalErrors += issues.length;
    }
    if (warnings.length > 0) {
      if (issues.length === 0) console.log(`⚠️  [WARN] ${file.padEnd(25)}:`);
      warnings.forEach(w => console.log(`   - 🟡 Warning: ${w}`));
      totalWarnings += warnings.length;
    }
  }
});

console.log('\n----------------------------------------------------');
console.log(`Audit Finished: ${htmlFiles.length} pages checked.`);
console.log(`Errors: ${totalErrors} | Warnings: ${totalWarnings}`);
console.log('----------------------------------------------------');

if (totalErrors > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
