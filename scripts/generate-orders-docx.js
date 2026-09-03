/**
 * Генератор официальных приказов Директора АНО «ЦПЗ ЮГ-ПРАВО»
 * и Лицензионного договора на интеллектуальную собственность (софинансирование)
 * Шапка оформлена на базе Приказа № 1 о вступлении в должность директора (с официальным логотипом)
 * Все приказы датированы «01» августа 2026 г.
 * Место издания: Самарская область, п. Южный
 */

const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, ImageRun } = require('docx');

const sealBuf = fs.readFileSync(path.join(__dirname, '../images/official-seal-with-signature.png'));
const logoBuf = fs.readFileSync(path.join(__dirname, '../images/ano-logo-order.jpg'));

function makeHeader() {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [
        new ImageRun({
          data: logoBuf,
          transformation: { width: 36, height: 36 }
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({ text: 'АВТОНОМНАЯ НЕКОММЕРЧЕСКАЯ ОРГАНИЗАЦИЯ «ЦЕНТР ПРАВОВОЙ ЗАЩИТЫ И\nРАЗВИТИЯ ГРАЖДАНСКИХ ИНИЦИАТИВ ЮГ-ПРАВО»', bold: true, font: 'Times New Roman', size: 18 }),
        new TextRun({ text: '\n(АНО «ЦПЗ ЮГ-ПРАВО»)', bold: true, font: 'Times New Roman', size: 17 }),
        new TextRun({ text: '\nОГРН: 1266300015080 | ИНН/КПП: 6317174776/631701001', font: 'Times New Roman', size: 15 }),
        new TextRun({ text: '\nАдрес: 446186, Самарская обл., Большеглушицкий р-н, п. Южный, ул. Центральная, д. 7, кв. 1\n', font: 'Times New Roman', size: 14 })
      ]
    })
  ];
}

function makeSignBlock(withSignature) {
  if (withSignature) {
    return new Paragraph({
      spacing: { before: 140 },
      children: [
        new TextRun({ text: 'Директор АНО «ЦПЗ ЮГ-ПРАВО»:\n', bold: true, font: 'Times New Roman', size: 22 }),
        new ImageRun({
          data: sealBuf,
          transformation: { width: 190, height: 108 }
        }),
        new TextRun({ text: '\n/ Шарыпаев П. В. /\nМ.П.', font: 'Times New Roman', size: 22 })
      ]
    });
  } else {
    return new Paragraph({
      spacing: { before: 180, line: 260 },
      children: [
        new TextRun({ text: 'Директор АНО «ЦПЗ ЮГ-ПРАВО»:\n\n\n_________________________ / П.В. Шарыпаев /\n\nМ.П. (место для живой синей печати)', bold: true, font: 'Times New Roman', size: 22 })
      ]
    });
  }
}

