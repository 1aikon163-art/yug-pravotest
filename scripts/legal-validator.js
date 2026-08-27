/**
 * LegalTech Data Validator for Russian Procedural Documents
 * Compliant with:
 * - ГПК РФ (ст. 131, 132)
 * - АПК РФ (ст. 125, 126)
 * - ПП РФ № 354 (ЖКУ, перерасчет, качество услуг)
 * - 230-ФЗ (Взыскание задолженности, защита прав должников)
 * - НК РФ ст. 333.19 (Госпошлина по новым тарифам 2024-2026)
 */

class LegalValidator {
  /**
   * Расчет государственной пошлины в суды общей юрисдикции (ст. 333.19 НК РФ в ред. 259-ФЗ)
   * @param {number} claimAmount - Цена иска в рублях
   * @param {string} plaintiffType - 'individual' (физлицо) или 'organization' (юрлицо)
   * @param {string} claimType - 'property' (имущественный), 'non_property' (неимущественный), 'divorce' (расторжение брака)
   */
  static calculateStateDuty(claimAmount = 0, plaintiffType = 'individual', claimType = 'property') {
    if (claimType === 'non_property') {
      return plaintiffType === 'individual' ? 3000 : 20000;
    }
    if (claimType === 'divorce') {
      return 5000;
    }

    // Имущественные требования, подлежащие оценке (ст. 333.19 НК РФ)
    let duty = 0;
    if (claimAmount <= 100000) {
      duty = Math.max(4000, 4000); // Минимум 4 000 руб.
    } else if (claimAmount <= 300000) {
      duty = 4000 + (claimAmount - 100000) * 0.03;
    } else if (claimAmount <= 500000) {
      duty = 10000 + (claimAmount - 300000) * 0.025;
    } else if (claimAmount <= 1000000) {
      duty = 15000 + (claimAmount - 500000) * 0.02;
    } else if (claimAmount <= 3000000) {
      duty = 25000 + (claimAmount - 1000000) * 0.01;
    } else if (claimAmount <= 8000000) {
      duty = 45000 + (claimAmount - 3000000) * 0.007;
    } else if (claimAmount <= 20000000) {
      duty = 80000 + (claimAmount - 8000000) * 0.005;
    } else {
      duty = Math.min(900000, 140000 + (claimAmount - 20000000) * 0.003); // Максимум 900 000 руб.
    }

    return Math.round(duty);
  }

