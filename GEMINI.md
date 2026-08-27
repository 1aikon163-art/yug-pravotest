# Gemini & Antigravity Rules for Yug-Pravo LegalTech

Пожалуйста, следуйте инструкциям и правилам, определенным в [AGENTS.md](./AGENTS.md) и `.agents/rules/`:
1. **Frontend Agent**: соблюдение мобильных брейкпоинтов (375px/390px), отсутствие горизонтального скролла, плавные View Transitions.
2. **QA / Reviewer Agent**: запуск `npm run qa` перед фиксацией изменений.
3. **LegalTech Validator**: соблюдение норм ГПК РФ, 230-ФЗ, ПП РФ № 354, ст. 333.19 НК РФ через `scripts/legal-validator.js`.
4. **Telegram Mini App**: использование `js/telegram-bridge.js` и тактильного отклика (HapticFeedback).
5. **Генерация документов**: использование `scripts/doc-generator.js` для судебных исков и претензий с поддержкой кириллицы.
