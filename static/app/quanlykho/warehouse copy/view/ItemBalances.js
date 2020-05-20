define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');

    var itemTemplate = require('text!app/quanlykho/view/warehouse/tpl/item-balances.html'),
        itemSchema = require('json!schema/ItemBalancesSchema.json');

    var currencyFormat = {
        symbol: "VNĐ",		// default currency symbol is '$'
        format: "%v %s",	// controls output: %s = symbol, %v = value (can be object, see docs)
        decimal: ",",		// decimal point separator
        thousand: ".",		// thousands separator
        precision: 0,		// decimal places
        grouping: 3		// digit grouping (not implemented yet)
    };



    return Gonrin.ItemView.extend({
        template: itemTemplate,
        tagName: 'tr',
        modelSchema: itemSchema,
        urlPrefix: "/api/v1/",
        collectionName: "itembalances",
        foreignRemoteField: "id",
        foreignField: "warehouse_id",

        uiControl: {
            fields: [
                {
                    field: "purchase_cost",
                    uicontrol: "currency",
                    currency: currencyFormat,
                    cssClass: "text-right"
                },
                {
                    field: "list_price",
                    uicontrol: "currency",
                    currency: currencyFormat,
                    cssClass: "text-right"
                },
                {
                    field: "net_amount",
                    uicontrol: "currency",
                    currency: currencyFormat,
                    cssClass: "text-right"
                },
            ]
        },
        render: function () {
            var self = this;
            self.applyBindings();

            var image = self.model.get("item_image") ? self.model.get("item_image") : "static/images/default-dist.jpeg"
            self.$el.find("#image_item").attr("src", image);

            if (self.model.get("item_type") == "is_material") {
                self.$el.find("#item_type").html(`Nguyên liệu`);
            } else if (self.model.get("item_type") == "is_raw_material") {
                self.$el.find("#item_type").html(`Nguyên liệu thô`);
            } else if (self.model.get("item_type") == "is_package") {
                self.$el.find("#item_type").html(`Combo`);
            } else if (self.model.get("item_type") == "is_service") {
                self.$el.find("#item_type").html(`Dịch vụ`);
            }

            // self.$el.find("#itemRemove").unbind("click").bind("click", function () {
            //     self.remove(true);
            //     self.trigger("onRemove", self.model.toJSON());
            // });
        },
    });
});
