/**
 * LegalTech Calculation & Claim Generation Engine
 * АНО «ЦПЗ ЮГ-ПРАВО» (c) 2026
 * 
 * Compliant with:
 * - Постановление Правительства РФ № 354 (ЖКХ, Отопление, Вода, ТКО, Сверка ИПУ, Отсутствие)
 * - ГОСТ Р 51617-2014, СанПиН 1.2.3685-21 (Климатические нормы отопления по регионам РФ)
 * - Жилищный кодекс РФ (ст. 157 ЖК РФ)
 * - Закон РФ № 2300-1 «О защите прав потребителей» (ст. 13, 15, 22, 23, 28, 31, 32)
 * - Гражданский кодекс РФ (ст. 15, 395, 429.3, 1064 ГК РФ)
 * - Налоговый кодекс РФ (ст. 333.19, ст. 333.36 в ред. 259-ФЗ от 08.08.2024 — новые госпошлины 2025–2026)
 * - Трудовой кодекс РФ (ст. 236, ст. 394 ТК РФ — 1/150 ключевой ставки ЦБ РФ, вынужденный прогул)
 * - Федеральный закон № 353-ФЗ «О потребительском кредите» (период охлаждения 30 дней, досрочное погашение)
 * - Федеральный закон № 123-ФЗ «Об уполномоченном по правам потребителей финансовых услуг»
 */

