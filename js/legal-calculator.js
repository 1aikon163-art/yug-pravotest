/**
 * LegalTech Calculation & Claim Generation Engine
 * АНО «ЦПЗ ЮГ-ПРАВО» (c) 2026
 * 
 * Compliant with:
 * - Постановление Правительства РФ № 354 (ЖКХ, Отопление, Вода, ТКО, Сверка ИПУ, Отсутствие)
 * - ГОСТ Р 51617-2014, СанПиН 1.2.3685-21 (Климатические нормы отопления по регионам РФ)
 * - Жилищный кодекс РФ (ст. 157 ЖК РФ)
 * - Закон РФ № 2300-1 «О защите прав потребителей» (ст. 13, 15, 22, 23, 28, 31)
 * - Гражданский кодекс РФ (ст. 395 ГК РФ)
 * - Федеральный закон № 353-ФЗ «О потребительском кредите»
 * - Федеральный закон № 123-ФЗ «Об уполномоченном по правам потребителей финансовых услуг»
 */

(function (window) {
    'use strict';

    const CURRENT_KEY_RATE = 18.0;

    const LegalCalculator = {
        keyRate: CURRENT_KEY_RATE,

        /**
         * 1.1 ЖКХ: Отопление ниже нормы (+18°C/+20°C или +20°C/+22°C для холодных регионов)
         * п. 15 Приложения № 1 к ПП РФ № 354, ч. 4 ст. 157 ЖК РФ, СанПиН 1.2.3685-21
         * @param {number} monthlyFee - Начисленная плата за отопление за месяц (руб)
         * @param {number} actualTemp - Фактическая температура в помещении (град. C)
         * @param {boolean} isCornerRoom - Угловая комната
         * @param {number} violationHours - Часы нарушения
         * @param {boolean} isColdRegion - Холодный регион (пятидневка -31°C и ниже: норма +20°C/+22°C)
         */
        calculateHeating: function (monthlyFee, actualTemp, isCornerRoom, violationHours, isColdRegion = false) {
            let normTemp = 18;
            if (isColdRegion) {
                normTemp = isCornerRoom ? 22 : 20;
            } else {
                normTemp = isCornerRoom ? 20 : 18;
            }

            const deltaTemp = Math.max(0, normTemp - actualTemp);

            if (deltaTemp <= 0 || violationHours <= 0) {
                return {
                    normTemp: normTemp,
                    deltaTemp: 0,
                    violationHours: violationHours,
                    isColdRegion: isColdRegion,
                    reductionPercent: 0,
                    reductionAmount: 0,
                    penaltyFine: 0,
                    totalCompensation: 0,
                    newMonthlyFee: monthlyFee,
                    lawBasis: `Температура соответствует нормам СанПиН и ПП РФ № 354 (Норматив для региона: +${normTemp}°C).`
                };
            }

            // 0.15% за каждый градус и за каждый час
            const reductionPercent = Math.min(100, deltaTemp * 0.15 * violationHours);
            const reductionAmount = Math.min(monthlyFee, Math.round((monthlyFee * (reductionPercent / 100)) * 100) / 100);
            const penaltyFine = Math.round((reductionAmount * 0.5) * 100) / 100;
            const totalCompensation = Math.round((reductionAmount + penaltyFine) * 100) / 100;
            const newMonthlyFee = Math.max(0, Math.round((monthlyFee - reductionAmount) * 100) / 100);

            const regionNotice = isColdRegion ? 'холодный регион (пятидневка ≤ -31°C)' : 'стандартная климатическая зона РФ';

            return {
                normTemp: normTemp,
                deltaTemp: deltaTemp,
                violationHours: violationHours,
                isColdRegion: isColdRegion,
                reductionPercent: Math.round(reductionPercent * 10) / 10,
                reductionAmount: reductionAmount,
                penaltyFine: penaltyFine,
                totalCompensation: totalCompensation,
                newMonthlyFee: newMonthlyFee,
                lawBasis: `п. 15 Приложения № 1 к ПП РФ № 354, ч. 4 ст. 157 ЖК РФ (норма +${normTemp}°C: ${regionNotice})`
            };
        },

        /**
         * 1.2 ЖКХ: Отключение / перебои подачи воды сверх лимита
         */
        calculateWaterOutage: function (monthlyFee, outageHours) {
            const allowedHours = 8; // допустимый лимит за месяц
            const excessHours = Math.max(0, outageHours - allowedHours);

            if (excessHours <= 0) {
                return {
                    outageHours: outageHours,
                    excessHours: 0,
                    reductionPercent: 0,
                    reductionAmount: 0,
                    penaltyFine: 0,
                    totalCompensation: 0,
                    newMonthlyFee: monthlyFee,
                    lawBasis: 'Перерыв подачи воды укладывается в допустимый норматив 8 ч/мес (ПП РФ № 354).'
                };
            }

            const reductionPercent = Math.min(100, excessHours * 0.15);
            const reductionAmount = Math.min(monthlyFee, Math.round((monthlyFee * (reductionPercent / 100)) * 100) / 100);
            const penaltyFine = Math.round((reductionAmount * 0.5) * 100) / 100;
            const totalCompensation = Math.round((reductionAmount + penaltyFine) * 100) / 100;
            const newMonthlyFee = Math.max(0, Math.round((monthlyFee - reductionAmount) * 100) / 100);

            return {
                outageHours: outageHours,
                excessHours: excessHours,
                reductionPercent: Math.round(reductionPercent * 10) / 10,
                reductionAmount: reductionAmount,
                penaltyFine: penaltyFine,
                totalCompensation: totalCompensation,
                newMonthlyFee: newMonthlyFee,
                lawBasis: 'п. 1, 4 Приложения № 1 к ПП РФ № 354, ч. 4 ст. 157 ЖК РФ (снижение 0.15% за каждый час + штраф 50%)'
            };
        },

        /**
         * 1.3 ЖКХ: Сверка счетчиков ИПУ (Перерасчет со среднего/норматива на факт)
         */
        calculateMeterReconciliation: function (billedAmount, actualUnits, tariffRate, hasMultiplier15 = false) {
            const realCost = Math.round((actualUnits * tariffRate) * 100) / 100;
            const rawOverpayment = billedAmount - realCost;
            const overpayment = Math.max(0, Math.round(rawOverpayment * 100) / 100);
            const multiplierAmount = hasMultiplier15 ? Math.round((billedAmount - (billedAmount / 1.5)) * 100) / 100 : 0;

            return {
                billedAmount: billedAmount,
                actualUnits: actualUnits,
                tariffRate: tariffRate,
                realCost: realCost,
                overpayment: overpayment,
                multiplierAmount: multiplierAmount,
                totalRefundToAccount: overpayment,
                lawBasis: 'п. 61, п. 84 Правил предоставления коммунальных услуг (ПП РФ № 354) — обязательный перерасчет по факту'
            };
        },

        /**
         * 1.4 ЖКХ: Временное отсутствие потребителя (ТКО и нормативные услуги)
         * Учитывает региональный способ начисления ТКО (по людям ИЛИ по площади жилья)
         */
        calculateAbsenceRefund: function (monthlyFee, absenceDays, totalResidents = 1, absentResidents = 1, billingType = 'people', areaSqM = 54) {
            if (absenceDays < 5) {
                return {
                    eligible: false,
                    absenceDays: absenceDays,
                    reductionAmount: 0,
                    newMonthlyFee: monthlyFee,
                    lawBasis: 'Право на перерасчет возникает при отсутствии свыше 5 полных календарных дней подряд (п. 86 ПП РФ № 354).'
                };
            }

            let reductionAmount = 0;
            if (billingType === 'area') {
                // Региональный расчет ТКО с площади (Москва, МО и др. регионы по ПП РФ от 01.03.2023)
                // Снижение пропорционально доле отсутствующих жильцов и количеству дней
                const residentRatio = Math.min(1, Math.max(0, absentResidents / Math.max(1, totalResidents)));
                const dailyFee = monthlyFee / 30;
                reductionAmount = Math.min(monthlyFee, Math.round((dailyFee * absenceDays * residentRatio) * 100) / 100);
            } else {
                // Классический расчет ТКО с человека (Самарская область и большинство регионов РФ)
                const residentRatio = Math.min(1, Math.max(0, absentResidents / Math.max(1, totalResidents)));
                const feePerPerson = monthlyFee * residentRatio;
                const dailyRate = feePerPerson / 30;
                reductionAmount = Math.min(monthlyFee, Math.round((dailyRate * absenceDays) * 100) / 100);
            }

            const newMonthlyFee = Math.max(0, Math.round((monthlyFee - reductionAmount) * 100) / 100);

            return {
                eligible: true,
                absenceDays: absenceDays,
                absentResidents: absentResidents,
                totalResidents: totalResidents,
                billingType: billingType,
                reductionAmount: reductionAmount,
                newMonthlyFee: newMonthlyFee,
                lawBasis: 'п. 86(1), п. 91 ПП РФ № 354 (в ред. от 01.03.2023: перерасчет ТКО как по числу жильцов, так и по метражу)'
            };
        },

        /**
         * 2. ЗоЗПП: Неустойка за задержку возврата денег за ТОВАР (ст. 22, 23 ЗоЗПП)
         */
        calculateProductPenalty: function (productPrice, delayDays, moralDamage = 3000) {
            const dailyRate = 0.01; // 1% в день
            const penaltyAmount = Math.round((productPrice * dailyRate * Math.max(0, delayDays)) * 100) / 100;
            const subtotal = productPrice + penaltyAmount;
            const consumerFine50 = Math.round(((subtotal + moralDamage) * 0.5) * 100) / 100;
            const totalToRecover = Math.round((subtotal + moralDamage + consumerFine50) * 100) / 100;

            return {
                productPrice: productPrice,
                delayDays: delayDays,
                penaltyPercent: delayDays * 1,
                penaltyAmount: penaltyAmount,
                moralDamage: moralDamage,
                consumerFine50: consumerFine50,
                totalToRecover: totalToRecover,
                lawBasis: 'ст. 22, ст. 23, п. 6 ст. 13, ст. 15 Закона РФ «О защите прав потребителей» № 2300-1'
            };
        },

        /**
         * 3. ЗоЗПП: Неустойка 3% в день за срыв сроков РАБОТ / УСЛУГ / РЕМОНТА (ст. 28 ЗоЗПП)
         */
        calculateServicePenalty: function (servicePrice, delayDays, moralDamage = 5000) {
            const dailyRate = 0.03; // 3% в день
            const rawPenalty = servicePrice * dailyRate * Math.max(0, delayDays);
            const penaltyAmount = Math.round(Math.min(servicePrice, rawPenalty) * 100) / 100;
            const subtotal = servicePrice + penaltyAmount;
            const consumerFine50 = Math.round(((subtotal + moralDamage) * 0.5) * 100) / 100;
            const totalToRecover = Math.round((subtotal + moralDamage + consumerFine50) * 100) / 100;

            return {
                servicePrice: servicePrice,
                delayDays: delayDays,
                penaltyAmount: penaltyAmount,
                isCapped: rawPenalty > servicePrice,
                moralDamage: moralDamage,
                consumerFine50: consumerFine50,
                totalToRecover: totalToRecover,
                lawBasis: 'п. 5 ст. 28, ст. 31, п. 6 ст. 13 Закона РФ «О защите прав потребителей» № 2300-1'
            };
        },

        /**
         * 4. Проценты за пользование чужими денежными средствами (ст. 395 ГК РФ)
         */
        calculateInterest395: function (debtAmount, days, keyRate = CURRENT_KEY_RATE) {
            const daysInYear = 365;
            const dailyRate = (keyRate / 100) / daysInYear;
            const interestAmount = Math.round((debtAmount * dailyRate * Math.max(0, days)) * 100) / 100;
            const totalDebtWithInterest = Math.round((debtAmount + interestAmount) * 100) / 100;

            return {
                debtAmount: debtAmount,
                days: days,
                keyRate: keyRate,
                interestAmount: interestAmount,
                totalDebtWithInterest: totalDebtWithInterest,
                lawBasis: 'ст. 395 Гражданского кодекса РФ (Ключевая ставка Банка России: ' + keyRate + '%)'
            };
        },

        /**
         * 5. Возврат страховок по кредитам в Период охлаждения 30 дней (353-ФЗ)
         */
        calculateInsuranceRefund: function (insuranceCost, daysPassed) {
            const coolingPeriodDays = 30;

            if (daysPassed <= coolingPeriodDays) {
                return {
                    isCoolingPeriod: true,
                    daysPassed: daysPassed,
                    refundPercent: 100,
                    refundAmount: insuranceCost,
                    refundableAmount: insuranceCost,
                    isEligible: true,
                    lawBasis: 'ч. 2.4 ст. 7 Федерального закона № 353-ФЗ (100% возврат в период охлаждения 30 дней)'
                };
            } else {
                return {
                    isCoolingPeriod: false,
                    daysPassed: daysPassed,
                    refundPercent: 0,
                    refundAmount: 0,
                    refundableAmount: 0,
                    isEligible: false,
                    note: 'Период охлаждения (30 дней) истек. Возврат возможен при досрочном погашении кредита по ч. 2.4 ст. 11 353-ФЗ.',
                    lawBasis: 'ч. 2.4 ст. 11 Федерального закона № 353-ФЗ'
                };
            }
        },

        /**
         * 6. Генератор юридического текста досудебной претензии
         */
        generateClaimText: function (type, data, userDetails = {}) {
            const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
            const sender = userDetails.userName || '[ФИО Гражданина]';
            const senderAddr = userDetails.userAddress || '[Адрес проживания: г. Самара, ул. ..., д. ..., кв. ...]';
            const senderPhone = userDetails.userPhone || '[Телефон для связи]';
            const recipient = userDetails.recipientName || 'Руководителю Управляющей организации / Поставщика услуг';
            const recipientAddr = userDetails.recipientAddress || '[Адрес организации]';

            let header = `КОМУ: ${recipient}\nАДРЕС: ${recipientAddr}\n\nОТ КОГО: ${sender}\nАДРЕС: ${senderAddr}\nТЕЛЕФОН: ${senderPhone}\nДАТА: ${today}\n\n`;

            if (type === 'heating') {
                const regionStr = data.isColdRegion ? 'для районов с температурой холодной пятидневки ≤ -31°C' : 'для районов с температурой пятидневки > -31°C';
                return header + 
`ЗАЯВЛЕНИЕ (ПРЕТЕНЗИЯ)
об уменьшении платы за коммунальную услугу по отоплению ненадлежащего качества и выплате штрафа

Я являюсь собственником (потребителем) жилого помещения по адресу: ${senderAddr}.
В период с нарушением температурного режима продолжительностью ${data.violationHours} часов температура воздуха в жилом помещении составляла ${data.actualTemp}°C при установленном нормативе не менее ${data.normTemp}°C (${regionStr}, отклонение: ${data.deltaTemp}°C).

В соответствии с п. 15 Приложения № 1 к Правилам предоставления коммунальных услуг (утв. Постановлением Правительства РФ № 354) и СанПиН 1.2.3685-21, за каждый час отклонения температуры воздуха размер платы за отопление снижается на 0,15% за каждый градус отклонения.
Сумма снижения платы составляет: ${data.reductionAmount} руб. (${data.reductionPercent}%).

В соответствии с ч. 4 ст. 157 Жилищного кодекса РФ лицо, предоставляющее коммунальные услуги, обязано уплатить потребителю штраф в размере 50% величины превышения платы (${data.penaltyFine} руб.).

НА ОСНОВАНИИ ИЗЛОЖЕННОГО, ТРЕБУЮ:
1. Произвести перерасчет платы за отопление в сторону уменьшения на сумму ${data.reductionAmount} руб.
2. Выплатить (зачесть в счет будущих платежей) штраф в размере ${data.penaltyFine} руб. в соответствии с ч. 4 ст. 157 ЖК РФ.
3. Общая сумма к зачету/выплате: ${data.totalCompensation} руб.

В случае отказа вопрос будет передан в Государственную жилищную инспекцию (ГЖИ), Роспотребнадзор и суд.

Подпись: _________________ / ${sender} /`;
            }

            if (type === 'water_outage') {
                return header + 
`ПРЕТЕНЗИЯ
о перерасчете платы за перерыв в предоставлении коммунальной услуги водоснабжения

Я являюсь потребителем коммунальных услуг по адресу: ${senderAddr}.
В текущем расчетном периоде суммарная продолжительность отсутствия водоснабжения составила ${data.outageHours} ч., что превышает допустимый норматив (8 часов в месяц согласно Приложению № 1 к ПП РФ № 354) на ${data.excessHours} ч.

В соответствии с п. 1, 4 Приложения № 1 к Правилам, утвержденным Постановлением Правительства РФ № 354, за каждый час превышения допустимой продолжительности перерыва размер платы снижается на 0,15%.
Сумма перерасчета составляет: ${data.reductionAmount} руб.
Штраф по ч. 4 ст. 157 ЖК РФ (50%): ${data.penaltyFine} руб.

НА ОСНОВАНИИ ИЗЛОЖЕННОГО, ТРЕБУЮ:
1. Произвести перерасчет платы за водоснабжение со снижением на ${data.reductionAmount} руб.
2. Начислить штраф 50% в размере ${data.penaltyFine} руб.
Итого к компенсации: ${data.totalCompensation} руб.

Подпись: _________________ / ${sender} /`;
            }

            if (type === 'meter_reconciliation') {
                return header + 
`ЗАЯВЛЕНИЕ
о проведении сверки показаний индивидуального прибора учета и обязательном перерасчете платы

Я являюсь потребителем коммунальных услуг по адресу: ${senderAddr}.
Ранее начисления производились исходя из среднемесячного объема / норматива потребления. Начисленная сумма за расчетный период составила ${data.billedAmount} руб.

Настоящим передаю фактические показания поверенного и исправного прибора учета: фактический расход составил ${data.actualUnits} ед., что по тарифу ${data.tariffRate} руб. составляет реальную стоимость ${data.realCost} руб.
Сумма излишне начисленных и уплаченных средств (переплата): ${data.overpayment} руб.

В соответствии с п. 61 и п. 84 Правил предоставления коммунальных услуг (утв. Постановлением Правительства РФ № 354 от 06.05.2011), исполнитель обязан произвести перерасчет размера платы исходя из снятых фактических показаний прибора учета. Излишне уплаченные суммы подлежат зачету при оплате будущих расчетных периодов.

НА ОСНОВАНИИ ИЗЛОЖЕННОГО, ТРЕБУЮ:
1. Произвести перерасчет размера платы на основании фактических показаний ИПУ.
2. Зачесть сумму переплаты ${data.overpayment} руб. в счет будущих платежей по лицевому счету.

Подпись: _________________ / ${sender} /`;
            }

            if (type === 'absence') {
                const typeStr = data.billingType === 'area' ? 'начисление по нормативу с площади жилья' : 'начисление по нормативу с числа проживающих';
                return header + 
`ЗАЯВЛЕНИЕ
о перерасчете платы за коммунальные услуги (ТКО) в связи с временным отсутствием

Я проживаю по адресу: ${senderAddr}.
В период с [дата начала] по [дата окончания] включительно я (${data.absentResidents} чел.) временно отсутствовал в жилом помещении в течение ${data.absenceDays} полных календарных дней подряд. Порядок начисления в регионе: ${typeStr}.
Документы, подтверждающие временное отсутствие (билеты, командировочное удостоверение, справка с места пребывания), прилагаются.

В соответствии с п. 86 и п. 86(1) Правил предоставления коммунальных услуг (утв. Постановлением Правительства РФ № 354 в редакции от 01.03.2023), при временном отсутствии потребителя в жилом помещении более 5 полных календарных дней подряд осуществляется перерасчет платы за коммунальные услуги / ТКО.
Сумма к снижению составляет: ${data.reductionAmount} руб.

НА ОСНОВАНИИ ИЗЛОЖЕННОГО, ТРЕБУЮ:
Произвести перерасчет платы и уменьшить начисления на сумму ${data.reductionAmount} руб.

Приложения: копии документов, подтверждающих отсутствие.
Подпись: _________________ / ${sender} /`;
            }

            if (type === 'product') {
                return header + 
`ДОСУДЕБНАЯ ПРЕТЕНЗИЯ
о возврате денежных средств за товар и выплате законной неустойки

Мною был приобретен товар стоимостью ${data.productPrice} руб.
В связи с отказом от исполнения договора / обнаружением недостатков мною было заявлено требование о возврате денежных средств.
В соответствии со ст. 22 Закона РФ «О защите прав потребителей» требование подлежало удовлетворению в 10-дневный срок. Просрочка исполнения составила ${data.delayDays} дн.

В соответствии со ст. 23 Закона РФ «О защите прав потребителей» за каждый день просрочки продавец уплачивает потребителю неустойку в размере 1% от цены товара (${data.penaltyAmount} руб.).
В соответствии со ст. 15 ЗоЗПП компенсация морального вреда составляет ${data.moralDamage} руб.
В соответствии с п. 6 ст. 13 ЗоЗПП при удовлетворении требований судом взыскивается штраф 50% (${data.fineAmount || data.consumerFine50} руб.).

ТРЕБУЮ:
Выплатить в добровольном порядке сумму ${data.totalToRecover} руб. в течение 10 дней.

Подпись: _________________ / ${sender} /`;
            }

            if (type === 'service') {
                return header + 
`ДОСУДЕБНАЯ ПРЕТЕНЗИЯ
об уплате неустойки 3% в день за нарушение сроков выполнения работ (ст. 28 ЗоЗПП)

По договору стоимость работ составила ${data.servicePrice} руб.
Нарушение срока сдачи работ составило ${data.delayDays} дней.
В соответствии с п. 5 ст. 28 ЗоЗПП исполнитель уплачивает потребителю неустойку в размере 3% цены выполнения работы за каждый день просрочки в сумме ${data.penaltyAmount} руб.

ТРЕБУЮ:
Выплатить сумму ${data.totalToRecover} руб. (включая моральный вред ${data.moralDamage} руб. и законную неустойку).

Подпись: _________________ / ${sender} /`;
            }

            if (type === 'interest') {
                return header + 
`ТРЕБОВАНИЕ (ПРЕТЕНЗИЯ)
об уплате процентов за пользование чужими денежными средствами (ст. 395 ГК РФ)

Сумма основного долга: ${data.debtAmount} руб.
Период неправомерного удержания: ${data.days} дн.
Ключевая ставка Банка России: ${data.keyRate}%.
Сумма начисленных процентов по ст. 395 ГК РФ: ${data.interestAmount} руб.
Итого к оплате: ${data.totalDebtWithInterest} руб.

Подпись: _________________ / ${sender} /`;
            }

            if (type === 'insurance') {
                return header + 
`ЗАЯВЛЕНИЕ
об отказе от договора добровольного страхования (период охлаждения 353-ФЗ)

При оформлении кредитного договора мною был заключен договор страхования / допуслуг стоимостью ${data.insuranceCost} руб.
С момента заключения прошло ${data.daysPassed} дней, что не превышает 30-дневный «период охлаждения», установленный ч. 2.4 ст. 7 Федерального закона № 353-ФЗ.

ТРЕБУЮ:
Вернуть уплаченную сумму ${data.refundableAmount || data.insuranceCost} руб. в полном объеме (100%) в установленный законом срок.

Подпись: _________________ / ${sender} /`;
            }

            return header + `ПРЕТЕНЗИЯ\n\nПодпись: _________________`;
        }
    };

    window.LegalCalculator = LegalCalculator;

})(window);
