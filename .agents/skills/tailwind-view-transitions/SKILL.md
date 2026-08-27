---
name: tailwind-view-transitions
description: Expert guidance on lightweight CSS, Tailwind utility patterns without bundle bloat, and smooth View Transitions API implementations.
---

# Tailwind & View Transitions Skill

## 1. Zero-Bloat Modern CSS Architecture
- Use modern CSS custom properties (CSS variables) for the core design system:
  ```css
  :root {
    --bg-primary: #0a0c10;
    --bg-secondary: #12161f;
    --bg-card: rgba(22, 28, 40, 0.7);
    --gold-primary: #c5a059;
    --gold-hover: #dfb76c;
    --gold-glow: rgba(197, 160, 89, 0.25);
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --border-glass: rgba(255, 255, 255, 0.08);
    --radius-md: 12px;
    --radius-lg: 18px;
    --transition-smooth: cubic-bezier(0.16, 1, 0.3, 1);
  }
  ```

## 2. Seamless View Transitions API
To animate transitions between tabs, modals, or page views smoothly:
```javascript
function navigateWithTransition(updateCallback) {
  if (!document.startViewTransition) {
    updateCallback();
    return;
  }
  document.startViewTransition(() => {
    updateCallback();
  });
}
```

CSS for custom view transition animations:
```css
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 280ms;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}

::view-transition-old(root) {
  animation-name: fade-out;
}

::view-transition-new(root) {
  animation-name: fade-in;
}

@keyframes fade-out {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-6px); }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
```

## 3. GPU Hardware Acceleration Rules
- Animate only `transform` and `opacity`.
- Use `will-change: transform, opacity` sparingly for heavy animations.
- Apply `backdrop-filter: blur(16px)` with fallback background colors.
