/**
 * 🏢 АНО «ЦПЗ ЮГ-ПРАВО» — Бот правовой защиты ЖКХ и генератор претензий (@ugpravo_help_bot / @news_ugpravo_bot)
 * 
 * Возможности:
 * 1. 📝 Автоматическая генерация процессуальных претензий в УК (DOCX) по нормам ПП РФ № 354, 491, 290, СанПиН и ЗоЗПП.
 * 2. 📂 Скачивание чистых типовых бланков без сбора данных.
 * 3. ⚖️ Акцепт ПЭП по ст. 5, 9 63-ФЗ и официальные обращения АНО в порядке общественного контроля (ст. 45 ЗоЗПП, 27 7-ФЗ).
 * 4. 🏛️ Копии обращений в ГЖИ Самарской области и Прокуратуру.
 * 5. 💳 Кэшбэк на оплату ЖКХ и B2B-подписка для Советов МКД.
 * 6. 📱 Полная синхронизация с сайтом https://yugpravo.ru/ и группой https://t.me/ano_ugpravo.
 */

const https = require('https');
const path = require('path');
const fs = require('fs');
const docx = require('docx');
const { Document, Paragraph, TextRun, Packer, AlignmentType, HeadingLevel } = docx;

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

const BOT_TOKEN = envConfig.TELEGRAM_JKH_BOT_TOKEN || "8250749147:AAEuJv28K3oVd9hwUEv8KZomxFG8hPusSjc";
const ADMIN_ID = envConfig.ADMIN_CHAT_ID ? parseInt(envConfig.ADMIN_CHAT_ID, 10) : 306883501;
const WEB_APP_URL = envConfig.WEB_APP_URL || "https://yugpravo.ru/";
const TG_GROUP_URL = envConfig.TG_GROUP_URL || "https://t.me/ano_ugpravo";

const OFERTA_URL = "https://yugpravo.ru/doc-viewer.html?doc=donation-offer";
const POLICY_URL = "https://yugpravo.ru/doc-viewer.html?doc=politika";
const CPA_ZHKH_URL = "https://tinkoff.ru/baf/partner";

// База данных в JSON
const DB_FILE = path.join(__dirname, 'assistant_db.json');
function getDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ consents: [], appeals: [] }, null, 2), 'utf-8');
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    return { consents: [], appeals: [] };
  }
}

function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

