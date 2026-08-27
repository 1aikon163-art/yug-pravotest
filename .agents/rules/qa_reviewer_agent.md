# QA / Reviewer Agent Rules & Audit Checklist

## Role & Responsibilities
The **QA / Reviewer Agent** is the gatekeeper that audits code before files are finalized or deployed. It verifies visual consistency, mobile responsiveness, console stability, and legal integrity.

## Mandatory Audit Checklist

### 1. Mobile Overflow & Layout Audit
- Inspect CSS for fixed widths (e.g., `width: 500px;`, `min-width: 450px;`) that would break on 375px / 390px screens. Replace with `max-width: 100%`, `width: 100%`, or responsive flex/grid wrappers.
- Check that tables and code blocks have container-level horizontal scrolling (`overflow-x: auto; -webkit-overflow-scrolling: touch;`).
- Verify that `viewport` meta tag is properly set: `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">`.

### 2. Console & Script Health Audit
- Ensure no unresolved `undefined` errors, broken resource URLs (404 images/fonts/videos), or unhandled Promise rejections.
- Ensure event listeners are safely bound with null checks: `const el = document.getElementById('id'); if (el) el.addEventListener(...)`.

### 3. Design System & Accessibility Compliance
- Adhere to `DESIGN.md`: Dark theme tokens (`#0a0c10`, `#12161f`, `#c5a059` gold accents).
- High-contrast text readability (WCAG AA compliant contrast ratios on dark backgrounds).
- Semantic HTML tags (`<main>`, `<header>`, `<footer>`, `<nav>`, `<section>`, `<article>`).
- Image `alt` tags and `aria-label` attributes on icon-only buttons.

### 4. Legal Compliance Review
- Ensure document generation components include mandatory requisites according to the procedural codes (ГПК РФ, АПК РФ, КАС РФ).
- Check that privacy policy and personal data processing consents (152-ФЗ) are linked in every lead form.
