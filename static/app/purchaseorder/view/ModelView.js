define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');

    var template = require('text!app/purchaseorder/tpl/model.html'),
        schema = require('json!schema/PurchaseOrderSchema.json');

    var ItemView = require("app/purchaseorder/view/ItemView")
    var Helpers = require("app/base/view/Helper");

    var currencyFormat = {
        symbol: "VNĐ", // default currency symbol is '$'
        format: "%v %s", // controls output: %s = symbol, %v = value (can be object, see docs)
        decimal: ",", // decimal point separator
        thousand: ".", // thousands separator
        precision: 0, // decimal places
        grouping: 3 // digit grouping (not implemented yet)
    };


    return Gonrin.ModelView.extend({
        template: template,
        modelSchema: schema,
        urlPrefix: "/api/v1/",
        collectionName: "purchaseorder",

        refresh: true,
        uiControl: {
            fields: [{
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
                    }
                ],
                toolEl: "#add-item"
            },
            {
                field: "net_amount",
                uicontrol: "currency",
                currency: currencyFormat,
                cssClass: "text-right"
            },
            {
                field: "payment_status",
                uicontrol: "combobox",
                textField: "text",
                valueField: "value",
                dataSource: [{
                    "value": "request",
                    "text": "Tạo yêu cầu"
                },
                {
                    "value": "pending",
                    "text": "Chờ xử lý"
                },
                {
                    "value": "confirm",
                    "text": "Đã duyệt yêu cầu"
                },
                {
                    "value": "paid",
                    "text": "Đã thanh toán"
                }
                ]
            },

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
                    if ($("body").hasClass("sidebar-icon-only")) {
                        $("#btn-menu").trigger("click");
                    }
                    Backbone.history.history.back();
                }
            },
            {
                name: "save",
                type: "button",
                buttonClass: "btn-primary btn btn-sm btn-save",
                label: "TRANSLATE:SAVE",
                command: function () {
                    var self = this;
                    var id = self.getApp().getRouter().getParam("id");
                    var method = "update";
                    if (!id) {
                        var method = "create";
                        self.model.set("created_at", Helpers.utcToUtcTimestamp());
                        var makeNo = Helpers.makeNoGoods(6, "MH0").toUpperCase();
                        self.model.set("purchaseorder_no", makeNo);
                        self.model.set("tenant_id", self.getApp().currentTenant[0]);
                        self.getApp().saveLog("create", "purchaseorder", self.model.get("purchaseorder_no"), null, null, self.model.get("details"), Helpers.utcToUtcTimestamp());
                    }
                    self.getApp().saveLog("update", "purchaseorder", self.model.get("purchaseorder_no"), null, null, self.model.get("details"), Helpers.utcToUtcTimestamp());
                    self.model.sync(method, self.model, {
                        success: function (model, respose, options) {
                            if ($("body").hasClass("sidebar-icon-only")) {
                                $("#btn-menu").trigger("click");
                            }
                            toastr.info('Lưu thông tin thành công');
                            self.getApp().getRouter().navigate(self.collectionName + "/collection");
                        },
                        error: function (model, xhr, options) {
                            toastr.error('Đã có lỗi xảy ra');
                        }
                    });
                }
            },
            {
                name: "confirm",
                type: "button",
                buttonClass: "btn-warning btn btn-sm btn-confirm hide",
                label: "Duyệt yêu cầu",
                command: function () {
                    var self = this;
                    $.jAlert({
                        'title': 'Xác nhận?',
                        'content': '<button class="btn btn-sm btn-info" id="yes">Có!</button><button class="btn btn-sm btn-light" id="no">Không</button>',
                        'theme': 'blue',
                        'onOpen': function ($el) {
                            $el.find("#yes").on("click", function () {
                                self.model.set("payment_status", "confirm");
                                self.getApp().saveLog("confirm", "purchaseorder", self.model.get("purchaseorder_no"), null, null, self.model.get("details"), Helpers.utcToUtcTimestamp());
                                self.model.save(null, {
                                    success: function (model, respose, options) {
                                        toastr.info("Lưu thông tin thành công");
                                        $.ajax({
                                            url: "https://upstart.vn/accounts/api/v1/tenant/get_warehouse_users_roles?tenant_id=" + self.getApp().currentTenant[0] + "&tenant_role=user&warehouse_role=manager",
                                            success: function (res) {
                                                var listWarehouse = [];
                                                if (res) {
                                                    res.forEach(wareItem => {
                                                        listWarehouse.push(wareItem.user_id);
                                                    });
                                                }
                                                listWarehouse = lodash.uniq(listWarehouse);
                                                $.ajax({
                                                    type: "POST",
                                                    url: self.getApp().serviceURL + "/api/v1/send-notify-multiple-accountant",
                                                    data: JSON.stringify({
                                                        list_user: listWarehouse,
                                                        id: self.model.get("id"),
                                                        no: self.model.get("purchaseorder_no"),
                                                    }), success: function (response) {
                                                        // console.log(response);
                                                        if ($("body").hasClass("sidebar-icon-only")) {
                                                            $("#btn-menu").trigger("click");
                                                        }
                                                    }
                                                })
                                            }, error: function (error) {
                                                console.log(error);
                                                $el.closeAlert();
                                            }
                                        })
                                        self.getApp().getRouter().navigate(self.collectionName + "/collection");
                                        $el.closeAlert();
                                    },
                                    error: function (model, xhr, options) {
                                        toastr.error('Lưu thông tin không thành công!');
                                    }
                                });
                            });
                            $el.find("#no").on("click", function () {
                                $el.closeAlert();
                            })
                        }
                    });
                }
            },
            {
                name: "paid",
                type: "button",
                buttonClass: "btn-primary btn btn-sm btn-paid hide",
                label: "Tạo phiếu xuất",
                command: function () {
                    var self = this;
                    var details = self.model.get("details");
                    var arr = {
                        details: details,
                        created_at: Helpers.utcToUtcTimestamp(),
                        deliverynote_no: Helpers.makeNoGoods(10, "PX0").toUpperCase(),
                        purchaseorder_id: self.model.get("id"),
                        purchaseorder_no: self.model.get("purchaseorder_no"),
                        tenant_id: self.getApp().currentTenant[0],
                        workstation_name: self.model.get("workstation_name"),
                        workstation_id: self.model.get("workstation_id"),
                        address: self.model.get("address"),
                        proponent: self.model.get("proponent"),
                        phone: self.model.get("phone")
                    }
                    $.ajax({
                        method: "POST",
                        url: self.getApp().serviceURL + "/api/v1/purchaseorder-add-to-deliverynote",
                        data: JSON.stringify(arr),
                        success: function (data) {
                            // console.log(data);
                            if (data) {
                                self.model.set("payment_status", "paid");
                                self.getApp().saveLog("paid", "purchaseorder", self.model.get("purchaseorder_no"), null, null, self.model.get("details"), Helpers.utcToUtcTimestamp());
                                self.model.save(null, {
                                    success: function (model, respose, options) {
                                        if ($("body").hasClass("sidebar-icon-only")) {
                                            $("#btn-menu").trigger("click");
                                        }
                                        toastr.success('Duyệt thông tin thành công');
                                        self.getApp().getRouter().navigate("deliverynote/model?id=" + data.object_id);
                                    },
                                });
                            }
                        },
                        error: function () {
                            toastr.error("Tạo không thành công");
                        }
                    })
                }
            },

            {
                name: "user-cancel",
                type: "button",
                buttonClass: "btn-danger btn btn-sm btn-user-cancel hide",
                label: "Hủy đơn hàng",
                command: function () {
                    var self = this;
                    $.jAlert({
                        'title': 'Bạn có chắc muốn hủy?',
                        'content': '<button class="btn btn-sm btn-danger" id="yes">Có!</button><button class="btn btn-sm btn-light" id="no">Không</button>',
                        'theme': 'red',
                        'onOpen': function ($el) {

                            $el.find("#yes").on("click", function () {
                                self.model.set("payment_status", "user-cancel");
                                self.getApp().saveLog("cancel", "purchaseorder", self.model.get("purchaseorder_no"), null, null, self.model.get("details"), Helpers.utcToUtcTimestamp());
                                self.model.save(null, {
                                    success: function (model, respose, options) {
                                        $el.closeAlert();
                                        if ($("body").hasClass("sidebar-icon-only")) {
                                            $("#btn-menu").trigger("click");
                                        }
                                        toastr.info("Lưu thông tin thành công");
                                        self.getApp().getRouter().navigate(self.collectionName + "/collection");

                                    },
                                    error: function (model, xhr, options) {
                                        toastr.error('Lưu thông tin không thành công!');

                                    }
                                });
                            });
                            $el.find("#no").on("click", function () {
                                $el.closeAlert();
                            })
                        }
                    });
                }
            },

            {
                name: "admin-cancel",
                type: "button",
                buttonClass: "btn-danger btn btn-sm btn-admin-cancel hide",
                label: "Hủy đơn hàng",
                command: function () {
                    var self = this;
                    $.jAlert({
                        'title': 'Bạn có chắc muốn hủy?',
                        'content': '<button class="btn btn-sm btn-danger" id="yes">Có!</button><button class="btn btn-sm btn-light" id="no">Không</button>',
                        'theme': 'red',
                        'onOpen': function ($el) {

                            $el.find("#yes").on("click", function () {
                                // console.log("yes");
                                self.model.set("payment_status", "admin-cancel");
                                self.getApp().saveLog("cancel", "purchaseorder", self.model.get("purchaseorder_no"), null, null, self.model.get("details"), Helpers.utcToUtcTimestamp());
                                self.model.save(null, {
                                    success: function (model, respose, options) {
                                        $el.closeAlert();
                                        if ($("body").hasClass("sidebar-icon-only")) {
                                            $("#btn-menu").trigger("click");
                                        }
                                        toastr.info("Lưu thông tin thành công");
                                        self.getApp().getRouter().navigate(self.collectionName + "/collection");

                                    },
                                    error: function (model, xhr, options) {
                                        toastr.error('Lưu thông tin không thành công!');

                                    }
                                });
                            });
                            $el.find("#no").on("click", function () {
                                // console.log("no");
                                $el.closeAlert();
                            })
                        }
                    });
                }
            },
            ],
        }],


        render: function () {
            var self = this;
            if (!$("body").hasClass("sidebar-icon-only")) {
                $("#btn-menu").trigger("click");
            }
            if (self.getApp().platforms == "ANDROID" || self.getApp().platforms == "IOS") {
                self.$el.find("#print").remove();
            }

            var id = this.getApp().getRouter().getParam("id");
            if (id) {
                this.model.set('id', id);
                this.model.fetch({
                    success: function (data) {
                        self.applyBindings();
                        // self.$el.find("#show-propressbar").removeClass('hide');
                        // self.propressBar();
                        self.registerEvent();
                        self.$el.find("#created_at").html(`${Helpers.utcToLocal(self.model.get("created_at") * 1000, "DD-MM-YYYY HH:mm")}`);
                    },
                    error: function () {
                        toastr.error('Lỗi hệ thống, vui lòng thử lại sau');
                    },
                });
            } else {
                self.applyBindings();
                self.registerEvent();
            }
        },

        registerEvent: function () {
            var self = this;
            self.checkRole();
            self.bindPaymentStatus();
            self.printScreen();
            var id = self.getApp().getRouter().getParam("id");
            if (id) {
                self.$el.find("#purchaseorder_no").text(self.model.get("purchaseorder_no"));
            }
            self.calculateItemAmounts();
            self.model.on("change:details", function () {
                self.calculateItemAmounts();
            });
        },

        calculateItemAmounts: function () {
            const self = this;
            var details = clone(self.model.get("details"));
            var netAmount = 0;
            var quantity = 0;
            var totalItem = 0;

            if (details && Array.isArray(details)) {
                // console.log(details.length  + 1);
                totalItem += details.length;
                details.forEach((item, index) => {
                    if (item.quantity && item.list_price && item.net_amount) {
                        quantity += item.quantity;
                        details[index].net_amount = parseFloat(item.list_price) * parseFloat(item.quantity);
                        netAmount = netAmount + parseFloat(item.net_amount);
                    }
                });
            }

            self.$el.find("#total_quantity").val(quantity);
            self.$el.find("#total_item").val(totalItem);
            self.model.set("net_amount", netAmount);
            // self.caculateTaxPercent();
        },

        caculateTaxAmount: function () {
            const self = this;
            var netAmount = parseFloat(self.model.get("net_amount"));
            var saleorderDiscount = parseFloat(self.model.get("tax_amount"));
            var taxAmount = saleorderDiscount / netAmount * 100;
            self.model.set("tax_percent", Math.round(taxAmount * 100) / 100);
            var amount = parseFloat(netAmount + saleorderDiscount);
            self.model.set("amount", amount);
        },

        caculateTaxPercent: function () {
            const self = this;
            var netAmount = parseFloat(self.model.get("net_amount"));

            if (netAmount > 0) {
                var saleorderDiscount = netAmount / 100 * parseFloat(self.model.get("tax_percent"));
                self.model.set("tax_amount", saleorderDiscount);
                var amount = netAmount + saleorderDiscount;
                self.model.set("amount", amount);
            }
        },

        checkRole: function () {
            var self = this;
            // console.log("ROLE=================>", self.getApp().roleInfo);
            var roles = self.getApp().roleInfo;
            // if (roles === 1 || roles === "1" || roles === 2 || roles === "2") {
            //     self.$el.find(".btn-confirm").addClass('hide');
            // }

            if (roles === 4 || roles === "4") {
                // self.$el.find(".btn-confirm").removeClass('hide');
                // self.$el.find(".btn-user-cancel").removeClass('hide');

                if (self.model.get("payment_status") == "confirm") {
                    self.$el.find(".btn-confirm").addClass('hide');
                    self.$el.find(".btn-user-cancel").addClass('hide');

                } else if (self.model.get("payment_status") == "user-cancel") {
                    self.$el.find(".btn-confirm").addClass('hide');
                    self.$el.find(".btn-user-cancel").addClass('hide');
                    self.$el.find(".btn-delete").addClass('hide');
                    self.$el.find(".btn-paid").addClass('hide');

                } else if (self.model.get("payment_status") == "pending") {
                    self.$el.find(".btn-confirm").removeClass('hide');
                    self.$el.find(".btn-user-cancel").removeClass('hide');
                    self.$el.find(".btn-delete").addClass('hide');

                } else if (self.model.get("payment_status") == "paid") {
                    self.$el.find(".btn-confirm").addClass('hide');
                    self.$el.find(".btn-user-cancel").addClass('hide');
                    self.$el.find(".btn-delete").addClass('hide');
                    self.$el.find(".btn-paid").addClass('hide');
                    self.$el.find(".btn-save").addClass('hide');

                } else if (self.model.get("payment_status") == "admin-cancel") {
                    self.$el.find(".btn-confirm").addClass('hide');
                    self.$el.find(".btn-save").addClass('hide');
                    self.$el.find(".btn-paid").addClass('hide');
                    self.$el.find(".btn-user-cancel").addClass('hide');
                }
            } else {
                self.setVisibleDelivery();
            }
        },

        setVisibleDelivery: function () {
            var self = this;

            if (self.model.get("payment_status") == "pending") {
                self.$el.find(".btn-admin-cancel").removeClass('hide');
                self.$el.find(".btn-save").removeClass('hide');
                // self.$el.find(".btn-save").removeClass('hide');

            } else if (self.model.get("payment_status") == "confirm") {
                self.$el.find(".btn-paid").removeClass('hide');
                self.$el.find(".btn-save").hide();
                self.$el.find(".btn-confirm").hide();
                self.$el.find(".btn-admin-cancel").hide();

            } else if (self.model.get("payment_status") == "paid") {
                self.$el.find(".btn-confirm").hide();
                self.$el.find(".btn-save").hide();
                self.$el.find(".btn-paid").hide();
                self.$el.find(".btn-admin-cancel").hide();

            } else if (self.model.get("payment_status") == "admin-cancel") {
                self.$el.find(".btn-confirm").hide();
                self.$el.find(".btn-save").hide();
                self.$el.find(".btn-paid").hide();
                self.$el.find(".btn-admin-cancel").hide();
            } else if (self.model.get("payment_status") == "user-cancel") {
                self.$el.find(".btn-confirm").hide();
                self.$el.find(".btn-save").hide();
                self.$el.find(".btn-paid").hide();
                self.$el.find(".btn-user-cancel").hide();
                self.$el.find(".btn-admin-cancel").hide();
            }
            if (self.model.get("is_pos") === true) {
                self.$el.find("#description").attr("readonly", true);
                self.$el.find("#tax_code").attr("readonly", true);
                self.$el.find("#organization").attr("readonly", true);
                self.$el.find("#proponent").attr("readonly", true);
                self.$el.find("#phone").attr("readonly", true);
                self.$el.find("#address").attr("readonly", true);

            }
        },

        bindPaymentStatus: function () {
            var self = this;
            if (self.model.get("payment_status") == "user-cancel") {
                self.$el.find("#payment_status").html(`<label style="width: 100%" class="badge badge-danger">Người dùng hủy</label></label>`);
            } else if (self.model.get("payment_status") == "admin-cancel") {
                self.$el.find("#payment_status").html(`<label style="width: 100%" class="badge badge-danger">Quản lý hủy</label>`);
            } else if (self.model.get("payment_status") == "created") {
                self.$el.find("#payment_status").html(`<label style="width: 100%" class="badge badge-primary">Yêu cầu mới</label>`);
            } else if (self.model.get("payment_status") == "pending") {
                self.$el.find("#payment_status").html(`<label style="width: 100%" class="badge badge-info">Chờ xử lý</label>`);
            } else if (self.model.get("payment_status") == "confirm") {
                self.$el.find("#payment_status").html(`<label style="width: 100%" class="badge badge-warning">Đã duyệt yêu cầu</label>`);
            } else if (self.model.get("payment_status") == "paid") {
                self.$el.find("#payment_status").html(`<label style="width: 100%" class="badge badge-success">Đã thanh toán</label>`);
            } else {
                return ``;
            }
        },

        propressBar: function () {
            var self = this;
            var $progressDiv = self.$el.find("#progressBar");
            var $progressBar = $progressDiv.progressStep();
            $progressBar.addStep("Pending");
            $progressBar.addStep("Cancel");
            $progressBar.addStep("Confirm");
            $progressBar.addStep("Paid");
            // $progressBar.addStep("Schedule");
            var statusStep = self.model.get("payment_status");

            // $progressBar.setCurrentStep(0);
            // $progressBar.refreshLayout();
            switch (statusStep) {
                case "pending":
                    $progressBar.setCurrentStep(0);
                    $progressBar.refreshLayout();
                    break;
                case "user-cancel":
                    $progressBar.setCurrentStep(1);
                    $progressBar.refreshLayout();
                    break;
                case "admin-cancel":
                    $progressBar.setCurrentStep(1);
                    $progressBar.refreshLayout();
                    break;
                case "confirm":
                    $progressBar.setCurrentStep(2);
                    $progressBar.refreshLayout();
                    break;
                case "paid":
                    $progressBar.setCurrentStep(3);
                    $progressBar.refreshLayout();
                    break;
            }
        },

        printScreen: function () {
            var self = this;
            self.$el.find("#print").on("click", function () {
                var viewData = JSON.stringify(self.model.toJSON());
                self.getApp().getRouter().navigate("print-purchaseorder?viewdata=" + viewData);

            });
        },
    });

});
