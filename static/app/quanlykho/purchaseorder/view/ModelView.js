define(function(require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');

    var template = require('text!app/quanlykho/purchaseorder/tpl/model.html'),
        schema = require('json!schema/PurchaseOrderSchema.json');

    var ItemView = require("app/quanlykho/purchaseorder/view/ItemView")
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
        listItemRemove: [],
        refresh: true,
        uiControl: {
            fields: [{
                    field: "details",
                    uicontrol: false,
                    itemView: ItemView,
                    tools: [{
                        name: "create",
                        type: "button",
                        buttonClass: "btn btn-outline-secondary btn-fw btn-sm",
                        label: "<i class='fa fa-plus'></i>",
                        command: "create"
                    }],
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
                    command: function() {
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
                    command: function() {
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
                            success: function(model, respose, options) {
                                self.createItem(model.id, self.getApp().currentTenant[0]);
                                self.updateItem();
                                self.deleteItem();
                                if ($("body").hasClass("sidebar-icon-only")) {
                                    $("#btn-menu").trigger("click");
                                }
                                toastr.info('Lưu thông tin thành công');
                                self.getApp().getRouter().navigate(self.collectionName + "/collection");
                            },
                            error: function(model, xhr, options) {
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
                    command: function() {
                        var self = this;
                        $.jAlert({
                            'title': 'Xác nhận?',
                            'content': '<button class="btn btn-sm btn-info" id="yes">Có!</button><button class="btn btn-sm btn-light" id="no">Không</button>',
                            'theme': 'blue',
                            'onOpen': function($el) {
                                $el.find("#yes").on("click", function() {
                                    self.model.set("payment_status", "confirm");
                                    self.getApp().saveLog("confirm", "purchaseorder", self.model.get("purchaseorder_no"), null, null, self.model.get("details"), Helpers.utcToUtcTimestamp());
                                    self.model.save(null, {
                                        success: function(model, respose, options) {
                                            toastr.info("Lưu thông tin thành công");
                                            $.ajax({
                                                url: "https://upstart.vn/accounts/api/v1/tenant/get_warehouse_users_roles?tenant_id=" + self.getApp().currentTenant[0] + "&tenant_role=user&warehouse_role=manager",
                                                success: function(res) {
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
                                                        }),
                                                        success: function(response) {
                                                            if ($("body").hasClass("sidebar-icon-only")) {
                                                                $("#btn-menu").trigger("click");
                                                            }
                                                        }
                                                    })
                                                },
                                                error: function(error) {
                                                    $el.closeAlert();
                                                }
                                            })
                                            self.getApp().getRouter().navigate(self.collectionName + "/collection");
                                            $el.closeAlert();
                                        },
                                        error: function(model, xhr, options) {
                                            toastr.error('Lưu thông tin không thành công!');
                                        }
                                    });
                                });
                                $el.find("#no").on("click", function() {
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
                    command: function() {
                        var self = this;
                        var details = self.model.get("details");
                        // var arr = {
                        //     details: details,
                        //     created_at: Helpers.utcToUtcTimestamp(),
                        //     deliverynote_no: Helpers.makeNoGoods(10, "PX0").toUpperCase(),
                        //     purchaseorder_id: self.model.get("id"),
                        //     purchaseorder_no: self.model.get("purchaseorder_no"),
                        //     tenant_id: self.getApp().currentTenant[0],
                        //     workstation_name: self.model.get("workstation_name"),
                        //     workstation_id: self.model.get("workstation_id"),
                        //     address: self.model.get("address"),
                        //     proponent: self.model.get("proponent"),
                        //     phone: self.model.get("phone")
                        // }
                        // $.ajax({
                        //     method: "POST",
                        //     url: self.getApp().serviceURL + "/api/v1/purchaseorder-add-to-deliverynote",
                        //     data: JSON.stringify(arr),
                        //     success: function (data) {
                        //         // console.log(data);
                        //         if (data) {
                        self.model.set("payment_status", "paid");
                        self.getApp().saveLog("paid", "purchaseorder", self.model.get("purchaseorder_no"), null, null, self.model.get("details"), Helpers.utcToUtcTimestamp());
                        self.model.save(null, {
                            success: function(model, respose, options) {
                                self.updateItemBill()
                                if ($("body").hasClass("sidebar-icon-only")) {
                                    $("#btn-menu").trigger("click");
                                }
                                toastr.success('Duyệt thông tin thành công');
                                self.getApp().getRouter().navigate(self.collectionName + "/collection");
                            },
                        });
                        //         }
                        //     },
                        //     error: function () {
                        //         toastr.error("Tạo không thành công");
                        //     }
                        // })
                    }
                },

                {
                    name: "user-cancel",
                    type: "button",
                    buttonClass: "btn-danger btn btn-sm btn-user-cancel hide",
                    label: "Hủy đơn hàng",
                    command: function() {
                        var self = this;
                        $.jAlert({
                            'title': 'Bạn có chắc muốn hủy?',
                            'content': '<button class="btn btn-sm btn-danger" id="yes">Có!</button><button class="btn btn-sm btn-light" id="no">Không</button>',
                            'theme': 'red',
                            'onOpen': function($el) {

                                $el.find("#yes").on("click", function() {
                                    self.model.set("payment_status", "user-cancel");
                                    self.getApp().saveLog("cancel", "purchaseorder", self.model.get("purchaseorder_no"), null, null, self.model.get("details"), Helpers.utcToUtcTimestamp());
                                    self.model.save(null, {
                                        success: function(model, respose, options) {
                                            $el.closeAlert();
                                            if ($("body").hasClass("sidebar-icon-only")) {
                                                $("#btn-menu").trigger("click");
                                            }
                                            toastr.info("Lưu thông tin thành công");
                                            self.getApp().getRouter().navigate(self.collectionName + "/collection");

                                        },
                                        error: function(model, xhr, options) {
                                            toastr.error('Lưu thông tin không thành công!');

                                        }
                                    });
                                });
                                $el.find("#no").on("click", function() {
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
                    command: function() {
                        var self = this;
                        $.jAlert({
                            'title': 'Bạn có chắc muốn hủy?',
                            'content': '<button class="btn btn-sm btn-danger" id="yes">Có!</button><button class="btn btn-sm btn-light" id="no">Không</button>',
                            'theme': 'red',
                            'onOpen': function($el) {
                                $el.find("#yes").on("click", function() {
                                    self.model.set("payment_status", "admin-cancel");
                                    self.getApp().saveLog("cancel", "purchaseorder", self.model.get("purchaseorder_no"), null, null, self.model.get("details"), Helpers.utcToUtcTimestamp());
                                    self.model.save(null, {
                                        success: function(model, respose, options) {
                                            $el.closeAlert();
                                            if ($("body").hasClass("sidebar-icon-only")) {
                                                $("#btn-menu").trigger("click");
                                            }
                                            toastr.info("Lưu thông tin thành công");
                                            self.getApp().getRouter().navigate(self.collectionName + "/collection");

                                        },
                                        error: function(model, xhr, options) {
                                            toastr.error('Lưu thông tin không thành công!');

                                        }
                                    });
                                });
                                $el.find("#no").on("click", function() {
                                    $el.closeAlert();
                                })
                            }
                        });
                    }
                },
            ],
        }],


        render: function() {
            var self = this;
            localStorage.removeItem("listItem");
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
                    success: function(data) {
                        self.applyBindings();
                        // self.$el.find("#show-propressbar").removeClass('hide');
                        // self.propressBar();
                        self.registerEvent();
                        self.showDetail();
                        self.listItemsOldRemove();
                        self.$el.find("#purchaseorder_no").html(self.model.get("purchaseorder_no"));
                        self.$el.find("#created_at").html(`${Helpers.utcToLocal(self.model.get("created_at") * 1000, "DD-MM-YYYY HH:mm")}`);
                    },
                    error: function() {
                        toastr.error('Lỗi hệ thống, vui lòng thử lại sau');
                    },
                });
            } else {
                self.applyBindings();
                self.registerEvent();
            }
        },
        registerEvent: function() {
            var self = this;
            self.loadItemDropdown();
            self.loadWorkstation();
            self.checkRole();
            self.bindPaymentStatus();
            self.printScreen();
            var id = self.getApp().getRouter().getParam("id");
            if (id) {
                self.$el.find("#purchaseorder_no").text(self.model.get("purchaseorder_no"));
            }
            self.calculateItemAmounts();
            self.model.on("change:details", function() {
                self.calculateItemAmounts();
            });
        },
        loadWorkstation: function() {
            var self = this;
            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/get_all_organization_customer",
                data: JSON.stringify({
                    tenant_id: self.getApp().currentTenant[0]
                }),
                success: function(res) {
                    loader.hide();
                    if (res) {
                        self.$el.find("#workstation").combobox({
                            textField: "organization_name",
                            valueField: "id",
                            dataSource: res,
                            value: self.model.get("workstation_id"),
                            template: `<span id="{{id}}" address ="{{ address }}">{{ organization_name }}</span>`,
                        });
                    }
                }
            })

            self.$el.find("#workstation").on("change.gonrin", function(event) {
                var diaChi = self.$el.find("[id=" + self.$el.find("#workstation").data("gonrin").getValue() + "]").attr('address')
                self.model.set("address", diaChi);
                self.model.set("workstation_id", self.$el.find("#workstation").data("gonrin").getValue());
                self.model.set("workstation_name", self.$el.find("#workstation").data("gonrin").getText());
            });
        },

        calculateItemAmounts: function() {
            const self = this;
            var details = clone(self.model.get("details"));
            var netAmount = 0;
            var quantity = 0;
            var totalItem = 0;

            if (details && Array.isArray(details)) {
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

        caculateTaxAmount: function() {
            const self = this;
            var netAmount = parseFloat(self.model.get("net_amount"));
            var saleorderDiscount = parseFloat(self.model.get("tax_amount"));
            var taxAmount = saleorderDiscount / netAmount * 100;
            self.model.set("tax_percent", Math.round(taxAmount * 100) / 100);
            var amount = parseFloat(netAmount + saleorderDiscount);
            self.model.set("amount", amount);
        },

        caculateTaxPercent: function() {
            const self = this;
            var netAmount = parseFloat(self.model.get("net_amount"));

            if (netAmount > 0) {
                var saleorderDiscount = netAmount / 100 * parseFloat(self.model.get("tax_percent"));
                self.model.set("tax_amount", saleorderDiscount);
                var amount = netAmount + saleorderDiscount;
                self.model.set("amount", amount);
            }
        },

        checkRole: function() {
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

        setVisibleDelivery: function() {
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

        bindPaymentStatus: function() {
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

        propressBar: function() {
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

        printScreen: function() {
            var self = this;
            self.$el.find("#print").on("click", function() {
                var viewData = JSON.stringify(self.model.toJSON());
                self.getApp().getRouter().navigate("print-purchaseorder?viewdata=" + viewData);

            });
        },
        // CHỨC NĂNG CHỌN ITEM.
        loadItemDropdown: function() { // Đổ danh sách Item vào ô tìm kiếm
            var self = this;
            self.$el.find('.search-item').keyup(function name() {
                var text = $(this).val()
                $.ajax({
                    type: "POST",
                    url: self.getApp().serviceURL + "/api/v1/assets_all_warehouse",
                    data: JSON.stringify({ "text": text, "tenant_id": self.getApp().currentTenant[0] }),
                    success: function(response) {
                        console.log('response', response)
                        self.$el.find('.dropdown-item').remove();
                        var count = response.length
                        if (count == 0) {
                            self.$el.find('.dropdown-menu-item').hide()
                        }
                        if (count > 0) {
                            response.forEach(function(item, index) {
                                self.$el.find('.dropdown-menu-item').append(`
                                <button
                                item-id = "${item.item_id}" 
                                item-no = "${item.item_no}" 
                                unit-id = "${item.unit_id}" 
                                item-name = "${item.item_name}" 
                                title="${item.item_name} - ${item.purchase_cost} vnđ - ${item.warehouse_name} - SL:${item.quantity}"
                                purchase-cost = "${item.purchase_cost}"
                                warehouse-id = "${item.warehouse_id}"
                                warehouse-name = "${item.warehouse_name}"
                                list-price = "${item.list_price}"
                                quantity = "${item.quantity}"
                                class="dropdown-item" style="text-overflow: ellipsis;overflow: hidden;white-space: nowrap;font-size:12px">${item.item_name} - ${item.purchase_cost} vnđ - ${item.warehouse_name} - SL:${item.quantity}</button>
                                `)
                            })
                        }
                        if (count == 1) {
                            self.$el.find('.dropdown-menu-item').css("height", "45px")
                            self.$el.find('.dropdown-menu-item').show()
                        }
                        if (count == 2) {
                            self.$el.find('.dropdown-menu-item').css("height", "80px")
                            self.$el.find('.dropdown-menu-item').show()
                        }
                        if (count > 2) {
                            self.$el.find('.dropdown-menu-item').css("height", "110px")
                            self.$el.find('.dropdown-menu-item').show()
                        }
                        self.chooseItemInListDropdownItem();
                    }
                });
            })
            self.$el.find('.out-click').bind('click', function() {
                self.$el.find('.dropdown-menu-item').hide()
            })
        },

        chooseItemInListDropdownItem: function() {
            var self = this;
            self.$el.find('.dropdown-item').unbind('click').bind('click', function() {
                var stt = self.$el.find('[col-type="STT"]').length + 1;
                var dropdownItemClick = $(this);
                var itemID = dropdownItemClick.attr('item-id') + '-' + dropdownItemClick.attr('purchase-cost') + '-' + dropdownItemClick.attr('warehouse-id')
                var listPriceFormat = new Number(dropdownItemClick.attr('list-price')).toLocaleString("en-AU");
                var purchaseCostFormat = new Number(dropdownItemClick.attr('purchase-cost')).toLocaleString("en-AU");

                self.$el.find('#list-item').before(`
                <div style="width: 955px;height: 50px;" selected-item-id = "${itemID}" class = "selected-item-new" 
                item-id = "${dropdownItemClick.attr('item-id')}"
                item-no = "${dropdownItemClick.attr('item-no')}"
                unit-id = "${dropdownItemClick.attr('unit-id')}"
                warehouse-id = "${dropdownItemClick.attr('warehouse-id')}"
                purchase-cost = "${dropdownItemClick.attr('purchase-cost')}"
                >
                    <div style="width: 45px; display: inline-block;text-align: center;padding: 5px;">
                        <input selected-item-id = "${itemID}" col-type="STT" class="form-control text-center p-1" value="${stt}">
                    </div>
                    <div style="width: 290px;display: inline-block;padding: 5px;">
                        <input selected-item-id = "${itemID}" col-type="NAME" class="form-control p-1" value="${dropdownItemClick.attr('item-name')}" readonly style="font-size:14px">
                    </div>
                    <div style="width: 150px;display: inline-block;text-align: center;padding: 5px;">
                        <input selected-item-id = "${itemID}" col-type="LIST_PRICE" class="form-control text-center p-1" list-price = "${dropdownItemClick.attr('list-price')}" value="${listPriceFormat} VNĐ" title="Giá nhập là: ${purchaseCostFormat} VNĐ" style="font-size:14px">
                    </div>
                    <div style="width: 90px; display: inline-block; text-align:center;padding: 5px;">
                        <input selected-item-id = "${itemID}" col-type="QUANTITY" type="number" class="form-control text-center p-1" value = "0" title="Trong kho còn: ${dropdownItemClick.attr('quantity')}" style="font-size:14px">
                    </div>
                    <div style="width: 190px;display: inline-block;text-align: center;padding: 5px;">
                        <input selected-item-id = "${itemID}" col-type="NET_AMOUNT" class="form-control text-center p-1" readonly style="font-size:14px">
                    </div>
                    <div style="width: 130px;display: inline-block;text-align: center;padding: 5px;">
                        <input selected-item-id = "${itemID}" col-type="WAREHOUSE" class="form-control text-center p-1" readonly value="${dropdownItemClick.attr('warehouse-name')}" style="font-size:14px">
                    </div>
                    <div style="width: 30px;display: inline-block;text-align: center;padding: 5px;">
                            <i selected-item-id = "${itemID}" class="fa fa-trash" style="font-size: 17px"></i>
                        </div>
                </div>
                `)
                self.$el.find('.dropdown-menu-item').hide()
                self.$el.find('.search-item').val('')
                self.clickPurchaseCost();
                self.$el.find('.selected-item-new div .fa-trash').unbind('click').bind('click', function() {
                    self.$el.find('.selected-item-new[selected-item-id="' + $(this).attr('selected-item-id') + '"]').remove();
                })
            })

        },
        clickPurchaseCost: function() {
            var self = this;
            self.$el.find('selected-item')
                //Click LIST_PRICE
            self.$el.find('[col-type="LIST_PRICE"]').unbind('click').bind('click', function() {
                var pointer = $(this);
                pointer.val(pointer.attr('list-price'));
            });
            //Out Click LIST_PRICE
            self.$el.find('[col-type="LIST_PRICE"]').focusout(function() {
                var pointerOutListPrice = $(this);
                const promise = new Promise((resolve, reject) => {
                    var listPriceValueChange = pointerOutListPrice.val();
                    //net-amount
                    if (listPriceValueChange == null || listPriceValueChange == '') {
                        listPriceValueChange = 0;
                    }
                    var selectedItemId = pointerOutListPrice.attr('selected-item-id');
                    var pointerOutValueQuantity = self.$el.find('[col-type="QUANTITY"][selected-item-id = ' + selectedItemId + ']').val();
                    var netAmount = pointerOutValueQuantity * listPriceValueChange;
                    self.$el.find('[col-type="NET_AMOUNT"][selected-item-id = ' + selectedItemId + ']').attr('net-amount', netAmount);

                    var netAmountValueChange = new Number(netAmount).toLocaleString("en-AU");
                    self.$el.find('[col-type="NET_AMOUNT"][selected-item-id = ' + selectedItemId + ']').val(netAmountValueChange + " VNĐ");
                    //list-price
                    pointerOutListPrice.attr('list-price', listPriceValueChange);
                    return resolve(pointerOutListPrice.attr('list-price', listPriceValueChange));
                })
                promise.then(function(number) {
                    var purchaseCostFormat = new Number(number.attr('list-price')).toLocaleString("en-AU");
                    var purchaseCostFormatString = String(purchaseCostFormat) + ' VNĐ';
                    pointerOutListPrice.val(purchaseCostFormatString);
                });
            });
            //Out Click NET_AMOUNT
            self.$el.find('[col-type="QUANTITY"]').focusout(function() {
                var pointerOutQuantity = $(this);
                var pointerOutQuantityValue = pointerOutQuantity.val();
                if (pointerOutQuantityValue == null || pointerOutQuantityValue == '') {
                    pointerOutQuantity.val(0)
                }
                var selectedItemId = pointerOutQuantity.attr('selected-item-id');
                var pointerOutValueListPrice = self.$el.find('[col-type="LIST_PRICE"][selected-item-id = ' + selectedItemId + ']').attr('list-price');
                var resultNetAmount = pointerOutValueListPrice * pointerOutQuantity.val();
                self.$el.find('[col-type="NET_AMOUNT"][selected-item-id = ' + selectedItemId + ']').attr('net-amount', resultNetAmount);
                var resultNetAmountChange = new Number(resultNetAmount).toLocaleString("en-AU");
                self.$el.find('[col-type="NET_AMOUNT"][selected-item-id = ' + selectedItemId + ']').val(resultNetAmountChange + " VNĐ");
            });
        },


        createItem: function(purchaseorder_id, tenant_id) {
            var self = this;
            var arr = [];
            self.$el.find('.selected-item-new').each(function(index, item) {
                var obj = {
                    "purchaseorder_id": purchaseorder_id,
                    "item_id": $(item).attr('item-id'),
                    "item_no": $(item).attr('item-no'),
                    "unit_id": $(item).attr('unit-id'),
                    "purchase_cost": $(item).attr('purchase-cost'),
                    "warehouse_id": $(item).attr('warehouse-id'),
                    "warehouse_from_id": null,
                    "warehouse_to_id": null,
                    "item_name": $(item).find('[col-type="NAME"]').val(),
                    "tenant_id": tenant_id,
                    "quantity": $(item).find('[col-type="QUANTITY"]').val(),
                    "warehouse_name": $(item).find('[col-type="WAREHOUSE"]').val(),
                    "list_price": $(item).find('[col-type="LIST_PRICE"]').attr('list-price'),
                    "net_amount": $(item).find('[col-type="NET_AMOUNT"]').attr('net-amount'),
                }
                arr.push(obj)
            })
            if (arr.length > 0) {
                $.ajax({
                    type: "POST",
                    url: self.getApp().serviceURL + "/api/v1/create_itembalances",
                    data: JSON.stringify({ "data": arr, "item_balances_type": 'purchaseorder' }),
                    success: function(response) {
                        console.log(response)
                    }
                });
            }

        },
        updateItem: function() {
            var self = this;
            var arr = [];
            self.$el.find('.selected-item-old').each(function(index, item) {
                var obj = {
                    "id": $(item).attr('selected-item-id'),
                    "quantity": $(item).find('[col-type="QUANTITY"]').val(),
                    "list_price": $(item).find('[col-type="LIST_PRICE"]').attr('list-price'),
                    "net_amount": $(item).find('[col-type="NET_AMOUNT"]').attr('net-amount'),
                }
                arr.push(obj)
            })
            if (arr.length > 0) {
                $.ajax({
                    type: "POST",
                    url: self.getApp().serviceURL + "/api/v1/update_itembalances",
                    data: JSON.stringify({ "arr": arr, "item_balances_type": "purchaseorder" }),
                    success: function(response) {
                        console.log(response)
                    }
                });
            }
        },
        listItemsOldRemove: function() {
            var self = this;
            self.$el.find('.selected-item-old div .fa-trash').unbind('click').bind('click', function() {
                self.$el.find('.selected-item-old[selected-item-id="' + $(this).attr('selected-item-id') + '"]').remove();
                self.listItemRemove.push($(this).attr('selected-item-id'))
            })
        },
        deleteItem: function() {
            var self = this;
            var arrayItemRemove = self.listItemRemove.length;
            if (arrayItemRemove > 0) {
                $.ajax({
                    type: "POST",
                    url: self.getApp().serviceURL + "/api/v1/delete_itembalances",
                    data: JSON.stringify(self.listItemRemove),
                    success: function(response) {
                        self.listItemRemove.splice(0, arrayItemRemove);
                        console.log(response)
                    }
                });
            }
        },
        showDetail: function() {
            var self = this;
            if (self.model.get('details').length > 0) {
                self.model.get('details').forEach(function(item, index) {
                    var resultListPrice = new Number(item.list_price).toLocaleString("en-AU");
                    var resultNetAmount = new Number(item.net_amount).toLocaleString("en-AU");
                    self.$el.find('#list-item').before(`
                    <div style="width: 955px;height: 50px;" selected-item-id = "${item.id}" class = "selected-item-old" >
                        <div style="width: 45px; display: inline-block;text-align: center;padding: 5px;">
                            <input selected-item-id = "${item.id}" col-type="STT" class="form-control text-center p-1" value="${index + 1}">
                        </div>
                        <div style="width: 290px;display: inline-block;padding: 5px;">
                            <input selected-item-id = "${item.id}" col-type="NAME" class="form-control p-1" value="${item.item_name}" readonly  style="font-size:14px">
                        </div>
                        <div style="width: 150px;display: inline-block;text-align: center;padding: 5px;">
                            <input selected-item-id = "${item.id}" col-type="LIST_PRICE" class="form-control text-center p-1" list-price = "${item.list_price}" value="${resultListPrice} VNĐ" style="font-size:14px">
                        </div>
                        <div style="width: 90px; display: inline-block; text-align:center;padding: 5px;">
                            <input selected-item-id = "${item.id}" col-type="QUANTITY" type="number" class="form-control text-center p-1" value = "${item.quantity}"  style="font-size:14px">
                        </div>
                        <div style="width: 190px;display: inline-block;text-align: center;padding: 5px;">
                            <input selected-item-id = "${item.id}" col-type="NET_AMOUNT" class="form-control text-center p-1" net-amount="${item.net_amount}" value="${resultNetAmount} VNĐ" readonly style="font-size:14px">
                        </div>
                        <div style="width: 130px;display: inline-block;text-align: center;padding: 5px;">
                            <input selected-item-id = "${item.id}" col-type="WAREHOUSE" class="form-control text-center p-1" value="${item.warehouse_name}" readonly style="font-size:14px">
                        </div>
                        <div style="width: 30px;display: inline-block;text-align: center;padding: 5px;">
                            <i selected-item-id = "${item.id}" class="fa fa-trash" style="font-size: 17px"></i>
                        </div>
                    </div>
                    `)
                })
                self.clickPurchaseCost();
            }
        },

        // HẾT CHỨC NĂNG CHỌN ITEM XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

    });

});