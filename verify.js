const http = require('http');
const fs = require('fs');
const path = require('path');

const urls = [
  'http://localhost:8080/index.html',
  'http://localhost:8080/initiatives.html',
  'http://localhost:8080/events.html',
  'http://localhost:8080/knowledge.html',
  'http://localhost:8080/knowledge/gosklyuch-elektronnaya-podpis.html',
  'http://localhost:8080/knowledge/zaderzhanie-politsiey-pamyatka.html',
  'http://localhost:8080/knowledge/kak-podat-isk-v-sud.html',
  'http://localhost:8080/knowledge/pereraschet-zhkh-plata.html',
  'http://localhost:8080/knowledge/vozvrat-tehniki-zozpp.html',
  'http://localhost:8080/knowledge/nezakonnoe-uvolnenie-zarplata.html',
  'http://localhost:8080/knowledge/shumnye-sosedi-zakon-o-tishine.html',
  'http://localhost:8080/knowledge/samozapret-na-kredity-gosuslugi.html',
  'http://localhost:8080/knowledge/vozvrat-strahovki-period-ohlazhdeniya.html',
  'http://localhost:8080/knowledge/zashchita-ot-kollektorov-230-fz.html',
  'http://localhost:8080/knowledge/zaliv-kvartiry-akt-vozmeshchenie.html',
  'http://localhost:8080/knowledge/vozvrat-tovarov-wildberries-ozon.html',
  'http://localhost:8080/services.html',
  'http://localhost:8080/cases.html',
  'http://localhost:8080/disclosure.html',
  'http://localhost:8080/doc-viewer.html',
  'http://localhost:8080/doc-viewer.html?doc=ustav',
  'http://localhost:8080/doc-viewer.html?doc=politika',
  'http://localhost:8080/doc-viewer.html?doc=list',
  'http://localhost:8080/doc-viewer.html?doc=terms',
  'http://localhost:8080/about.html',
  'http://localhost:8080/privacy.html',
  'http://localhost:8080/ustav.html',
  'http://localhost:8080/contacts.html',
  'http://localhost:8080/robots.txt',
  'http://localhost:8080/sitemap.xml',
    'http://localhost:8080/images/director.jpg',
  'http://localhost:8080/images/kb/gosklyuch.jpg',
  'http://localhost:8080/images/kb/police.jpg',
  'http://localhost:8080/images/kb/court.jpg',
  'http://localhost:8080/images/kb/jkh.jpg',
  'http://localhost:8080/images/kb/consumer.jpg',
  'http://localhost:8080/images/kb/labor.jpg',
  'http://localhost:8080/images/kb/vet.jpg',
  'http://localhost:8080/images/kb/noise.jpg',
  'http://localhost:8080/images/kb/credit.jpg',
  'http://localhost:8080/images/kb/insurance.jpg',
  'http://localhost:8080/images/kb/collector.jpg',
  'http://localhost:8080/images/kb/flood.jpg',
  'http://localhost:8080/images/kb/marketplace.jpg',
  'http://localhost:8080/docs/ustav.pdf',
  'http://localhost:8080/docs/politika.pdf',
  'http://localhost:8080/docs/list.pdf',
  'http://localhost:8080/docs/terms.txt',
  'http://localhost:8080/hands.mp4',
  'http://localhost:8080/dog.mp4',
  'http://localhost:8080/kling.mp4',
  'http://localhost:8080/baza.mp4',
  'http://localhost:8080/slow.mp4',
  'http://localhost:8080/ves.mp4',
  'http://localhost:8080/12.mp4',
  'http://localhost:8080/13.mp4',
  'http://localhost:8080/css/styles.css',
  'http://localhost:8080/css/shared.css',
  'http://localhost:8080/js/effects.js',
  'http://localhost:8080/js/main.js',
  'http://localhost:8080/calculator.html',
  'http://localhost:8080/js/legal-calculator.js'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      console.log(`[STATUS ${res.statusCode}] [${res.headers['content-type']}] ${url}`);
      resolve(res.statusCode === 200 || res.statusCode === 206);
    }).on('error', (err) => {
      console.error(`[ERROR] ${url}: ${err.message}`);
      resolve(false);
    });
  });
}

async function checkRange(url) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      headers: {
        'Range': 'bytes=0-1024'
      }
    };
    http.get(options, (res) => {
      const cr = res.headers['content-range'];
      const ar = res.headers['accept-ranges'];
      const is206 = res.statusCode === 206;
      console.log(`[STATUS ${res.statusCode}] [Range: ${cr}] [Accept-Ranges: ${ar}] ${url}`);
      resolve(is206 && cr && ar === 'bytes');
    }).on('error', (err) => {
      console.error(`[ERROR Range] ${url}: ${err.message}`);
      resolve(false);
    });
  });
}

