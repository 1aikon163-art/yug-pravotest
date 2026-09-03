const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const https = require('https');

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

class RegistryManager {
  constructor() {
    this.token = getEnvToken();
    this.diskExcelPath = '/_БАЗА_ЗНАНИЙ_ЮГ_ПРАВО/НКО ЮГ ПРАВО/ЖУРНАЛ_КАНЦЕЛЯРИИ_2026.xlsx';
    this.localExcelPath = path.join(__dirname, '..', 'docs', 'ЖУРНАЛ_КАНЦЕЛЯРИИ_2026.xlsx');
  }

  async uploadToYandexDisk(buffer, remotePath) {
    return new Promise((resolve, reject) => {
      // 1. Get upload link
      const getUrl = `https://cloud-api.yandex.net/v1/disk/resources/upload?path=${encodeURIComponent(remotePath)}&overwrite=true`;
      const req = https.get(getUrl, {
        headers: { 'Authorization': `OAuth ${this.token}` }
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (!json.href) {
              return resolve({ success: false, error: json.message || 'No upload link' });
            }

            // 2. Upload binary buffer via PUT
            const uploadReq = https.request(json.href, {
              method: 'PUT',
              headers: {
                'Content-Length': buffer.length,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              }
            }, (upRes) => {
              if (upRes.statusCode === 201 || upRes.statusCode === 200 || upRes.statusCode === 202) {
                resolve({ success: true });
              } else {
                resolve({ success: false, status: upRes.statusCode });
              }
            });

            uploadReq.on('error', (err) => resolve({ success: false, error: err.message }));
            uploadReq.write(buffer);
            uploadReq.end();

          } catch (e) {
            resolve({ success: false, error: e.message });
          }
        });
      });
      req.on('error', (err) => resolve({ success: false, error: err.message }));
    });
  }

  async loadOrCreateWorkbook() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'АНО «ЦПЗ ЮГ-ПРАВО» — Канцелярия';
    workbook.lastModifiedBy = 'Secretary AI Bot';
    workbook.created = new Date();
    workbook.modified = new Date();

    if (fs.existsSync(this.localExcelPath)) {
      try {
        await workbook.xlsx.readFile(this.localExcelPath);
        return workbook;
      } catch (_) {}
    }

    // Создаем свежий структурированный журнал
    this.initSheets(workbook);
    return workbook;
  }

  initSheets(workbook) {
    // ─── ЛИСТ 1: ВХОДЯЩАЯ КОРРЕСПОНДЕНЦИЯ ──────────────────────────────────
    let sheetIn = workbook.getWorksheet('Входящая корреспонденция');
    if (!sheetIn) {
      sheetIn = workbook.addWorksheet('Входящая корреспонденция', {
        pageSetup: { orientation: 'landscape', paperSize: 9 }
      });

      sheetIn.columns = [
        { header: '№ п/п', key: 'id', width: 8 },
        { header: 'Вх. дата', key: 'date', width: 14 },
        { header: 'Вх. № АНО', key: 'inNumber', width: 20 },
        { header: 'Ведомство / Организация', key: 'senderOrg', width: 28 },
        { header: 'Связанное дело / ИП / Цепочка', key: 'relatedCase', width: 30 },
        { header: 'Отправитель (Email / ФИО)', key: 'senderContact', width: 28 },
        { header: 'Исх. № док.', key: 'outNumber', width: 16 },
        { header: 'Тема / Предмет', key: 'subject', width: 34 },
        { header: 'Краткая суть фабулы', key: 'summary', width: 45 },
        { header: 'Вложения (файлы)', key: 'attachments', width: 26 },
        { header: 'Дедлайн / Срок ответа', key: 'deadline', width: 20 },
        { header: 'Статус', key: 'status', width: 18 },
        { header: 'Папка на Яндекс Диске', key: 'folderPath', width: 35 }
      ];

      const headerRow = sheetIn.getRow(1);
      headerRow.height = 32;
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2439' } };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    }

    // ─── ЛИСТ 2: ИСХОДЯЩАЯ КОРРЕСПОНДЕНЦИЯ ─────────────────────────────────
    let sheetOut = workbook.getWorksheet('Исходящая корреспонденция');
    if (!sheetOut) {
      sheetOut = workbook.addWorksheet('Исходящая корреспонденция', {
        pageSetup: { orientation: 'landscape', paperSize: 9 }
      });

      sheetOut.columns = [
        { header: '№ п/п', key: 'id', width: 8 },
        { header: 'Исх. дата', key: 'date', width: 14 },
        { header: 'Исх. № АНО', key: 'outNumber', width: 22 },
        { header: 'Связанное дело / ИП', key: 'relatedCase', width: 28 },
        { header: 'Адресат (Ведомство / Компания)', key: 'recipient', width: 32 },
        { header: 'Тема / Наименование документа', key: 'subject', width: 36 },
        { header: 'Суть требований / Доверитель', key: 'summary', width: 45 },
        { header: 'Способ отправки', key: 'method', width: 20 },
        { header: 'Трек-номер / Подтверждение', key: 'track', width: 25 },
        { header: 'Статус доставки / Ответа', key: 'status', width: 20 }
      ];

      const headerRowOut = sheetOut.getRow(1);
      headerRowOut.height = 32;
      headerRowOut.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
      headerRowOut.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A365D' } };
      headerRowOut.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    }
  }

  /**
   * Добавить запись о входящем письме в журнал с привязкой к делу
   */
  async appendIncomingEntry(entry) {
    const workbook = await this.loadOrCreateWorkbook();
    let sheet = workbook.getWorksheet('Входящая корреспонденция');
    if (!sheet) {
      this.initSheets(workbook);
      sheet = workbook.getWorksheet('Входящая корреспонденция');
    }
    
    // Проверка на дубликат по теме и отправителю
    let exists = false;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const rowSubj = row.getCell(8).value || row.getCell(7).value;
        const rowFrom = row.getCell(6).value || row.getCell(5).value;
        if (rowSubj === entry.subject && rowFrom === entry.senderContact) {
          exists = true;
        }
      }
    });

    if (exists) {
      return { duplicate: true };
    }

    const rowIdx = sheet.rowCount + 1;
    const seq = String(rowIdx - 1).padStart(3, '0');
    const inNumber = entry.inNumber || `ВХ-2026/${entry.deptCode || 'КАНЦ'}-${seq}`;

    // Формируем цепочку связывания
    const relatedStr = entry.relatedCase || entry.identifiersText || 'Прямое обращение';

    const newRow = sheet.addRow({
      id: rowIdx - 1,
      date: entry.date || new Date().toLocaleDateString('ru-RU'),
      inNumber: inNumber,
      senderOrg: entry.department || 'Внешняя организация',
      relatedCase: relatedStr,
      senderContact: entry.from || '—',
      outNumber: entry.outNumber || 'Б/Н',
      subject: entry.subject || 'Без темы',
      summary: entry.summary || '—',
      attachments: (entry.attachments || []).join(', ') || 'Без вложений',
      deadline: entry.deadline || 'Без срока',
      status: entry.status || (entry.hasDeadline ? '🟡 Контроль срока' : '🟢 В работе'),
      folderPath: entry.folderPath || '—'
    });

    newRow.height = 24;
    newRow.alignment = { vertical: 'middle', wrapText: true };
    newRow.font = { size: 10, name: 'Calibri' };

    if (entry.hasDeadline) {
      newRow.getCell(11).font = { bold: true, color: { argb: 'FFB91C1C' } };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    fs.mkdirSync(path.dirname(this.localExcelPath), { recursive: true });
    fs.writeFileSync(this.localExcelPath, buffer);

    await this.uploadToYandexDisk(buffer, this.diskExcelPath);
    console.log(`📊 [Реестр] Запись внесена: ${inNumber} (Дело: ${relatedStr} | ${entry.department})`);

    return { success: true, inNumber: inNumber, relatedCase: relatedStr };
  }

  /**
   * Добавить запись об исходящем документе в журнал
   */
  async appendOutgoingEntry(entry) {
    const workbook = await this.loadOrCreateWorkbook();
    let sheet = workbook.getWorksheet('Исходящая корреспонденция');
    if (!sheet) {
      this.initSheets(workbook);
      sheet = workbook.getWorksheet('Исходящая корреспонденция');
    }

    let exists = false;
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const rowSubj = row.getCell(6).value || row.getCell(5).value;
        const rowRecip = row.getCell(5).value || row.getCell(4).value;
        if (rowSubj === entry.subject && rowRecip === entry.recipient) {
          exists = true;
        }
      }
    });

    if (exists) return { duplicate: true };

    const rowIdx = sheet.rowCount + 1;
    const seq = String(rowIdx - 1).padStart(3, '0');
    const outNumber = entry.outNumber || `ИСХ-2026/${entry.deptCode || 'КАНЦ'}-${seq}`;

    const newRow = sheet.addRow({
      id: rowIdx - 1,
      date: entry.date || new Date().toLocaleDateString('ru-RU'),
      outNumber: outNumber,
      relatedCase: entry.relatedCase || 'Прямое заявление',
      recipient: entry.recipient || '—',
      subject: entry.subject || 'Без темы',
      summary: entry.summary || '—',
      method: entry.method || 'Электронная почта',
      track: entry.track || 'Отправлено через SMTP',
      status: entry.status || '🟢 Отправлено'
    });

    newRow.height = 24;
    newRow.alignment = { vertical: 'middle', wrapText: true };
    newRow.font = { size: 10, name: 'Calibri' };

    const buffer = await workbook.xlsx.writeBuffer();
    fs.mkdirSync(path.dirname(this.localExcelPath), { recursive: true });
    fs.writeFileSync(this.localExcelPath, buffer);
    await this.uploadToYandexDisk(buffer, this.diskExcelPath);

    console.log(`📤 [Реестр Исходящих] Запись внесена: ${outNumber} (${entry.recipient} / ${entry.subject})`);
    return { success: true, outNumber: outNumber };
  }
}

module.exports = new RegistryManager();
