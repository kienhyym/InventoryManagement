define(function (require) {
	"use strict";
	var $ = require('jquery'),
		_ = require('underscore'),
		Gonrin = require('gonrin');

	var template = require('text!app/quanlykho/payment/tpl/model.html'),
		schema = require('json!schema/PaymentSchema.json');

	var Helpers = require('app/base/view/Helper');


	var currencyFormat = {
		symbol: "VNĐ",		// default currency symbol is '$'
		format: "%v %s",	// controls output: %s = symbol, %v = value (can be object, see docs)
		decimal: ",",		// decimal point separator
		thousand: ".",		// thousands separator
		precision: 0,		// decimal places
		grouping: 3		// digit grouping (not implemented yet)
	};


	return Gonrin.ModelDialogView.extend({
		template: template,
		modelSchema: schema,
		urlPrefix: "/api/v1/",
		collectionName: "payment",

		tools: [
			{
				name: "defaultgr",
				type: "group",
				groupClass: "toolbar-group",
				buttons: [
					{
						name: "back",
						type: "button",
						buttonClass: "btn-light btn btn-sm",
						label: "TRANSLATE:BACK",
						command: function () {
							var self = this;

							Backbone.history.history.back();
						}
					},
					{
						name: "save",
						type: "button",
						buttonClass: "btn-primary btn btn-sm",
						label: "TRANSLATE:SAVE",
						command: function () {
							var self = this;
							var id = this.getApp().getRouter().getParam("id");
							var method = "update";
							if (!id) {
								var method = "create";
								self.model.set("created_at", Helpers.utcToUtcTimestamp());
								var tenant_id = self.getApp().currentTenant[0];
								self.model.set("tenant_id", tenant_id);
								var payNo = Helpers.makeNoGoods(6, "TT0").toUpperCase();
								self.model.set("payment_no", payNo);
							}

							self.model.sync(method, self.model, {
								success: function (model, respose, options) {
									toastr.info("Lưu thông tin thành công");
									self.getApp().getRouter().navigate(self.collectionName + "/collection");
								},
								error: function (model, xhr, options) {
									toastr.error('Lưu thông tin không thành công!');

								}
							});
						}
					},
					{
						name: "delete",
						type: "button",
						buttonClass: "btn-danger btn btn-sm",
						label: "TRANSLATE:DELETE",
						visible: function () {
							return this.getApp().getRouter().getParam("id") !== null;
						},
						command: function () {
							var self = this;
							self.model.destroy({
								success: function (model, response) {
									toastr.info('Xoá dữ liệu thành công');
									self.getApp().getRouter().navigate(self.collectionName + "/collection");
								},
								error: function (model, xhr, options) {
									toastr.error('Xoá dữ liệu không thành công!');

								}
							});
						}
					},
				],
			}],

		uiControl: {
			fields: [{
				field: "amount",
				uicontrol: "currency",
				currency: currencyFormat,
				cssClass: "text-right"
			},
			{
				field: "type",
				uicontrol: "combobox",
				textField: "text",
				valueField: "value",
				dataSource: [
					{ "value": "goodsreciept", "text": "Phiếu nhập hàng" },
					{ "value": "purchaseorder", "text": "Phiếu xuất hàng" }
				],
			},
			]
		},

		render: function () {
			var self = this;
			var id = this.getApp().getRouter().getParam("id");
			if (id) {
				this.model.set('id', id);
				this.model.fetch({
					success: function (data) {
						self.applyBindings();
						self.regsiterEvent();
						self.showData();
						self.showDataOrganization();
						self.$el.find("#created_at").html(`${Helpers.utcToLocal(self.model.get("created_at") * 1000, "DD-MM-YYYY HH:mm")}`);
						self.$el.find("#payment_no").html(self.model.get("payment_no"));

					},
					error: function () {
						toastr.error("Lỗi hệ thống, vui lòng thử lại sau.");
					},
				});
			} else {
				self.applyBindings();
				self.regsiterEvent();
			}

		},

		regsiterEvent: function () {
			var self = this;
			self.loadItemDropdown();
			self.loadItemDropdownOrganization();
		},
		loadItemDropdown: function () { // Đổ danh sách Item vào ô tìm kiếm
			var self = this;
			self.$el.find('.search-item').keyup(function name() {
				self.$el.find('.dropdown-item').remove();
				var text = $(this).val()
				$.ajax({
					type: "POST",
					url: self.getApp().serviceURL + "/api/v1/load_import_export_dropdown",
					data: JSON.stringify({ "text": text, "tenant_id": self.getApp().currentTenant[0] }),
					success: function (response) {
						var count = response.length
						response.forEach(function (item, index) {
							self.$el.find('.dropdown-menu-item').append(`
                            <button item-id= "${item.item_id}" item-no="${item.item_no}" item-type="${item.item_type}" item-organization-id="${item.item_organization_id}" class="dropdown-item" style="text-overflow: ellipsis;overflow: hidden;white-space: nowrap;">${item.item_no}</button>`)
						})
						if (count == 0) {
							self.$el.find('.dropdown-menu-item').hide()
						}
						if (count == 1) {
							self.$el.find('.dropdown-menu-item').css("height", "45px")
							self.$el.find('.dropdown-menu-item').show()
						}
						if (count == 2) {
							self.$el.find('.dropdown-menu-item').css("height", "80px")
							self.$el.find('.dropdown-menu-item').show()
						}
						if (count > 2) {
							self.$el.find('.dropdown-menu-item').css("height", "110px")
							self.$el.find('.dropdown-menu-item').show()
						}
						self.chooseItemInListDropdownItem();

					}
				});
			})
			self.$el.find('.out-click').bind('click', function () {
				self.$el.find('.dropdown-menu-item').hide()
			})
		},
		chooseItemInListDropdownItem: function () {
			var self = this;
			self.$el.find('.dropdown-menu-item .dropdown-item').unbind('click').bind('click', function () {
				var dropdownItemClick = $(this);
				var itemID = dropdownItemClick.attr('item-id')
				var itemNo = dropdownItemClick.attr('item-no')
				var itemType = dropdownItemClick.attr('item-type')
				var itemOrganizationID = dropdownItemClick.attr('item-organization-id')

				var filters = {
					filters: {
						"$and": [
							{ "id": { "$eq": itemOrganizationID } }
						]
					},
					order_by: [{ "field": "created_at", "direction": "desc" }]
				}
				$.ajax({
					type: "GET",
					url: self.getApp().serviceURL + "/api/v1/organization?results_per_page=100000&max_results_per_page=1000000",
					data: "q=" + JSON.stringify(filters),
					success: function(res) {
						self.$el.find('.search-item-organization').val(res.objects[0].organization_name)
						self.$el.find('.search-item-organization').attr('readonly','readonly')
					}
				})

				self.$el.find('.dropdown-menu-item').hide()
				self.$el.find('.search-item').val(itemNo)
				if (itemType == "purchaseorder") {
					self.model.set("purchaseorder_id", itemID)
					self.model.set("purchaseorder_no", itemNo)
					self.model.set("type", itemType)
					self.model.set("organization_id", itemOrganizationID)
				}
				if (itemType == "goodsreciept") {
					self.model.set("goodsreciept_id", itemID)
					self.model.set("goodsreciept_no", itemNo)
					self.model.set("type", itemType)
					self.model.set("organization_id", itemOrganizationID)
				}
			})
		},
		showData: function () {
			var self = this;
			if (self.model.get('type') == "purchaseorder") {
				self.$el.find('.search-item').val(self.model.get('purchaseorder_no'))
			}
			if (self.model.get('type') == "goodsreciept") {
				self.$el.find('.search-item').val(self.model.get('goodsreciept_no'))
			}
		},
		// xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
		loadItemDropdownOrganization: function () { // Đổ danh sách Item vào ô tìm kiếm
			var self = this;
			self.$el.find('.search-item-organization').keyup(function name() {
				self.$el.find('.dropdown-item-organization').remove();
				var text = $(this).val()
				$.ajax({
					type: "POST",
					url: self.getApp().serviceURL + "/api/v1/load_organization",
					data: JSON.stringify({ "text": text, "tenant_id": self.getApp().currentTenant[0] }),
					success: function (response) {
						self.$el.find('.dropdown-item-organization').remove();
						var count = response.length
						response.forEach(function (item, index) {
							self.$el.find('.dropdown-menu-item-organization').append(`
                            <button organization-id="${item.id}" organization-name="${item.organization_name}" class="dropdown-item dropdown-item-organization" style="text-overflow: ellipsis;overflow: hidden;white-space: nowrap;">${item.organization_name}</button>`)
						})
						if (count == 0) {
							self.$el.find('.dropdown-menu-item-organization').hide()
						}
						if (count == 1) {
							self.$el.find('.dropdown-menu-item-organization').css("height", "45px")
							self.$el.find('.dropdown-menu-item-organization').show()
						}
						if (count == 2) {
							self.$el.find('.dropdown-menu-item-organization').css("height", "80px")
							self.$el.find('.dropdown-menu-item-organization').show()
						}
						if (count > 2) {
							self.$el.find('.dropdown-menu-item-organization').css("height", "110px")
							self.$el.find('.dropdown-menu-item-organization').show()
						}
						self.chooseItemInListDropdownItemOrganization();

					}
				});
			})
			self.$el.find('.out-click').bind('click', function () {
				self.$el.find('.dropdown-menu-item-organization').hide()
			})
		},
		chooseItemInListDropdownItemOrganization: function () {
			var self = this;
			self.$el.find('.dropdown-menu-item-organization .dropdown-item').unbind('click').bind('click', function () {
				var dropdownItemClick = $(this);
				var itemOrganizationID = dropdownItemClick.attr('organization-id')
				var itemOrganizationName = dropdownItemClick.attr('organization-name')

				self.$el.find('.dropdown-menu-item-organization').hide()
				self.$el.find('.search-item-organization').val(itemOrganizationName)
				self.model.set("organization_id", itemOrganizationID)
			})
		},
		showDataOrganization: function () {
			var self = this;
			self.$el.find('.search-item-organization').val(self.model.get('organization').organization_name)
			if(self.model.get('goodsreciept_id')!= null ||  self.model.get('purchaseorder_id')!= null ){
				self.$el.find('.search-item-organization').attr('readonly','readonly')
			}
		},
	});

});