---
name: lucide-heroicons
description: Clean inline SVG icon generation with Lucide and Heroicons style tokens for zero-bundle overhead.
---

# Lucide Icons & Heroicons Skill

## 1. Usage in Node & Scripts
```javascript
const IconHelper = require('./scripts/icons');

const scaleIconSvg = IconHelper.getSvg('Scale', { size: 24, color: '#c5a059' });
const shieldIconSvg = IconHelper.getSvg('Shield', { size: 20, color: '#f8fafc' });
```

## 2. In HTML & Web Pages
Use pure inline SVGs or import Lucide via unpkg for lightweight icons:
```html
<script src="https://unpkg.com/lucide@latest"></script>
<i data-lucide="scale"></i>
<script>
  lucide.createIcons();
</script>
```
