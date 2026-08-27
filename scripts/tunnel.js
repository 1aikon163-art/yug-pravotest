const { spawn } = require('child_process');
const qrcode = require('qrcode-terminal');

console.log('\n======================================================');
console.log('⏳ СОЗДАНИЕ ПУБЛИЧНОЙ HTTPS-ССЫЛКИ ДЛЯ ТЕСТИРОВАНИЯ...');
console.log('======================================================');

const ssh = spawn('ssh', [
  '-o', 'StrictHostKeyChecking=no',
  '-o', 'ServerAliveInterval=30',
  '-o', 'ServerAliveCountMax=3',
  '-R', '80:localhost:8080',
  'nokey@localhost.run'
]);

let urlFound = false;

ssh.stdout.on('data', (data) => {
  const text = data.toString();
  const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.lhr\.life/);
  
  if (match && !urlFound) {
    urlFound = true;
    const url = match[0];
    
    console.log('\n======================================================');
    console.log('🚀 ВАШ САЙТ УСПЕШНО ОПУБЛИКОВАН В ИНТЕРНЕТЕ!');
    console.log('======================================================');
    console.log('\n🔗 Ссылка для отправки друзьям (открывается прямо в браузере/Telegram):');
    console.log('👉 \x1b[32m\x1b[1m' + url + '\x1b[0m\n');
    console.log('📱 QR-код для моментального сканирования камерой смартфона:');
    
    qrcode.generate(url, { small: true });

    console.log('======================================================');
    console.log('✅ Туннель активен. Сайт транслируется онлайн.');
    console.log('======================================================\n');
  }
});

ssh.stderr.on('data', (data) => {
  // Silent log or debug
});

ssh.on('close', (code) => {
  console.log('\nТуннель завершил работу (код ' + code + ').');
});
