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
                totalRefund: overpayment,
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
                    absentDays: absenceDays,
                    reductionAmount: 0,
                    refundAmount: 0,
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
                absentDays: absenceDays,
                absentResidents: absentResidents,
                totalResidents: totalResidents,
                billingType: billingType,
                reductionAmount: reductionAmount,
                refundAmount: reductionAmount,
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

        // Aliases for seamless API compatibility
        calculateProductReturn: function (productPrice, delayDays, moralDamage = 3000) {
            return this.calculateProductPenalty(productPrice, delayDays, moralDamage);
        },
        calculateServiceDelay: function (servicePrice, delayDays, moralDamage = 5000) {
            return this.calculateServicePenalty(servicePrice, delayDays, moralDamage);
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
         * 9. Генератор процессуально выверенных досудебных документов и претензий
         * Разработан в строгом соответствии с ГПК РФ (ст. 131, 132), ЗоЗПП (ст. 13, 22, 23, 28, 31),
         * ЖК РФ (ст. 157), ТК РФ (ст. 236), 353-ФЗ, 123-ФЗ и ГК РФ (ст. 15, 395, 1064).
         */
        generateClaimText: function (type, data, userDetails = {}) {
            const sender = userDetails.userName || '_______________________________________________________';
            const senderAddr = userDetails.userAddress || '_______________________________________________________';
            const senderPhone = userDetails.userPhone || '+7 (___) ___-__-__';
            const recipient = userDetails.recipientName || '_______________________________________________________';
            const recipientAddr = userDetails.recipientAddress || '_______________________________________________________';
            const accountNo = userDetails.accountNumber ? userDetails.accountNumber.trim() : '';
            const accountHeader = accountNo ? `\nЛицевой счет / Идентификатор договора: ${accountNo}` : '';

            let header = '';
            if (type === 'duty') {
                const courtName = recipient || 'В районный / городской суд (мировому судье)';
                const courtAddr = recipientAddr || '_______________________________________________________';
                const caseDetails = accountNo ? `\nСведения о договоре / обязательстве: ${accountNo}` : '';
                header = 
`В: ${courtName}
Адрес суда: ${courtAddr}

Истец (Заявитель): ${sender}
Адрес места жительства (нахождения): ${senderAddr}
Контактный телефон: ${senderPhone}${caseDetails}

Ответчик (Должник): ____________________________________________________
Адрес ответчика: ______________________________________________________

`;
            } else {
                header = 
`Кому: ${recipient}
(наименование организации / продавца / управляющей компании / работодателя)
Адрес местонахождения: ${recipientAddr}

От кого: ${sender}
(Ф.И.О. гражданина / потребителя полностью)
Адрес для корреспонденции: ${senderAddr}
(почтовый индекс, субъект РФ, населенный пункт, улица, дом, квартира)
Контактный телефон: ${senderPhone}${accountHeader}
Электронная почта: ____________________________________________________

`;
            }

            const footerSignature = 
`«___» ________________ 202_ г.      Подпись заявителя: ________________ / ________________ /`;

            const bankRequisitesBlock = 
`БАНКОВСКИЕ РЕКВИЗИТЫ ДЛЯ ПЕРЕЧИСЛЕНИЯ СРЕДСТВ:
Получатель: ____________________________________________________
Номер банковского счета: ________________________________________
Банк получателя: ________________________________________________
БИК банка: _______________________ Корр. счет: __________________
Назначение платежа: Добровольное удовлетворение требований по досудебной претензии`;

            // 1. ГОСПОШЛИНА (СТ. 333.19 НК РФ)
            if (type === 'duty') {
                return header + 
`РАСЧЕТ ЦЕНЫ ИСКА И РАЗМЕРА ГОСУДАРСТВЕННОЙ ПОШЛИНЫ
(для подачи в суд в соответствии со ст. 131, 132 ГПК РФ и ст. 333.19 НК РФ в ред. 259-ФЗ)

1. Цена иска (размер имущественных требований): ${data.claimPrice.toLocaleString('ru-RU')} руб.
2. Категория иска: ${data.claimType === 'property' ? 'Имущественный спор, подлежащий оценке' : (data.claimType === 'non_property' ? 'Исковое заявление неимущественного характера' : 'Расторжение брака')}.
3. Порядок рассмотрения: ${data.isCourtOrder ? 'Судебный приказ (размер пошлины снижен на 50% по п. 2 ст. 333.19 НК РФ)' : 'Исковое производство'}.
4. Наличие процессуальных льгот: ${data.isConsumerExempt ? 'ДА — 100% освобождение от уплаты пошлины при цене иска до 1 000 000 руб. (п. 3 ст. 333.36 НК РФ, ст. 17 ЗоЗПП)' : 'Льготы не заявлены'}.
5. ИТОГОВАЯ СУММА ПОШЛИНЫ К УПЛАТЕ: ${data.dutyAmount.toLocaleString('ru-RU')} руб.

ПРАВОВОЕ ОБОСНОВАНИЕ:
${data.lawBasis}
В силу ст. 98 ГПК РФ в случае удовлетворения исковых требований расходы по уплате государственной пошлины подлежат взысканию с ответчика в пользу истца в полном объеме.

${footerSignature}`;
            }

            // 2. ВОЗВРАТ ТОВАРА НЕНАДЛЕЖАЩЕГО КАЧЕСТВА (ЗОЗПП СТ. 18, 22, 23)
            if (type === 'product') {
                const preTrialTotal = data.productPrice + data.penaltyAmount;
                const orderText = accountNo ? ` (номер заказа / чека: ${accountNo})` : '';
                return header + 
`ДОСУДЕБНАЯ ПРЕТЕНЗИЯ
о возврате денежных средств за товар ненадлежащего качества и выплате законной неустойки

«___» ________ 202_ г. мною в вашей организации был приобретен товар${orderText} стоимостью ${data.productPrice.toLocaleString('ru-RU')} руб.
В процессе эксплуатации в товаре были выявлены производственные недостатки. Мною было заявлено требование о возврате уплаченной за товар денежной суммы.
В соответствии со ст. 22 Закона РФ «О защите прав потребителей» (№ 2300-1) требования потребителя о возврате уплаченной за товар суммы подлежат удовлетворению продавцом в течение 10 календарных дней со дня предъявления соответствующего требования.
Указанный срок вами нарушен, период просрочки составил ${data.delayDays} дней.
В силу п. 1 ст. 23 ЗоЗПП за каждый день просрочки продавец уплачивает потребителю законную неустойку в размере 1% от цены товара в день, что на дату составления претензии составляет: ${data.penaltyAmount.toLocaleString('ru-RU')} руб.

I. ТРЕБОВАНИЯ, ПОДЛЕЖАЩИЕ ДОБРОВОЛЬНОМУ УДОВЛЕТВОРЕНИЮ:
1. Стоимость товара (к возврату): ${data.productPrice.toLocaleString('ru-RU')} руб.
2. Законная неустойка 1% в день (ст. 23 ЗоЗПП): ${data.penaltyAmount.toLocaleString('ru-RU')} руб.
ИТОГО К ВЫПЛАТЕ В ДОСУДЕБНОМ ПОРЯДКЕ: ${preTrialTotal.toLocaleString('ru-RU')} руб.

II. ПРЕДУПРЕЖДЕНИЕ О ПОСЛЕДСТВИЯХ СУДЕБНОГО РАЗБИРАТЕЛЬСТВА:
Уведомляю, что в случае неудовлетворения законных требований в установленный 10-дневный срок потребитель обратится в суд, где с вашей организации в судебном порядке дополнительно будут взысканы:
1. Потребительский штраф в размере 50% от всей присужденной судом суммы за отказ добровольно удовлетворить требования потребителя (п. 6 ст. 13 ЗоЗПП) — ориентировочно ${data.consumerFine50.toLocaleString('ru-RU')} руб.;
2. Денежная компенсация причиненного морального вреда (ст. 15 ЗоЗПП) — ${data.moralDamage.toLocaleString('ru-RU')} руб.;
3. Законная неустойка 1% за каждый день просрочки по день фактической выплаты (п. 1 ст. 23 ЗоЗПП);
4. Судебные расходы на оплату услуг представителя и проведение экспертизы (ст. 98, 100 ГПК РФ).
В силу пп. 4 п. 2 ст. 333.36 НК РФ потребители полностью освобождены от уплаты госпошлины.

ТРЕБУЮ:
В течение 10 календарных дней с момента получения настоящей претензии перечислить сумму в размере ${preTrialTotal.toLocaleString('ru-RU')} руб. по указанным ниже банковским реквизитам.

${bankRequisitesBlock}

Приложения:
1. Копия документа, подтверждающего приобретение и оплату товара (кассовый/товарный чек, электронная квитанция);
2. Копия акта проверки качества / заключения сервисного центра (при наличии).

${footerSignature}`;
            }

            // 3. НАРУШЕНИЕ СРОКОВ РАБОТ / УСЛУГ (ЗОЗПП СТ. 28, 31)
            if (type === 'service') {
                const contractStr = accountNo ? `договор № ${accountNo}` : 'договор на выполнение работ / оказание услуг';
                return header + 
`ДОСУДЕБНАЯ ПРЕТЕНЗИЯ
об уплате законной неустойки за нарушение сроков выполнения работ / оказания услуг (ст. 28, 31 ЗоЗПП)

Между мною и вашей организацией был заключен ${contractStr} общей стоимостью ${data.servicePrice.toLocaleString('ru-RU')} руб.
В нарушение условий договора и требований ст. 27, 28 Закона РФ «О защите прав потребителей» установленные сроки выполнения работ (оказания услуг) нарушены. Период просрочки составил ${data.delayDays} дней.
В силу п. 5 ст. 28 ЗоЗПП исполнитель уплачивает потребителю за каждый день просрочки неустойку (пеню) в размере 3% от цены выполнения работы (услуги). Размер законной неустойки (ограниченный общей ценой заказа) составляет: ${data.penaltyAmount.toLocaleString('ru-RU')} руб.

I. РАСЧЕТ ДОСУДЕБНОГО ТРЕБОВАНИЯ:
1. Законная неустойка 3% в день (п. 5 ст. 28 ЗоЗПП): ${data.penaltyAmount.toLocaleString('ru-RU')} руб.
ИТОГО К ДОБРОВОЛЬНОЙ ВЫПЛАТЕ: ${data.penaltyAmount.toLocaleString('ru-RU')} руб.

II. ПРЕДУПРЕЖДЕНИЕ ОБ ОТВЕТСТВЕННОСТИ:
В соответствии со ст. 31 ЗоЗПП требования потребителя об уплате неустойки подлежат удовлетворению в 10-дневный срок со дня предъявления.
При отказе в добровольном удовлетворении требования в суд будет подан иск со взысканием:
- Штрафа в размере 50% от присужденной суммы за отказ в досудебном урегулировании (п. 6 ст. 13 ЗоЗПП) — ${data.consumerFine50.toLocaleString('ru-RU')} руб.;
- Компенсации морального вреда (ст. 15 ЗоЗПП) — ${data.moralDamage.toLocaleString('ru-RU')} руб.;
- Судебных издержек на оплату услуг юриста (ст. 100 ГПК РФ).

ТРЕБУЮ:
В 10-дневный срок перечислить сумму законной неустойки в размере ${data.penaltyAmount.toLocaleString('ru-RU')} руб. на мой банковский счет.

${bankRequisitesBlock}

${footerSignature}`;
            }

            // 4. ПРОЦЕНТЫ ПО СТ. 395 ГК РФ
            if (type === 'interest') {
                const obligationStr = accountNo ? `по договору / расписке / счёту № ${accountNo}` : 'по денежному обязательству';
                return header + 
`ТРЕБОВАНИЕ (ДОСУДЕБНАЯ ПРЕТЕНЗИЯ)
об исполнении денежного обязательства и уплате процентов за неправомерное пользование чужими средствами (ст. 395 ГК РФ)

У должника имеется неисполненное денежное обязательство ${obligationStr} в размере ${data.debtAmount.toLocaleString('ru-RU')} руб.
Период неправомерного удержания денежных средств составляет ${data.days} дней.
В соответствии с п. 1 ст. 395 Гражданского кодекса РФ в случаях неправомерного удержания денежных средств, уклонения от их возврата, иной просрочки в их уплате подлежат уплате проценты на сумму долга в размере ключевой ставки Банка России (${data.keyRate}%), действовавшей в соответствующие периоды.
Сумма процентов по ст. 395 ГК РФ на день составления претензии составляет: ${data.interestAmount.toLocaleString('ru-RU')} руб.

I. РАСЧЕТ ДОСУДЕБНОГО ТРЕБОВАНИЯ:
1. Сумма основного долга: ${data.debtAmount.toLocaleString('ru-RU')} руб.
2. Проценты за пользование чужими средствами (ст. 395 ГК РФ): ${data.interestAmount.toLocaleString('ru-RU')} руб.
ИТОГО К ВЫПЛАТЕ В ДОСУДЕБНОМ ПОРЯДКЕ: ${data.totalDebtWithInterest.toLocaleString('ru-RU')} руб.

II. ПРЕДУПРЕЖДЕНИЕ:
В силу п. 3 ст. 395 ГК РФ и п. 48 Постановления Пленума Верховного Суда РФ от 24.03.2016 № 7 проценты взимаются по день фактической уплаты суммы долга. В случае передачи спора в суд сумма процентов будет пересчитана на день вынесения решения суда с возложением на должника всех судебных расходов и государственной пошлины (ст. 98 ГПК РФ).

ТРЕБУЮ:
В течение 10 календарных дней перечислить задолженность в размере ${data.totalDebtWithInterest.toLocaleString('ru-RU')} руб.

${bankRequisitesBlock}

${footerSignature}`;
            }

            // 5. ВОЗВРАТ СТРАХОВКИ И ДОПУСЛУГ (353-ФЗ, 123-ФЗ, СТ. 32 ЗОЗПП)
            if (type === 'insurance') {
                const isCool = data.isCoolingPeriod;
                const docIdStr = accountNo ? ` (договор / полис / кредит: ${accountNo})` : '';
                return header + 
`ЗАЯВЛЕНИЕ (ДОСУДЕБНАЯ ПРЕТЕНЗИЯ)
об отказе от договора страхования / опционного сертификата и возврате денежных средств

При оформлении кредита${docIdStr} мною был оплачен договор страхования / пакет дополнительных услуг стоимостью ${data.baseRefund.toLocaleString('ru-RU')} руб.
${isCool 
    ? `С момента заключения договора прошло ${data.daysPassed} дней, что укладывается в гарантированный законом 30-дневный «период охлаждения» (ч. 2.4 ст. 7 Федерального закона № 353-ФЗ в ред. 359-ФЗ). В период охлаждения потребитель имеет безусловное право на 100% возврат уплаченной суммы.`
    : (data.status === 'early_repayment' 
        ? `Кредитные обязательства исполнены мною досрочно и в полном объеме. В силу ч. 12 ст. 11 Федерального закона № 353-ФЗ страховая премия подлежит возврату пропорционально неистекшему сроку кредитования (${data.unusedRatioPercent}% от уплаченной суммы).`
        : `Мною заявлен отказ от исполнения договора оказания услуг / опционного договора (сертификата помощи на дорогах, телемедицины) на основании ст. 32 ЗоЗПП и ст. 429.3 ГК РФ.`
    )
}

I. СУММА К ДОБРОВОЛЬНОМУ ВОЗВРАТУ:
Сумма страховой премии / опционного платежа к возврату: ${data.baseRefund.toLocaleString('ru-RU')} руб.

II. СРОКИ И ПРЕДУПРЕЖДЕНИЕ О ПОРЯДКЕ ВЗЫСКАНИЯ:
В силу ч. 2.4 ст. 7 / ч. 12 ст. 11 Федерального закона № 353-ФЗ возврат денежных средств должен быть произведен в течение 7 рабочих дней со дня получения заявления.
В случае неисполнения требования в 7-дневный срок спор будет незамедлительно передан на рассмотрение Службы финансового уполномоченного (ФЗ № 123-ФЗ) и в суд со взысканием судом:
- Штрафа 50% по п. 6 ст. 13 ЗоЗПП за отказ в добровольном возврате (${data.fine50.toLocaleString('ru-RU')} руб.);
- Процентов по ст. 395 ГК РФ за каждый день неправомерного удержания;
- Компенсации морального вреда (ст. 15 ЗоЗПП).

${bankRequisitesBlock}

${footerSignature}`;
            }

            // 6. ОТОПЛЕНИЕ НИЖЕ НОРМЫ (ПП РФ № 354, Ч. 4 СТ. 157 ЖК РФ)
            if (type === 'heating') {
                const regionStr = data.isColdRegion ? 'холодная климатическая зона (норматив +20°C / угловая +22°C)' : 'стандартная климатическая зона РФ (норматив +18°C / угловая +20°C)';
                const accStr = accountNo ? ` (лицевой счет: ${accountNo})` : '';
                return header + 
`ЗАЯВЛЕНИЕ (ПРЕТЕНЗИЯ)
об изменении размера платы за коммунальную услугу отопления ненадлежащего качества

Я являюсь потребителем коммунальной услуги по отоплению в жилом помещении по адресу: ${senderAddr}${accStr}.
В период с нарушением температурного режима продолжительностью ${data.violationHours} часов температура воздуха в жилом помещении составляла ${data.actualTemp}°C при установленном нормативе не менее ${data.normTemp}°C (${regionStr}).
Факт нарушения подтверждается Актом проверки качества предоставления коммунальных услуг / журналом регистрации аварийно-диспетчерской службы.
Согласно п. 15 Приложения № 1 к Правилам предоставления коммунальных услуг (ПП РФ № 354) за каждый час отклонения температуры размер платы снижается на 0,15%.

I. РАСЧЕТ СУММЫ СНИЖЕНИЯ ПЛАТЫ:
1. Размер снижения платы за отопление (${data.reductionPercent}% за ${data.violationHours} ч): ${data.reductionAmount.toLocaleString('ru-RU')} руб.
ИТОГО СУММА ПЕРЕРАСЧЕТА К ЗАЧЕТУ В ПЛАТЕЖНОМ ДОКУМЕНТЕ: ${data.reductionAmount.toLocaleString('ru-RU')} руб.

II. ПРЕДУПРЕЖДЕНИЕ ОБ ОТВЕТСТВЕННОСТИ:
В случае отказа произвести перерасчет управляющая организация подлежит привлечению к ответственности по ч. 4 ст. 157 ЖК РФ с выплатой штрафа в пользу потребителя в размере 50% от величины превышения платы (${data.penaltyFine.toLocaleString('ru-RU')} руб.), а также привлечению к административной ответственности по ст. 7.23 КоАП РФ через Государственную жилищную инспекцию (ГЖИ).

ТРЕБУЮ:
На основании ч. 4 ст. 157 ЖК РФ и ПП РФ № 354 произвести перерасчет платы за отопление и отразить снижение платы на сумму ${data.reductionAmount.toLocaleString('ru-RU')} руб. в платежном документе (квитанции) за следующий расчетный период.

${footerSignature}`;
            }

            // 7. ВОДОСНАБЖЕНИЕ (ПП РФ № 354, Ч. 4 СТ. 157 ЖК РФ)
            if (type === 'water') {
                const accStr = accountNo ? ` (лицевой счет: ${accountNo})` : '';
                return header + 
`ЗАЯВЛЕНИЕ (ПРЕТЕНЗИЯ)
об уменьшении размера платы за коммунальную услугу водоснабжения в связи с превышением допустимой продолжительности перерывов

В жилом помещении по адресу: ${senderAddr}${accStr} имело место непредоставление коммунальной услуги водоснабжения общей продолжительностью ${data.outageHours} часов, что превышает установленный норматив (не более 8 часов суммарно в месяц, не более 4 часов единовременно) на ${data.excessHours} ч.
Согласно разделу IX Правил (ПП РФ № 354) за каждый час превышения допустимого перерыва размер платы снижается на 0,15%.

I. РАСЧЕТ СНИЖЕНИЯ ПЛАТЫ:
1. Сумма снижения платы за водоснабжение (${data.reductionPercent}%): ${data.reductionAmount.toLocaleString('ru-RU')} руб.
ИТОГО СУММА ПЕРЕРАСЧЕТА К ЗАЧЕТУ В ПЛАТЕЖНОМ ДОКУМЕНТЕ: ${data.reductionAmount.toLocaleString('ru-RU')} руб.

II. ПРЕДУПРЕЖДЕНИЕ ОБ ОТВЕТСТВЕННОСТИ:
При отказе в добровольном перерасчете потребитель вправе требовать взыскания штрафа в размере 50% (${data.penaltyFine.toLocaleString('ru-RU')} руб.) по ч. 4 ст. 157 ЖК РФ и привлечения управляющей организации к ответственности по ст. 7.23 КоАП РФ через органы ГЖИ и Роспотребнадзора.

ТРЕБУЮ:
Отразить снижение платы на сумму ${data.reductionAmount.toLocaleString('ru-RU')} руб. в платежном документе (квитанции) за следующий расчетный период.

${footerSignature}`;
            }

            // 8. СВЕРКА ИПУ (ПП РФ № 354)
            if (type === 'ipu') {
                const accStr = accountNo ? ` (лицевой счет: ${accountNo})` : '';
                const refundVal = (data.totalRefund !== undefined ? data.totalRefund : (data.overpayment || 0));
                return header + 
`ЗАЯВЛЕНИЕ
о перерасчете платы за коммунальные услуги по фактическим показаниям поверенного индивидуального прибора учета (ИПУ)

В жилом помещении по адресу: ${senderAddr}${accStr} проведена поверка индивидуального прибора учета, подтвердившая исправность прибора. Сведения о поверке внесены во ФГИС «АРШИН».
В соответствии с п. 59, 80(1), 84 Правил (ПП РФ № 354) и правовой позицией Верховного Суда РФ начисление платы по нормативу с повышающим коэффициентом 1.5 подлежит отмене с момента поверки.

I. СУММА ПЕРЕПЛАТЫ К ЗАЧЕТУ:
Сумма излишне начисленной платы, подлежащая зачету: ${refundVal.toLocaleString('ru-RU')} руб.

ТРЕБУЮ:
Произвести перерасчет платы по фактическим показаниям поверенного ИПУ и зачесть переплату в размере ${refundVal.toLocaleString('ru-RU')} руб. в счет будущих начислений.

${footerSignature}`;
            }

            // 9. ВРЕМЕННОЕ ОТСУТСТВИЕ / ТКО (ПП РФ № 354)
            if (type === 'absence') {
                const accStr = accountNo ? ` (лицевой счет: ${accountNo})` : '';
                const daysAbsent = data.absenceDays ?? data.absentDays ?? 0;
                const refundVal = (data.reductionAmount !== undefined ? data.reductionAmount : (data.refundAmount || 0));
                return header + 
`ЗАЯВЛЕНИЕ
о перерасчете размера платы за коммунальные услуги / вывоз ТКО в связи с временным отсутствием (п. 86–91 ПП РФ № 354)

Я и члены моей семьи временно отсутствовали в жилом помещении по адресу: ${senderAddr}${accStr} в течение ${daysAbsent} полных календарных дней подряд.
На основании раздела VIII Правил (ПП РФ № 354, Постановление Правительства РФ № 2076) прошу произвести перерасчет платы за коммунальную услугу обращения с ТКО / коммунальные услуги.

I. СУММА ПЕРЕРАСЧЕТА:
Сумма перерасчета к зачету в счет будущих периодов: ${refundVal.toLocaleString('ru-RU')} руб.

Приложение: Документы, подтверждающие период временного отсутствия (проездные билеты / командировочное удостоверение / справка из лечебного учреждения).

${footerSignature}`;
            }

            // 10. ЗАДЕРЖКА ЗАРПЛАТЫ (СТ. 236 ТК РФ)
            if (type === 'salary') {
                const totalDue = data.salaryDebt + data.delayCompensation;
                const empIdStr = accountNo ? ` (табельный номер / договор: ${accountNo})` : '';
                return header + 
`ТРЕБОВАНИЕ (ПРЕТЕНЗИЯ)
о выплате задолженности по заработной плате и денежной компенсации за задержку (ст. 236 ТК РФ)

Я состою (состоял) в трудовых отношениях с работодателем${empIdStr}.
В нарушение требований ст. 136 Трудового кодекса РФ заработная плата за отработанный период в установленный срок мне выплачена не была. Задолженность составляет: ${data.salaryDebt.toLocaleString('ru-RU')} руб. Период просрочки: ${data.delayDays} дней.
В силу ст. 236 ТК РФ при нарушении работодателем установленного срока выплаты заработной платы работодатель обязан выплатить их с уплатой денежной компенсации в размере не ниже 1/150 действующей ключевой ставки ЦБ РФ (${data.keyRate}%) за каждый день задержки.
Размер компенсации составляет: ${data.delayCompensation.toLocaleString('ru-RU')} руб. (в силу п. 1 ст. 217 НК РФ компенсация не облагается НДФЛ).

I. СУММА К ОБЯЗАТЕЛЬНОЙ ВЫПЛАТЕ РАБОТОДАТЕЛЕМ:
1. Задолженность по заработной плате: ${data.salaryDebt.toLocaleString('ru-RU')} руб.
2. Денежная компенсация по ст. 236 ТК РФ (1/150 ключевой ставки ЦБ РФ): ${data.delayCompensation.toLocaleString('ru-RU')} руб.
ИТОГО К ВЫПЛАТЕ: ${totalDue.toLocaleString('ru-RU')} руб.
${data.isIllegalDismissal ? `(С учетом оплаты времени вынужденного прогула по ст. 394 ТК РФ: ${data.totalToRecover.toLocaleString('ru-RU')} руб.)` : ''}

II. ПРЕДУПРЕЖДЕНИЕ ОБ ОТВЕТСТВЕННОСТИ:
При невыплате задолженности в течение 3 рабочих дней мною будут поданы заявления в Государственную инспекцию труда (ГИТ), Прокуратуру РФ и Следственный комитет РФ для привлечения виновных должностных лиц к административной и уголовной ответственности по ст. 5.27 КоАП РФ и ст. 145.1 УК РФ, а также иск в суд со взысканием компенсации морального вреда (ст. 237 ТК РФ). При задержке свыше 15 дней оставляю за собой право приостановить работу на основании ст. 142 ТК РФ.

${bankRequisitesBlock}

${footerSignature}`;
            }

            // 11. ЗАЛИВ КВАРТИРЫ / УЩЕРБ ИМУЩЕСТВУ (СТ. 15, 1064 ГК РФ)
            if (type === 'damage') {
                const actStr = accountNo ? ` (Акт о заливе: ${accountNo})` : '';
                return header + 
`ДОСУДЕБНАЯ ПРЕТЕНЗИЯ
о добровольном возмещении ущерба, причиненного заливом жилого помещения (ст. 15, 1064 ГК РФ)

Я являюсь собственником жилого помещения по адресу: ${senderAddr}.
В результате залива из вышерасположенного помещения / общедомовых коммуникаций квартире и находящемуся в ней имуществу был причинен материальный ущерб${actStr}.
В соответствии с отчетом независимой экспертной оценки:
1. Стоимость восстановительного ремонта: ${data.repairCost.toLocaleString('ru-RU')} руб.
2. Стоимость поврежденного имущества: ${data.propertyLoss.toLocaleString('ru-RU')} руб.
3. Расходы на проведение независимой экспертизы: ${data.expertCost.toLocaleString('ru-RU')} руб.
ИТОГО РАЗМЕР ПРЯМОГО УЩЕРБА К ДОБРОВОЛЬНОМУ ВОЗМЕЩЕНИЮ: ${data.principalDebt.toLocaleString('ru-RU')} руб.

В силу ст. 15 и 1064 ГК РФ лицо, причинившее вред, обязано возместить его в полном объеме, включая расходы на проведение экспертизы для фиксации размера ущерба.

II. ПРЕДУПРЕЖДЕНИЕ О СУДЕБНЫХ САНКЦИЯХ:
В случае отказа в добровольном возмещении в 10-дневный срок в суд будет подан иск о принудительном взыскании суммы ущерба с возложением процентов по ст. 395 ГК РФ (${data.interest395.toLocaleString('ru-RU')} руб.), компенсации морального вреда (${data.moralDamage.toLocaleString('ru-RU')} руб.) и судебных издержек (ст. 98 ГПК РФ).

ТРЕБУЮ:
В течение 10 календарных дней перечислить сумму причиненного ущерба в размере ${data.principalDebt.toLocaleString('ru-RU')} руб.

${bankRequisitesBlock}

Приложения:
1. Копия Акта о заливе жилого помещения;
2. Копия Отчета независимой экспертизы стоимости восстановительного ремонта;
3. Копия договора и квитанции об оплате услуг эксперта.

${footerSignature}`;
            }

            return header + `ДОСУДЕБНАЯ ПРЕТЕНЗИЯ\n\n${footerSignature}`;
        }
    };

    window.LegalCalculator = LegalCalculator;

})(window);
