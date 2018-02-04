QUnit.test( "A4 amortizaton calculator: payment amount rounds up", function( assert ) {

    var amAttrs = {
        loanAmount: 10000,
        regularPayment: 0,
        startDate: '2018-01-01',
        adjustmentDate: '2018-01-01',
        termInMonths: 12,
        interestOnly: true,
        amortizationPeriodMonths: 240,
        compoundingPeriodsPerYear: 2,
        paymentFrequency: 12,
        interestRate: 10
    };

    amAttrs.interestOnly = true;
    var monthlyPayment = a4.getPeriodicPayment(amAttrs);
    assert.equal( monthlyPayment, 83.34, "Interest-only monthly payment: any fractional amount should round up (ceiling)." );

    amAttrs.interestOnly = false;
    monthlyPayment = a4.getPeriodicPayment(amAttrs);
    assert.equal( monthlyPayment, 95.17, "Amortized monthly payment: any fractional amount should round up (ceiling)." );

});


QUnit.test( "A4 amortizaton calculator: interest only regular payment", function( assert ) {

    var amAttrs = {
        loanAmount: 10000,
        interestOnly: true,
        paymentFrequency: 12,
        interestRate: 10
    };

    var expectedAnnualInterest = amAttrs.loanAmount * amAttrs.interestRate / 100;

    for (let paymentFrequency of [52, 26, 24, 12, 6, 4, 2, 1]) {
        amAttrs.paymentFrequency = paymentFrequency;
        let regularPayment = a4.getPeriodicPayment(amAttrs);
        let result = ((paymentFrequency * regularPayment) >= expectedAnnualInterest) &&
                     ((paymentFrequency * (regularPayment - 1)) < expectedAnnualInterest);
        assert.ok(result , "Interest only payment for " + paymentFrequency + " times a year.");
    }

});


QUnit.test( "A4 amortizaton calculator: amortized regular payment (compounding semi-anually)", function( assert ) {

    var amAttrs = {
        loanAmount: 10000,
        regularPayment: 0,
        startDate: '2018-01-01',
        adjustmentDate: '2018-01-01',
        termInMonths: 12,
        interestOnly: false,
        amortizationPeriodMonths: 240,
        compoundingPeriodsPerYear: 2,
        paymentFrequency: 12,
        interestRate: 10
    };

    let frequencies = [52, 26, 24, 12, 6, 4, 2, 1];
    let expectedPayments = [21.90, 43.83, 47.49, 95.17, 191.11, 287.84, 582.79, 1194.71];

    for (let i = 0; i < frequencies.length; i++) {
        amAttrs.paymentFrequency = frequencies[i];
        var regularPayment = a4.getPeriodicPayment(amAttrs);
        assert.equal(regularPayment, expectedPayments[i], "Amortized payment for " + frequencies[i] + " times a year.");
    }

});


QUnit.test( "A4 amortizaton calculator: amortized regular payment (amortization periods)", function( assert ) {

    var amAttrs = {
        loanAmount: 10000,
        regularPayment: 0,
        startDate: '2018-01-01',
        adjustmentDate: '2018-01-01',
        termInMonths: 12,
        interestOnly: false,
        amortizationPeriodMonths: 240,
        compoundingPeriodsPerYear: 2,
        paymentFrequency: 12,
        interestRate: 10
    };

    let compoundingPeriodsPerYear = [12, 2, 1];
    let expectedPayments = [96.51, 95.17, 93.67];

    for (let i = 0; i < compoundingPeriodsPerYear.length; i++) {
        amAttrs.compoundingPeriodsPerYear = compoundingPeriodsPerYear[i];
        var regularPayment = a4.getPeriodicPayment(amAttrs);
        assert.equal(regularPayment, expectedPayments[i], "Amortized payment with " + compoundingPeriodsPerYear[i] + " compounding periods.");
    }

});
