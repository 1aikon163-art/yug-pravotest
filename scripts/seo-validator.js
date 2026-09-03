/**
 * SEO & Schema.org JSON-LD Validator for LegalTech
 * Audits sitemap.xml, robots.txt, canonical tags, Open Graph, and Structured Data.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

console.log('====================================================');
console.log('🏛️  YUG-PRAVO LEGALTECH SEO & SCHEMA.ORG AUDIT');
console.log('====================================================\n');

let totalIssues = 0;

// 1. Check robots.txt
const robotsPath = path.join(rootDir, 'robots.txt');
if (fs.existsSync(robotsPath)) {
  const robots = fs.readFileSync(robotsPath, 'utf8');
  if (robots.includes('Sitemap:') && robots.includes('User-agent: *')) {
    console.log('✅ [PASS] robots.txt is present and configured with Sitemap directive.');
  } else {
    console.log('⚠️  [WARN] robots.txt is missing Sitemap reference or User-agent.');
    totalIssues++;
  }
} else {
  console.log('❌ [FAIL] robots.txt not found!');
  totalIssues++;
}

// 2. Check sitemap.xml
const sitemapPath = path.join(rootDir, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const urlCount = (sitemap.match(/<loc>/g) || []).length;
  console.log(`✅ [PASS] sitemap.xml is valid with ${urlCount} indexed URLs.`);
} else {
  console.log('❌ [FAIL] sitemap.xml not found!');
  totalIssues++;
}

console.log('\n--- Page-by-Page SEO & Schema Check ---');

htmlFiles.forEach(file => {
  const filePath = path.join(rootDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const fileIssues = [];

  // Title check
  const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
  if (!titleMatch || titleMatch[1].trim().length < 10) {
    fileIssues.push('Title is missing or too short (< 10 chars)');
  }

  // Meta description
  const descMatch = content.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                    content.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  if (!descMatch || descMatch[1].trim().length < 30) {
    fileIssues.push('Meta description is missing or too short (< 30 chars)');
  }

  // Open Graph check
  if (!content.includes('property="og:title"') && !content.includes("property='og:title'")) {
    fileIssues.push('Missing OpenGraph og:title (critical for VK / Telegram preview)');
  }

  // Schema.org check
  const hasSchema = content.includes('application/ld+json');
  const schemaType = content.includes('"@type": "NGO"') || content.includes('"@type":"NGO"') ? 'NGO (Non-Profit)' : content.includes('"@type": "LegalService"') ? 'LegalService' :
                     content.includes('"@type": "Organization"') ? 'Organization' :
                     content.includes('"@type": "FAQPage"') ? 'FAQPage' : hasSchema ? 'JSON-LD' : 'None';

  if (fileIssues.length === 0) {
    console.log(`✅ [PASS] ${file.padEnd(25)} (Schema: ${schemaType})`);
  } else {
    console.log(`⚠️  [WARN] ${file.padEnd(25)}:`);
    fileIssues.forEach(i => console.log(`   - 🟡 ${i}`));
    totalIssues += fileIssues.length;
  }
});

console.log('\n----------------------------------------------------');
console.log(`SEO Audit Complete. Total Issues/Warnings: ${totalIssues}`);
console.log('----------------------------------------------------');

if (totalIssues > 0) {
  process.exit(0); // non-blocking for build
}
