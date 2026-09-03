const fs = require('fs');
const path = require('path');
const https = require('https');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, HeadingLevel, ImageRun } = require('docx');

const logoBuffer = fs.readFileSync(path.join(__dirname, '../images/ano-logo-order.jpg'));
const sealBuffer = fs.readFileSync(path.join(__dirname, '../images/official-seal-with-signature.png'));
const token = 'y0__wgBEMj8w6eq94ACGIzZSCDejcXwGIbok30JHZ-PhpACeJdCypWjLHnd';
const accDir = '/_БАЗА_ЗНАНИЙ_ЮГ_ПРАВО/НКО ЮГ ПРАВО/Бухгалтерия 2026';

function defaultPageProps() {
  return {
    page: {
      margin: { top: 1134, bottom: 1134, left: 1417, right: 850 }
    }
  };
}

function makeHeader() {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new ImageRun({
          data: logoBuffer,
          transformation: { width: 55, height: 55 }
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: 'АВТОНОМНАЯ НЕКОММЕРЧЕСКАЯ ОРГАНИЗАЦИЯ\n«ЦЕНТР ПРАВОВОЙ ЗАЩИТЫ И РАЗВИТИЯ ГРАЖДАНСКИХ ИНИЦИАТИВ ЮГ-ПРАВО»',
          bold: true,
          font: 'Times New Roman',
          size: 20
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'ОГРН: 1266300015080 | ИНН: 6317174776 | КПП: 631701001 | Учетный № Минюста: 6314010192\n446186, Самарская обл., Большеглушицкий р-н, п. Южный, ул. Центральная, д. 7, кв. 1\nТел.: +7 (927) 002-39-91 | E-mail: info@yugpravo.ru | Сайт: yugpravo.ru',
          font: 'Times New Roman',
          size: 16
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 140 },
      children: [
        new TextRun({
          text: '─────────────────────────────────────────────────────────────────────────────',
          font: 'Times New Roman',
          size: 16
        })
      ]
    })
  ];
}

// 1. ИНВЕНТАРНАЯ КАРТОЧКА ОБЪЕКТА НМА (СЧЕТ 012)
async function createKartochka012(withSignature = true) {
  const doc = new Document({
    sections: [{
      properties: defaultPageProps(),
      children: [
        ...makeHeader(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({ text: 'ИНВЕНТАРНАЯ КАРТОЧКА ОБЪЕКТА НМА № ИНВ-012/01\n', bold: true, font: 'Times New Roman', size: 24 }),
            new TextRun({ text: 'Учета прав использования результатов интеллектуальной деятельности на забалансовом счете 012\n(утв. Приказом Директора № 03/ОД от 01.08.2026 г., ст. 9, 10 Закона № 402-ФЗ, ФСБУ 14/2022)', font: 'Times New Roman', size: 18 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.BOTH,
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'Самарская область, п. Южный', bold: true, font: 'Times New Roman', size: 20 }),
            new TextRun({ text: '\t\t\t\tДата открытия: «31» августа 2026 г.', bold: true, font: 'Times New Roman', size: 20 })
          ]
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 100, after: 60 },
          children: [new TextRun({ text: '1. СВЕДЕНИЯ ОБ ОБЪЕКТЕ НМА, ПРИНЯТОМ В ПОЛЬЗОВАНИЕ', bold: true, font: 'Times New Roman', size: 20 })]
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Наименование объекта', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ width: { size: 65, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Программный комплекс веб-платформы yugpravo.ru, интерактивные калькуляторы и доменное имя yugpravo.ru', font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Вид передаваемых прав', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Простая (неисключительная) безвозмездная лицензия (ст. 1235, 1286 ГК РФ)', font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Правообладатель (Автор)', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Гражданин РФ Шарыпаев Павел Валерьевич (ИНН: 636401104469)', font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Документы-основания', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '1. Решение Единственного учредителя № 2 от 29.08.2026 г. (ст. 27 7-ФЗ)\n2. Лицензионный договор № 01/РИД от 29.08.2026 г.\n3. Акт приема-передачи прав от 29.08.2026 г. (Приложение № 2)\n4. Приказ Директора № 04/ОД от 31.08.2026 г.', font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Учетная стоимость (счет 012)', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '750 000 (Семьсот пятьдесят тысяч) рублей 00 копеек', bold: true, font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Срок использования', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Бессрочно (на весь период уставной деятельности организации)', font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Материально ответственное лицо', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Директор АНО Шарыпаев Павел Валерьевич', font: 'Times New Roman', size: 18 })] })] })
              ]
            })
          ]
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: '2. РЕГИСТР ДВИЖЕНИЯ ПО ЗАБАЛАНСОВОМУ СЧЕТУ 012 ЗА 2026 ГОД', bold: true, font: 'Times New Roman', size: 20 })]
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Дата', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ width: { size: 42, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Содержание операции', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Дебет (Поступление)', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Кредит (Выбытие)', bold: true, font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '31.08.2026', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Принятие на забалансовый учет прав пользования программным комплексом yugpravo.ru (Акт № 01/РИД от 29.08.2026 г., Приказ № 04/ОД)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '750 000,00 ₽', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '—', font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '31.12.2026', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Сальдо на конец 2026 года (остаток прав в пользовании)', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '750 000,00 ₽', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '—', font: 'Times New Roman', size: 18 })] })] })
              ]
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 100, after: 120, line: 240 },
          children: [new TextRun({ text: 'Примечание: в соответствии с Инструкцией по применению Плана счетов бухгалтерского учета амортизация по забалансовому счету 012 не начисляется. Объект учитывается в неизменной согласованной оценке софинансирования на протяжении всего периода действия неисключительной лицензии.', font: 'Times New Roman', size: 18 })]
        }),
        new Paragraph({
          spacing: { before: 120 },
          children: [
            new TextRun({ text: 'Директор АНО «ЦПЗ ЮГ-ПРАВО»\n(лицо, ответственное за ведение бухгалтерского учета):\n', bold: true, font: 'Times New Roman', size: 20 }),
            new TextRun({ text: '_________________________ / П. В. Шарыпаев /', font: 'Times New Roman', size: 20 })
          ]
        }),
        ...(withSignature ? [
          new Paragraph({
            spacing: { before: 60 },
            children: [
              new ImageRun({
                data: sealBuffer,
                transformation: { width: 140, height: 75 }
              })
            ]
          })
        ] : [])
      ]
    }]
  });
  return await Packer.toBuffer(doc);
}

