define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');
    var template = require('text!app/quanlykho/goods-reciept/tpl/print-model.html');
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
                            <td>${TemplateHelper.currencyFormat(item.purchase_cost)}</td>
                            <td>${item.quantity}</td>
                            <td>${TemplateHelper.currencyFormat(item.net_amount)}</td>
                        </tr>`;

            })
            self.$el.find("#total-amount").text(TemplateHelper.currencyFormat(totalAmount));
            self.$el.find("#deliverynote-no").text("Mã phiếu nhập: " + viewData.goodsreciept_no);
            self.$el.find("#payment_no").text("Mã thanh toán: " + viewData.payment_no);
            self.$el.find("#warehouse").text("Kho: " + viewData.warehouse_name);
            self.$el.find("#contact-name").text("Đại diện: " + viewData.contact_name);
            self.$el.find("#organization_name").text("Công ty: " + viewData.organization_name);
            self.$el.find("#created_at").text(Helpers.utcToLocal(viewData.created_at * 1000, "DD-MM-YYYY HH:mm"));


            if (viewData.payment_status == "delivery") {
                self.$el.find("#payment_status").html(`<label style="width: 100%">Đã xuất kho</label>`);
            } else if (viewData.payment_status == "created") {
                self.$el.find("#payment_status").html(`<label style="width: 100%">Tạo yêu cầu</label>`);
            } else if (viewData.payment_status == "pending") {
                self.$el.find("#payment_status").html(`<label style="width: 100%>Chờ xử lý</label>`);
            } else if (viewData.payment_status == "confirm") {
                self.$el.find("#payment_status").html(`<label style="width: 100%">Đã duyệt yêu cầu</label>`);
            } else if (viewData.payment_status == "finish") {
                self.$el.find("#payment_status").html(`<label style="width: 100%">Đã hoàn thành</label>`);
            } else {
                return ``;
            }



            bodyData.append(tpl);
        }

    });
});
