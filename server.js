/**
 * Enhanced Dev Server with:
 * 1. Automatic LAN Discovery & Terminal ASCII QR Code
 * 2. Real-time Live Reload via Server-Sent Events (SSE)
 * 3. Range Requests for Media Streaming (MP4/WebM)
 * 4. Dedicated Mobile Testing Endpoint (/qr)
 * 5. Official T-Bank Internet Acquiring & Donation API (/api/payment/init)
 *    with Russian Trusted CA (НУЦ Минцифры России) support
 */

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getLocalIpAddress, generateQr } = require('./scripts/qr-generator');

// ─── Russian Trusted CA (НУЦ Минцифры) ───────────────────────────────────────
// Загружаем bundle-файл с сертификатами Минцифры.
// Без этого Node.js не доверяет TLS-сертификату securepay.tinkoff.ru
// после перехода Т-Банка на НУЦ Минцифры.
const CERTS_BUNDLE_PATH = path.join(__dirname, 'certs', 'russian-trusted-ca-bundle.pem');
let tBankHttpsAgent;
try {
  if (fs.existsSync(CERTS_BUNDLE_PATH)) {
    const caBundlePem = fs.readFileSync(CERTS_BUNDLE_PATH);
    tBankHttpsAgent = new https.Agent({ ca: caBundlePem, keepAlive: true });
    console.log('🛡️  [TLS] Загружен Russian Trusted CA bundle (НУЦ Минцифры).');
  } else {
    console.warn('⚠️  [TLS] Файл certs/russian-trusted-ca-bundle.pem не найден.');
    console.warn('    Запустите: node scripts/setup-mincifra-certs.js');
    tBankHttpsAgent = new https.Agent({ keepAlive: true });
  }
} catch (certErr) {
  console.warn('⚠️  [TLS] Ошибка загрузки сертификатов Минцифры:', certErr.message);
  tBankHttpsAgent = new https.Agent({ keepAlive: true });
}

// ─── T-Bank (Tinkoff) Acquiring Config ───────────────────────────────────────
// Credentials подхватываются из переменных окружения (см. ecosystem.config.js)
const TBANK_CONFIG = {
  terminalKey: process.env.TBANK_TERMINAL_KEY || '1787835813888',
  password:    process.env.TBANK_PASSWORD    || 'e6Qyo#F71Q#jH3fy',
  apiUrl:      'https://securepay.tinkoff.ru/v2/Init'
};

console.log(`💳 [T-Bank] TerminalKey: ${TBANK_CONFIG.terminalKey} | Магазин: UG-PRAVO`);

