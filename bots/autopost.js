/**
 * 📢 АНО «ЮГ-ПРАВО» — Робот-автопостинг (@repostchilli_bot)
 * Публикация правовых памяток, статей и карточек в Telegram-канал
 */

const https = require('https');
const path = require('path');
const fs = require('fs');

const envPath = path.join(__dirname, '.env');
const envConfig = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const l of lines) {
    const trimmed = l.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        envConfig[key] = val;
      }
    }
  }
}

const REPOST_TOKEN = envConfig.TELEGRAM_REPOST_BOT_TOKEN || "6029712671:AAHbEAc9fluU8mHYeu56ujaqJ5fDEY-It_I";
const ADMIN_ID = envConfig.ADMIN_CHAT_ID ? parseInt(envConfig.ADMIN_CHAT_ID, 10) : 306883501;
const SITE_URL = envConfig.WEB_APP_URL || "https://1aikon163-art.github.io/yug-pravotest/";

// Готовые профессиональные посты для публикации
const posts = [
  {
    title: "⚖️ Залив квартиры: что делать в первые 3 часа?",
    text: `🏢 <b>Залив квартиры: пошаговая инструкция для жильцов Самары</b>\n\n` +
      `Если вас залили соседи сверху или лопнул общедомовой стояк отопления — действуйте строго по закону:\n\n` +
      `1️⃣ <b>Обесточьте квартиру</b> и вызовите аварийную службу вашей УК (зафиксируйте номер заявки и время звонка).\n` +
      `2️⃣ <b>Сделайте подробную фото- и видеосъемку</b> всех повреждений (потолок, стены, ламинат, мебель, бытовая техника).\n` +
      `3️⃣ <b>Требуйте составления Акта о заливе в течение 12 часов</b> (*п. 152 Правил № 354*). В акте обязательно должна быть указана причина залива!\n` +
      `4️⃣ <b>Проведите независимую оценку ущерба</b> и направьте досудебную претензию виновнику.\n\n` +
      `💡 <i>Юристы АНО «ЮГ-ПРАВО» бесплатно проанализируют ваш акт и помогут взыскать 100% ущерба + штраф 50% с виновника!</i>\n\n` +
      `👉 <b>Подробнее читайте на нашем портале:</b>\n${SITE_URL}knowledge/zaliv-kvartiry-akt-uk.html\n\n` +
      `#ЖКХ #ЗаливКвартиры #ЮристСамара #ЮгПраво #ПравоваяЗащита`
  },
  {
    title: "🛡️ Коллекторы нарушают закон? Как поставить их на место по 230-ФЗ",
    text: `🛑 <b>Защита прав должников: что запрещено коллекторам по 230-ФЗ</b>\n\n` +
      `Коллекторы и службы взыскания МФО часто переходят границы закона. Запомните ваши права:\n\n` +
      `❌ <b>Запрещено звонить:</b> чаще 1 раза в сутки, 2 раз в неделю и 8 раз в месяц.\n` +
      `❌ <b>Запрещено беспокоить ночью:</b> в будни с 22:00 до 08:00, в выходные с 20:00 до 09:00.\n` +
      `❌ <b>Запрещено звонить родственникам и на работу:</b> без их письменного согласия.\n` +
      `❌ <b>Запрещены угрозы и психологическое давление:</b> влечет штрафы до 500 000 ₽ по ст. 14.57 КоАП РФ и уголовную ответственность по ст. 172.4 УК РФ!\n\n` +
      `👉 <b>Как составить отказ от взаимодействия с коллекторами:</b>\n${SITE_URL}knowledge/kollektory-230-fz-zashchita-prav.html\n\n` +
      `#Кредиты #Коллекторы #230ФЗ #ЮгПраво #ЗащитаДолжников`
  },
  {
    title: "🐾 Проект «Добрая лапа»: права животных по закону № 498-ФЗ",
    text: `🐕 <b>Проект защиты животных «Добрая лапа» АНО «ЮГ-ПРАВО»</b>\n\n` +
      `Животные — не вещи, они способны испытывать боль и страдания (*ст. 137 ГК РФ, 498-ФЗ*).\n\n` +
      `🏛️ Наша команда ведет общественный надзор:\n` +
      `• Проверка муниципальных контрактов на отлов и стерилизацию (ОСВВ);\n` +
      `• Фиксация нарушений в ветклиниках и пунктах временного содержания;\n` +
      `• Направление заявлений в МВД и Прокуратуру по фактам жестокого обращения (*ст. 245 УК РФ*);\n` +
      `• Помощь волонтёрам и передержкам кормами и лечением.\n\n` +
      `👉 <b>Поддержите проект «Добрая лапа» или сообщите о нарушении:</b>\n${SITE_URL}initiatives.html\n\n` +
      `#ДобраяЛапа #ЗащитаЖивотных #498ФЗ #АНОЮгПраво #Самара`
  }
];

function sendPost(chatId, text) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
      disable_web_page_preview: false
    });

    const req = https.request(`https://api.telegram.org/bot${REPOST_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ ok: false, error: e.message });
        }
      });
    });
    req.on('error', (err) => resolve({ ok: false, error: err.message }));
    req.write(payload);
    req.end();
  });
}

async function runAutopost() {
  console.log("=== RUNNING AUTOPOST SYSTEM ===");
  // Отправляем тестовый пост администратору
  const samplePost = posts[0];
  console.log(`Sending sample post: "${samplePost.title}" to Admin (ID: ${ADMIN_ID})...`);
  const res = await sendPost(ADMIN_ID, samplePost.text);
  console.log("Autopost Result:", res.ok ? "SUCCESS (Message sent to Telegram!)" : res);
}

runAutopost();
