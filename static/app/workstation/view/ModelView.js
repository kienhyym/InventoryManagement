define(function (require) {
	"use strict";
	var $ = require('jquery'),
		_ = require('underscore'),
		Gonrin = require('gonrin');

	var template = require('text!app/workstation/tpl/model.html'),
		schema = require('json!schema/WorkstationSchema.json');

	return Gonrin.ModelView.extend({
		template: template,
		modelSchema: schema,
		urlPrefix: "/api/v1/",
		collectionName: "workstation",

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
							self.model.set("tenant_id", self.getApp().currentTenant[0]);
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
					{
						name: "delete",
						type: "button",
						buttonClass: "btn-danger btn btn-sm",
						label: "TRANSLATE:DELETE",
						visible: function () {
							return false;
							// return this.getApp().getRouter().getParam("id") !== null;
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
	});

});