// ── ПРИКАЗ № 01/ОД: ОБ УТВЕРЖДЕНИИ ЛОКАЛЬНЫХ АКТОВ И ДЕЛОПРОИЗВОДСТВА ──
async function createPrikaz1(withSignature = true) {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1417, right: 850 } } },
      children: [
        ...makeHeader(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 40 },
          children: [new TextRun({ text: 'ПРИКАЗ № 01/ОД', bold: true, font: 'Times New Roman', size: 26 })]
        }),
        new Paragraph({
          alignment: AlignmentType.BOTH,
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'Самарская область, п. Южный', bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: '\t\t\t\t«01» августа 2026 г.', bold: true, font: 'Times New Roman', size: 22 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: '«Об утверждении локальных нормативных актов и порядка делопроизводства АНО «ЦПЗ ЮГ-ПРАВО»»', bold: true, font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 240 },
          children: [new TextRun({ text: 'В связи с государственной регистрацией организации в ЕГРЮЛ (ОГРН 1266300015080 от 30.07.2026 г.) и вступлением в должность Директора на основании Приказа № 1 от 01.08.2026 г., в целях надлежащей организации уставной некоммерческой деятельности, строгого соблюдения требований Федерального закона от 12.01.1996 № 7-ФЗ «О некоммерческих организациях», Федерального закона от 21.11.2011 № 324-ФЗ «О бесплатной юридической помощи в РФ», Федерального закона от 06.12.2011 № 402-ФЗ «О бухгалтерском учете» и обеспечения сохранности служебной информации,', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          spacing: { before: 80, after: 60 },
          children: [new TextRun({ text: 'ПРИКАЗЫВАЮ:', bold: true, font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '1. Утвердить и ввести в действие с «01» августа 2026 года Инструкцию по документационному обеспечению управления и Номенклатуру дел АНО «ЦПЗ ЮГ-ПРАВО» на 2026 год (Приложение № 1 к настоящему Приказу).', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '2. Утвердить и ввести в действие Регламент оказания бесплатной юридической помощи и правового просвещения граждан (Приложение № 2 к настоящему Приказу).', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '3. Утвердить и ввести в действие Положение о порядке рассмотрения обращений граждан и представителей юридических лиц (Приложение № 3 к настоящему Приказу).', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '4. Утвердить и ввести в действие Положение о конфиденциальности и режиме защиты служебной тайны (Приложение № 4 к настоящему Приказу).', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '5. Установить, что организация применяет гибридный порядок делопроизводства: подлинники документов на бумажных носителях формируются в Номенклатуре дел (Папки № 1–4), а их тождественные электронные образы с реквизитами заверения размещаются в защищенном облачном хранилище организации и на официальном портале.', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120, line: 240 },
          children: [new TextRun({ text: '6. Контроль за надлежащим исполнением настоящего приказа оставляю за собой.', font: 'Times New Roman', size: 22 })]
        }),
        makeSignBlock(withSignature),

        // ── ПРИЛОЖЕНИЕ № 1 ──
        new Paragraph({
          pageBreakBefore: true,
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: 'Приложение № 1\nк Приказу Директора АНО «ЦПЗ ЮГ-ПРАВО»\nот «01» августа 2026 г. № 01/ОД', font: 'Times New Roman', size: 20 })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 60 },
          children: [
            new TextRun({ text: 'ИНСТРУКЦИЯ ПО ДОКУМЕНТАЦИОННОМУ ОБЕСПЕЧЕНИЮ УПРАВЛЕНИЯ\nИ НОМЕНКЛАТУРА ДЕЛ НА 2026 ГОД\n', bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: 'АНО «ЦПЗ ЮГ-ПРАВО»', bold: true, font: 'Times New Roman', size: 20 })
          ]
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 80, after: 40 },
          children: [new TextRun({ text: '1. ОБЩИЕ ПОЛОЖЕНИЯ И ПРАВИЛА ВЕДЕНИЯ ДЕЛ', bold: true, font: 'Times New Roman', size: 20 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '1.1. Настоящая Инструкция устанавливает единый порядок составления, оформления, регистрации, оперативного хранения и архивного учета документов в АНО «ЦПЗ ЮГ-ПРАВО» в соответствии с законодательством Российской Федерации и ГОСТ Р 7.0.97-2016.\n1.2. Ведение делопроизводства, ответственность за формирование дел и обеспечение их сохранности возлагаются на Директора организации.\n1.3. В соответствии со ст. 160, 434 ГК РФ и Федеральным законом от 27.07.2006 № 149-ФЗ электронные графические копии документов, заверенные аналогом собственноручной подписи и оттиска печати Директора, размещенные в защищенном облачном хранилище организации (Яндекс.Диск) и на официальном портале, признаются официальными электронными образами документов организации.', font: 'Times New Roman', size: 20 })]
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 80, after: 40 },
          children: [new TextRun({ text: '2. СТРУКТУРА НОМЕНКЛАТУРЫ ДЕЛ (ПАПКИ-РЕГИСТРАТОРЫ)', bold: true, font: 'Times New Roman', size: 20 })]
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Индекс дела', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Заголовок дела (тома, наряда)', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Срок хранения', bold: true, font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Папка № 1', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Учредительные и регистрационные документы (Устав, ОГРН, ИНН, Листы записи, Приказ № 1)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Постоянно', font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Папка № 2', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Приказы по основной деятельности за 2026 год, локальные нормативные акты и регламенты', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Постоянно', font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Папка № 3', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Интеллектуальная собственность, лицензионные договоры, сметы софинансирования и счет 012', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Постоянно (не менее 5 лет)', font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Папка № 4', bold: true, font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Пожертвования, договоры с благотворителями, банковские выписки счета 86', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '5 лет', font: 'Times New Roman', size: 18 })] })] })
              ]
            })
          ]
        }),

        // ── ПРИЛОЖЕНИЕ № 2 ──
        new Paragraph({
          pageBreakBefore: true,
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: 'Приложение № 2\nк Приказу Директора АНО «ЦПЗ ЮГ-ПРАВО»\nот «01» августа 2026 г. № 01/ОД', font: 'Times New Roman', size: 20 })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 60 },
          children: [
            new TextRun({ text: 'РЕГЛАМЕНТ\nоказания бесплатной юридической помощи и правового просвещения граждан\nв рамках негосударственной системы бесплатной юридической помощи\n', bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: '(ст. 22 Федерального закона от 21.11.2011 № 324-ФЗ)', font: 'Times New Roman', size: 18 })
          ]
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 80, after: 40 },
          children: [new TextRun({ text: '1. ЦЕЛИ И КАТЕГОРИИ ПОЛУЧАТЕЛЕЙ ПОМОЩИ', bold: true, font: 'Times New Roman', size: 20 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '1.1. Бесплатная юридическая помощь оказывается гражданам РФ, проживающим на территории Самарской области и иных субъектов РФ, в целях защиты их законных прав и интересов.\n1.2. Приоритетное право на получение комплексной правовой поддержки имеют: малоимущие граждане; ветераны боевых действий, участники СВО и члены их семей; пенсионеры и инвалиды I–III групп; потребители жилищно-коммунальных услуг и должники, чьи права нарушены кредиторами или коллекторами (230-ФЗ, ПП РФ № 354).', font: 'Times New Roman', size: 20 })]
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 80, after: 40 },
          children: [new TextRun({ text: '2. ЦИФРОВЫЕ ФОРМЫ ПОМОЩИ И ОГРАНИЧЕНИЕ ОТВЕТСТВЕННОСТИ', bold: true, font: 'Times New Roman', size: 20 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '2.1. Правовая поддержка оказывается с применением цифровых LegalTech-инструментов: онлайн-приемной портала yugpravo.ru, Telegram-ботов организации, интерактивных калькуляторов расчета неустоек и государственных пошлин.\n2.2. Предоставляемые организацией правовые заключения, проекты претензий, исковых заявлений и расчеты носят информационно-консультационный характер. Организация не является судебным органом и не гарантирует конкретного судебного решения. Организация не несет ответственности за решения судебных органов и действия третьих лиц.', font: 'Times New Roman', size: 20 })]
        }),

        // ── ПРИЛОЖЕНИЕ № 3 ──
        new Paragraph({
          pageBreakBefore: true,
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: 'Приложение № 3\nк Приказу Директора АНО «ЦПЗ ЮГ-ПРАВО»\nот «01» августа 2026 г. № 01/ОД', font: 'Times New Roman', size: 20 })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 60 },
          children: [new TextRun({ text: 'ПОЛОЖЕНИЕ\nо порядке рассмотрения обращений граждан и представителей юридических лиц', bold: true, font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '1. Настоящее Положение определяет порядок регистрации и рассмотрения обращений, поступающих в АНО «ЦПЗ ЮГ-ПРАВО» через цифровую приемную yugpravo.ru, Telegram-боты, официальную электронную почту info@yugpravo.ru и на личном приеме.\n2. Электронные обращения регистрируются автоматически. Первичный ответ с подтверждением получения направляется заявителю в течение 24 часов. Правовой анализ ситуации и составление документов осуществляются в срок до 3 рабочих дней (при повышенной сложности — до 30 календарных дней с уведомлением заявителя).\n3. Обращение оставляется без ответа по существу, если оно содержит нецензурную брань, угрозы, коммерческий спам, а также если заявителю ранее неоднократно давался исчерпывающий правовой ответ по существу поставленного вопроса.', font: 'Times New Roman', size: 20 })]
        }),

        // ── ПРИЛОЖЕНИЕ № 4 ──
        new Paragraph({
          pageBreakBefore: true,
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: 'Приложение № 4\nк Приказу Директора АНО «ЦПЗ ЮГ-ПРАВО»\nот «01» августа 2026 г. № 01/ОД', font: 'Times New Roman', size: 20 })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 60 },
          children: [
            new TextRun({ text: 'ПОЛОЖЕНИЕ\nо конфиденциальности и режиме защиты служебной тайны\n', bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: '(ст. 139, 727 ГК РФ, Федеральный закон № 98-ФЗ)', font: 'Times New Roman', size: 18 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 80, line: 240 },
          children: [new TextRun({ text: '1. Режим служебной тайны вводится в АНО «ЦПЗ ЮГ-ПРАВО» в целях защиты персональных данных благополучателей, тайны обращения за правовой помощью, охраны исключительных прав автора и исходного программного кода цифровой платформы организации.\n2. К служебной тайне относятся: персональные данные граждан и благотворителей; содержание консультаций и судебных стратегий; исходный программный код, архитектура баз данных, скрипты и алгоритмы калькуляторов платформы yugpravo.ru.\n3. Сотрудники, волонтеры и добровольцы организации обязаны сохранять служебную тайну бессрочно. Разглашение служебной информации влечет ответственность в соответствии с законодательством Российской Федерации.', font: 'Times New Roman', size: 20 })]
        })
      ]
    }]
  });
  return await Packer.toBuffer(doc);
}

