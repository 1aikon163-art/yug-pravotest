---
name: legaltech-validator
description: Validates Russian procedural legal documents (Civil Claims per ГПК РФ ст. 131-132, Commercial Claims per АПК РФ ст. 125-126, Housing disputes per ПП РФ № 354, Debt collection disputes per 230-ФЗ, and State Duty computation per НК РФ ст. 333.19).
---

# LegalTech Data Validator Skill

Use this skill whenever drafting, parsing, reviewing, or generating court claims, pre-trial claims, complaints, or procedural documents in the Russian jurisdiction.

## Rules & Standards

### 1. Mandatory Civil Claim Fields (ст. 131 ГПК РФ)
1. **Court**: Full official name of the court (мировой судья судебного участка №..., районный / городской суд).
2. **Plaintiff (Истец)**:
   - Full Name / Legal Name
   - Residential / Legal address
   - Mandatory Identifier (СНИЛС, ИНН, серия и номер паспорта, ОГРНИП).
3. **Defendant (Ответчик)**:
   - Full Name / Legal Name and known address
   - For individuals: at least one known identifier (ИНН, СНИЛС, паспорт, ВУ) OR an explicit mention in the claim that plaintiff requested the court to query the identifier.
4. **Circumstances & Evidence (Основания иска)**: Exact dates, contract numbers, facts, legal grounds.
5. **Claims (Просительная часть)**: Clear, mathematically accurate monetary and non-monetary requests.
6. **Price of Claim & State Duty (Цена иска и госпошлина)**:
   - Calculation table per ст. 333.19 НК РФ (новые ставки 2024-2026 гг.).
7. **Pre-Trial Settlement Proof (Досудебный порядок)**:
   - Pre-trial claim date, post receipt tracking number (РПО Почты России).
8. **Mailing Proof to Parties (Направление копий)**:
   - Postal receipt and inventory of enclosure (опись вложения) per ст. 132 ГПК РФ / ст. 126 АПК РФ.

### 2. State Duty Calculation Reference (ст. 333.19 НК РФ)
- До 100 000 руб.: **4 000 руб.**
- От 100 001 до 300 000 руб.: **4 000 руб. + 3%** от суммы свыше 100 000 руб.
- От 300 001 до 500 000 руб.: **10 000 руб. + 2.5%** от суммы свыше 300 000 руб.
- От 500 001 до 1 000 000 руб.: **15 000 руб. + 2%** от суммы свыше 500 000 руб.
- От 1 000 001 до 3 000 000 руб.: **25 000 руб. + 1%** от суммы свыше 1 000 000 руб.
- Неимущественные иски (физлица): **3 000 руб.**
- Расторжение брака: **5 000 руб.**

## Validator Execution
Run the Node validator tool:
```bash
node scripts/legal-validator.js
```
Or import `LegalValidator` from `scripts/legal-validator.js` inside services.
