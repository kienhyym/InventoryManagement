define(function (require) {
	"use strict";
	var $ = require('jquery'),
		_ = require('underscore'),
		Gonrin = require('gonrin');

	var itemTemplate = require('text!app/quanlykho/goods-reciept/tpl/item-view.html'),
		itemSchema = require('json!schema/GoodsRecieptDetailsSchema.json');

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
		collectionName: "collectionName",
		foreignRemoteField: "id",
		foreignField: "goodsreciept_id",

		refresh: true,
		uiControl: {
			fields: [

				{
					field: "net_amount",
					uicontrol: "currency",
					currency: currencyFormat,
					cssClass: "text-right"
				},
				{
					field: "discount_amount",
					uicontrol: "currency",
					currency: currencyFormat,
					cssClass: "text-right"
				},
				{
					field: "tax_amount",
					uicontrol: "currency",
					currency: currencyFormat,
					cssClass: "text-right"
				},
				{
					field: "purchase_cost",
					uicontrol: "currency",
					currency: currencyFormat,
					cssClass: "text-right"
				},
			]
		},
		render: function () {
			var self = this;
			self.applyBindings();
			self.registerEvent();
			self.caculateAmount();

			self.model.on("change:quantity", function () {
				if (!self.model.get("quantity")) {
					self.model.set("quantity", 1);
				} else {
					self.caculateAmount();
				}
			});

			self.model.on("change:purchase_cost", function () {
				var netAmount = self.model.get("purchase_cost") * self.model.get("quantity");
				self.model.set("net_amount", netAmount);
			});
		},
		caculateAmount: function () {
			var self = this;
			var netAmount = self.model.get("purchase_cost") * self.model.get("quantity");
			self.model.set("net_amount", netAmount);
		},

		registerEvent: function () {
			var self = this;
			var image = self.model.get("item_image") ? self.model.get("item_image") : "static/images/default-dist.jpeg"
			// self.$el.find("#image-space").css({ "background-image": "url(" + image + ")" });
			self.$el.find("#image_item").attr("src", image);
			self.$el.find("#itemRemove").unbind("click").bind("click", function () {
				self.remove(true);
				self.trigger("onRemove", self.model.toJSON());
			});

			if (self.model.get("item_type") == "material") {
				self.$el.find("#item_type").html(`Nguyên liệu`);
			} else if (self.model.get("item_type") == "raw_material") {
				self.$el.find("#item_type").html(`Nguyên liệu thô`);
			} else if (self.model.get("item_type") == "package") {
				self.$el.find("#item_type").html(`Combo`);
			} else if (self.model.get("item_type") == "service") {
				self.$el.find("#item_type").html(`Dịch vụ`);
			} else if (self.model.get("item_type") == "product") {
				self.$el.find("#item_type").html(`Là sản phẩm`);
			}
		}
	});

});