// 2. БУХГАЛТЕРСКАЯ СПРАВКА К ПРОВОДКЕ ДТ 012
async function createBuhSpravkaRID(withSignature = true) {
  const doc = new Document({
    sections: [{
      properties: defaultPageProps(),
      children: [
        ...makeHeader(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({ text: 'БУХГАЛТЕРСКАЯ СПРАВКА-РАСЧЕТ № БС-012/26\n', bold: true, font: 'Times New Roman', size: 24 }),
            new TextRun({ text: 'об отражении в учете прав использования нематериальных активов (РИД) и признании софинансирования\n(ст. 9 Федерального закона от 06.12.2011 № 402-ФЗ «О бухгалтерском учете»)', font: 'Times New Roman', size: 18 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.BOTH,
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'Самарская область, п. Южный', bold: true, font: 'Times New Roman', size: 20 }),
            new TextRun({ text: '\t\t\t\t«31» августа 2026 г.', bold: true, font: 'Times New Roman', size: 20 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 80, line: 240 },
          children: [new TextRun({ text: '1. Настоящая бухгалтерская справка составлена Директором АНО «ЦПЗ ЮГ-ПРАВО» Шарыпаевым П.В. (лицом, ответственным за ведение бухучета согласно ч. 3 ст. 7 Закона № 402-ФЗ и Приказу № 1 от 01.08.2026 г.) во исполнение Решения Единственного учредителя № 2 от 29.08.2026 г., Лицензионного договора № 01/РИД от 29.08.2026 г., Акта приема-передачи от 29.08.2026 г. и Приказа Директора № 04/ОД от 31.08.2026 г.', font: 'Times New Roman', size: 20 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 80, line: 240 },
          children: [new TextRun({ text: '2. Организации на условиях безвозмездной простой (неисключительной) лицензии переданы права использования объекта интеллектуальной деятельности: цифрового комплекса веб-платформы yugpravo.ru, базы знаний, правовых калькуляторов и доменного имени yugpravo.ru. Исключительные права и статус администратора домена сохранены за автором (Шарыпаевым П.В.).', font: 'Times New Roman', size: 20 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 80, line: 240 },
          children: [new TextRun({ text: '3. Согласно Экспертному сметному расчету (Приложение № 1 к Договору) рыночная стоимость создания и технического сопровождения передаваемого комплекса составляет 750 000 (Семьсот пятьдесят тысяч) рублей 00 копеек. Указанная сумма признана официальным неденежным добровольческим софинансированием уставной деятельности АНО для участия в грантовых конкурсах (ФПГ, ПФКИ, субсидии).', font: 'Times New Roman', size: 20 })]
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 100, after: 60 },
          children: [new TextRun({ text: '4. БУХГАЛТЕРСКИЕ ЗАПИСИ (ПРОВОДКИ) ЗА АВГУСТ 2026 ГОДА:', bold: true, font: 'Times New Roman', size: 20 })]
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Дебет счета', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Кредит счета', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Сумма (руб.)', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ width: { size: 35, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Содержание проводки', bold: true, font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '012\n(Забалансовый)', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '—\n(Простая запись)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '750 000,00 ₽', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Отражено принятие на забалансовый учет прав пользования программным комплексом и доменным именем yugpravo.ru', font: 'Times New Roman', size: 18 })] })] })
              ]
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 100, after: 120, line: 240 },
          children: [new TextRun({ text: '5. В соответствии с пп. 14 п. 1 ст. 251 и ст. 346.15 Налогового кодекса РФ, а также письмами Минфина России, имущественные права, полученные некоммерческой организацией на ведение уставной деятельности, не образуют налогооблагаемого дохода при УСН (Доходы 6%).', font: 'Times New Roman', size: 18 })]
        }),
        new Paragraph({
          spacing: { before: 120 },
          children: [
            new TextRun({ text: 'Директор АНО «ЦПЗ ЮГ-ПРАВО»\n(лицо, ответственное за ведение бухгалтерского учета):\n', bold: true, font: 'Times New Roman', size: 20 }),
            new TextRun({ text: '_________________________ / П. В. Шарыпаев /', font: 'Times New Roman', size: 20 })
          ]
        }),
        ...(withSignature ? [
          new Paragraph({
            spacing: { before: 60 },
            children: [
              new ImageRun({
                data: sealBuffer,
                transformation: { width: 140, height: 75 }
              })
            ]
          })
        ] : [])
      ]
    }]
  });
  return await Packer.toBuffer(doc);
}

