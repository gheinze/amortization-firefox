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
