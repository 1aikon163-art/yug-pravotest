---
name: mobile-qa-playwright
description: Headless browser QA, 375px/390px mobile viewport audits, horizontal overflow detection, and automated CSS fix procedures.
---

# Mobile QA & Playwright Audit Skill

## 1. Viewport Audit Targets
- **iPhone SE / Mini**: `375 x 667`
- **iPhone 14 / 15 / 16**: `390 x 844`
- **Android Standard**: `412 x 915`
- **Tablet / iPad**: `768 x 1024`
- **Desktop**: `1280 x 800`

## 2. Horizontal Scroll Detection Rule
A page is strictly non-compliant if at any point:
```javascript
document.documentElement.scrollWidth > window.innerWidth
```
### Fixing Horizontal Scroll:
1. Locate offending elements:
   ```javascript
   Array.from(document.querySelectorAll('*')).filter(el => el.getBoundingClientRect().right > window.innerWidth);
   ```
2. Replace hardcoded `width: Npx` with `max-width: 100%` or responsive flex/grid wrappers.
3. Add `overflow-x: auto;` to tables and code pre blocks.

## 3. Running Static & Link Audit
```bash
node scripts/qa-audit.js
```
