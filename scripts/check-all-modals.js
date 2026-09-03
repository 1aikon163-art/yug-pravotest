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

console.log('Auditing modal-donate content in all pages:');
ALL_PAGES.forEach(p => {
  const full = path.join(__dirname, '..', p);
  if (!fs.existsSync(full)) return;
  const c = fs.readFileSync(full, 'utf8');
  
  const mIdx = c.indexOf('id="modal-donate"');
  if (mIdx !== -1) {
    const snippet = c.substring(mIdx, mIdx + 2000);
    const btnMatch = snippet.match(/<button[^>]*payments[^>]*>[\s\S]*?<\/button>|<button[^>]*donate-submit-btn[^>]*>[\s\S]*?<\/button>|<button[^>]*initiatePayment[^>]*>[\s\S]*?<\/button>/i);
    const hasTBank = snippet.includes('TBankPayment') || snippet.includes('initiatePayment');
    const hasDisabled = btnMatch ? btnMatch[0].includes('disabled') : false;
    
    console.log(p.padEnd(45) + ' | hasTBank: ' + (hasTBank?'✅':'❌') + ' | disabled: ' + (hasDisabled?'❌ (DISABLED)':'✅ (ACTIVE)') + ' | btn: ' + (btnMatch ? btnMatch[0].replace(/\s+/g, ' ').substring(0, 80) : 'NOT FOUND'));
  } else {
    console.log(p.padEnd(45) + ' | NO MODAL');
  }
});
