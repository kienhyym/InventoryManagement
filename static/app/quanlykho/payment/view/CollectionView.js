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
			fields: [
				{
					field: "stt", label: "STT"
				},
				{
					field: "", label: "Mã phiếu chi", template: function (rowObject) {
						return `<div>${rowObject.payment_no}</div>`;
					}
				},
				{
					field: "", label: "Tên doanh nghiệp", template: function (rowObject) {
						if (rowObject.organization) {
							return `<div>${rowObject.organization.organization_name}</div>`;
						}else {
							return ``;
						}
					}
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
						var amount = new Number(rowObject.amount).toLocaleString("en-AU");
						return `<div class="text-left">${amount} VNĐ</div>`;
					}
				},
				{
					field: "status", label: "Trạng thái",template: function (rowObject) {
						if (rowObject.status == "slacking") {
							return `<span class="badge badge-warning">Thừa tiền</span>`;
						}
						if (rowObject.status == "success") {
							return `<span class="badge badge-primary">Vừa đủ</span>`;
						}  
						if (rowObject.status == "finish") {
							return `<span class="badge badge-success">Hoàn thành</span>`;
						}  
						if (rowObject.status == "wrong") {
							return `<span class="badge badge-danger">Thiếu tiền</span>`;
						} else {
							return ``;
						}
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