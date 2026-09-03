/**
 * ⚖️ АНО «ЦПЗ ЮГ-ПРАВО» — Главный цифровой ассистент (@ugpravo_assistant_bot)
 * 
 * Полная интеграция:
 * 1. 📱 Telegram Mini App 7.0+ и навигация по сайту https://yugpravo.ru/
 * 2. 📂 Личный кабинет гражданина: отслеживание обращений, договоров и сопровождения
 * 3. 🔗 Автоматическая привязка заявок с сайта через Deep Link (start=track_...) и поиск по телефону
 * 4. 🚫 Отзыв обращений заявителем в соответствии со ст. 5 ч. 5 Федерального закона № 59-ФЗ
 * 5. 💬 Двусторонняя связь: диалог специалист ⟷ заявитель прямо через бота или в личку
 * 6. 🎛️ Панель специалиста / администратора: смена статусов с мгновенным push заявителю
 * 7. 👥 Официальная группа https://t.me/ano_ugpravo
 */

const https = require('https');
const path = require('path');
const fs = require('fs');

const appealsManager = require('../scripts/appeals-manager.js');

// Загрузка переменных окружения
function loadEnv() {
  const env = {};
  const paths = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '.env')
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      const lines = fs.readFileSync(p, 'utf-8').split('\n');
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
            if (!env[key]) env[key] = val;
          }
        }
      }
    }
  }
  return env;
}

const envConfig = loadEnv();

const TOKEN = envConfig.TELEGRAM_MAIN_BOT_TOKEN || "8940322181:AAENoL3QCWhHpc4fKqZbVupbdN3BLjmZxOQ";
const ADMIN_ID = envConfig.ADMIN_CHAT_ID ? parseInt(envConfig.ADMIN_CHAT_ID, 10) : 306883501;
const WEB_APP_URL = envConfig.WEB_APP_URL || "https://yugpravo.ru/";
const TG_GROUP_URL = envConfig.TG_GROUP_URL || "https://t.me/ano_ugpravo";

// Сессии пользователей (состояния диалогов)
const userSessions = new Map();