// Правовые основания для категорий ЖКХ
const LEGAL_BASES = {
  HEAT: {
    name: "Холодные батареи / отопление",
    title: "ПРЕТЕНЗИЯ\nо нарушении нормативов предоставления коммунальной услуги по отоплению и проведении перерасчета платы",
    norm: "В соответствии с Приложением № 1 к Правилам предоставления коммунальных услуг (утв. Постановлением Правительства РФ № 354), температура воздуха в жилых помещениях должна быть не ниже +18 °C (в угловых комнатах — не ниже +20 °C). Допустимая продолжительность перерыва отопления: не более 24 часов суммарно в течение 1 месяца. За каждый градус и час отклонения размер платы снижается на 0,15% вплоть до полного освобождения от оплаты.",
    req: "1. Незамедлительно направить комиссию для проведения замера температуры воздуха в жилом помещении с составлением Акта проверки.\n2. Восстановить подачу теплоносителя надлежащих параметров.\n3. Произвести перерасчет размера платы за отопление за весь период предоставления услуги ненадлежащего качества."
  },
  WATER: {
    name: "Горячее / холодное водоснабжение",
    title: "ПРЕТЕНЗИЯ\nо ненадлежащем качестве водоснабжения и проведении перерасчета платы",
    norm: "Согласно СанПиН 1.2.3685-21 и Правилам предоставления коммунальных услуг (утв. ПП РФ № 354), температура горячей воды в точке водоразбора должна составлять строго от +60 °C до +75 °C независимо от применяемой системы теплоснабжения. Отклонение давления и подача ржавой или мутной воды не допускается.",
    req: "1. Обеспечить подачу воды нормативной температуры и санитарного качества.\n2. Составить акт непредоставления коммунальной услуги надлежащего качества.\n3. Снизить размер платы вплоть до полного освобождения от оплаты за период нарушения."
  },
  LEAK: {
    name: "Протечка кровли / стояка / залив",
    title: "ПРЕТЕНЗИЯ\nоб устранении причин протечки, составлении акта о заливе квартиры и возмещении ущерба",
    norm: "Согласно ст. 161, 162 ЖК РФ и Правилам содержания общего имущества (утв. ПП РФ № 491), управляющая организация несет полную ответственность за надлежащее содержание общего имущества (включая кровлю, межэтажные перекрытия и общедомовые стояки). Согласно Постановлению Госстроя РФ № 170, протечки кровли должны устраняться в течение 1 суток с момента обращения.",
    req: "1. Незамедлительно направить комиссию для осмотра квартиры и составить Акт о заливе с фиксацией объемов повреждений и точной причины залива.\n2. В течение 24 часов устранить причину протечки в общедомовом имуществе.\n3. Возместить причиненный материальный ущерб в добровольном досудебном порядке."
  },
  CLEAN: {
    name: "Санитарное состояние подъезда и двора",
    title: "ЗАЯВЛЕНИЕ-ПРЕТЕНЗИЯ\nо ненадлежащем санитарном содержании мест общего пользования и придомовой территории",
    norm: "Согласно Минимальному перечню услуг и работ, необходимых для обеспечения надлежащего содержания общего имущества в МКД (утв. ПП РФ № 290), управляющая компания обязана обеспечивать регулярное сухое и влажное подметание, мытье лестничных площадок и маршей, а также санитарную уборку придомовой территории.",
    req: "1. Провести внеплановую влажную уборку и санитарную обработку подъезда и входных групп.\n2. Обеспечить строгое соблюдение периодичности графиков уборки.\n3. В случае систематического бездействия копия настоящего заявления направляется в Государственную жилищную инспекцию Самарской области."
  }
};

// Сессии пользователей (пошаговый ввод)
const userSessions = new Map();

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

// Отправка сгенерированного DOCX файла в чат Telegram
async function sendDocxFile(chatId, buffer, filename, caption = '') {
  return new Promise((resolve) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

    const parts = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="parse_mode"\r\n\r\nHTML\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${filename}"\r\nContent-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document\r\n\r\n`),
      buffer,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ];

    const body = Buffer.concat(parts);

    const req = https.request(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(d));
        } catch (e) {
          resolve({ ok: false, error: e.message });
        }
      });
    });

    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    req.write(body);
    req.end();
  });
}

// Генератор претензии жителя в DOCX формате
async function generateResidentDocx(categoryKey, fio, address, phone, details, ukName = "ООО «УК «Юг-Сервис»") {
  const info = LEGAL_BASES[categoryKey] || LEGAL_BASES.HEAT;
  const currentYear = new Date().getFullYear();

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1134,    // ~20 мм
            bottom: 1134, // ~20 мм
            left: 1701,   // ~30 мм
            right: 850    // ~15 мм
          }
        }
      },
      children: [
        // Шапка справа
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: `Руководителю ${ukName}\n`, bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: `Адрес: Самарская область, г. Самара\n\n`, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: `От: ${fio}\n`, bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: `Проживающего по адресу:\n${address}\n`, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: `Телефон: ${phone}\n\n`, font: 'Times New Roman', size: 22 })
          ]
        }),

        // Заголовок по центру
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
          children: [
            new TextRun({ text: info.title, bold: true, font: 'Times New Roman', size: 24 })
          ]
        }),

        // Описательная часть
        new Paragraph({
          alignment: AlignmentType.JUSTIFY,
          indent: { firstLine: 708 },
          spacing: { line: 276, before: 100, after: 100 },
          children: [
            new TextRun({
              text: `Я являюсь собственником (нанимателем) жилого помещения, расположенного по адресу: ${address}. Управление нашим многоквартирным домом осуществляет Ваша организация (${ukName}). Я своевременно и в полном объеме произвожу оплату жилищно-коммунальных услуг.\n\n` +
                `Сообщаю, что в настоящее время имеет место грубое нарушение моих прав как потребителя: ${details}.\n\n` +
                `${info.norm}\n\n` +
                `На основании ст. 161, 162 Жилищного кодекса РФ, ст. 4, 14, 29 Закона РФ «О защите прав потребителей», Правил предоставления коммунальных услуг № 354,`,
              font: 'Times New Roman',
              size: 24
            })
          ]
        }),

        // Требования
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 150, after: 100 },
          children: [
            new TextRun({ text: `ТРЕБУЮ:\n`, bold: true, font: 'Times New Roman', size: 24 }),
            new TextRun({ text: `${info.req}\n\n`, font: 'Times New Roman', size: 24 }),
            new TextRun({
              text: `О результатах рассмотрения настоящей претензии и принятых мерах прошу уведомить меня письменно в установленный законом 10-дневный срок по телефону ${phone} или указанному почтовому адресу.`,
              font: 'Times New Roman',
              size: 24
            })
          ]
        }),

        // Дата и подпись
        new Paragraph({
          spacing: { before: 400 },
          children: [
            new TextRun({
              text: `Дата: «___» _________ ${currentYear} г.                     Подпись: _______________ / ${fio} /`,
              font: 'Times New Roman',
              size: 22
            })
          ]
        })
      ]
    }]
  });

  return await Packer.toBuffer(doc);
}

