define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');
    var template = require('text!app/quanlykho/purchaseorder/tpl/print-model.html');

    var Helpers = require('app/base/view/Helper');
    var TemplateHelper = require('app/base/view/TemplateHelper');
    var CustomFilterView = require('app/base/view/CustomFilterView');

    return Gonrin.View.extend({
        template: template,
        modelSchema: {},

        render: function () {
            var self = this;
            self.applyBindings();
            $("#sidebar").hide();
            $("#btn-menu").trigger("click");
            self.registerEvent();
        },

        registerEvent: function () {
            var self = this;

            var viewData = self.getApp().getRouter().getParam("viewdata");
            viewData = JSON.parse(viewData);

            console.log(viewData);

            var bodyData = self.$el.find("#body-data");
            var tpl = ``;
            var totalAmount = 0;
            viewData.details.forEach(item => {
                totalAmount += item.net_amount;
                tpl += `<tr>
                            <td>${item.item_name}</td>
                            <td>${TemplateHelper.currencyFormat(item.list_price)}</td>
                            <td>${item.quantity}</td>
                            <td>${TemplateHelper.currencyFormat(item.net_amount)}</td>
                        </tr>`;

            })
            self.$el.find("#total-amount").text(TemplateHelper.currencyFormat(totalAmount));
            self.$el.find("#deliverynote-no").text("Thương hiệu: " + viewData.tenant_id);
            self.$el.find("#payment_no").text("Điểm bán " + viewData.workstation_name);
            self.$el.find("#warehouse").text("Địa chỉ: " + viewData.address);
            self.$el.find("#contact-name").text("Người yêu cầu: " + viewData.proponent);
            self.$el.find("#organization_name").text("Số điện thoại: " + viewData.phone);
            self.$el.find("#created_at").text(Helpers.utcToLocal(viewData.created_at * 1000, "DD-MM-YYYY HH:mm"));



            if (viewData.payment_status == "user-cancel") {
                self.$el.find("#payment_status").html(`<label style="width: 100%" class="badge badge-danger">Người dùng hủy</label></label>`);
            } else if (viewData.payment_status == "admin-cancel") {
                self.$el.find("#payment_status").html(`<label style="width: 100%" class="badge badge-danger">Quản lý hủy</label>`);
            } else if (viewData.payment_status == "created") {
                self.$el.find("#payment_status").html(`<label style="width: 100%" class="badge badge-primary">Tạo yêu cầu</label>`);
            } else if (viewData.payment_status == "pending") {
                self.$el.find("#payment_status").html(`<label style="width: 100%" class="badge badge-info">Chờ xử lý</label>`);
            } else if (viewData.payment_status == "confirm") {
                self.$el.find("#payment_status").html(`<label style="width: 100%" class="badge badge-warning">Đã duyệt yêu cầu</label>`);
            } else if (viewData.payment_status == "paid") {
                self.$el.find("#payment_status").html(`<label style="width: 100%" class="badge badge-success">Đã thanh toán</label>`);
            } else {
                return ``;
            }


            bodyData.append(tpl);
        }

    });
});
