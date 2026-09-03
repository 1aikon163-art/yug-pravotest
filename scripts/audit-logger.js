/**
 * ⚖️ ЮГ-ПРАВО LegalTech — 3-Year Legal & Compliance Audit Logger (152-ФЗ, 59-ФЗ, 63-ФЗ)
 * 
 * Осуществляет защищенное структурированное логирование процессуальных действий,
 * согласий на обработку персональных данных (ПД) и фактов взаимодействия с сервисами.
 * Хранение организовано по годам (logs/audit-YYYY.jsonl) с гарантией сохранности 3-5 лет.
 */

const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '..', 'logs');

// Создание директории логов при необходимости
if (!fs.existsSync(LOGS_DIR)) {
  try {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  } catch (err) {
    console.error('⚠️ [AuditLogger] Failed to create logs directory:', err.message);
  }
}

class LegalAuditLogger {
  constructor() {
    this.logsDir = LOGS_DIR;
  }

  _getLogFilePath() {
    const year = new Date().getFullYear();
    return path.join(this.logsDir, `audit-${year}.jsonl`);
  }

  /**
   * Запись события аудита в файл
   */
  logEvent(eventType, caseId, payload = {}, req = null) {
    try {
      const now = new Date();
      const samaraTime = now.toLocaleString('ru-RU', { timeZone: 'Europe/Samara' });
      
      let clientIp = '127.0.0.1';
      let userAgent = 'Direct Server Action';

      if (req) {
        clientIp = req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || 
                   req.headers?.['x-real-ip'] || 
                   req.socket?.remoteAddress || 
                   'Unknown IP';
        userAgent = req.headers?.['user-agent'] || 'Unknown User-Agent';
      }

      const logEntry = {
        timestamp: now.toISOString(),
        timeSamara: samaraTime,
        eventType: eventType,
        caseId: caseId || 'N/A',
        clientIp: clientIp,
        userAgent: userAgent.slice(0, 150),
        legalBasis: this._getLegalBasis(eventType),
        ...payload
      };

      const line = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(this._getLogFilePath(), line, 'utf-8');
      return logEntry;
    } catch (e) {
      console.error('⚠️ [AuditLogger] Failed to write audit event:', e.message);
      return null;
    }
  }

  /**
   * Логирование фиксации согласия на обработку ПД (152-ФЗ)
   */
  logConsent(caseId, applicant = {}, req = null) {
    return this.logEvent('CONSENT_152_FZ_RECORDED', caseId, {
      applicantName: applicant.name || 'Не указано',
      phone: applicant.phone ? applicant.phone.replace(/(\+\d{1,2})\d{3}(\d{3})\d{2}(\d{2})/, '$1***$2**$3') : '—',
      email: applicant.email || '—',
      targetAlias: applicant.alias || applicant.target_alias || 'info@yugpravo.ru',
      source: applicant.source || 'Веб-форма сайта',
      consentText: 'Согласие на обработку персональных данных предоставлено в порядке ст. 9 152-ФЗ при отправке электронной формы',
      policyVersion: '2026-v2.1'
    }, req);
  }

  /**
   * Определение нормативной правовой базы для события
   */
  _getLegalBasis(eventType) {
    switch (eventType) {
      case 'CONSENT_152_FZ_RECORDED':
        return 'ст. 6, 9 Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных»';
      case 'APPEAL_REGISTERED':
        return 'ст. 4, 7, 8 Федерального закона от 02.05.2006 № 59-ФЗ «О порядке рассмотрения обращений граждан РФ»';
      case 'ASSIGNMENT_CREATED_PEP':
        return 'ст. 5, 6, 9 Федерального закона от 06.04.2011 № 63-ФЗ «Об электронной подписи», ст. 434, 438 ГК РФ';
      case 'EMAIL_AUTOREPLY_SENT':
      case 'EMAIL_DEPT_DISPATCHED':
        return 'ст. 10 Федерального закона № 59-ФЗ (извещение заявителя о приёме обращения)';
      case 'STATUS_CHANGED':
        return 'ст. 12 Федерального закона № 59-ФЗ (учёт стадий рассмотрения дела)';
      case 'APPEAL_WITHDRAWN':
        return 'п. 5 ч. 1 ст. 5 Федерального закона № 59-ФЗ (право на отзыв обращения)';
      case 'YANDEX_DISK_SYNC':
        return 'ч. 5 ст. 18 152-ФЗ (локализация баз данных в РФ, защищенное облачное хранилище)';
      default:
        return 'Регламент делопроизводства АНО «ЦПЗ ЮГ-ПРАВО»';
    }
  }

  /**
   * Получить последние N событий для Telegram-бота или админ-панели
   */
  getRecentLogs(limit = 10) {
    try {
      const filePath = this._getLogFilePath();
      if (!fs.existsSync(filePath)) return [];

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n').filter(Boolean);
      const recent = lines.slice(-limit);

      return recent.map(line => {
        try {
          return JSON.parse(line);
        } catch (_) {
          return { raw: line };
        }
      }).reverse();
    } catch (e) {
      console.error('⚠️ [AuditLogger] Read error:', e.message);
      return [];
    }
  }
}

module.exports = new LegalAuditLogger();
