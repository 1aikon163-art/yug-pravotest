const https = require('https');
const fs = require('fs');
const path = require('path');

function getEnvToken() {
  if (process.env.YANDEX_OAUTH_TOKEN) return process.env.YANDEX_OAUTH_TOKEN;
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const l of lines) {
        const t = l.trim();
        if (t.startsWith('YANDEX_OAUTH_TOKEN=')) {
          return t.split('=')[1].trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  } catch (_) {}
  return 'y0__wgBEMj8w6eq94ACGIzZSCDejcXwGIbok30JHZ-PhpACeJdCypWjLHnd';
}

class YandexDiskRegistry {
  constructor(token, diskPath) {
    this.token = token || getEnvToken();
    this.diskPath = diskPath || '/Юг-Право_Реестр/Реестр_обращений_2026.csv';
  }

  // Escape field for CSV with semicolon delimiter (Excel friendly)
  escapeCSV(field) {
    if (field === null || field === undefined) return '';
    const str = String(field).replace(/"/g, '""').replace(/\r?\n/g, ' ');
    if (str.includes(';') || str.includes('"') || str.includes(',') || str.includes('\n')) {
      return `"${str}"`;
    }
    return str;
  }

  // Helper to download content following 301/302 redirects
  downloadWithRedirects(url) {
    return new Promise((resolve) => {
      https.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return this.downloadWithRedirects(res.headers.location).then(resolve);
        }
        if (res.statusCode !== 200) {
          return resolve('');
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', () => resolve(''));
    });
  }

  // Download existing CSV or create new headers
  async getExistingContent() {
    return new Promise((resolve) => {
      const downloadPath = encodeURIComponent(this.diskPath);
      https.get(`https://cloud-api.yandex.net/v1/disk/resources/download?path=${downloadPath}`, {
        headers: { 'Authorization': 'OAuth ' + this.token }
      }, (res) => {
        if (res.statusCode !== 200) {
          // File does not exist yet
          return resolve('\uFEFF№ п/п;Дата и время (Самара);Номер дела;Статус обращения;Подразделение (Алиас);ФИО заявителя;Телефон;Email;Источник обращения;Суть вопроса;Правовая позиция / Решение юриста\n');
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', async () => {
          try {
            const downloadUrl = JSON.parse(data).href;
            if (!downloadUrl) {
              return resolve('\uFEFF№ п/п;Дата и время (Самара);Номер дела;Статус обращения;Подразделение (Алиас);ФИО заявителя;Телефон;Email;Источник обращения;Суть вопроса;Правовая позиция / Решение юриста\n');
            }
            const fileContent = await this.downloadWithRedirects(downloadUrl);
            resolve(fileContent || '\uFEFF№ п/п;Дата и время (Самара);Номер дела;Статус обращения;Подразделение (Алиас);ФИО заявителя;Телефон;Email;Источник обращения;Суть вопроса;Правовая позиция / Решение юриста\n');
          } catch (_) {
            resolve('\uFEFF№ п/п;Дата и время (Самара);Номер дела;Статус обращения;Подразделение (Алиас);ФИО заявителя;Телефон;Email;Источник обращения;Суть вопроса;Правовая позиция / Решение юриста\n');
          }
        });
      }).on('error', () => {
        resolve('\uFEFF№ п/п;Дата и время (Самара);Номер дела;Статус обращения;Подразделение (Алиас);ФИО заявителя;Телефон;Email;Источник обращения;Суть вопроса;Правовая позиция / Решение юриста\n');
      });
    });
  }