function verifyRevertedCleanState() {
  console.log('\nVerifying Clean Baseline State across Codebase:');
  const htmlFiles = [
    'index.html', 'initiatives.html', 'about.html', 'services.html',
    'cases.html', 'events.html', 'knowledge.html', 'contacts.html',
    'ustav.html', 'disclosure.html', 'privacy.html', 'doc-viewer.html', 'code.html',
    'calculator.html'
  ];

  let ok = true;
  htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const hasResidualDarkClass = content.includes('dark:bg-[#0B1120]');
    const hasThemeToggleBtn = content.includes('theme-toggle-btn');

    if (hasResidualDarkClass || hasThemeToggleBtn) {
      console.error(`[FAIL] ${file} has leftover dark mode elements.`);
      ok = false;
    } else {
      console.log(`[PASS] ${file} - clean original state verified.`);
    }
  });

  const stylesCss = fs.readFileSync(path.join(__dirname, 'css', 'styles.css'), 'utf8');
  const hasResidualDarkRules = stylesCss.includes('.dark');
  if (!hasResidualDarkRules) {
    console.log('[PASS] css/styles.css - clean original stylesheet without dark overrides verified.');
  } else {
    console.error('[FAIL] css/styles.css still contains .dark rules.');
    ok = false;
  }

  const effectsJs = fs.readFileSync(path.join(__dirname, 'js', 'effects.js'), 'utf8');
  const hasResidualEffectsToggle = effectsJs.includes('initThemeToggle');
  if (!hasResidualEffectsToggle) {
    console.log('[PASS] js/effects.js - clean original effects module verified.');
  } else {
    console.error('[FAIL] js/effects.js still contains initThemeToggle.');
    ok = false;
  }

  return ok;
}

async function run() {
  console.log('Testing HTTP Endpoints & Assets:');
  let allOk = true;
  for (const url of urls) {
    const ok = await checkUrl(url);
    if (!ok) allOk = false;
  }

  console.log('\nTesting HTTP 206 Partial Content Streaming for Videos:');
  const handsRangeOk = await checkRange('http://localhost:8080/hands.mp4');
  const klingRangeOk = await checkRange('http://localhost:8080/kling.mp4');
  const bazaRangeOk = await checkRange('http://localhost:8080/baza.mp4');
  const slowRangeOk = await checkRange('http://localhost:8080/slow.mp4');
  const vesRangeOk = await checkRange('http://localhost:8080/ves.mp4');
  const twelveRangeOk = await checkRange('http://localhost:8080/12.mp4');
  const thirteenRangeOk = await checkRange('http://localhost:8080/13.mp4');
  if (!handsRangeOk || !klingRangeOk || !bazaRangeOk || !slowRangeOk || !vesRangeOk || !twelveRangeOk || !thirteenRangeOk) allOk = false;

  const indexContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const initContent = fs.readFileSync(path.join(__dirname, 'initiatives.html'), 'utf8');
  const kbContent = fs.readFileSync(path.join(__dirname, 'knowledge.html'), 'utf8');
  const eventsContent = fs.readFileSync(path.join(__dirname, 'events.html'), 'utf8');
  const calcContent = fs.readFileSync(path.join(__dirname, 'calculator.html'), 'utf8');
  const aboutContent = fs.readFileSync(path.join(__dirname, 'about.html'), 'utf8');
  const disclosureContent = fs.readFileSync(path.join(__dirname, 'disclosure.html'), 'utf8');

  const indexVideoOk = indexContent.includes('hands-video') && indexContent.includes('hands.mp4') && indexContent.includes('hero-scroll-container');
  const initVideoOk = (initContent.includes('initiatives-hero-video') || initContent.includes('dog-hero-video')) && initContent.includes('kling.mp4');
  const kbVideoOk = kbContent.includes('knowledge-hero-video') && kbContent.includes('baza.mp4');
  const eventsVideoOk = eventsContent.includes('events-hero-video') && eventsContent.includes('slow.mp4');
  const calcVideoOk = calcContent.includes('calc-hero-video') && calcContent.includes('ves.mp4');
  const aboutVideoOk = aboutContent.includes('about-hero-video') && aboutContent.includes('12.mp4');
  const disclosureVideoOk = disclosureContent.includes('disclosure-hero-video') && disclosureContent.includes('13.mp4');

  if (indexVideoOk && initVideoOk && kbVideoOk && eventsVideoOk && calcVideoOk && aboutVideoOk && disclosureVideoOk) {
    console.log('[PASS] All 7 pages (index, initiatives, knowledge, events, calculator, about, disclosure) have unified Hero video styling verified.');
  } else {
    console.error(`[FAIL] Video hero consistency failed: index=${indexVideoOk}, init=${initVideoOk}, kb=${kbVideoOk}, events=${eventsVideoOk}, calc=${calcVideoOk}, about=${aboutVideoOk}, disclosure=${disclosureVideoOk}`);
    allOk = false;
  }

  const cleanOk = verifyRevertedCleanState();
  if (!cleanOk) allOk = false;

  if (allOk) {
    console.log('\n======================================================');
    console.log(' ALL VERIFICATIONS PASSED: SITE VERIFIED!');
    console.log('======================================================\n');
  } else {
    console.error('\n[ERROR] One or more verification checks failed.');
    process.exit(1);
  }
}

run();
