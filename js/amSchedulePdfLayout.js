function pdfScheduleDocDefFactory() {

    "use strict";

        function _loanDetails(amAttrs, dateFormatter, numberFormatter) {
                var loanDetails = [];
                loanDetails.push(['Loan amount:', numberFormatter(amAttrs.loanAmount)]);
                loanDetails.push(['Interest rate:', amAttrs.interestRate + ' %']);
                loanDetails.push(['Start date:', dateFormatter(amAttrs.startDate)]);
                loanDetails.push(['Payments per year:', amAttrs.paymentFrequency]);
                loanDetails.push(['Regular payment:', numberFormatter(amAttrs.preferredPayment)]);
                return loanDetails;
        }


        function _scheduleHeadings() {
                return [{
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
                ];
        }


        function _payment(lineItem, dateFormatter, numberFormatter) {
                let payment = [];
                payment.push({
                        text: lineItem.paymentNumber,
                        alignment: 'center'
                });
                payment.push(dateFormatter(lineItem.date));
                payment.push({
                        text: numberFormatter(lineItem.interest),
                        alignment: 'right'
                });
                payment.push({
                        text: numberFormatter(lineItem.principal),
                        alignment: 'right'
                });
                payment.push({
                        text: numberFormatter(lineItem.balance),
                        alignment: 'right'
                });
                return payment;
        }


        function _paymentlist(amAttrs, dateFormatter, numberFormatter) {

                var paymentList = [];

                paymentList.push(_scheduleHeadings());

                var schedule = a4.getPayments(amAttrs);

                for (let i = 0; i < schedule.length; i++) {
                        paymentList.push(_payment(schedule[i], dateFormatter, numberFormatter));
                }

                return paymentList;
        }


        return function(amAttrs, dateFormatter, numberFormatter) {

                var docDefinition = {
                        footer: function(currentPage, pageCount) {
                                return {
                                        text: currentPage.toString() + ' of ' + pageCount,
                                        alignment: 'center'
                                };
                        },
                        content: [{
                                        text: 'Amortization Schedule\n\n',
                                        fontSize: 15,
                                        bold: true
                                },
                                {
                                        table: {
                                                body: _loanDetails(amAttrs, dateFormatter, numberFormatter)
                                        }
                                },
                                {
                                        text: '\n\n'
                                },
                                {
                                        table: {
                                                headerRows: 1,
                                                body: _paymentlist(amAttrs, dateFormatter, numberFormatter)
                                        },
                                        layout: {
                                                fillColor: function(i, node) {
                                                        return (i > 1 && i % 2 === 0) ? '#f5f5f5' : null;
                                                },
                                                defaultBorder: false
                                        }
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

console.log(docDefinition);
                return docDefinition;
        };
}