// 3. ВЕДОМОСТЬ АНАЛИТИЧЕСКОГО УЧЕТА ПОЖЕРТВОВАНИЙ ПО СЧЕТУ 86
async function createVedomost86(withSignature = true) {
  const doc = new Document({
    sections: [{
      properties: defaultPageProps(),
      children: [
        ...makeHeader(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({ text: 'ВЕДОМОСТЬ АНАЛИТИЧЕСКОГО РАЗДЕЛЬНОГО УЧЕТА\nПО СЧЕТУ 86 «ЦЕЛЕВОЕ ФИНАНСИРОВАНИЕ» НА 2026 ГОД\n', bold: true, font: 'Times New Roman', size: 24 }),
            new TextRun({ text: '(Регистр раздельного учета целевых поступлений в соответствии с п. 2 ст. 251 НК РФ, ст. 582 ГК РФ, Приказом № 03/ОД)', font: 'Times New Roman', size: 18 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.BOTH,
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'Самарская область, п. Южный', bold: true, font: 'Times New Roman', size: 20 }),
            new TextRun({ text: '\t\t\t\tПериод: с 01.08.2026 по 31.12.2026 г.', bold: true, font: 'Times New Roman', size: 20 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 240 },
          children: [new TextRun({ text: 'Настоящая ведомость открыта для обеспечения раздельного аналитического учета пожертвований и добровольных взносов, поступающих на уставную деятельность АНО «ЦПЗ ЮГ-ПРАВО» на расчетный счет № 40703810600000751961 в АО «ТБанк» (БИК 044525974).', font: 'Times New Roman', size: 20 })]
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: '№ п/п', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Субсчет 86', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Наименование целевой программы / источника', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Форма взноса', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Налоговый статус', bold: true, font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '1', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '86.01', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Пожертвования физических лиц на уставную деятельность (Публичная оферта, эквайринг ТБанк, QR ГОСТ)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Безналичные (рубли)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Не облагается (п. 2 ст. 251 НК РФ)', font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '2', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '86.02', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Целевые пожертвования юридических лиц по типовым договорам (суммы свыше 3 000 ₽)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Безналичные (расчетный счет)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Не облагается (п. 2 ст. 251 НК РФ)', font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '3', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '86.03', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Гранты Президента РФ и субсидии государственных органов на реализацию социальных проектов', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Целевое финансирование', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Не облагается (п. 2 ст. 251 НК РФ)', font: 'Times New Roman', size: 18 })] })] })
              ]
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 120, after: 140, line: 240 },
          children: [new TextRun({ text: 'Порядок ведения: данные о поступивших суммах вносятся на основании банковских выписок АО «ТБанк». Ежеквартально формируется сводный отчет об использовании целевых средств для предоставления в Управление Минюста России по Самарской области.', font: 'Times New Roman', size: 18 })]
        }),
        new Paragraph({
          spacing: { before: 120 },
          children: [
            new TextRun({ text: 'Директор АНО «ЦПЗ ЮГ-ПРАВО»\n(лицо, ответственное за ведение бухгалтерского учета):\n', bold: true, font: 'Times New Roman', size: 20 }),
            new TextRun({ text: '_________________________ / П. В. Шарыпаев /', font: 'Times New Roman', size: 20 })
          ]
        }),
        ...(withSignature ? [
          new Paragraph({
            spacing: { before: 60 },
            children: [
              new ImageRun({
                data: sealBuffer,
                transformation: { width: 140, height: 75 }
              })
            ]
          })
        ] : [])
      ]
    }]
  });
  return await Packer.toBuffer(doc);
}

