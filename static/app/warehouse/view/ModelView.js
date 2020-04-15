define(function (require) {
	"use strict";
	var $ = require('jquery'),
		_ = require('underscore'),
		Gonrin = require('gonrin');

		var template = require('text!app/warehouse/tpl/model.html'),
		schema = require('json!schema/WarehouseSchema.json');

	// var OrganizationView = require("app/view/organization/view/SelectView")
	// var ItemView = require("app/view/warehouse/view/ItemBalances");

	var Helpers = require('app/base/view/Helper');
	var TemplateHelper = require('app/base/view/TemplateHelper');
	var CustomFilterView = require('app/base/view/CustomFilterView');

	return Gonrin.ModelView.extend({
		template: template,
		modelSchema: schema,
		urlPrefix: "/api/v1/",
		collectionName: "warehouse",

		uiControl: {
			fields: [
				// {
				// 	field: "organization",
				// 	uicontrol: "ref",
				// 	textField: "organization_name",
				// 	foreignRemoteField: "id",
				// 	foreignField: "organization_id",
				// 	dataSource: OrganizationView
				// },

				// {
				// 	field: "details",
				// 	uicontrol: false,
				// 	itemView: ItemView,
				// 	tools: [
				// 		{
				// 			name: "create",
				// 			type: "button",
				// 			buttonClass: "btn btn-outline-secondary btn-fw btn-sm",
				// 			label: "<i class='fa fa-plus'></i>",
				// 			command: "create"
				// 		},
				// 	],
				// 	toolEl: "#add-item"
				// },

				// {
				// 	field: "deleted",
				// 	uicontrol: "combobox",
				// 	textField: "text",
				// 	valueField: "value",
				// 	dataSource: [
				// 		{ "value": false, "text": "Hoạt động" },
				// 		{ "value": true, "text": "Ngừng hoạt động" }
				// 	],
				// }
			]
		},

		tools: [
			{
				name: "defaultgr",
				type: "group",
				groupClass: "toolbar-group",
				buttons: [
					{
						name: "back",
						type: "button",
						buttonClass: "btn-dark btn btn-sm",
						label: "TRANSLATE:BACK",
						command: function () {
							var self = this;
							Backbone.history.history.back();
						}
					},
					{
						name: "save",
						type: "button",
						buttonClass: "btn-primary btn-sm",
						label: "TRANSLATE:SAVE",
						command: function () {
							var self = this;
							var id = self.getApp().getRouter().getParam("id");
							// if (!self.validate()) {
							// 	return;
							// }
							var method = "update";
							if (!id) {
								var method = "create";
								self.model.set("tenant_id", self.getApp().currentUser.tenants[0][0].id);
							}
							self.model.save(null, {
								success: function (model, respose, options) {

									toastr.info("Lưu thông tin thành công");
									self.getApp().getRouter().navigate(self.collectionName + "/collection");
								},
								error: function (xhr, error) {
									try {
										if (($.parseJSON(error.xhr.responseText).error_code) === "SESSION_EXPIRED") {
											toastr.error("Hết phiên làm việc, vui lòng đăng nhập lại!");
											self.getApp().getRouter().navigate("login");
										} else {
											self.getApp().notify({ message: $.parseJSON(error.xhr.responseText).error_message }, { type: "danger", delay: 1000 });
										}
									}
									catch (err) {
										toastr.error('Lưu thông tin không thành công!');
									}
								}
							});
						}
					},
					// {
					// 	name: "delete",
					// 	type: "button",
					// 	buttonClass: "btn-danger btn btn-sm",
					// 	label: "TRANSLATE:DELETE",
					// 	visible: function () {
					// 		return this.getApp().getRouter().getParam("id") !== null;
					// 	},
					// 	command: function () {
					// 		var self = this;
					// 		self.model.destroy({
					// 			success: function (model, response) {
					// 				toastr.info('Xoá dữ liệu thành công');
					// 				self.getApp().getRouter().navigate(self.collectionName + "/collection");
					// 			},
					// 			error: function (model, xhr, options) {
					// 				toastr.error('Xoá dữ liệu không thành công!');

					// 			}
					// 		});
					// 	}
					// },
				],
			}],


		render: function () {
			var self = this;
			var id = this.getApp().getRouter().getParam("id");
			if (id) {
				this.model.set('id', id);
				this.model.fetch({
					success: function (data) {
						self.applyBindings();
						self.listItem();
					},
					error: function () {
						toastr.error("Get data Eror");
					},
				});
			} else {
				self.applyBindings();
				self.listItem();

			}
		},

		loadData: function (data) {
			var self = this;
			self.$el.find("#grid").grid({
				refresh: true,
				primaryField: "id",
				pagination: {
					page: 1,
					pageSize: 8
				},
				fields: [
					{ field: "item_no", label: "Mã", width: "150px" },
					{
						field: "", label: "ĐVT", template: function (rowObj) {
							if (rowObj.unit_code) {
								return `<div style="min-width: 100px">${rowObj.unit_code}</div>`;
							} else {
								return `<div style="min-width: 100px"></div>`;
							}
						}
					},
					{
						field: "item_name", label: "Tên hàng hóa", template: function (rowObject) {
							return `<div style="min-width: 140px;">${rowObject.item_name}</div>`;
						}
					},
					{
						field: "specification", label: "Quy cách", template: function (rowObject) {
							if (rowObject.specification) {
								return `<div style="min-width: 140px">${rowObject.specification}</div>`;
							} else {
								return `<div style="min-width: 70px"></div>`;
							}
						}
					},
					{
						field: "", label: "Tồn kho", template: function (rowObject) {
							return `<div style="min-width: 120px">${rowObject.quantity}</div>`;
						}
					},
					{
						field: "deleted", label: " ", template: function (rowObj) {
							return TemplateHelper.statusRender(!rowObj.deleted);
						}
					}
				],
				dataSource: data.object_data,

			});
		},
		validate: function () {
			var self = this;
			if (!self.model.get("organization")) {
				toastr.error("Vui lòng chọn công ty")
				return;
			} else if (!self.model.get("warehouse_name")) {
				toastr.error("Vui lòng nhập tên kho");
				return;
			} else if (!self.model.get("warehouse_no")) {
				toastr.error("Vui lòng nhập mã kho");
				return;
			}
			return true;
		},
		listItem : function(){
			var self = this;
			$.ajax({
				type: "POST",
				url: self.getApp().serviceURL + "/api/v1/get_item_in_warehouse",
				data: JSON.stringify({
					id: self.model.get("id"),
					tenant: self.getApp().currentTenant[0],
				}), success: function (response) {
					// console.log(response)
					response.forEach(function(item,index){
						self.$el.find('#body-items').append(`
							<tr>
								<td style="min-width: 250px">${item.item_name}</td>
								<td style="min-width: 150px"></td>
								<td style="min-width: 150px">${item.purchase_cost}</td>
								<td style="min-width: 130px">${item.quantity}</td>
							</tr>
						`)

					})
				}
			})

			$.ajax({
				type: "POST",
				url: self.getApp().serviceURL + "/api/v1/get_item_in_warehouse_after_movewarehouse",
				data: JSON.stringify({
					id: self.model.get("id"),
					tenant: self.getApp().currentTenant[0],
				}), success: function (response) {
					console.log(response)

					// response.forEach(function(item,index){
					// })
				}
			})
		}
	});

});