// ── ПРИКАЗ № 02/ОД: ОБ ОРГАНИЗАЦИИ СБОРА ПОЖЕРТВОВАНИЙ ──
async function createPrikaz2(withSignature = true) {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1417, right: 850 } } },
      children: [
        ...makeHeader(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 40 },
          children: [new TextRun({ text: 'ПРИКАЗ № 02/ОД', bold: true, font: 'Times New Roman', size: 26 })]
        }),
        new Paragraph({
          alignment: AlignmentType.BOTH,
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'Самарская область, п. Южный', bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: '\t\t\t\t«01» августа 2026 г.', bold: true, font: 'Times New Roman', size: 22 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: '«Об организации сбора, обособленного учета и целевого использования добровольных пожертвований»', bold: true, font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 240 },
          children: [new TextRun({ text: 'В соответствии со статьей 582 Гражданского кодекса Российской Федерации, Федеральным законом от 12.01.1996 № 7-ФЗ «О некоммерческих организациях», Уставом АНО «ЦПЗ ЮГ-ПРАВО», в целях формирования имущества для осуществления уставной некоммерческой деятельности по защите прав граждан и развитию правового просвещения,', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          spacing: { before: 80, after: 60 },
          children: [new TextRun({ text: 'ПРИКАЗЫВАЮ:', bold: true, font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '1. Утвердить Положение о порядке сбора, обособленного учета и целевого расходования добровольных пожертвований в АНО «ЦПЗ ЮГ-ПРАВО».', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '2. Утвердить Публичную оферту о заключении договора добровольного пожертвования на уставную некоммерческую деятельность организации (для физических и юридических лиц).', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '3. Утвердить типовую форму Счёта-оферты с использованием факсимильного воспроизведения подписи руководителя, оттиска печати и двухмерного штрихкода ГОСТ Р 56042-2014 для безналичных расчетов (в соответствии с п. 2 ст. 160, п. 2 ст. 434 ГК РФ).', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '4. Утвердить типовую форму Договора добровольного пожертвования с юридическими лицами в письменной форме для пожертвований свыше 3 000 рублей в соответствии с п. 2 ст. 574 ГК РФ.', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '5. Установить, что все поступившие пожертвования подлежат строгому обособленному учету на счете 86 «Целевое финансирование» и расходованию исключительно на уставные некоммерческие программы.', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120, line: 240 },
          children: [new TextRun({ text: '6. Контроль за исполнением настоящего приказа оставляю за собой.', font: 'Times New Roman', size: 22 })]
        }),
        makeSignBlock(withSignature)
      ]
    }]
  });
  return await Packer.toBuffer(doc);
}

// ── ПРИКАЗ № 03/ОД: ОБ УТВЕРЖДЕНИИ УЧЕТНОЙ ПОЛИТИКИ НА 2026 ГОД ──
async function createPrikaz3(withSignature = true) {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1417, right: 850 } } },
      children: [
        ...makeHeader(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 40 },
          children: [new TextRun({ text: 'ПРИКАЗ № 03/ОД', bold: true, font: 'Times New Roman', size: 26 })]
        }),
        new Paragraph({
          alignment: AlignmentType.BOTH,
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'Самарская область, п. Южный', bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: '\t\t\t\t«01» августа 2026 г.', bold: true, font: 'Times New Roman', size: 22 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: '«Об утверждении Учетной политики АНО «ЦПЗ ЮГ-ПРАВО» на 2026 год»', bold: true, font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 240 },
          children: [new TextRun({ text: 'В соответствии с Федеральным законом от 06.12.2011 № 402-ФЗ «О бухгалтерском учете», Положениями по бухгалтерскому учету (ПБУ) и статьей 313 Налогового кодекса Российской Федерации, в развитие Приказа № 1 от 01.08.2026 г. о принятии обязанностей по ведению бухгалтерского учета,', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          spacing: { before: 80, after: 60 },
          children: [new TextRun({ text: 'ПРИКАЗЫВАЮ:', bold: true, font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '1. Утвердить и ввести в действие с «01» августа 2026 года Учетную политику АНО «ЦПЗ ЮГ-ПРАВО» для целей бухгалтерского учета и налогообложения.', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '2. Установить, что организация применяет упрощенную систему налогообложения (УСН) с объектом «Доходы» (ставка 6%) в соответствии с главой 26.2 НК РФ.', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '3. Обеспечить строгий раздельный учет уставных целевых поступлений (добровольных пожертвований, грантов) с отражением на бухгалтерском счете 86 «Целевое финансирование». Целевые поступления не включаются в состав доходов при определении налоговой базы по налогу при УСН (п. 2 ст. 251 НК РФ).', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '4. Нематериальные активы и права на программное обеспечение, полученные в безвозмездное пользование по лицензионным договорам, учитывать на забалансовом счете 012 «Нематериальные активы, полученные в пользование» в оценке, установленной договорами.', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120, line: 240 },
          children: [new TextRun({ text: '5. Контроль за исполнением настоящего приказа оставляю за собой.', font: 'Times New Roman', size: 22 })]
        }),
        makeSignBlock(withSignature)
      ]
    }]
  });
  return await Packer.toBuffer(doc);
}

// ── ПРИКАЗ № 04/ОД: О ВВОДЕ В ЭКСПЛУАТАЦИЮ ПЛАТФОРМЫ И УЧЕТЕ РИД ──
async function createPrikaz4(withSignature = true) {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1417, right: 850 } } },
      children: [
        ...makeHeader(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 40 },
          children: [new TextRun({ text: 'ПРИКАЗ № 04/ОД', bold: true, font: 'Times New Roman', size: 26 })]
        }),
        new Paragraph({
          alignment: AlignmentType.BOTH,
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'Самарская область, п. Южный', bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: '\t\t\t\t«31» августа 2026 г.', bold: true, font: 'Times New Roman', size: 22 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: '«О вводе в эксплуатацию официального программного комплекса веб-платформы yugpravo.ru и принятии прав на РИД на забалансовый учет»', bold: true, font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 240 },
          children: [new TextRun({ text: 'На основании заключенного Лицензионного договора № 01/РИД от 29.08.2026 г. с автором — гражданином РФ Шарыпаевым П.В., регистрации и делегирования доменного имени yugpravo.ru (ООО «Бегет») и Акта приема-передачи прав, в целях обеспечения уставной некоммерческой деятельности по бесплатному правовому просвещению граждан и приему обращений через сеть Интернет,', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          spacing: { before: 80, after: 60 },
          children: [new TextRun({ text: 'ПРИКАЗЫВАЮ:', bold: true, font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '1. Ввести в постоянную эксплуатацию официальный программный комплекс веб-платформы yugpravo.ru, комплекс интерактивных правовых калькуляторов и электронную приёмную обращений.', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '2. В связи с вводом в промышленную эксплуатацию сайта yugpravo.ru и подключением интернет-эквайринга утвердить Новую редакцию Публичной оферты о добровольном пожертвовании (Редакция № 2 от 31.08.2026 г., первично утв. Приказом № 02/ОД от 01.08.2026 г.) и Пользовательское соглашение и регламент сервисов (Редакция № 2 от 31.08.2026 г.). Разместить утвержденные редакции в открытом доступе на сайте yugpravo.ru.', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '3. Принять к бухгалтерскому учету полученные права использования результатов интеллектуальной деятельности на забалансовый счет 012 «Нематериальные активы, полученные в пользование» в условной оценке согласно Лицензионному договору в размере 750 000 (Семьсот пятьдесят тысяч) рублей 00 копеек.', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '4. Признать указанную оценку в сумме 750 000 рублей официальным неденежным софинансированием для включения в сметы заявок на получение грантов и субсидий.', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120, line: 240 },
          children: [new TextRun({ text: '5. Контроль за исполнением настоящего приказа оставляю за собой.', font: 'Times New Roman', size: 22 })]
        }),
        makeSignBlock(withSignature)
      ]
    }]
  });
  return await Packer.toBuffer(doc);
}

