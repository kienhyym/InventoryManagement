define(function (require) {
	"use strict";
	var $ = require('jquery'),
		_ = require('underscore'),
		Gonrin = require('gonrin');

	var template = require('text!app/quanlykho/contact/tpl/model.html'),
		schema = require('json!schema/ContactSchema.json');

	var Helpers = require('app/base/view/Helper');
	var TemplateHelper = require('app/base/view/TemplateHelper');
	var CustomFilterView = require('app/base/view/CustomFilterView');
	return Gonrin.ModelView.extend({
		template: template,
		modelSchema: schema,
		urlPrefix: "/api/v1/",
		collectionName: "contact",

		uiControl: {
			fields: [
				{
					field: "birthday",
					uicontrol: "datetimepicker",
					textFormat: "DD/MM/YYYY"
				},
				{
					field: "gender",
					uicontrol: "combobox",
					textField: "text",
					valueField: "value",
					dataSource: [
						{ "value": "male", "text": "Nam" },
						{ "value": "female", "text": "Nữ" },
					],
					value: "male"
				},
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
							if (!self.validate()) {
								return;
							}
							var method = "update";
							if (!id) {
								method = "create";
								self.model.set("created_by_name", self.getApp().currentUser.fullname ? self.getApp().currentUser.fullname : self.getApp().currentUser.email);
								self.model.set("created_at", Helpers.utcToUtcTimestamp());
								var makeNo = Helpers.makeNoDelivery(6, "DM").toUpperCase();
								self.model.set("contact_no", makeNo);
								self.model.set("tenant_id", self.getApp().currentTenant);
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

		render: function () {
			var self = this;
			var id = this.getApp().getRouter().getParam("id");
			if (id) {
				this.model.set('id', id);
				this.model.fetch({
					success: function (data) {
						self.applyBindings();
					},
					error: function () {
						toastr.error("Get data Eror");
					},
				});
			} else {
				self.applyBindings();
			}
		},

		validate: function () {
			var self = this;
			if (!self.model.get("contact_name")) {
				toastr.warning("Tên không được để trống!");
				return;
			} else if (!self.model.get("phone")) {
				toastr.warning("Số điện thoại không được để trống!")
				return;
			}
			return true;
		}

		// registerEvent: function () {
		// 	var self = this;
		// 	self.$el.find('#business_start_date').datetimepicker({
		// 		defaultDate: self.model.get("business_start_date"),
		// 		format: "DD/MM/YYYY HH:mm",
		// 		icons: {
		// 			time: "fa fa-clock"
		// 		}
		// 	});

		// 	self.$el.find('#business_start_date').on('change.datetimepicker', function (e) {
		// 		if (e && e.date) {
		// 			self.model.set("business_start_date", e.date.local().format("YYYY-MM-DD HH:mm:ss"))
		// 		} else {
		// 			self.model.set("business_start_date", null);
		// 		}
		// 	});
		// }
	});

});
