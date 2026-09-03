/**
 * 📊 EXCEL REGISTRY GENERATOR (Multi-Sheet Workbook for Yandex Disk)
 * АНО «ЦПЗ ЮГ-ПРАВО» — Официальный реестр учета обращений (152-ФЗ)
 */

const ExcelJS = require('exceljs');

const DEPARTMENTS = [
  { id: 'all', title: '📋 Сводный реестр', filter: () => true },
  { id: 'jkh', title: '🏠 ЖКХ и УК', filter: (l) => (l.alias || '').includes('jkh') },
  { id: 'debt', title: '💳 Долги и 230-ФЗ', filter: (l) => (l.alias || '').includes('debt') },
  { id: 'potreb', title: '🛍️ Защита потребителей', filter: (l) => (l.alias || '').includes('potreb') },
  { id: 'sud', title: '⚖️ Судебная защита', filter: (l) => (l.alias || '').includes('sud') },
  { id: 'trud', title: '💼 Трудовые споры', filter: (l) => (l.alias || '').includes('trud') },
  { id: 'partner', title: '🤝 Партнерство & B2B', filter: (l) => (l.alias || '').includes('partner') },
  { id: 'idea_care', title: '💡 Инициативы и сборы', filter: (l) => (l.alias || '').includes('idea') || (l.alias || '').includes('care') }
];

const COLUMNS = [
  { header: '№ п/п', key: 'idx', width: 8, align: 'center' },
  { header: 'Дата и время (Самара)', key: 'date', width: 22, align: 'center' },
  { header: 'Номер дела', key: 'caseId', width: 20, align: 'center' },
  { header: 'Статус обращения', key: 'status', width: 30, align: 'left' },
  { header: 'Подразделение / Алиас', key: 'alias', width: 26, align: 'left' },
  { header: 'ФИО заявителя', key: 'name', width: 32, align: 'left' },
  { header: 'Телефон', key: 'phone', width: 20, align: 'center' },
  { header: 'Email заявителя', key: 'email', width: 28, align: 'left' },
  { header: 'Источник обращения', key: 'source', width: 24, align: 'left' },
  { header: 'Краткая суть обращения / Вопрос', key: 'message', width: 50, align: 'left' },
  { header: 'Правовая позиция / Решение юриста', key: 'solution', width: 40, align: 'left' },
  { header: 'Ответственный юрист', key: 'lawyer', width: 25, align: 'left' }
];