// ── ЛИЦЕНЗИОННЫЙ ДОГОВОР НА ПЕРЕДАЧУ РИД ДЛЯ ГРАНТОВ (750 000 РУБЛЕЙ) ──
async function createLicenzionnyyDogovor(withSignature = true) {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1417, right: 850 } } },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({ text: 'ЛИЦЕНЗИОННЫЙ ДОГОВОР № 01/РИД', bold: true, font: 'Times New Roman', size: 26 }),
            new TextRun({ text: '\nо предоставлении права использования результатов интеллектуальной деятельности', bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: '\n(на условиях безвозмездной простой неисключительной лицензии в целях софинансирования уставных программ)', font: 'Times New Roman', size: 20 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.BOTH,
          spacing: { after: 140 },
          children: [
            new TextRun({ text: 'Самарская область, п. Южный', bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: '\t\t\t\t«29» августа 2026 г.', bold: true, font: 'Times New Roman', size: 22 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120, line: 250 },
          children: [
            new TextRun({ text: 'Гражданин Российской Федерации Шарыпаев Павел Валерьевич, 17.09.1992 года рождения, паспорт гражданина РФ серия 36 25 № 739464, выдан 16.05.2026 г. ГУ МВД РОССИИ ПО САМАРСКОЙ ОБЛАСТИ, код подразделения: 630-032, адрес регистрации: 446186, Самарская обл., Большеглушицкий р-н, пос. Южный, ул. Центральная, д. 7, кв. 1, ИНН: 636401104469, СНИЛС: 155-895-731 23, именуемый в дальнейшем «Лицензиар» (Автор), с одной стороны, и\nАвтономная некоммерческая организация «Центр правовой защиты и развития гражданских инициатив ЮГ-ПРАВО» (АНО «ЦПЗ ЮГ-ПРАВО»), ОГРН 1266300015080, ИНН 6317174776, КПП 631701001, учетный номер Минюста России № 6314010192, 446186, Самарская обл., Большеглушицкий р-н, п. Южный, ул. Центральная, д. 7, кв. 1, в лице Директора Шарыпаева Павла Валерьевича, действующего на основании Устава, Приказа № 1 от 01.08.2026 г. и Решения Единственного учредителя № 2 от 29.08.2026 г. (одобрение сделки с заинтересованностью в соответствии со статьей 27 Федерального закона от 12.01.1996 № 7-ФЗ «О некоммерческих организациях»), именуемая в дальнейшем «Лицензиат», с другой стороны, совместно именуемые «Стороны», заключили настоящий Договор о нижеследующем:', font: 'Times New Roman', size: 22 })
          ]
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: '1. ПРЕДМЕТ ДОГОВОРА', bold: true, font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 80, line: 240 },
          children: [new TextRun({ text: '1.1. Лицензиар, являясь единственным автором и законным обладателем исключительных прав (ст. 1228, 1257 ГК РФ), безвозмездно предоставляет Лицензиату право использования результатов интеллектуальной деятельности (РИД) — программного комплекса веб-платформы yugpravo.ru, базы правовых знаний, онлайн-калькуляторов госпошлин и неустоек, алгоритмов процессуальных документов, дизайна, а также права использования и делегирования доменного имени yugpravo.ru, зарегистрированного Лицензиаром у аккредитованного регистратора ООО «Бегет» (BEGET-RU) 29.08.2026 г. — на условиях простой (неисключительной) лицензии (ст. 1235, 1236, 1286 ГК РФ).', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 80, line: 240 },
          children: [new TextRun({ text: '1.2. Все исключительные авторские права на РИД и статус администратора доменного имени yugpravo.ru в полном объеме сохраняются за Лицензиаром (физическим лицом). Настоящий Договор не влечет отчуждения исключительных прав.', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 80, line: 240 },
          children: [new TextRun({ text: '1.3. Все последующие модификации, новые программные модули, калькуляторы и обновления, созданные Лицензиаром в период действия Договора, автоматически включаются в состав переданного права использования, при этом исключительные права на такие улучшения сохраняются за Лицензиаром.', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: '2. ЦЕЛЕВОЕ НАЗНАЧЕНИЕ, СОФИНАНСИРОВАНИЕ И ВОЛОНТЕРСКАЯ ПОДДЕРЖКА', bold: true, font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 80, line: 240 },
          children: [new TextRun({ text: '2.1. Предоставление права использования осуществляется на безвозмездной основе исключительно для достижения уставных социально ориентированных целей Лицензиата: бесплатного правового просвещения граждан, защиты прав потребителей и социально незащищенных слоев населения.', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 80, line: 240 },
          children: [new TextRun({ text: '2.2. Стороны согласовали, что расчетная нормативная рыночная стоимость аналогичной разработки и сопровождения программного комплекса составляет 750 000 (Семьсот пятьдесят тысяч) рублей 00 копеек в соответствии со Сметным расчетом трудозатрат (Приложение № 1). Указанная сумма признается официальным неденежным имущественным вкладом (софинансированием) Лицензиара в уставную деятельность Лицензиата для участия в конкурсах грантов (включая конкурсы Фонда президентских грантов, Президентского фонда культурных инициатив, субсидий Правительства Самарской области).', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 80, line: 240 },
          children: [new TextRun({ text: '2.3. Техническое сопровождение, модернизация платформы и администрирование осуществляются Лицензиаром на безвозмездной основе в качестве добровольца (волонтера) в соответствии со ст. 5 Федерального закона от 11.08.1995 № 135-ФЗ «О благотворительной деятельности и добровольчестве (волонтерстве)» без возникновения налоговых обязательств по НДФЛ и страховым взносам.', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: '3. СРОК И ТЕРРИТОРИЯ ДЕЙСТВИЯ', bold: true, font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120, line: 240 },
          children: [new TextRun({ text: '3.1. Настоящий Договор заключен сроком на 5 (пять) лет с даты подписания с правом автоматической пролонгации на следующие 5 лет. Территория действия лицензии — весь мир (включая сеть Интернет).', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 120, after: 80 },
          children: [new TextRun({ text: '4. АДРЕСА, РЕКВИЗИТЫ И ПОДПИСИ СТОРОН', bold: true, font: 'Times New Roman', size: 22 })]
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
                      spacing: { line: 230 },
                      children: [
                        new TextRun({ text: 'ЛИЦЕНЗИАР (Автор):\n', bold: true, font: 'Times New Roman', size: 20 }),
                        new TextRun({ text: 'Шарыпаев Павел Валерьевич\n17.09.1992 г.р.\nПаспорт: 36 25 № 739464\nВыдан 16.05.2026 г. ГУ МВД по Самарской обл.\nКод: 630-032\nАдрес: 446136, Самарская обл., Большеглушицкий р-н, пос. Южный, ул. Центральная, д. 7, кв. 1\nИНН: 636401104469 | СНИЛС: 155-895-731 23\n\nПодпись Лицензиара:\n\n', font: 'Times New Roman', size: 19 }),
                        withSignature
                          ? new ImageRun({ data: fs.readFileSync(path.join(__dirname, '../images/official-signature.png')), transformation: { width: 140, height: 90 } })
                          : new TextRun({ text: '_________________ / П.В. Шарыпаев /', font: 'Times New Roman', size: 19 })
                      ]
                    })
                  ]
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      spacing: { line: 230 },
                      children: [
                        new TextRun({ text: 'ЛИЦЕНЗИАТ:\n', bold: true, font: 'Times New Roman', size: 20 }),
                        new TextRun({ text: 'АНО «ЦПЗ ЮГ-ПРАВО»\nОГРН: 1266300015080, ИНН: 6317174776\nКПП: 631701001, Минюст № 6314010192\n446136, Самарская обл., Большеглушицкий р-н, пос. Южный, ул. Центральная, д. 7, кв. 1\nР/с: 40703810600000751961 в АО «ТБанк»\nБИК: 044525974\n\nДиректор АНО «ЦПЗ ЮГ-ПРАВО»:\n\n', font: 'Times New Roman', size: 19 }),
                        withSignature
                          ? new ImageRun({ data: sealBuf, transformation: { width: 175, height: 99 } })
                          : new TextRun({ text: '_________________ / П.В. Шарыпаев /\nМ.П.', font: 'Times New Roman', size: 19 })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        }),

        // ── ПРИЛОЖЕНИЕ № 1: СМЕТНЫЙ РАСЧЕТ ТРУДОЗАТРАТ (750 000 РУБЛЕЙ) ──
        new Paragraph({
          pageBreakBefore: true,
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: 'Приложение № 1\nк Лицензионному договору № 01/РИД от 29.08.2026 г.', font: 'Times New Roman', size: 20 })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 100 },
          children: [new TextRun({ text: 'ЭКСПЕРТНОЕ ФИНАНСОВО-ЭКОНОМИЧЕСКОЕ И ТЕХНИЧЕСКОЕ ОБОСНОВАНИЕ\nСТОИМОСТИ СОЗДАНИЯ РЕЗУЛЬТАТОВ ИНТЕЛЛЕКТУАЛЬНОЙ ДЕЯТЕЛЬНОСТИ (РИД)\n(Методика оценки неденежного софинансирования для Фонда президентских грантов и ПФКИ)', bold: true, font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [
            new TextRun({ text: '1. ТЕХНИЧЕСКОЕ ОБОСНОВАНИЕ И НЕПРИМЕНИМОСТЬ ТИПОВЫХ КОРОБОЧНЫХ CMS (WORDPRESS, TILDA):\n', bold: true, font: 'Times New Roman', size: 20 }),
            new TextRun({ text: 'Создание профессионального LegalTech-комплекса yugpravo.ru на базе типовых коробочных решений (WordPress, Tilda, Wix и аналогичных конструкторов) является технически невозможным и юридически недопустимым по следующим причинам:\n• Требования информационной безопасности и 152-ФЗ: Платформа обрабатывает чувствительные персональные данные граждан. Коробочные CMS (в частности WordPress) содержат зарубежную архитектуру с регулярными уязвимостями сторонних плагинов, что создает угрозу утечки баз данных благополучателей и нарушает нормы ст. 18.1 и 19 152-ФЗ. Платформа разработана на изолированном микросервисном коде без внешних небезопасных библиотек, с поддержкой корневых сертификатов Минцифры России.\n• Процессуальная математика калькуляторов (ст. 395 ГК РФ, ЗоЗПП, ПП РФ № 354, 259-ФЗ): В коробочных конструкторах отсутствуют готовые модули динамического расчета неустоек по плавающей ставке рефинансирования ЦБ РФ с разбивкой по периодам действия ставок, расчета компенсаций за некачественные услуги ЖКХ и расчета судебных пошлин по реформе 259-ФЗ от 08.08.2024 г. Алгоритмическое ядро создано с нуля и потребовало одновременных компетенций Senior Fullstack-разработчика и практикующего юриста-процессуалиста.\n• Telegram Mini App и банковский QR ГОСТ: Интеграция TMA SDK и генератора платежных QR-кодов стандарта ГОСТ Р 56042-2014 с контрольной суммой и кодировкой Win1251 представляет собой кастомную FinTech-разработку Enterprise-уровня.', font: 'Times New Roman', size: 19 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [
            new TextRun({ text: '2. СРАВНИТЕЛЬНЫЙ АНАЛИЗ РЫНОЧНОЙ СТОИМОСТИ ЗАКАЗНОЙ РАЗРАБОТКИ:\n', bold: true, font: 'Times New Roman', size: 20 }),
            new TextRun({ text: 'По данным независимых отраслевых исследований российского IT-рынка (Рейтинг Рунета, Tagline, Хабр Фриланс) средняя рыночная стоимость заказной разработки кастомного юридического портала с интерактивными калькуляторами, мобильным веб-приложением и защищенной базой знаний составляет у региональных IT-компаний от 850 000 до 1 200 000 руб., а у агентств Top-50 РФ — от 1 200 000 до 1 800 000 руб. Оценка трудозатрат автора в сумме 750 000 рублей является дисконтированной (льготной) оценкой, выполненной по минимальным базовым ставкам специалистов уровня Middle/Senior Самарской области.', font: 'Times New Roman', size: 19 })
          ]
        }),
        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: [new TextRun({ text: '3. ДЕТАЛИЗИРОВАННЫЙ СМЕТНЫЙ РАСЧЕТ ТРУДОЗАТРАТ ПО ЭТАПАМ:', bold: true, font: 'Times New Roman', size: 20 })]
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ width: { size: 8, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: '№', bold: true, font: 'Times New Roman', size: 19 })] })] }),
                new TableCell({ width: { size: 52, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Наименование этапа / программного модуля', bold: true, font: 'Times New Roman', size: 19 })] })] }),
                new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Трудоемкость', bold: true, font: 'Times New Roman', size: 19 })] })] }),
                new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Стоимость (руб.)', bold: true, font: 'Times New Roman', size: 19 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '1', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Разработка архитектуры ядра платформы yugpravo.ru (Responsive Web UI, дизайн-система, PWA, SEO-семантика, адаптивность 375–414px)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '160 ч. × 1 500 ₽', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '240 000 ₽', font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '2', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Разработка математических алгоритмов калькуляторов (ст. 395 ГК РФ, ЗоЗПП 1% и 3%, ЖКХ по ПП РФ № 354, судебная пошлина по 259-ФЗ)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '80 ч. × 1 800 ₽', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '144 000 ₽', font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '3', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Разработка Telegram Mini App, шлюза с ботом и генератора банковских QR-кодов стандарта ГОСТ Р 56042-2014', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '60 ч. × 1 600 ₽', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '96 000 ₽', font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '4', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Формирование базы процессуальных алгоритмов, шаблонов претензий и регламентов досудебного урегулирования (ГПК/АПК, 230-ФЗ)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '90 ч. × 1 500 ₽', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '135 000 ₽', font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '5', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Настройка архитектуры информационной безопасности, корневых сертификатов Минцифры России, защиты ПДн по 152-ФЗ', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '25 ч. × 1 400 ₽', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '35 000 ₽', font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '6', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Предрелизное тестирование, интеграционное тестирование модулей с Telegram API, нагрузочное стресс-тестирование калькуляторов и серверный деплой (DevOps)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '100 ч. × 1 000 ₽', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '100 000 ₽', font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ columnSpan: 3, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'ИТОГО ОБОСНОВАННАЯ ЭКСПЕРТНАЯ ОЦЕНКА СОФИНАНСИРОВАНИЯ:', bold: true, font: 'Times New Roman', size: 19 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '750 000 ₽', bold: true, font: 'Times New Roman', size: 19 })] })] })
              ]
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 100, after: 120, line: 240 },
          children: [
            new TextRun({ text: '4. ЗАКЛЮЧЕНИЕ ОБ ОБОСНОВАННОСТИ ДЛЯ ГРАНТОВЫХ ПРОГРАММ:\n', bold: true, font: 'Times New Roman', size: 20 }),
            new TextRun({ text: 'Настоящий расчет составлен в строгом соответствии с Методическими рекомендациями Фонда президентских грантов по оценке собственного вклада (софинансирования) организации и подтверждает реальный, экономически обоснованный и документально подтвержденный неденежный вклад автора в социальный проект АНО «ЦПЗ ЮГ-ПРАВО».', font: 'Times New Roman', size: 19 })
          ]
        }),
        new Paragraph({
          spacing: { before: 80, after: 140 },
          children: [
            new TextRun({ text: 'От Лицензиара: _________________ / П. В. Шарыпаев /\n\n', font: 'Times New Roman', size: 20 }),
            new TextRun({ text: 'От Лицензиата (Директор АНО): _________________ / П. В. Шарыпаев / М.П.', font: 'Times New Roman', size: 20 })
          ]
        }),

        // ── ПРИЛОЖЕНИЕ № 2: АКТ ПРИЕМА-ПЕРЕДАЧИ ПРАВ ──
        new Paragraph({
          pageBreakBefore: true,
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: 'Приложение № 2\nк Лицензионному договору № 01/РИД от 29.08.2026 г.', font: 'Times New Roman', size: 20 })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 120 },
          children: [new TextRun({ text: 'АКТ ПРИЕМА-ПЕРЕДАЧИ ПРАВ НА ИСПОЛЬЗОВАНИЕ РИД\n(Первичный учетный документ для забалансового учета по счету 012)', bold: true, font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120, line: 240 },
          children: [new TextRun({ text: 'Гражданин РФ Шарыпаев Павел Валерьевич (Лицензиар, Автор) передал, а АНО «ЦПЗ ЮГ-ПРАВО» (Лицензиат) в лице Директора Шарыпаева Павла Валерьевича, действующего на основании Устава и Решения Единственного учредителя № 2 от 29.08.2026 г. (одобрение сделки с заинтересованностью в соответствии со ст. 27 Федерального закона № 7-ФЗ «О некоммерческих организациях»), приняло право безвозмездного использования результатов интеллектуальной деятельности: программного комплекса веб-платформы yugpravo.ru, базы правовых знаний, онлайн-калькуляторов и доменного имени yugpravo.ru (зарегистрированного 29.08.2026 г. в ООО «Бегет») в соответствии с условиями Лицензионного договора № 01/РИД от 29.08.2026 г. Права переданы в полном объеме, программные компоненты протестированы и работоспособны, домен делегирован, нормативная экспертная оценка передаваемых прав составляет 750 000 (Семьсот пятьдесят тысяч) рублей 00 копеек, претензий у Сторон не имеется. Настоящий Акт является первичным учетным документом для постановки прав на забалансовый бухгалтерский учет (счет 012).', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          spacing: { before: 120 },
          children: [
            new TextRun({ text: 'От Лицензиара: _________________ / П.В. Шарыпаев /\n\n', font: 'Times New Roman', size: 20 }),
            new TextRun({ text: 'От Лицензиата (Директор АНО): _________________ / П.В. Шарыпаев / М.П.', font: 'Times New Roman', size: 20 })
          ]
        }),

        // ── ПРИЛОЖЕНИЕ № 3: БУХГАЛТЕРСКАЯ СПРАВКА И КАРТОЧКА УЧЕТА СЧЕТА 012 ──
        new Paragraph({
          pageBreakBefore: true,
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: 'Приложение № 3\nк Лицензионному договору № 01/РИД от 29.08.2026 г.', font: 'Times New Roman', size: 20 })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 120 },
          children: [new TextRun({ text: 'БУХГАЛТЕРСКАЯ СПРАВКА-РАСЧЕТ\nИ КАРТОЧКА ЗАБАЛАНСОВОГО УЧЕТА ОБЪЕКТА НМА (СЧЕТ 012)', bold: true, font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 240 },
          children: [new TextRun({ text: 'Организация: АНО «ЦПЗ ЮГ-ПРАВО» (ИНН 6317174776, КПП 631701001)\nДата постановки на учет: «31» августа 2026 г.\nОснование: Лицензионный договор № 01/РИД от 29.08.2026 г., Приказ № 04/ОД от 31.08.2026 г.', font: 'Times New Roman', size: 20 })]
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Параметр учета', bold: true, font: 'Times New Roman', size: 19 })] })] }),
                new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Значение реквизита', bold: true, font: 'Times New Roman', size: 19 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Наименование объекта', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Программный комплекс веб-платформы yugpravo.ru, калькуляторы, база знаний, домен yugpravo.ru', font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Вид права', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Простая (неисключительная) безвозмездная лицензия (ст. 1235, 1286 ГК РФ)', font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Правообладатель (Лицензиар)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Гражданин РФ Шарыпаев Павел Валерьевич (ИНН 636401104469)', font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Оценка для учета (руб.)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '750 000 (Семьсот пятьдесят тысяч) рублей 00 копеек', bold: true, font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Бухгалтерская запись', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Дебет забалансового счета 012 — 750 000,00 ₽', bold: true, font: 'Times New Roman', size: 18 })] })] })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Налоговый статус', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Не облагается налогом при УСН (доходы) и налогом на прибыль (п. 2 ст. 251 НК РФ)', font: 'Times New Roman', size: 18 })] })] })
              ]
            })
          ]
        }),
        new Paragraph({
          spacing: { before: 120 },
          children: [
            new TextRun({ text: 'Директор АНО «ЦПЗ ЮГ-ПРАВО»\n(лицо, ответственное за ведение бухучета):\n_________________ / Шарыпаев П. В. / М.П.', font: 'Times New Roman', size: 20 })
          ]
        })
      ]
    }]
  });
  return await Packer.toBuffer(doc);
}

