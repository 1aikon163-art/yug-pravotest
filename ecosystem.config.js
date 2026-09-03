/**
 * PM2 Production Ecosystem Configuration for АНО «ЮГ-ПРАВО»
 * Запуск: pm2 start ecosystem.config.js
 * Сохранение автозапуска: pm2 save && pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'yug-pravo-web',
      script: './server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 8080,
        // T-Bank Acquiring: UG-PRAVO terminal
        TBANK_TERMINAL_KEY: process.env.TBANK_TERMINAL_KEY || '1787835813888',
        TBANK_PASSWORD:     process.env.TBANK_PASSWORD     || 'e6Qyo#F71Q#jH3fy',
        // Russian Trusted CA (НУЦ Минцифры России)
        NODE_EXTRA_CA_CERTS: './certs/russian-trusted-ca-bundle.pem'
      }
    },
    {
      name: 'bot-main-ugpravo',
      script: './bots/main-bot.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
