var a4 = (function () {

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

    function timePeriod() {
        return {
            Weekly:       {periodsPerYear: 52, compoundingPeriod: false},
            BiWeekly:     {periodsPerYear: 26, compoundingPeriod: false},
            SemiMonthly:  {periodsPerYear: 24, compoundingPeriod: false},
            Monthly:      {periodsPerYear: 12, compoundingPeriod: true},
            BiMonthly:    {periodsPerYear:  6, compoundingPeriod: false},
            Quarterly:    {periodsPerYear:  4, compoundingPeriod: false},
            SemiAnnually: {periodsPerYear:  2, compoundingPeriod: true},
            Annually:     {periodsPerYear:  1, compoundingPeriod: true}
        };
    }

    // private static final long MONTHS_IN_A_YEAR = 12L;
    // private static final long WEEKS_IN_A_YEAR = 52L;
    //
    // public LocalDate getDateFrom(LocalDate fromDate, long periods) {
    //
    //     if (periodsPerYear <= MONTHS_IN_A_YEAR) {
    //         // Incrementing in multiples of months
    //         return fromDate.plusMonths(MONTHS_IN_A_YEAR / periodsPerYear * periods);
    //
    //     } else if (periodsPerYear == 24) { // SemiMonthly
    //         // Every second payment: add a month; the alternate payment 14 days after that
    //         return fromDate.plusMonths(periods / 2L).plusDays(14L * (periods % 2L));
    //     }
    //
    //     return fromDate.plusWeeks(WEEKS_IN_A_YEAR / periodsPerYear * periods);
    //
    // }

    /**
     * Add months to a date, handle edge end of month cases (i.e. Jan 30 offset 1 month => Feb 28)
     *
     * @param {dateString} dt In YYYY-MM-DD format
     * @param {int} monthOffset Number of months to add to the supplied date. Can by positive or negative.
     * @returns {Date} The supplied date offset by the supplied month offset.
     */
    var _calcMonthsNoRollover = function(dt, monthOffset) {

        var inDate = new Date(dt.substring(0, 4), dt.substring(5, 7) - 1, dt.substring(8,10));
        var outDate = new Date(inDate.getTime());
        outDate.setMonth(inDate.getMonth()+ monthOffset) ;
        if (outDate.getDate() < inDate.getDate()) {
            outDate.setDate(0);
        }
        return outDate;
    };



    /**
     * Retrieve the interest rate for the compounding period based on the annual interest rate.
     *
     * @param {number} annualInterestRatePercent input annual interest rate as a percent (ie 8.25 for 8.25%)
     * @param {int} compoundPeriodsPerYear 2 if compounding semi-annually, 12 if compounding monthly
     * @returns {number} interest rate as a decimal (ie .125 for 12.5%)
     */
    var _getPeriodRate = function (annualInterestRatePercent, compoundPeriodsPerYear, paymentsPerYear) {
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
    var _getInterestOnlyPeriodicPayment = function (amAttrs) {
        // percent to decimal, annual rate to period (monthly) rate
        return amAttrs.loanAmount * amAttrs.interestRate / 100.0 / amAttrs.paymentFrequency;
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

    var _getAmortizedPeriodicPayment = function (amAttrs) {

        if (amAttrs.amortizationPeriodMonths < 1) {
            return amAttrs.loanAmount;
        }
        if (amAttrs.interestRate <= 0) {
            return amAttrs.loanAmount / amAttrs.termInMonths;
        }

        var periodRate = _getPeriodRate(amAttrs.interestRate, amAttrs.compoundingPeriodsPerYear, amAttrs.paymentFrequency);
        var periods = amAttrs.paymentFrequency * amAttrs.amortizationPeriodMonths / 12;
        var x = Math.pow(periodRate + 1.0, periods);
        var periodPayment = (amAttrs.loanAmount * periodRate * x) / (x - 1) ;

        return periodPayment;
    };


    /**
     * Get interest only payments.
     * @param {AmortizationAttributes} amAttrs Loan details.
     * @returns {Payment[]} An array of monthly payments for the given loan attributes.
    */
    var _getInterestOnlyPayments = function(amAttrs) {

        var monthlyPayment = getMonthlyPayment(amAttrs);
        var paymentList = [];

        for (paymentNumber = 1; paymentNumber <= amAttrs.termInMonths; paymentNumber++) {
            var payment = {};
            payment.paymentNumber = paymentNumber;
            payment.date = _calcMonthsNoRollover(amAttrs.adjustmentDate, paymentNumber);
            payment.interest = monthlyPayment;
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

        if ( Math.ceil((thePayment - monthlyPayment) * 100) * 100 <= 0 ) {
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
    var getPeriodicPayment = function (amAttrs) {

        var periodicPayment = amAttrs.interestOnly ?
            _getInterestOnlyPeriodicPayment(amAttrs) :
            _getAmortizedPeriodicPayment(amAttrs)
            ;

        return Math.ceil(periodicPayment * 100) / 100;
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
    var getPayments = function (amAttrs) {
        return amAttrs.interestOnly ?
                _getInterestOnlyPayments(amAttrs) :
                _getAmortizedPayments(amAttrs);
    };


  // Public API

  return {
    getPeriodicPayment: getPeriodicPayment,
    getPayments: getPayments,
    timePeriod: timePeriod
  };

})();
