/**
 * ⚖️ ЮГ-ПРАВО LegalTech — Smart Legal Classifier & Registry Engine (2.0)
 * Глубокий анализ контекста, сквозное связывание номеров дел/производств и отсечение промо-мусора.
 */

class LegalClassifier {
  constructor() {
    this.departmentRules = [
      {
        name: 'ФАС',
        folder: 'ФАС',
        domains: ['fas.gov.ru'],
        keywords: ['фас', 'уфас', 'антимонопольн', '135-фз', 'о рекламе', '38-фз', 'недобросовестная конкуренция', 'гособоронзаказ']
      },
      {
        name: 'ФССП',
        folder: 'ФССП',
        domains: ['fssp.gov.ru', 'fssprus.ru'],
        keywords: ['фссп', 'судебный пристав', 'судебных приставов', '229-фз', 'исполнительное производство', 'постановление о возбуждении', 'арест счетов', 'розыск должника', 'окончание ип']
      },
      {
        name: 'Банк России (ЦБ РФ)',
        folder: 'Банк России (ЦБ РФ)',
        domains: ['cbr.ru', 'finombudsman.ru'],
        keywords: ['банк россии', 'центральный банк', 'цб рф', 'служба по защите прав потребителей финансовых услуг', 'финпотребнадзор', 'финансовый уполномоченный', 'финомбудсмен']
      },
      {
        name: 'ФНС',
        folder: 'ФНС',
        domains: ['nalog.ru', 'nalog.gov.ru'],
        keywords: ['фнс', 'ифнс', 'налоговая', 'налоговый орган', 'требование о предоставлении документов', 'справка о сальдо', 'енс', 'камеральная проверка', 'акт налоговой']
      },
      {
        name: 'Роскомнадзор',
        folder: 'Роскомнадзор',
        domains: ['rkn.gov.ru'],
        keywords: ['роскомнадзор', 'ркн', '152-фз', 'персональных данных', 'оператор персональных данных', 'реестр операторов']
      },
      {
        name: 'Минюст',
        folder: 'Минюст',
        domains: ['minjust.ru', 'minjust.gov.ru'],
        keywords: ['минюст', 'министерство юстиции', 'учетный номер нко', 'отчетность нко', 'ст. 32 7-фз', 'некоммерческ']
      },
      {
        name: 'Прокуратура',
        folder: 'Прокуратура',
        domains: ['genproc.gov.ru'],
        keywords: ['прокуратура', 'прокурор', 'генеральная прокуратура', 'представление прокурора', 'предостережение', 'прокурорская проверка']
      },
      {
        name: 'Судебные органы',
        folder: 'Судебные органы',
        domains: ['sudrf.ru', 'arbitr.ru', 'vsrf.ru', 'mos-gorsud.ru'],
        keywords: ['суд', 'судебный участок', 'мировой судья', 'районный суд', 'арбитражный суд', 'определение суда', 'исковое заявление', 'апелляционная жалоба', 'кассация', 'дело №']
      },
      {
        name: 'Сбербанк и Банки',
        folder: 'Сбербанк и Банки',
        domains: ['sberbank.ru', 'sber.ru', 'vtb.ru', 'tbank.ru', 'tinkoff.ru', 'alfabank.ru', 'pochtabank.ru', 'gazprombank.ru', 'sovcombank.ru', 'raiffeisen.ru'],
        keywords: ['претензия', 'ответ на претензию', 'кредитный договор', 'блокировка 115-фз', 'оспаривание операции', 'чарджбэк', 'уведомление о задолженности', 'выписка по счету']
      },
      {
        name: 'МФО и Коллекторы',
        folder: 'МФО и Коллекторы',
        domains: ['joy.money', 'bistrodengi.ru', 'moneyman.ru', 'creditnow.ru', 'zaym.ru', 'moneza.ru', 'ezaem.ru', 'webbankir.com', 'ekapusta.com', 'turbozaim.ru', 'migcredit.ru'],
        keywords: ['мкк', 'мфк', 'пко', '230-фз', 'микрозайм', 'договор займа', 'коллектор', 'взыскание задолженности', 'уступка прав', 'цессия', 'отзыв согласия']
      }
    ];

    // Маркетинговые и неюридические стоп-слова
    this.marketingStopKeywords = [
      'скидка', 'скидки', 'промокод', 'распродажа', 'акция', 'кэшбэк', 'бонусы',
      'поздравляем с днем', 'с днем россии', 'с праздником', 'приглашайте друзей',
      'обзоры аналитиков', 'дайджест', 'новости недели', 'ваш заказ передан', 'доставка заказа',
      'вход с нового устройства', 'успешный вход'
    ];
  }