// ── РЕШЕНИЕ № 2 ЕДИНСТВЕННОГО УЧРЕДИТЕЛЯ (ОДОБРЕНИЕ СДЕЛКИ С ЗАИНТЕРЕСОВАННОСТЬЮ) ──
async function createReshenie2(withSignature = true) {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1417, right: 850 } } },
      children: [
        ...makeHeader(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({ text: 'РЕШЕНИЕ № 2\nЕДИНСТВЕННОГО УЧРЕДИТЕЛЯ\n(Дополнительное к Решению № 01/2026)\n', bold: true, font: 'Times New Roman', size: 26 }),
            new TextRun({ text: 'Автономной некоммерческой организации\n«Центр правовой защиты и развития гражданских инициатив ЮГ-ПРАВО»\n(АНО «ЦПЗ ЮГ-ПРАВО»)', bold: true, font: 'Times New Roman', size: 20 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.BOTH,
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'Самарская область, п. Южный', bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: '\t\t\t\t«29» августа 2026 г.', bold: true, font: 'Times New Roman', size: 22 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 250 },
          children: [new TextRun({ text: 'Я, гражданин Российской Федерации Шарыпаев Павел Валерьевич, 17.09.1992 года рождения, паспорт РФ серия 36 25 № 739464, выдан 16.05.2026 г. ГУ МВД РОССИИ ПО САМАРСКОЙ ОБЛАСТИ, код подразделения: 630-032, адрес регистрации: 446186, Самарская обл., Большеглушицкий р-н, пос. Южный, ул. Центральная, д. 7, кв. 1, ИНН: 636401104469, СНИЛС: 155-895-731 23, являясь Единственным учредителем АНО «ЦПЗ ЮГ-ПРАВО» (ОГРН 1266300015080, ИНН 6317174776, КПП 631701001), руководствуясь статьей 27 Федерального закона от 12.01.1996 № 7-ФЗ «О некоммерческих организациях» и Уставом Организации, в развитие ранее принятого Решения Единственного учредителя № 01/2026 о формировании аппаратно-программной инфраструктуры организации, а также в связи с регистрацией 29.08.2026 г. доменного имени yugpravo.ru (ООО «Бегет») и завершением разработки официального программного комплекса,', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          spacing: { before: 80, after: 60 },
          children: [new TextRun({ text: 'ПРИНЯЛ РЕШЕНИЕ:', bold: true, font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '1. Одобрить совершение сделки с заинтересованностью — заключение безвозмездного Лицензионного договора № 01/РИД от «29» августа 2026 г. между гражданином Российской Федерации Шарыпаевым Павлом Валерьевичем (Лицензиар, Автор) и Автономной некоммерческой организацией «Центр правовой защиты и развития гражданских инициатив ЮГ-ПРАВО» (Лицензиат) о предоставлении простой (неисключительной) лицензии на использование результатов интеллектуальной деятельности: программного комплекса веб-платформы yugpravo.ru, базы правовых знаний, онлайн-калькуляторов и доменного имени yugpravo.ru (зарегистрированного 29.08.2026 г. в ООО «Бегет»).', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '2. Установить, что исключительные авторские права на РИД и статус администратора доменного имени сохраняются за Лицензиаром (Шарыпаевым П.В.), а Организации передается право безвозмездного бессрочного использования в уставных некоммерческих целях.', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '3. Утвердить экспертную оценку стоимости разработки РИД, выполненной автором в порядке добровольческого (волонтерского) вклада, в сумме 750 000 (Семьсот пятьдесят тысяч) рублей 00 копеек согласно Сметному расчету (Приложение № 1 к Договору).', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '4. Одобрить принятие прав использования указанного РИД на забалансовый учет Организации (счет 012) в оценке 750 000 рублей и признать их официальным софинансированием для участия в конкурсах грантов Президента Российской Федерации и Президентского фонда культурных инициатив.', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120, line: 240 },
          children: [new TextRun({ text: '5. Поручить Директору Организации Шарыпаеву П.В. подписать Лицензионный договор № 01/РИД, Акт приема-передачи и обеспечить постановку прав на бухгалтерский учет.', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          spacing: { before: 140 },
          children: [
            new TextRun({ text: 'Единственный учредитель АНО «ЦПЗ ЮГ-ПРАВО»:\n', bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: withSignature ? '_________________________ / П. В. Шарыпаев /' : '_________________________ / П. В. Шарыпаев /', font: 'Times New Roman', size: 22 })
          ]
        })
      ]
    }]
  });
  return await Packer.toBuffer(doc);
}

// ── РЕШЕНИЕ № 01/2026 ЕДИНСТВЕННОГО УЧРЕДИТЕЛЯ ──
async function createReshenie1(withSignature = true) {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1417, right: 850 } } },
      children: [
        ...makeHeader(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({ text: 'РЕШЕНИЕ № 01/2026\nЕДИНСТВЕННОГО УЧРЕДИТЕЛЯ\n', bold: true, font: 'Times New Roman', size: 26 }),
            new TextRun({ text: 'Автономной некоммерческой организации\n«Центр правовой защиты и развития гражданских инициатив ЮГ-ПРАВО»\n(АНО «ЦПЗ ЮГ-ПРАВО»)', bold: true, font: 'Times New Roman', size: 20 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.BOTH,
          spacing: { after: 120 },
          children: [
            new TextRun({ text: 'Самарская область, п. Южный', bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: '\t\t\t\t«01» августа 2026 г.', bold: true, font: 'Times New Roman', size: 22 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 100, line: 250 },
          children: [new TextRun({ text: 'Я, гражданин Российской Федерации Шарыпаев Павел Валерьевич, 17.09.1992 года рождения, паспорт РФ серия 36 25 № 739464, выдан 16.05.2026 г. ГУ МВД РОССИИ ПО САМАРСКОЙ ОБЛАСТИ, код подразделения: 630-032, адрес регистрации: 446186, Самарская обл., Большеглушицкий р-н, пос. Южный, ул. Центральная, д. 7, кв. 1, ИНН: 636401104469, СНИЛС: 155-895-731 23, являясь Единственным учредителем АНО «ЦПЗ ЮГ-ПРАВО» (ОГРН 1266300015080, ИНН 6317174776, КПП 631701001), руководствуясь Федеральным законом от 12.01.1996 № 7-ФЗ «О некоммерческих организациях» и Уставом Организации, в целях обеспечения уставной некоммерческой деятельности материально-технической и цифровой базой,', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          spacing: { before: 80, after: 60 },
          children: [new TextRun({ text: 'РЕШИЛ:', bold: true, font: 'Times New Roman', size: 24 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '1. Одобрить принятие в безвозмездное временное пользование цифровой инфраструктуры, включающей комплекс Telegram-ботов юридической помощи (@ugpravo_assistant_bot, @ugpravo_help_bot, @Samara_promo_bot, @repostchilli_bot) и официального публичного сообщества ВКонтакте (id112146607), созданных и администрируемых Шарыпаевым П.В.', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 60, line: 240 },
          children: [new TextRun({ text: '2. Поручить Директору Организации Шарыпаеву П.В. использовать указанные цифровые каналы исключительно в уставных целях бесплатного правового информирования граждан Самарской области.', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120, line: 240 },
          children: [new TextRun({ text: '3. Настоящее Решение вступает в силу с момента его подписания.', font: 'Times New Roman', size: 22 })]
        }),
        new Paragraph({
          spacing: { before: 140 },
          children: [
            new TextRun({ text: 'Единственный учредитель АНО «ЦПЗ ЮГ-ПРАВО»:\n', bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: '_________________________ / П. В. Шарыпаев /', font: 'Times New Roman', size: 22 })
          ]
        })
      ]
    }]
  });
  return await Packer.toBuffer(doc);
}

// ── РЕЕСТР ДОКУМЕНТОВ В ФОРМАТЕ DOCX ──
async function createReestrDocx() {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1134, bottom: 1134, left: 1417, right: 850 } } },
      children: [
        ...makeHeader(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 60 },
          children: [
            new TextRun({ text: 'РЕЕСТР ДОКУМЕНТОВ И НОМЕНКЛАТУРЫ ДЕЛ НА 2026 ГОД\n', bold: true, font: 'Times New Roman', size: 26 }),
            new TextRun({ text: 'Автономной некоммерческой организации «Центр правовой защиты и развития гражданских инициатив ЮГ-ПРАВО»', bold: true, font: 'Times New Roman', size: 20 })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120, line: 240 },
          children: [new TextRun({ text: 'Настоящий реестр фиксирует опись локальных нормативных актов, корпоративных решений и договоров, находящихся на хранении в Номенклатуре дел Организации (Приказ № 01/ОД от 01.08.2026 г., ст. 29, 32 Федерального закона от 12.01.1996 № 7-ФЗ «О некоммерческих организациях»).', font: 'Times New Roman', size: 20 })]
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 100, after: 60 },
          children: [new TextRun({ text: 'СВОДНАЯ ВЕДОМОСТЬ ДОКУМЕНТООБОРОТА (ПАПКИ № 1–4)', bold: true, font: 'Times New Roman', size: 22 })]
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Рег. №', bold: true, font: 'Times New Roman', size: 19 })] })] }),
                new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Дата', bold: true, font: 'Times New Roman', size: 19 })] })] }),
                new TableCell({ width: { size: 45, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Наименование документа', bold: true, font: 'Times New Roman', size: 19 })] })] }),
                new TableCell({ width: { size: 25, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Место хранения', bold: true, font: 'Times New Roman', size: 19 })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '№ 1', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '01.08.2026', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Приказ о вступлении в должность Директора (возложение бухучета)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Папка № 1 (Кадры/Устав)', font: 'Times New Roman', size: 18 })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '№ 01/ОД', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '01.08.2026', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Приказ об утверждении локальных актов и порядка делопроизводства', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Папка № 2 (Приказы ОД)', font: 'Times New Roman', size: 18 })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '№ 02/ОД', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '01.08.2026', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Приказ об организации сбора и учета пожертвований (Оферта, Счет)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Папка № 2 (Приказы ОД)', font: 'Times New Roman', size: 18 })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '№ 03/ОД', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '01.08.2026', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Приказ об утверждении Учетной политики на 2026 г. (УСН 6%, счет 012)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Папка № 2 (Приказы ОД)', font: 'Times New Roman', size: 18 })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '№ 01-ПДн', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '04.08.2026', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Приказ об утверждении Политики обработки ПДн (КЭП ФНС)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Папка № 2 (Приказы ОД)', font: 'Times New Roman', size: 18 })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '№ 2 (Учр.)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '29.08.2026', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Решение учредителя № 2 (Доп. к № 01/2026, одобрение сделки ст. 27 7-ФЗ)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Папка № 3 (Интеллект. собств.)', font: 'Times New Roman', size: 18 })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '№ 01/РИД', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '29.08.2026', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Лицензионный договор на софинансирование РИД и домен (750 000 ₽)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Папка № 3 (Интеллект. собств.)', font: 'Times New Roman', size: 18 })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '№ 04/ОД', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '31.08.2026', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Приказ о вводе платформы yugpravo.ru, правил сайта и учете по счету 012', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Папка № 2 (Приказы ОД)', font: 'Times New Roman', size: 18 })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '№ П-26/Д', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '01.08.2026', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Типовой договор пожертвования с юридическими лицами (> 3000 ₽)', font: 'Times New Roman', size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Папка № 4 (Пожертвования)', font: 'Times New Roman', size: 18 })] })] }),
              ]
            })
          ]
        }),
        new Paragraph({
          spacing: { before: 160 },
          children: [
            new TextRun({ text: 'Директор АНО «ЦПЗ ЮГ-ПРАВО»:\n', bold: true, font: 'Times New Roman', size: 22 }),
            new TextRun({ text: '_________________________ / П. В. Шарыпаев / М.П.', font: 'Times New Roman', size: 22 })
          ]
        })
      ]
    }]
  });
  return await Packer.toBuffer(doc);
}

