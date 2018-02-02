// https://stackoverflow.com/questions/41112733/whats-the-proper-way-to-implement-formatting-on-v-model-in-vue-js-2-0

Vue.component('numeric-pair-input', {

        props: ["value"],

        template: `<input type="text" v-model="displayValue" @blur="isInputActive = false" @focus="isInputActive = true"/>`,

        data: function() {

                return {
                        isInputActive: false
                };

        },


        computed: {

                displayValue: {

                        get: function() {

                                var _getEditDisplay = function(years, months) {
                                        return years.toString() + ( 0 === months ? "" : " " + months.toString());
                                };

                                var _getFormattedDisplay = function(years, months) {
                                        return years.toString() + " years" +
                                            ( 0 === months ? "" : " and " + months.toString() + " months");
                                };

                                var years = parseInt(this.value / 12);
                                var months = parseInt(this.value - (years * 12));

                                return this.isInputActive ?
                                        _getEditDisplay(years, months) :
                                        _getFormattedDisplay(years, months);

                        },


                        set: function(modifiedValue) {

                                if ("" === modifiedValue) {
                                    termInMonths = 12;
                                    return;
                                }

                                var yearMonth = [0, 0];
                                var yearMonthIndex = 0;

                                var split = modifiedValue.split(/[ ,]+/);
                                for (let s of split) {
                                        var parsed = parseInt(s);
                                        if (!isNaN(parsed)) {
                                                yearMonth[yearMonthIndex++] = parsed;
                                        }
                                        if (yearMonthIndex > 2) {
                                                break;
                                        }
                                }

                                var termInMonths = yearMonth[0] * 12 + yearMonth[1];

                                this.$emit('input', termInMonths);

                        }

                }

        }


});
