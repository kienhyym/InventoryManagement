define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');

    var template = require('text!app/quanlykho/organization/tpl/model.html'),
        schema = require('json!schema/OrganizationSchema.json');

    var Helpers = require("app/base/view/Helper");

    return Gonrin.ModelView.extend({
        template: template,
        modelSchema: schema,
        urlPrefix: "/api/v1/",
        collectionName: "organization",
        mangNhanVienBiXoa: [],
        uiControl: {
            fields: [
                // {
                // 	field: "industry",
                // 	uicontrol: "combobox",
                // 	textField: "text",
                // 	valueField: "value",
                // 	dataSource: [
                // 		{ "value": "food", "text": "Ăn uống" },
                // 		{ "value": "banking", "text": "Ngân hàng" },
                // 		{ "value": "education", "text": "Giáo dục" },
                // 		{ "value": "finance", "text": "Tài chính" },
                // 		{ "value": "healthcare", "text": "Y tế" },
                // 		{ "value": "technology", "text": "Công nghệ" }
                // 	],
                // },
                {
                    field: "organization_type",
                    uicontrol: "combobox",
                    textField: "text",
                    valueField: "value",
                    dataSource: [
                        // { "value": null, "text": "Chọn" },
                        { "value": "customer", "text": "Đơn vị mua hàng" },
                        // { "value": "partner", "text": "Đối tác" },
                        { "value": "reseller", "text": "Đơn vị cung cấp hàng" },
                        // { "value": "analyst", "text": "Analyst" },
                        // { "value": "competitor", "text": "Đối thủ" },
                        // { "value": "intergrator", "text": "Intergrator" },
                        // { "value": "invester", "text": "Đầu tư" },
                        // { "value": "press", "text": "Báo chí" },
                        // { "value": "prospect", "text": "Prospect" },
                        // { "value": "other", "text": "Khác" },
                    ],
                },
                // {
                //     field: "rating",
                //     uicontrol: "combobox",
                //     textField: "text",
                //     valueField: "value",
                //     dataSource: [
                //         // { "value": null, "text": "Chọn" },
                //         { "value": "acquired", "text": "Đã mua" },
                //         { "value": "sell", "text": "Đã bán" },
                //         { "value": "active", "text": "Tích cực" },
                //         { "value": "market_failed", "text": "Market Failed" },
                //         { "value": "project_cancelled", "text": "Project Cancelled" },
                //         { "value": "shutdown", "text": "Shutdown" },
                //     ],
                // },
            ]
        },

        tools: [{
            name: "defaultgr",
            type: "group",
            groupClass: "toolbar-group",
            buttons: [{
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
                buttonClass: "btn-primary btn btn-sm",
                label: "TRANSLATE:SAVE",
                command: function () {
                    var self = this;
                    var tenant_id = self.getApp().currentTenant[0];
                    // if (!self.validate()) {
                    // 	return;
                    // }
                    self.model.set("tenant_id", tenant_id);
                    self.model.save(null, {
                        success: function (model, respose, options) {
                            self.guiYeuCauThemNhanVien(respose);
                            self.xoaNhanVien();
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
                            } catch (err) {
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
            self.bamThemNhanVien()
            if (id) {
                this.model.set('id', id);
                this.model.fetch({
                    success: function (data) {
                        self.hienThiDanhSachNhanVien();
                        self.danhSachNhanVienBiXoa();
                        self.applyBindings();
                        self.historyPay();
                        self.historyImportExport();
                        self.debtCalculation();
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
            if (!self.model.get("organization_no")) {
                toastr.error("Vui lòng nhập mã");
                return;
            } else if (!self.model.get("organization_name")) {
                toastr.error("Vui lòng nhập tên");
                return;
            } else if (!self.model.get("phone")) {
                toastr.error("Vui lòng nhập số điện thoại ");
                return;
            } else if (!self.model.get("email")) {
                toastr.error("Vui lòng nhập email");
                return;
            }
            return true;
        },
        hienThiDanhSachNhanVien: function () {
            var self = this;
            var mangSapXep = lodash.orderBy(self.model.get('employees'), ['created_at'], ['asc']);
            mangSapXep.forEach(function (item, index) {
                self.$el.find('#nhanvien').append(`
				<tr class='nhanviendaco' nhanvien_id ="${item.id}">
					<td style="width: 10%;" class="p-2"><input type="text" class="w-100 nhanvien_stt form-control" value="${index + 1} "></td>
					<td style="width: 20%;" class="p-2"><input type="text" class="w-100 nhanvien_ten form-control" value="${item.name}"></td>
					<td style="width: 20%;" class="p-2"><input type="text" class="w-100 nhanvien_dienthoai form-control" value="${item.phone}"></td>
					<td style="width: 20%;" class="p-2"><input type="text" class="w-100 nhanvien_email form-control" value="${item.email}"></td>
					<td style="width: 20%;" class="p-2"><input type="text" class="w-100 nhanvien_vaitro nhanvien_vaitro${item.id}"value="${item.role}" ></td>
					<td style="width: 10%;" class="p-2"><button class="btn btn-outline-dark btnXoa" nhanvien_id_del ="${item.id}">x</button></td>
					</tr>
				`)
                self.$el.find('.nhanvien_vaitro' + item.id).combobox({
                    textField: "text",
                    valueField: "value",
                    allowTextInput: true,
                    enableSearch: true,
                    dataSource: [
                        { text: "quản lý", value: "manage" },
                        { text: "Kế toán", value: "accountant" },
                    ],
                })
            })
        },
        danhSachNhanVienBiXoa: function () {
            var self = this;
            self.$el.find('.nhanviendaco .btnXoa').unbind('click').bind('click', function () {
                self.$el.find('[nhanvien_id=' + $(this).attr('nhanvien_id_del') + ']').remove();
                self.mangNhanVienBiXoa.push($(this).attr('nhanvien_id_del'))
            })
        },
        xoaNhanVien: function () {
            var self = this;
            var soLuongNhanVienBiXoa = self.mangNhanVienBiXoa.length;
            if (soLuongNhanVienBiXoa > 0) {
                $.ajax({
                    type: "POST",
                    url: self.getApp().serviceURL + "/api/v1/delete_organizationstaff",
                    data: JSON.stringify(self.mangNhanVienBiXoa),
                    success: function (response) {
                        self.mangNhanVienBiXoa.splice(0, soLuongNhanVienBiXoa);
                        console.log(response)
                    }
                });
            }

        },
        bamThemNhanVien: function () {
            var self = this;
            self.$el.find('#themnhanvien').unbind('click').bind('click', function () {
                var stt = self.$el.find('.nhanvien_stt').length;
                stt++;
                self.$el.find('#nhanvien').append(`
				<tr class='thongtinnhanvienmoi' nhanvien_stt="${stt}">
					<td style="width: 10%;" class="p-2"><input type="text" class="w-100 nhanvien_stt form-control" value = "${stt}"></td>
					<td style="width: 20%;" class="p-2"><input type="text" class="w-100 nhanvien_ten form-control"></td>
					<td style="width: 20%;" class="p-2"><input type="text" class="w-100 nhanvien_dienthoai form-control"></td>
					<td style="width: 20%;" class="p-2"><input type="text" class="w-100 nhanvien_email form-control"></td>
					<td style="width: 20%;" class="p-2"><input type="text" class="w-100 nhanvien_vaitro nhanvien_vaitro${stt}"></td>
					<td style="width: 10%;" class="p-2"><button class="btn btn-outline-dark btnXoa${stt}">x</button></td>
					</tr>
				`)
                self.$el.find('.nhanvien_vaitro' + stt).combobox({
                    textField: "text",
                    valueField: "value",
                    allowTextInput: true,
                    enableSearch: true,
                    dataSource: [
                        { text: "quản lý", value: "manage" },
                        { text: "Kế toán", value: "accountant" },
                    ],
                })
                self.$el.find('.thongtinnhanvienmoi .btnXoa' + stt).unbind('click').bind('click', function () {
                    self.$el.find('[nhanvien_stt=' + stt + ']').remove();
                    stt--;
                })
            })
        },

        guiYeuCauThemNhanVien: function (respose) {
            var self = this;
            //Thêm mới
            var soLuongNhanVienMoi = self.$el.find('.thongtinnhanvienmoi').length;
            if (soLuongNhanVienMoi > 0) {
                var danhSachNhanVienMoi = []
                for (var i = 0; i < soLuongNhanVienMoi; i++) {
                    var obj = {};
                    obj.stt = $(self.$el.find('.thongtinnhanvienmoi .nhanvien_stt')[i]).val()
                    obj.name = $(self.$el.find('.thongtinnhanvienmoi .nhanvien_ten')[i]).val()
                    obj.phone = $(self.$el.find('.thongtinnhanvienmoi .nhanvien_dienthoai')[i]).val()
                    obj.email = $(self.$el.find('.thongtinnhanvienmoi .nhanvien_email')[i]).val()
                    obj.vaitro = $(self.$el.find('.thongtinnhanvienmoi .nhanvien_vaitro')[i]).val()
                    danhSachNhanVienMoi.push(obj)
                }
                $.ajax({
                    type: "POST",
                    url: self.getApp().serviceURL + "/api/v1/create_organizationstaff",
                    data: JSON.stringify({
                        "data": danhSachNhanVienMoi,
                        "organization_id": respose.id
                    }),
                    success: function (response) {
                        console.log(response)
                    }
                });
            }

            // cập nhật
            var soLuongNhanVienDaCo = self.$el.find('.nhanviendaco').length;
            if (soLuongNhanVienDaCo > 0) {
                var danhSachNhanVienDaCo = []
                for (var i = 0; i < soLuongNhanVienDaCo; i++) {
                    var obj = {};
                    obj.id = $(self.$el.find('.nhanviendaco')[i]).attr('nhanvien_id')
                    obj.name = $(self.$el.find('.nhanviendaco .nhanvien_ten')[i]).val()
                    obj.phone = $(self.$el.find('.nhanviendaco .nhanvien_dienthoai')[i]).val()
                    obj.email = $(self.$el.find('.nhanviendaco .nhanvien_email')[i]).val()
                    obj.vaitro = $(self.$el.find('.nhanviendaco .nhanvien_vaitro')[i]).val()
                    danhSachNhanVienDaCo.push(obj)
                }
                $.ajax({
                    type: "POST",
                    url: self.getApp().serviceURL + "/api/v1/update_organizationstaff",
                    data: JSON.stringify({
                        "data": danhSachNhanVienDaCo,
                    }),
                    success: function (response) {
                        console.log(response)
                    }
                });
            }
        },
        historyPay: function () {
            var self = this;
            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/history_pay",
                data: JSON.stringify({ "organization_id": self.model.get('id'), "tenant_id": self.getApp().currentTenant[0] }),
                success: function (response) {
                    self.$el.find("#grid-TT").grid({
                        showSortingIndicator: true,
                        onValidateError: function () {
                            alert("eror");
                        },
                        orderByMode: "client",
                        fields: [
                            { field: 'stt', label: "STT" },

                            { field: "payment_no", label: "Mã phiếu"},
                            {
                                label: "Thời gian", template: function (rowObject) {
                                    if (rowObject.created_at) {
                                        return `<div style="min-width: 100px;">${Helpers.utcToLocal(rowObject.created_at * 1000, "DD/MM/YYYY HH:mm")}</div>`;
                                    } else {
                                        return ``;
                                    }
                                }
                            },
                            {
                                field: "amount",
                                label: 'Số tiền',
                                width: "100px",
                                template: function (rowObject) {
                                    if (rowObject.amount) {
                                        var resultNetAmount = new Number(rowObject.amount).toLocaleString("en-AU");
                                        return `<div style="min-width: 100px;">${resultNetAmount} vnđ</div>`;
                                    } else {
                                        return ``;
                                    }
                                }

                            },
                        ],
                        dataSource: response,
                        primaryField: "id",
                        selectionMode: "multiple",
                        pagination: {
                            page: 1,
                            pageSize: 3
                        },
                        events: {
                            "rowclick": function (e) {
                                var path = '/payment/model?id=' + e.rowId;
                                self.getApp().getRouter().navigate(path);
                            },
                        },
                    });
                }
            })
        },
        historyImportExport: function () {
            var self = this;
            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/history_import_export",
                data: JSON.stringify({ "organization_id": self.model.get('id'), "tenant_id": self.getApp().currentTenant[0],"organization_type":self.model.get('organization_type') }),
                success: function (response) {
                    var field = null;
                    var url = null;
                    if(self.model.get("organization_type") == "reseller"){
                        field = "goodsreciept_no"
                        url = "/goodsreciept"
                        self.$el.find('.xuat-nhap').html('Lịch sử<span class="bg-secondary rounded"> nhập hàng:</span>')
                    }
                    if(self.model.get("organization_type") == "customer"){
                        field = "purchaseorder_no"
                        url = "/purchaseorder"
                        self.$el.find('.xuat-nhap').html('Lịch sử <span class="bg-secondary rounded"> mua hàng:</span>')

                    }
                    console.log(response)
                    self.$el.find("#grid-IE").grid({
                        showSortingIndicator: true,
                        onValidateError: function () {
                            alert("eror");
                        },
                        orderByMode: "client",
                        fields: [
                            { field: 'stt', label: "STT" },

                            { field: field, label: "Mã phiếu" },
                            {
                                label: "Thời gian", 
                                template: function (rowObject) {
                                    if (rowObject.created_at) {
                                        return `<div style="min-width: 100px;">${Helpers.utcToLocal(rowObject.created_at * 1000, "DD/MM/YYYY HH:mm")}</div>`;
                                    } else {
                                        return ``;
                                    }
                                }
                            },
                            {
                                field: "amount",
                                label: 'Số tiền',
                                width: "100px",
                                template: function (rowObject) {
                                    if (rowObject.amount) {
                                        var resultNetAmount = new Number(rowObject.amount).toLocaleString("en-AU");
                                        return `<div style="min-width: 100px;">${resultNetAmount} vnđ</div>`;
                                    } else {
                                        return ``;
                                    }
                                }

                            },
                        ],
                        dataSource: response,
                        primaryField: "id",
                        selectionMode: "multiple",
                        pagination: {
                            page: 1,
                            pageSize: 3
                        },
                        events: {
                            "rowclick": function (e) {
                                var path = url+'/model?id=' + e.rowId;
                                self.getApp().getRouter().navigate(path);
                            },
                        },
                    });
                }
            })
        },
        debtCalculation:function(){
            var self = this;
            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/debt_calculation",
                data: JSON.stringify({ "organization_id": self.model.get('id'), "tenant_id": self.getApp().currentTenant[0],"organization_type":self.model.get('organization_type') }),
                success: function (response) {
                    var resultNetAmount = new Number(response).toLocaleString("en-AU");
                    self.$el.find('.debt-calculation').text(resultNetAmount+' VNĐ')
                }
            })
        }

    });

});