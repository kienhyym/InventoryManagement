define(function (require) {
	"use strict";
	var $ = require('jquery'),
		_ = require('underscore'),
		Gonrin = require('gonrin');

	var template = require('text!app/move-warehouse/tpl/collection.html'),
		schema = require('json!schema/MoveWarehouseSchema.json');

	var TemplateHelper = require('app/base/view/TemplateHelper');
	var Helpers = require("app/base/view/Helper");
	var CustomFilterView = require('app/base/view/CustomFilterView');

	return Gonrin.CollectionView.extend({
		template: template,
		modelSchema: schema,
		urlPrefix: "/api/v1/",
		collectionName: "movewarehouse",

		tools: [
			{
				name: "defaultgr",
				type: "group",
				groupClass: "toolbar-group",
				buttons: [
					{
						name: "create",
						type: "button",
						buttonClass: "btn btn-primary font-weight-bold",
						label: "<i class='icon-plus'></i>TẠO PHIẾU",
						command: function () {
							var self = this;
							this.getApp().getRouter().navigate("#movewarehouse/model");
						}
					},
				]
			}],
		uiControl: {
			// orderBy: [
			// 	{ field: "id", direction: "desc" },
			// 	{ field: "payment_no", direction: "desc"},
			// 	{ field: "goodsreciept_no", direction: "desc" },
			// 	{ field: "discount_amount", direction: "desc" }
			// ],
			fields: [
				{
					field: "", label: "Mã phiếu", template: function (e) {
						return `<div>${e.movewarehouse_no}</div>`;
					}
				},
				{
					field: "", label: "Từ kho -> Đến kho", template: function (e) {
						return `<div>${e.goodsreciept_from} -> ${e.goodsreciept_to}</div>`;
					}
				},
				{
					field: "", label: "SL hàng", template: function (e) {
						var quantity = 0;
						e.details.forEach(item => {
							quantity += item.quantity_delivery;
						});
						return `<div>${quantity}</div>`;
					}
				},

				{
					field: "", label: "Trạng thái", template: function (e) {
						if (e.status === "initialization") {
							return `<label class="badge badge-danger">Khởi tạo</label>`;
						} else if (e.status === "translation") {
							return `<label class="badge badge-warning">Đang chuyển </label>`;
						} else {
							return `<label class="badge badge-info">Hoàn thành </label>`;
						}

					}
				},
				{
					field: "", label: "Ngày chuyển", template: function (rowObject) {
						if (rowObject.delivery_date) {
							return `<div style="min-width: 100px;">${Helpers.utcToLocal(rowObject.delivery_date, "DD/MM/YYYY HH:mm")}</div>`;
						} else {
							return ``;
						}
					}
				},
				{
					field: "", label: "Ngày nhận", template: function (rowObject) {
						if (rowObject.received_date) {
							return `<div style="min-width: 100px;">${Helpers.utcToLocal(rowObject.received_date, "DD/MM/YYYY HH:mm")}</div>`;
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

			self.registerEvent();
			
			function capitalizeFirstLetter(string) {
				return string.charAt(0).toUpperCase() + string.slice(1);
			}
			var filter = new CustomFilterView({
				el: $("#filter"),
				sessionKey: "category_filter"
			});
			filter.render();

			if (!filter.isEmptyFilter()) {
				var text = !!filter.model.get("text") ? filter.model.get("text").trim() : "";
				var textUpper = !!filter.model.get("text") ? filter.model.get("text").trim().toUpperCase() : "";
				var textLower = !!filter.model.get("text") ? filter.model.get("text").trim().toLowerCase() : "";
				var textFirst = !!filter.model.get("text") ? capitalizeFirstLetter(filter.model.get("text").trim()) : "";
				var filters = {
					"$or": [
						{ "movewarehouse_no": { "$like": text } },
					]
				};
				self.uiControl.filters = filters;
			}
			self.applyBindings();

			filter.on('filterChanged', function (evt) {
				var $col = self.getCollectionElement();
				var text = !!filter.model.get("text") ? filter.model.get("text").trim() : "";
				var textUpper = !!filter.model.get("text") ? filter.model.get("text").trim().toUpperCase() : "";
				var textLower = !!filter.model.get("text") ? filter.model.get("text").trim().toLowerCase() : "";
				var textFirst = !!filter.model.get("text") ? capitalizeFirstLetter(filter.model.get("text").trim()) : "";
				if ($col) {
					if (text !== null) {
						var filters = {
							"$or": [
								{ "movewarehouse_no": { "$like": text } },
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
			return this;
		},
		
		registerEvent: function () {
			var self = this;
			var currentURL = window.location.href;
			if (self.getApp().isMobile == "ANDROID") {
				$("#project-search-windows").html(``);

				// $("#project-btn").html(`<button type="button" class="btn btn-primary font-weight-bold create-new">+ Xuất hàng</button>`)
				// $(".create-new").on("click", function () {
				// 	self.getApp().getRouter().navigate("#movewarehouse/model");
				// });
				$("#project-search-mobile").html(`
					<li class="nav-item nav-search d-lg-block">
					<div class="col-md-12 col-sm-12 col-xs-12 col-12" id="filter"></div>
				</li>`);

			} else if (self.getApp().isMobile == "WINDOWS") {
				$("#project-search-mobile").html(``);

				$("#project-search-windows").html(`
					<li class="nav-item nav-search d-lg-block">
					<div class="col-md-12 col-sm-12 col-xs-12 col-12" id="filter"></div>
				</li>`);
			}
		},

	});

});