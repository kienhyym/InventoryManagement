define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');



    var template = require('text!app/move-warehouse/tpl/model.html'),
        schema = require('json!schema/MoveWarehouseSchema.json');

    var ItemView = require("app/move-warehouse/view/Item");
    var Helpers = require("app/base/view/Helper");

    var currencyFormat = {
        symbol: "VNĐ",		// default currency symbol is '$'
        format: "%v %s",	// controls output: %s = symbol, %v = value (can be object, see docs)
        decimal: ",",		// decimal point separator
        thousand: ".",		// thousands separator
        precision: 0,		// decimal places
        grouping: 3		// digit grouping (not implemented yet)
    };


    return Gonrin.ModelView.extend({
        template: template,
        modelSchema: schema,
        urlPrefix: "/api/v1/",
        collectionName: "movewarehouse",
        selectWarehouseFrom: null,
        selectWarehouseTo: null,

        uiControl: {
            fields: [
                // {
                //     field: "amount",
                //     uicontrol: "currency",
                //     currency: currencyFormat,
                //     cssClass: "text-right"
                // }
                {
                    field: "details",
                    uicontrol: false,
                    itemView: ItemView,
                    tools: [
                        {
                            name: "create",
                            type: "button",
                            buttonClass: "btn btn-outline-secondary btn-fw btn-sm",
                            label: "<i class='fa fa-plus'></i>",
                            command: "create"
                        },
                    ],
                    toolEl: "#add-item"
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
                        buttonClass: "btn btn-secondary btn-sm back",
                        label: "TRANSLATE:BACK",
                        command: function () {
                            var self = this;
                            Backbone.history.history.back();
                        }
                    },
                    {
                        name: "save",
                        type: "button",
                        buttonClass: "btn btn-primary font-weight-bold save",
                        label: "TRANSLATE:SAVE",
                        command: function () {
                            var self = this;
                            var id = self.getApp().getRouter().getParam("id");
                            if (!self.validate()) {
                                return;
                            }
                            var method = "update";
                            if (!id) {
                                var method = "create";
                                self.model.set("created_by_name", self.getApp().currentUser.fullname ? self.getApp().currentUser.fullname : self.getApp().currentUser.email);
                                self.model.set("created_at", Helpers.utcToUtcTimestamp());
                                self.model.set("status", "initialization");
                                var makeNo = Helpers.makeNoGoods(6, "CK0").toUpperCase();
                                self.model.set("movewarehouse_no", makeNo);
                                // self.model.set("payment_status", "unpaid");
                            }
                            self.model.sync(method, self.model, {
                                success: function (model, respose, options) {
                                    toastr.info("Lưu thông tin thành công");
                                    // self.$el.find(".back").trigger("click");
                                    self.getApp().getRouter().navigate(self.collectionName + "/collection");

                                },
                                error: function (model, xhr, options) {
                                    // console.log(model)
                                    toastr.error("Lưu không thành công")

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
                        self.regsiterEvent();
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

            self.$el.find("#auto-save").unbind("click").bind("click", function () {
                console.log("click");
                var id = self.getApp().getRouter().getParam("id");
                var method = "update";
                if (!id) {
                    var method = "create";
                    self.model.set("created_by_name", self.getApp().currentUser.fullname ? self.getApp().currentUser.fullname : self.getApp().currentUser.email);
                    self.model.set("created_at", Helpers.utcToUtcTimestamp());
                    self.model.set("status", "initialization");
                    var makeNo = Helpers.makeNoGoods(6, "CK0").toUpperCase();
                    self.model.set("movewarehouse_no", makeNo);
                }
                self.model.sync(method, self.model, {
                    success: function (model, respose, options) {

                    },
                    error: function (model, xhr, options) {
                        toastr.error('Lưu thông tin không thành công!');
                    }
                });
            });


            self.loadCombox();
            self.$el.find("#add-item").addClass("hide");
            var id = self.getApp().getRouter().getParam("id");
            if (id) {
                self.$el.find("#movewarehouse_no").text(self.model.get("movewarehouse_no"));
                // self.$el.find("#delivery").removeClass("hide");
            } else {
                // self.$el.find("#delivery").addClass("hide");
            }

            if (self.model.get("goodsreciept_from_id") != null) {
                self.$el.find("#add-item").removeClass("hide");
            }

            if (self.model.get("status") === "initialization") {
                self.$el.find("#status").text("Khởi tạo");
                self.$el.find("#delivery").removeClass("hide");
                self.$el.find("#confirm").addClass("hide");

            } else if (self.model.get("status") === "translation") {
                self.$el.find("#status").text("Đang chuyển");
                self.$el.find("#delivery").addClass("hide");
                self.$el.find("#confirm").removeClass("hide");

            } else if (self.model.get("status") === "finish") {
                self.$el.find("#status").text("Hoàn thành");
                // self.$el.find("#confirm").removeClass("hide");
                self.$el.find("#delivery").addClass("hide");
            }

            self.$el.find("#confirm").unbind("click").bind("click", function () {
                self.model.set("received_date", Helpers.utcToUtcTimestamp());
                self.model.set("status", "finish");
                self.$el.find(".save").trigger("click");
            });

            self.$el.find("#delivery").unbind("click").bind("click", function () {
                console.log(self.model.toJSON());
                if (!self.validate()) {
                    return;
                }
                self.model.set("delivery_date", Helpers.utcToUtcTimestamp());
                self.model.set("status", "translation");
                self.$el.find(".save").trigger("click");
                self.$el.find(".back").trigger("click");
            });
        },

        loadCombox: function () {
            loader.show();
            var self = this;
            $.ajax({
                url: self.getApp().serviceURL + "/api/v1/get-goodsreciept",
                success: function (response) {
                    loader.hide();
                    // console.log(response);
                    self.$el.find("#goodsreciept_from").combobox({
                        textField: "warehouse_name",
                        valueField: "id",
                        dataSource: response,
                        value: self.model.get("goodsreciept_from_id")
                    });
                },
                error: function (e) {
                    loader.hide();
                }
            });
            self.$el.find("#goodsreciept_from").on("change.gonrin", function (event) {
                // self.selectWarehouseFrom = self.$el.find("#goodsreciept_from").data("gonrin").getValue();
                self.model.set("goodsreciept_from", self.$el.find("#goodsreciept_from").data("gonrin").getText());
                self.model.set("goodsreciept_from_id", self.$el.find("#goodsreciept_from").data("gonrin").getValue());
                // self.$el.find("#goodsreciept_from").attr("data-id", self.$el.find("#goodsreciept_from").data("gonrin").getValue());
                self.$el.find("#add-item").removeClass("hide");
                self.$el.find("#from").attr("data-id", self.model.get("goodsreciept_from_id"));
            });

            self.$el.find("#from").attr("data-id", self.model.get("goodsreciept_from_id"));

            $.ajax({
                url: self.getApp().serviceURL + "/api/v1/get-goodsreciept",
                success: function (response) {
                    loader.hide();
                    self.$el.find("#goodsreciept_to").combobox({
                        textField: "warehouse_name",
                        valueField: "id",
                        dataSource: response,
                        value: self.model.get("goodsreciept_to_id")
                    });
                },
                error: function (e) {
                    loader.hide();
                }
            });

            self.$el.find("#goodsreciept_to").on("change.gonrin", function (event) {
                self.model.set("goodsreciept_to", self.$el.find("#goodsreciept_to").data("gonrin").getText());
                self.model.set("goodsreciept_to_id", self.$el.find("#goodsreciept_to").data("gonrin").getValue());
                // self.selectWarehouseTo = self.$el.find("#goodsreciept_to").data("gonrin").getValue();

                // if (self.selectWarehouseFrom === self.$el.find("#goodsreciept_to").data("gonrin").getValue()) {
                //     toastr.warning("Kho bị trùng");
                //     return;
                // }
                self.$el.find("#to").attr("data-id", self.model.get("goodsreciept_to_id"));
            });

            self.$el.find("#to").attr("data-id", self.model.get("goodsreciept_to_id"));
        },

        validate: function () {
            var self = this;
            if (!self.model.get("goodsreciept_to")) {
                toastr.warning("Vui lòng chọn kho!");
                return;
            } else if (!self.model.get("goodsreciept_from")) {
                toastr.warning("Vui lòng chọn kho!");
                return;
            } else if (self.$el.find("#to").attr("data-id") == self.$el.find("#from").attr("data-id")) {
                toastr.error("2 kho không được trùng nhau")
                return;
            }
            return true;
        }
    });

});