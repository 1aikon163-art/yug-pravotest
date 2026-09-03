const fs = require('fs');
const path = require('path');

const MAIN_PAGES = [
  'about.html','cases.html','calculator.html',
  'contacts.html','disclosure.html','doc-viewer.html','events.html',
  'initiatives.html','knowledge.html','privacy.html','services.html','ustav.html'
];
const kDir = path.join(__dirname, '..', 'knowledge');
const kPages = fs.existsSync(kDir)
  ? fs.readdirSync(kDir).filter(f => f.endsWith('.html')).map(f => 'knowledge/' + f)
  : [];

const ALL_PAGES = [...MAIN_PAGES, ...kPages];

console.log('Auditing pages for donate button, modal, and payment.js:');
ALL_PAGES.forEach(p => {
  const full = path.join(__dirname, '..', p);
  if (!fs.existsSync(full)) return;
  const c = fs.readFileSync(full, 'utf8');
  const hasDonateBtn = /modal-donate|Поддержать проект/i.test(c);
  const hasModal = /id=["']modal-donate["']/i.test(c);
  const hasPaymentJs = /payment\.js/i.test(c);
  const hasSharedJs = /shared\.js/i.test(c);
  const hasEffectsJs = /effects\.js/i.test(c);

  console.log(p.padEnd(50) + ' | Btn: ' + (hasDonateBtn?'✅':'❌') + ' | Modal: ' + (hasModal?'✅':'❌') + ' | payment.js: ' + (hasPaymentJs?'✅':'❌'));
});
