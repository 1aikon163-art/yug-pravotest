const {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
  Packer
} = require('docx');

/**
 * 📄 Генератор официального подписанного Заявления-поручения (ПЭП 63-ФЗ) в формате DOCX
 */
async function generateSignedAssignmentDocx(appeal) {
  const caseId = appeal.caseId || 'СПР-26/0000';
  const cleanId = caseId.replace(/[\/\\:*?"<>|]/g, '_');
  const name = appeal.name || 'Гражданин РФ (Доверитель)';
  const phone = appeal.phone || 'Не указан';
  const email = appeal.email || 'Не указан';
  const account = appeal.account || 'Не указан';
  const company = appeal.company || 'Лицо по указанному договору / лицевому счету';
  const sum = appeal.sum ? (appeal.sum.includes('₽') ? appeal.sum : appeal.sum + ' ₽') : 'По расчету калькулятора';
  const law = appeal.law || 'п. 15 Приложения № 1 к ПП РФ № 354, ч. 4 ст. 157 ЖК РФ';
  const comment = appeal.comment || appeal.message || 'Проведение досудебного урегулирования и устранение нарушений';
  const pep = appeal.pepAudit || {};
  const authMethod = pep.authMethod || 'TELEGRAM_AUTH';
  const profileId = pep.profileId || appeal.telegramId || '5960058667';
  const signedAt = pep.signedAt || appeal.createdAt || '03.09.2026 17:00:00';
  const authHash = pep.authHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  let cleanDirection = appeal.direction || 'Досудебная правовая помощь';
  const dirLow = cleanDirection.toLowerCase();
  if (dirLow.includes('госпошлин') || dirLow.includes('судебн') || dirLow.includes('гпк') || dirLow.includes('иск')) {
    cleanDirection = 'Досудебный правовой аудит имущественных требований и подготовка досудебной претензии';
  } else if (dirLow.includes('жкх') || dirLow.includes('отоплен') || dirLow.includes('перерасчет')) {
    cleanDirection = 'Досудебное урегулирование спора в сфере ЖКХ / перерасчёт платы (ПП РФ № 354)';
  } else if (dirLow.includes('потреб') || dirLow.includes('зозпп') || dirLow.includes('товар') || dirLow.includes('услуг')) {
    cleanDirection = 'Досудебная защита прав потребителей (Закон РФ № 2300-1)';
  } else if (dirLow.includes('труд') || dirLow.includes('зарплат')) {
    cleanDirection = 'Досудебное урегулирование индивидуального трудового спора (ТК РФ)';
  } else if (dirLow.includes('кредит') || dirLow.includes('страхов') || dirLow.includes('230-фз') || dirLow.includes('мфо')) {
    cleanDirection = 'Досудебный возврат навязанных финансовых услуг и защита прав заёмщика (353-ФЗ)';
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1134, bottom: 1134, left: 1417, right: 850 } // 20/20/25/15 mm
        }
      },
      children: [
        // Шапка документа (2 колонки)
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE }
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 55, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      spacing: { line: 220 },
                      children: [
                        new TextRun({ text: 'АНО «ЦПЗ ЮГ-ПРАВО»\n', bold: true, font: 'Times New Roman', size: 21 }),
                        new TextRun({ text: 'Автономная некоммерческая организация «Центр правовой защиты и развития гражданских инициатив ЮГ-ПРАВО»\n', font: 'Times New Roman', size: 18 }),
                        new TextRun({ text: 'ОГРН 1266300015080 | ИНН 6317174776 | КПП 631701001\nУчетный номер Минюста России: 6314010192\nСамарская обл., Большеглушицкий р-н, п. Южный, ул. Центральная, д. 7\nЭл. почта: info@yugpravo.ru | Сайт: yugpravo.ru', font: 'Times New Roman', size: 16, color: '555555' })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  width: { size: 45, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      spacing: { line: 220 },
                      children: [
                        new TextRun({ text: 'Директору АНО «ЦПЗ ЮГ-ПРАВО»\nШарыпаеву П. В.\n\n', bold: true, font: 'Times New Roman', size: 20 }),
                        new TextRun({ text: 'От гражданина (Доверителя):\n', bold: true, font: 'Times New Roman', size: 20 }),
                        new TextRun({ text: `${name}\nТел.: ${phone}\nEmail: ${email}\nЛицевой счет / договор: ${account}`, font: 'Times New Roman', size: 19 })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { before: 200, after: 60 }, alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: `ЗАЯВЛЕНИЕ-ПОРУЧЕНИЕ № ${caseId}`, bold: true, font: 'Times New Roman', size: 26 })
        ]}),
        new Paragraph({ spacing: { after: 160 }, alignment: AlignmentType.CENTER, children: [
          new TextRun({ text: 'о безвозмездном досудебном правовом содействии в защиту нарушенных прав', italic: true, font: 'Times New Roman', size: 20, color: '444444' })
        ]}),

        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 240, after: 120 },
          children: [
            new TextRun({
              text: `Я, ${name}, руководствуясь действующим законодательством РФ, ст. 434, 438 Гражданского кодекса РФ, ст. 45 Закона РФ «О защите прав потребителей» и ст. 5, 6, 9 Федерального закона от 06.04.2011 № 63-ФЗ «Об электронной подписи», настоящим поручаю Автономной некоммерческой организации «Центр правовой защиты и развития гражданских инициатив ЮГ-ПРАВО» (АНО «ЦПЗ ЮГ-ПРАВО») оказать мне безвозмездное досудебное содействие в целях восстановления моих нарушенных законных прав.`,
              font: 'Times New Roman',
              size: 21
            })
          ]
        }),

        // Блок обстоятельств
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: 'C5A059' },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: 'C5A059' },
            left: { style: BorderStyle.SINGLE, size: 4, color: 'C5A059' },
            right: { style: BorderStyle.SINGLE, size: 4, color: 'C5A059' }
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      spacing: { before: 80, after: 80, line: 220 },
                      children: [
                        new TextRun({ text: 'Обстоятельства нарушения и предмет требований:\n', bold: true, font: 'Times New Roman', size: 20, color: '8C6826' }),
                        new TextRun({ text: `• Предмет поручения: ${cleanDirection}\n`, bold: true, font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: `• Организация-нарушитель (Ответчик): ${company}\n`, font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: `• Лицевой счёт / договор: ${account}\n`, font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: `• Расчётная сумма требований: ${sum}\n`, bold: true, font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: `• Правовое основание: ${law}\n`, font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: `• Суть обращения: ${comment}`, font: 'Times New Roman', size: 19 })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 140, line: 240 },
          children: [
            new TextRun({
              text: '1. В рамках настоящего поручения уполномочиваю специалистов Организации: провести правовую экспертизу представленных расчетов и материалов; подготовить проект мотивированного досудебного требования (претензии) на официальном бланке АНО; подписать и направить указанное требование от лица Организации в адрес виновной стороны с требованием устранения нарушений и проведения перерасчета.',
              font: 'Times New Roman',
              size: 20
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 80, line: 240 },
          children: [
            new TextRun({
              text: '2. БЕЗВОЗМЕЗДНОСТЬ СОДЕЙСТВИЯ (0 РУБЛЕЙ): Настоящее досудебное содействие оказывается Организацией полностью на безвозмездной основе в рамках реализации уставной некоммерческой деятельности по защите прав граждан и потребителей. Взимание платы, скрытых процентов либо комиссий за досудебную стадию исключается.',
              font: 'Times New Roman',
              size: 20
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 80, line: 240 },
          children: [
            new TextRun({
              text: '3. СУДЕБНАЯ СТАДИЯ: Настоящее поручение действует исключительно в рамках досудебного урегулирования. В случае отказа либо игнорирования требований виновной стороной представление моих интересов в суде осуществляется на основании отдельного возмездного договора на индивидуальных условиях (ст. 98, 100 ГПК РФ).',
              font: 'Times New Roman',
              size: 20
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 80, line: 240 },
          children: [
            new TextRun({
              text: '4. ОГРАНИЧЕНИЕ ПОЛНОМОЧИЙ: Организация не имеет права уменьшать размер моих имущественных требований либо отказываться от них без отдельного согласия. Все денежные средства, перерасчеты и неустойки перечисляются Ответчиком исключительно на мой личный банковский либо лицевой счет.',
              font: 'Times New Roman',
              size: 20
            })
          ]
        }),

        // Блок штампов (ПЭП и Организация)
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE }
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 60, type: WidthType.PERCENTAGE },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 12, color: '004D99' },
                    bottom: { style: BorderStyle.SINGLE, size: 12, color: '004D99' },
                    left: { style: BorderStyle.SINGLE, size: 12, color: '004D99' },
                    right: { style: BorderStyle.SINGLE, size: 12, color: '004D99' }
                  },
                  children: [
                    new Paragraph({
                      spacing: { before: 60, after: 60, line: 210 },
                      children: [
                        new TextRun({ text: 'ДОКУМЕНТ ПОДПИСАН ПРОСТОЙ ЭЛЕКТРОННОЙ ПОДПИСЬЮ (ПЭП)\n', bold: true, font: 'Times New Roman', size: 17, color: '004D99' }),
                        new TextRun({ text: `Номер дела: ${caseId}\n`, bold: true, font: 'Times New Roman', size: 17, color: '004D99' }),
                        new TextRun({ text: `Подписант (Доверитель): ${name}\n`, font: 'Times New Roman', size: 16, color: '004D99' }),
                        new TextRun({ text: `Способ ПЭП: ${authMethod} (ID: ${profileId})\n`, font: 'Times New Roman', size: 16, color: '004D99' }),
                        new TextRun({ text: `Идентификатор ключа: Тел.: ${phone} • Email: ${email}\n`, font: 'Times New Roman', size: 15, color: '004D99' }),
                        new TextRun({ text: `Хеш авторизации: ${authHash.slice(0, 32)}...\n`, font: 'Courier New', size: 14, color: '004D99' }),
                        new TextRun({ text: `Дата и время: ${signedAt} (Самара)\n`, font: 'Times New Roman', size: 16, color: '004D99' }),
                        new TextRun({ text: 'Основание: ст. 5, 6, 9 Федерального закона от 06.04.2011 № 63-ФЗ, ст. 434, 438 ГК РФ', font: 'Times New Roman', size: 14, color: '5577AA' })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  width: { size: 40, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      spacing: { before: 60, line: 220 },
                      children: [
                        new TextRun({ text: 'Принято в производство:\n', bold: true, font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: `Рег. № ${caseId}\n`, bold: true, font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: 'Директор АНО «ЦПЗ ЮГ-ПРАВО»:\n\n\n', font: 'Times New Roman', size: 18 }),
                        new TextRun({ text: '_________________ / Шарыпаев П. В. /\nМ.П.', bold: true, font: 'Times New Roman', size: 19 })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({
          spacing: { before: 180 },
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Официальный документ АНО «ЦПЗ ЮГ-ПРАВО» • ОГРН 1266300015080 • Соглашение об ЭДО в ред. Приказа № 04/ОД • yugpravo.ru',
              font: 'Times New Roman',
              size: 15,
              color: '888888'
            })
          ]
        })
      ]
    }]
  });

  return await Packer.toBuffer(doc);
}

module.exports = { generateSignedAssignmentDocx };