// API Helper
function api(method, params = {}) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(params);
    const req = https.request(`https://api.telegram.org/bot${TOKEN}/${method}`, {
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

// Escape HTML for Telegram
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Отправка сообщений с автоматическим fallback при ошибках парсинга
async function sendMsg(chatId, text, replyMarkup = null, disablePreview = true) {
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    disable_web_page_preview: disablePreview
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  const res = await api('sendMessage', payload);
  if (!res.ok) {
    console.error(`⚠️ [Telegram sendMsg Error] to ${chatId}:`, res.description || res.error);
    if (res.description && res.description.includes("can't parse entities")) {
      delete payload.parse_mode;
      payload.text = text.replace(/<[^>]*>/g, '');
      return await api('sendMessage', payload);
    }
  }
  return res;
}

// Главная нижняя клавиатура
function getMainReplyKeyboard() {
  return {
    keyboard: [
      [
        { text: "📱 Открыть портал (Mini App)", web_app: { url: WEB_APP_URL } }
      ],
      [
        { text: "📂 Мои обращения и договоры" },
        { text: "✍️ Оставить обращение" }
      ],
      [
        { text: "🧮 Калькулятор госпошлины 2026", web_app: { url: `${WEB_APP_URL}calculator.html` } },
        { text: "👥 Группа @ano_ugpravo" }
      ],
      [
        { text: "ℹ️ Об организации и реквизиты" },
        { text: "📞 Горячая линия" }
      ]
    ],
    resize_keyboard: true,
    is_persistent: true
  };
}

// Карточка одного обращения/договора для заявителя
function renderAppealCard(appeal) {
  const isWithdrawn = appeal.status === 'WITHDRAWN';
  const prefix = appeal.docPrefix || '📩';
  const label = appeal.docTypeLabel || 'Обращение';
  const isContract = appeal.docType === 'contract' || (appeal.caseId && appeal.caseId.startsWith('ДОГ'));
  const isAssignment = appeal.docType === 'service' || (appeal.caseId && appeal.caseId.startsWith('СПР'));
  const accusative = getDocTypeAccusative(appeal);

  const safeMsg = escapeHtml(appeal.message || '');
  const safeNote = escapeHtml(appeal.statusNote || '');
  const safeDir = escapeHtml(appeal.direction || '');

  let text = `<b>${prefix} ${label.toUpperCase()} № ${appeal.caseId}</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `• <b>Текущий статус:</b> ${appeal.statusText}\n` +
    `• <b>Ответственный:</b> ${appeal.assignedSpecialist || 'Специалист центра'}\n` +
    `• <b>Дата регистрации:</b> ${appeal.createdAt}\n` +
    (safeDir && safeDir !== '—' ? `• <b>Направление:</b> ${safeDir}\n` : '') +
    (safeMsg && safeMsg !== '—' ? `• <b>Суть:</b> <i>${safeMsg.slice(0, 300)}</i>\n` : '') +
    (safeNote ? `\n💡 <b>Комментарий специалиста:</b> ${safeNote}\n` : '') +
    (isWithdrawn ? `\n⚠️ <i>Рассмотрение прекращено по заявлению гражданина на основании ч. 5 ст. 5 59-ФЗ. Запись перенесена в архив.</i>\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━`;

  const cleanSeq = appeal.caseId.slice(-4);

  const buttons = [];
  if (!isWithdrawn) {
    buttons.push([
      { text: "💬 Задать вопрос специалисту", callback_data: `ask_${cleanSeq}` }
    ]);
    if (isContract) {
      buttons.push([
        { text: "📜 Открыть подписанный договор", web_app: { url: `${WEB_APP_URL}assignment-viewer.html?caseId=${encodeURIComponent(appeal.caseId)}` } }
      ]);
    } else if (isAssignment) {
      buttons.push([
        { text: "📄 Открыть Заявление-поручение (ПЭП)", web_app: { url: `${WEB_APP_URL}assignment-viewer.html?caseId=${encodeURIComponent(appeal.caseId)}` } }
      ]);
    } else {
      buttons.push([
        { text: "📋 Электронный талон регистрации", web_app: { url: `${WEB_APP_URL}assignment-viewer.html?caseId=${encodeURIComponent(appeal.caseId)}` } }
      ]);
    }
    buttons.push([
      { text: `🚫 Отозвать ${accusative}`, callback_data: `confirm_withdraw_${cleanSeq}` }
    ]);
  } else {
    buttons.push([
      { text: "🚫 Документ отозван (в архиве)", callback_data: `noop` }
    ]);
  }
  buttons.push([
    { text: "« Назад к списку документов", callback_data: `my_appeals` }
  ]);

  return { text, keyboard: { inline_keyboard: buttons } };
}

// Список обращений заявителя
async function showUserAppeals(chatId) {
  const appeals = appealsManager.getAppealsByTelegramId(chatId);

  if (appeals.length === 0) {
    const emptyText = `📂 <b>Ваши документы и обращения</b>\n\n` +
      `К вашему Telegram-аккаунту пока не привязано ни одного обращения или договора.\n\n` +
      `<b>Как найти поданные ранее документы:</b>\n` +
      `1️⃣ Нажмите кнопку <b>«📱 Найти по номеру телефона»</b> ниже (бот сверит ваш номер с базой сайта);\n` +
      `2️⃣ Либо просто напишите номер документа (например: <code>ОБР-26/ЖКХ-0001</code>).`;

    const requestPhoneKb = {
      keyboard: [
        [{ text: "📱 Найти по номеру телефона", request_contact: true }],
        [{ text: "« Главное меню" }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    };

    userSessions.set(chatId, { state: 'WAIT_CASE_ID_OR_PHONE' });
    await sendMsg(chatId, emptyText, requestPhoneKb);
    return;
  }

  let listText = `📂 <b>Ваши документы и обращения в АНО «ЮГ-ПРАВО» (Всего: ${appeals.length}):</b>\n\n`;
  const inlineButtons = [];

  appeals.forEach((a, idx) => {
    const pfx = a.docPrefix || '📩';
    const lbl = a.docTypeLabel || 'Обращение';
    listText += `${idx + 1}️⃣ <b>${pfx} ${lbl} № ${a.caseId}</b>\n` +
      `   ↳ <i>Статус:</i> ${a.statusText}\n` +
      `   ↳ <i>Дата:</i> ${a.createdAt}\n\n`;

    const cleanSeq = a.caseId.slice(-4);
    inlineButtons.push([
      { text: `${pfx} ${lbl} № ${a.caseId}`, callback_data: `view_${cleanSeq}` }
    ]);
  });

  listText += `👇 <i>Нажмите на нужный документ для просмотра деталей и связи со специалистом:</i>`;

  inlineButtons.push([
    { text: "📱 Открыть портал (Mini App)", web_app: { url: WEB_APP_URL } }
  ]);

  await sendMsg(chatId, listText, { inline_keyboard: inlineButtons });
}

// Настройка команд и кнопки меню
async function setupBotMenu() {
  try {
    await api('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: '📱 ЮГ-ПРАВО',
        web_app: { url: WEB_APP_URL }
      }
    });

    await api('setMyCommands', {
      commands: [
        { command: 'start', description: '🚀 Главное меню и электронная приёмная' },
        { command: 'my', description: '📂 Мои обращения, договоры и статус дел' },
        { command: 'new', description: '✍️ Подать новое обращение или поручение' },
        { command: 'calc', description: '🧮 Калькулятор госпошлины 2026' },
        { command: 'group', description: '👥 Официальная группа (t.me/ano_ugpravo)' },
        { command: 'contacts', description: '📞 Контакты и реквизиты организации' }
      ]
    });
    console.log('✅ Настройки меню и команд Main Bot успешно обновлены!');
  } catch (err) {
    console.warn('⚠️ Ошибка настройки MenuButton:', err.message);
  }
}

// Обработка входящих сообщений
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const firstName = msg.from.first_name || 'Гражданин';
  const username = msg.from.username ? `@${msg.from.username}` : '';
  const isAdmin = (chatId === ADMIN_ID);

  // 1. Приём нативного контакта через кнопку (поиск по верифицированному телефону)
  if (msg.contact) {
    // Защита от пересылки чужого контакта из телефонной книги
    if (msg.contact.user_id && msg.contact.user_id !== msg.from.id) {
      await sendMsg(chatId, `⚠️ <b>Ошибка безопасности:</b> передан контакт другого человека.\n\nПожалуйста, используйте именно системную кнопку <b>«📱 Найти по номеру телефона»</b>, чтобы подтвердить собственный Telegram-аккаунт.`, getMainReplyKeyboard());
      userSessions.delete(chatId);
      return;
    }

    const phoneNumber = msg.contact.phone_number;
    const matchedAppeals = appealsManager.getAndLinkAppealsByPhone(phoneNumber, chatId, username);

    if (matchedAppeals.length > 0) {
      await sendMsg(chatId, `✅ <b>Номер телефона успешно подтвержден!</b> Найдено документов: <b>${matchedAppeals.length}</b>. Все они привязаны к вашему Telegram.`, getMainReplyKeyboard());
      await showUserAppeals(chatId);
    } else {
      await sendMsg(chatId, `ℹ️ По номеру <b>${phoneNumber}</b> в реестре пока нет зарегистрированных документов.\n\nЕсли вы подавали заявку с другим номером, напишите регистрационный номер документа (например: <code>ОБР-26/ЖКХ-0001</code>).`, getMainReplyKeyboard());
    }
    userSessions.delete(chatId);
    return;
  }

  // 2. Обработка состояний диалога
  if (userSessions.has(chatId)) {
    const session = userSessions.get(chatId);

    // Ожидание номера дела от пользователя
    if (session.state === 'WAIT_CASE_ID_OR_PHONE') {
      if (text === '« Главное меню') {
        userSessions.delete(chatId);
        await sendMsg(chatId, "Главное меню:", getMainReplyKeyboard());
        return;
      }

      const appeal = appealsManager.getAppeal(text);
      if (appeal) {
        appealsManager.linkTelegramToAppeal(appeal.caseId, chatId, username, firstName);
        userSessions.delete(chatId);
        await sendMsg(chatId, `✅ <b>${appeal.docTypeLabel} № ${appeal.caseId} успешно привязано!</b>`, getMainReplyKeyboard());
        const card = renderAppealCard(appeal);
        await sendMsg(chatId, card.text, card.keyboard);
        return;
      } else {
        await sendMsg(chatId, `⚠️ Документ с номером <b>${text}</b> не найден. Проверьте правильность номера или отправьте контакт через кнопку:`);
        return;
      }
    }

    // Заявитель отправляет вопрос специалисту
    if (session.state === 'WAIT_APPLICANT_QUESTION') {
      const caseId = session.caseId;
      userSessions.delete(chatId);

      const appeal = appealsManager.getAppeal(caseId);
      const exactCaseId = appeal ? appeal.caseId : caseId;
      const dative = getDocTypeDative(appeal);
      appealsManager.addMessage(exactCaseId, 'applicant', firstName, text);

      await sendMsg(chatId, `✅ <b>Ваш вопрос по ${dative} № ${exactCaseId} передан специалисту!</b>\n\nСпециалист центра ответит вам здесь в ближайшее время.`, getMainReplyKeyboard());

      // Уведомление администратору
      const cleanSeq = exactCaseId.slice(-4);
      const cleanUsername = (username || '').replace('@', '').trim();
      const adminButtons = [
        [{ text: "✍️ Ответить заявителю в чат", callback_data: `reply_${cleanSeq}` }]
      ];
      if (cleanUsername) {
        adminButtons.push([{ text: `💬 Написать @${cleanUsername} в личку`, url: `https://t.me/${cleanUsername}` }]);
      }

      const adminNotice = `💬 <b>ВОПРОС ОТ ЗАЯВИТЕЛЯ</b>\n` +
        `🆔 <b>Дело:</b> <code>${exactCaseId}</code> (${appeal?.docTypeLabel || 'Обращение'})\n` +
        `👤 <b>Заявитель:</b> ${firstName} ${username} (ID: <code>${chatId}</code>)\n` +
        `📞 <b>Телефон:</b> <code>${appeal?.phone || '—'}</code>\n\n` +
        `📝 <b>Текст вопроса:</b>\n<i>${escapeHtml(text)}</i>`;

      await sendMsg(ADMIN_ID, adminNotice, { inline_keyboard: adminButtons });
      return;
    }

    // Специалист (Админ) отправляет ответ заявителю через бота
    if (isAdmin && session.state === 'WAIT_SPECIALIST_REPLY') {
      const caseId = session.caseId;
      userSessions.delete(chatId);

      const appeal = appealsManager.getAppeal(caseId);
      const exactCaseId = appeal ? appeal.caseId : caseId;
      const dative = getDocTypeDative(appeal);

      appealsManager.addMessage(exactCaseId, 'specialist', 'Специалист АНО «ЮГ-ПРАВО»', text);

      await sendMsg(chatId, `✅ <b>Ответ успешно отправлен заявителю по ${dative} № ${exactCaseId}!</b>`);

      // Отправляем заявителю, если привязан Telegram
      if (appeal && appeal.telegramId) {
        const cleanSeq = exactCaseId.slice(-4);
        const userMsg = `⚖️ <b>СООБЩЕНИЕ ОТ СПЕЦИАЛИСТА АНО «ЮГ-ПРАВО»</b>\n` +
          `📌 <i>К ${dative} № ${exactCaseId} (${appeal.docTypeLabel})</i>\n\n` +
          `💬 <b>Текст ответа:</b>\n${escapeHtml(text)}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `<i>Вы можете ответить на это сообщение, нажав кнопку ниже:</i>`;

        await sendMsg(appeal.telegramId, userMsg, {
          inline_keyboard: [
            [{ text: "💬 Ответить специалисту", callback_data: `ask_${cleanSeq}` }],
            [{ text: "📱 Открыть в Mini App", web_app: { url: `${WEB_APP_URL}assignment-viewer.html?caseId=${encodeURIComponent(exactCaseId)}` } }]
          ]
        });
      } else {
        await sendMsg(chatId, `⚠️ <i>Заявитель еще не подключил Telegram (ID не привязан). Ответ сохранен в реестре.</i>`);
      }
      return;
    }
  }

  // 3. Команда /start и Deep Links (start=track_...)
  if (text.startsWith('/start')) {
    const parts = text.split(' ');
    const param = parts[1] || '';

    // Deep link отслеживания: /start track_ОБР-26_ЖКХ-0001
    if (param.startsWith('track_')) {
      const rawCaseId = param.replace('track_', '');
      const appeal = appealsManager.getAppeal(rawCaseId);

      if (appeal) {
        appealsManager.linkTelegramToAppeal(appeal.caseId, chatId, username, firstName);

        const card = renderAppealCard(appeal);
        await sendMsg(chatId, `👋 Здравствуйте, <b>${firstName}</b>!\n\n` +
          `✅ <b>${appeal.docTypeLabel} № ${appeal.caseId} успешно привязано к вашему Telegram!</b>\n\n` +
          `Вы будете получать оперативные уведомления о ходе рассмотрения и подготовке процессуальных документов.`, getMainReplyKeyboard());

        await sendMsg(chatId, card.text, card.keyboard);

        // Уведомление админу
        const adminNotice = `🟢 <b>ЗАЯВИТЕЛЬ ПОДКЛЮЧИЛ TELEGRAM!</b>\n\n` +
          `🆔 <b>${appeal.docTypeLabel}:</b> <code>${appeal.caseId}</code>\n` +
          `👤 <b>Заявитель:</b> ${firstName} ${username}\n` +
          `📞 <b>Телефон:</b> <code>${appeal.phone}</code>\n` +
          `🏢 <b>Отдел:</b> ${appeal.alias}`;

        const cleanId = appeal.caseId.replace(/[^a-zA-Z0-9_-]/g, '_');
        await sendMsg(ADMIN_ID, adminNotice, {
          inline_keyboard: [
            [{ text: "💬 Написать в личку заявителю", url: username ? `https://t.me/${username.replace('@', '')}` : `tg://user?id=${chatId}` }],
            [{ text: "✍️ Ответить через бота", callback_data: `reply_${cleanId}` }]
          ]
        });
        return;
      }
    }

    // Стандартное приветствие
    const welcome = `👋 <b>Добро пожаловать в электронную приёмную АНО «ЮГ-ПРАВО»!</b>\n\n` +
      `Здравствуйте, <b>${firstName}</b>!\n\n` +
      `Мы — социально ориентированная некоммерческая организация (г. Самара). Оказываем профессиональную правовую помощь гражданам, защищаем права потребителей, заемщиков и жителей МКД.\n\n` +
      `<b>Что умеет наш цифровой ассистент:</b>\n` +
      `📱 <b>Портал в 1 клик:</b> доступ к калькулятору пошлин, базе знаний и сервисам;\n` +
      `📂 <b>Личный кабинет:</b> отслеживание статуса ваших обращений, договоров и сопровождения;\n` +
      `💬 <b>Прямая связь со специалистом:</b> оперативные консультации и уведомления.\n\n` +
      `<i>Сервис предоставляется в соответствии с <a href="${WEB_APP_URL}doc-viewer.html?doc=donation-offer">Публичной офертой</a> и <a href="${WEB_APP_URL}doc-viewer.html?doc=politika">Политикой ПД</a>.</i>\n\n` +
      `👇 <i>Выберите интересующий раздел:</i>`;

    await sendMsg(chatId, welcome, getMainReplyKeyboard());
    return;
  }

  // 4. Меню: «📂 Мои обращения и договоры» / /my
  if (text === "📂 Мои обращения и договоры" || text === '/my') {
    await showUserAppeals(chatId);
    return;
  }

  // 5. Меню: «✍️ Оставить обращение» / /new
  if (text === "✍️ Оставить обращение" || text === '/new') {
    const newText = `✍️ <b>Подача обращения или поручения в АНО «ЮГ-ПРАВО»</b>\n\n` +
      `Выберите удобный способ подачи:\n\n` +
      `1️⃣ <b>Интерактивно через сайт (Mini App):</b> заполнение формы с автоматическим расчетом госпошлины и формированием электронного поручения;\n` +
      `2️⃣ <b>Позвонить в приёмную:</b> прямой звонок дежурному специалисту центра.\n\n` +
      `<i>Досудебный правовой анализ обращений граждан осуществляется бесплатно.</i>`;

    await sendMsg(chatId, newText, {
      inline_keyboard: [
        [{ text: "🚀 Заполнить форму на портале (Mini App)", web_app: { url: `${WEB_APP_URL}` } }],
        [{ text: "📞 Позвонить дежурному специалисту", url: "tel:+78469890768" }]
      ]
    });
    return;
  }

  // 6. Меню: «👥 Группа @ano_ugpravo» / /group
  if (text.includes('ano_ugpravo') || text === '/group') {
    await sendMsg(chatId, `👥 <b>Официальное сообщество АНО «ЮГ-ПРАВО» в Telegram:</b>\n\n` +
      `Здесь мы публикуем судебную практику, разборы коммунальных споров, отчеты проверок и образцы процессуальных документов.\n\n` +
      `🔗 <a href="${TG_GROUP_URL}">t.me/ano_ugpravo</a>`, {
      inline_keyboard: [
        [{ text: "🚀 Перейти в группу t.me/ano_ugpravo", url: TG_GROUP_URL }]
      ]
    });
    return;
  }

  // 7. Меню: «ℹ️ Об организации и реквизиты» / /contacts
  if (text === "ℹ️ Об организации и реквизиты" || text === "📞 Горячая линия" || text === '/contacts') {
    const textAbout = `🏛️ <b>АВТОНОМНАЯ НЕКОММЕРЧЕСКАЯ ОРГАНИЗАЦИЯ</b>\n` +
      `«Центр правовой защиты и развития гражданских инициатив ЮГ-ПРАВО»\n\n` +
      `• <b>Директор:</b> Шарыпаев Павел Валерьевич\n` +
      `• <b>ОГРН:</b> 1266300015080 | <b>ИНН:</b> 6317174776\n` +
      `• <b>Юридический адрес:</b> 446186, Самарская обл., Большеглушицкий р-н, п. Южный, ул. Центральная, д. 7, кв. 1\n` +
      `• <b>Телефон приёмной:</b> 8 (846) 989-07-68\n` +
      `• <b>Электронная почта:</b> info@yugpravo.ru\n` +
      `• <b>Официальный сайт:</b> <a href="${WEB_APP_URL}">yugpravo.ru</a>\n\n` +
      `<i>Деятельность направлена на содействие гражданам в защите нарушенных прав и законных интересов.</i>`;

    await sendMsg(chatId, textAbout, {
      inline_keyboard: [
        [{ text: "🌐 Открыть портал yugpravo.ru", web_app: { url: WEB_APP_URL } }],
        [{ text: "👥 Наша группа @ano_ugpravo", url: TG_GROUP_URL }]
      ]
    });
    return;
  }

  // Ответ по умолчанию
  await sendMsg(chatId, `👋 Здравствуйте, <b>${firstName}</b>! Воспользуйтесь кнопками меню для перехода к услугам или проверки статуса документов:`, getMainReplyKeyboard());
}

