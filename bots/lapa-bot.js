/**
 * 🐾 АНО «ЮГ-ПРАВО» — Бот проекта защиты животных «Добрая лапа» (@Samara_promo_bot)
 */

const https = require('https');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '.env');
const envConfig = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const l of lines) {
    const trimmed = l.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        envConfig[trimmed.slice(0, idx).trim()] = val;
      }
    }
  }
}

const BOT_TOKEN = envConfig.TELEGRAM_LAPA_BOT_TOKEN || "6044840143:AAGbxAhHLtWR86O5joc5NBscWQLO0ElwBWQ";
const ADMIN_ID = envConfig.ADMIN_CHAT_ID ? parseInt(envConfig.ADMIN_CHAT_ID, 10) : 306883501;
const WEB_APP_URL = envConfig.WEB_APP_URL || "https://1aikon163-art.github.io/yug-pravotest/";

const userSessions = new Map();

function api(method, params = {}) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(params);
    const req = https.request(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ ok: false, error: e.message });
        }
      });
    });
    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    req.write(payload);
    req.end();
  });
}

async function sendMsg(chatId, text, replyMarkup = null) {
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    disable_web_page_preview: false
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  return await api('sendMessage', payload);
}

function getLapaReplyKeyboard() {
  return {
    keyboard: [
      [{ text: "🐾 Открыть проект «Добрая лапа» (Mini App)", web_app: { url: `${WEB_APP_URL}initiatives.html` } }],
      [{ text: "🐕 Сообщить о жестоком обращении" }, { text: "❤️ Поддержать приют кормами" }],
      [{ text: "🤝 Стать волонтером" }, { text: "📞 Контакты куратора" }]
    ],
    resize_keyboard: true,
    is_persistent: true
  };
}

async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const firstName = msg.from.first_name || 'Друг животных';
  const username = msg.from.username ? `@${msg.from.username}` : 'нет юзернейма';

  if (userSessions.has(chatId)) {
    const session = userSessions.get(chatId);
    if (session.step === 'WAIT_NAME') {
      session.name = text;
      session.step = 'WAIT_PHONE';
      await sendMsg(chatId, `🤝 <b>${text}</b>, укажите ваш контактный <b>номер телефона</b>:`);
      return;
    }
    if (session.step === 'WAIT_PHONE') {
      session.phone = text;
      session.step = 'WAIT_DETAILS';
      await sendMsg(chatId, `📋 Опишите ситуацию (где находится животное, какая требуется помощь):`);
      return;
    }
    if (session.step === 'WAIT_DETAILS') {
      session.details = text;
      userSessions.delete(chatId);

      await sendMsg(chatId, `✅ <b>Обращение принято куратором проекта «Добрая лапа»!</b>\n\nСпасибо за неравнодушие к судьбе животных!\n\n📞 Горячая линия: <b>8 (846) 989-07-68</b>`, getLapaReplyKeyboard());

      const leadCard = `🐾 <b>ОБРАЩЕНИЕ В ПРОЕКТ «ДОБРАЯ ЛАПА»!</b>\n\n` +
        `👤 <b>Имя:</b> ${session.name}\n` +
        `📞 <b>Телефон:</b> <code>${session.phone}</code>\n` +
        `🏷️ <b>Категория:</b> ${session.category || 'Помощь животным'}\n` +
        `💬 <b>Telegram:</b> ${username} (ID: <code>${chatId}</code>)\n` +
        `📝 <b>Описание:</b> ${session.details}\n\n` +
        `⏰ <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Samara' })}</i>`;

      await sendMsg(ADMIN_ID, leadCard, {
        inline_keyboard: [
          [{ text: "📞 Связаться", url: `tel:${session.phone.replace(/[^0-9+]/g, '')}` }]
        ]
      });
      return;
    }
  }

  if (text.includes('жестоком') || text === '🐕 Сообщить о жестоком обращении') {
    userSessions.set(chatId, { step: 'WAIT_NAME', category: 'Жестокое обращение (245 УК РФ)' });
    await sendMsg(chatId, `🐕 <b>Фиксация правонарушения по защите животных</b>\n\nКак вас зовут (ФИО)?`);
    return;
  }

  if (text.includes('приют') || text.includes('кормами') || text === '❤️ Поддержать приют кормами') {
    userSessions.set(chatId, { step: 'WAIT_NAME', category: 'Гуманитарная помощь / Корма' });
    await sendMsg(chatId, `❤️ <b>Гуманитарная поддержка приютов</b>\n\nКак вас зовут (ФИО)?`);
    return;
  }

  if (text.includes('волонтер') || text === '🤝 Стать волонтером') {
    userSessions.set(chatId, { step: 'WAIT_NAME', category: 'Волонтерство / Автопомощь' });
    await sendMsg(chatId, `🤝 <b>Анкета волонтера проекта «Добрая лапа»</b>\n\nКак вас зовут (ФИО)?`);
    return;
  }

  if (text.includes('Контакты') || text === '📞 Контакты куратора' || text === '/contacts') {
    const contactText = `🐾 <b>АНО «ЦПЗ ЮГ-ПРАВО» | Проект «Добрая лапа»</b>\n\n` +
      `📞 <b>Телефон:</b> 8 (846) 989-07-68\n` +
      `📍 <b>Самарская область</b>\n` +
      `💬 <b>Telegram:</b> @aikon163\n\n` +
      `Мы осуществляем общественный надзор за приютами и отловом по Федеральному закону № 498-ФЗ.`;
    await sendMsg(chatId, contactText, getLapaReplyKeyboard());
    return;
  }

  const welcome = `🐾 <b>Добро пожаловать в проект «Добрая лапа» АНО «ЮГ-ПРАВО»!</b>\n\n` +
    `Здравствуйте, <b>${firstName}</b>!\n\n` +
    `Наша миссия — системная правовая и гуманитарная защита животных в Самарской области:\n` +
    `• Контроль исполнения 498-ФЗ («Об ответственном обращении с животными»);\n` +
    `• Пресечение жестокого обращения (ст. 245 УК РФ);\n` +
    `• Помощь волонтерам, кураторам и приютам.\n\n` +
    `👇 <i>Выберите действие в меню ниже:</i>`;

  await sendMsg(chatId, welcome, getLapaReplyKeyboard());
}

let lastUpdateId = 0;
async function poll() {
  try {
    const res = await api('getUpdates', { offset: lastUpdateId + 1, timeout: 30 });
    if (res.ok && res.result && res.result.length > 0) {
      for (const update of res.result) {
        lastUpdateId = update.update_id;
        if (update.message) await handleMessage(update.message);
      }
    }
  } catch (e) {
    console.error("Lapa Bot polling error:", e.message);
  }
  setTimeout(poll, 300);
}

console.log("=========================================");
console.log("🐾 АНО «ЮГ-ПРАВО» ДОБРАЯ ЛАПА BOT IS RUNNING!");
console.log("🤖 Username: @Samara_promo_bot");
console.log("=========================================");

poll();
