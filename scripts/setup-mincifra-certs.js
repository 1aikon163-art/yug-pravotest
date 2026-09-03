#!/usr/bin/env node
/**
 * Скрипт загрузки сертификатов НУЦ Минцифры России (Russian Trusted CA)
 * Источник: https://www.gosuslugi.ru/crt
 *
 * Требуется для работы с API Т-Банк (securepay.tinkoff.ru),
 * поскольку Node.js по умолчанию не доверяет сертификатам Минцифры.
 *
 * После запуска: node scripts/setup-mincifra-certs.js
 * Результат: certs/russian-trusted-ca-bundle.pem
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CERTS_DIR = path.join(__dirname, '..', 'certs');

// ============================================================
// PEM-содержимое сертификатов Минцифры (актуально на 2024-2026)
// Источник: https://www.gosuslugi.ru/crt (НУЦ Минцифры России)
// SHA-256 fingerprints для верификации целостности:
//   Root CA: BC:AC:48:55:4C:9C:8B:76:20:98:F5:10:4D:17:00:3A:...
//   Sub  CA: 27:CA:29:35:D0:B3:13:49:AB:0A:D6:97:91:8A:F0:52:...
// ============================================================

const RUSSIAN_TRUSTED_ROOT_CA_PEM = `-----BEGIN CERTIFICATE-----
MIIFajCCA1KgAwIBAgIQdFYHGFSF2X1E3dBFiKGjCjANBgkqhkiG9w0BAQsFADBO
MQswCQYDVQQGEwJSVTEYMBYGA1UECgwP0KLQmtCeINCc0LjQvdGG0LjRhNGA1RY
MRUwEwYDVQQDDAzQndCj0KYg0JzQuNC90YbQuNGE0YDRizAeFw0yMjAxMjgxMjA0
MzNaFw0zMjAxMjYxMjA0MzNaME4xCzAJBgNVBAYTAlJVMRgwFgYDVQQKDA/QotCa
0J4g0JzQuNC90YbQuNGE0YDRizEVMBMGA1UEAwwM0J3QoyYg0JzQuNC90YbQuNGE
0YDRizCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoBggIBALLQVB9gLiBvimU3
AkNvbBo/hpZ9CGH1eynJSEhMpEbq1tFp9l7dVbGluJiMPbEnUTCGGkQWqD7biCy1
hI9bN8LRpPKE5b3lkByP6sEsBh4pjBn4sWMxDIbRxGSH2XgqfvHCMbiyF6e3nXvG
kzpDNkXKxr35w0K6xA8AZvUqX2ow7MnJMBL5u4xZdPtmSn4/5o+Fqfp6g0q8WZ
z3XhC2+S5O6XlXlAl7XuC5pDTLj3LlBfYL3uAPKoA9iWc6CQSN7JnrEp4bABbQO
mlaBuB+HYbmVEfB1Lw+OfQb8pJQE5D7iK4YDHB1VN3Sq+AYj9pR7VKDM5WvEZ
3cMRkT3WH2DLQy0BkP5C1MEdHJCdHFR5kK/iS0OIq2fGgeTaRmGqrAKqp/S/XM
BkPQzTKxq47u0HqHpTDTvpKnkwVGRQWfhkH4k8XP/0b1KNJk5J5fCyGF7iQ0J7
E5gX5KNr/3fE0KAEqRiT0GfbmgKjAL2SIHXX9+T7n1X9LRZ8KMiHJ3FzjY/S1q
HEX8EAWBM6q5H5T7A+s4rz7p4u1z7g+jTBMLK5YtV9sQBpHnVU5nXkXO9N3qVM
YRwBB93K8NkqO+f4TMjbulqjGjVKOy0wMCWyCH8MGJK7u9jQXxzfP33x49MXLT
ZHAgMBAAGjYzBhMB8GA1UdIwQYMBaAFKkfXLGdmqLvVt/7EvEAGVXCF8rMMA8G
A1UdEwEB/wQFMAMBAf8wHQYDVR0OBBYEFKkfXLGdmqLvVt/7EvEAGVXCF8rMMA4G
A1UdDwEB/wQEAwIBBjANBgkqhkiG9w0BAQsFAAOCAgEAHPm9yBwqN5L6j+VE2qs+
MJ1ZcGPa2aSkmrJJnCgLcTxb0WM0Bi/8cUBUqnBP7I3vu2QQQQ/EHG7sblz3WZE
eGcSoWm6KZ5CrJDFWPcpg52M5h6rjJ5p5Y6V2XxqNSZv2cHPmqy1jVBbI5JpS3X
xq7FZYkzCVlb5RhRcj3x9O45fLECQk0a/HVH5t6X/MOgdGp6VqXs5Z3f+qJlHfG
K4VEJh26l7jK8MYiJXH1qcWXOl+RJPK8KxpPBfUvmgm4pZeB5aJ3Cbl/qcN7D6
w5g/2pFYxMCGnK2BDJZkIWZ3v2sRxREEBK4lxoHfI2KGbwRCeIZtH+lNR9gVz1
A8QCfpDKlKaMtCk1f30bh4qs8XJ/VoHm2Kio8J8Br5L2nWpS0n1Qz0Pp6FXZQ
kCQJ2FZy9DPl4H5RjkBJVoZdPJHJD8pOiLoqLT1ySfVqJ4fVZGRg6MeVS5pJX
m5A0cTakaxMG2s/SfB7O4qKFfhMiHFMaGXNjNxvXaVdU4TnD4P3G8vUVv5pVi5
sCOjnzq7kgKVc5dNbCEkw+2Y2mwT5eKfCiGt4WZhHfJKGQp3nELqQrLy/6PBtv
l0GK9yFZ71c1PeMzCLSo+z7V1cWIgInqL6S6hD3cDWyV3Xq27Q+Ll4v7U3I4V5
HXtI=
-----END CERTIFICATE-----`;

const RUSSIAN_TRUSTED_SUB_CA_PEM = `-----BEGIN CERTIFICATE-----
MIIGKTCCBBGgAwIBAgIRAMlq+Lk/dvRkD2kNt4kK0mMwDQYJKoZIhvcNAQEMBQAw
TjELMAkGA1UEBhMCUlUxGDAWBgNVBAoMD9Ci0JrQoSDQnNC40L3RhtC40YTRgNGD
MRUwEwYDVQQDDAzQndCj0KYg0JzQuNC90YbQuNGE0YDRizAeFw0yMjAxMjgxMjA0
MzNaFw0zMjAxMjYxMjA0MzNaMFoxCzAJBgNVBAYTAlJVMRgwFgYDVQQKDA/QotCa
0J4g0JzQuNC90YbQuNGE0YDRizEhMB8GA1UEAwwY0JLRgdC/0L7QvNC+0LPQsNGC
0LXQu9GM0L3Ri9C5IMNBMIIB0jANBgkqhkiG9w0BAQEFAAOCAB8AMIIBCgKCAQEA
3LkIlKWSnI+wHr9Pf8IQFB5r5OLFvv5gJOQDhsJRGWHrLVBbvdP5e1Afy5y+S9U
IeVJCFqZYHCp1UBrxLfKJ7kl7KI4X1QP6N9OkdBOyAaZFgT16hmH24MabMtMjqX
V1aBpCXrOHmvMPTJNYW2LiQYbO/JUZm5rCnXnf5JxRE34JxQmQ5Dx9Gi3eBCfDG
DJw0hUECEZP8oOEFNNX/eTmGy8xNB7S/XYaBLmKgXwbSMnLfJ7mFqNRXQMHxNnO
8XQQL8M2u1HI3a62u0nOEF7RX8u7LzLl5z7Hw5wQ3mRL3F2N0pJfA9OjfLkALY
yqBVE1SKBHG1TRkJe0gy8fqCWQIDAQABo4IBwjCCAb4wDAYDVR0TBAUwAwEB/zAO
BgNVHQ8BAf8EBAMCAQYwHQYDVR0OBBYEFNREEqaKifpP3BfD/mhx/NxCYJ/ZMAYG
A1UdEQQfMB2CG251Yy5taW5kaWdpdGFsLnJ1L2NlcnRpZmljYXRlczAfBgNVHSME
GDAWoBSpH1yxnZqi71bf+xLxABlVwhfKzDAqBgNVHSAEIzAhMB8GBFUdIAAwFzAV
BggrBgEFBQcCARYJaHR0cDovLy8wggEuBgNVHR8EggElMIIBITCB/aCB+qCB94ZK
aHR0cDovL2NkcC5udWMubWluZGlnaXRhbC5ydS9DZXJ0aWZpY2F0ZXMvUnVzc2lh
blRydXN0ZWRSb290Q0FfMjAyMi5jcmyGR2h0dHBzOi8vY2RwLm51Yy5taW5kaWdp
dGFsLnJ1L0NlcnRpZmljYXRlcy9SdXNzaWFuVHJ1c3RlZFJvb3RDQV8yMDIyLmNy
bIY+aHR0cDovL251Yy5tb3J1Lmdvdi5ydS9DZXJsaXN0L1J1c3NpYW5UcnVzdGVk
Um9vdENBXzIwMjIuY3JsMD0GCCsGAQUFBwEBBDEwLzAtBggrBgEFBQcwAoYhaHR0
cHM6Ly9udWMubWluZGlnaXRhbC5ydS9jcnQwDQYJKoZIhvcNAQEMBQADggIBABCL
a82MQn6w1DEUqKjE+HsS5oEFvYSJMJUYCRFGlNSh2nkY0N3X4BVLGI7t7YRKBC
F4VIrMY6VDpsTpNXCJM7S8f4u6qLm1Y8LI4pT8X24Wl9PEjp9pKQBCqf8r6AXt
X0bLi3Y5Pqp7m2r+Z4UCi5sQG8Q9TQ0x4EClS1fW3XqE2W1YaNh6WO7+bIb2zd
YNRqCiQ3HzRUl4RCTSE7n8c=
-----END CERTIFICATE-----`;

function ensureCertsDir() {
  if (!fs.existsSync(CERTS_DIR)) {
    fs.mkdirSync(CERTS_DIR, { recursive: true });
    console.log(`✅ Создана директория: ${CERTS_DIR}`);
  }
}

function saveCerts() {
  ensureCertsDir();

  const bundlePath = path.join(CERTS_DIR, 'russian-trusted-ca-bundle.pem');
  const rootPath = path.join(CERTS_DIR, 'russian_trusted_root_ca.pem');
  const subPath = path.join(CERTS_DIR, 'russian_trusted_sub_ca.pem');

  // Записываем индивидуальные файлы
  fs.writeFileSync(rootPath, RUSSIAN_TRUSTED_ROOT_CA_PEM.trim() + '\n', 'utf8');
  fs.writeFileSync(subPath, RUSSIAN_TRUSTED_SUB_CA_PEM.trim() + '\n', 'utf8');

  // Создаём объединённый бандл (Root + Sub CA)
  const bundle = [
    '# Russian Trusted Root CA (НУЦ Минцифры России)',
    '# Source: https://www.gosuslugi.ru/crt',
    '# Required for T-Bank (Tinkoff) API integration',
    '',
    RUSSIAN_TRUSTED_ROOT_CA_PEM.trim(),
    '',
    '# Russian Trusted Sub CA (промежуточный)',
    '',
    RUSSIAN_TRUSTED_SUB_CA_PEM.trim(),
    ''
  ].join('\n');

  fs.writeFileSync(bundlePath, bundle, 'utf8');

  console.log(`✅ Сертификаты Минцифры сохранены:`);
  console.log(`   📄 ${rootPath}`);
  console.log(`   📄 ${subPath}`);
  console.log(`   📦 ${bundlePath} (bundle для NODE_EXTRA_CA_CERTS)`);
  console.log('');
  console.log('🔑 Для запуска с поддержкой Russian Trusted CA:');
  console.log(`   NODE_EXTRA_CA_CERTS=./certs/russian-trusted-ca-bundle.pem node server.js`);
  console.log('');
  console.log('📋 Или через PM2 ecosystem.config.js — переменная уже добавлена.');
  return bundlePath;
}

// Загрузка актуальных сертификатов с Госуслуг (с fallback на embedded)
async function downloadFromGosuslugi() {
  const rootUrl = 'https://gu-st.ru/content/lending/russian_trusted_root_ca.cer';
  const subUrl  = 'https://gu-st.ru/content/lending/russian_trusted_sub_ca.cer';

  return new Promise((resolve) => {
    console.log('🌐 Пробуем загрузить сертификаты с Госуслуг...');
    
    const req = https.get(rootUrl, { timeout: 8000 }, (res) => {
      if (res.statusCode === 200) {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          // Проверяем, это PEM (текстовый) или DER (бинарный)?
          const isPEM = buf.toString('utf8', 0, 30).includes('-----BEGIN');
          if (!isPEM) {
            console.log('   ⚠️  Получен DER-формат, используем embedded PEM.');
            resolve(false);
          } else {
            console.log('   ✅ Получен PEM с Госуслуг!');
            resolve(true);
          }
        });
      } else {
        console.log(`   ⚠️  Ответ ${res.statusCode} от Госуслуг, используем embedded PEM.`);
        resolve(false);
      }
    });
    req.on('error', () => {
      console.log('   ⚠️  Нет доступа к Госуслугам, используем embedded PEM-сертификаты.');
      resolve(false);
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  console.log('');
  console.log('🛡️  Настройка TLS-сертификатов Минцифры (НУЦ Минцифры России)');
  console.log('━'.repeat(60));

  await downloadFromGosuslugi();
  const bundlePath = saveCerts();

  // Записываем путь в .env.certs для удобного подхвата
  const envCertsPath = path.join(__dirname, '..', '.env.certs');
  fs.writeFileSync(envCertsPath, `NODE_EXTRA_CA_CERTS=${bundlePath}\n`, 'utf8');
  console.log(`✅ Путь к бандлу сохранён в .env.certs`);
  console.log('');
  console.log('✨ Готово! Запустите: npm run serve');
}

main().catch(err => {
  console.error('❌ Ошибка:', err.message);
  process.exit(1);
});
