var a4 = (function() {

        "use strict";

        // AmortizationAttributes {
        //   Money loanAmount;              // original principal amount, not null
        //   Money regularPayment;          // monthly payment to be made, assumed monthly, null allowed: will be calculated
        //   LocalDate startDate;           // loan start date
        //   LocalDate adjustmentDate;      // date from which amortization calculations commence
        //   int termInMonths;              // number of months from the adjustment date at which amortization stops and remaining principal is due
        //   boolean interestOnly;          // true if this is an interest only calculation (ie no amortization)
        //   int amortizationPeriodMonths;  // number of months over which to amortize the payments. If payments are made till this date, principal remaining will be 0
        //   int compoundingPeriodsPerYear; // number of times a year interest compounding is calculated. Canadian rules: 2 (semi-annually). American rules: 12 (monthly). Range 1- 52
        //   int paymentFrequency;          // number of times a year payments will be made. Range 1 - 52.
        //   double interestRate;           // the nominal interest rate being paid (effective rate can be higher if compounding)
        // }

        var _roundUp = function(amount, decimals) {
                var precision = Math.pow(10, decimals);
                return Math.ceil(amount * precision) / precision;
        };


        const DAYS_IN_A_YEAR = 365;


        function timePeriod() {
                return [{
                                periodsPerYear: 52,
                                text: 'weekly',
                                compoundingPeriod: false
                        },
                        {
                                periodsPerYear: 26,
                                text: 'bi-weekly',
                                compoundingPeriod: false
                        },
                        {
                                periodsPerYear: 24,
                                text: 'semi-monthly',
                                compoundingPeriod: false
                        },
                        {
                                periodsPerYear: 12,
                                text: 'monthly',
                                compoundingPeriod: true
                        },
                        {
                                periodsPerYear: 6,
                                text: 'bi-monthly',
                                compoundingPeriod: false
                        },
                        {
                                periodsPerYear: 4,
                                text: 'quarterly',
                                compoundingPeriod: false
                        },
                        {
                                periodsPerYear: 2,
                                text: 'semi-annually',
                                compoundingPeriod: true
                        },
                        {
                                periodsPerYear: 1,
                                text: 'annually',
                                compoundingPeriod: true
                        }
                ];
        }


        var _nextDate = function(startDate, paymentFrequency, steps) {

                switch (paymentFrequency) {

                        case 1:
                                return moment(startDate).add(1 * steps, 'years').toDate();
                        case 2:
                                return moment(startDate).add(6 * steps, 'months').toDate();
                        case 4:
                                return moment(startDate).add(3 * steps, 'months').toDate();
                        case 6:
                                return moment(startDate).add(2 * steps, 'months').toDate();
                        case 12:
                                return moment(startDate).add(1 * steps, 'months').toDate();
                        case 26:
                                return moment(startDate).add(2 * steps, 'weeks').toDate();
                        case 52:
                                return moment(startDate).add(1 * steps, 'weeks').toDate();

                        case 24:
                                let dayOfMonth = startDate.getDate();
                                let modifiedStartDate = moment(startDate);
                                if (dayOfMonth > 28) {
                                        // First of the next month
                                        modifiedStartDate = modifiedStartDate.date(1).add(1, 'months');
                                }


                                if (steps % 2 == 0) {
                                        return modifiedStartDate.add(steps / 2, 'months').toDate();
                                }

                                let prevDate = modifiedStartDate.add((steps - 1) / 2, 'months');
                                if (modifiedStartDate.date() < 15) {
                                        return prevDate.add(14, 'days').toDate();
                                }

                                return modifiedStartDate.add(-14, 'days').add(1, 'months').toDate();


                        default:
                                console.log("Unsupported payment frequency: " + paymentFrequency);
                }

        };


        /**
         * Retrieve the interest rate for the compounding period based on the annual interest rate.
         *
         * @param {number} annualInterestRatePercent input annual interest rate as a percent (ie 8.25 for 8.25%)
         * @param {int} compoundPeriodsPerYear 2 if compounding semi-annually, 12 if compounding monthly
         * @returns {number} interest rate as a decimal (ie .125 for 12.5%)
         */
        var _getPeriodRate = function(annualInterestRatePercent, compoundPeriodsPerYear, paymentsPerYear) {
                return Math.pow(1 + annualInterestRatePercent / (compoundPeriodsPerYear * 100.0), compoundPeriodsPerYear / paymentsPerYear) - 1;
        };


        /**
         * Given an amount and an annual interest rate, return the monthly payment
         * for an interest only loan.
         *
         * @param {number} amount the principal amount
         * @param {number} rate the annual interest rate expressed as a percent
         * @returns {number} Raw amount with fractional units representing the monthly interest charge.
         */
        var _getInterestOnlyPeriodicPayment = function(amAttrs) {
                // percent to decimal, annual rate to period (monthly) rate
                var annualRate = amAttrs.interestRate / 100.0;
                var periodRate = annualRate / amAttrs.paymentFrequency;
                var periodicPayment = amAttrs.loanAmount * periodRate;
                return _roundUp(periodicPayment, 2);
        };


        /**
         * Daily interest rate for balance. Typically used to calculate the initial
         * adjustment amount or late payments on payout. Assumes a constant 365 days
         * per year, regardless of the year.
         *
         */
        var getPerDiem = function(amAttrs) {
                var perDiemAmAttrs = {
                        loanAmount: amAttrs.loanAmount,
                        interestRate: amAttrs.interestRate,
                        paymentFrequency: DAYS_IN_A_YEAR
                };
                return _getInterestOnlyPeriodicPayment(perDiemAmAttrs);
        };


        /**
         * Given an amount and an annual interest rate, return the monthly payment
         * for an interest only loan.
         *
         * @param {number} loanAmount the principal
         * @param {number} i the interest rate expressed as a percent
         * @param {int} compoundPeriodsPerYear The number of times a year interest is calculated.
         * Canadian law specifies semi-annually (ie 2x a year). Americans typically use monthly (ie 12x a year).
         * @param {int} amortizationPeriod The number of months the loan is spread over
         *
         * @returns {number} The expected monthly payment amortized over the given period.
         */

        var _getAmortizedPeriodicPayment = function(amAttrs) {

                if (amAttrs.amortizationPeriodMonths < 1) {
                        return amAttrs.loanAmount;
                }
                if (amAttrs.interestRate <= 0) {
                        return amAttrs.loanAmount / amAttrs.termInMonths;
                }

                var periodRate = _getPeriodRate(amAttrs.interestRate, amAttrs.compoundingPeriodsPerYear, amAttrs.paymentFrequency);
                var periods = amAttrs.paymentFrequency * amAttrs.amortizationPeriodMonths / 12;
                var x = Math.pow(periodRate + 1.0, periods);
                var periodPayment = (amAttrs.loanAmount * periodRate * x) / (x - 1);

                return _roundUp(periodPayment, 2);
        };


        var _getAdjusmentPayment = function(amAttrs) {
                var days = moment(amAttrs.adjustmentDate).diff(amAttrs.startDate, 'days');
                var amount = getPerDiem(amAttrs) * days;
                var payment = {};
                payment.paymentNumber = 0;
                payment.date = amAttrs.adjustmentDate;
                payment.interest = _roundUp(amount, 2);
                payment.principal = 0;
                payment.balance = amAttrs.loanAmount;
                return payment;
        };


        /**
         * Get interest only payments.
         * @param {AmortizationAttributes} amAttrs Loan details.
         * @returns {Payment[]} An array of regular payments for the given loan attributes.
         */
        var _getInterestOnlyPayments = function(amAttrs) {

                var periodicPayment = _getInterestOnlyPeriodicPayment(amAttrs);
                var totalPayments = (amAttrs.termInMonths / 12) * amAttrs.paymentFrequency;
                var paymentList = [];

                paymentList.push(_getAdjusmentPayment(amAttrs));

                for (let paymentNumber = 1; paymentNumber <= totalPayments; paymentNumber++) {
                        let payment = {};
                        payment.paymentNumber = paymentNumber;
                        payment.date = _nextDate(amAttrs.adjustmentDate, amAttrs.paymentFrequency, paymentNumber);
                        payment.interest = periodicPayment;
                        payment.principal = 0;
                        payment.balance = amAttrs.loanAmount;
                        paymentList.push(payment);
                }

                return paymentList;

        };


        /**
         * @param {AmortizationAttributes} amAttrs Loan details.
         * @returns {Payment[]} An array of monthly payments for the given loan attributes.
         */
        var _getAmortizedPayments = function(amAttrs) {

                // Calculate regular payment amounts

                var balance = amAttrs.loanAmount;
                var monthlyPayment = getMonthlyPayment(amAttrs);
                var thePayment = amAttrs.regularPayment;

                if (Math.ceil((thePayment - monthlyPayment) * 100) * 100 <= 0) {
                        // The payment has to be at least as much as the calculated monthly payment
                        thePayment = monthlyPayment;
                }

                // var overpayment = thePayment - monthlyPayment;


                var paymentList = [];

                var j = _getPeriodRate(amAttrs.interestRate, amAttrs.compoundingPeriodsPerYear);

                for (paymentNumber = 1; paymentNumber <= amAttrs.termInMonths && balance > 0; paymentNumber++) {

                        var payment = {};

                        payment.paymentNumber = paymentNumber;
                        payment.date = _calcMonthsNoRollover(amAttrs.adjustmentDate, paymentNumber);
                        payment.interest = balance * j;
                        payment.principal = thePayment - payment.interest;
                        if (payment.principal > balance) {
                                payment.principal = balance;
                        }
                        balance = balance - payment.principal;
                        payment.balance = balance;

                        paymentList.push(payment);
                }

                return paymentList;

        };


        /**
         * Get period payment amount.
         * @param {AmortizationAttributes} amAttrs Loan details.
         * @returns {number} The expected payment for the period.
         */
        var getPeriodicPayment = function(amAttrs) {

                var periodicPayment = amAttrs.interestOnly ?
                        _getInterestOnlyPeriodicPayment(amAttrs) :
                        _getAmortizedPeriodicPayment(amAttrs);

                return _roundUp(periodicPayment, 2);
        };


        /**
         * Generate an ordered list of payments forming an amortization schedule.
         *
         * If the payment is greater than the regular calculated amortization payment,
         * then the monthly surplus is used as extra principal payment.
         *
         * If the payment is less than the regular monthly amortization payments,
         * then the supplied payment is ignored and a regular schedule is generated.
         *
         * @param {AmortizationAttributes} amAttrs Loan details.
         *
         * @returns An ordered list of payments which comprise the set of regular
         * payments fulfilling the terms of the given amortization parameters.
         */
        var getPayments = function(amAttrs) {
                return amAttrs.interestOnly ?
                        _getInterestOnlyPayments(amAttrs) :
                        _getAmortizedPayments(amAttrs);
        };


        // Public API

        return {
                getPeriodicPayment: getPeriodicPayment,
                getPayments: getPayments,
                getPerDiem: getPerDiem,
                timePeriod: timePeriod
        };


})();
