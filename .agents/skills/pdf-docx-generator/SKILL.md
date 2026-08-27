---
name: pdf-docx-generator
description: Procedural court document generation in DOCX and PDF with Cyrillic encoding (Times New Roman / Arial / PT Sans) complying with Russian court formatting standards.
---

# PDF & DOCX Legal Document Generator Skill

## 1. Overview
Generates compliant, court-ready Russian legal documents (Исковые заявления, Досудебные претензии, Ходатайства, Договоры) with:
- Standard Russian court margins (Left: 30mm, Right: 10mm, Top/Bottom: 20mm).
- 1.25 cm first line indent, 1.15 line spacing, Times New Roman 12-14pt.
- Right-aligned court header and parties info.
- Fully validated against `LegalValidator`.

## 2. Usage
```javascript
const LegalDocGenerator = require('./scripts/doc-generator');

await LegalDocGenerator.generateClaimDocx({
  courtName: 'Арбитражный суд Ростовской области',
  plaintiff: { fullName: 'ИП Смирнов А.В.', inn: '616412345678', address: 'г. Ростов-на-Дону' },
  defendant: { fullName: 'ООО "ЮгСтрой"', inn: '6164987654', address: 'г. Батайск' },
  claimAmount: 540000,
  stateDuty: 16000,
  circumstances: '...',
  claims: '...'
}, './docs/claim_smirnov.docx');
```