// Главная клавиатура бота ЖКХ
function getJkhReplyKeyboard() {
  return {
    keyboard: [
      [
        { text: "📝 Составить претензию в УК (Авто-документ)" },
        { text: "📂 Скачать чистые образцы (Без данных)" }
      ],
      [
        { text: "⚖️ Передать проблему на контроль ЮГ-ПРАВО" },
        { text: "💳 Кэшбэк на оплату ЖКХ до 5%" }
      ],
      [
        { text: "🏠 Подписка на защиту дома (Совету МКД)" },
        { text: "ℹ️ О центре ЮГ-ПРАВО и реквизиты" }
      ],
      [
        { text: "📱 Портал ЮГ-ПРАВО (Mini App)", web_app: { url: WEB_APP_URL } },
        { text: "👥 Группа @ano_ugpravo" }
      ]
    ],
    resize_keyboard: true,
    is_persistent: true
  };
}

// Инлайн-клавиатура категорий ЖКХ
function getJkhCategoriesKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "❄️ Холод в квартире / батареи", callback_data: "cat_HEAT" }],
      [{ text: "🚿 Нет горячей воды / ржавая вода", callback_data: "cat_WATER" }],
      [{ text: "🌧️ Протечка кровли / стояка / залив", callback_data: "cat_LEAK" }],
      [{ text: "🧹 Грязь в подъезде / дворе", callback_data: "cat_CLEAN" }],
      [{ text: "« Назад в главное меню", callback_data: "main_menu" }]
    ]
  };
}

// Настройка кнопок меню Telegram
async function setupJkhBotSettings() {
  try {
    await api('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: '🏢 Аудит ЖКХ',
        web_app: { url: `${WEB_APP_URL}initiatives.html` }
      }
    });

    await api('setMyCommands', {
      commands: [
        { command: 'start', description: '🏢 Главное меню правового помощника ЖКХ' },
        { command: 'claim', description: '📝 Создать готовую претензию в УК (DOCX)' },
        { command: 'samples', description: '📂 Скачать чистые бланки заявлений' },
        { command: 'audit', description: '⚖️ Передать проблему на контроль АНО' },
        { command: 'group', description: '👥 Официальная группа (t.me/ano_ugpravo)' },
        { command: 'app', description: '📱 Открыть интерактивный сервис (Mini App)' }
      ]
    });
    console.log('✅ Настройки JKH Bot успешно обновлены!');
  } catch (err) {
    console.warn('⚠️ Ошибка настройки JKH Bot MenuButton:', err.message);
  }
}