  /**
   * Валидация реквизитов искового заявления по ст. 131 ГПК РФ
   * @param {Object} data - Данные иска
   */
  static validateCivilClaim(data) {
    const errors = [];
    const warnings = [];

    // 1. Наименование суда
    if (!data.courtName || data.courtName.trim().length < 5) {
      errors.push({ field: 'courtName', message: 'Не указано полное наименование суда, в который подается заявление (ст. 131 ч. 2 п. 1 ГПК РФ).' });
    }

    // 2. Сведения об истце
    if (!data.plaintiff || !data.plaintiff.fullName) {
      errors.push({ field: 'plaintiff.fullName', message: 'Не указано ФИО или наименование истца (ст. 131 ч. 2 п. 2 ГПК РФ).' });
    }
    if (!data.plaintiff || !data.plaintiff.address) {
      errors.push({ field: 'plaintiff.address', message: 'Не указано место жительства (адрес) истца.' });
    }
    if (data.plaintiff && !data.plaintiff.identifier && !data.plaintiff.snils && !data.plaintiff.inn && !data.plaintiff.passport) {
      warnings.push({ field: 'plaintiff.identifier', message: 'Рекомендуется указать один из идентификаторов истца (СНИЛС, ИНН, паспортные данные).' });
    }

    // 3. Сведения об ответчике (ст. 131 ч. 2 п. 3 ГПК РФ)
    if (!data.defendant || !data.defendant.fullName) {
      errors.push({ field: 'defendant.fullName', message: 'Не указаны ФИО/наименование ответчика.' });
    }
    if (!data.defendant || !data.defendant.address) {
      errors.push({ field: 'defendant.address', message: 'Не указан адрес проживания или местонахождения ответчика.' });
    }

    // Идентификатор ответчика-гражданина (обязателен, если известен истцу)
    if (data.defendant && data.defendant.type === 'individual') {
      const hasId = data.defendant.snils || data.defendant.inn || data.defendant.passport || data.defendant.driverLicense || data.defendant.unknownIdStated;
      if (!hasId) {
        warnings.push({
          field: 'defendant.identifier',
          message: 'По ст. 131 ГПК РФ для ответчика-гражданина требуется указать один из идентификаторов (СНИЛС, ИНН, серия и номер паспорта, водительское удостоверение) либо прямо указать в иске, что данные истцу неизвестны.'
        });
      }
    }

    // 4. Суть нарушения прав и требования
    if (!data.circumstances || data.circumstances.trim().length < 20) {
      errors.push({ field: 'circumstances', message: 'Не описаны обстоятельства, на которых истец основывает свои требования (ст. 131 ч. 2 п. 5 ГПК РФ).' });
    }
    if (!data.claims || data.claims.trim().length < 10) {
      errors.push({ field: 'claims', message: 'Не сформулированы просительные требования (ст. 131 ч. 2 п. 4 ГПК РФ).' });
    }

    // 5. Расчет суммы и цена иска (для имущественных споров)
    if (data.isPropertyClaim) {
      if (!data.claimAmount || isNaN(data.claimAmount) || Number(data.claimAmount) <= 0) {
        errors.push({ field: 'claimAmount', message: 'Для имущественного спора обязательна цена иска и расчет взыскиваемой суммы (ст. 131 ч. 2 п. 6 ГПК РФ).' });
      }
    }

    // 6. Досудебный порядок
    if (data.requiresPreTrial && !data.preTrialProofAttached) {
      errors.push({ field: 'preTrialProofAttached', message: 'Для данной категории споров обязателен досудебный претензионный порядок с подтверждением отправки (ст. 132 п. 7 ГПК РФ).' });
    }

    // 7. Подтверждение направления копий ответчику (ст. 132 п. 6 ГПК РФ)
    if (data.copiesSentToDefendant === false) {
      errors.push({ field: 'copiesSentToDefendant', message: 'Обязательно приложить уведомление о вручении или иные документы, подтверждающие направление копий иска и документов ответчику (ст. 132 ГПК РФ).' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      calculatedStateDuty: data.isPropertyClaim ? this.calculateStateDuty(Number(data.claimAmount) || 0, data.plaintiff?.type || 'individual') : this.calculateStateDuty(0, data.plaintiff?.type || 'individual', 'non_property')
    };
  }

  /**
   * Валидация претензии по 230-ФЗ (Взыскание долгов, коллекторская деятельность)
   */
  static validateDebtCollectionComplaint(data) {
    const errors = [];
    const violations = [];

    if (!data.creditorOrAgencyName) {
      errors.push({ field: 'creditorOrAgencyName', message: 'Не указано наименование кредитора или коллекторского агентства (ПКО).' });
    }

    // Проверка нарушений по ст. 7 Федерального закона № 230-ФЗ
    if (data.nightCallsReported) {
      violations.push('Нарушение времени взаимодействия: звонки/сообщения в рабочие дни с 22:00 до 08:00 или в выходные с 20:00 до 09:00 (ст. 7 ч. 3 230-ФЗ).');
    }
    if (data.callsFrequencyExceeded) {
      violations.push('Превышение допустимой частоты телефонных переговоров: более 1 раза в сутки, более 2 раз в неделю или более 8 раз в месяц (ст. 7 ч. 3 п. 1 230-ФЗ).');
    }
    if (data.thirdPartiesContactedWithoutConsent) {
      violations.push('Незаконное взаимодействие с третьими лицами (родственниками, коллегами) без их согласия и письменного согласия должника (ст. 4 ч. 5 230-ФЗ).');
    }
    if (data.psychologicalPressureOrThreats) {
      violations.push('Применение угроз причинения вреда, психологического давления или распространение сведений, порочащих честь и достоинство (ст. 6 ч. 2 230-ФЗ).');
    }

    return {
      isValid: errors.length === 0,
      errors,
      detectedViolations: violations,
      recommendedActions: [
        'Подача заявления об отзыве согласия на взаимодействие с третьими лицами',
        'Подача жалобы в Главное управление ФССП России (контролирующий орган по 230-ФЗ)',
        'Подача жалобы в Банк России / НАПКА при наличии лицензионных нарушений'
      ]
    };
  }

  /**
   * Валидация претензии по услугам ЖКХ (Постановление Правительства РФ № 354)
   */
  static validateHousingUtilityClaim(data) {
    const errors = [];

    if (!data.managementCompanyName) {
      errors.push({ field: 'managementCompanyName', message: 'Не указана управляющая компания / ТСЖ / РСО.' });
    }
    if (!data.accountNumber) {
      errors.push({ field: 'accountNumber', message: 'Не указан номер лицевого счета плательщика.' });
    }
    if (!data.propertyAddress) {
      errors.push({ field: 'propertyAddress', message: 'Не указан адрес жилого помещения.' });
    }
    if (!data.incidentDate && !data.periodStart) {
      errors.push({ field: 'period', message: 'Не указан период нарушения или дата составления акта о непредоставлении коммунальных услуг.' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      normativeBasis: 'Постановление Правительства РФ от 06.05.2011 № 354 "О предоставлении коммунальных услуг собственникам и пользователям помещений в многоквартирных домах и жилых домов"'
    };
  }
}

module.exports = LegalValidator;

// Command line self-test
if (require.main === module) {
  console.log('--- LegalTech Validator Self-Test ---');
  const testClaim = {
    courtName: 'Ленинский районный суд г. Ростова-на-Дону',
    plaintiff: { fullName: 'Иванов Иван Иванович', address: 'г. Ростов-на-Дону, ул. Пушкинская, д. 10', inn: '616400000000', type: 'individual' },
    defendant: { fullName: 'ООО "Альфа-Сервис"', address: 'г. Москва, ул. Тверская, д. 1', type: 'organization' },
    circumstances: 'Ответчик не исполнил обязательства по договору оказания юридических услуг № 12 от 12.01.2025...',
    claims: 'Взыскать с ответчика уплаченную сумму в размере 250 000 рублей, а также неустойку и штраф...',
    isPropertyClaim: true,
    claimAmount: 250000,
    copiesSentToDefendant: true,
    requiresPreTrial: true,
    preTrialProofAttached: true
  };

  const result = LegalValidator.validateCivilClaim(testClaim);
  console.log('Claim Validation Result:', JSON.stringify(result, null, 2));

  console.log('\n--- State Duty Test for 250 000 RUB ---');
  console.log('State Duty:', LegalValidator.calculateStateDuty(250000, 'individual'), 'RUB');
}
