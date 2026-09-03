const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Helper to load credentials from .env
function getEnvConfig() {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.yandex.ru',
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    secure: process.env.SMTP_SECURE !== 'false',
    user: process.env.SMTP_USER || 'info@yugpravo.ru',
    pass: process.env.SMTP_PASS || ''
  };

  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const l of lines) {
        const t = l.trim();
        if (t.startsWith('SMTP_HOST=')) config.host = t.split('=')[1].trim().replace(/^["']|["']$/g, '');
        if (t.startsWith('SMTP_PORT=')) config.port = parseInt(t.split('=')[1].trim(), 10);
        if (t.startsWith('SMTP_USER=')) config.user = t.split('=')[1].trim().replace(/^["']|["']$/g, '');
        if (t.startsWith('SMTP_PASS=')) config.pass = t.split('=')[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch (_) {}

  return config;
}

const aliasNames = {
  'jkh@yugpravo.ru': 'Отдел жилищного права и споров в сфере ЖКХ',
  'debt@yugpravo.ru': 'Отдел защиты прав должников и кредитных правоотношений (230-ФЗ)',
  'potreb@yugpravo.ru': 'Отдел защиты прав потребителей (ЗоЗПП)',
  'sud@yugpravo.ru': 'Отдел судебной защиты и процессуального представительства',
  'trud@yugpravo.ru': 'Отдел трудового права и урегулирования трудовых споров',
  'partner@yugpravo.ru': 'Департамент партнерских программ и общественных инициатив',
  'idea@yugpravo.ru': 'Центр поддержки гражданских инициатив и общественных проектов',
  'care@yugpravo.ru': 'Департамент целевых программ и общественных сборов',
  'sharypaev@yugpravo.ru': 'Приёмная директора АНО «ЦПЗ ЮГ-ПРАВО»',
  'info@yugpravo.ru': 'Общая электронная приёмная'
};

/**
 * Send official auto-reply email to applicant
 */
async function sendAutoReply(leadData) {
  const { caseId, name, email, alias, message } = leadData;
  if (!email || !email.includes('@')) {
    return { skipped: true, reason: 'No valid recipient email provided' };
  }

  const envConfig = getEnvConfig();
  if (!envConfig.pass) {
    console.log(`ℹ️ [Mailer] SMTP_PASS not set in .env. Auto-reply for ${email} (Case ${caseId}) prepared but not sent via SMTP.`);
    return { skipped: true, reason: 'SMTP password not configured' };
  }

  const transporter = nodemailer.createTransport({
    host: envConfig.host,
    port: envConfig.port,
    secure: envConfig.secure,
    auth: {
      user: envConfig.user,
      pass: envConfig.pass
    }
  });

  // Определяем точный алиас и подразделение, в которое обратился заявитель
  const validAlias = (alias && typeof alias === 'string' && alias.includes('@yugpravo.ru') && aliasNames[alias.trim().toLowerCase()])
    ? alias.trim().toLowerCase()
    : 'info@yugpravo.ru';

  const departmentName = aliasNames[validAlias] || 'Профильное направление АНО «ЦПЗ ЮГ-ПРАВО»';
  const senderDisplayName = `${departmentName} | АНО «ЦПЗ ЮГ-ПРАВО»`;
  const applicantGreeting = 'Уважаемый заявитель!';
  const isAssignment = (caseId || '').startsWith('СПР-');
  const caseSeq = (caseId || '').slice(-4);

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F7F4; margin: 0; padding: 24px; color: #0F2439; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #E0E0E0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #0F2439; color: #ffffff; padding: 28px 32px; text-align: left; }
    .badge { display: inline-block; background: #C5A059; color: #0F2439; padding: 4px 10px; border-radius: 6px; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .title { font-size: 20px; font-weight: bold; margin: 0; line-height: 1.3; }
    .body { padding: 32px; font-size: 14px; line-height: 1.6; color: #2C3E50; }
    .case-box { background: #F4F6F8; border-left: 4px solid #0F2439; padding: 16px; border-radius: 6px; margin: 20px 0; }
    .case-title { font-size: 11px; text-transform: uppercase; font-weight: bold; color: #5F5E5E; margin-bottom: 4px; }
    .case-number { font-size: 18px; font-weight: bold; color: #0F2439; font-family: monospace; }
    .footer { background: #F8F7F4; border-top: 1px solid #E0E0E0; padding: 20px 32px; font-size: 11px; color: #5F5E5E; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">Электронная приёмная</div>
      <div class="title">АНО «ЦПЗ ЮГ-ПРАВО»</div>
    </div>
    <div class="body">
      <p style="font-size: 16px; font-weight: 600; color: #0F2439; margin-top: 0;">${applicantGreeting}</p>
      <p>Уведомляем, что ваше электронное обращение успешно зарегистрировано в едином реестре учета входящей корреспонденции Автономной некоммерческой организации «Центр правовой защиты и развития гражданских инициатив ЮГ-ПРАВО».</p>
      
      <div class="case-box">
        <div class="case-title">Регистрационный номер ${isAssignment ? 'сопровождения' : 'обращения'}:</div>
        <div class="case-number">${caseId}</div>
        <div style="margin-top: 8px; font-size: 12px; color: #5F5E5E;">
          <strong>Ответственное подразделение:</strong> ${departmentName}
        </div>
        <div style="margin-top: 4px; font-size: 12px; color: #8C6826; font-family: monospace;">
          <strong>Адрес приёма:</strong> ${validAlias}
        </div>
      </div>

      <p>Материалы переданы в работу для детального рассмотрения ситуации и правового анализа. Рассмотрение осуществляется в порядке процессуальной очерёдности поступления.</p>
      
      <div style="margin: 20px 0; padding: 14px 16px; background: #F8F7F4; border-radius: 8px; border: 1px solid #E0E0E0; font-size: 12px; color: #2C3E50; line-height: 1.55;">
        <div style="font-weight: bold; color: #0F2439; margin-bottom: 8px; font-size: 12.5px;">⚖️ Регламент и условия содействия:</div>
        <div style="margin-bottom: 6px;">
          • <strong>Досудебное содействие — 0 ₽ (бесплатно):</strong> подготовка и направление требования с гербовой печатью АНО осуществляются безвозмездно в рамках уставной правозащитной деятельности СО НКО. Потребители и организация освобождены от госпошлины (пп. 4 п. 2 ст. 333.36 НК РФ).
        </div>
        <div style="margin-bottom: 6px;">
          • <strong>Судебное представительство:</strong> в случае отказа или уклонения ответчика от добровольного удовлетворения требований судебная защита оформляется отдельным договором на индивидуальных условиях (расходы на представителя заявляются ко взысканию с виновного лица по ст. 100 ГПК РФ).
        </div>
        <div>
          • <strong>Конфиденциальность (152-ФЗ):</strong> персональные данные и текст обращения обрабатываются в защищенном контуре в строгом соответствии с требованиями Федерального закона № 152-ФЗ.
        </div>
      </div>

      <div style="margin: 22px 0; text-align: center;">
        ${isAssignment ? `
        <a href="https://yugpravo.ru/assignment-viewer.html?caseId=${encodeURIComponent(caseId)}" style="display: inline-block; background: #0F2439; color: #ffffff; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; margin-right: 6px; margin-bottom: 8px;">
          📄 Скачать Заявление-поручение (ПЭП 63-ФЗ)
        </a>` : ''}
        <a href="https://t.me/ugpravo_assistant_bot?start=track_${caseSeq}" style="display: inline-block; background: #229ED9; color: #ffffff; padding: 12px 22px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13.5px; margin-bottom: 8px;">
          📱 Отслеживать статус в Telegram
        </a>
      </div>

      <p>При необходимости уточнения деталей или запроса дополнительных материалов специалист организации свяжется с вами по указанным контактам. Вы также можете отправить дополнительные документы ответным письмом на этот адрес.</p>
      
      <div style="margin-top: 24px; padding: 12px; background: #F8F7F4; border-radius: 6px; font-size: 11px; color: #757575; line-height: 1.4; border: 1px solid #E8E7E2;">
        ℹ️ <strong>Информация об адресе:</strong> Данное системное уведомление направлено с адреса <code>${validAlias}</code> на почту <code>${email}</code>, указанную при подаче электронного обращения на официальном портале <a href="https://yugpravo.ru" style="color: #0F2439;">yugpravo.ru</a>. Если вы не подавали обращение и адрес был указан ошибочно, пожалуйста, проигнорируйте данное сообщение.
      </div>
    </div>
    <div class="footer">
      <strong>АНО «ЦПЗ ЮГ-ПРАВО»</strong><br>
      ${departmentName} (${validAlias})<br>
      ОГРН: 1266300015080 | ИНН: 6317174776 | КПП: 631701001<br>
      Учетный номер Минюста России: 6314010192 | Самарская область<br>
      Телефон приемной: +7 (846) 989-07-68 | Официальный сайт: <a href="https://yugpravo.ru" style="color: #0F2439;">yugpravo.ru</a>
    </div>
  </div>
</body>
</html>
`;

  const textPlain = `Уважаемый заявитель!

Уведомляем, что ваше электронное обращение успешно зарегистрировано в едином реестре учета входящей корреспонденции АНО «Центр правовой защиты и развития гражданских инициатив ЮГ-ПРАВО».

Регистрационный номер обращения: ${caseId}
Ответственное подразделение: ${departmentName} (${validAlias})

ПРОЦЕССУАЛЬНЫЙ РЕГЛАМЕНТ И УСЛОВИЯ СОДЕЙСТВИЯ:
• Досудебное содействие — 0 ₽ (бесплатно): подготовка и направление требования с гербовой печатью АНО осуществляются на безвозмездной основе (пп. 4 п. 2 ст. 333.36 НК РФ).
• Судебное представительство: при отказе ответчика судебная защита оформляется отдельным возмездным договором на индивидуальных условиях (расходы взыскиваются с ответчика по ст. 100 ГПК РФ).
• Конфиденциальность (152-ФЗ): персональные данные и текст Заявления-поручения не передаются в открытом виде по электронной почте в целях защиты вашей тайны и исключения утечки третьим лицам.
• Открыть электронный документ обращения: https://yugpravo.ru/assignment-viewer.html?caseId=${encodeURIComponent(caseId)}

Материалы обращения переданы в работу специалистам профильного направления. При необходимости специалист организации свяжется с вами по указанным контактам.

---
АНО «ЦПЗ ЮГ-ПРАВО»
${departmentName} (${validAlias})
ОГРН: 1266300015080 | ИНН: 6317174776 | КПП: 631701001
Учетный номер Минюста России: 6314010192 | Самарская область
Телефон: +7 (846) 989-07-68 | Официальный сайт: https://yugpravo.ru`;

  try {
    const info = await transporter.sendMail({
      from: `"${senderDisplayName}" <${envConfig.user}>`,
      sender: envConfig.user,
      replyTo: `"${senderDisplayName}" <${validAlias}>`,
      to: email,
      subject: `[${departmentName}] Регистрация электронного обращения № ${caseId}`,
      text: textPlain,
      html: html,
      headers: {
        'X-Case-ID': caseId,
        'X-Entity-Ref-ID': caseId,
        'X-Department-Alias': validAlias,
        'Auto-Submitted': 'auto-generated'
      }
    });
    console.log(`✉️ [Mailer] Auto-reply sent from ${envConfig.user} (replyTo: ${validAlias}) to ${email} (Case ${caseId}, MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`⚠️ [Mailer] Failed to send auto-reply to ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send incoming lead email to department alias (triggers Yandex Mail folder rule)
 */
async function sendLeadToDepartment(leadData) {
  const { caseId, name, phone, email, alias, direction, message, source } = leadData;
  const targetAlias = alias || 'info@yugpravo.ru';

  const envConfig = getEnvConfig();
  if (!envConfig.pass) {
    console.log(`ℹ️ [Mailer] SMTP_PASS not set. Department email for ${targetAlias} (Case ${caseId}) skipped.`);
    return { skipped: true, reason: 'SMTP password not configured' };
  }

  const transporter = nodemailer.createTransport({
    host: envConfig.host,
    port: envConfig.port,
    secure: envConfig.secure,
    auth: {
      user: envConfig.user,
      pass: envConfig.pass
    }
  });

  const directionMap = {
    'new_initiative': 'Новое предложение / проект',
    'fin': '«Стоп-Комиссия» (230-ФЗ / МФО)',
    'tech': '«Цифровое Право» (LegalTech & AI)',
    'dog_park': '«Среда для людей и питомцев» (Площадки для собак)',
    'jkh': '«Грамотное ЖКХ» (Общественный контроль)',
    'youth': '«Школа Права & Волонтёрство» (Добро.рф)',
    'other': 'Общественная инициатива'
  };

  const directionName = direction ? (directionMap[direction] || direction) : '';
  const departmentName = aliasNames[targetAlias] || 'Профильный отдел';
  const now = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Samara' });

  let subjectTag = `[${departmentName}]`;
  if (targetAlias === 'idea@yugpravo.ru') {
    if (direction === 'dog_park') subjectTag = '[ИНИЦИАТИВА / Собачьи площадки]';
    else if (direction === 'fin') subjectTag = '[ИНИЦИАТИВА / Стоп-Комиссия]';
    else if (direction === 'tech') subjectTag = '[ИНИЦИАТИВА / LegalTech & AI]';
    else if (direction === 'jkh') subjectTag = '[ИНИЦИАТИВА / Грамотное ЖКХ]';
    else if (direction === 'youth') subjectTag = '[ИНИЦИАТИВА / Школа Права]';
    else subjectTag = '[ИНИЦИАТИВА / Новое предложение]';
  } else if (targetAlias === 'debt@yugpravo.ru') {
    subjectTag = '[ДОЛГИ & 230-ФЗ]';
  } else if (targetAlias === 'jkh@yugpravo.ru') {
    subjectTag = '[ЖКХ & СПОРЫ С УК]';
  } else if (targetAlias === 'potreb@yugpravo.ru') {
    subjectTag = '[ЗОЗПП & ПОТРЕБИТЕЛИ]';
  } else if (targetAlias === 'sud@yugpravo.ru') {
    subjectTag = '[СУДЕБНАЯ ЗАЩИТА]';
  } else if (targetAlias === 'partner@yugpravo.ru') {
    subjectTag = '[ПАРТНЕРСТВО & B2B]';
  } else if (targetAlias === 'care@yugpravo.ru') {
    subjectTag = '[ЦЕЛЕВОЙ СБОР]';
  }

  const emailSubject = `${subjectTag} № ${caseId} — ${name || 'Заявитель'}`;

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F7F4; margin: 0; padding: 20px; color: #0F2439; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #E0E0E0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #0F2439; color: #ffffff; padding: 20px 24px; }
    .badge { display: inline-block; background: #C5A059; color: #0F2439; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 10px; text-transform: uppercase; margin-bottom: 8px; }
    .title { font-size: 18px; font-weight: bold; margin: 0; }
    .body { padding: 24px; font-size: 14px; line-height: 1.6; color: #2C3E50; }
    .row { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #F0EFEA; }
    .label { font-size: 11px; text-transform: uppercase; font-weight: bold; color: #5F5E5E; }
    .val { font-size: 14px; font-weight: 600; color: #0F2439; margin-top: 2px; }
    .msg-box { background: #F8F7F4; border-left: 3px solid #0F2439; padding: 12px 16px; border-radius: 4px; font-size: 13px; margin-top: 6px; }
    .footer { background: #F8F7F4; border-top: 1px solid #E0E0E0; padding: 16px 24px; font-size: 11px; color: #5F5E5E; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">Входящее обращение с сайта</div>
      <div class="title">№ ${caseId} — ${departmentName}</div>
    </div>
    <div class="body">
      <div class="row">
        <div class="label">Заявитель:</div>
        <div class="val">${name || 'Не указано'}</div>
      </div>
      <div class="row">
        <div class="label">Телефон для связи:</div>
        <div class="val"><a href="tel:${phone}" style="color: #0F2439; text-decoration: none;">${phone || 'Не указан'}</a></div>
      </div>
      ${email ? `
      <div class="row">
        <div class="label">Email заявителя:</div>
        <div class="val"><a href="mailto:${email}" style="color: #0F2439;">${email}</a></div>
      </div>` : ''}
      ${directionName ? `
      <div class="row">
        <div class="label">Тематика инициативы / Проект:</div>
        <div class="val" style="color: #8C6826;">${directionName}</div>
      </div>` : ''}
      <div class="row">
        <div class="label">Направление / Алиас:</div>
        <div class="val" style="font-family: monospace; color: #8C6826;">${targetAlias}</div>
      </div>
      <div class="row">
        <div class="label">Источник:</div>
        <div class="val" style="font-size: 12px; color: #5F5E5E;">${source} • ${now} (Самара)</div>
      </div>
      <div>
        <div class="label">Суть обращения:</div>
        <div class="msg-box">${message ? message.replace(/\n/g, '<br>') : 'Текст обращения не заполнен'}</div>
      </div>
    </div>
    <div class="footer">
      Запись автоматически внесена в Реестр обращений на Яндекс Диске и продублирована в Telegram.
    </div>
  </div>
</body>
</html>
`;

  try {
    const info = await transporter.sendMail({
      from: `"ЮГ-ПРАВО Приёмная" <${envConfig.user}>`,
      to: targetAlias,
      replyTo: email && email.includes('@') ? email : envConfig.user,
      subject: emailSubject,
      html: html
    });
    console.log(`📨 [Mailer] Lead dispatched to ${targetAlias} (Case ${caseId}, MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`⚠️ [Mailer] Failed to dispatch lead to ${targetAlias}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendAutoReply,
  sendLeadToDepartment
};