// Обработка текстовых сообщений
async function handleMessage(msg) {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const firstName = msg.from.first_name || 'Гражданин';
  const username = msg.from.username ? `@${msg.from.username}` : 'нет юзернейма';

  // 1. Приём контакта через кнопку
  if (msg.contact && userSessions.has(chatId)) {
    const session = userSessions.get(chatId);
    session.phone = msg.contact.phone_number;
    session.step = 'WAIT_DETAILS';
    await sendMsg(chatId, `✅ Номер <b>${session.phone}</b> зафиксирован!\n\n📝 <b>Шаг 4 из 4:</b> В 1–2 предложениях опишите суть проблемы и даты (например: <i>С 15 января в угловой комнате температура +14°C, стояк еле теплый, заявки в диспетчерскую №1234 игнорируются</i>):`, {
      remove_keyboard: true
    });
    return;
  }

  // 2. Пошаговый ввод данных для генератора
  if (userSessions.has(chatId)) {
    const session = userSessions.get(chatId);

    if (session.step === 'WAIT_FIO') {
      session.fio = text;
      session.step = 'WAIT_ADDRESS';
      await sendMsg(chatId, `🏠 <b>Шаг 2 из 4:</b> Введите <b>адрес дома и номер квартиры</b> (например: <i>г. Самара, ул. Победы, д. 14, кв. 35</i>):`);
      return;
    }

    if (session.step === 'WAIT_ADDRESS') {
      session.address = text;
      session.step = 'WAIT_PHONE';
      await sendMsg(chatId, `📱 <b>Шаг 3 из 4:</b> Введите ваш <b>контактный номер телефона</b> для указания в претензии:`, {
        keyboard: [
          [{ text: "📱 Отправить мой номер телефона", request_contact: true }],
          [{ text: "❌ Отменить" }]
        ],
        resize_keyboard: true,
        one_time_keyboard: true
      });
      return;
    }

    if (session.step === 'WAIT_PHONE') {
      if (text === '❌ Отменить') {
        userSessions.delete(chatId);
        await sendMsg(chatId, "Составление претензии отменено.", getJkhReplyKeyboard());
        return;
      }
      session.phone = text;
      session.step = 'WAIT_DETAILS';
      await sendMsg(chatId, `📝 <b>Шаг 4 из 4:</b> В 1–2 предложениях опишите суть проблемы и даты (например: <i>«С 15 января в угловой комнате температура +14°C, стояк еле теплый, заявки в диспетчерскую №1234 игнорируются»</i>):`, {
        remove_keyboard: true
      });
      return;
    }

    if (session.step === 'WAIT_DETAILS') {
      session.details = text;
      userSessions.delete(chatId);

      // Сохраняем обращение в базу
      const db = getDb();
      const appealId = db.appeals.length + 1;
      const appealEntry = {
        id: appealId,
        user_id: chatId,
        username: username,
        category: session.category,
        fio: session.fio,
        address: session.address,
        phone: session.phone,
        details: session.details,
        date: new Date().toISOString()
      };
      db.appeals.push(appealEntry);
      saveDb(db);

      await sendMsg(chatId, `⏳ <b>Формируем процессуальный документ в формате Microsoft Word (.docx)...</b>`);

      // Генерируем DOCX
      try {
        const docxBuffer = await generateResidentDocx(
          session.category,
          session.fio,
          session.address,
          session.phone,
          session.details
        );

        const filename = `Pretenziya_UK_Samara_App_${appealId}.docx`;
        const caption = `✅ <b>Ваша официальная претензия № ${appealId} сформирована!</b>\n\n` +
          `📄 <b>Что делать дальше:</b>\n` +
          `1. Распечатайте документ в 2-х экземплярах;\n` +
          `2. Один передайте в офис вашей УК (на втором требуйте поставить отметку о принятии с входящим номером и датой);\n` +
          `3. Либо прикрепите файл в электронном виде через <b>ГИС ЖКХ</b> или <b>Госуслуги.Дом</b> (подписав через «Госключ»).\n\n` +
          `⏰ <i>Срок ответа УК по закону — 10 рабочих дней. Если УК проигнорирует требование, АНО «ЮГ-ПРАВО» направит жалобу в ГЖИ и иск в суд.</i>`;

        await sendDocxFile(chatId, docxBuffer, filename, caption);

        // Уведомление администратору
        const adminCard = `🏢 <b>НОВАЯ ПРЕТЕНЗИЯ В УК СФОРМИРОВАНА!</b>\n\n` +
          `🆔 <b>Номер:</b> № ${appealId}\n` +
          `📂 <b>Категория:</b> ${LEGAL_BASES[session.category]?.name || session.category}\n` +
          `👤 <b>Заявитель:</b> ${session.fio}\n` +
          `🏠 <b>Адрес:</b> ${session.address}\n` +
          `📞 <b>Телефон:</b> <code>${session.phone}</code>\n` +
          `💬 <b>Telegram:</b> ${username} (ID: <code>${chatId}</code>)\n` +
          `📝 <b>Суть:</b> ${session.details}\n\n` +
          `⏰ <i>${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Samara' })}</i>`;

        await sendMsg(ADMIN_ID, adminCard, {
          inline_keyboard: [
            [{ text: "📞 Позвонить", url: `tel:${session.phone.replace(/[^0-9+]/g, '')}` }],
            [{ text: "✍️ Ответить в Telegram", url: `tg://user?id=${chatId}` }]
          ]
        });

      } catch (err) {
        console.error('Docx generation error:', err);
        await sendMsg(chatId, `❌ Произошла ошибка при генерации документа. Пожалуйста, обратитесь к нашему юристу: @aikon163`, getJkhReplyKeyboard());
      }

      await sendMsg(chatId, `👇 Главное меню:`, getJkhReplyKeyboard());
      return;
    }
  }

  // 3. Команды из меню
  if (text === "📝 Составить претензию в УК (Авто-документ)" || text === '/claim') {
    const kb = {
      inline_keyboard: [
        [
          { text: "📄 Публичная оферта", url: OFERTA_URL },
          { text: "🔒 Политика ПД", url: POLICY_URL }
        ],
        [
          { text: "✅ Принять условия (ПЭП) и начать", callback_data: "pep_agree" }
        ],
        [
          { text: "« Назад в меню", callback_data: "main_menu" }
        ]
      ]
    };

    const textPEP = `⚖️ <b>Правовое уведомление и согласие</b>\n\n` +
      `Генератор создаст готовый юридический документ на основе введенных вами данных.\n\n` +
      `Нажимая кнопку <b>«Принять условия»</b>, вы:\n` +
      `• Ознакомлены с <a href="${OFERTA_URL}">Публичной офертой</a> и <a href="${POLICY_URL}">Политикой ПД</a>;\n` +
      `• Даете согласие на обработку контактных данных (ФИО, адрес, телефон);\n` +
      `• Признаете это действие своей <b>простой электронной подписью (ПЭП)</b> в соответствии со ст. 5, 9 Федерального закона № 63-ФЗ.`;

    await sendMsg(chatId, textPEP, kb);
    return;
  }

  if (text === "📂 Скачать чистые образцы (Без данных)" || text === '/samples') {
    const textSamples = `📂 <b>Справочный центр жителя (Без сбора данных)</b>\n\n` +
      `Вы можете скачать чистые бланки и направить их самостоятельно:\n\n` +
      `⏱ <b>Сроки реагирования УК по закону:</b>\n` +
      `• Аварии и протечки — от 30 минут до 24 часов (ПП РФ № 416, 170);\n` +
      `• Претензии о перерасчете платы — 10 рабочих дней (Закон о ЗПП);\n` +
      `• Официальные обращения — 30 календарных дней (59-ФЗ).\n\n` +
      `📲 <b>Как отправить в 1 клик с телефона:</b>\n` +
      `1. Воспользуйтесь мобильным приложением <b>«Госуслуги.Дом»</b> или сайтом <b>ГИС ЖКХ</b>.\n` +
      `2. Для подписания заявления используйте бесплатное приложение <b>«Госключ»</b>.`;

    try {
      const cleanDocBuffer = await generateResidentDocx(
        "HEAT",
        "____________________",
        "г. Самара, ул. ______________, д. __, кв. __",
        "+7 (___) ___-__-__",
        "указать конкретные факты нарушения (даты, замеры температуры воздуха)"
      );

      await sendDocxFile(chatId, cleanDocBuffer, "Chistyy_blank_pretenzii_UK.docx", textSamples);
    } catch (e) {
      await sendMsg(chatId, textSamples, getJkhReplyKeyboard());
    }
    return;
  }

  if (text === "⚖️ Передать проблему на контроль ЮГ-ПРАВО" || text === '/audit') {
    const textAudit = `🏛 <b>Общественный контроль АНО «ЮГ-ПРАВО»</b>\n\n` +
      `Если управляющая компания игнорирует ваши обращения, наша организация вправе направить <b>Официальный запрос от СО НКО</b> с привлечением надзорных органов.\n\n` +
      `<b>Как это работает:</b>\n` +
      `1. Вы заполняете данные о нарушении;\n` +
      `2. Бот формирует официальное обращение в защиту ваших прав;\n` +
      `3. Материалы поступают юристам центра для направления в УК и ГЖИ Самарской области.\n\n` +
      `<i>Помощь оказывается бесплатно в рамках уставной правозащитной деятельности.</i>`;

    await sendMsg(chatId, textAudit, {
      inline_keyboard: [
        [{ text: "🚀 Передать обращение юристам АНО", callback_data: "pep_agree" }],
        [{ text: "« Назад в меню", callback_data: "main_menu" }]
      ]
    });
    return;
  }

  if (text === "💳 Кэшбэк на оплату ЖКХ до 5%") {
    const textCpa = `💰 <b>Экономьте на оплате коммунальных услуг</b>\n\n` +
      `Партнерские дебетовые карты позволяют возвращать до 5% кэшбэка при оплате квитанций за свет, воду, газ и содержание жилья без комиссии.\n\n` +
      `• Бесплатное обслуживание навсегда;\n` +
      `• Оплата любых квитанций по QR-коду без очередей.`;

    await sendMsg(chatId, textCpa, {
      inline_keyboard: [
        [{ text: "💳 Оформить карту с кэшбэком ЖКХ", url: CPA_ZHKH_URL }],
        [{ text: "« Назад в меню", callback_data: "main_menu" }]
      ]
    });
    return;
  }

  if (text === "🏠 Подписка на защиту дома (Совету МКД)") {
    const textMkd = `🏢 <b>Юридическое сопровождение домов, ТСЖ и Советов МКД</b>\n\n` +
      `АНО «ЮГ-ПРАВО» предлагает председателям Советов МКД и инициативным группам жителей комплексную правовую защиту дома:\n\n` +
      `• <b>Аудит отчетов УК:</b> проверка смет, актов выполненных работ и выявление приписанных услуг;\n` +
      `• <b>Помощь в смене УК</b> или создании ТСЖ (полное ведение общих собраний собственников под ключ);\n` +
      `• <b>Взыскание ущерба с УК:</b> за заливы подвалов, текущие крыши и разбитые дороги во дворе.\n\n` +
      `📞 <i>Для консультации свяжитесь с координатором: <a href="https://t.me/aikon163">@aikon163</a></i>`;

    await sendMsg(chatId, textMkd, {
      inline_keyboard: [
        [{ text: "💬 Написать координатору", url: "https://t.me/aikon163" }],
        [{ text: "« Назад в меню", callback_data: "main_menu" }]
      ]
    });
    return;
  }

  if (text === "ℹ️ О центре ЮГ-ПРАВО и реквизиты") {
    const textAbout = `ℹ️ <b>Об Организации</b>\n\n` +
      `<b>АНО «Центр правовой защиты и развития гражданских инициатив ЮГ-ПРАВО»</b>\n` +
      `• Руководитель: Директор Шарыпаев Павел Валерьевич\n` +
      `• Территория деятельности: Самарская область / РФ\n` +
      `• Официальный канал новостей: <a href="${TG_GROUP_URL}">@ano_ugpravo</a>\n` +
      `• ОГРН: 1266300015080 | ИНН: 6317174776\n` +
      `• Телефон: <b>8 (846) 989-07-68</b>\n\n` +
      `Мы содействуем повышению правовой грамотности, защите прав потребителей и общественному контролю в сфере ЖКХ.`;

    await sendMsg(chatId, textAbout, {
      inline_keyboard: [
        [{ text: "👥 Открыть группу @ano_ugpravo", url: TG_GROUP_URL }],
        [{ text: "🌐 Наш сайт yugpravo.ru", web_app: { url: WEB_APP_URL } }]
      ]
    });
    return;
  }

  if (text.includes('Группа') || text.includes('ano_ugpravo') || text === '/group') {
    await sendMsg(chatId, `👥 <b>Официальная группа АНО «ЮГ-ПРАВО» в Telegram:</b>\n\nЗдесь публикуются разборы споров с УК, отчеты проверок и образцы документов.\n\n🔗 <a href="${TG_GROUP_URL}">t.me/ano_ugpravo</a>`, {
      inline_keyboard: [
        [{ text: "🚀 Перейти в группу t.me/ano_ugpravo", url: TG_GROUP_URL }]
      ]
    });
    return;
  }

  // /start
  if (text.startsWith('/start') || text.startsWith('/help')) {
    const welcome = `👋 <b>Добро пожаловать в правовой помощник АНО «ЮГ-ПРАВО»!</b>\n\n` +
      `Здравствуйте, <b>${firstName}</b>!\n\n` +
      `Мы — социально ориентированная некоммерческая организация (г. Самара). Помогаем жителям законно требовать перерасчеты за холодные батареи, бороться с протечками и добиваться порядка от управляющих компаний.\n\n` +
      `👇 <i>Выберите нужное действие в меню ниже:</i>`;

    await sendMsg(chatId, welcome, getJkhReplyKeyboard());
    return;
  }

  // Ответ по умолчанию
  await sendMsg(chatId, `👋 Здравствуйте, <b>${firstName}</b>! Воспользуйтесь кнопками меню для составления претензии или консультации:`, getJkhReplyKeyboard());
}

