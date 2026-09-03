/**
 * 📰 АНО «ЦПЗ ЮГ-ПРАВО» — Бот-копирайтер, генератор новостей и автопостинга (@news_ugpravo_bot / @repostchilli_bot)
 * 
 * Назначение:
 * 1. ✍️ Умный копирайтинг и юридический рерайт любых постов, новостей и пересланных сообщений.
 * 2. 🏛️ Генерация экспертных правовых публикаций по рубрикам (ЖКХ, 230-ФЗ, 498-ФЗ «Добрая лапа», ЗоЗПП, Суд, Трудовые права).
 * 3. 🎯 Система премодерации: Черновик отправляется администратору на утверждение с кнопками «✅ Опубликовать в группу» и «❌ Отклонить».
 * 4. 📢 Автопостинг утвержденного поста (текст + фото) в официальную группу https://t.me/ano_ugpravo.
 * 5. 📱 Фирменный стиль АНО «ЮГ-ПРАВО», ссылки на бота @ugpravo_assistant_bot и портал https://yugpravo.ru/.
 */

const https = require('https');
const path = require('path');
const fs = require('fs');

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

const BOT_TOKEN = envConfig.TELEGRAM_NEWS_BOT_TOKEN || envConfig.TELEGRAM_REPOST_BOT_TOKEN || "6029712671:AAHbEAc9fluU8mHYeu56ujaqJ5fDEY-It_I";
const ADMIN_ID = envConfig.ADMIN_CHAT_ID ? parseInt(envConfig.ADMIN_CHAT_ID, 10) : 306883501;
const TARGET_CHANNEL = envConfig.TELEGRAM_TARGET_CHANNEL_ID || "@ano_ugpravo";
const TG_GROUP_URL = envConfig.TG_GROUP_URL || "https://t.me/ano_ugpravo";
const WEB_APP_URL = envConfig.WEB_APP_URL || "https://yugpravo.ru/";

// Хранилище активных черновиков постов
const pendingDrafts = new Map();

// API Helper
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

// Отправка текстовых сообщений
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

