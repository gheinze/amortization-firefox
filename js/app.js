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


        var data = function() {

                return {
                        loanAmount: 10000,
                        interestRate: 10,
                        interestOnly: true,
                        amortizationPeriodMonths: 240,
                        compoundingPeriodsPerYear: 2,
                        paymentFrequency: 12,
                        startDate: today,
                        adjustmentDate: _calculateAdjustmentDate(today),
                        termInMonths: 12,
                        preferredPayment: 0,

                        compoundingPeriodOptions: [{
                                        text: 'monthly',
                                        value: '12'
                                },
                                {
                                        text: 'semi-annually',
                                        value: '2'
                                },
                                {
                                        text: 'annually',
                                        value: '1'
                                }
                        ],

                        paymentFrequencyOptions: [{
                                        text: 'weekly',
                                        value: '52'
                                },
                                {
                                        text: 'bi-weekly',
                                        value: '26'
                                },
                                {
                                        text: 'semi-monthly',
                                        value: '24'
                                },
                                {
                                        text: 'monthly',
                                        value: '12'
                                },
                                {
                                        text: 'bi-monthly',
                                        value: '6'
                                },
                                {
                                        text: 'quarterly',
                                        value: '4'
                                },
                                {
                                        text: 'semi-annually',
                                        value: '2'
                                },
                                {
                                        text: 'annually',
                                        value: '1'
                                }
                        ]

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


                        regularPayment: function() {
                                var amAttrs = {
                                        loanAmount: this.loanAmount,
                                        interestRate: this.interestRate,
                                        interestOnly: this.interestOnly,
                                        amortizationPeriodMonths: this.amortizationPeriodMonths,
                                        termInMonths: this.termInMonths,
                                        compoundingPeriodsPerYear: this.compoundingPeriodsPerYear,
                                        paymentFrequency: this.paymentFrequency,
                                        startDate: this.startDate,
                                        adjustmentDate: this.adjustmentDate
                                };

                                var periodicPayment = a4.getPeriodicPayment(amAttrs);

                                if (periodicPayment > this.preferredPayment) {
                                    this.preferredPayment = periodicPayment;
                                }

                                return "$ " + periodicPayment
                                                .toFixed(2)
                                                .replace(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g, "$1,")
                                                ;
                        }

                }

        });


});