// Обработка инлайн-кнопок
async function handleCallback(cb) {
  const chatId = cb.message.chat.id;
  const data = cb.data;

  await api('answerCallbackQuery', { callback_query_id: cb.id });

  if (data === 'main_menu') {
    await sendMsg(chatId, "👇 <b>Главное меню правовой помощи ЖКХ:</b>", getJkhReplyKeyboard());
    return;
  }

  if (data === 'pep_agree') {
    // Сохраняем согласие
    const db = getDb();
    if (!db.consents.some(c => c.user_id === chatId)) {
      db.consents.push({
        user_id: chatId,
        username: cb.from.username || '',
        name: cb.from.first_name || '',
        date: new Date().toISOString()
      });
      saveDb(db);
    }

    await sendMsg(chatId, `✅ <b>Согласие принято (ПЭП зарегистрирована).</b>\n\nВыберите категорию проблемы, с которой вы столкнулись:`, getJkhCategoriesKeyboard());
    return;
  }

  if (data.startsWith('cat_')) {
    const cat = data.replace('cat_', '');
    userSessions.set(chatId, { step: 'WAIT_FIO', category: cat });
    await sendMsg(chatId, `👤 <b>Шаг 1 из 4:</b> Введите ваше <b>ФИО полностью</b> (собственника или нанимателя жилого помещения):`);
    return;
  }
}

// Polling
let lastUpdateId = 0;
async function poll() {
  try {
    const res = await api('getUpdates', {
      offset: lastUpdateId + 1,
      timeout: 25
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
    console.error("JKH Bot polling error:", e.message);
  }
  setTimeout(poll, 300);
}

// Запуск
console.log("=========================================");
console.log("🏢 АНО «ЮГ-ПРАВО» JKH & CLAIM BOT 2.0 IS RUNNING!");
console.log(`👤 Admin Chat ID: ${ADMIN_ID}`);
console.log(`🌐 Web App URL: ${WEB_APP_URL}`);
console.log(`👥 Telegram Group: ${TG_GROUP_URL}`);
console.log("=========================================");

setupJkhBotSettings().then(() => {
  poll();
});
