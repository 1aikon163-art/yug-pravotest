/**
 * Enhanced Dev Server with:
 * 1. Automatic LAN Discovery & Terminal ASCII QR Code
 * 2. Real-time Live Reload via Server-Sent Events (SSE)
 * 3. Range Requests for Media Streaming (MP4/WebM)
 * 4. Dedicated Mobile Testing Endpoint (/qr)
 * 5. Official T-Bank Internet Acquiring & Donation API (/api/payment/init)
 */

const http = require('http');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getLocalIpAddress, generateQr } = require('./scripts/qr-generator');

// T-Bank (Tinkoff) Acquiring Credentials (loaded strictly from environment)
const TBANK_CONFIG = {
  terminalKey: process.env.TBANK_TERMINAL_KEY || '',
  password: process.env.TBANK_PASSWORD || '',
  apiUrl: 'https://securepay.tinkoff.ru/v2/Init'
};

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

  // 2. T-Bank Payment Initialization Endpoint (/api/payment/init)
  if (reqPath === '/api/payment/init' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const amountRub = parseInt(data.amount, 10) || 500;
        const amountKopecks = amountRub * 100;
        const purposeKey = data.purpose || 'statutory';
        const userEmail = data.email || 'donor@yug-pravo.ru';

        let description = 'Добровольное пожертвование на уставную деятельность АНО «ЦПЗ ЮГ-ПРАВО»';
        if (purposeKey === 'shelter') {
          description = 'Целевое благотворительное пожертвование на программу «Добрая лапа» (ФЗ № 135-ФЗ)';
        } else if (purposeKey === 'jkh') {
          description = 'Целевое пожертвование на общественный аудит ЖКХ и экспертизы МКД (ФЗ № 212-ФЗ)';
        }

        const orderId = `YP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const payload = {
          TerminalKey: TBANK_CONFIG.terminalKey,
          Amount: amountKopecks,
          OrderId: orderId,
          Description: description,
          SuccessURL: `http://${req.headers.host || 'localhost:8080'}/payment-success.html?orderId=${orderId}`,
          FailURL: `http://${req.headers.host || 'localhost:8080'}/index.html?error=payment_failed`,
          DATA: {
            Email: userEmail,
            Company: 'АНО ЦПЗ ЮГ-ПРАВО',
            TaxId: '6317174776'
          }
        };

        payload.Token = generateTBankToken(payload, TBANK_CONFIG.password);

        const postData = JSON.stringify(payload);

        const tReq = https.request(TBANK_CONFIG.apiUrl, {
          method: 'POST',
          rejectUnauthorized: false,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        }, (tRes) => {
          let tData = '';
          tRes.on('data', chunk => tData += chunk);
          tRes.on('end', () => {
            try {
              const resp = JSON.parse(tData);
              if (resp.Success && resp.PaymentURL) {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({
                  success: true,
                  paymentUrl: resp.PaymentURL,
                  paymentId: resp.PaymentId,
                  orderId: resp.OrderId
                }));
              } else {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({
                  success: false,
                  error: resp.Message || resp.Details || 'Ошибка банка при создании платежа'
                }));
              }
            } catch (pErr) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Некорректный ответ банка' }));
            }
          });
        });

        tReq.on('error', (e) => {
          console.error('[T-Bank API Error]', e);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Сетевая ошибка обращения к Т-Банку' }));
        });

        tReq.write(postData);
        tReq.end();

      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Неверные параметры запроса' }));
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
        if (output.includes('</body>')) {
          output = output.replace('</body>', `${LIVE_RELOAD_SCRIPT}</body>`);
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
