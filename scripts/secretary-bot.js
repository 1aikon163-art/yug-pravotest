/**
 * 🤖 ЮГ-ПРАВО LegalTech — Умный Бот-Секретарь Канцелярии (IMAP + AI Classifier + Yandex Disk + Telegram)
 * 
 * Мониторит почтовые ящики, классифицирует ведомства, выгружает вложения на Яндекс Диск,
 * ведет структурированный Excel-журнал и отправляет оперативные уведомления в Telegram.
 */

const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');
const https = require('https');
const fs = require('fs');
const path = require('path');

const classifier = require('./legal-classifier.js');
const registry = require('./registry-manager.js');

function getEnvConfig() {
  const config = {
    yandexToken: process.env.YANDEX_OAUTH_TOKEN || '',
    yandexUser: process.env.SMTP_USER || 'info@yugpravo.ru',
    yandexPass: process.env.SMTP_PASS || '',
    gmailUser: process.env.GMAIL_USER || '1aikon163@gmail.com',
    gmailPass: process.env.GMAIL_APP_PASS || '',
    botToken: process.env.TELEGRAM_MAIN_BOT_TOKEN || '8105779375:AAFI2u284r6l9q2uH5x17xVbU0HjW4V_k_k',
    adminChatId: parseInt(process.env.ADMIN_CHAT_ID, 10) || 605809187
  };

  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const l of lines) {
        const t = l.trim();
        if (t.startsWith('YANDEX_OAUTH_TOKEN=')) config.yandexToken = t.split('=')[1].trim().replace(/^["']|["']$/g, '');
        if (t.startsWith('SMTP_USER=')) config.yandexUser = t.split('=')[1].trim().replace(/^["']|["']$/g, '');
        if (t.startsWith('SMTP_PASS=')) config.yandexPass = t.split('=')[1].trim().replace(/^["']|["']$/g, '');
        if (t.startsWith('GMAIL_USER=')) config.gmailUser = t.split('=')[1].trim().replace(/^["']|["']$/g, '');
        if (t.startsWith('GMAIL_APP_PASS=')) config.gmailPass = t.split('=')[1].trim().replace(/^["']|["']$/g, '');
        if (t.startsWith('TELEGRAM_MAIN_BOT_TOKEN=')) config.botToken = t.split('=')[1].trim().replace(/^["']|["']$/g, '');
        if (t.startsWith('ADMIN_CHAT_ID=')) config.adminChatId = parseInt(t.split('=')[1].trim(), 10);
      }
    }
  } catch (_) {}

  return config;
}

const config = getEnvConfig();

// Рекурсивное создание папки на Яндекс Диске при необходимости
async function ensureRemoteFolderExists(folderPath) {
  const parts = folderPath.split('/').filter(Boolean);
  let cur = '';
  for (const part of parts) {
    cur += '/' + part;
    await new Promise((resolve) => {
      const req = https.request({
        hostname: 'cloud-api.yandex.net',
        path: `/v1/disk/resources?path=${encodeURIComponent(cur)}`,
        method: 'PUT',
        headers: { 'Authorization': `OAuth ${config.yandexToken}` }
      }, (res) => resolve());
      req.on('error', () => resolve());
      req.end();
    });
  }
}

// Загрузка файла на Яндекс Диск
async function uploadFileToYandexDisk(buffer, remotePath) {
  const dirName = path.posix.dirname(remotePath);
  await ensureRemoteFolderExists(dirName);

  return new Promise((resolve) => {
    const getUrl = `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(remotePath)}&overwrite=true`;
    const req = https.get(getUrl, {
      headers: { 'Authorization': `OAuth ${config.yandexToken}` }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (!json.href) {
            return resolve({ success: false, error: json.message || 'No href' });
          }

          const uploadReq = https.request(json.href, {
            method: 'PUT',
            headers: {
              'Content-Length': buffer.length
            }
          }, (upRes) => {
            if (upRes.statusCode >= 200 && upRes.statusCode < 300) {
              resolve({ success: true });
            } else {
              resolve({ success: false, status: upRes.statusCode });
            }
          });

          uploadReq.on('error', (e) => resolve({ success: false, error: e.message }));
          uploadReq.write(buffer);
          uploadReq.end();
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      });
    });
    req.on('error', (e) => resolve({ success: false, error: e.message }));
  });
}

// Отправка Telegram карточки секретарю
async function sendTelegramNotification(entry) {
  if (!config.botToken || !config.adminChatId) return;

  const textLines = [
    '📬 *[КАНЦЕЛЯРИЯ ЮГ-ПРАВО]* Входящий процессуальный документ',
    '',
    `🏛 *Ведомство:* ${entry.department}`,
    entry.relatedCase ? `🔗 *Связанное дело / Производство:* \`${entry.relatedCase}\`` : null,
    `👤 *От:* \`${entry.from}\``,
    `📜 *Тема:* ${entry.subject}`,
    `🆔 *Вх. номер АНО:* \`${entry.inNumber}\``,
    entry.outNumber && entry.outNumber !== 'Б/Н' ? `📋 *Исх. номер ведомства:* \`${entry.outNumber}\`` : null,
    '',
    `📝 *Суть:* _${entry.summary}_`,
    '',
    entry.hasDeadline
      ? `⏰ *Дедлайн / Срок ответа:* 🔴 *${entry.deadline}* (${entry.deadlineReason})`
      : `⏰ *Срок:* 🟢 ${entry.deadline}`,
    '',
    entry.attachments && entry.attachments.length > 0
      ? `📎 *Вложения (${entry.attachments.length}):* \`${entry.attachments.join(', ')}\`\n💾 _Сохранено на Яндекс Диск в папку:_\n\`${entry.folderPath}\``
      : '📄 _Без отдельных файлов вложений_',
    '',
    '📊 _Запись внесена в ЖУРНАЛ_КАНЦЕЛЯРИИ_2026.xlsx_'
  ].filter(Boolean).join('\n');

  return new Promise((resolve) => {
    const postData = JSON.stringify({
      chat_id: config.adminChatId,
      text: textLines,
      parse_mode: 'Markdown'
    });

    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${config.botToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      resolve();
    });

    req.on('error', () => resolve());
    req.write(postData);
    req.end();
  });
}

/**
 * Обработать одно письмо
 */
async function processEmailMessage(parsedMessage, accountName = 'info@yugpravo.ru') {
  const fromText = parsedMessage.from?.text || parsedMessage.from?.value?.[0]?.address || 'Неизвестный отправитель';
  const subject = parsedMessage.subject || 'Без темы';
  const textBody = parsedMessage.text || '';
  const date = parsedMessage.date || new Date();

  // 1. Фильтр служебных роботов
  const fromLower = fromText.toLowerCase();
  if (fromLower.includes('mailer-daemon') || fromLower.includes('postmaster') || fromLower.includes('noreply') || subject.toLowerCase().includes('недоставленное сообщение')) {
    console.log(`  ⏩ Служебное/техническое уведомление пропущено: [${fromText}]`);
    return;
  }

  // 2. Интеллектуальный фильтр маркетинговых рассылок и рекламы
  if (classifier.isMarketingOrPromo(fromText, subject, textBody)) {
    console.log(`  ⏩ Рекламное / промо-письмо отсеяно: "${subject}" [${fromText}]`);
    return;
  }

  console.log(`\n📨 Анализируем юридический документ: "${subject}" от [${fromText}]...`);

  // 3. Умная классификация ведомства и сквозное связывание дел
  const classification = classifier.classify({
    from: fromText,
    subject: subject,
    text: textBody
  });

  const caseIds = classifier.extractCaseIdentifiers(textBody, subject);
  const relatedParts = [];
  if (caseIds.anoCase) relatedParts.push(`Обращение ${caseIds.anoCase}`);
  if (caseIds.courtCase) relatedParts.push(`Судебное дело ${caseIds.courtCase}`);
  if (caseIds.fsspCase) relatedParts.push(`ИП ${caseIds.fsspCase}`);
  if (caseIds.fasCase) relatedParts.push(`Дело ФАС ${caseIds.fasCase}`);
  if (caseIds.kuspNumber) relatedParts.push(caseIds.kuspNumber);
  const relatedCaseStr = relatedParts.join(' | ') || (caseIds.generalDocNum ? `Док. № ${caseIds.generalDocNum}` : 'Прямое обращение');

  const outDocNumber = caseIds.generalDocNum || classifier.extractDocNumber(textBody, subject);
  const deadlineInfo = classifier.extractDeadline(textBody, date, classification.department);
  const summary = classifier.summarizeContext(textBody, subject);

  console.log(`  🏛 Ведомство: ${classification.department} (Папка: ${classification.folder})`);
  console.log(`  🔗 Связанное дело: ${relatedCaseStr}`);
  console.log(`  🆔 Исх. №: ${outDocNumber} | Срок: ${deadlineInfo.deadlineDate}`);

  // 4. Выгрузка вложений на Яндекс Диск
  const savedAttachmentNames = [];
  const targetFolder = `/_БАЗА_ЗНАНИЙ_ЮГ_ПРАВО/НКО ЮГ ПРАВО/${classification.folder}/Входящие`;

  if (parsedMessage.attachments && parsedMessage.attachments.length > 0) {
    const datePrefix = date.toISOString().split('T')[0];
    for (const att of parsedMessage.attachments) {
      const cleanFilename = att.filename ? att.filename.replace(/[\/\\:*?"<>|]/g, '_') : `file_${Date.now()}`;
      const remoteFilePath = `${targetFolder}/${datePrefix}_${cleanFilename}`;
      
      console.log(`  💾 Выгрузка вложения: ${cleanFilename} ➔ ${remoteFilePath}...`);
      const uploadRes = await uploadFileToYandexDisk(att.content, remoteFilePath);
      if (uploadRes.success) {
        savedAttachmentNames.push(cleanFilename);
        console.log(`  ✅ Вложение сохранено на Диск: ${cleanFilename}`);
      } else {
        console.warn(`  ⚠️ Ошибка выгрузки вложения:`, uploadRes.error || uploadRes.status);
      }
    }
  }

  // 5. Занесение в Excel-журнал канцелярии
  const deptCodeMap = {
    'ФАС': 'ФАС',
    'ФССП': 'ФССП',
    'Банк России (ЦБ РФ)': 'ЦБ',
    'ФНС': 'ФНС',
    'Роскомнадзор': 'РКН',
    'Минюст': 'МЮ',
    'Прокуратура': 'ПРОК',
    'Судебные органы': 'СУД',
    'Сбербанк и Банки': 'БАНК',
    'МФО и Коллекторы': 'МФО',
    'Общая канцелярия': 'КАНЦ'
  };

  const regRes = await registry.appendIncomingEntry({
    date: date.toLocaleDateString('ru-RU'),
    department: classification.department,
    deptCode: deptCodeMap[classification.department] || 'КАНЦ',
    relatedCase: relatedCaseStr,
    from: fromText,
    outNumber: outDocNumber,
    subject: subject,
    summary: summary,
    attachments: savedAttachmentNames,
    deadline: deadlineInfo.deadlineDate,
    hasDeadline: deadlineInfo.deadlineDate.includes('.'),
    deadlineReason: deadlineInfo.reason,
    folderPath: targetFolder
  });

  if (regRes.duplicate) {
    console.log(`  ⏩ Письмо уже ранее зарегистрировано в журнале. Пропускаем повтор.`);
    return;
  }

  // 6. Отправка карточки в Telegram с привязкой к делу
  await sendTelegramNotification({
    department: classification.department,
    from: fromText,
    subject: subject,
    inNumber: regRes.inNumber,
    outNumber: outDocNumber,
    relatedCase: relatedCaseStr,
    summary: summary,
    deadline: deadlineInfo.deadlineDate,
    hasDeadline: deadlineInfo.deadlineDate.includes('.'),
    deadlineReason: deadlineInfo.reason,
    attachments: savedAttachmentNames,
    folderPath: targetFolder
  });

  console.log(`  🎉 Юридический документ успешно обработан секретарем и зафиксирован!`);
}

/**
 * Список официальных доменов и ключевых слов ведомств
 */
const AGENCY_DOMAINS = [
  // Государственные ведомства
  'gov.ru', 'fas.gov.ru', 'fssp.gov.ru', 'nalog.gov.ru', 'nalog.ru', 'genproc.gov.ru', 
  'rkn.gov.ru', 'minjust.gov.ru', 'cbr.ru', 'gosuslugi.ru', 'mvd.ru', 'мвд.рф', 
  'rospotrebnadzor.ru', 'minstroyrf.gov.ru', 'sudrf.ru', 'arbitr.ru', 'fssprus.ru',
  'finombudsman.ru', 'mos.ru', 'adm.ru', 'samregion.ru',
  // Банки
  'sberbank.ru', 'sber.ru', 'vtb.ru', 'tbank.ru', 'tinkoff.ru', 'alfabank.ru',
  'pochtabank.ru', 'gazprombank.ru', 'sovcombank.ru', 'open.ru', 'raiffeisen.ru',
  'rosbank.ru', 'psbank.ru', 'mkb.ru', 'domrf.ru',
  // МФО и ПКО (коллекторы)
  'joy.money', 'bistrodengi.ru', 'moneyman.ru', 'creditnow.ru', 'zaym.ru',
  'dengisrazy.ru', 'turbozaim.ru', 'webbankir.com', 'ekapusta.com', 'viva-dengi.ru',
  'migcredit.ru', 'creditplus.ru', 'moneza.ru', 'payps.ru'
];

const LEGAL_KEYWORDS = [
  'претензия', 'жалоба', 'определение', 'постановление', 'предписание', 'решение',
  'уведомление', 'запрос', 'исполнительное производство', 'судебный приказ', 'ходатайство',
  'перерасчет', 'куспо', 'кусп', 'фас', 'фссп', 'минюст', 'роскомнадзор', 'цб рф', 'банк россии',
  'прокуратура', '135-фз', '229-фз', '230-фз', '59-фз', '152-фз', 'зозпп', 'дело №', 'исх. №'
];

/**
 * Проверка, относится ли письмо к официальному ведомству или процессуальной переписке
 */
function isAgencyOrLegalMail(fromText, subject, textBody) {
  const fromLower = (fromText || '').toLowerCase();
  const subLower = (subject || '').toLowerCase();
  const bodyLower = (textBody || '').toLowerCase();

  // 1. Проверка по домену отправителя
  const hasAgencyDomain = AGENCY_DOMAINS.some(d => fromLower.includes(d));
  if (hasAgencyDomain) return true;

  // 2. Проверка по ключевым словам в теме или тексте
  const hasKeywordInSubject = LEGAL_KEYWORDS.some(kw => subLower.includes(kw));
  if (hasKeywordInSubject) return true;

  const hasKeywordInBody = LEGAL_KEYWORDS.some(kw => bodyLower.includes(kw));
  if (hasKeywordInBody && (fromLower.includes('@') || subLower.length > 5)) return true;

  return false;
}

/**
 * Обработать исходящее письмо (папка Sent)
 */
async function processOutgoingMessage(parsedMessage) {
  const toText = parsedMessage.to?.text || parsedMessage.to?.value?.[0]?.address || 'Неизвестный получатель';
  const subject = parsedMessage.subject || 'Без темы';
  const textBody = parsedMessage.text || '';
  const date = parsedMessage.date || new Date();

  // Проверяем, не спам ли
  if (subject.toLowerCase().includes('undelivered') || subject.toLowerCase().includes('недоставленное')) return;

  const outDocNumber = classifier.extractDocNumber(textBody, subject);
  const summary = classifier.summarizeContext(textBody, subject);

  console.log(`\n📤 [Исходящее письмо] "${subject}" ➔ [${toText}]...`);

  await registry.appendOutgoingEntry({
    date: date.toLocaleDateString('ru-RU'),
    recipient: toText,
    outNumber: outDocNumber !== 'Б/Н' ? outDocNumber : null,
    subject: subject,
    summary: summary,
    method: 'Электронная почта (SMTP yugpravo.ru)',
    track: 'Отправлено с почтового сервера',
    status: '🟢 Отправлено'
  });
}

/**
 * Сканирование ящика по IMAP с фильтрацией по 3 месяцам, ведомствам и ключевым словам
 */
async function scanMailbox(host, port, user, pass, accountLabel) {
  if (!user || !pass) {
    console.log(`ℹ️ [Secretary] Учетные данные для ${accountLabel} не заданы. Пропускаем.`);
    return;
  }

  console.log(`\n🔍 [Secretary] Подключение к ${accountLabel} (${user}@${host}:${port})...`);

  const client = new ImapFlow({
    host: host,
    port: port,
    secure: true,
    auth: { user: user, pass: pass },
    logger: false
  });

  try {
    await client.connect();
    console.log(`✅ [Secretary] Соединение с ${accountLabel} установлено!`);

    // Точный диапазон: последние 3 месяца (90 дней)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
    console.log(`📅 [Диапазон поиска] Сканируем корреспонденцию с: ${threeMonthsAgo.toLocaleDateString('ru-RU')} по настоящее время`);

    // Получаем список всех папок на почтовом сервере
    const list = await client.list();
    const availableFolders = list.map(f => ({ path: f.path, name: f.name, specialUse: f.specialUse }));
    console.log(`📁 [Папки на сервере]:`, availableFolders.map(f => f.path).join(', '));

    // 1. Определение входящих папок (INBOX, Spam, All Mail / Вся почта)
    const inboxPaths = [];
    const sentPaths = [];

    for (const f of availableFolders) {
      const pLower = f.path.toLowerCase();
      const sUse = f.specialUse || '';

      if (sUse === '\\Sent' || pLower.includes('sent') || pLower.includes('отправлен')) {
        sentPaths.push(f.path);
      } else if (sUse === '\\Trash' || sUse === '\\Drafts' || pLower.includes('trash') || pLower.includes('draft') || pLower.includes('корзин') || pLower.includes('черновик')) {
        // Пропускаем корзину и черновики
      } else {
        // Все остальные папки (INBOX, Spam, All Mail, Вся почта, Категории)
        inboxPaths.push(f.path);
      }
    }

    // Если нет папок, по дефолту берем INBOX
    if (inboxPaths.length === 0) inboxPaths.push('INBOX');

    // 2. Сканируем входящие папки
    for (const boxPath of inboxPaths) {
      try {
        const lock = await client.getMailboxLock(boxPath);
        try {
          console.log(`\n📂 [Secretary] Открыта папка [${boxPath}]. Поиск писем от ведомств за 3 месяца...`);
          const messages = client.fetch({ since: threeMonthsAgo }, { source: true, envelope: true });
          let count = 0;
          let matched = 0;

          for await (const message of messages) {
            count++;
            try {
              const parsed = await simpleParser(message.source);
              const fromText = parsed.from?.text || parsed.from?.value?.[0]?.address || '';
              const subject = parsed.subject || '';
              const textBody = parsed.text || '';

              if (isAgencyOrLegalMail(fromText, subject, textBody)) {
                matched++;
                await processEmailMessage(parsed, accountLabel);
              }
            } catch (msgErr) {
              console.error(`❌ Ошибка разбора письма UID ${message.uid}:`, msgErr.message);
            }
          }
          console.log(`🏁 [Secretary] Папка [${boxPath}] завершена. Проверено: ${count}, Отобрано по ведомствам: ${matched}`);
        } finally {
          lock.release();
        }
      } catch (boxErr) {
        // Пропускаем недоступные системные папки
      }
    }

    // 3. Сканируем исходящие папки
    for (const sentPath of sentPaths) {
      try {
        const lock = await client.getMailboxLock(sentPath);
        try {
          console.log(`\n📂 [Secretary] Открыта папка [${sentPath}]. Реестр исходящей корреспонденции за 3 месяца...`);
          const messages = client.fetch({ since: threeMonthsAgo }, { source: true, envelope: true });
          let sentCount = 0;

          for await (const message of messages) {
            sentCount++;
            try {
              const parsed = await simpleParser(message.source);
              await processOutgoingMessage(parsed);
            } catch (_) {}
          }
          console.log(`🏁 [Secretary] Папка [${sentPath}] завершена. Зафиксировано исходящих: ${sentCount}`);
        } finally {
          lock.release();
        }
      } catch (_) {}
    }

    await client.logout();
  } catch (err) {
    console.error(`❌ [Secretary] Ошибка IMAP для ${accountLabel}:`, err.message);
  }
}

/**
 * Главный запуск
 */
async function run() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('🤖 ЮГ-ПРАВО LegalTech — УМНЫЙ СЕКРЕТАРЬ КАНЦЕЛЯРИИ');
  console.log('════════════════════════════════════════════════════════════\n');

  // 1. Сканируем Яндекс Почту (info@yugpravo.ru)
  await scanMailbox('imap.yandex.ru', 993, config.yandexUser, config.yandexPass, 'Яндекс Почта (info@yugpravo.ru)');

  // 2. Сканируем Gmail (если задан пароль приложений GMAIL_APP_PASS)
  if (config.gmailPass) {
    await scanMailbox('imap.gmail.com', 993, config.gmailUser, config.gmailPass, `Gmail (${config.gmailUser})`);
  } else {
    console.log(`\nℹ️ [Gmail] Для сканирования ${config.gmailUser} требуется Google App Password (GMAIL_APP_PASS в .env).`);
  }

  console.log('\n✨ Журнал канцелярии и выгрузка на Яндекс Диск полностью актуализированы!');
}

async function main() {
  await run();

  if (process.argv.includes('--watch')) {
    console.log('\n🔄 [Secretary Daemon] Запущен режим регулярного мониторинга (1 раз в сутки)...');
    setInterval(async () => {
      try {
        console.log(`\n⏰ [${new Date().toLocaleTimeString('ru-RU')}] Ежесуточная плановая проверка входящей корреспонденции...`);
        await run();
      } catch (e) {
        console.error('❌ [Secretary Daemon Error]:', e.message);
      }
    }, 24 * 60 * 60 * 1000);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { run, scanMailbox, processEmailMessage };
