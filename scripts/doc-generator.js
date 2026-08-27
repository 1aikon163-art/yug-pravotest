/**
 * Procedural Legal Document Generator (DOCX & PDF)
 * Supports full Cyrillic typography (Times New Roman / Arial / PT Sans / Roboto)
 */

const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } = require('docx');

class LegalDocGenerator {
  /**
   * Generate a procedural court claim in DOCX format (ГОСТ Р 7.0.97-2016)
   * @param {Object} data 
   * @param {string} outputPath 
   */
  static async generateClaimDocx(data, outputPath) {
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1134, // 20 mm
              bottom: 1134, // 20 mm
              left: 1700, // 30 mm
              right: 567 // 10 mm
            }
          }
        },
        children: [
          // Шапка документа (Выравнивание справа)
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `В ${data.courtName || 'Ленинский районный суд г. Ростова-на-Дону'}`, bold: true, font: 'Times New Roman', size: 24 }),
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `Истец: ${data.plaintiff?.fullName || 'Иванов Иван Иванович'}`, font: 'Times New Roman', size: 24 }),
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `Адрес: ${data.plaintiff?.address || 'г. Ростов-на-Дону, ул. Пушкинская, д. 10'}`, font: 'Times New Roman', size: 24 }),
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `Идентификатор: ИНН ${data.plaintiff?.inn || '616400000000'}`, font: 'Times New Roman', size: 24 }),
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `Телефон: ${data.plaintiff?.phone || '+7 (999) 000-00-00'}`, font: 'Times New Roman', size: 24 }),
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `Ответчик: ${data.defendant?.fullName || 'ООО "Альфа-Сервис"'}`, font: 'Times New Roman', size: 24 }),
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `Адрес: ${data.defendant?.address || 'г. Москва, ул. Тверская, д. 1'}`, font: 'Times New Roman', size: 24 }),
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `Цена иска: ${data.claimAmount ? data.claimAmount.toLocaleString('ru-RU') + ' руб.' : 'Не подлежит оценке'}`, bold: true, font: 'Times New Roman', size: 24 }),
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `Госпошлина: ${data.stateDuty ? data.stateDuty.toLocaleString('ru-RU') + ' руб.' : 'Освобожден по ст. 333.36 НК РФ'}`, font: 'Times New Roman', size: 24 }),
            ]
          }),

          // Разделитель
          new Paragraph({ text: '', spacing: { before: 200, after: 200 } }),

          // Заголовок
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'ИСКОВОЕ ЗАЯВЛЕНИЕ', bold: true, size: 28, font: 'Times New Roman' }),
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: data.claimTitle || 'о взыскании денежных средств и защите прав потребителей', italics: true, size: 24, font: 'Times New Roman' }),
            ],
            spacing: { after: 300 }
          }),

          // Описательная часть
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            indent: { firstLine: 708 }, // 1.25 cm
            children: [
              new TextRun({
                text: data.circumstances || 'Между истцом и ответчиком был заключен договор оказания услуг. Истец полностью выполнил свои обязательства по оплате, однако ответчик допустил существенные нарушения условий договора...',
                size: 24,
                font: 'Times New Roman'
              })
            ],
            spacing: { line: 276, after: 200 } // 1.15 line spacing
          }),

          // Просительная часть
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'ПРОШУ СУД:', bold: true, size: 24, font: 'Times New Roman' })
            ],
            spacing: { before: 200, after: 150 }
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            indent: { firstLine: 708 },
            children: [
              new TextRun({
                text: data.claims || '1. Взыскать с ответчика в пользу истца уплаченную сумму в размере 250 000 руб.\n2. Взыскать компенсацию морального вреда и судебные расходы.',
                size: 24,
                font: 'Times New Roman'
              })
            ],
            spacing: { line: 276, after: 200 }
          }),

          // Приложения
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({ text: 'Приложение:', bold: true, size: 24, font: 'Times New Roman' })
            ],
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            alignment: AlignmentType.LEFT,
            indent: { firstLine: 708 },
            children: [
              new TextRun({
                text: '1. Копия договора оказания услуг.\n2. Документ об уплате государственной пошлины.\n3. Документы, подтверждающие направление копии иска ответчику (почтовая квитанция и опись вложения).\n4. Расчет взыскиваемой суммы.',
                size: 24,
                font: 'Times New Roman'
              })
            ]
          }),

          // Подпись и дата
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({ text: `Дата: ${new Date().toLocaleDateString('ru-RU')}`, size: 24, font: 'Times New Roman' }),
              new TextRun({ text: '\t\t\t\t\t\tПодпись: _______________ / Иванов И.И. /', size: 24, font: 'Times New Roman' })
            ],
            spacing: { before: 400 }
          })
        ]
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
    console.log(`[LegalDocGenerator] Successfully generated DOCX at: ${outputPath}`);
    return outputPath;
  }
}

module.exports = LegalDocGenerator;

if (require.main === module) {
  const outDir = path.join(__dirname, '..', 'docs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'sample_claim.docx');
  LegalDocGenerator.generateClaimDocx({}, outPath).then(() => {
    console.log('Sample claim created:', outPath);
  });
}
