const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';
const eventsPath = path.join(rootDir, 'events.html');
let eventsHtml = fs.readFileSync(eventsPath, 'utf8');

// 1. Update Card 0 (Calculator Launch)
eventsHtml = eventsHtml.replace(
  /<div class="event-item[^>]*onclick="openPredefinedEvent\('calculator_launch'\)"/i,
  '<div class="event-item relative overflow-hidden bg-gradient-to-br from-white via-white to-[#FAF4E6]/60 border-2 border-[#C5A059]/50 rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-[#8C6826] transition-all duration-300 hover:scale-[1.005] hover:-translate-y-1 shadow-md hover:shadow-xl group cursor-pointer lg:col-span-2" data-category="sep" onclick="window.location.href=\'knowledge/legal-calculator-zapusk-proekta.html\'"'
);
eventsHtml = eventsHtml.replace(
  /<button class="font-bold uppercase text-\[#8C6826\] hover:text-\[#0F2439\] transition-colors inline-flex items-center gap-1">\s*Подробнее о проекте →\s*<\/button>/i,
  '<a href="knowledge/legal-calculator-zapusk-proekta.html" class="font-bold uppercase text-[#8C6826] hover:text-[#0F2439] transition-colors inline-flex items-center gap-1" onclick="event.stopPropagation();">Подробнее о проекте →</a>'
);

// 2. Update Card 1 (Cyber / Droppers)
eventsHtml = eventsHtml.replace(
  /<button class="font-bold uppercase text-\[#0F2439\] hover:text-\[#8C6826\] transition-colors inline-flex items-center gap-1">\s*Подробнее о докладе →\s*<\/button>/i,
  '<button type="button" class="font-bold uppercase text-[#0F2439] hover:text-[#8C6826] transition-colors inline-flex items-center gap-1" onclick="event.stopPropagation(); openPredefinedEvent(\'cyber\');">Подробнее о докладе →</button>'
);

// 3. Update Card 2 (MFO / PKO Audit 230-FZ)
eventsHtml = eventsHtml.replace(
  /<div class="event-item[^>]*onclick="openPredefinedEvent\('barriers'\)"/i,
  '<div class="event-item relative overflow-hidden bg-white/95 border border-[#E0E0E0] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-black/15 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 shadow-xs hover:shadow-lg group cursor-pointer" data-category="sep" onclick="window.location.href=\'knowledge/zashchita-ot-kollektorov-230-fz.html\'"'
);
eventsHtml = eventsHtml.replace(
  /<button class="font-bold uppercase text-\[#0F2439\] hover:text-\[#8C6826\] transition-colors inline-flex items-center gap-1">\s*Подробнее о докладе →\s*<\/button>/i,
  '<a href="knowledge/zashchita-ot-kollektorov-230-fz.html" class="font-bold uppercase text-[#0F2439] hover:text-[#8C6826] transition-colors inline-flex items-center gap-1" onclick="event.stopPropagation();">Подробнее о докладе →</a>'
);

// 4. Update Card 3 (MFO Insurance & Subscriptions 353-FZ)
eventsHtml = eventsHtml.replace(
  /<div class="event-item[^>]*onclick="openPredefinedEvent\('mfo'\)"/i,
  '<div class="event-item relative overflow-hidden bg-white/95 border border-[#E0E0E0] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-black/15 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 shadow-xs hover:shadow-lg group cursor-pointer" data-category="oct" onclick="window.location.href=\'knowledge/vozvrat-strahovki-period-ohlazhdeniya.html\'"'
);
eventsHtml = eventsHtml.replace(
  /<button class="font-bold uppercase text-\[#0F2439\] hover:text-\[#8C6826\] transition-colors inline-flex items-center gap-1">\s*Подробнее о докладе →\s*<\/button>/i,
  '<a href="knowledge/vozvrat-strahovki-period-ohlazhdeniya.html" class="font-bold uppercase text-[#0F2439] hover:text-[#8C6826] transition-colors inline-flex items-center gap-1" onclick="event.stopPropagation();">Подробнее о докладе →</a>'
);

// 5. Update Card 4 (JKH Audit Alabina 12)
eventsHtml = eventsHtml.replace(
  /<div class="event-item relative overflow-hidden bg-white\/95 border border-\[#E0E0E0\] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-black\/15 transition-all duration-300 hover:scale-\[1\.01\] hover:-translate-y-1 shadow-xs hover:shadow-lg group" data-category="sep">/i,
  '<div class="event-item relative overflow-hidden bg-white/95 border border-[#E0E0E0] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-black/15 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 shadow-xs hover:shadow-lg group cursor-pointer" data-category="sep" onclick="openJkhAuditModal()">'
);

// 6. Update Card 5 (Animal Aid)
eventsHtml = eventsHtml.replace(
  /<div class="event-item relative overflow-hidden bg-white\/95 border border-\[#E0E0E0\] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-black\/15 transition-all duration-300 hover:scale-\[1\.01\] hover:-translate-y-1 shadow-xs hover:shadow-lg group" data-category="nov">/i,
  '<div class="event-item relative overflow-hidden bg-white/95 border border-[#E0E0E0] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-black/15 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 shadow-xs hover:shadow-lg group cursor-pointer" data-category="nov" onclick="openAnimalAidModal()">'
);

// 7. Update Card 6 (Dog Park)
eventsHtml = eventsHtml.replace(
  /<div class="event-item relative overflow-hidden bg-white\/95 border border-\[#E0E0E0\] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-black\/15 transition-all duration-300 hover:scale-\[1\.01\] hover:-translate-y-1 shadow-xs hover:shadow-lg group" data-category="nov">/i,
  '<div class="event-item relative overflow-hidden bg-white/95 border border-[#E0E0E0] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-black/15 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 shadow-xs hover:shadow-lg group cursor-pointer" data-category="nov" onclick="openDogParkModal()">'
);

// 8. Update Card 7 (Field Inspection)
eventsHtml = eventsHtml.replace(
  /<div class="event-item relative overflow-hidden bg-white\/95 border border-\[#E0E0E0\] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-black\/15 transition-all duration-300 hover:scale-\[1\.01\] hover:-translate-y-1 shadow-xs hover:shadow-lg group" data-category="nov">/i,
  '<div class="event-item relative overflow-hidden bg-white/95 border border-[#E0E0E0] rounded-2xl p-7 sm:p-8 flex flex-col justify-between hover:border-black/15 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1 shadow-xs hover:shadow-lg group cursor-pointer" data-category="nov" onclick="openFieldInspectionModal()">'
);

fs.writeFileSync(eventsPath, eventsHtml, 'utf8');
console.log('Successfully connected all event cards to dedicated pages and interactive modals!');

// Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading updated events.html to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(eventsPath, '/var/www/yug-pravo/events.html', () => {
      conn.exec('systemctl reload nginx', () => {
        console.log('EVENTS_DEDICATED_PAGES_DEPLOYED_SUCCESSFULLY');
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
