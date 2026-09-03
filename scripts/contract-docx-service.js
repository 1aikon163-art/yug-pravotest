/**
 * Сервис генерации индивидуализированного Договора пожертвования в формате DOCX
 * Полное соответствие нормам ГК РФ (ст. 574, 582), НК РФ (ст. 251, 265) и 7-ФЗ
 */

const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, ImageRun } = require('docx');

function rublesInWords(num) {
  const ones = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
  const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

  num = Math.floor(num);
  if (num === 0) return 'ноль';

  let words = [];
  if (num >= 1000) {
    const t = Math.floor(num / 1000);
    num = num % 1000;
    if (t >= 10 && t < 20) {
      words.push(teens[t - 10] + ' тысяч');
    } else {
      const h_t = Math.floor(t / 100);
      const rem_t = t % 100;
      if (h_t > 0) words.push(hundreds[h_t]);
      if (rem_t >= 10 && rem_t < 20) {
        words.push(teens[rem_t - 10] + ' тысяч');
      } else {
        const d_t = Math.floor(rem_t / 10);
        const o_t = rem_t % 10;
        if (d_t > 0) words.push(tens[d_t]);
        if (o_t === 1) words.push('одна тысяча');
        else if (o_t >= 2 && o_t <= 4) words.push((o_t === 2 ? 'две' : (o_t === 3 ? 'три' : 'четыре')) + ' тысячи');
        else if (o_t > 4) words.push(ones[o_t] + ' тысяч');
        else if (d_t > 0 || h_t > 0) words.push('тысяч');
      }
    }
  }

  const h = Math.floor(num / 100);
  const rem = num % 100;
  if (h > 0) words.push(hundreds[h]);
  if (rem >= 10 && rem < 20) {
    words.push(teens[rem - 10]);
  } else {
    const d = Math.floor(rem / 10);
    const o = rem % 10;
    if (d > 0) words.push(tens[d]);
    if (o > 0) words.push(ones[o]);
  }

  const res = words.join(' ').trim();
  return res ? (res.charAt(0).toUpperCase() + res.slice(1)) : '';
}

function getFormattedRussianDate(dateObj = new Date()) {
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `«${day}» ${month} ${year} г.`;
}

