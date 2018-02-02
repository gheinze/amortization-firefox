// https://vuejsdevelopers.com/2017/05/20/vue-js-safely-jquery-plugin/

    Vue.component('date-picker', {

            props: ['dateFormat', 'componentDate'],

            template: '<input/>',

            mounted: function() {

                    var self = this;

                    var _convertDateStringToDate = function(dateString) {
                            // TODO: respect date format
                            var dateParts = dateString.split("-");
                            var year = dateParts[0];
                            var month = dateParts[1];
                            var dayOfMonth = dateParts[2];
                            return new Date(year, month - 1, dayOfMonth);
                    };


                    $(this.$el).datepicker({

                            dateFormat: this.dateFormat,

                            onSelect: function(date) {
                                    self.$emit('update-date', _convertDateStringToDate(date));
                            },

                            onClose: function(date) {
                                    self.$emit('update-date', _convertDateStringToDate(date));
                            }

                    });

                    $(this.$el).datepicker('setDate', this.componentDate);

            },

            watch: {
                    componentDate: function(newValue, oldValue) {
                            $(this.$el).datepicker('setDate', this.componentDate);
                    }
            },

            beforeDestroy: function() {
                    $(this.$el).datepicker('hide').datepicker('destroy');
            }

    });
