define(function (require) {
	"use strict";
	var $ = require('jquery'),
		_ = require('underscore'),
		Gonrin = require('gonrin');

	var template = require('text!app/baocao/phuluc2/tpl/model.html'),
		schema = require('json!schema/HSQLSucKhoeVaBenhTatNguoiLaoDongSchema.json');

	var BangQLSucKhoeTruocKhiBoTriViecLamItemView = require('app/baocao/phuluc2/js/BangQLSucKhoeTruocKhiBoTriViecLamView');
	var BangQLSucKhoeLaoDongThongQuaKhamSucKhoeDinhKyItemView = require('app/baocao/phuluc2/js/BangQLSucKhoeLaoDongThongQuaKhamSucKhoeDinhKyView');
	var BangSoTruongHopMacCacLoaiBenhThongThuongItemView = require('app/baocao/phuluc2/js/BangSoTruongHopMacCacLoaiBenhThongThuongVIew');

	var BangCacTruongHopMacBenhNgheNghiepItemView = require('app/baocao/phuluc2/js/BangCacTruongHopMacBenhNgheNghiepView');
	var BangCacTruongHopTaiNanLaoDongItemView = require('app/baocao/phuluc2/js/BangCacTruongHopTaiNanLaoDongView');
	// var BangTinhHinhNghiViecItemView = require('app/baocao/phuluc2/js/BangTinhHinhNghiViecView');
	var BangQuanLyBenhManTinhItemView = require('app/baocao/phuluc2/js/BangQuanLyBenhManTinhView');
	var BangQuanLyBenhManTinhTheoTungBenhView = require('app/baocao/phuluc2/js/BangQuanLyBenhManTinhTheoTungBenhView');
	var BangTheoDoiBenhNgheNghiepItemView = require('app/baocao/phuluc2/js/BangTheoDoiBenhNgheNghiepView');
	var BangDanhSachNguoiLaoDongMacBenhNgheNghiepItemView = require('app/baocao/phuluc2/js/BangDanhSachNguoiLaoDongMacBenhNgheNghiepView');
	var BangTinhHinhNghiViecView = require('app/baocao/phuluc2/js/BangTinhHinhNghiViecView');


	return Gonrin.ModelView.extend({
		template: template,
		modelSchema: schema,
		urlPrefix: "/api/v1/",
		collectionName: "hsqlsuckhoevabenhtatnguoilaodong",
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
						buttonClass: "btn-default btn-sm",
						label: "TRANSLATE:BACK",
						command: function () {
							var self = this;
							Backbone.history.history.back();
						}
					},
					{
						name: "save",
						type: "button",
						buttonClass: "btn-success btn-sm",
						label: "TRANSLATE:SAVE",
						command: function () {
							var self = this;

							self.model.save(null, {
								success: function (model, respose, options) {
									// self.getApp().hideloading();
									self.getApp().notify("Lưu thông tin thành công");
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
						label: "TRANSLATE:DELETE",
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
				{
					field: "bangqlsuckhoetruockhibotrivieclamfield",
					uicontrol: false,
					itemView: BangQLSucKhoeTruocKhiBoTriViecLamItemView,
					tools: [{
						name: "create",
						type: "button",
						buttonClass: "btn btn-outline-success btn-sm",
						label: "<span class='fa fa-plus'></span>",
						command: "create"
					}],
					toolEl: "#add_row"
				},
				{
					field: "bangqlsuckhoelaodongthongquakhamsuckhoedinhkyfield",
					uicontrol: false,
					itemView: BangQLSucKhoeLaoDongThongQuaKhamSucKhoeDinhKyItemView,
					tools: [{
						name: "create",
						type: "button",
						buttonClass: "btn btn-outline-success btn-sm",
						label: "<span class='fa fa-plus'></span>",
						command: "create"
					}],
					toolEl: "#add_row2"
				},
				{
					field: "bangsotruonghopmaccacloaibenhthongthuongfield",
					uicontrol: false,
					itemView: BangSoTruongHopMacCacLoaiBenhThongThuongItemView,
					tools: [{
						name: "create",
						type: "button",
						buttonClass: "btn btn-outline-success btn-sm",
						label: "<span class='fa fa-plus'></span>",
						command: "create"
					}],
					toolEl: "#add_row3"
				},
				{
					field: "bangcactruonghopmacbenhnghenghiepfield",
					uicontrol: false,
					itemView: BangCacTruongHopMacBenhNgheNghiepItemView,
					tools: [{
						name: "create",
						type: "button",
						buttonClass: "btn btn-outline-success btn-sm",
						label: "<span class='fa fa-plus'></span>",
						command: "create"
					}],
					toolEl: "#add_row4"
				},
				{
					field: "bangcactruonghoptainanlaodongfield",
					uicontrol: false,
					itemView: BangCacTruongHopTaiNanLaoDongItemView,
					tools: [{
						name: "create",
						type: "button",
						buttonClass: "btn btn-outline-success btn-sm",
						label: "<span class='fa fa-plus'></span>",
						command: "create"
					}],
					toolEl: "#add_row5"
				},
				// {
				// 	field: "bangtinhhinhnghiviecfield",
				// 	uicontrol: false,
				// 	itemView: BangTinhHinhNghiViecItemView,
				// 	tools: [{
				// 		name: "create",
				// 		type: "button",
				// 		buttonClass: "btn btn-outline-success btn-sm",
				// 		label: "<span class='fa fa-plus'></span>",
				// 		command: "create"
				// 	}],
				// 	toolEl: "#add_row6"
				// },
				{
					field: "bangquanlybenhmantinhfield",
					uicontrol: false,
					itemView: BangQuanLyBenhManTinhItemView,
					tools: [{
						name: "create",
						type: "button",
						buttonClass: "btn btn-outline-success btn-sm",
						label: "<span class='fa fa-plus'></span>",
						command: "create"
					}],
					toolEl: "#add_row7"
				},
				// {
				// 	field: "bangquanlybenhmantinhtheotungbenhfield",
				// 	uicontrol: false,
				// 	itemView: BangQuanLyBenhManTinhTheoTungBenhView,
				// 	tools: [{
				// 		name: "create",
				// 		type: "button",
				// 		buttonClass: "btn btn-outline-success btn-sm",
				// 		label: "<span class='fa fa-plus'></span>",
				// 		command: "create"
				// 	}],
				// 	toolEl: "#add_row8"
				// },
				{
					field: "BangTheoDoiBenhNgheNghiepfield",
					uicontrol: false,
					itemView: BangTheoDoiBenhNgheNghiepItemView,
					tools: [{
						name: "create",
						type: "button",
						buttonClass: "btn btn-outline-success btn-sm",
						label: "<span class='fa fa-plus'></span>",
						command: "create"
					}],
					toolEl: "#add_row9"
				},
				{
					field: "bangdanhsachnguoilaodongmacbenhnghenghiepfield",
					uicontrol: false,
					itemView: BangDanhSachNguoiLaoDongMacBenhNgheNghiepItemView,
					tools: [{
						name: "create",
						type: "button",
						buttonClass: "btn btn-outline-success btn-sm",
						label: "<span class='fa fa-plus'></span>",
						command: "create"
					}],
					toolEl: "#add_row10"
				},
				{
					field: "tencosolaodong",
					cssClass: false,
				},
				{
					field: "nganhchuquan",
					cssClass: false,
				},
				{
					field: "diachi",
					cssClass: false,
				},
				{
					field: "dienthoai",
					cssClass: false,
				},
				{
					field: "sofax",
					cssClass: false,
				},
				{
					field: "email",
					cssClass: false,
				},
				{
					field: "website",
					cssClass: false,
				},
				{
					field: "nguoilienhe",
					cssClass: false,
				},
				{
					field: "nguoilaphoso",
					cssClass: false,
				},
				{
					field: "nam",
					cssClass: false,
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
						self.renderBangquanlybenhmantinhtheotungbenh();
						// self.renderbangtinhhinhnghiviec();
						self.registerEvent();
						// self.tinhtong();
						// self.sothutu()
						// self.sothutu2();
					},
					error: function () {
						self.getApp().notify("Get data Eror");
					},
				});
			} else {
				self.applyBindings();
				self.renderBangquanlybenhmantinhtheotungbenh();
				self.registerEvent();
			}
		},

		registerEvent: function () {
			const self = this;
			self.createBangTinhHinhNghiViec();
			self.renderbangtinhhinhnghiviec();
		},

		createBangTinhHinhNghiViec: function () {
			const self = this;
			var containerEl = self.$el.find("#space_bangtinhhinhnghiviecfield");

			self.$el.find("#btn_add_bangtinhhinhnghiviecfield").on("click", (eventClick) => {
				console.log("click");
				var viewNghiViec = new BangTinhHinhNghiViecView();
				viewNghiViec.model.save(null, {
					success: (model, response, options) => {
						console.log("model", response);
						viewNghiViec.model.set(response);
						viewNghiViec.render();
						$(viewNghiViec.el).hide().appendTo(containerEl).fadeIn();

					}, error: (error) => {
						console.log("error", error);
					}

				});
			});
		},

		renderbangtinhhinhnghiviec: function () {
			const self = this;

			var danhSachTinhHinhNghiViec = self.model.get("bangtinhhinhnghiviecfield");
			var containerEl = self.$el.find("#space_bangtinhhinhnghiviecfield");

			danhSachTinhHinhNghiViec.forEach((item, idx) => {
				var viewNghiViec = new BangTinhHinhNghiViecView();
				viewNghiViec.model.set(item);
				viewNghiViec.render();
				console.log("viewNghiViec", viewNghiViec);

				$(viewNghiViec.el).hide().appendTo(containerEl).fadeIn();
				viewNghiViec.model.on("change", (change) => {
					console.log("change", change);
					var bangTinhHinhNghiViec =  self.model.get("bangtinhhinhnghiviecfield");
					if (change.attributes) {
						bangTinhHinhNghiViec.forEach((item, idx) => {
							if (item.id === change.attributes.id) {
								bangTinhHinhNghiViec[idx] = change.attributes;
							}
						});
						self.model.set("bangtinhhinhnghiviecfield", bangTinhHinhNghiViec);

					}
				})
			});
		},

		renderBangquanlybenhmantinhtheotungbenh: function () {
			const self = this;

			var ds_bangquanlybenhmantinhtheotungbenhfield = self.model.get("bangquanlybenhmantinhtheotungbenhfield");
			var containerEl = self.$el.find("#space_bangquanlybenhmantinhtheotungbenhfield");
			containerEl.empty();
			ds_bangquanlybenhmantinhtheotungbenhfield.forEach((item, index) => {
				var view = new BangQuanLyBenhManTinhTheoTungBenhView();
				view.model.set(item);
				view.render();
				$(view.el).hide().appendTo(containerEl).fadeIn();

				view.on("change", (data) => {
					var ds_bangquanlybenhmantinhtheotungbenhfield = self.model.get("bangquanlybenhmantinhtheotungbenhfield");
					ds_bangquanlybenhmantinhtheotungbenhfield.forEach((item, index) => {
						if (item.id == data.id) {
							ds_bangquanlybenhmantinhtheotungbenhfield[index] = data;
						}
					});
					self.model.set("bangquanlybenhmantinhtheotungbenhfield", ds_bangquanlybenhmantinhtheotungbenhfield);
				});
			});

			self.$el.find("#btn_add_bangquanlybenhmantinhtheotungbenhfield").unbind("click").bind("click", () => {
				var view = new BangQuanLyBenhManTinhTheoTungBenhView();
				view.model.save(null, {
					success: function (model, respose, options) {
						view.model.set(respose);

						view.render();
						$(view.el).hide().appendTo(containerEl).fadeIn();

						var ds_bangquanlybenhmantinhtheotungbenhfield = self.model.get("bangquanlybenhmantinhtheotungbenhfield");
						if (!ds_bangquanlybenhmantinhtheotungbenhfield) {
							ds_bangquanlybenhmantinhtheotungbenhfield = [];
						}
						ds_bangquanlybenhmantinhtheotungbenhfield.push(view.model.toJSON());
						self.model.set("bangquanlybenhmantinhtheotungbenhfield", ds_bangquanlybenhmantinhtheotungbenhfield);

						view.on("change", (data) => {


							var ds_bangquanlybenhmantinhtheotungbenhfield = self.model.get("bangquanlybenhmantinhtheotungbenhfield");
							ds_bangquanlybenhmantinhtheotungbenhfield.forEach((item, index) => {
								if (item.id == data.id) {
									ds_bangquanlybenhmantinhtheotungbenhfield[index] = data;
								}
							});
							self.model.set("bangquanlybenhmantinhtheotungbenhfield", ds_bangquanlybenhmantinhtheotungbenhfield);
						});
					},
					error: function (xhr, status, error) {
						// HANDLE ERROR
					}
				});
			});
		},
	});

});