(function (window) {
    'use strict';

    const CURRENT_KEY_RATE = 18.0;

    const LegalCalculator = {
        keyRate: CURRENT_KEY_RATE,

        /**
         * 1.1 ЖКХ: Отопление ниже нормы (+18°C/+20°C или +20°C/+22°C для холодных регионов)
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
         * 1.2 ЖКХ: Отключение воды
         */
        calculateWaterOutage: function (monthlyFee, outageHours) {
            const allowedHours = 8;
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
         * 1.3 ЖКХ: Сверка счетчиков ИПУ
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
         * 1.4 ЖКХ: Временное отсутствие (ТКО)
         */
        calculateAbsenceRefund: function (monthlyFee, absenceDays, totalResidents = 1, absentResidents = 1, billingType = 'people') {
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
                const residentRatio = Math.min(1, Math.max(0, absentResidents / Math.max(1, totalResidents)));
                const dailyFee = monthlyFee / 30;
                reductionAmount = Math.min(monthlyFee, Math.round((dailyFee * absenceDays * residentRatio) * 100) / 100);
            } else {
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
         * 2. ЗоЗПП: Товар (1% в день)
         */
        calculateProductPenalty: function (productPrice, delayDays, moralDamage = 3000) {
            const dailyRate = 0.01;
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
         * 3. ЗоЗПП: Работы / Услуги / Ремонт (3% в день)
         */
        calculateServicePenalty: function (servicePrice, delayDays, moralDamage = 5000) {
            const dailyRate = 0.03;
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
         * 4. Проценты по ключевой ставке ЦБ РФ (ст. 395 ГК РФ)
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
         * 5. Возврат страховок и допуслуг (353-ФЗ, 123-ФЗ, ст. 32 ЗоЗПП, ст. 429.3 ГК РФ)
         * Поддерживает 3 сценария:
         * 1) В пределах 30 дней (Период охлаждения по 353-ФЗ) -> 100% возврат
         * 2) При досрочном погашении кредита (ч. 12 ст. 11 353-ФЗ) -> возврат за неистекший срок
         * 3) Навязанные опционные сертификаты / карты помощи на дорогах -> отказ по ст. 32 ЗоЗПП / ст. 429.3 ГК РФ
         * 4) Взыскание через Финомбудсмена и суд -> +50% штраф + моральный вред + ст. 395 ГК РФ
         */
        calculateInsuranceRefund: function (insuranceCost, daysPassed, creditTotalMonths = 36, monthsElapsed = 6, contractType = 'cooling', isCourtRoute = false) {
            const coolingPeriodDays = 30;

            if (contractType === 'cooling' || daysPassed <= coolingPeriodDays) {
                const subtotal = insuranceCost;
                const penalty395 = isCourtRoute ? Math.round(insuranceCost * (CURRENT_KEY_RATE / 100 / 365) * 30 * 100) / 100 : 0;
                const moralDamage = isCourtRoute ? 5000 : 0;
                const fine50 = isCourtRoute ? Math.round((subtotal + penalty395 + moralDamage) * 0.5 * 100) / 100 : 0;
                const totalToRecover = Math.round((subtotal + penalty395 + moralDamage + fine50) * 100) / 100;

                return {
                    status: 'cooling_period',
                    isCoolingPeriod: true,
                    daysPassed: daysPassed,
                    refundPercent: 100,
                    baseRefund: insuranceCost,
                    penalty395: penalty395,
                    moralDamage: moralDamage,
                    fine50: fine50,
                    totalToRecover: totalToRecover,
                    refundableAmount: totalToRecover,
                    isEligible: true,
                    lawBasis: 'ч. 2.4 ст. 7 Федерального закона № 353-ФЗ (100% возврат в период охлаждения 30 дней)'
                };
            } 
            else if (contractType === 'early_repayment') {
                // Досрочное погашение кредита (ч. 12 ст. 11 353-ФЗ)
                const totalDays = creditTotalMonths * 30.416;
                const usedDays = monthsElapsed * 30.416;
                const unusedRatio = Math.max(0, Math.min(1, (totalDays - usedDays) / totalDays));
                const baseRefund = Math.round(insuranceCost * unusedRatio * 100) / 100;
                const penalty395 = isCourtRoute ? Math.round(baseRefund * (CURRENT_KEY_RATE / 100 / 365) * 30 * 100) / 100 : 0;
                const moralDamage = isCourtRoute ? 5000 : 0;
                const fine50 = isCourtRoute ? Math.round((baseRefund + penalty395 + moralDamage) * 0.5 * 100) / 100 : 0;
                const totalToRecover = Math.round((baseRefund + penalty395 + moralDamage + fine50) * 100) / 100;

                return {
                    status: 'early_repayment',
                    isCoolingPeriod: false,
                    daysPassed: daysPassed,
                    creditTotalMonths: creditTotalMonths,
                    monthsElapsed: monthsElapsed,
                    unusedRatioPercent: Math.round(unusedRatio * 100),
                    baseRefund: baseRefund,
                    penalty395: penalty395,
                    moralDamage: moralDamage,
                    fine50: fine50,
                    totalToRecover: totalToRecover,
                    refundableAmount: totalToRecover,
                    isEligible: true,
                    lawBasis: 'ч. 12 ст. 11 Федерального закона № 353-ФЗ (пропорциональный возврат за неистекший срок кредита)'
                };
            }
            else {
                // Навязанные опционные договоры / автокарты (ст. 32 ЗоЗПП, ст. 429.3 ГК РФ)
                const baseRefund = insuranceCost; // Опционный платеж подлежит возврату за вычетом реально понесенных расходов
                const penalty395 = isCourtRoute ? Math.round(baseRefund * (CURRENT_KEY_RATE / 100 / 365) * 45 * 100) / 100 : 0;
                const moralDamage = isCourtRoute ? 7000 : 0;
                const fine50 = isCourtRoute ? Math.round((baseRefund + penalty395 + moralDamage) * 0.5 * 100) / 100 : 0;
                const totalToRecover = Math.round((baseRefund + penalty395 + moralDamage + fine50) * 100) / 100;

                return {
                    status: 'option_contract',
                    isCoolingPeriod: false,
                    daysPassed: daysPassed,
                    baseRefund: baseRefund,
                    penalty395: penalty395,
                    moralDamage: moralDamage,
                    fine50: fine50,
                    totalToRecover: totalToRecover,
                    refundableAmount: totalToRecover,
                    isEligible: true,
                    lawBasis: 'ст. 32 ЗоЗПП, ст. 429.3 ГК РФ, п. 6 ст. 13 ЗоЗПП (Отказ от навязанных сертификатов в любой момент)'
                };
            }
        },

        /**
         * 6. ГОСУДАРСТВЕННАЯ ПОШЛИНА В СУД ОБЩЕЙ ЮРИСДИКЦИИ И МИРОВЫМ СУДЬЯМ (ст. 333.19 НК РФ в ред. 259-ФЗ от 08.08.2024)
         * Новые ставки, вступившие в силу с 09.09.2024 и действующие в 2025–2026 гг.
         */
        calculateStateDuty: function (claimPrice, claimType = 'property', isCourtOrder = false, isConsumerExempt = false) {
            // Освобождение по защите прав потребителей до 1 000 000 руб. (п. 3 ст. 333.36 НК РФ)
            if (isConsumerExempt && claimPrice <= 1000000 && claimType === 'property') {
                return {
                    claimPrice: claimPrice,
                    claimType: claimType,
                    dutyAmount: 0,
                    originalDuty: this._rawPropertyDuty(claimPrice),
                    isExempt: true,
                    exemptReason: 'Освобождение от уплаты госпошлины по искам о защите прав потребителей при цене иска до 1 000 000 ₽ (п. 3 ст. 333.36 НК РФ).',
                    lawBasis: 'п. 3 ст. 333.36 НК РФ, ст. 17 Закона РФ № 2300-1 (Льгота 100%)'
                };
            }

            if (claimType === 'non_property') {
                // Неимущественный иск физического лица (ст. 333.19 пп. 3)
                const base = 3000;
                return {
                    claimPrice: 0,
                    claimType: 'non_property',
                    dutyAmount: base,
                    isExempt: false,
                    lawBasis: 'пп. 3 п. 1 ст. 333.19 НК РФ (Исковые заявления неимущественного характера для физлиц — 3 000 ₽)'
                };
            }

            if (claimType === 'divorce') {
                // Расторжение брака (ст. 333.19 пп. 5)
                const base = 5000;
                return {
                    claimPrice: 0,
                    claimType: 'divorce',
                    dutyAmount: base,
                    isExempt: false,
                    lawBasis: 'пп. 5 п. 1 ст. 333.19 НК РФ (Иск о расторжении брака — 5 000 ₽)'
                };
            }

            // Имущественный иск
            let rawDuty = this._rawPropertyDuty(claimPrice);

            // Если по иску ЗоЗПП цена свыше 1 000 000 руб., пошлина уменьшается на сумму пошлины для 1 млн руб. (25 000 руб.)
            if (isConsumerExempt && claimPrice > 1000000) {
                const dutyFor1M = 25000;
                rawDuty = Math.max(4000, rawDuty - dutyFor1M);
            }

            // При подаче заявления о вынесении судебного приказа — 50% ставки
            let finalDuty = isCourtOrder ? Math.round(rawDuty * 0.5) : rawDuty;

            return {
                claimPrice: claimPrice,
                claimType: 'property',
                dutyAmount: finalDuty,
                rawDuty: rawDuty,
                isCourtOrder: isCourtOrder,
                isConsumerExempt: isConsumerExempt,
                lawBasis: isCourtOrder 
                    ? 'пп. 1, 2 п. 1 ст. 333.19 НК РФ (Судебный приказ — 50% ставки имущественного иска)' 
                    : 'пп. 1 п. 1 ст. 333.19 НК РФ в ред. Федерального закона № 259-ФЗ'
            };
        },

        _rawPropertyDuty: function (price) {
            price = Math.max(0, price);
            if (price <= 100000) {
                return 4000;
            } else if (price <= 300000) {
                return Math.round(4000 + (price - 100000) * 0.03);
            } else if (price <= 500000) {
                return Math.round(10000 + (price - 300000) * 0.025);
            } else if (price <= 1000000) {
                return Math.round(15000 + (price - 500000) * 0.02);
            } else if (price <= 3000000) {
                return Math.round(25000 + (price - 1000000) * 0.01);
            } else if (price <= 8000000) {
                return Math.round(45000 + (price - 3000000) * 0.007);
            } else if (price <= 24000000) {
                return Math.round(80000 + (price - 8000000) * 0.0035);
            } else {
                return Math.min(900000, Math.round(136000 + (price - 24000000) * 0.003));
            }
        },

        /**
         * 7. ЗАДЕРЖКА ЗАРПЛАТЫ И ВЫНУЖДЕННЫЙ ПРОГУЛ (ст. 236, 394 ТК РФ, ст. 217 НК РФ)
         */
        calculateSalaryDelay: function (salaryDebt, delayDays, keyRate = CURRENT_KEY_RATE, isIllegalDismissal = false, averageDailySalary = 2500, forcedDays = 45, moralDamage = 15000) {
            // Компенсация за задержку зарплаты по ст. 236 ТК РФ: не ниже 1/150 ключевой ставки ЦБ РФ в день
            const dailyFraction = 1 / 150;
            const ratePercent = keyRate / 100;
            const delayCompensation = Math.round((salaryDebt * ratePercent * dailyFraction * Math.max(0, delayDays)) * 100) / 100;

            let forcedAbsencePay = 0;
            if (isIllegalDismissal) {
                // Оплата вынужденного прогула по ст. 394 ТК РФ
                forcedAbsencePay = Math.round(averageDailySalary * Math.max(0, forcedDays) * 100) / 100;
            }

            const totalToRecover = Math.round((salaryDebt + delayCompensation + forcedAbsencePay + (isIllegalDismissal ? moralDamage : 0)) * 100) / 100;

            return {
                salaryDebt: salaryDebt,
                delayDays: delayDays,
                keyRate: keyRate,
                delayCompensation: delayCompensation,
                isIllegalDismissal: isIllegalDismissal,
                forcedAbsencePay: forcedAbsencePay,
                forcedDays: forcedDays,
                moralDamage: isIllegalDismissal ? moralDamage : 0,
                totalToRecover: totalToRecover,
                lawBasis: 'ст. 236, ст. 394, ст. 395 ТК РФ (Компенсация 1/150 ключевой ставки ЦБ РФ не облагается НДФЛ по п. 1 ст. 217 НК РФ)'
            };
        },

        /**
         * 8. УЩЕРБ ПРИ ЗАЛИВЕ КВАРТИРЫ / ПОВРЕЖДЕНИИ ИМУЩЕСТВА (ст. 15, ст. 1064 ГК РФ)
         */
        calculatePropertyDamage: function (repairCost, propertyLoss, expertCost, delayDays = 30, keyRate = CURRENT_KEY_RATE) {
            const principalDebt = repairCost + propertyLoss + expertCost;
            const daysInYear = 365;
            const dailyRate = (keyRate / 100) / daysInYear;
            const interest395 = Math.round((principalDebt * dailyRate * Math.max(0, delayDays)) * 100) / 100;
            const moralDamage = 5000;
            const totalToRecover = Math.round((principalDebt + interest395 + moralDamage) * 100) / 100;

            return {
                repairCost: repairCost,
                propertyLoss: propertyLoss,
                expertCost: expertCost,
                principalDebt: principalDebt,
                delayDays: delayDays,
                interest395: interest395,
                moralDamage: moralDamage,
                totalToRecover: totalToRecover,
                lawBasis: 'ст. 15, ст. 1064, ст. 1082, ст. 395 ГК РФ (Полное возмещение вреда, восстановительный ремонт и затраты на экспертизу)'
            };
        },

        /**
         * 9. Генератор юридического текста процессуальных документов
         */
        generateClaimText: function (type, data, userDetails = {}) {
            const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
            const sender = userDetails.userName || '[ФИО Гражданина]';
            const senderAddr = userDetails.userAddress || '[Адрес проживания: г. Самара, ул. ..., д. ..., кв. ...]';
            const senderPhone = userDetails.userPhone || '[Телефон: +7 (___) ___-__-__]';
            const recipient = userDetails.recipientName || '[Наименование Организации / Банка / Управляющей компании]';
            const recipientAddr = userDetails.recipientAddress || '[Юридический / фактический адрес организации]';

            let header = `КОМУ: ${recipient}\nАДРЕС: ${recipientAddr}\n\nОТ КОГО: ${sender}\nАДРЕС: ${senderAddr}\nТЕЛЕФОН: ${senderPhone}\nДАТА: ${today}\n\n`;

            if (type === 'duty') {
                return header + 
`РАСЧЕТ ЦЕНЫ ИСКА И РАЗМЕРА ГОСУДАРСТВЕННОЙ ПОШЛИНЫ
(для подачи в суд в соответствии со ст. 131, 132 ГПК РФ и ст. 333.19 НК РФ в ред. 259-ФЗ)

1. Цена иска (размер имущественных требований): ${data.claimPrice.toLocaleString('ru-RU')} руб.
2. Категория иска: ${data.claimType === 'property' ? 'Имущественный характер' : (data.claimType === 'non_property' ? 'Неимущественный характер' : 'Расторжение брака')}.
3. Порядок рассмотрения: ${data.isCourtOrder ? 'Судебный приказ (ставка снижена на 50%)' : 'Исковое производство'}.
4. Льготы по уплате (пп. 4 п. 2 ст. 333.36 НК РФ): ${data.isConsumerExempt ? 'ДА — 100% освобождение от уплаты пошлины (Защита прав потребителей)' : 'Нет'}.
5. Итоговая сумма государственной пошлины к уплате: ${data.dutyAmount.toLocaleString('ru-RU')} руб.

ПРАВОВОЕ ОБОСНОВАНИЕ: ${data.lawBasis}
В соответствии со ст. 98 ГПК РФ в случае удовлетворения исковых требований уплаченная государственная пошлина подлежит взысканию с ответчика в пользу истца в полном объеме.

Подпись: _________________ / ${sender} /`;
            }

            if (type === 'salary') {
                return header + 
`ТРЕБОВАНИЕ (ДОСУДЕБНАЯ ПРЕТЕНЗИЯ)
о выплате задолженности по заработной плате и денежной компенсации за задержку (ст. 236 ТК РФ)

Я состою (состоял) в трудовых отношениях с ${recipient}.
В нарушение ст. 136 Трудового кодекса РФ заработная плата в установленный срок мне выплачена не была.
Сумма невыплаченной заработной платы (задолженности) составляет: ${data.salaryDebt.toLocaleString('ru-RU')} руб.
Период задержки выплаты: ${data.delayDays} дней.

В соответствии со ст. 236 ТК РФ при нарушении работодателем установленного срока выплаты заработной платы работодатель обязан выплатить их с уплатой денежной компенсации в размере не ниже 1/150 действующей ключевой ставки ЦБ РФ (${data.keyRate}%) за каждый день задержки, начиная со следующего дня после установленного срока выплаты по день фактического расчета включительно.
Размер денежной компенсации составляет: ${data.delayCompensation.toLocaleString('ru-RU')} руб. (в силу п. 1 ст. 217 НК РФ сумма не облагается НДФЛ).
${data.isIllegalDismissal ? `Оплата вынужденного прогула (ст. 394 ТК РФ, ${data.forcedDays} раб. дн.): ${data.forcedAbsencePay.toLocaleString('ru-RU')} руб.\nКомпенсация морального вреда (ст. 237 ТК РФ): ${data.moralDamage.toLocaleString('ru-RU')} руб.\n` : ''}
ИТОГО К ВЫПЛАТЕ: ${data.totalToRecover.toLocaleString('ru-RU')} руб.

ТРЕБУЮ:
В течение 3 рабочих дней перечислить указанную сумму на мой банковский счет.
В случае неисполнения требования жалобы будут незамедлительно направлены в Государственную инспекцию труда (ГИТ), Прокуратуру РФ и суд с требованием проведения проверки по ст. 5.27 КоАП РФ / ст. 145.1 УК РФ.

Подпись: _________________ / ${sender} /`;
            }

            if (type === 'damage') {
                return header + 
`ДОСУДЕБНАЯ ПРЕТЕНЗИЯ
о возмещении материального ущерба, причиненного заливом жилого помещения (ст. 1064 ГК РФ)

Я являюсь собственником жилого помещения, расположенного по адресу: ${senderAddr}.
В результате залива из вышерасположенной квартиры / общего стояка дому и имуществу причинен материальный ущерб, зафиксированный Актом осмотра.
Согласно расчету и отчету независимой экспертизы:
1. Стоимость восстановительного ремонта: ${data.repairCost.toLocaleString('ru-RU')} руб.
2. Стоимость поврежденного имущества / техники: ${data.propertyLoss.toLocaleString('ru-RU')} руб.
3. Расходы на оплату независимой экспертизы: ${data.expertCost.toLocaleString('ru-RU')} руб.
4. Проценты за неправомерное удержание денежных средств (ст. 395 ГК РФ): ${data.interest395.toLocaleString('ru-RU')} руб.
5. Компенсация морального вреда: ${data.moralDamage.toLocaleString('ru-RU')} руб.

В соответствии со ст. 15, 1064 Гражданского кодекса РФ вред, причиненный имуществу гражданина, подлежит возмещению в полном объеме лицом, причинившим вред (либо управляющей организацией в силу ст. 161 ЖК РФ).

ТРЕБУЮ:
В течение 10 календарных дней с момента получения настоящей претензии выплатить сумму ущерба в размере ${data.totalToRecover.toLocaleString('ru-RU')} руб.

Приложения:
1. Копия Акта о заливе помещения;
2. Копия отчета независимой экспертной организации;
3. Копия документов об оплате экспертных услуг.

Подпись: _________________ / ${sender} /`;
            }

            if (type === 'insurance') {
                const isCool = data.isCoolingPeriod;
                return header + 
`ЗАЯВЛЕНИЕ (ПРЕТЕНЗИЯ)
о возврате денежных средств, уплаченных за договор страхования / дополнительные финансовые услуги

При заключении кредитного договора мною был оплачен договор страхования / пакет дополнительных финансовых услуг стоимостью ${data.baseRefund || data.insuranceCost} руб.
${isCool 
    ? `С момента заключения договора прошло ${data.daysPassed} дней, что укладывается в гарантированный 30-дневный «период охлаждения» (ч. 2.4 ст. 7 Федерального закона № 353-ФЗ «О потребительском кредите (займе)»).`
    : (data.status === 'early_repayment' 
        ? `Кредитные обязательства исполнены досрочно и в полном объеме. В соответствии с ч. 12 ст. 11 Федерального закона № 353-ФЗ страховая премия подлежит возврату пропорционально неистекшему сроку (${data.unusedRatioPercent}% от уплаченной суммы).`
        : `Мною заявлен отказ от исполнения абонентского/опционного договора (сертификата «Автодруг», телемедицины, юрпомощи) на основании ст. 32 ЗоЗПП и ст. 429.3 ГК РФ.`
    )
}

В соответствии с нормами Закона РФ № 2300-1 и Федерального закона № 123-ФЗ при неудовлетворении требования в добровольный 7-дневный срок спор будет передан на рассмотрение Финансовому уполномоченному и в суд со взысканием:
- 50% штрафа по п. 6 ст. 13 ЗоЗПП (${data.fine50.toLocaleString('ru-RU')} руб.);
- компенсации морального вреда (${data.moralDamage.toLocaleString('ru-RU')} руб.);
- процентов за пользование чужими средствами по ст. 395 ГК РФ (${data.penalty395.toLocaleString('ru-RU')} руб.).

ИТОГО К ВОЗВРАТУ: ${data.totalToRecover.toLocaleString('ru-RU')} руб.

Банковские реквизиты для перечисления средств:
Получатель: ${sender}
Номер счета: ____________________________________
Банк: __________________________________________
БИК: _____________________ К/с: _________________

Подпись: _________________ / ${sender} /`;
            }

            if (type === 'heating') {
                const regionStr = data.isColdRegion ? 'холодная климатическая зона (пятидневка ≤ -31°C)' : 'стандартная климатическая зона РФ (норматив +18°C / угловая +20°C)';
                return header + 
`ЗАЯВЛЕНИЕ (ПРЕТЕНЗИЯ)
об изменении размера платы за ненадлежащее отопление и выплате штрафа по ч. 4 ст. 157 ЖК РФ

Я являюсь потребителем коммунальной услуги по отоплению по адресу: ${senderAddr}.
В период с нарушением температурного режима продолжительностью ${data.violationHours} часов температура в жилом помещении составляла ${data.actualTemp}°C при установленном нормативе не менее ${data.normTemp}°C (${regionStr}).
Согласно п. 15 Приложения № 1 к Правилам предоставления коммунальных услуг (ПП РФ № 354) за каждый час отклонения температуры размер платы снижается на 0,15%.

РАСЧЕТ:
1. Сумма снижения платы за отопление: ${data.reductionAmount.toLocaleString('ru-RU')} руб.
2. Штраф по ч. 4 ст. 157 ЖК РФ в пользу потребителя (50%): ${data.penaltyFine.toLocaleString('ru-RU')} руб.
ИТОГО К ЗАЧЕТУ / ВЫПЛАТЕ: ${data.totalCompensation.toLocaleString('ru-RU')} руб.

ТРЕБУЮ:
Произвести перерасчет в платежном документе за следующий расчетный период и отразить выплату штрафа.

Подпись: _________________ / ${sender} /`;
            }

            if (type === 'water') {
                return header + 
`ЗАЯВЛЕНИЕ (ПРЕТЕНЗИЯ)
об уменьшении платы за коммунальную услугу холодного/горячего водоснабжения при превышении допустимой продолжительности перерывов

По адресу: ${senderAddr} имело место отключение водоснабжения общей продолжительностью ${data.outageHours} часов, что превышает установленный норматив (8 ч/мес суммарно, 4 ч единовременно) на ${data.excessHours} ч.
Согласно разделу IX Правил (ПП РФ № 354) за каждый час превышения размер платы снижается на 0,15%.

Сумма перерасчета платы: ${data.reductionAmount.toLocaleString('ru-RU')} руб.
Штраф по ч. 4 ст. 157 ЖК РФ (50%): ${data.penaltyFine.toLocaleString('ru-RU')} руб.
ИТОГО К ЗАЧЕТУ: ${data.totalCompensation.toLocaleString('ru-RU')} руб.

Подпись: _________________ / ${sender} /`;
            }

            if (type === 'ipu') {
                return header + 
`ЗАЯВЛЕНИЕ (ТРЕБОВАНИЕ)
о проведении перерасчета платы за коммунальные услуги после поверки индивидуального прибора учета (ИПУ)

По адресу: ${senderAddr} была проведена очередная поверка индивидуального прибора учета, подтвердившая его исправность и пригодность к эксплуатации. Сведения внесены во ФГИС «АРШИН».
В соответствии с п. 59, 80(1) Правил (ПП РФ № 354) и позицией Верховного Суда РФ начисление платы по нормативу с повышающим коэффициентом подлежит отмене с проведением перерасчета по фактическим показаниям поверенного счетчика.

Сумма переплаты, подлежащая возврату / зачету: ${data.totalRefund.toLocaleString('ru-RU')} руб.

Подпись: _________________ / ${sender} /`;
            }

            if (type === 'absence') {
                return header + 
`ЗАЯВЛЕНИЕ
о перерасчете размера платы за коммунальные услуги / вывоз ТКО за период временного отсутствия потребителя (п. 86–91 ПП РФ № 354)

Я и члены моей семьи временно отсутствовали в жилом помещении по адресу: ${senderAddr} в течение ${data.absentDays} полных дней подряд.
На основании раздела VIII Постановления Правительства РФ № 354 прошу произвести перерасчет платы за услугу вывоза ТКО / коммунальные услуги.

Сумма перерасчета к зачету: ${data.refundAmount.toLocaleString('ru-RU')} руб.
Приложение: документы, подтверждающие факт и период временного отсутствия (билеты / командировочное удостоверение / справка).

Подпись: _________________ / ${sender} /`;
            }

            if (type === 'product') {
                return header + 
`ДОСУДЕБНАЯ ПРЕТЕНЗИЯ
о возврате денежных средств за товар ненадлежащего качества и уплате неустойки (ст. 22, 23 ЗоЗПП)

Мною в вашем магазине был приобретен товар стоимостью ${data.productPrice.toLocaleString('ru-RU')} руб.
В товаре были обнаружены недостатки, в связи с чем заявлено требование о возврате уплаченной суммы.
В силу ст. 22 Закона РФ «О защите прав потребителей» срок возврата денег составляет 10 календарных дней.
Срок удовлетворения требования пропущен на ${data.delayDays} дней.
В соответствии со ст. 23 ЗоЗПП за каждый день просрочки продавец уплачивает неустойку в размере 1% от цены товара в день (${data.penaltyAmount.toLocaleString('ru-RU')} руб.).

РАСЧЕТ ТРЕБОВАНИЙ:
1. Стоимость товара: ${data.productPrice.toLocaleString('ru-RU')} руб.
2. Законная неустойка 1% в день: ${data.penaltyAmount.toLocaleString('ru-RU')} руб.
3. Компенсация морального вреда (ст. 15 ЗоЗПП): ${data.moralDamage.toLocaleString('ru-RU')} руб.
4. Потребительский штраф 50% (п. 6 ст. 13 ЗоЗПП): ${data.consumerFine50.toLocaleString('ru-RU')} руб.
ИТОГО К ВЗЫСКАНИЮ: ${data.totalToRecover.toLocaleString('ru-RU')} руб.

ТРЕБУЮ:
Выплатить сумму ${data.totalToRecover.toLocaleString('ru-RU')} руб. в течение 3 дней. При отказе иск будет подан в суд с возложением судебных расходов на продавца (госпошлина по ст. 333.36 НК РФ истцом не уплачивается).

Подпись: _________________ / ${sender} /`;
            }

            if (type === 'service') {
                return header + 
`ДОСУДЕБНАЯ ПРЕТЕНЗИЯ
об уплате неустойки 3% в день за нарушение сроков выполнения работ / оказания услуг (ст. 28 ЗоЗПП)

Между мною и вашей организацией был заключен договор на выполнение работ / оказание услуг стоимостью ${data.servicePrice.toLocaleString('ru-RU')} руб.
Установленный договором срок выполнения работ был нарушен, период просрочки составил ${data.delayDays} дней.
В соответствии с п. 5 ст. 28 Закона РФ «О защите прав потребителей» исполнитель уплачивает потребителю за каждый день просрочки неустойку (пеню) в размере 3% цены выполнения работы (но не более общей цены заказа).

РАСЧЕТ ТРЕБОВАНИЙ:
1. Законная неустойка 3% в день: ${data.penaltyAmount.toLocaleString('ru-RU')} руб.
2. Компенсация морального вреда (ст. 15 ЗоЗПП): ${data.moralDamage.toLocaleString('ru-RU')} руб.
3. Штраф 50% за несоблюдение добровольного порядка (п. 6 ст. 13 ЗоЗПП): ${data.consumerFine50.toLocaleString('ru-RU')} руб.
ИТОГО К ВЫПЛАТЕ: ${data.totalToRecover.toLocaleString('ru-RU')} руб.

Подпись: _________________ / ${sender} /`;
            }

            if (type === 'interest') {
                return header + 
`ТРЕБОВАНИЕ (ПРЕТЕНЗИЯ)
об уплате процентов за неправомерное пользование чужими денежными средствами (ст. 395 ГК РФ)

Сумма основного долга / неисполненного денежного обязательства составляет: ${data.debtAmount.toLocaleString('ru-RU')} руб.
Период неправомерного удержания денежных средств: ${data.days} дней.
Действующая ключевая ставка Банка России: ${data.keyRate}%.
В соответствии со ст. 395 Гражданского кодекса РФ размер процентов определяется ключевой ставкой Банка России, действовавшей в соответствующие периоды.

Размер процентов по ст. 395 ГК РФ: ${data.interestAmount.toLocaleString('ru-RU')} руб.
ИТОГО К УПЛАТЕ (ОСНОВНОЙ ДОЛГ + ПРОЦЕНТЫ): ${data.totalDebtWithInterest.toLocaleString('ru-RU')} руб.

Подпись: _________________ / ${sender} /`;
            }

            return header + `ПРЕТЕНЗИЯ (ТРЕБОВАНИЕ)\n\nПодпись: _________________ / ${sender} /`;
        }
    };

    window.LegalCalculator = LegalCalculator;

})(window);
