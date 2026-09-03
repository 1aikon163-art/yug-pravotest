/**
 * 🚀 АНО «ЮГ-ПРАВО» — Единый менеджер запуска всей экосистемы ботов
 * Одновременный запуск 5 сервисов:
 * 1. @ugpravo_assistant_bot (Главный ассистент и консультации)
 * 2. @ugpravo_help_bot (Народный аудит ЖКХ)
 * 3. @Samara_promo_bot (Проект защиты животных «Добрая лапа»)
 * 4. @repostchilli_bot (ИнфоПоток & ИИ-рерайтер)
 * 5. VK Community Bot (Сообщество ВКонтакте 112146607)
 */

const { spawn } = require('child_process');
const path = require('path');

console.log("=========================================");
console.log("🤖 ЗАПУСК ВСЕХ 5 БОТОВ АНО «ЮГ-ПРАВО»...");
console.log("=========================================");

const bots = [
  { name: "MainBot (@ugpravo_assistant_bot)", file: "main-bot.js" },
  { name: "JkhBot (@ugpravo_help_bot)", file: "jkh-bot.js" },
  { name: "LapaBot (@Samara_promo_bot)", file: "lapa-bot.js" },
  { name: "InfoBot (@repostchilli_bot)", file: "infobot.js" },
  { name: "VkBot (ВКонтакте 112146607)", file: "vk-bot.js" }
];

const runningProcesses = [];

bots.forEach(b => {
  const p = spawn('node', [path.join(__dirname, b.file)], { stdio: 'inherit' });
  p.on('close', (code) => console.log(`[${b.name}] остановлен с кодом: ${code}`));
  runningProcesses.push(p);
});

process.on('SIGINT', () => {
  console.log("Остановка всех сервисов ботов...");
  runningProcesses.forEach(p => p.kill());
  process.exit();
});