  // Append new row to Yandex Disk
  async appendLead(leadData) {
    if (!this.token) {
      console.warn('⚠️ [YandexDisk] No OAuth token configured');
      return false;
    }

    try {
      const headerRow = '\uFEFF№ п/п;Дата и время (Самара);Номер дела;Статус обращения;Подразделение (Алиас);ФИО заявителя;Телефон;Email;Источник обращения;Суть вопроса;Правовая позиция / Решение юриста\n';
      let currentContent = await this.getExistingContent();
      if (!currentContent || !currentContent.includes('Номер дела')) {
        currentContent = headerRow;
      }
      const lines = currentContent.trim().split('\n').filter(l => l.trim().length > 0);
      const rowNumber = lines.length;

      const now = new Date();
      const samaraTime = new Intl.DateTimeFormat('ru-RU', {
        timeZone: 'Europe/Samara',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(now);

      const caseNumber = leadData.caseId || `ЮП-26/ОБЩ-${String(rowNumber).padStart(4, '0')}`;

      const row = [
        rowNumber,
        samaraTime,
        caseNumber,
        '🟡 Зарегистрировано (Первичный анализ)',
        leadData.aliasName || leadData.alias || 'info@yugpravo.ru',
        this.escapeCSV(leadData.name),
        this.escapeCSV(leadData.phone),
        this.escapeCSV(leadData.email),
        this.escapeCSV(leadData.source || 'Сайт'),
        this.escapeCSV(leadData.message),
        ''
      ].join(';') + '\n';

      const updatedContent = currentContent.endsWith('\n') ? currentContent + row : currentContent + '\n' + row;
      const csvBuffer = Buffer.from(updatedContent, 'utf8');

      // 1. Загрузка обновленного CSV на Яндекс Диск
      await this.uploadBuffer(this.diskPath, csvBuffer, 'text/csv; charset=utf-8');
      console.log(`📊 [YandexDisk] CSV реестр обновлен: ${caseNumber} [${leadData.alias}]`);

      // 2. Генерация и загрузка премиального многостраничного XLSX
      try {
        const { generateMultiSheetWorkbook } = require('./excel-registry-generator.js');
        const parsedLeads = this.parseCSVToLeads(updatedContent);
        const xlsxBuffer = await generateMultiSheetWorkbook(parsedLeads);
        const xlsxPath = this.diskPath.replace(/\.csv$/i, '.xlsx');
        await this.uploadBuffer(xlsxPath, xlsxBuffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        console.log(`📑 [YandexDisk] Многостраничный XLSX (с вкладками по отделам) обновлен на Яндекс Диске!`);
      } catch (xlsxErr) {
        console.warn('⚠️ [YandexDisk] XLSX generation warning:', xlsxErr.message);
      }

      return true;

    } catch (err) {
      console.error('⚠️ [YandexDisk] appendLead Error:', err.message);
      return false;
    }
  }

  // Upload any buffer to Yandex Disk
  async uploadBuffer(diskFilePath, buffer, contentType = 'application/octet-stream') {
    return new Promise((resolve) => {
      const uploadPath = encodeURIComponent(diskFilePath);
      https.get(`https://cloud-api.yandex.net/v1/disk/resources/upload?path=${uploadPath}&overwrite=true`, {
        headers: { 'Authorization': 'OAuth ' + this.token }
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              if (parsed.error === 'DiskResourceLockedError') {
                console.warn(`⚠️ [YandexDisk] Файл ${diskFilePath} заблокирован (открыт во встроенном редакторе Яндекс Документов в браузере).`);
              } else {
                console.warn(`⚠️ [YandexDisk] Upload URL API error for ${diskFilePath}:`, parsed.message || parsed.error);
              }
              return resolve(false);
            }

            const uploadUrl = parsed.href;
            if (!uploadUrl) return resolve(false);

            const putReq = https.request(uploadUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': contentType,
                'Content-Length': buffer.length
              }
            }, (putRes) => {
              if (putRes.statusCode === 201 || putRes.statusCode === 200) {
                resolve(true);
              } else {
                console.warn(`⚠️ [YandexDisk] PUT status ${putRes.statusCode} for ${diskFilePath}`);
                resolve(false);
              }
            });

            putReq.on('error', (e) => {
              console.warn(`⚠️ [YandexDisk] PUT request error:`, e.message);
              resolve(false);
            });
            putReq.write(buffer);
            putReq.end();
          } catch (e) {
            console.warn(`⚠️ [YandexDisk] Parse upload response error:`, e.message);
            resolve(false);
          }
        });
      }).on('error', (e) => {
        console.warn(`⚠️ [YandexDisk] GET upload URL error:`, e.message);
        resolve(false);
      });
    });
  }

  // Create folder if not exists
  async createFolder(folderPath) {
    return new Promise((resolve) => {
      const pathParam = encodeURIComponent(folderPath);
      const req = https.request(`https://cloud-api.yandex.net/v1/disk/resources?path=${pathParam}`, {
        method: 'PUT',
        headers: { 'Authorization': 'OAuth ' + this.token }
      }, (res) => {
        resolve(res.statusCode === 201 || res.statusCode === 409); // 409 = already exists
      });
      req.on('error', () => resolve(false));
      req.end();
    });
  }

  // Save generated assignment file to Yandex Disk
  async saveAssignmentDocument(leadData, documentText) {
    if (!this.token) return false;
    try {
      await this.createFolder('/Юг-Право_Реестр');
      await this.createFolder('/Юг-Право_Реестр/Поручения_2026');
      const cleanCaseId = (leadData.caseId || 'ЮП-26').replace(/[\/\\:*?"<>|]/g, '_');
      const filePath = `/Юг-Право_Реестр/Поручения_2026/Поручение_${cleanCaseId}.txt`;
      const buffer = Buffer.from('\uFEFF' + (documentText || ''), 'utf8');
      await this.uploadBuffer(filePath, buffer, 'text/plain; charset=utf-8');
      console.log(`📑 [YandexDisk] Файл Заявления-поручения сохранен: ${filePath}`);
      return true;
    } catch (e) {
      console.warn('⚠️ [YandexDisk] saveAssignmentDocument error:', e.message);
      return false;
    }
  }

  // Parse CSV string into array of lead objects
  parseCSVToLeads(csvText) {
    const lines = csvText.trim().split('\n').filter(l => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const leads = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(';');
      if (cols.length >= 7) {
        leads.push({
          idx: cols[0] ? cols[0].trim() : String(i),
          date: cols[1] ? cols[1].trim() : '',
          caseId: cols[2] ? cols[2].trim() : '',
          status: cols[3] ? cols[3].trim() : '🟡 Зарегистрировано',
          alias: cols[4] ? cols[4].trim() : 'info@yugpravo.ru',
          name: (cols[5] || '').replace(/^"|"$/g, '').trim(),
          phone: (cols[6] || '').replace(/^"|"$/g, '').trim(),
          email: (cols[7] || '').replace(/^"|"$/g, '').trim(),
          source: (cols[8] || 'Сайт').replace(/^"|"$/g, '').trim(),
          message: (cols[9] || '').replace(/^"|"$/g, '').trim(),
          solution: (cols[10] || '').replace(/^"|"$/g, '').trim()
        });
      }
    }
    return leads;
  }
}

module.exports = YandexDiskRegistry;
