define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');

    var template = require('text!app/quanlykho/goods-reciept/tpl/payment-view.html');
    var Helpers = require('app/base/view/Helper');
	var TemplateHelper = require('app/base/view/TemplateHelper');
	var CustomFilterView = require('app/base/view/CustomFilterView');

    return Gonrin.DialogView.extend({
        template: template,
        modelSchema: {},

        render: function () {
            var self = this;
            self.applyBindings();
            self.registerEvent();
            self.$el.find("#amount").attr("data-value", self.viewData.amount);
            self.$el.find("#amount").val(TemplateHelper.currencyFormat(self.viewData.amount), true);
        },

        registerEvent: function () {
            var self = this;
            self.$el.find("#btn_close").unbind("click").bind("click", function () {
                self.close();
            });

            self.$el.find("#btm_comfim").unbind("click").bind("click", function () {

                var paymentNo = self.$el.find("#payment_no").val();
                var receiver = self.$el.find("#receiver").val();
                var address = self.$el.find("#receiver_address").val();
                var amount = self.$el.find("#amount").attr("data-value");
                var description = self.$el.find("#description").val();

                var payment = {
                    receiver: receiver,
                    address: address,
                    amount: amount,
                    description: description,
                    created_at: Helpers.utcToUtcTimestamp(),
                    created_by_name: self.getApp().currentUser.display_name ? self.getApp().currentUser.display_name : self.getApp().currentUser.email,
                    goodsreciept_id: self.viewData.id,
                    goodsreciept_no: self.viewData.goodsreciept_no,
                    payment_no: paymentNo
                }

                $.ajax({
                    url: self.getApp().serviceURL + "/api/v1/add-payment-voucher",
                    type: "POST",
                    data: JSON.stringify({
                        payment: payment
                    }),
                    success: function (response) {
                        // console.log(response);
                        if (response) {
                            toastr.info("Thanh toán thành công");
                            self.trigger("close", payment);
                            self.close();
                        }
                    },
                    error: function (xhr) {
                        // console.log(xhr);
                        toastr.error(xhr.responseJSON.error_message);
                    }
                });
            });
        }
    });
});