async function generateMultiSheetWorkbook(leads = []) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'АНО «ЦПЗ ЮГ-ПРАВО» LegalTech Engine';
  workbook.lastModifiedBy = 'Yug-Pravo Automated CRM';
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. Создаем листы по отделам
  for (const dept of DEPARTMENTS) {
    const sheet = workbook.addWorksheet(dept.title, {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 4, showGridLines: true }],
      pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 }
    });

    // Установка ширины колонок
    sheet.columns = COLUMNS.map(col => ({
      key: col.key,
      width: col.width
    }));

    // Заголовок Row 1 (Главный баннер)
    sheet.mergeCells('A1:L1');
    const titleRow = sheet.getCell('A1');
    titleRow.value = 'АВТОНОМНАЯ НЕКОММЕРЧЕСКАЯ ОРГАНИЗАЦИЯ «ЦЕНТР ПРАВОВОЙ ЗАЩИТЫ И РАЗВИТИЯ ГРАЖДАНСКИХ ИНИЦИАТИВ ЮГ-ПРАВО»';
    titleRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    titleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2439' } };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 28;

    // Подзаголовок Row 2
    sheet.mergeCells('A2:L2');
    const subTitleRow = sheet.getCell('A2');
    subTitleRow.value = `ЖУРНАЛ УЧЕТА ВХОДЯЩИХ ОБРАЩЕНИЙ — ${dept.title.toUpperCase()} (152-ФЗ / ОГРН 1266300015080 / ИНН 6317174776)`;
    subTitleRow.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF8C6826' } };
    subTitleRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAF4E6' } };
    subTitleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(2).height = 20;

    // Пустая разделительная строка Row 3
    sheet.getRow(3).height = 8;

    // Шапка таблицы Row 4
    const headerRow = sheet.getRow(4);
    headerRow.height = 26;
    COLUMNS.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF0F2439' } },
        bottom: { style: 'medium', color: { argb: 'FF0F2439' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };
    });

    // Фильтруем лиды для данного листа
    const deptLeads = leads.filter(dept.filter);

    // Добавляем строки данных
    deptLeads.forEach((lead, index) => {
      const rowNum = index + 5;
      const row = sheet.getRow(rowNum);
      row.height = 24;

      const isEven = index % 2 === 0;
      const bgArgb = isEven ? 'FFFFFFFF' : 'FFF9F9F8';

      row.values = {
        idx: index + 1,
        date: lead.date || '',
        caseId: lead.caseId || '',
        status: lead.status || '🟡 Зарегистрировано (Первичный анализ)',
        alias: lead.alias || '',
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        source: lead.source || 'Сайт',
        message: lead.message || '',
        solution: lead.solution || '',
        lawyer: lead.lawyer || 'Юрисконсульт АНО'
      };

      COLUMNS.forEach((col, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        cell.font = { name: 'Arial', size: 9, color: { argb: 'FF2C3E50' } };
        if (col.key === 'caseId') {
          cell.font = { name: 'Consolas', size: 9, bold: true, color: { argb: 'FF0F2439' } };
        }
        if (col.key === 'status') {
          cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF1E5631' } };
        }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        cell.alignment = { vertical: 'middle', horizontal: col.align, wrapText: col.key === 'message' || col.key === 'solution' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
        };
      });
    });

    // Включаем фильтры Excel на шапку
    sheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: COLUMNS.length }
    };
  }

  // 2. Информационный лист для Минюста и Роскомнадзора (152-ФЗ)
  const infoSheet = workbook.addWorksheet('ℹ️ Справка 152-ФЗ и Минюст', {
    pageSetup: { orientation: 'portrait' }
  });
  infoSheet.columns = [{ width: 35 }, { width: 65 }];

  infoSheet.mergeCells('A1:B1');
  const h = infoSheet.getCell('A1');
  h.value = 'СВЕДЕНИЯ ОБ ОПЕРАТОРЕ ПЕРСОНАЛЬНЫХ ДАННЫХ И ПРАВОВОМ СТАТУСЕ (152-ФЗ)';
  h.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  h.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2439' } };
  h.alignment = { horizontal: 'center', vertical: 'middle' };
  infoSheet.getRow(1).height = 28;

  const infoData = [
    ['Полное наименование:', 'Автономная некоммерческая организация «Центр правовой защиты и развития гражданских инициатив ЮГ-ПРАВО»'],
    ['Сокращенное наименование:', 'АНО «ЦПЗ ЮГ-ПРАВО»'],
    ['ОГРН / ИНН / КПП:', '1266300015080 / 6317174776 / 631701001'],
    ['Юридический адрес:', '446186, Самарская обл., Большеглушицкий р-н, п. Южный, ул. Центральная, д. 7, кв. 1'],
    ['Банковские реквизиты:', 'Р/с 40703810600000751961 в АО «ТБанк» (БИК 044525974, К/с 30101810145250000974)'],
    ['Учетный номер Минюста России:', '6314010192 (Главное управление Минюста РФ по Самарской области)'],
    ['Правовой статус обработки ПД:', 'Оператор персональных данных в соответствии с Федеральным законом № 152-ФЗ'],
    ['Цели обработки ПД:', 'Рассмотрение обращений граждан, оказание социально-правовой помощи, правовое просвещение населения в рамках п. 2.1, 2.2 Устава'],
    ['Локализация баз данных (ч. 5 ст. 18 152-ФЗ):', 'Российская Федерация, ЦОД ООО «Яндекс» (Яндекс 360 Корпоративный, г. Москва / г. Самара)'],
    ['Защита данных:', 'Шифрование SSL/TLS по ГОСТ Р 34.12-2015, журналы аудита, двухфакторная аутентификация'],
    ['Регламент уничтожения данных:', 'По достижении целей обработки либо по отзыву согласия субъекта ПД в течение 30 дней'],
    ['Официальный сайт & ЭДО:', 'yugpravo.ru | СБИС (Тензор) / Диадок по ИНН 6317174776']
  ];

  infoData.forEach((row, i) => {
    const r = infoSheet.getRow(i + 3);
    r.height = 22;
    const c1 = r.getCell(1);
    const c2 = r.getCell(2);
    c1.value = row[0];
    c2.value = row[1];
    c1.font = { bold: true, size: 9, color: { argb: 'FF0F2439' } };
    c2.font = { size: 9, color: { argb: 'FF2C3E50' } };
    c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAF4E6' } };
    c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    c1.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } };
    c2.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } };
  });

  return await workbook.xlsx.writeBuffer();
}

module.exports = {
  generateMultiSheetWorkbook
};