// Отправка фото с подписью
async function sendPhotoMsg(chatId, photoFileId, caption, replyMarkup = null) {
  const payload = {
    chat_id: chatId,
    photo: photoFileId,
    caption: caption,
    parse_mode: 'HTML'
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  return await api('sendPhoto', payload);
}

// Главная панель управления
function getMainAdminKeyboard() {
  return {
    keyboard: [
      [
        { text: "✍️ Написать новость ЖКХ" },
        { text: "🛡️ Пост: Защита от коллекторов (230-ФЗ)" }
      ],
      [
        { text: "🐾 Пост: «Добрая лапа» (498-ФЗ)" },
        { text: "⚖️ Пост: Судебная практика и иски" }
      ],
      [
        { text: "🛒 Пост: Права потребителей (ЗоЗПП)" },
        { text: "💼 Пост: Трудовые споры и зарплата" }
      ],
      [
        { text: "📱 Открыть сайт (Mini App)", web_app: { url: WEB_APP_URL } },
        { text: "👥 Открыть группу @ano_ugpravo" }
      ]
    ],
    resize_keyboard: true,
    is_persistent: true
  };
}

// Умный юридический рерайтер любого входящего текста/поста
function transformIntoLegalPost(rawText, mode = 'STANDARD') {
  // Очистка от мусорных ссылок и чужих каналов
  let clean = rawText
    .replace(/t\.me\/[a-zA-Z0-9_+/]+/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/@[a-zA-Z0-9_]+/g, '')
    .trim();

  // Определение тематики и тегов
  let categoryTitle = 'ПРАВОВОЙ ВЕСТНИК';
  let categoryHeader = '⚖️ АНО «ЦПЗ ЮГ-ПРАВО» | ВАЖНОЕ В ЗАКОНОДАТЕЛЬСТВЕ';
  let comment = 'При любых разногласиях соблюдайте обязательный досудебный порядок и требуйте письменные подтверждения.';
  let tags = '#ЮгПраво #ПравоваяЗащита #Самара #ЗаконРФ';

  const t = clean.toLowerCase();

  if (t.includes('жкх') || t.includes('ук') || t.includes('отоплен') || t.includes('залив') || t.includes('тариф') || t.includes('протечк') || t.includes('счетчик') || t.includes('мусор')) {
    categoryTitle = 'НАРОДНЫЙ АУДИТ ЖКХ';
    categoryHeader = '🏢 АНО «ЦПЗ ЮГ-ПРАВО» | НАРОДНЫЙ АУДИТ ЖКХ';
    comment = 'Согласно Правилам № 354 и ст. 161 ЖК РФ, управляющая компания обязана обеспечивать нормативные параметры услуг. За каждый час и градус отклонения житель вправе требовать перерасчет платы!';
    tags = '#ЖКХ #НародныйАудит #УправляющаяКомпания #ЗаливКвартиры #Самара #ЮгПраво';
  } else if (t.includes('коллектор') || t.includes('кредит') || t.includes('мфо') || t.includes('пристав') || t.includes('долг') || t.includes('фссп') || t.includes('банкрот')) {
    categoryTitle = 'ЗАЩИТА ЗАЕМЩИКОВ И ДОЛЖНИКОВ';
    categoryHeader = '🛑 АНО «ЦПЗ ЮГ-ПРАВО» | ЗАЩИТА ОТ КОЛЛЕКТОРОВ И МФО';
    comment = 'Федеральный закон № 230-ФЗ строго ограничивает звонки (не более 1 раза в сутки, 2 в неделю), а ст. 172.4 УК РФ предусматривает до 5 лет лишения свободы за угрозы и давление коллекторов.';
    tags = '#230ФЗ #Коллекторы #МФО #ФССП #ЗащитаПрав #Самара #ЮгПраво';
  } else if (t.includes('собак') || t.includes('кошк') || t.includes('животн') || t.includes('приют') || t.includes('отлов') || t.includes('стерилиз') || t.includes('лап')) {
    categoryTitle = 'ПРОЕКТ «ДОБРАЯ ЛАПА»';
    categoryHeader = '🐾 АНО «ЦПЗ ЮГ-ПРАВО» | ПРОЕКТ «ДОБРАЯ ЛАПА»';
    comment = 'В рамках Федерального закона № 498-ФЗ «Об ответственном обращении с животными» жестокое обращение и незаконное умерщвление влекут строгую юридическую ответственность по ст. 245 УК РФ.';
    tags = '#ДобраяЛапа #498ФЗ #ЗащитаЖивотных #Самара #АНОЮгПраво';
  } else if (t.includes('потребител') || t.includes('возврат') || t.includes('магазин') || t.includes('гаранти') || t.includes('маркетплейс') || t.includes('wildberries') || t.includes('ozon')) {
    categoryTitle = 'ЗАЩИТА ПРАВ ПОТРЕБИТЕЛЕЙ';
    categoryHeader = '🛒 АНО «ЦПЗ ЮГ-ПРАВО» | ЗАЩИТА ПРАВ ПОТРЕБИТЕЛЕЙ';
    comment = 'По закону «О защите прав потребителей» (ст. 18, 22) продавец обязан вернуть деньги за некачественный товар в течение 10 дней, а при отказе суд взыскивает 50% штрафа и неустойку 1% за каждый день просрочки!';
    tags = '#ЗоЗПП #ПраваПотребителей #ВозвратТовара #Маркетплейсы #Самара #ЮгПраво';
  } else if (t.includes('зарплат') || t.includes('увольнен') || t.includes('работодател') || t.includes('тк рф') || t.includes('трудов')) {
    categoryTitle = 'ТРУДОВЫЕ СПОРЫ И ПРАВА';
    categoryHeader = '💼 АНО «ЦПЗ ЮГ-ПРАВО» | ТРУДОВЫЕ ПРАВА';
    comment = 'Задержка выплаты заработной платы свыше 2 месяцев влечет уголовную ответственность работодателя по ст. 145.1 УК РФ, а работник имеет право на компенсацию по ст. 236 ТК РФ.';
    tags = '#ТрудовойКодекс #Зарплата #ЗащитаРаботников #ЮристСамара #ЮгПраво';
  }

  // Сборка готового брендированного поста
  if (mode === 'SHORT') {
    return `${categoryHeader}\n\n` +
      `⚡ <b>Коротко о главном:</b>\n${clean.slice(0, 500)}\n\n` +
      `💡 <b>Суть:</b> ${comment}\n\n` +
      `👥 <b>Канал:</b> @ano_ugpravo | 🤖 <b>Бот:</b> @ugpravo_assistant_bot\n\n` +
      `${tags}`;
  }

  return `${categoryHeader}\n\n` +
    `📌 <b>Суть новости / Разбор ситуации:</b>\n${clean.slice(0, 1100)}\n\n` +
    `⚖️ <b>Юридический комментарий АНО «ЮГ-ПРАВО»:</b>\n${comment}\n\n` +
    `📞 <b>Бесплатная правовая линия:</b> 8 (846) 989-07-68\n` +
    `🤖 <b>Бот правовой помощи:</b> @ugpravo_assistant_bot\n` +
    `🌐 <b>Портал гражданских инициатив:</b> <a href="${WEB_APP_URL}">yugpravo.ru</a>\n\n` +
    `${tags}`;
}

// Генератор готовых правовых материалов по шаблону
function generateTopicArticle(topicType) {
  switch (topicType) {
    case 'JKH':
      return `🏢 <b>АНО «ЦПЗ ЮГ-ПРАВО» | НАРОДНЫЙ АУДИТ ЖКХ</b>\n\n` +
        `<b>Как заставить УК сделать перерасчет за холодные батареи и некачественные услуги:</b>\n\n` +
        `1️⃣ <b>Норматив температуры:</b> По Постановлению Правительства РФ № 354 температура в жилых комнатах должна быть не менее +18 °C (+20 °C в угловых).\n` +
        `2️⃣ <b>Фиксация нарушения:</b> Оставьте заявку в аварийно-диспетчерскую службу УК. Запишите входящий номер, ФИО диспетчера и время звонка.\n` +
        `3️⃣ <b>Составление Акта:</b> Комиссия УК обязана явиться для замера не позднее 2 часов с момента обращения.\n` +
        `4️⃣ <b>Перерасчет:</b> За каждый час отклонения платы снижается на 0,15% вплоть до полного аннулирования счета за отопление!\n\n` +
        `💡 <i>Наш бот @ugpravo_help_bot составит официальную претензию в УК в формате Word (.docx) всего за 1 минуту!</i>\n\n` +
        `📞 <b>Телефон:</b> 8 (846) 989-07-68 | 🤖 <b>Бот:</b> @ugpravo_assistant_bot\n\n` +
        `#ЖКХ #Отопление #Перерасчет #УправляющаяКомпания #Самара #ЮгПраво`;

    case '230FZ':
      return `🛑 <b>АНО «ЦПЗ ЮГ-ПРАВО» | ЗАЩИТА ОТ КОЛЛЕКТОРОВ И МФО</b>\n\n` +
        `<b>Памятка заемщику: что категорически запрещено коллекторам по закону № 230-ФЗ:</b>\n\n` +
        `❌ <b>Лимиты на звонки:</b> не более 1 раза в сутки, 2 раз в неделю и 8 раз в месяц.\n` +
        `❌ <b>Запрет ночного беспокойства:</b> с 22:00 до 08:00 в будни и с 20:00 до 09:00 в выходные.\n` +
        `❌ <b>Звонки родственникам:</b> запрещены без нотариального или отдельного письменного согласия третьего лица.\n` +
        `❌ <b>Уголовная ответственность (ст. 172.4 УК РФ):</b> за угрозы здоровью, шантаж и порчу имущества коллекторам грозит до 5 лет лишения свободы!\n\n` +
        `⚖️ <i>Если вам или вашим близким поступают незаконные звонки — направьте жалобу в ФССП и АНО «ЮГ-ПРАВО».</i>\n\n` +
        `📞 <b>Правовая помощь должникам:</b> 8 (846) 989-07-68\n` +
        `🤖 <b>Telegram-помощник:</b> @ugpravo_assistant_bot\n\n` +
        `#230ФЗ #Коллекторы #МФО #ФССП #ЗащитаПрав #Самара`;

    case 'LAPA':
      return `🐾 <b>АНО «ЦПЗ ЮГ-ПРАВО» | ПРОЕКТ «ДОБРАЯ ЛАПА»</b>\n\n` +
        `<b>Правовые основы защиты животных в Самарской области:</b>\n\n` +
        `Согласно Федеральному закону № 498-ФЗ «Об ответственном обращении с животными»:\n\n` +
        `• <b>Программа ОСВВ:</b> Отлов, стерилизация, вакцинация и возврат в прежнюю среду обитания — обязательный гуманный стандарт.\n` +
        `• <b>Запрет жестокого обращения:</b> Самовольное умерщвление, отравление и оставление животных в опасности влекут уголовную ответственность по ст. 245 УК РФ (до 5 лет лишения свободы).\n` +
        `• <b>Общественный контроль:</b> Граждане и волонтеры имеют законное право проверять условия содержания животных в приютах и пунктах передержки.\n\n` +
        `❤️ <i>Проект «Добрая лапа» АНО «ЮГ-ПРАВО» оказывает юридическую поддержку приютам, волонтерам и кураторам животных.</i>\n\n` +
        `📞 <b>Телефон:</b> 8 (846) 989-07-68 | 🌐 <b>Сайт:</b> yugpravo.ru\n\n` +
        `#ДобраяЛапа #498ФЗ #ЗащитаЖивотных #Самара #АНОЮгПраво`;

    case 'COURT':
      return `⚖️ <b>АНО «ЦПЗ ЮГ-ПРАВО» | СУДЕБНАЯ ПРАКТИКА И ИСКИ</b>\n\n` +
        `<b>Как подготовить иск в суд без риска возврата заявления:</b>\n\n` +
        `1️⃣ <b>Обязательные реквизиты (ст. 131 ГПК РФ):</b> Наименование суда, полные данные истца с обязательным идентификатором (СНИЛС / ИНН / Паспорт), реквизиты ответчика.\n` +
        `2️⃣ <b>Досудебный порядок:</b> Приложите почтовую квитанцию с описью вложения об отправке претензии ответчику.\n` +
        `3️⃣ <b>Расчет госпошлины (ст. 333.19 НК РФ):</b> Проверьте льготы — иски по Закону о защите прав потребителей до 1 000 000 руб. госпошлиной не облагаются!\n` +
        `4️⃣ <b>Направление копий сторонам:</b> Истец обязан самостоятельно направить копию иска всем участникам процесса до подачи в суд.\n\n` +
        `💡 <i>Наш бесплатный юридический калькулятор и образцы исков доступны на портале yugpravo.ru!</i>\n\n` +
        `📞 <b>Консультация:</b> 8 (846) 989-07-68 | 🤖 @ugpravo_assistant_bot\n\n` +
        `#ГПКРФ #СудебнаяПрактика #ИсковоеЗаявление #ЮристСамара #ЮгПраво`;

    default:
      return transformIntoLegalPost(topicType);
  }
}

// Отправка черновика на утверждение администратору
async function sendDraftForApproval(chatId, postText, photoFileId = null) {
  const draftId = `draft_${Date.now()}`;
  pendingDrafts.set(draftId, {
    text: postText,
    photo: photoFileId,
    createdAt: Date.now()
  });

  const previewCaption = `📝 <b>ЧЕРНОВИК ПОСТА ДЛЯ ПУБЛИКАЦИИ:</b>\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `${postText}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👇 <b>Выберите действие для отправки в ${TARGET_CHANNEL}:</b>`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ Опубликовать в @ano_ugpravo", callback_data: `pub_${draftId}` }
      ],
      [
        { text: "⚡ Сделать короче (Дайджест)", callback_data: `short_${draftId}` },
        { text: "❌ Отклонить черновик", callback_data: `rej_${draftId}` }
      ]
    ]
  };

  if (photoFileId) {
    await sendPhotoMsg(chatId, photoFileId, previewCaption, keyboard);
  } else {
    await sendMsg(chatId, previewCaption, keyboard);
  }
}

// Настройка кнопок меню Telegram
async function setupNewsBotSettings() {
  try {
    await api('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: '📰 Инфо-Портал',
        web_app: { url: WEB_APP_URL }
      }
    });

    await api('setMyCommands', {
      commands: [
        { command: 'start', description: '📰 Главное меню генератора новостей' },
        { command: 'write', description: '✍️ Написать статью (/write Тема)' },
        { command: 'jkh', description: '🏢 Сгенерировать пост по ЖКХ' },
        { command: 'credit', description: '🛑 Сгенерировать пост по 230-ФЗ' },
        { command: 'lapa', description: '🐾 Сгенерировать пост «Добрая лапа»' },
        { command: 'court', description: '⚖️ Сгенерировать судебный пост' },
        { command: 'group', description: '👥 Открыть группу @ano_ugpravo' }
      ]
    });
    console.log('✅ Настройки News Bot успешно обновлены!');
  } catch (err) {
    console.warn('⚠️ Ошибка настройки News Bot:', err.message);
  }
}

// Обработка текстовых и медиа сообщений
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const caption = (msg.caption || '').trim();
  const rawInput = text || caption;

  // Извлечение фото, если прикреплено
  let photoFileId = null;
  if (msg.photo && msg.photo.length > 0) {
    photoFileId = msg.photo[msg.photo.length - 1].file_id;
  }

  // 1. Команда /start
  if (rawInput.startsWith('/start')) {
    const welcome = `📰 <b>Добро пожаловать в Бот-Копирайтер и Новостник АНО «ЮГ-ПРАВО»!</b>\n\n` +
      `Я умею готовить качественный правовой контент и публиковать его в группу <b>@ano_ugpravo</b> после вашего личного утверждения.\n\n` +
      `<b>⚡ Как работать с ботом:</b>\n` +
      `1️⃣ <b>Пересылка постов (Forward):</b> Перешлите мне любой пост или новость из другого канала (с фото или без) — я мгновенно выполню профессиональный юридический рерайт и оформлю карточку для публикации.\n` +
      `2️⃣ <b>Генерация статьи:</b> Напишите <code>/write Тема статьи</code> или нажмите кнопки тем ниже.\n` +
      `3️⃣ <b>Утверждение:</b> Я присылаю вам черновик. Вы нажимаете кнопку <b>«✅ Опубликовать»</b>, и пост сразу выходит в группу @ano_ugpravo!\n\n` +
      `👇 <i>Используйте кнопки для быстрого создания постов:</i>`;

    await sendMsg(chatId, welcome, getMainAdminKeyboard());
    return;
  }

  // 2. Быстрые кнопки рубрик
  if (text === "✍️ Написать новость ЖКХ" || text === '/jkh') {
    const post = generateTopicArticle('JKH');
    await sendDraftForApproval(chatId, post, photoFileId);
    return;
  }

  if (text === "🛡️ Пост: Защита от коллекторов (230-ФЗ)" || text === '/credit') {
    const post = generateTopicArticle('230FZ');
    await sendDraftForApproval(chatId, post, photoFileId);
    return;
  }

  if (text === "🐾 Пост: «Добрая лапа» (498-ФЗ)" || text === '/lapa') {
    const post = generateTopicArticle('LAPA');
    await sendDraftForApproval(chatId, post, photoFileId);
    return;
  }

  if (text === "⚖️ Пост: Судебная практика и иски" || text === '/court') {
    const post = generateTopicArticle('COURT');
    await sendDraftForApproval(chatId, post, photoFileId);
    return;
  }

  if (text === "🛒 Пост: Права потребителей (ЗоЗПП)") {
    const post = transformIntoLegalPost("Возврат некачественного товара, отказ продавца от гарантии и штраф 50% по ЗоЗПП в пользу потребителя");
    await sendDraftForApproval(chatId, post, photoFileId);
    return;
  }

  if (text === "💼 Пост: Трудовые споры и зарплата") {
    const post = transformIntoLegalPost("Задержка зарплаты работодателем, компенсация за каждый день задержки и проверка трудовой инспекции");
    await sendDraftForApproval(chatId, post, photoFileId);
    return;
  }

  if (text.includes('ano_ugpravo') || text === '/group') {
    await sendMsg(chatId, `👥 <b>Официальная группа АНО «ЮГ-ПРАВО»:</b>\n\n<a href="${TG_GROUP_URL}">${TG_GROUP_URL}</a>`, {
      inline_keyboard: [
        [{ text: "🚀 Открыть t.me/ano_ugpravo", url: TG_GROUP_URL }]
      ]
    });
    return;
  }

  // 3. Команда /write <тема>
  if (rawInput.startsWith('/write')) {
    const topic = rawInput.replace('/write', '').trim();
    if (!topic) {
      await sendMsg(chatId, "⚠️ <b>Укажите тему для статьи.</b>\nПример: <code>/write Залив квартиры из-за аварии стояка</code>");
      return;
    }

    await sendMsg(chatId, `🔍 <i>Генерирую авторский материал по теме: «${topic}»...</i>`);
    const post = transformIntoLegalPost(topic);
    await sendDraftForApproval(chatId, post, photoFileId);
    return;
  }

  // 4. Пересланное сообщение или входящий текст для рерайта
  if (rawInput.length > 20 || photoFileId) {
    await sendMsg(chatId, `⚙️ <i>Выполняю юридический рерайт, форматирование и подбор правовых норм...</i>`);
    const rewritten = transformIntoLegalPost(rawInput || "Актуальные правовые изменения в законодательстве РФ");
    await sendDraftForApproval(chatId, rewritten, photoFileId);
    return;
  }

  // По умолчанию
  await sendMsg(chatId, `ℹ️ Перешлите мне любой пост из другого канала или напишите <code>/write &lt;тема&gt;</code> для создания новости!`, getMainAdminKeyboard());
}

// Обработка инлайн-кнопок согласования
async function handleCallback(cb) {
  const chatId = cb.message.chat.id;
  const data = cb.data;

  await api('answerCallbackQuery', { callback_query_id: cb.id });

  // Публикация поста в группу
  if (data.startsWith('pub_')) {
    const draftId = data.replace('pub_', '');
    const draft = pendingDrafts.get(draftId);

    if (draft) {
      let publishRes;
      if (draft.photo) {
        publishRes = await sendPhotoMsg(TARGET_CHANNEL, draft.photo, draft.text);
      } else {
        publishRes = await api('sendMessage', {
          chat_id: TARGET_CHANNEL,
          text: draft.text,
          parse_mode: 'HTML'
        });
      }

      pendingDrafts.delete(draftId);

      if (publishRes.ok) {
        await sendMsg(chatId, `🎉 <b>ПОСТ УСПЕШНО ОПУБЛИКОВАН В ГРУППУ ${TARGET_CHANNEL}!</b>\n\n🔗 <a href="${TG_GROUP_URL}">Посмотреть в группе @ano_ugpravo</a>`, {
          inline_keyboard: [
            [{ text: "👀 Открыть публикацию в группе", url: TG_GROUP_URL }]
          ]
        });
      } else {
        // Если бот не является админом группы, присылаем админу с предупреждением
        await sendMsg(chatId, `⚠️ <b>Не удалось отправить напрямую в канал (бот должен быть администратором группы ${TARGET_CHANNEL}).</b>\n\n<i>Ответ Telegram: ${publishRes.error || publishRes.description || 'Forbidden'}</i>\n\nВот готовый текст для ручной вставки:`);
        await sendMsg(chatId, draft.text);
      }
    } else {
      await sendMsg(chatId, "⚠️ <i>Срок действия этого черновика истёк. Создайте новый.</i>");
    }
    return;
  }

  // Сделать короче
  if (data.startsWith('short_')) {
    const draftId = data.replace('short_', '');
    const draft = pendingDrafts.get(draftId);
    if (draft) {
      const shortenedText = transformIntoLegalPost(draft.text, 'SHORT');
      draft.text = shortenedText;
      await sendDraftForApproval(chatId, shortenedText, draft.photo);
    }
    return;
  }

  // Отклонить черновик
  if (data.startsWith('rej_')) {
    const draftId = data.replace('rej_', '');
    pendingDrafts.delete(draftId);
    await sendMsg(chatId, "❌ <b>Черновик отклонён и удалён.</b>");
    return;
  }
}

// Polling
let lastUpdateId = 0;
async function poll() {
  try {
    const res = await api('getUpdates', {
      offset: lastUpdateId + 1,
      timeout: 30
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
    console.error("News Bot polling error:", e.message);
  }
  setTimeout(poll, 300);
}

// Запуск
console.log("=========================================");
console.log("📰 АНО «ЮГ-ПРАВО» NEWS BOT & AI COPYWRITER ACTIVE!");
console.log(`👤 Admin Chat ID: ${ADMIN_ID}`);
console.log(`🎯 Target Channel: ${TARGET_CHANNEL}`);
console.log(`👥 Telegram Group: ${TG_GROUP_URL}`);
console.log("=========================================");

setupNewsBotSettings().then(() => {
  poll();
});