  /**
   * Проверка на маркетинг, рекламу и спам
   */
  isMarketingOrPromo(from, subject, body) {
    const text = `${from} ${subject} ${body}`.toLowerCase();
    
    // Если письмо от официального госоргана (gov.ru, sudrf.ru, arbitr.ru, cbr.ru), это точно не маркетинг
    if (/(\.gov\.ru|sudrf\.ru|arbitr\.ru|cbr\.ru)/.test(from.toLowerCase())) {
      return false;
    }

    // Проверяем наличие маркетинговых стоп-фраз
    for (const stop of this.marketingStopKeywords) {
      if (subject.toLowerCase().includes(stop) || (text.includes(stop) && !text.includes('претензи') && !text.includes('исп. произв'))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Классифицирует письмо, определяет ведомство
   */
  classify(emailData) {
    const from = (emailData.from || '').toLowerCase();
    const subject = (emailData.subject || '').toLowerCase();
    const body = (emailData.text || emailData.html || '').toLowerCase();
    const textAll = `${from} ${subject} ${body}`;

    for (const rule of this.departmentRules) {
      for (const domain of rule.domains) {
        if (from.includes(domain)) {
          return { department: rule.name, folder: rule.folder, confidence: 'HIGH_DOMAIN' };
        }
      }
      for (const kw of rule.keywords) {
        if (subject.includes(kw) || textAll.includes(kw)) {
          return { department: rule.name, folder: rule.folder, confidence: 'MEDIUM_KEYWORD' };
        }
      }
    }

    return { department: 'Общая канцелярия', folder: 'Общая канцелярия', confidence: 'LOW_GENERAL' };
  }

  /**
   * Извлекает все сквозные идентификаторы дела для связывания цепочек (Case linking)
   */
  extractCaseIdentifiers(text, subject) {
    const combined = `${subject || ''} ${text || ''}`;
    const identifiers = {
      courtCase: null,    // Судебное дело: 2-1234/2026, А55-1234/2026
      fsspCase: null,     // ИП приставов: 12345/26/63012-ИП
      fasCase: null,      // Дело ФАС: 063/06/18.1-123/2026
      anoCase: null,      // Внутреннее обращение: ЮП-26/ЗОЗПП-8412
      kuspNumber: null,   // КУСП полиции: КУСП № 12345
      generalDocNum: null // Общий исх. номер ведомства
    };

    // 1. Внутренний номер АНО ЮГ-ПРАВО
    const anoMatch = combined.match(/(ЮП-(?:26|2026)\/[А-Яа-яA-Za-z0-9\-_]+)/i);
    if (anoMatch) identifiers.anoCase = anoMatch[1].toUpperCase();

    // 2. Номер судебного дела (Арбитраж: А55-..., Гражданский суд: 2-1234/2026, 2-567/2026)
    const courtMatch = combined.match(/(?:дело|производство)?\s*(?:№\s*)?([АA]\d{2}-\d{3,8}\/\d{4}|[1-9]-\d{2,6}\/\d{4}|[1-9]а-\d{2,6}\/\d{4})/i);
    if (courtMatch) identifiers.courtCase = courtMatch[1];

    // 3. Исполнительное производство ФССП
    const fsspMatch = combined.match(/(\d{4,8}\/\d{2}\/\d{5}-ИП)/i);
    if (fsspMatch) identifiers.fsspCase = fsspMatch[1];

    // 4. Дело ФАС
    const fasMatch = combined.match(/(\d{2,4}\/\d{2}\/[\d\.\-]+)/i);
    if (fasMatch && combined.toLowerCase().includes('фас')) identifiers.fasCase = fasMatch[1];

    // 5. КУСП
    const kuspMatch = combined.match(/КУСП\s*(?:№\s*)?(\d{3,10})/i);
    if (kuspMatch) identifiers.kuspNumber = `КУСП № ${kuspMatch[1]}`;

    // 6. Общий номер
    const genMatch = combined.match(/(?:исх\.?\s*|вх\.?\s*)?№\s*([0-9А-Яа-яA-Za-z\/\-_]{3,25})/i);
    if (genMatch && genMatch[1] && !/^(2024|2025|2026)$/.test(genMatch[1])) {
      identifiers.generalDocNum = genMatch[1].trim();
    }

    return identifiers;
  }

  /**
   * Вспомогательный метод для извлечения главного номера
   */
  extractDocNumber(text, subject) {
    const ids = this.extractCaseIdentifiers(text, subject);
    return ids.courtCase || ids.fsspCase || ids.fasCase || ids.anoCase || ids.kuspNumber || ids.generalDocNum || 'Б/Н';
  }

  /**
   * Глубокий анализ контекста и извлечение юридической сути
   */
  summarizeContext(text, subject) {
    const raw = (text || '').replace(/\s+/g, ' ').trim();
    if (!raw) return subject || 'Без описания';

    // Поиск ключевой юридической резолюции
    const resolutionPatterns = [
      /(?:постановил|определил|решил|предписывает|уведомляет):\s*([^.\n]{20,200})/i,
      /(?:в удовлетворении|в возбуждении|принято решение|удовлетворить|отказать|прекратить|приостановить)\s*([^.\n]{15,150})/i,
      /(?:направляем в ваш адрес|в ответ на ваш запрос|по результатам рассмотрения)\s*([^.\n]{15,150})/i
    ];

    for (const p of resolutionPatterns) {
      const match = raw.match(p);
      if (match && match[0]) {
        return match[0].trim();
      }
    }

    // Если нет явного шаблона — берем первые 180 символов значимого текста
    return raw.length > 180 ? raw.slice(0, 180) + '...' : raw;
  }

  /**
   * Расчет процессуального дедлайна
   */
  extractDeadline(text, dateReceived = new Date(), deptName = '') {
    const t = (text || '').toLowerCase();
    
    const directDateMatch = t.match(/(?:в срок до|до|не позднее)\s*(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{2,4})/i);
    if (directDateMatch) {
      const day = directDateMatch[1].padStart(2, '0');
      const month = directDateMatch[2].padStart(2, '0');
      let year = directDateMatch[3];
      if (year.length === 2) year = '20' + year;
      return { deadlineDate: `${day}.${month}.${year}`, reason: 'Указан в документе' };
    }

    const d = new Date(dateReceived);
    if (deptName === 'ФССП') {
      d.setDate(d.getDate() + 10);
      return { deadlineDate: d.toLocaleDateString('ru-RU'), reason: '10 дней на обжалование (ст. 122 229-ФЗ)' };
    }

    if (deptName === 'Сбербанк и Банки' || deptName === 'МФО и Коллекторы') {
      d.setDate(d.getDate() + 10);
      return { deadlineDate: d.toLocaleDateString('ru-RU'), reason: '10 дней (ст. 22 ЗоЗПП / 230-ФЗ)' };
    }

    if (['ФАС', 'ФНС', 'Роскомнадзор', 'Минюст', 'Прокуратура'].includes(deptName)) {
      d.setDate(d.getDate() + 30);
      return { deadlineDate: d.toLocaleDateString('ru-RU'), reason: '30 дней (ст. 12 59-ФЗ)' };
    }

    return { deadlineDate: 'Без жесткого срока', reason: 'Обычный документооборот' };
  }
}

module.exports = new LegalClassifier();
