---
name: telegram-mini-app
description: Telegram Mini App SDK integration patterns, haptic feedback, theme variables, and TMA bridge components.
---

# Telegram Mini App SDK Skill

## 1. Including Telegram WebApp SDK
Add the script to `<head>`:
```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<script src="js/telegram-bridge.js"></script>
```

## 2. Using TelegramBridge
- **Vibration feedback on action**:
  ```javascript
  TelegramBridge.hapticImpact('medium'); // 'light', 'medium', 'heavy', 'rigid', 'soft'
  TelegramBridge.hapticNotification('success'); // 'success', 'warning', 'error'
  ```
- **Sending data back to the bot**:
  ```javascript
  TelegramBridge.sendToBot({
    action: 'submit_claim_request',
    clientName: 'Иванов И.И.',
    phone: '+7 999 123-45-67',
    service: 'Банкротство физических лиц'
  });
  ```
- **Handling MainButton & BackButton**:
  ```javascript
  TelegramBridge.webApp.MainButton.setText('ОФОРМИТЬ ДОГОВОР');
  TelegramBridge.webApp.MainButton.show();
  TelegramBridge.webApp.MainButton.onClick(() => {
    // submit flow
  });
  ```