async function buildContractDocxBuffer(params = {}) {
  const now = new Date();
  const contractNumber = params.contractNumber || `П-26/Д-${Math.floor(1000 + Math.random() * 9000)}`;
  const dateStr = params.dateStr || getFormattedRussianDate(now);
  const donorName = params.donorName || '____________________________________________________________________';
  const donorInn = params.donorInn || '';
  const amount = Math.max(100, parseFloat(params.amount) || 5000);
  const amountFormatted = amount.toLocaleString('ru-RU');
  const amountWords = rublesInWords(amount);

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1134, // 20 mm
            bottom: 1134, // 20 mm
            left: 1417, // 25 mm
            right: 567 // 10 mm
          }
        }
      },
      children: [
        // Заголовок документа
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: `ДОГОВОР ДОБРОВОЛЬНОГО ПОЖЕРТВОВАНИЯ № ${contractNumber}`,
              bold: true,
              font: 'Times New Roman',
              size: 26
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 220 },
          children: [
            new TextRun({
              text: 'на ведение уставной некоммерческой деятельности социально ориентированной организации',
              italics: true,
              font: 'Times New Roman',
              size: 21
            })
          ]
        }),

        // Город и дата
        new Paragraph({
          alignment: AlignmentType.BOTH,
          spacing: { after: 180 },
          children: [
            new TextRun({ text: 'г. Самара', bold: true, font: 'Times New Roman', size: 23 }),
            new TextRun({ text: `\t\t\t\t\t\t${dateStr}`, bold: true, font: 'Times New Roman', size: 23 })
          ]
        }),

        // Преамбула
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 140, line: 260 },
          children: [
            new TextRun({
              text: 'Автономная некоммерческая организация «Центр правовой защиты и развития гражданских инициатив ЮГ-ПРАВО» (АНО «ЦПЗ ЮГ-ПРАВО»)',
              bold: true,
              font: 'Times New Roman',
              size: 23
            }),
            new TextRun({
              text: ', ОГРН 1266300015080, ИНН 6317174776, КПП 631701001, учетный номер Министерства юстиции РФ № 6314010192, именуемая в дальнейшем «Одаряемый» («Организация»), в лице Директора Шарыпаева Павла Валерьевича, действующего на основании Устава, с одной стороны, и',
              font: 'Times New Roman',
              size: 23
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 260 },
          children: [
            new TextRun({
              text: `${donorName}`,
              bold: Boolean(params.donorName),
              font: 'Times New Roman',
              size: 23
            }),
            new TextRun({
              text: donorInn ? ` (ИНН ${donorInn})` : ', ИНН ___________________, КПП ___________________',
              font: 'Times New Roman',
              size: 23
            }),
            new TextRun({
              text: ', именуемое в дальнейшем «Жертвователь», в лице руководителя (или уполномоченного представителя), действующего на основании Устава (или доверенности), с другой стороны, совместно именуемые «Стороны», руководствуясь статьями 574, 582 Гражданского кодекса РФ и Федеральным законом от 12.01.1996 № 7-ФЗ «О некоммерческих организациях», заключили настоящий Договор о нижеследующем:',
              font: 'Times New Roman',
              size: 23
            })
          ]
        }),

        // 1. ПРЕДМЕТ ДОГОВОРА
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 160, after: 100 },
          children: [
            new TextRun({ text: '1. ПРЕДМЕТ ДОГОВОРА', bold: true, font: 'Times New Roman', size: 23 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 260 },
          children: [
            new TextRun({
              text: '1.1. В соответствии со статьей 582 Гражданского кодекса Российской Федерации Жертвователь добровольно и безвозмездно передает Одаряемому в собственность денежные средства в качестве пожертвования на осуществление уставной социально ориентированной деятельности Организации.',
              font: 'Times New Roman',
              size: 23
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 260 },
          children: [
            new TextRun({
              text: '1.2. Размер пожертвования составляет: ',
              font: 'Times New Roman',
              size: 23
            }),
            new TextRun({
              text: `${amountFormatted} (${amountWords}) рублей 00 копеек.`,
              bold: true,
              font: 'Times New Roman',
              size: 23
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 160, line: 260 },
          children: [
            new TextRun({
              text: '1.3. В соответствии с подпунктом 1 пункта 2 статьи 251 Налогового кодекса РФ пожертвование на ведение уставной некоммерческой деятельности не облагается налогом на добавленную стоимость (НДС) и не учитывается в налоговой базе по налогу на прибыль Организации.',
              font: 'Times New Roman',
              size: 23
            })
          ]
        }),

        // 2. ЦЕЛЕВОЕ НАЗНАЧЕНИЕ
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 160, after: 100 },
          children: [
            new TextRun({ text: '2. ЦЕЛЕВОЕ НАЗНАЧЕНИЕ ПОЖЕРТВОВАНИЯ', bold: true, font: 'Times New Roman', size: 23 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 260 },
          children: [
            new TextRun({
              text: '2.1. Переданные денежные средства имеют строго целевое назначение и направляются Одаряемым на финансирование уставных некоммерческих программ в соответствии с Уставом АНО «ЦПЗ ЮГ-ПРАВО», включая:',
              font: 'Times New Roman',
              size: 23
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 260 },
          indent: { left: 360 },
          children: [
            new TextRun({
              text: '— Программу бесплатного правового просвещения граждан, мониторинга правоприменительной практики и защиты прав потребителей финансовых и коммунальных услуг;',
              font: 'Times New Roman',
              size: 23
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 260 },
          indent: { left: 360 },
          children: [
            new TextRun({
              text: '— Программу разработки, модернизации и обеспечения общедоступности цифровых правовых программных решений и онлайн-калькуляторов;',
              font: 'Times New Roman',
              size: 23
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 160, line: 260 },
          indent: { left: 360 },
          children: [
            new TextRun({
              text: '— Программы развития волонтерского молодежного актива («Школа Права», верификация волонтерских часов на Добро.рф) и благоустройства городской среды.',
              font: 'Times New Roman',
              size: 23
            })
          ]
        }),

        // 3. ПОРЯДОК ПЕРЕДАЧИ И ОТЧЕТНОСТЬ
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 160, after: 100 },
          children: [
            new TextRun({ text: '3. ПОРЯДОК ПЕРЕДАЧИ СРЕДСТВ И ОТЧЕТНОСТЬ', bold: true, font: 'Times New Roman', size: 23 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 260 },
          children: [
            new TextRun({
              text: '3.1. Жертвователь перечисляет денежные средства в безналичном порядке со своего расчетного счета на расчетный счет Одаряемого в течение 10 (десяти) банковских дней с момента подписания Договора.',
              font: 'Times New Roman',
              size: 23
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 260 },
          children: [
            new TextRun({
              text: '3.2. В назначении платежа в платежном поручении Жертвователь указывает: ',
              font: 'Times New Roman',
              size: 23
            }),
            new TextRun({
              text: `«Добровольное пожертвование на ведение уставной деятельности по Договору № ${contractNumber} от ${dateStr}. Без НДС».`,
              italics: true,
              bold: true,
              font: 'Times New Roman',
              size: 23
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 260 },
          children: [
            new TextRun({
              text: '3.3. Одаряемый ведет обособленный бухгалтерский учет всех операций по использованию пожертвованных средств в соответствии с законодательством РФ о некоммерческих организациях (ст. 251 НК РФ).',
              font: 'Times New Roman',
              size: 23
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 160, line: 260 },
          children: [
            new TextRun({
              text: '3.4. По письменному запросу Жертвователя Одаряемый обязуется предоставить письменный отчет о целевом использовании средств пожертвования в течение 30 (тридцати) календарных дней с момента получения запроса.',
              font: 'Times New Roman',
              size: 23
            })
          ]
        }),

        // 4. НАЛОГОВАЯ ЛЬГОТА ДЛЯ ЖЕРТВОВАТЕЛЯ
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 160, after: 100 },
          children: [
            new TextRun({ text: '4. НАЛОГОВАЯ ПРЕРОГАТИВА ЖЕРТВОВАТЕЛЯ (НК РФ)', bold: true, font: 'Times New Roman', size: 23 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 160, line: 260 },
          children: [
            new TextRun({
              text: '4.1. В соответствии с подпунктом 19.6 пункта 1 статьи 265 Налогового кодекса РФ Жертвователь (при применении ОСНО) вправе включить расходы в виде пожертвований социально ориентированным НКО в состав внереализационных расходов при определении налоговой базы по налогу на прибыль организаций в пределах 1% от выручки.',
              font: 'Times New Roman',
              size: 23
            })
          ]
        }),

        // 5. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 160, after: 100 },
          children: [
            new TextRun({ text: '5. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ', bold: true, font: 'Times New Roman', size: 23 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 260 },
          children: [
            new TextRun({
              text: '5.1. Настоящий Договор вступает в силу с момента его подписания уполномоченными представителями Сторон и действует до полного исполнения Сторонами принятых обязательств.',
              font: 'Times New Roman',
              size: 23
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 260 },
          children: [
            new TextRun({
              text: '5.2. Договор может быть подписан посредством систем юридически значимого электронного документооборота (ЭДО: Диадок, СБИС) с использованием усиленной квалифицированной электронной подписи (УКЭП) в соответствии с Федеральным законом от 06.04.2011 № 63-ФЗ.',
              font: 'Times New Roman',
              size: 23
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 260 },
          children: [
            new TextRun({
              text: '5.3. Все споры и разногласия разрешаются Сторонами путем конструктивных переговоров, а при недостижении согласия — в Арбитражном суде Самарской области.',
              font: 'Times New Roman',
              size: 23
            })
          ]
        }),

        // 6. АДРЕСА И БАНКОВСКИЕ РЕКВИЗИТЫ СТОРОН
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 160, after: 140 },
          children: [
            new TextRun({ text: '6. АДРЕСА И БАНКОВСКИЕ РЕКВИЗИТЫ СТОРОН', bold: true, font: 'Times New Roman', size: 23 })
          ]
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      spacing: { after: 60 },
                      children: [
                        new TextRun({ text: 'ОДАРЯЕМЫЙ:', bold: true, font: 'Times New Roman', size: 21 })
                      ]
                    }),
                    new Paragraph({
                      spacing: { line: 230 },
                      children: [
                        new TextRun({ text: 'АНО «ЦПЗ ЮГ-ПРАВО»\n', bold: true, font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: 'Адрес: 446186, Самарская обл., м.р-н Большеглушицкий, с.п. Южное, п. Южный, ул. Центральная, д. 7, кв. 1\n', font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: 'ОГРН: 1266300015080\n', font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: 'ИНН: 6317174776 / КПП: 631701001\n', font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: 'Минюст России № 6314010192\n', font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: 'Банк: АО «ТБанк» (г. Москва)\n', font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: 'БИК: 044525974\n', font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: 'К/с: 30101810145250000974\n', font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: 'Р/с: 40703810600000751961\n', bold: true, font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: 'Директор АНО «ЦПЗ ЮГ-ПРАВО»:\n', bold: true, font: 'Times New Roman', size: 19 }),
                        ...(params.withSignature === false ? [
                          new TextRun({ text: '\n\n_________________________ / П.В. Шарыпаев /\n\nМ.П. (место для живой печати)', font: 'Times New Roman', size: 19 })
                        ] : [
                          new ImageRun({
                            data: fs.readFileSync(path.join(__dirname, '../images/official-seal-with-signature.png')),
                            transformation: { width: 175, height: 99 }
                          }),
                          new TextRun({ text: '\n/ П.В. Шарыпаев /\nМ.П.', font: 'Times New Roman', size: 19 })
                        ])
                      ]
                    })
                  ]
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      spacing: { after: 60 },
                      children: [
                        new TextRun({ text: 'ЖЕРТВОВАТЕЛЬ:', bold: true, font: 'Times New Roman', size: 21 })
                      ]
                    }),
                    new Paragraph({
                      spacing: { line: 230 },
                      children: [
                        new TextRun({ text: `Наименование: ${donorName}\n`, bold: Boolean(params.donorName), font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: `ИНН: ${donorInn || '___________________'} КПП: ___________________\n`, font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: 'Юр. адрес: ____________________________________\n_______________________________________________\n', font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: 'Банк: _________________________________________\n', font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: 'БИК: __________________ Р/с: __________________\n', font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: 'К/с: __________________________________________\n', font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: 'Тел. / Email: _________________________________\n\n', font: 'Times New Roman', size: 19 }),
                        new TextRun({ text: 'Руководитель:\n\n_________________ / _________________________ /\nМ.П.', font: 'Times New Roman', size: 19 })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        })
      ]
    }]
  });

  return await Packer.toBuffer(doc);
}

module.exports = {
  buildContractDocxBuffer,
  rublesInWords,
  getFormattedRussianDate
};
