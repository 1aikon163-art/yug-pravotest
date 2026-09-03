const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

const allPages = [
  'index.html',
  'about.html',
  'calculator.html',
  'events.html',
  'initiatives.html',
  'knowledge.html',
  'disclosure.html'
];

const mobileWideClasses = `class="absolute inset-0 md:right-0 md:top-0 h-full w-full object-contain md:object-cover object-center md:object-right opacity-35 md:opacity-45 mix-blend-multiply pointer-events-none scale-[0.72] sm:scale-[0.85] md:scale-100 origin-center md:origin-right [mask-image:radial-gradient(ellipse_at_center,black_65%,transparent_100%)] md:[mask-image:radial-gradient(ellipse_at_70%_50%,black_30%,transparent_80%)] md:[-webkit-mask-image:radial-gradient(ellipse_at_70%_50%,black_30%,transparent_80%)]"`;

allPages.forEach(file => {
  const p = path.join(rootDir, file);
  if (!fs.existsSync(p)) return;

  let html = fs.readFileSync(p, 'utf8');

  // Replace class attribute inside hero video
  html = html.replace(
    /(<(?:video|canvas)\s+id=["'][^"']*hero-video["'][^>]*?)class=["'][^"']*["']/i,
    `$1${mobileWideClasses}`
  );
  html = html.replace(
    /(<(?:video|canvas)\s+id=["']hands-video["'][^>]*?)class=["'][^"']*["']/i,
    `$1${mobileWideClasses}`
  );

  fs.writeFileSync(p, html, 'utf8');
  console.log(`Applied wide mobile framing (scale 0.72) to ${file}`);
});

// Upload all updated HTML files to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading wide mobile framing for all pages to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    let count = 0;
    allPages.forEach(file => {
      sftp.fastPut(path.join(rootDir, file), `/var/www/yug-pravo/${file}`, () => {
        count++;
        if (count === allPages.length) {
          conn.exec('systemctl reload nginx', () => {
            console.log('ALL_PAGES_MOBILE_WIDE_FRAMING_DEPLOYED_SUCCESSFULLY');
            conn.end();
          });
        }
      });
    });
  });
}).connect({
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
});