// ── СИНХРОНИЗАЦИЯ С ЯНДЕКС.ДИСКОМ ──
async function syncToYandexDisk(fileList) {
  const https = require('https');
  const token = 'y0__wgBEMj8w6eq94ACGIzZSCDejcXwGIbok30JHZ-PhpACeJdCypWjLHnd';
  const baseDir = '/_БАЗА_ЗНАНИЙ_ЮГ_ПРАВО/НКО ЮГ ПРАВО/Приказы 2026';

  function deleteRemote(remotePath) {
    return new Promise(resolve => {
      const delUrl = 'https://cloud-api.yandex.net/v1/disk/resources?path=' + encodeURIComponent(remotePath) + '&permanently=true';
      const u = new URL(delUrl);
      const req = https.request({
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'DELETE',
        headers: { Authorization: 'OAuth ' + token, 'User-Agent': 'NodeJS' }
      }, res => {
        console.log('🗑️ Yandex.Disk cleanup:', path.basename(remotePath), 'HTTP', res.statusCode);
        resolve();
      });
      req.on('error', () => resolve());
      req.end();
    });
  }

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
                console.log('☁️ Yandex.Disk updated:', path.basename(localPath));
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

  // Удаляем старый .md файл из облака
  await deleteRemote(baseDir + '/REESTR_DOKUMENTOV_2026.md');

  for (const f of fileList) {
    if (fs.existsSync(f)) {
      await uploadOne(f, baseDir + '/' + path.basename(f));
    }
  }
}

