// https://vuejsdevelopers.com/2017/05/20/vue-js-safely-jquery-plugin/

    Vue.component('spinner', {

            props: ['min', 'max', 'val'],

            template: '<input/>',

            mounted: function() {

                    var self = this;

                    $(this.$el).spinner({

                            min: this.min,
                            max: this.max,

                            spin: function(event, ui) {
                                self.$emit('update-val', ui.value);
                            }

                    });

                    $(this.$el).spinner('value', this.val);

            },

            watch: {
                    x: function(newValue, oldValue) {
                        console.log(oldValue + " " + newValue);
//                            $(this.$el).datepicker('setDate', this.componentDate);
                    }
            },

            beforeDestroy: function() {
                    $(this.$el).spinner('hide').spinner('destroy');
            }

    });
