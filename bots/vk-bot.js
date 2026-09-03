/**
 * 🌐 АНО «ЮГ-ПРАВО» — Чат-бот сообщества ВКонтакте (ID: 112146607)
 * Интерактивные автоответы гражданам + прямая пересылка заявок в Telegram директору
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
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        envConfig[key] = val;
      }
    }
  }
}

const VK_TOKEN = envConfig.VK_GROUP_TOKEN || "vk1.a.34j_KrL8LHfVqphGA8XngxovIePqHEgzmpURuUv0zruWayahJYOwhsERrMeUkCqCrxx3v4Mh9o-zMGAN3-bf9Oei88cqe9XsXbNcR3yite8WsZjK4OB4vGvX2rJ7vqFiEqDKk__vWnzD7-gUgK_Jwbqd9WdYYWUzlolkxzYUTVYL5ZTKhzxlUH142dByJP1duK_6NgZcXZxkjmTWtwwkQA";
const VK_GROUP_ID = 112146607;
const TG_BOT_TOKEN = envConfig.TELEGRAM_MAIN_BOT_TOKEN || "8940322181:AAENoL3QCWhHpc4fKqZbVupbdN3BLjmZxOQ";
const TG_ADMIN_ID = envConfig.ADMIN_CHAT_ID ? parseInt(envConfig.ADMIN_CHAT_ID, 10) : 306883501;
const SITE_URL = envConfig.WEB_APP_URL || "https://1aikon163-art.github.io/yug-pravotest/";

// Хранилище сессий пользователей VK
const vkSessions = new Map();

// Helper для вызова VK API
function vkCall(method, params = {}) {
  return new Promise((resolve) => {
    params.access_token = VK_TOKEN;
    params.v = '5.199';
    
    const postData = new URLSearchParams(params).toString();
    const req = https.request(`https://api.vk.com/method/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: e.message });
        }
      });
    });
    req.on('error', err => resolve({ error: err.message }));
    req.write(postData);
    req.end();
  });
}

// Отправка уведомления в Telegram директору
function notifyTelegram(leadText) {
  const payload = JSON.stringify({
    chat_id: TG_ADMIN_ID,
    text: leadText,
    parse_mode: 'HTML'
  });

  const req = https.request(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  });
  req.write(payload);
  req.end();
}

// Меню кнопок ВКонтакте
function getVkKeyboard() {
  return JSON.stringify({
    one_time: false,
    inline: false,
    buttons: [
      [
        { action: { type: "text", label: "⚖️ Консультация юриста", payload: JSON.stringify({ button: "consult" }) }, color: "primary" },
        { action: { type: "text", label: "🏢 Народный аудит ЖКХ", payload: JSON.stringify({ button: "jkh" }) }, color: "secondary" }
      ],
      [
        { action: { type: "text", label: "🐾 Проект Добрая лапа", payload: JSON.stringify({ button: "lapa" }) }, color: "secondary" },
        { action: { type: "text", label: "📞 Контакты и адрес", payload: JSON.stringify({ button: "contacts" }) }, color: "secondary" }
      ],
      [
        { action: { type: "open_link", link: SITE_URL, label: "🌐 Официальный сайт" } }
      ]
    ]
  });
}

// Отправка сообщения в диалог VK
async function sendVkMsg(userId, text, keyboard = null) {
  const randomId = Math.floor(Math.random() * 1000000000);
  const params = {
    user_id: userId,
    random_id: randomId,
    message: text
  };
  if (keyboard) {
    params.keyboard = keyboard;
  }
  return await vkCall('messages.send', params);
}

// Обработка сообщений в VK
async function handleVkMessage(msg) {
  const userId = msg.from_id;
  const text = (msg.text || '').trim();

  // Сессия диалога (сбор заявки)
  if (vkSessions.has(userId)) {
    const session = vkSessions.get(userId);

    if (session.step === 'WAIT_PHONE') {
      session.phone = text;
      session.step = 'WAIT_PROBLEM';
      await sendVkMsg(userId, `📋 Спасибо! Теперь кратко опишите суть вашей проблемы или вопроса:`);
      return;
    }

    if (session.step === 'WAIT_PROBLEM') {
      session.problem = text;
      vkSessions.delete(userId);

      await sendVkMsg(userId, `✅ Ваше обращение успешно зарегистрировано в АНО «ЦПЗ ЮГ-ПРАВО»!\n\nЮрист свяжется с вами по номеру: ${session.phone}.\n\nТелефон горячей линии: 8 (846) 989-07-68`, getVkKeyboard());

      // Уведомление в Telegram Павлу Валерьевичу
      const tgLead = `🔔 <b>НОВАЯ ЗАЯВКА ИЗ ВКОНТАКТЕ!</b>\n\n` +
        `👤 <b>VK Профиль:</b> https://vk.com/id${userId}\n` +
        `📞 <b>Телефон:</b> <code>${session.phone}</code>\n` +
        `📝 <b>Суть вопроса:</b> ${session.problem}\n\n` +
        `⏰ <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Samara' })}</i>`;

      notifyTelegram(tgLead);
      return;
    }
  }

  // Нажатия на кнопки
  if (text === '⚖️ Консультация юриста' || text.toLowerCase().includes('консультац')) {
    vkSessions.set(userId, { step: 'WAIT_PHONE' });
    await sendVkMsg(userId, `✍️ Запись на бесплатную консультацию:\n\nУкажите ваш контактный номер телефона для связи с юристом:`);
    return;
  }

  if (text === '🏢 Народный аудит ЖКХ') {
    const jkhText = `🏢 Программа «Народный аудит ЖКХ» АНО «ЮГ-ПРАВО»:\n\n` +
      `• Фиксация заливов квартир и независимая оценка ущерба;\n` +
      `• Перерасчет платы за некачественное отопление и воду;\n` +
      `• Взыскание 100% ущерба + штраф 50% с управляющей компании.\n\n` +
      `Напишите ваш вопрос или нажмите «⚖️ Консультация юриста» для связи.`;
    await sendVkMsg(userId, jkhText, getVkKeyboard());
    return;
  }

  if (text === '🐾 Проект Добрая лапа') {
    const lapaText = `🐾 Проект защиты животных «Добрая лапа»:\n\n` +
      `• Общественный контроль приютов и отлова по 498-ФЗ;\n` +
      `• Борьба с жестоким обращением (ст. 245 УК РФ);\n` +
      `• Помощь кормами и поиск добрых рук.\n\n` +
      `Подробнее на нашем портале: ${SITE_URL}initiatives.html`;
    await sendVkMsg(userId, lapaText, getVkKeyboard());
    return;
  }

  if (text === '📞 Контакты и адрес') {
    const contactText = `🏛️ АНО «ЦПЗ ЮГ-ПРАВО»\n\n` +
      `• Учетный № Минюста РФ: 6314010192\n` +
      `• ОГРН: 1266300015080 | ИНН: 6317174776\n` +
      `📍 Адрес: Самарская обл., Большеглушицкий р-н, п. Южный, ул. Центральная, д. 7\n` +
      `📞 Горячая линия: 8 (846) 989-07-68\n` +
      `🌐 Сайт: ${SITE_URL}`;
    await sendVkMsg(userId, contactText, getVkKeyboard());
    return;
  }

  // Приветствие по умолчанию
  const welcome = `Здравствуйте! Вас приветствует официальный помощник АНО «ЦПЗ ЮГ-ПРАВО».\n\n` +
    `Мы оказываем бесплатную правовую помощь жителям Самары и Самарской области.\n\n` +
    `👇 Выберите интересующий раздел в меню ниже:`;

  await sendVkMsg(userId, welcome, getVkKeyboard());
}

// Запуск LongPoll сервера для получения входящих сообщений VK
async function startLongPoll() {
  console.log("Connecting to VK LongPoll server for Group 112146607...");
  
  const lpServer = await vkCall('groups.getLongPollServer', { group_id: VK_GROUP_ID });
  if (!lpServer.response) {
    console.error("LongPoll error:", lpServer);
    return;
  }

  const { server, key, ts } = lpServer.response;
  let currentTs = ts;

  async function pollLoop() {
    try {
      const url = `${server}?act=a_check&key=${key}&ts=${currentTs}&wait=25`;
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', async () => {
          try {
            const json = JSON.parse(data);
            if (json.ts) currentTs = json.ts;
            if (json.updates) {
              for (const update of json.updates) {
                if (update.type === 'message_new' && update.object && update.object.message) {
                  await handleVkMessage(update.object.message);
                }
              }
            }
          } catch (e) {}
          setTimeout(pollLoop, 100);
        });
      }).on('error', () => setTimeout(pollLoop, 2000));
    } catch (e) {
      setTimeout(pollLoop, 2000);
    }
  }

  console.log("=========================================");
  console.log("🌐 VK CHAT-BOT IS RUNNING FOR GROUP 112146607!");
  console.log("=========================================");
  pollLoop();
}

startLongPoll();
