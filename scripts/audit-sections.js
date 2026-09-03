const fs = require('fs');
const path = require('path');

const rootDir = __dirname + '/..';
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');

console.log('--- Section CTAs in index.html ---');
const sectionRegex = /<section[\s\S]*?<\/section>/gi;
let match;
while ((match = sectionRegex.exec(indexHtml)) !== null) {
  const sec = match[0];
  const h2 = sec.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  const cta = sec.match(/<a[^>]+href=["'](knowledge|events|initiatives|calculator|about)\.html["'][^>]*>([\s\S]*?)<\/a>/i);
  if (h2) {
    console.log('Header:', h2[1].replace(/<[^>]+>/g, '').trim());
    if (cta) {
      console.log('  CTA link:', cta[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    }
  }
}