// ── ЗАГРУЗКА В ПАПКУ «БУХГАЛТЕРИЯ 2026» НА ЯНДЕКС.ДИСК ──
async function uploadToAccountingDir(fileList) {
  function uploadOne(localPath, remotePath) {
    return new Promise(resolve => {
      const uploadUrlEndpoint = 'https://cloud-api.yandex.net/v1/disk/resources/upload?path=' + encodeURIComponent(remotePath) + '&overwrite=true';
      https.get(uploadUrlEndpoint, { headers: { Authorization: 'OAuth ' + token, 'User-Agent': 'NodeJS' } }, res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try {
            const j = JSON.parse(d);
            if (j.href) {
              const buf = fs.readFileSync(localPath);
              const u = new URL(j.href);
              const opt = {
                hostname: u.hostname,
                path: u.pathname + u.search,
                method: 'PUT',
                headers: { 'Content-Length': buf.length }
              };
              const reqUpload = https.request(opt, uploadRes => {
                console.log('📊 Бухгалтерия 2026 обновлена:', path.basename(localPath));
                resolve();
              });
              reqUpload.on('error', () => resolve());
              reqUpload.write(buf);
              reqUpload.end();
            } else { resolve(); }
          } catch(e) { resolve(); }
        });
      }).on('error', () => resolve());
    });
  }

  for (const f of fileList) {
    if (fs.existsSync(f)) {
      await uploadOne(f, accDir + '/' + path.basename(f));
    }
  }
}

async function run() {
  console.log('📊 Генерация бухгалтерских документов и регистров учета АНО «ЦПЗ ЮГ-ПРАВО»...');

  // 1. Карточка учета объекта НМА по счету 012 (750 000 ₽)
  const k12WithSeal = await createKartochka012(true);
  fs.writeFileSync('docs/kartochka-ucheta-nma-schet-012.docx', k12WithSeal);

  const k12Clean = await createKartochka012(false);
  fs.writeFileSync('docs/kartochka-ucheta-nma-schet-012-dlya-pechati-original.docx', k12Clean);

  // 2. Бухгалтерская справка-расчет к проводке Дт 012
  const spravkaWithSeal = await createBuhSpravkaRID(true);
  fs.writeFileSync('docs/buhgalterskaya-spravka-uchet-rid-750k.docx', spravkaWithSeal);

  const spravkaClean = await createBuhSpravkaRID(false);
  fs.writeFileSync('docs/buhgalterskaya-spravka-uchet-rid-750k-dlya-pechati-original.docx', spravkaClean);

  // 3. Ведомость раздельного учета по счету 86
  const v86WithSeal = await createVedomost86(true);
  fs.writeFileSync('docs/vedomost-ucheta-pozhertvovaniy-schet-86.docx', v86WithSeal);

  const v86Clean = await createVedomost86(false);
  fs.writeFileSync('docs/vedomost-ucheta-pozhertvovaniy-schet-86-dlya-pechati-original.docx', v86Clean);

  console.log('✅ Все бухгалтерские документы успешно созданы локально!');

  // 4. Загрузка в облако Яндекс.Диска в новую папку «Бухгалтерия 2026»
  console.log('☁️ Загрузка бухгалтерских документов в папку «Бухгалтерия 2026» на Яндекс.Диск...');
  const accDocs = [
    'docs/kartochka-ucheta-nma-schet-012.docx',
    'docs/kartochka-ucheta-nma-schet-012-dlya-pechati-original.docx',
    'docs/buhgalterskaya-spravka-uchet-rid-750k.docx',
    'docs/buhgalterskaya-spravka-uchet-rid-750k-dlya-pechati-original.docx',
    'docs/vedomost-ucheta-pozhertvovaniy-schet-86.docx',
    'docs/vedomost-ucheta-pozhertvovaniy-schet-86-dlya-pechati-original.docx',
    'docs/prikaz-03-uchet-politika.docx',
    'docs/prikaz-03-dlya-pechati-original.docx'
  ];
  await uploadToAccountingDir(accDocs);
  console.log('🎉 Папка «Бухгалтерия 2026» на Яндекс.Диске полностью укомплектована!');
}

run().catch(console.error);
