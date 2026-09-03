const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const rootDir = __dirname + '/..';

// 1. Clean contacts.html form
const contactsPath = path.join(rootDir, 'contacts.html');
let contactsHtml = fs.readFileSync(contactsPath, 'utf8');

// Replace corrupted form line
contactsHtml = contactsHtml.replace(
  /<form class="space-y-5"[\s\S]*?onsubmit="return false;">[\s\S]*?">/i,
  '<form id="reception-form" class="space-y-5" onsubmit="event.preventDefault();">'
);

fs.writeFileSync(contactsPath, contactsHtml, 'utf8');
console.log('Cleaned contacts.html form structure!');

// 2. Upload to VPS
const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected. Uploading clean contacts.html to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    sftp.fastPut(contactsPath, '/var/www/yug-pravo/contacts.html', () => {
      conn.exec('systemctl reload nginx', () => {
        console.log('CONTACTS_FORM_FIX_DEPLOYED_SUCCESSFULLY');
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
