/**
 * ⚖️ АНО «ЦПЗ ЮГ-ПРАВО» — Единый менеджер учета обращений, договоров и сопровождения
 * Интегрирован с Журналом канцелярии (Excel на Яндекс.Диске) и Telegram-ботом (@ugpravo_assistant_bot)
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const APPEALS_FILE = path.join(DATA_DIR, 'appeals.json');

// Обеспечиваем наличие директории data
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Загрузка базы данных
function loadAppealsDb() {
  if (!fs.existsSync(APPEALS_FILE)) {
    fs.writeFileSync(APPEALS_FILE, JSON.stringify({ appeals: [] }, null, 2), 'utf-8');
  }
  try {
    return JSON.parse(fs.readFileSync(APPEALS_FILE, 'utf-8'));
  } catch (e) {
    console.error('⚠️ [AppealsManager] DB parse error:', e.message);
    return { appeals: [] };
  }
}

// Сохранение базы данных
function saveAppealsDb(db) {
  try {
    fs.writeFileSync(APPEALS_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('⚠️ [AppealsManager] DB save error:', e.message);
  }
}

// Очистка и нормализация номера телефона (+79XXXXXXXXX)
function normalizePhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return '+7' + digits.substring(1);
  } else if (digits.length === 10) {
    return '+7' + digits;
  }
  return phone.trim();
}

// Определение типа документа и читаемого названия
function detectDocType(caseId, alias, direction) {
  const cid = (caseId || '').toUpperCase();
  const al = (alias || '').toLowerCase();
  const dir = (direction || '').toLowerCase();

  if (cid.startsWith('ДОГ') || dir.includes('договор') || al.includes('care') || al.includes('partner')) {
    return { type: 'contract', label: 'Договор', prefix: '📜' };
  }
  if (cid.startsWith('СПР') || dir.includes('поручение') || dir.includes('калькулятор') || al.includes('sud')) {
    return { type: 'service', label: 'Сопровождение', prefix: '🛡️' };
  }
  if (cid.startsWith('ЖКХ') || dir.includes('жкх') || al.includes('jkh')) {
    return { type: 'audit', label: 'Аудит ЖКХ', prefix: '🏢' };
  }
  if (cid.startsWith('ИН') || dir.includes('инициатива') || al.includes('idea')) {
    return { type: 'initiative', label: 'Инициатива', prefix: '💡' };
  }
  return { type: 'appeal', label: 'Обращение', prefix: '📩' };
}

// Статусы и их читаемые названия
const STATUS_MAP = {
  'REGISTERED': { text: '⏳ Принято канцелярией', badge: '⏳ Зарегистрировано' },
  'IN_PROGRESS': { text: '🟡 В работе у специалиста', badge: '🟡 В работе' },
  'DOC_READY': { text: '📄 Подготовлен процессуальный документ', badge: '📄 Документ готов' },
  'IN_COURT': { text: '⚖️ Дело передано в судебную инстанцию', badge: '⚖️ В суде' },
  'COMPLETED': { text: '🟢 Исполнено / Завершено', badge: '🟢 Завершено' },
  'WITHDRAWN': { text: '🚫 Отозвано заявителем', badge: '🚫 Отозвано' }
};

class AppealsManager {
  /**
   * Регистрация или обновление обращения/договора/сопровождения
   */
  createOrUpdateAppeal(data) {
    const db = loadAppealsDb();
    const caseId = data.caseId || `ОБР-${Date.now().toString().slice(-4)}`;
    const phoneNorm = normalizePhone(data.phone);

    const docTypeInfo = detectDocType(caseId, data.alias || data.target_alias, data.direction || data.source);

    let existingIdx = db.appeals.findIndex(a => a.caseId === caseId);
    const nowStr = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Samara' });

    const appealEntry = {
      caseId: caseId,
      docType: docTypeInfo.type,
      docTypeLabel: docTypeInfo.label,
      docPrefix: docTypeInfo.prefix,
      name: data.name || 'Не указано',
      phone: data.phone || '—',
      phoneNorm: phoneNorm,
      email: data.email || '—',
      alias: data.alias || data.target_alias || 'info@yugpravo.ru',
      direction: data.direction || '—',
      message: data.message || data.details || '—',
      source: data.source || 'Сайт yugpravo.ru',
      status: data.status || 'REGISTERED',
      statusText: STATUS_MAP[data.status || 'REGISTERED'].text,
      assignedSpecialist: data.assignedSpecialist || 'Специалист канцелярии АНО «ЮГ-ПРАВО»',
      telegramId: data.telegramId || null,
      telegramUsername: data.telegramUsername || null,
      messages: data.messages || [],
      createdAt: data.createdAt || nowStr,
      updatedAt: nowStr
    };

    if (existingIdx !== -1) {
      // Сохраняем уже привязанный telegramId если в новых данных его нет
      if (!appealEntry.telegramId && db.appeals[existingIdx].telegramId) {
        appealEntry.telegramId = db.appeals[existingIdx].telegramId;
        appealEntry.telegramUsername = db.appeals[existingIdx].telegramUsername;
      }
      if (db.appeals[existingIdx].messages && db.appeals[existingIdx].messages.length > 0 && appealEntry.messages.length === 0) {
        appealEntry.messages = db.appeals[existingIdx].messages;
      }
      db.appeals[existingIdx] = { ...db.appeals[existingIdx], ...appealEntry };
    } else {
      db.appeals.push(appealEntry);
    }

    saveAppealsDb(db);

    // Фоновая запись в Журнал Канцелярии (Excel)
    try {
      const registryManager = require('./registry-manager.js');
      registryManager.appendIncomingEntry({
        inNumber: caseId,
        department: docTypeInfo.label + ' / ' + (data.alias || 'Общая приёмная'),
        relatedCase: caseId,
        from: (data.name || 'Заявитель') + ' (' + (data.phone || '—') + ')',
        subject: data.message ? data.message.slice(0, 100) : docTypeInfo.label,
        summary: data.message || '—',
        status: appealEntry.statusText
      }).catch(e => console.warn('⚠️ [AppealsManager] Excel sync warning:', e.message));
    } catch (err) {
      console.warn('⚠️ [AppealsManager] Registry manager require error:', err.message);
    }

    return appealEntry;
  }

  /**
   * Получить обращение по номеру (поддерживает точный номер, транслит и 4-значный код)
   */
  getAppeal(caseId) {
    if (!caseId) return null;
    const db = loadAppealsDb();
    const cleanId = String(caseId).trim().toUpperCase();

    // 1. Прямое совпадение
    let found = db.appeals.find(a => a.caseId.toUpperCase() === cleanId);
    if (found) return found;

    // 2. Очищенное сравнение (без знаков препинания)
    const normSearch = cleanId.replace(/[^A-Za-zА-Яа-я0-9]/g, '');
    found = db.appeals.find(a => a.caseId.replace(/[^A-Za-zА-Яа-я0-9]/g, '').toUpperCase() === normSearch);
    if (found) return found;

    // 3. Сравнение по 4-значному цифровому коду в конце (например, 9704)
    const digitsOnly = cleanId.replace(/\D/g, '');
    if (digitsOnly.length >= 4) {
      const last4 = digitsOnly.slice(-4);
      found = db.appeals.find(a => a.caseId.endsWith(last4));
      if (found) return found;
    }

    return null;
  }

  /**
   * Получить все обращения по Telegram ID
   */
  getAppealsByTelegramId(telegramId) {
    if (!telegramId) return [];
    const db = loadAppealsDb();
    const tid = String(telegramId);
    return db.appeals.filter(a => String(a.telegramId) === tid);
  }

  /**
   * Найти обращения по номеру телефона и привязать к Telegram ID
   */
  getAndLinkAppealsByPhone(phone, telegramId, username = '') {
    const norm = normalizePhone(phone);
    if (!norm) return [];

    const db = loadAppealsDb();
    const matched = [];

    for (const a of db.appeals) {
      if (a.phoneNorm === norm || (a.phone && normalizePhone(a.phone) === norm)) {
        if (!a.telegramId && telegramId) {
          a.telegramId = telegramId;
          a.telegramUsername = username || a.telegramUsername;
          a.updatedAt = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Samara' });
        }
        matched.push(a);
      }
    }

    if (matched.length > 0) {
      saveAppealsDb(db);
    }
    return matched;
  }

  /**
   * Привязать Telegram ID к конкретному номеру обращения
   */
  linkTelegramToAppeal(caseId, telegramId, username = '', firstName = '') {
    const db = loadAppealsDb();
    const appeal = this.getAppeal(caseId);
    if (!appeal) return null;

    const idx = db.appeals.findIndex(a => a.caseId === appeal.caseId);
    if (idx !== -1) {
      db.appeals[idx].telegramId = telegramId;
      if (username) db.appeals[idx].telegramUsername = username;
      if (firstName && (!db.appeals[idx].name || db.appeals[idx].name === 'Не указано')) {
        db.appeals[idx].name = firstName;
      }
      db.appeals[idx].updatedAt = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Samara' });
      saveAppealsDb(db);
      return db.appeals[idx];
    }
    return null;
  }

  /**
   * Изменение статуса дела специалистом
   */
  updateStatus(caseId, newStatus, note = '', specialistName = 'Специалист АНО «ЮГ-ПРАВО»') {
    const db = loadAppealsDb();
    const appeal = this.getAppeal(caseId);
    if (!appeal) return null;

    const idx = db.appeals.findIndex(a => a.caseId === appeal.caseId);
    if (idx !== -1) {
      db.appeals[idx].status = newStatus;
      db.appeals[idx].statusText = STATUS_MAP[newStatus]?.text || newStatus;
      db.appeals[idx].assignedSpecialist = specialistName;
      if (note) {
        db.appeals[idx].statusNote = note;
      }
      db.appeals[idx].updatedAt = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Samara' });
      saveAppealsDb(db);
      return db.appeals[idx];
    }
    return null;
  }

  /**
   * Отзыв обращения заявителем по 59-ФЗ
   */
  withdrawAppeal(caseId, telegramId, reason = 'По инициативе заявителя') {
    const db = loadAppealsDb();
    const appeal = this.getAppeal(caseId);
    if (!appeal) return { success: false, error: 'Обращение не найдено' };

    // Проверка прав (только владелец по telegramId или админ может отозвать)
    if (appeal.telegramId && String(appeal.telegramId) !== String(telegramId)) {
      return { success: false, error: 'Нет прав на отзыв данного документа' };
    }

    const idx = db.appeals.findIndex(a => a.caseId === appeal.caseId);
    if (idx !== -1) {
      db.appeals[idx].status = 'WITHDRAWN';
      db.appeals[idx].statusText = '🚫 Отозвано заявителем (ст. 5 59-ФЗ)';
      db.appeals[idx].withdrawReason = reason;
      db.appeals[idx].updatedAt = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Samara' });
      saveAppealsDb(db);
      return { success: true, appeal: db.appeals[idx] };
    }
    return { success: false, error: 'Ошибка сохранения' };
  }

  /**
   * Добавить сообщение в переписку по обращению
   */
  addMessage(caseId, senderType, senderName, text) {
    const db = loadAppealsDb();
    const appeal = this.getAppeal(caseId);
    if (!appeal) return null;

    const idx = db.appeals.findIndex(a => a.caseId === appeal.caseId);
    if (idx !== -1) {
      const msgObj = {
        id: (db.appeals[idx].messages?.length || 0) + 1,
        senderType: senderType, // 'specialist' или 'applicant'
        senderName: senderName,
        text: text,
        date: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Samara' })
      };
      if (!db.appeals[idx].messages) db.appeals[idx].messages = [];
      db.appeals[idx].messages.push(msgObj);
      db.appeals[idx].updatedAt = msgObj.date;
      saveAppealsDb(db);
      return { appeal: db.appeals[idx], message: msgObj };
    }
    return null;
  }
}

module.exports = new AppealsManager();
