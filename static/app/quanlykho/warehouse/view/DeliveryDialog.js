define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');
    var template = require('text!app/quanlykho/view/warehouse/tpl/delivery-dialog.html');

    var Helper = require('app/common/Helper');

    return Gonrin.ModelDialogView.extend({
        template: template,
        modelSchema: [],

        render: function () {
            const self = this;
            self.applyBindings();
            // console.log("model", self.model.toJSON());   
            self.registerEvent();
        },


        registerEvent: function () {
            var self = this;
            self.$el.find("#product-title").html(`SẢN PHẨM: ${self.model.get("product_name")} - ${self.model.get("product_no")}`);


            self.$el.find("#out-pr").unbind("click").bind("click", function () {
                var quantityDelivery = self.$el.find("#quantity").val();
                var purchasePrice = self.$el.find("#price").val();

                var description = self.$el.find("#description").val();

                var product = clone(self.model.toJSON());
                // console.log(products.warehouse_id);

                if (!self.validate()) {
                    return;
                }

                var data = {
                    id: product.id,
                    warehouse: product.warehouse ? product.warehouse : null,
                    warehouse_id: product.warehouse_id ? product.warehouse_id : null,
                    amount: parseFloat(purchasePrice * quantityDelivery),
                    discount_amount: null,
                    discount_percent: null,
                    discount_unit: null,

                    price: purchasePrice,
                    quantity: parseFloat(quantityDelivery),
                    description: description,
                    product_name: product.product_name ? product.product_name : null,
                    product_no: product.product_no ? product.product_no : null,

                    currency_id: product.currency_id ? product.currency_id : null,
                    texes_id: product.texes_id ? product.texes_id : null,
                    unit_id: product.unit_id ? product.unit_id : null,
                    category_id: product.category_id ? product.category_id : null,

                    creator: self.getApp().currentUser.fullname ? self.getApp().currentUser.fullname : self.getApp().currentUser.email,
                    date_created: Helper.utcToUtcTimestamp(),
                    image: product.image
                }

                self.addInventoryDelivery(data);

                self.close();
            });
        },

        addInventoryDelivery: function (response) {
            var self = this;
            // console.log(response);
            // console.log(self.getApp().serviceURL + "api/v1/product/inventory_delivery");
            $.ajax({
                url: self.getApp().serviceURL + "/api/v1/product/inventory_delivery",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({
                    response
                }),

                success: function (data) {
                    // console.log("data", data)
                    if (data) {
                        toastr.info("Xuất sản phẩm thành công");
                        // self.getApp().getRouter().navigate("warehouse/inventory-delivery");
                        self.trigger("close");
                        self.close();
                    }
                },
                error: function (xhr, status, error) {
                    // self.$el.find("#quantity").text($.parseJSON(xhr.responseText).error_message);
                    if (xhr.status == 520) {
                        self.$el.find("#quantity").css({ "border": "red solid 0.5px" });
                    }
                }
            });
        },

        validate: function () {
            var self = this;

            if (!self.$el.find("#quantity").val()) {
                return;
            } else {
                self.$el.find("#quantity").css({ "border": "solid 0.5px #728ce7" });

            }
            if (!self.$el.find("#price").val()) {
                self.$el.find("#price").css({ "border": "red solid 1px" });
                return;
            } else {
                self.$el.find("#price").css({ "border": "solid 0.5px #728ce7" });
            }

            return true;
        }


    });
});