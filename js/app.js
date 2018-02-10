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
                    options.push({text: timePeriods[i].text, value: timePeriods[i].periodsPerYear});
                }
            }
            return options;
        };

        var _paymentFrequencyOptions = function() {
            var options = [];
            var timePeriods = a4.timePeriod();
            for (let i = 0; i < timePeriods.length; i++) {
                options.push({text: timePeriods[i].text, value: timePeriods[i].periodsPerYear});
            }
            return options;
        };



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
                        compoundingPeriodOptions: _compoundingPeriodOptions(),
                        paymentFrequencyOptions: _paymentFrequencyOptions(),
                        payments: []
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

                        _extractAmAttrs: function() {
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
                            return amAttrs;
                        },

                        generateSchedule: function() {
                            var amAttrs = this._extractAmAttrs();
                            this.payments = a4.getPayments(amAttrs);
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

                                var amAttrs = this._extractAmAttrs();

                                var periodicPayment = a4.getPeriodicPayment(amAttrs);

                                if (periodicPayment > this.preferredPayment) {
                                    this.preferredPayment = periodicPayment;
                                }

                                return "$ " + periodicPayment
                                                .toFixed(2)
                                                .replace(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g, "$1,")
                                                ;
                        }

                },


                filters: {

                    formatDate: function (dte) {
                        return moment(dte).format("YYYY-MM-DD");
                    },

                    formatMoney: function (amt) {
                        return amt.toFixed(2).replace(/(\d)(?=(\d{3})+(?:\.\d+)?$)/g, "$1,");
                    }

                }

        });


});
