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
  console.log('--- Testing live site ---');
  const res = await fetchUrl('https://yugpravo.ru/?t=' + Date.now());
  console.log('HTML status:', res.status);
  
  const re = /<script\s+src=["']([^"']+)["']/gi;
  let match;
  while ((match = re.exec(res.data)) !== null) {
    const src = match[1];
    console.log('Script tag found:', src);
  }

  // Find donate modal
  const donateIdx = res.data.indexOf('id="modal-donate"');
  if (donateIdx !== -1) {
    console.log('\nFound modal-donate snippet:');
    console.log(res.data.substring(donateIdx, donateIdx + 1200));
  } else {
    console.log('\nmodal-donate NOT found!');
  }
}

test();
