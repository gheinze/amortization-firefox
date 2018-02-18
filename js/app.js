var app = {};


$(document).ready(function() {

        "use strict";

        var _calculateAdjustmentDate = function(date) {
                var year = date.getFullYear();
                var month = date.getMonth();
                var dayOfMonth = date.getDate();

                if (dayOfMonth > 15) {
                        month = month + 1;
                        dayOfMonth = 1;
                } else if (dayOfMonth > 1 && dayOfMonth < 15) {
                        dayOfMonth = 15;
                }

                return new Date(year, month, dayOfMonth);
        };


        var today = new Date();

        var _compoundingPeriodOptions = function() {
                var options = [];
                var timePeriods = a4.timePeriod();
                for (let i = 0; i < timePeriods.length; i++) {
                        if (timePeriods[i].compoundingPeriod) {
                                options.push({
                                        text: timePeriods[i].text,
                                        value: timePeriods[i].periodsPerYear
                                });
                        }
                }
                return options;
        };

        var _paymentFrequencyOptions = function() {
                var options = [];
                var timePeriods = a4.timePeriod();
                for (let i = 0; i < timePeriods.length; i++) {
                        options.push({
                                text: timePeriods[i].text,
                                value: timePeriods[i].periodsPerYear
                        });
                }
                return options;
        };



        var data = function() {

                return {
                        loanAmount: 10000,
                        interestRate: 10,
                        interestOnly: true,
                        amYears: 20,
                        amMonths: 0,
                        compoundingPeriodsPerYear: 2,
                        paymentFrequency: 12,
                        startDate: today,
                        adjustmentDate: _calculateAdjustmentDate(today),
                        termYears: 1,
                        termMonths: 0,
                        preferredPayment: 0,
                        compoundingPeriodOptions: _compoundingPeriodOptions(),
                        paymentFrequencyOptions: _paymentFrequencyOptions(),
                        payments: [],

                        message: {
                                amortized: "Amortized payments will blend interest and principal amounts so that the full loan amount is paid back by the end of the amortization period.",
                                startDate: "Interest charges commence from the date funds are forwarded.",
                                adjustmentDate: "It may be desirable to start payments on a fixed date (such as the 1st of the month) rather than on the start date. In this case, an adjustment interest-only charge (Payment 0) covers the days between the start date and the adjustment date.",
                                term: "Show scheduled payments only for the period of time selected.",
                                preferredPayment: "Typically the same as the calculated regular payment. However, you can choose to pay more than the regular payment with the extra amount applied to the principal."
                        }
                };

        };


        app = new Vue({

                el: '#app',

                data: data,

                methods: {

                        updateStartDate: function(date) {
                                this.startDate = date;
                        },

                        updateAdjustmentDate: function(date) {
                                this.adjustmentDate = date;
                        },

                        updateTermYears: function(years) {
                                this.termYears = years;
                        },

                        updateTermMonths: function(months) {
                                this.termMonths = months;
                        },

                        updateAmYears: function(years) {
                                this.amYears = years;
                        },

                        updateAmMonths: function(months) {
                                this.amMonths = months;
                        },

                        removeSchedule: function() {
                                this.payments = [];
                        },

                        _extractNonPreferredPaymentAtts: function() {
                                var amAttrs = {
                                        loanAmount: this.loanAmount,
                                        interestRate: this.interestRate,
                                        interestOnly: this.interestOnly,
                                        amortizationPeriodMonths: this.amortizationPeriodMonths,
                                        termInMonths: this.termInMonths,
                                        compoundingPeriodsPerYear: this.compoundingPeriodsPerYear,
                                        paymentFrequency: this.paymentFrequency,
                                        startDate: this.startDate.setHours(0, 0, 0, 0),
                                        adjustmentDate: this.adjustmentDate.setHours(0, 0, 0, 0)
                                };
                                return amAttrs;
                        },

                        _extractAmAttrs: function() {
                                var amAttrs = this._extractNonPreferredPaymentAtts();
                                amAttrs.preferredPayment = this.preferredPayment;
                                return amAttrs;
                        },

                        generateSchedule: function() {
                                var amAttrs = this._extractAmAttrs();
                                this.payments = a4.getPayments(amAttrs);
                        },

                        generatePdfSchedule: function() {

                                var amAttrs = this._extractAmAttrs();

                                var headerInfo = [];
                                headerInfo.push(['Loan amount:', this.$options.filters.formatMoney(amAttrs.loanAmount)]);
                                headerInfo.push(['Interest rate:', amAttrs.interestRate + ' %']);
                                headerInfo.push(['Start date:', this.$options.filters.formatDate(amAttrs.startDate)]);
                                headerInfo.push(['Payments per year:', amAttrs.paymentFrequency]);
                                headerInfo.push(['Regular payment:', this.$options.filters.formatMoney(amAttrs.preferredPayment)]);


                                var schedule = a4.getPayments(amAttrs);
                                this.payments = schedule;
                                var paymentList = [];
                                paymentList.push([{
                                                text: 'Payment',
                                                alignment: 'center',
                                                style: 'header'
                                        },
                                        {
                                                text: 'Date',
                                                alignment: 'center',
                                                style: 'header'
                                        },
                                        {
                                                text: 'Interest',
                                                alignment: 'right',
                                                style: 'header'
                                        },
                                        {
                                                text: 'Principal',
                                                alignment: 'right',
                                                style: 'header'
                                        },
                                        {
                                                text: 'Balance',
                                                alignment: 'right',
                                                style: 'header'
                                        }
                                ]);
                                for (let i = 0; i < schedule.length; i++) {
                                        let payment = [];
                                        payment.push({ text: schedule[i].paymentNumber, alignment: 'center' });
                                        payment.push(this.$options.filters.formatDate(schedule[i].date));
                                        payment.push({
                                                text: this.$options.filters.formatMoney(schedule[i].interest),
                                                alignment: 'right'
                                        });
                                        payment.push({
                                                text: this.$options.filters.formatMoney(schedule[i].principal),
                                                alignment: 'right'
                                        });
                                        payment.push({
                                                text: this.$options.filters.formatMoney(schedule[i].balance),
                                                alignment: 'right'
                                        });
                                        paymentList.push(payment);
                                }


                                var docDefinition = {
                                        footer: function(currentPage, pageCount) { return {text: currentPage.toString() + ' of ' + pageCount, alignment: 'center'}; },
                                        content: [{
                                                        text: 'Amortization Schedule\n\n',
                                                        fontSize: 15,
                                                        bold: true
                                                },
                                                {
                                                        table: {
                                                                body: headerInfo
                                                        }
                                                },
                                                {
                                                        text: '\n\n'
                                                },
                                                {
                                                        table: {
                                                                headerRows: 1,
                                                                body: paymentList
                                                        },
                                                        layout: 'noBorders'
                                                }
                                        ],
                                        styles: {
                                                header: {
                                                        fontSize: 10,
                                                        bold: true,
                                                        margin: [0, 0, 0, 10]
                                                }
                                        },
                                        defaultStyle: {
                                            fontSize: 10
                                        }
                                };
                                //                                                                 ['Payment', 'Date', 'Interest', 'Principal', 'Balance']

                                pdfMake.createPdf(docDefinition).open(); //download('amortizationPdfExample.pdf');
                                //this.payments = a4.getPayments(amAttrs);
                        }

                },

                computed: {

                        uiDate: {

                                get: function() {
                                        return _calculateAdjustmentDate(this.startDate);
                                },

                                set: function(adjustedDate) {
                                        this.adustmentDate = adjustedDate;
                                }

                        },


                        amortized: {
                                get: function() {
                                        return !this.interestOnly;
                                },
                                set: function(newValue) {
                                        this.interestOnly = !newValue;
                                }
                        },


                        termInMonths: function() {
                                return this.termYears * 12 + this.termMonths;
                        },

                        amortizationPeriodMonths: function() {
                                return this.amYears * 12 + this.amMonths;
                        },

                        regularPayment: function() {

                                var amAttrs = this._extractNonPreferredPaymentAtts();
                                var periodicPayment = a4.getPeriodicPayment(amAttrs);
                                this.preferredPayment = periodicPayment;
                                this.removeSchedule();

                                return "$ " + periodicPayment
                                        .toFixed(2)
                                        .replace(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g, "$1,");
                        }

                },


                filters: {

                        formatDate: function(dte) {
                                return moment(dte).format("YYYY-MM-DD");
                        },

                        formatMoney: function(amt) {
                                return amt.toFixed(2).replace(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g, "$1,");
                        }

                },

                watch: {
                        preferredPayment: function() {
                                this.removeSchedule();
                        }
                }

        });


});
