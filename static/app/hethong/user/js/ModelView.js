define(function (require) {
	"use strict";
	var $ = require('jquery'),
		_ = require('underscore'),
		Gonrin = require('gonrin');
	var template = require('text!app/hethong/user/tpl/model.html'),
		schema = require('json!schema/UserSchema.json');

	// var RoleSelectView = require('app/role/js/SelectView');
	// var VaiTroSelectView = require('app/hethong/rank/js/SelectView');

	return Gonrin.ModelView.extend({
		template: template,
		modelSchema: schema,
		urlPrefix: "/api/v1/",
		collectionName: "user",
		bindings: "data-bind",
		state: null,
		tools: [
			{
				name: "defaultgr",
				type: "group",
				groupClass: "toolbar-group",
				buttons: [
					{
						name: "back",
						type: "button",
						buttonClass: "btn-dark btn-sm",
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
						label: "TRANSLATE:Lưu",
						command: function () {
							var self = this;

							self.model.save(null, {
								success: function (model, respose, options) {

									self.getApp().notify("Lưu thông tin thành công");
									self.getApp().getRouter().refresh();
								},
								error: function (xhr, status, error) {
									try {
										if (($.parseJSON(error.xhr.responseText).error_code) === "SESSION_EXPIRED") {
											self.getApp().notify("Hết phiên làm việc, vui lòng đăng nhập lại!");
											self.getApp().getRouter().navigate("login");
										} else {
											self.getApp().notify({ message: $.parseJSON(error.xhr.responseText).error_message }, { type: "danger", delay: 1000 });
										}
									}
									catch (err) {
										self.getApp().notify({ message: "Lưu thông tin không thành công" }, { type: "danger", delay: 1000 });
									}
								}
							});


						}
					},
					{
						name: "delete",
						type: "button",
						buttonClass: "btn-danger btn-sm",
						label: "TRANSLATE:Xóa",
						visible: function () {
							return this.getApp().getRouter().getParam("id") !== null;
						},
						command: function () {
							var self = this;
							self.model.destroy({
								success: function (model, response) {
									self.getApp().notify('Xoá dữ liệu thành công');
									self.getApp().getRouter().navigate(self.collectionName + "/collection");
								},
								error: function (xhr, status, error) {
									try {
										if (($.parseJSON(error.xhr.responseText).error_code) === "SESSION_EXPIRED") {
											self.getApp().notify("Hết phiên làm việc, vui lòng đăng nhập lại!");
											self.getApp().getRouter().navigate("login");
										} else {
											self.getApp().notify({ message: $.parseJSON(error.xhr.responseText).error_message }, { type: "danger", delay: 1000 });
										}
									}
									catch (err) {
										self.getApp().notify({ message: "Xóa dữ liệu không thành công" }, { type: "danger", delay: 1000 });
									}
								}
							});
						}
					},
				],
			}],
		uiControl: {
			fields: [
				// {
				// 	field: "roles",
				// 	uicontrol: "ref",
				// 	textField: "name",
				// 	foreignRemoteField: "id",
				// 	selectionMode: "multiple",
				// 	dataSource: RoleSelectView
				// },
				// {
				// 	field: "organization",
				// 	uicontrol: "ref",
				// 	textField: "name",
				// 	foreignRemoteField: "id",
				// 	foreignField: "donvi_id",
				// 	dataSource: DonViSelectView
				// },
				// {
				// 	field: "rank",
				// 	uicontrol: "combobox",
				// 	textField: "text",
				// 	valueField: "value",
				// 	dataSource: [
				// 		{ "value": 1, "text": "Giám đốc" },
				// 		{ "value": 2, "text": "Trưởng phòng vật tư" },
				// 		{ "value": 3, "text": "Nhân viên kỹ thuật" },
				// 		{ "value": 4, "text": "Nhân sự department phòng" },
				// 	],
				// },
			]
		},

		render: function () {
			var self = this;
				if(location.hash.length < 20){
					
						self.$el.find(".btn-success").unbind("click").bind("click", function () {
							
							if(self.model.get('name') == null || self.model.get('name') == ''){
								self.getApp().notify({ message: "Chưa nhập tên "}, { type: "danger", delay: 1000 });
							}
							if(self.model.get('email') == null || self.model.get('email') == ''){
								self.getApp().notify({ message: "Chưa nhập email "}, { type: "danger", delay: 1000 });
							}
							if(self.model.get('phone_number') == null || self.model.get('phone_number') == ''){
								self.getApp().notify({ message: "Chưa nhập số điện thoại"}, { type: "danger", delay: 1000 });
							}
							if(self.model.get('rank') == null || self.model.get('rank') == ''){
								self.getApp().notify({ message: "Chưa chọn rank "}, { type: "danger", delay: 1000 });
							}
							if(self.model.get('password') == null || self.model.get('password') == ''){
								self.getApp().notify({ message: "Chưa nhập mật khẩu "}, { type: "danger", delay: 1000 });
							}
							else {
							var data = {
								name: self.model.get('name'),
								email: self.model.get('email'),
								phone_number: self.model.get('phone_number'),
								rank: self.model.get('rank'),
								password: self.model.get('password'),
							}
								$.ajax({
									method: "POST",
									url: self.getApp().serviceURL + "/api/v1/register",
									data: JSON.stringify(data),
									headers: {
										'content-type': 'application/json'
									},
									dataType: 'json',
									success: function (response) {
										if (response) {
											console.log(response)
											self.getApp().notify("Đăng ký thành công");
											self.getApp().getRouter().navigate(self.collectionName + "/collection");
										}
									}, error: function (xhr, ere) {
										self.getApp().notify({ message: "Thông tin tài khoản đã có trong hệ thống" }, { type: "danger", delay: 1000 });
	
									}
								})
							}

							});
					
				}
				
			

			var id = this.getApp().getRouter().getParam("id");

			if (id) {
				this.model.set('id', id);
				this.model.fetch({
					success: function (data) {
						self.applyBindings();
						self.$el.find('.password').hide();
						
					},
					error: function () {
						self.getApp().notify("Get data Eror");
					},
				});
			} else {
				self.applyBindings();
			}
		},

	});
});