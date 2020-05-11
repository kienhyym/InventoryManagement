define(function (require) {
	"use strict";
	var $ = require('jquery'),
		_ = require('underscore'),
		Gonrin = require('gonrin');

	var template = require('text!app/quanlykho/payment/tpl/collection.html'),
		schema = require('json!schema/PaymentSchema.json');

	var Helpers = require('app/base/view/Helper');
	var CustomFilterView = require('app/base/view/CustomFilterView');
	var TemplateHelper = require('app/base/view/TemplateHelper');

	return Gonrin.CollectionView.extend({
		template: template,
		modelSchema: schema,
		urlPrefix: "/api/v1/",
		collectionName: "payment",
		tools: [{
            name: "defaultgr",
            type: "group",
            groupClass: "toolbar-group",
            buttons: [{
                name: "create",
                type: "button",
                buttonClass: "btn btn-primary font-weight-bold btn-sm",
                label: "<i class='icon-plus'></i>TẠO PHIẾU",
                command: function() {
                    var self = this;
                    this.getApp().getRouter().navigate("#payment/model");
                }
            }, ]
        }],
		uiControl: {
			orderBy: [
				{ field: "id", direction: "desc" },
				{ field: "payment_no", direction: "desc" },
				{ field: "goodsreciept_no", direction: "desc" },
			],
			fields: [
				{
					field: "", label: "Mã phiếu chi", template: function (rowObject) {
						return `<div>${rowObject.payment_no}</div>`;
					}
				},
				// {
				// 	field: "", label: "Mã phiếu nhập", template: function (rowObject) {
				// 		return `<div>${rowObject.goodsreciept_no}</div>`;
				// 	}
				// },
				{
					field: "receiver_address", label: "Địa chỉ"
				},

				{
					field: "", label: "Thời gian", template: function (rowObject) {
						if (rowObject.created_at) {
							return `<div style="min-width: 100px;">${Helpers.utcToLocal(rowObject.created_at * 1000, "DD/MM/YYYY HH:mm")}</div>`;
						} else {
							return ``;
						}
					}
				},
				{
					field: "", label: "Tổng tiền", template: function (rowObject) {
						return `<div class="text-center">${TemplateHelper.currencyFormat(rowObject.amount, true)}</div>`;
					}
				},
			],
			onRowClick: function (event) {
				if (event.rowId) {
					var path = this.collectionName + '/model?id=' + event.rowId;
					this.getApp().getRouter().navigate(path);
				}
			}
		},

		render: function () {
			var self = this;
			$("#project-btn").empty();
			$("#project-search").empty();

			var filter = new CustomFilterView({
				el: self.$el.find("#filter"),
				sessionKey: "payment_filter"
			});
			filter.render();

			if (!filter.isEmptyFilter()) {
				var text = !!filter.model.get("text") ? filter.model.get("text").trim() : "";
				var filters = {
					"$or": [
						{ "goodsreciept_no": { "$like": text } },
						{ "payment_no": { "$like": text } },
					]
				};
				self.uiControl.filters = filters;
			}
			self.applyBindings();

			filter.on('filterChanged', function (evt) {
				var $col = self.getCollectionElement();
				var text = !!evt.data.text ? evt.data.text.trim() : "";
				if ($col) {
					if (text !== null) {
						var filters = {
							"$or": [
								{ "goodsreciept_no": { "$like": text } },
								{ "payment_no": { "$like": text } },
							]
						};
						$col.data('gonrin').filter(filters);
						//self.uiControl.filters = filters;
					} else {
						self.uiControl.filters = null;
					}
				}
				self.applyBindings();
			});
		},
	});

});