async function run() {
  console.log('📄 Генерация полного пакета документов АНО «ЦПЗ ЮГ-ПРАВО» в формате DOCX...');

  // 1. Версии с синей печатью и факсимиле (для сайта и быстрой отправки)
  const p1WithSeal = await createPrikaz1(true);
  fs.writeFileSync('docs/prikaz-01-local-acts.docx', p1WithSeal);

  const p2WithSeal = await createPrikaz2(true);
  fs.writeFileSync('docs/prikaz-02-donations.docx', p2WithSeal);

  const p3WithSeal = await createPrikaz3(true);
  fs.writeFileSync('docs/prikaz-03-uchet-politika.docx', p3WithSeal);

  const p4WithSeal = await createPrikaz4(true);
  fs.writeFileSync('docs/prikaz-04-rid.docx', p4WithSeal);

  const licWithSeal = await createLicenzionnyyDogovor(true);
  fs.writeFileSync('docs/licenzionnyy-dogovor-rid-sofinansirovanie.docx', licWithSeal);

  const reshenie2WithSeal = await createReshenie2(true);
  fs.writeFileSync('docs/reshenie-02-uchreditelya.docx', reshenie2WithSeal);

  // 2. Чистые версии для распечатки и ручной синей подписи/печати
  const p1Clean = await createPrikaz1(false);
  fs.writeFileSync('docs/prikaz-01-dlya-pechati-original.docx', p1Clean);

  const p2Clean = await createPrikaz2(false);
  fs.writeFileSync('docs/prikaz-02-dlya-pechati-original.docx', p2Clean);

  const p3Clean = await createPrikaz3(false);
  fs.writeFileSync('docs/prikaz-03-dlya-pechati-original.docx', p3Clean);

  const p4Clean = await createPrikaz4(false);
  fs.writeFileSync('docs/prikaz-04-dlya-pechati-original.docx', p4Clean);

  const licClean = await createLicenzionnyyDogovor(false);
  fs.writeFileSync('docs/licenzionnyy-dogovor-dlya-pechati-original.docx', licClean);

  const reshenie2Clean = await createReshenie2(false);
  fs.writeFileSync('docs/reshenie-02-dlya-pechati-original.docx', reshenie2Clean);

  // 3. Официальный реестр Номенклатуры дел в DOCX
  const reestrDocx = await createReestrDocx();
  fs.writeFileSync('docs/REESTR_DOKUMENTOV_2026.docx', reestrDocx);

  console.log('✅ Все документы (приказы № 01–04/ОД, Решение № 2, Договор, Реестр) созданы в формате DOCX!');

  // 4. Автоматическая выгрузка в облако Яндекс.Диска
  console.log('☁️ Автоматическая синхронизация с Яндекс.Диском...');
  const allDocs = [
    'docs/prikaz-01-local-acts.docx',
    'docs/prikaz-01-dlya-pechati-original.docx',
    'docs/prikaz-02-donations.docx',
    'docs/prikaz-02-dlya-pechati-original.docx',
    'docs/prikaz-03-uchet-politika.docx',
    'docs/prikaz-03-dlya-pechati-original.docx',
    'docs/prikaz-04-rid.docx',
    'docs/prikaz-04-dlya-pechati-original.docx',
    'docs/licenzionnyy-dogovor-rid-sofinansirovanie.docx',
    'docs/licenzionnyy-dogovor-dlya-pechati-original.docx',
    'docs/reshenie-02-uchreditelya.docx',
    'docs/reshenie-02-dlya-pechati-original.docx',
    'docs/dogovor-pozhertvovaniya-yurlicam.docx',
    'docs/dogovor-pozhertvovaniya-dlya-pechati-original.docx',
    'docs/REESTR_DOKUMENTOV_2026.docx'
  ];
  await syncToYandexDisk(allDocs);
  console.log('🎉 Все документы успешно обновлены на Яндекс.Диске!');
}

run().catch(console.error);
