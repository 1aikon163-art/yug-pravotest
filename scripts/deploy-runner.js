/**
 * Automated Remote Deployment Runner via SSH2
 * Connects to Beget VPS (82.202.129.126), uploads deploy archive & setup script, executes installation.
 */

const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG = {
  host: '82.202.129.126',
  port: 22,
  username: 'root',
  password: process.env.SERVER_PASS || '4EuSRg&!W525'
};

console.log(`🔌 Подключение к серверу ${CONFIG.host} по SSH...`);

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH Соединение успешно установлено!');

  // Read local SSH public key if exists to install it on the server for passwordless login
  let pubKey = '';
  const pubKeyPath = path.join(os.homedir(), '.ssh', 'id_rsa.pub');
  if (fs.existsSync(pubKeyPath)) {
    pubKey = fs.readFileSync(pubKeyPath, 'utf8').trim();
  }

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('❌ Ошибка инициализации SFTP:', err);
      conn.end();
      return;
    }

    console.log('📦 Загрузка архива проекта deploy.tar.gz на сервер (/tmp/yug-pravo-deploy.tar.gz)...');
    
    const localArchive = path.join(__dirname, '..', 'deploy.tar.gz');
    const remoteArchive = '/tmp/yug-pravo-deploy.tar.gz';

    sftp.fastPut(localArchive, remoteArchive, (err) => {
      if (err) {
        console.error('❌ Ошибка загрузки архива:', err);
        conn.end();
        return;
      }
      console.log('✅ Архив успешно загружен (50 МБ)!');

      console.log('📜 Загрузка установочного скрипта setup-server.sh...');
      const localScript = path.join(__dirname, 'setup-server.sh');
      const remoteScript = '/tmp/setup-server.sh';

      sftp.fastPut(localScript, remoteScript, (err) => {
        if (err) {
          console.error('❌ Ошибка загрузки setup-server.sh:', err);
          conn.end();
          return;
        }

        console.log('🚀 Запуск настройки сервера и развертывания проектов...');

        let setupCommand = 'chmod +x /tmp/setup-server.sh && /tmp/setup-server.sh';
        if (pubKey) {
          setupCommand = `mkdir -p /root/.ssh && chmod 700 /root/.ssh && echo "${pubKey}" >> /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys && ${setupCommand}`;
        }

        conn.exec(setupCommand, (err, stream) => {
          if (err) {
            console.error('❌ Ошибка выполнения команды:', err);
            conn.end();
            return;
          }

          stream.on('close', (code, signal) => {
            console.log(`\n🏁 Установка завершена с кодом: ${code}`);
            conn.end();
          }).on('data', (data) => {
            process.stdout.write(data);
          }).stderr.on('data', (data) => {
            process.stderr.write(data);
          });
        });
      });
    });
  });
}).on('error', (err) => {
  console.error('❌ Ошибка SSH подключения:', err.message);
}).connect(CONFIG);
