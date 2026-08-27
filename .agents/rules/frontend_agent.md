# Frontend Agent Rules & Architecture Guide

## Role & Responsibilities
The **Frontend Agent** is specialized in building, styling, and optimizing user interfaces for the Yug-Pravo LegalTech platform.

## Strict Standards

### 1. Mobile-First & Viewport Compliance
- Standard mobile viewports to target: **375px (iPhone SE/Mini)**, **390px (iPhone 14/15/16)**, **414px**, **768px (iPad)**, and **1280px+ (Desktop)**.
- **ZERO Horizontal Scroll**: No element should ever cause `document.documentElement.scrollWidth > window.innerWidth`.
- Always use `box-sizing: border-box`, `max-width: 100%`, and `overflow-x: hidden` on page roots.
- All interactive tap targets (buttons, inputs, links) must have a minimum size of **44x44px** on mobile.

### 2. View Transitions & Dynamic Micro-Animations
- For page and tab switching, implement the modern **View Transitions API**:
  ```javascript
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      updateDOM();
    });
  } else {
    updateDOM();
  }
  ```
- Use GPU-accelerated CSS properties for transitions (`transform`, `opacity`, `filter`). Avoid animating layout properties like `height`, `width`, `top`, `left`.
- Provide `prefers-reduced-motion: reduce` fallback media queries.

### 3. Typography & Cyrillic Rendering
- Premium typography stack: `Inter`, `Cinzel` / `Playfair Display` (for legal headings), `JetBrains Mono` (for legal codes and document numbers).
- Font smoothing: `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`.
- Strict Cyrillic support across all font imports (`&subset=cyrillic,cyrillic-ext`).

### 4. Interactive Form Validation
- Client-side real-time validation with user-friendly Russian legal prompts.
- Input masks for Phone (`+7 (999) 999-22-33`), INN (`10` or `12` digits), OGRN (`13` or `15` digits), SNILS (`11` digits), and Passport numbers (`NNNN NNNNNN`).
- Visual feedback: error borders, helper text, and Telegram HapticFeedback vibration triggers when run inside Telegram WebApp.
