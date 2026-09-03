const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function test() {
  const p = await fetchUrl('https://yugpravo.ru/js/payment.js?v=20260901_live3');
  console.log('payment.js status:', p.status);
  console.log('payment.js preview:\n', p.data.substring(0, 300));

  const s = await fetchUrl('https://yugpravo.ru/js/standby-lock.js?v=20260901_live3');
  console.log('\nstandby-lock.js status:', s.status);
  console.log('standby-lock.js preview:\n', s.data.substring(0, 300));
}

test();