// Обработка инлайн-кнопок
async function handleCallback(cb) {
  const chatId = cb.message ? cb.message.chat.id : cb.from.id;
  const data = cb.data || '';
  const username = cb.from.username ? `@${cb.from.username}` : '';
  const firstName = cb.from.first_name || 'Гражданин';
  const isAdmin = (chatId === ADMIN_ID);

  console.log(`🔘 [Callback] Chat ${chatId} (${firstName} ${username}) clicked: "${data}"`);

  try {
    await api('answerCallbackQuery', { callback_query_id: cb.id });
  } catch (_) {}

  if (data === 'noop') return;

  // Назад к списку документов
  if (data === 'my_appeals') {
    await showUserAppeals(chatId);
    return;
  }

  // Просмотр конкретного обращения: view_<caseId>
  if (data.startsWith('view_')) {
    const rawId = data.replace('view_', '');
    const appeal = appealsManager.getAppeal(rawId);

    if (appeal) {
      const card = renderAppealCard(appeal);
      await sendMsg(chatId, card.text, card.keyboard);
    } else {
      await sendMsg(chatId, `⚠️ Документ <b>${rawId}</b> не найден в реестре.`, getMainReplyKeyboard());
    }
    return;
  }

  // Заявитель хочет задать вопрос специалисту: ask_<caseId>
  if (data.startsWith('ask_')) {
    const rawId = data.replace('ask_', '');
    const appeal = appealsManager.getAppeal(rawId);
    const targetCaseId = appeal ? appeal.caseId : rawId;
    const dative = getDocTypeDative(appeal);
    userSessions.set(chatId, { state: 'WAIT_APPLICANT_QUESTION', caseId: targetCaseId });

    await sendMsg(chatId, `📝 <b>Задайте вопрос специалисту по ${dative} № ${targetCaseId}:</b>\n\n` +
      `Напишите текст сообщения в ответ — оно будет мгновенно передано ответственному специалисту центра:`);
    return;
  }

  // Запрос подтверждения отзыва: confirm_withdraw_<caseId>
  if (data.startsWith('confirm_withdraw_')) {
    const rawId = data.replace('confirm_withdraw_', '');
    const appeal = appealsManager.getAppeal(rawId);
    const targetCaseId = appeal ? appeal.caseId : rawId;
    const cleanSeq = targetCaseId.slice(-4);
    const genitive = getDocTypeGenitive(appeal);
    const accusative = getDocTypeAccusative(appeal);

    await sendMsg(chatId, `⚠️ <b>Подтверждение отзыва ${genitive}</b>\n\n` +
      `Вы действительно хотите отозвать ${accusative} <b>№ ${targetCaseId}</b> и прекратить его рассмотрение в соответствии со ст. 5 ч. 5 Федерального закона № 59-ФЗ?`, {
      inline_keyboard: [
        [
          { text: "✅ Да, отозвать", callback_data: `do_withdraw_${cleanSeq}` },
          { text: "❌ Отмена", callback_data: `view_${cleanSeq}` }
        ]
      ]
    });
    return;
  }

  // Исполнение отзыва: do_withdraw_<caseId>
  if (data.startsWith('do_withdraw_')) {
    const rawId = data.replace('do_withdraw_', '');
    const appeal = appealsManager.getAppeal(rawId);
    const targetCaseId = appeal ? appeal.caseId : rawId;
    const res = appealsManager.withdrawAppeal(targetCaseId, chatId);

    if (res.success) {
      await sendMsg(chatId, `🚫 <b>Документ № ${res.appeal.caseId} успешно отозван.</b>\n\nДело переведено в архив. Вы всегда можете подать новое обращение при необходимости.`, getMainReplyKeyboard());

      // Уведомление админу
      await sendMsg(ADMIN_ID, `⚠️ <b>ЗАЯВИТЕЛЬ ОТОЗВАЛ ОБРАЩЕНИЕ!</b>\n\n` +
        `🆔 <b>Дело:</b> <code>${res.appeal.caseId}</code> (${res.appeal.docTypeLabel})\n` +
        `👤 <b>Заявитель:</b> ${res.appeal.name} (${res.appeal.phone})\n` +
        `Статус изменен на: <i>🚫 Отозвано заявителем</i>`);
    } else {
      await sendMsg(chatId, `❌ Не удалось отозвать документ: ${res.error}`);
    }
    return;
  }

  // Специалист (Админ) хочет ответить заявителю: reply_<caseId>
  if (isAdmin && data.startsWith('reply_')) {
    const rawId = data.replace('reply_', '');
    const appeal = appealsManager.getAppeal(rawId);
    const targetCaseId = appeal ? appeal.caseId : rawId;
    userSessions.set(chatId, { state: 'WAIT_SPECIALIST_REPLY', caseId: targetCaseId });

    await sendMsg(chatId, `✍️ <b>Режим ответа заявителю по документу № ${targetCaseId}:</b>\n\n` +
      `Напишите текст ответа. Бот отправит его заявителю от имени специалиста АНО «ЮГ-ПРАВО»:`);
    return;
  }

  // Специалист (Админ) меняет статус дела: st_<STATUS>_<caseId>
  if (isAdmin && data.startsWith('st_')) {
    const parts = data.split('_');
    const newStatus = parts[1]; // IN_PROGRESS, DOC_READY, COMPLETED
    const rawCaseId = parts.slice(2).join('_');

    const appeal = appealsManager.getAppeal(rawCaseId);
    const targetCaseId = appeal ? appeal.caseId : rawCaseId;

    const updatedAppeal = appealsManager.updateStatus(targetCaseId, newStatus, '', 'Специалист АНО «ЮГ-ПРАВО»');

    if (updatedAppeal) {
      await sendMsg(chatId, `✅ <b>Статус дела № ${updatedAppeal.caseId} изменен на:</b> ${updatedAppeal.statusText}`);

      // Push заявителю
      if (updatedAppeal.telegramId) {
        const cleanSeq = updatedAppeal.caseId.slice(-4);
        const userNotice = `🔔 <b>ОБНОВЛЕНИЕ ПО ВАШЕМУ ДОКУМЕНТУ</b>\n\n` +
          `📌 <b>${updatedAppeal.docTypeLabel} № ${updatedAppeal.caseId}</b>\n` +
          `• <b>Новый статус:</b> ${updatedAppeal.statusText}\n` +
          `• <b>Ответственный:</b> ${updatedAppeal.assignedSpecialist}\n\n` +
          `<i>Вы можете ознакомиться с материалами и задать вопрос специалисту, нажав кнопки ниже:</i>`;

        await sendMsg(updatedAppeal.telegramId, userNotice, {
          inline_keyboard: [
            [{ text: "📂 Открыть карточку документа", callback_data: `view_${cleanSeq}` }],
            [{ text: "📱 Открыть в Mini App", web_app: { url: `${WEB_APP_URL}assignment-viewer.html?caseId=${encodeURIComponent(updatedAppeal.caseId)}` } }]
          ]
        });
      }
    } else {
      await sendMsg(chatId, `❌ Обращение № ${rawCaseId} не найдено.`);
    }
    return;
  }
}

// Polling
let lastUpdateId = 0;
async function poll() {
  try {
    const res = await api('getUpdates', {
      offset: lastUpdateId + 1,
      timeout: 25,
      allowed_updates: ['message', 'callback_query', 'my_chat_member', 'chat_member']
    });

    if (res.ok && res.result && res.result.length > 0) {
      for (const update of res.result) {
        lastUpdateId = update.update_id;

        if (update.message) {
          await handleMessage(update.message);
        } else if (update.callback_query) {
          await handleCallback(update.callback_query);
        }
      }
    }
  } catch (e) {
    console.error("Main Bot polling error:", e.message);
  }
  setTimeout(poll, 300);
}

// Запуск
console.log("=========================================");
console.log("🤖 АНО «ЮГ-ПРАВО» FLAGSHIP ASSISTANT BOT 3.0 IS ACTIVE!");
console.log(`👤 Admin Chat ID: ${ADMIN_ID}`);
console.log(`🌐 Web App URL: ${WEB_APP_URL}`);
console.log(`👥 Telegram Group: ${TG_GROUP_URL}`);
console.log("=========================================");

setupBotMenu().then(() => {
  poll();
});
