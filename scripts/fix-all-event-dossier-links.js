const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';
const eventsPath = path.join(rootDir, 'events.html');
let eventsHtml = fs.readFileSync(eventsPath, 'utf8');

// 1. Remove all external article links from cards and buttons in events.html
// Replace any <a href="knowledge/..." in event cards with buttons calling openEventDossier
eventsHtml = eventsHtml.replace(
  /<a href="knowledge\/[^"]*" class="([^"]*)" onclick="[^"]*">([^<]*)<\/a>/gi,
  '<button type="button" class="$1">$2</button>'
);

// 2. Ensure all 8 cards have strict onclick="openEventDossier('KEY')"
// Card 0: calculator_launch
eventsHtml = eventsHtml.replace(
  /<div class="event-item[^>]*" data-category="sep"[^>]*onclick="[^"]*"/i,
  '<div class="event-item relative overflow-hidden bg-gradient-to-br from-white via-white to-[#FAF4E6]/60 border-2 border-[#C5A059]/50 rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-[#8C6826] transition-all duration-300 hover:scale-[1.005] hover:-translate-y-1 shadow-md hover:shadow-xl group cursor-pointer lg:col-span-2" data-category="sep" onclick="openEventDossier(\'calculator_launch\')"'
);

// Card 1: cyber
eventsHtml = eventsHtml.replace(
  /<div class="event-item[^>]*" data-category="sep"[^>]*onclick="openPredefinedEvent\('cyber'\)"/i,
  '<div class="event-item relative overflow-hidden bg-white/95 border border-[#E0E0E0] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-black/15 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 shadow-xs hover:shadow-lg group cursor-pointer" data-category="sep" onclick="openEventDossier(\'cyber\')"'
);

// Card 2: barriers (MFO & PKO Audit)
eventsHtml = eventsHtml.replace(
  /<div class="event-item[^>]*" data-category="sep"[^>]*onclick="[^"]*zashchita-ot-kollektorov[^"]*"/i,
  '<div class="event-item relative overflow-hidden bg-white/95 border border-[#E0E0E0] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-black/15 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 shadow-xs hover:shadow-lg group cursor-pointer" data-category="sep" onclick="openEventDossier(\'barriers\')"'
);

// Card 3: mfo (Insurance & Subscriptions)
eventsHtml = eventsHtml.replace(
  /<div class="event-item[^>]*" data-category="oct"[^>]*onclick="[^"]*vozvrat-strahovki[^"]*"/i,
  '<div class="event-item relative overflow-hidden bg-white/95 border border-[#E0E0E0] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-black/15 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 shadow-xs hover:shadow-lg group cursor-pointer" data-category="oct" onclick="openEventDossier(\'mfo\')"'
);

// Card 4: jkh_audit (Alabina 12)
eventsHtml = eventsHtml.replace(
  /<div class="event-item[^>]*" data-category="sep"[^>]*onclick="openJkhAuditModal\(\)"/i,
  '<div class="event-item relative overflow-hidden bg-white/95 border border-[#E0E0E0] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-black/15 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 shadow-xs hover:shadow-lg group cursor-pointer" data-category="sep" onclick="openEventDossier(\'jkh_audit\')"'
);

// Card 5: animal_aid
eventsHtml = eventsHtml.replace(
  /<div class="event-item[^>]*" data-category="nov"[^>]*onclick="openAnimalAidModal\(\)"/i,
  '<div class="event-item relative overflow-hidden bg-white/95 border border-[#E0E0E0] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-black/15 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 shadow-xs hover:shadow-lg group cursor-pointer" data-category="nov" onclick="openEventDossier(\'animal_aid\')"'
);

// Card 6: dog_park
eventsHtml = eventsHtml.replace(
  /<div class="event-item[^>]*" data-category="nov"[^>]*onclick="openDogParkModal\(\)"/i,
  '<div class="event-item relative overflow-hidden bg-white/95 border border-[#E0E0E0] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-black/15 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 shadow-xs hover:shadow-lg group cursor-pointer" data-category="nov" onclick="openEventDossier(\'dog_park\')"'
);

// Card 7: field_inspection
eventsHtml = eventsHtml.replace(
  /<div class="event-item[^>]*" data-category="nov"[^>]*onclick="openFieldInspectionModal\(\)"/i,
  '<div class="event-item relative overflow-hidden bg-white/95 border border-[#E0E0E0] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-black/15 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 shadow-xs hover:shadow-lg group cursor-pointer" data-category="nov" onclick="openEventDossier(\'field_inspection\')"'
);

fs.writeFileSync(eventsPath, eventsHtml, 'utf8');
console.log('Cleaned all cards and buttons in events.html to strictly open Event Dossiers!');

// 3. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading clean events.html to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(eventsPath, '/var/www/yug-pravo/events.html', () => {
      conn.exec('systemctl reload nginx', () => {
        console.log('EVENTS_CLEAN_DOSSIER_DEPLOYED_SUCCESSFULLY');
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
