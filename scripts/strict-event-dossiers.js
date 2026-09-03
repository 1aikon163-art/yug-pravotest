const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';
const eventsPath = path.join(rootDir, 'events.html');
let eventsHtml = fs.readFileSync(eventsPath, 'utf8');

// Ensure each button has explicit onclick="event.stopPropagation(); openEventDossier('KEY')"
eventsHtml = eventsHtml.replace(
  /<button type="button" class="font-bold uppercase text-\[#8C6826\][^>]*>Подробнее о проекте →<\/button>/gi,
  '<button type="button" class="font-bold uppercase text-[#8C6826] hover:text-[#0F2439] transition-colors inline-flex items-center gap-1" onclick="event.stopPropagation(); openEventDossier(\'calculator_launch\')">Подробнее о проекте →</button>'
);

eventsHtml = eventsHtml.replace(
  /<button type="button" class="font-bold uppercase text-\[#0F2439\][^>]*>Подробнее о докладе →<\/button>/gi,
  (match, offset) => {
    // Determine which card by position
    if (offset < 15000) {
      return '<button type="button" class="font-bold uppercase text-[#0F2439] hover:text-[#8C6826] transition-colors inline-flex items-center gap-1" onclick="event.stopPropagation(); openEventDossier(\'cyber\')">Подробнее о докладе →</button>';
    } else if (offset < 18000) {
      return '<button type="button" class="font-bold uppercase text-[#0F2439] hover:text-[#8C6826] transition-colors inline-flex items-center gap-1" onclick="event.stopPropagation(); openEventDossier(\'barriers\')">Подробнее о докладе →</button>';
    } else {
      return '<button type="button" class="font-bold uppercase text-[#0F2439] hover:text-[#8C6826] transition-colors inline-flex items-center gap-1" onclick="event.stopPropagation(); openEventDossier(\'mfo\')">Подробнее о докладе →</button>';
    }
  }
);

// Card 4: JKH Audit
eventsHtml = eventsHtml.replace(
  /<button class="px-4 py-2 bg-\[#0F2439\][^>]*onclick="openJkhAuditModal\(\)">[\s\S]*?<\/button>/gi,
  '<button type="button" class="px-4 py-2 bg-[#0F2439] text-white text-xs uppercase font-bold tracking-wider rounded hover:bg-[#1e3a5f] transition-all shadow-xs inline-flex items-center gap-1" onclick="event.stopPropagation(); openEventDossier(\'jkh_audit\')"><span>Подробнее об аудите / Участвовать</span><span class="material-symbols-outlined text-xs">arrow_forward</span></button>'
);

// Card 5: Animal Aid
eventsHtml = eventsHtml.replace(
  /<button class="px-4 py-2 bg-\[#0F2439\][^>]*onclick="openAnimalAidModal\(\)">[\s\S]*?<\/button>/gi,
  '<button type="button" class="px-4 py-2 bg-[#0F2439] text-white text-xs uppercase font-bold tracking-wider rounded hover:bg-[#1e3a5f] transition-all shadow-xs inline-flex items-center gap-1" onclick="event.stopPropagation(); openEventDossier(\'animal_aid\')"><span>Подробнее об акции / Участвовать</span><span class="material-symbols-outlined text-xs">arrow_forward</span></button>'
);

// Card 6: Dog Park
eventsHtml = eventsHtml.replace(
  /<button class="px-4 py-2 bg-\[#0F2439\][^>]*onclick="openDogParkModal\(\)">[\s\S]*?<\/button>/gi,
  '<button type="button" class="px-4 py-2 bg-[#0F2439] text-white text-xs uppercase font-bold tracking-wider rounded hover:bg-[#1e3a5f] transition-all shadow-xs inline-flex items-center gap-1" onclick="event.stopPropagation(); openEventDossier(\'dog_park\')"><span>Подробнее об инициативе / Подписи</span><span class="material-symbols-outlined text-xs">arrow_forward</span></button>'
);

// Card 7: Field Inspection
eventsHtml = eventsHtml.replace(
  /<button class="px-4 py-2 bg-\[#0F2439\][^>]*onclick="openFieldInspectionModal\(\)">[\s\S]*?<\/button>/gi,
  '<button type="button" class="px-4 py-2 bg-[#0F2439] text-white text-xs uppercase font-bold tracking-wider rounded hover:bg-[#1e3a5f] transition-all shadow-xs inline-flex items-center gap-1" onclick="event.stopPropagation(); openEventDossier(\'field_inspection\')"><span>Подробнее о программе / Присоединиться</span><span class="material-symbols-outlined text-xs">arrow_forward</span></button>'
);

fs.writeFileSync(eventsPath, eventsHtml, 'utf8');
console.log('All event buttons and cards strictly mapped to Event Dossiers!');

// Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading fixed events.html to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(eventsPath, '/var/www/yug-pravo/events.html', () => {
      conn.exec('systemctl reload nginx', () => {
        console.log('ALL_EVENT_BUTTONS_DOSSIER_DEPLOYED');
        conn.end();
      });
    });
  });
}).connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