function generateTBankToken(params, password) {
  const tokenParams = { ...params, Password: password };
  delete tokenParams.Token;
  delete tokenParams.DATA;
  delete tokenParams.Receipt;
  delete tokenParams.Shops;
  delete tokenParams.Descriptor;

  const sortedKeys = Object.keys(tokenParams).sort();
  let concatenated = '';
  for (const key of sortedKeys) {
    concatenated += tokenParams[key];
  }
  return crypto.createHash('sha256').update(concatenated).digest('hex');
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

// Connected Live-Reload Clients (Browsers & Mobile phones)
const sseClients = new Set();

// Debounced file watcher for instant live reload
let reloadTimeout = null;
const watchPaths = [__dirname, path.join(__dirname, 'css'), path.join(__dirname, 'js')];

watchPaths.forEach(dir => {
  if (fs.existsSync(dir)) {
    try {
      fs.watch(dir, { recursive: false }, (eventType, filename) => {
        if (!filename || filename.startsWith('.') || filename.includes('dev-qr.png')) return;
        if (reloadTimeout) clearTimeout(reloadTimeout);
        reloadTimeout = setTimeout(() => {
          const isCss = filename.endsWith('.css');
          console.log(`⚡ [LiveReload] Detected change in: ${filename} -> Triggering ${isCss ? 'CSS refresh' : 'page reload'}...`);
          const payload = JSON.stringify({ type: isCss ? 'css-refresh' : 'reload', file: filename });
          sseClients.forEach(client => {
            try {
              if (client && !client.destroyed && !client.writableEnded) {
                client.write(`data: ${payload}\n\n`);
              } else {
                sseClients.delete(client);
              }
            } catch (e) {
              sseClients.delete(client);
            }
          });
        }, 100);
      });
    } catch (watchErr) {
      console.warn(`[Watch Warning] Could not watch ${dir}:`, watchErr.message);
    }
  }
});

const LIVE_RELOAD_SCRIPT = `
<!-- Auto-injected Live-Reload Client for Desktop & Mobile -->
<script>
(function() {
  if (window.__lr_init) return;
  window.__lr_init = true;
  var evtSource = new EventSource('/livereload-events');
  evtSource.onmessage = function(e) {
    try {
      var data = JSON.parse(e.data);
      if (data.type === 'css-refresh') {
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach(function(l) {
          var href = l.href.split('?')[0];
          l.href = href + '?t=' + Date.now();
        });
      } else {
        window.location.reload();
      }
    } catch(err) { window.location.reload(); }
  };
})();
</script>
`;

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];

  // 1. SSE Live-Reload stream endpoint
  if (reqPath === '/livereload-events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write('retry: 2000\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // 2. Official Banking QR Code ГОСТ Р 56042-2014 Endpoint (/api/qr/gost)
  if (reqPath === '/api/qr/gost') {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const sumRub = parseFloat(parsedUrl.searchParams.get('sum')) || 5000;
    const sumKopecks = Math.round(sumRub * 100);

    const gostString = [
      'ST00012',
      'Name=АНО "ЦПЗ ЮГ-ПРАВО"',
      'PersonalAcc=40703810600000751961',
      'BankName=АО "ТБанк"',
      'BIC=044525974',
      'CorrespAcc=30101810145250000974',
      'PayeeINN=6317174776',
      'KPP=631701001',
      'Purpose=Добровольное пожертвование на ведение уставной деятельности. Без НДС',
      'Sum=' + sumKopecks
    ].join('|');

    const QRCode = require('qrcode');
    const format = parsedUrl.searchParams.get('format') || 'png';

    if (format === 'svg') {
      QRCode.toString(gostString, { type: 'svg', margin: 1 }, (err, svg) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('QR Generation Error');
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400'
        });
        res.end(svg);
      });
      return;
    }

    QRCode.toBuffer(gostString, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 260,
      color: { dark: '#0F2439', light: '#FFFFFF' }
    }, (err, buffer) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('QR Generation Error');
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      });
      res.end(buffer);
    });
    return;
  }

  // 2.2. Personalized DOCX Contract Generator Endpoint (/api/contract/docx)
  if (reqPath === '/api/contract/docx') {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const donorName = (parsedUrl.searchParams.get('name') || '').trim();
    const donorInn = (parsedUrl.searchParams.get('inn') || '').trim();
    const amount = parseFloat(parsedUrl.searchParams.get('amount')) || 5000;

    const { buildContractDocxBuffer } = require('./scripts/contract-docx-service.js');
    buildContractDocxBuffer({
      donorName: donorName || undefined,
      donorInn: donorInn || undefined,
      amount: amount
    }).then(buffer => {
      const filename = `Договор_пожертвования_ЮГ_ПРАВО_${Date.now()}.docx`;
      res.writeHead(200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Length': buffer.length
      });
      res.end(buffer);
    }).catch(err => {
      console.error('❌ [ContractDocx] Error:', err.message);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Ошибка генерации договора: ' + err.message);
    });
    return;
  }

  // 3. T-Bank Payment Initialization Endpoint (/api/payment/init)
  if (reqPath === '/api/payment/init' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const params = JSON.parse(body);
        const amount  = Math.max(100, parseInt(params.amount, 10) || 50000); // минимум 1 руб (в копейках)
        const purpose = params.purpose || 'statutory';
        const orderId = 'DON-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex').toUpperCase();

        // Назначение платежа по направлению пожертвования
        const purposeLabels = {
          statutory: 'Пожертвование на уставную деятельность АНО «ЮГ-ПРАВО»',
          shelter:   'Целевое пожертвование: программа «Добрая лапа»',
          jkh:       'Целевое пожертвование: Народный аудит ЖКХ'
        };
        const description = purposeLabels[purpose] || purposeLabels.statutory;

        // Параметры запроса к Т-Банк API v2
        const tbankParams = {
          TerminalKey: TBANK_CONFIG.terminalKey,
          Amount:      amount,
          OrderId:     orderId,
          Description: description,
          SuccessURL:  params.successUrl || 'https://yug-pravo.ru/payment-success.html',
          FailURL:     params.failUrl    || 'https://yug-pravo.ru/payment-fail.html'
        };

        // Генерация токена (SHA-256 по алгоритму Т-Банк)
        tbankParams.Token = generateTBankToken(tbankParams, TBANK_CONFIG.password);

        const postData = JSON.stringify(tbankParams);
        const tbankUrl = new URL(TBANK_CONFIG.apiUrl);

        const tbankReq = https.request({
          hostname: tbankUrl.hostname,
          path:     tbankUrl.pathname,
          method:   'POST',
          agent:    tBankHttpsAgent,
          headers: {
            'Content-Type':   'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 15000
        }, (tbankRes) => {
          let data = '';
          tbankRes.on('data', d => { data += d; });
          tbankRes.on('end', () => {
            try {
              const result = JSON.parse(data);
              res.writeHead(tbankRes.statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
              if (result.Success && result.PaymentURL) {
                console.log(`✅ [T-Bank] Платёж создан: OrderId=${orderId}, PaymentURL=${result.PaymentURL}`);
                res.end(JSON.stringify({
                  success:    true,
                  paymentUrl: result.PaymentURL,
                  paymentId:  result.PaymentId,
                  orderId:    orderId
                }));
              } else {
                console.warn(`⚠️  [T-Bank] Ошибка:`, result.Message || result.Details);
                res.end(JSON.stringify({
                  success: false,
                  error:   result.Message || 'Ошибка инициализации платежа.',
                  details: result.Details || null
                }));
              }
            } catch (parseErr) {
              res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ success: false, error: 'Ошибка разбора ответа Т-Банк.' }));
            }
          });
        });

        tbankReq.on('error', (err) => {
          console.error('[T-Bank] HTTPS Request Error:', err.message);
          res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({
            success: false,
            error:   'Ошибка соединения с платёжным шлюзом: ' + err.message,
            hint:    err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
              ? 'Запустите: node scripts/setup-mincifra-certs.js'
              : null
          }));
        });

        tbankReq.on('timeout', () => {
          tbankReq.destroy();
          res.writeHead(504, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'Таймаут запроса к Т-Банк (15 сек).' }));
        });

        tbankReq.write(postData);
        tbankReq.end();

      } catch (err) {
        console.error('[T-Bank] Parse Error:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Некорректный запрос: ' + err.message }));
      }
    });
    return;
  }

  // 2.1. Lead Submission Endpoint (/api/lead) -> Forwards to Telegram Admin
  if (reqPath === '/api/lead' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const name    = (data.name    || '').substring(0, 100);
        const phone   = (data.phone   || '').substring(0, 30);
        const email   = (data.email   || '').substring(0, 80);
        const alias   = (data.target_alias || 'info@yugpravo.ru').substring(0, 50);
        const message = (data.message || '').substring(0, 1000);
        const source  = (data.source  || 'Сайт').substring(0, 80);
        const now     = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Samara' });
        const aliasCodes = {
          'jkh@yugpravo.ru': 'ЖКХ',
          'debt@yugpravo.ru': 'ДОЛГ',
          'potreb@yugpravo.ru': 'ЗОЗПП',
          'sud@yugpravo.ru': 'СУД',
          'trud@yugpravo.ru': 'ТРУД',
          'partner@yugpravo.ru': 'ПАРТ',
          'idea@yugpravo.ru': 'ИНИЦ',
          'care@yugpravo.ru': 'СБОР',
          'sharypaev@yugpravo.ru': 'ДИР',
          'info@yugpravo.ru': 'ОБЩ'
        };
        const deptCode = aliasCodes[alias] || 'ОБЩ';
        let typePrefix = 'ОБР';
        const dirLow = (data.direction || '').toLowerCase();
        const srcLow = (data.source || '').toLowerCase();
        if (srcLow.includes('delegate') || srcLow.includes('assignment') || srcLow.includes('calc') || dirLow.includes('поручен') || dirLow.includes('калькулятор') || dirLow.includes('перерасчет') || dirLow.includes('аудит')) {
          typePrefix = 'СПР';
        } else if (dirLow.includes('договор') || srcLow.includes('contract') || srcLow.includes('partner')) {
          typePrefix = 'ДОГ';
        } else if (alias === 'idea@yugpravo.ru' || dirLow.includes('инициатив') || srcLow.includes('initiative')) {
          typePrefix = 'ИН';
        } else {
          typePrefix = 'ОБР';
        }

        const caseId = `${typePrefix}-26/${deptCode}-${caseSeq}`;
        const direction = (data.direction || '').substring(0, 50);

        // 1. Единый учет в локальном реестре обращений
        let appealRecord = null;
        try {
          const appealsManager = require('./scripts/appeals-manager.js');
          appealRecord = appealsManager.createOrUpdateAppeal({
            caseId: caseId,
            name: name,
            phone: phone,
            email: email,
            alias: alias,
            direction: direction,
            message: message,
            source: source,
            status: 'REGISTERED'
          });
        } catch (e) {
          console.warn('⚠️ [AppealsManager] Sync module error:', e.message);
        }

        // 2. Асинхронная запись в Реестр на Яндекс Диске
        try {
          const YandexDiskRegistry = require('./scripts/yandex-disk-sync.js');
          const registry = new YandexDiskRegistry();
          registry.appendLead({
            caseId: caseId,
            name: name,
            phone: phone,
            email: email,
            alias: alias,
            aliasName: alias,
            direction: direction,
            message: message,
            source: source
          }).catch(err => console.error('⚠️ [YandexDisk] Background sync error:', err.message));
        } catch (e) {
          console.warn('⚠️ [YandexDisk] Sync module error:', e.message);
        }

        // 3. Отправка письма в профильный отдел и автоответ заявителю
        try {
          const { sendAutoReply, sendLeadToDepartment } = require('./scripts/mailer.js');
          
          sendLeadToDepartment({
            caseId: caseId,
            name: name,
            phone: phone,
            email: email,
            alias: alias,
            direction: direction,
            message: message,
            source: source
          }).catch(err => console.error('⚠️ [Mailer] Department dispatch error:', err.message));

          if (email && email.includes('@')) {
            sendAutoReply({
              caseId: caseId,
              name: name,
              email: email,
              alias: alias,
              message: message
            }).catch(err => console.error('⚠️ [Mailer] Background email error:', err.message));
          }
        } catch (e) {
          console.warn('⚠️ [Mailer] Mailer module error:', e.message);
        }

        // 4. Уведомление администратора в Telegram
        const botEnvPath = path.join(__dirname, 'bots', '.env');
        let botToken  = process.env.TELEGRAM_MAIN_BOT_TOKEN || '8940322181:AAENoL3QCWhHpc4fKqZbVupbdN3BLjmZxOQ';
        let adminId   = parseInt(process.env.ADMIN_CHAT_ID, 10) || 306883501;
        try {
          if (fs.existsSync(botEnvPath)) {
            const lines = fs.readFileSync(botEnvPath, 'utf-8').split('\n');
            for (const l of lines) {
              const t = l.trim();
              if (!t || t.startsWith('#')) continue;
              const idx = t.indexOf('=');
              if (idx === -1) continue;
              const k = t.slice(0, idx).trim();
              const v = t.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
              if (k === 'TELEGRAM_MAIN_BOT_TOKEN') botToken = v;
              if (k === 'ADMIN_CHAT_ID') adminId = parseInt(v, 10);
            }
          }
        } catch (_) {}

        const docLabel = appealRecord ? appealRecord.docTypeLabel : 'Обращение';
        const docPrefix = appealRecord ? appealRecord.docPrefix : '📩';

        const text = [
          `🔔 <b>${docPrefix} НОВОЕ ${docLabel.toUpperCase()} С САЙТА</b>`,
          `🆔 <b>Номер:</b> <code>${caseId}</code>`,
          '',
          `👤 <b>Заявитель:</b> ${name || '—'}`,
          `📞 <b>Телефон:</b> <code>${phone || '—'}</code>`,
          email ? `📧 <b>Email:</b> ${email}` : null,
          `🏢 <b>Отдел:</b> <code>${alias}</code>`,
          `💬 <b>Суть:</b> ${message || '—'}`,
          `🌐 <b>Источник:</b> ${source}`,
          `🕐 <b>Время:</b> ${now} (Самара)`,
          '',
          '📊 <i>Запись внесена в Единый Реестр и Журнал Канцелярии</i>'
        ].filter(Boolean).join('\n');

        const cleanSafeId = caseSeq;
        const tgLink = `https://t.me/ugpravo_assistant_bot?start=track_${cleanSafeId}`;

        const postData = JSON.stringify({
          chat_id:    adminId,
          text:       text,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: `📞 Позвонить: ${phone}`, url: `tel:${(phone || '').replace(/[^0-9+]/g, '')}` }
              ],
              [
                { text: "✍️ Ответить через бота", callback_data: `reply_${cleanSafeId}` },
                { text: "🟡 В работу", callback_data: `st_IN_PROGRESS_${cleanSafeId}` }
              ],
              [
                { text: "📄 Документ готов", callback_data: `st_DOC_READY_${cleanSafeId}` },
                { text: "🟢 Завершить", callback_data: `st_COMPLETED_${cleanSafeId}` }
              ]
            ]
          }
        });

        const tgReq = https.request({
          hostname: 'api.telegram.org',
          path:     `/bot${botToken}/sendMessage`,
          method:   'POST',
          headers: {
            'Content-Type':   'application/json',
            'Content-Length': Buffer.byteLength(postData)
          },
          timeout: 10000
        }, (tgRes) => {
          let tgData = '';
          tgRes.on('data', d => { tgData += d; });
          tgRes.on('end', () => {
            console.log(`✅ [Lead] ${docLabel} ${caseId} [${alias}]: ${name} / ${phone}`);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
              success: true,
              caseId: caseId,
              alias: alias,
              docType: appealRecord?.docType || 'appeal',
              docTypeLabel: docLabel,
              tgLink: tgLink
            }));
          });
        });

        tgReq.on('error', (tgErr) => {
          console.error('[Lead] Network Error:', tgErr.message);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, caseId: caseId, warning: 'Saved to Yandex Disk' }));
        });

        tgReq.write(postData);
        tgReq.end();

      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Неверный формат запроса.' }));
      }
    });
    return;
  }

  // 2.5 API: Register Assignment (Заявление-поручение ПЭП 63-ФЗ + Реестр Яндекс Диска)
  if (req.method === 'POST' && reqPath === '/api/register-assignment') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const name        = (data.name        || '').substring(0, 100);
        const phone       = (data.phone       || '').substring(0, 30);
        const email       = (data.email       || '').substring(0, 80);
        const company     = (data.company     || '').substring(0, 120);
        const account     = (data.account     || '').substring(0, 60);
        const sum         = (data.sum         || '').substring(0, 40);
        const direction   = (data.direction   || 'Правовая помощь').substring(0, 100);
        const law         = (data.law         || '').substring(0, 200);
        const comment     = (data.comment     || data.message || '').substring(0, 1000);
        const docText     = data.documentText || '';
        const targetAlias = (data.target_alias || 'info@yugpravo.ru').substring(0, 50);

        const caseId = data.caseId || `СПР-26/СУД-${String(Date.now()).slice(-4)}`;

        const summaryText = `[Заявление-поручение ПЭП 63-ФЗ]\n` +
          `Ответчик: ${company || 'Не указан'}\n` +
          `Сумма требований: ${sum}\n` +
          `Основание: ${law}\n` +
          (account ? `Л/с или договор: ${account}\n` : '') +
          `Суть: ${comment || 'Без дополнительных пояснений'}`;

        // 1. Обновление документа в реестре и сохранение на Яндекс Диске (без повторной отправки email/tg)
        let yandexSaved = false;
        try {
          const YandexDiskRegistry = require('./scripts/yandex-disk-sync.js');
          const registry = new YandexDiskRegistry();
          if (docText) {
            yandexSaved = await registry.saveAssignmentDocument({ caseId: caseId }, docText);
          }
        } catch (e) {
          console.warn('⚠️ [YandexDisk] Assignment sync error:', e.message);
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, caseId: caseId, yandexDiskSynced: yandexSaved }));

      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: 'Ошибка обработки поручения: ' + err.message }));
      }
    });
    return;
  }

  // 3. Mobile QR View Page
  if (reqPath === '/qr') {
    const localIp = getLocalIpAddress();
    const qrUrl = `http://${localIp}:8080/`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <title>Mobile Preview QR — Юг-Право</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { background: #0a0c10; color: #f8fafc; font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
          .card { background: #12161f; border: 1px solid rgba(197, 160, 89, 0.3); box-shadow: 0 20px 40px rgba(0,0,0,0.6); border-radius: 20px; padding: 32px; max-width: 420px; }
          h2 { color: #c5a059; margin-top: 0; }
          img { border-radius: 14px; margin: 20px 0; max-width: 260px; box-shadow: 0 8px 24px rgba(197,160,89,0.2); }
          a { color: #c5a059; text-decoration: none; word-break: break-all; font-weight: bold; }
          .badge { background: rgba(197,160,89,0.15); color: #c5a059; padding: 6px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; display: inline-block; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">⚡ LIVE-RELOAD АКТИВЕН</span>
          <h2>📱 Мобильное тестирование</h2>
          <p>Отсканируйте QR-код камерой смартфона в одной сети Wi-Fi:</p>
          <img src="/images/dev-qr.png" alt="QR Code" />
          <p><a href="${qrUrl}" target="_blank">${qrUrl}</a></p>
        </div>
      </body>
      </html>
    `);
    return;
  }

  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(__dirname, reqPath);
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mime[ext] || 'application/octet-stream';
    const totalSize = stats.size;
    const range = req.headers.range;

    // Handle HTML files with auto-injected Live-Reload script
    if (ext === '.html') {
      fs.readFile(filePath, 'utf8', (readErr, htmlContent) => {
        if (readErr) {
          res.writeHead(500);
          return res.end('Server Error');
        }
        let output = htmlContent;
        const lastBodyIdx = output.lastIndexOf('</body>');
        if (lastBodyIdx !== -1) {
          output = output.slice(0, lastBodyIdx) + LIVE_RELOAD_SCRIPT + output.slice(lastBodyIdx);
        } else {
          output += LIVE_RELOAD_SCRIPT;
        }
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(output);
      });
      return;
    }

    // Handle Range Requests (HTTP 206 Partial Content) for streaming media files
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (isNaN(start) || start >= totalSize || end >= totalSize || start > end) {
        res.writeHead(416, { 'Content-Range': `bytes */${totalSize}` });
        return res.end();
      }

      const chunkSize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*'
      });

      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': totalSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

const PORT = 8080;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Server Error] Port ${PORT} is already in use.`);
  } else {
    console.error('[Server Error]', err);
  }
});

process.on('uncaughtException', (err) => {
  console.error('[Dev Server Uncaught Exception]', err.message || err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Dev Server Unhandled Rejection]', reason);
});

server.listen(PORT, async () => {
  try {
    await generateQr();
  } catch (qrErr) {
    console.warn('[QR Generator Warning]', qrErr.message);
  }
});
