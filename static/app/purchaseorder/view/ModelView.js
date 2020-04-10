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
        selectItemList: [],
        listItemRemove: [],
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
                            self.createItem(model.id);
                            self.updateItem();
                            self.deleteItem();
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
                    success: function (data) {
                        self.applyBindings();
                        // self.$el.find("#show-propressbar").removeClass('hide');
                        // self.propressBar();
                        self.registerEvent();
                        self.$el.find("#purchaseorder_no").html(self.model.get("purchaseorder_no"));
                        self.$el.find("#created_at").html(`${Helpers.utcToLocal(self.model.get("created_at") * 1000, "DD-MM-YYYY HH:mm")}`);
                        self.showSavedItem();
                        self.listItemsOldRemove();
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
            self.ShowListItem();
            self.loadWorkstation();
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
        loadWorkstation : function(){
            var self = this;
            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/get_workstation_tenant",
                data: JSON.stringify(self.getApp().currentTenant[0]),
                success: function (res) {
                    loader.hide();
                    if (res) {
                        self.$el.find("#workstation").combobox({
                            textField: "workstation_name",
                            valueField: "id",
                            dataSource: res,
                            value: self.model.get("workstation_id")
                        });
                    }
                }
            })

            self.$el.find("#workstation").on("change.gonrin", function (event) {
                self.model.set("workstation_id", self.$el.find("#workstation").data("gonrin").getValue());
                self.model.set("workstation_name", self.$el.find("#workstation").data("gonrin").getText());
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


        // ############################CHỨC NĂNG CHỌN ITEM ##########################################################


        createItem: function (purchaseorder_id) {
            var self = this;
            var arr = [];
            self.$el.find('.body-item-new').each(function (index, item) {
                var obj = {};
                obj.item_id = $(item).attr('item-id')
                obj.item_name = $(item).find('#item_name').attr('item-name')
                obj.list_price = Number($(item).find('td .list-price').val())
                obj.quantity = Number($(item).find('td .quantity').val())
                obj.net_amount = Number($(item).find('td .net-amount').val())
                arr.push(obj)
            })
            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/create_purchase_order_details_item",
                data: JSON.stringify({ "purchaseorder_id": purchaseorder_id, "data": arr }),
                success: function (res) {
                    console.log(res)
                }
            })
        },
        updateItem: function () {
            var self = this;
            var arr = [];
            self.$el.find('.body-item-old').each(function (index, item) {
                var obj = {};
                obj.item_id = $(item).attr('item-id')
                obj.list_price = Number($(item).find('td .list-price').val())
                obj.quantity = Number($(item).find('td .quantity').val())
                obj.net_amount = Number($(item).find('td .net-amount').val())
                arr.push(obj)
            })
            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/update_purchase_order_details_item",
                data: JSON.stringify(arr),
                success: function (res) {
                    console.log(res)
                }
            })
        },
        listItemsOldRemove: function () {
            var self = this;
            self.$el.find('.body-item-old .itemRemove').unbind('click').bind('click', function () {
                self.$el.find('.body-item-old[item-id="' + $(this).attr('item-id-xoa') + '"]').remove();
                self.listItemRemove.push($(this).attr('item-id-xoa'))
            })
        },
        deleteItem: function () {
            var self = this;
            var arrayItemRemove = self.listItemRemove.length;
            if (arrayItemRemove > 0) {
                $.ajax({
                    type: "POST",
                    url: self.getApp().serviceURL + "/api/v1/delete_purchase_order_details_item",
                    data: JSON.stringify(self.listItemRemove),
                    success: function (response) {
                        self.listItemRemove.splice(0, arrayItemRemove);
                        console.log(response)
                    }
                });
            }
        },

        showSavedItem: function () {
            var self = this;
            var savedItem = self.model.get('details')
            if (savedItem) {
                savedItem.forEach(function (item, index) {
                    self.$el.find('#body-items').append(`
                            <tr class="body-item-old" item-id="${item.id}" >
                            <td id="item_name" item-name="${item.item_name}">
                            ${item.item_name}
                            </td>
                            <td style="text-align: left;">
                                <input type="text" class="form-control list-price"  value="${item.list_price}" />
                            </td>
                            <td><input type="text" class="form-control quantity" value="${item.quantity}"/></td>
                            <td style="width: 160px"><input type="text" class="form-control net-amount" value="${item.net_amount}"  readonly /></td>
                            <td style="width: 50px; line-height: 34px; margin-top: 20px" >
                                <div class="itemRemove" item-id-xoa="${item.id}">
                                    <i class="fa fa-trash" style="font-size: 17px"></i>
                                </div>
                            </td>
                            </tr>
                        `)
                })
                self.taxExcluded();

            }
        },
        ShowListItem: function () {
            var self = this;
            self.$el.find('#show-list-item').unbind('click').bind('click', function () {
                self.pagination(null);
                self.inputSearch();
                self.$el.find('.chose-item').show()
                self.$el.find('.btn-quaylai').unbind('click').bind('click', function () {
                    self.$el.find('.chose-item').hide()
                })
            })
        },
        htmlShowItem: function (page_number, text) {
            var self = this;
            $.ajax({
                url: self.getApp().serviceURL + "/api/v1/get_data_item",
                method: "POST",
                data: JSON.stringify({ "page_number": page_number, "text": text }),
                contentType: "application/json",
                success: function (data) {
                    if (data.length != 0) {
                        data.forEach(function (item, index) {
                            self.$el.find('.trang-thiet-bi-y-te').append(`
                                    <div class="col-4 col-md-2 p-1 item-show" item-id="${item.id}" >
                                        <div class="text-center">
                                            <div title="${item.item_name}" style="margin-left: auto; margin-right: auto; left: 0px; right: 0px;width: 90px;height:170px;position: relative;">
                                                <input class="item-checkbox" item-id="${item.id}" type="checkbox" style="position: absolute; top: 0px; left: 0px;width:90px;height: 90px;opacity:0">
                                                <img src="static/img/user.png" style="width:90px;height: 90px;">
                                                <label class="item-chose" style="position: absolute;top:70px;right:3px;display:none"><i class="far fa-check-square text-success" aria-hidden="true"></i></label>
                                                <label class="item-not-chose"  style="position: absolute;top:70px;right:3px"><i class="far fa-square" aria-hidden="true"></i></label>
                                                <label class="item-name" list-price=${item.list_price}  style="font-size: 10px;width:100%;overflow: hidden;text-overflow: ellipsis;line-height: 20px;-webkit-line-clamp: 3;display: -webkit-box;-webkit-box-orient: vertical;">${item.item_name}</label>
                                                </div>
                                        </div>
                                    </div>
                                    `).fadeIn()
                        })
                        self.choseItem();
                        self.showSelectedItem()
                    }
                }
            })
        },
        inputSearch: function () {
            var self = this;
            self.$el.find("#input-search").keyup(function (e) {
                // xhr.abort()
                var text = $(this).val();
                self.pagination(text);
            })

        },
        choseItem: function () {
            var self = this;
            var selectItemList = self.selectItemList;
            self.$el.find('.item-checkbox').change(function (event) {
                var checkBox = $(this);
                var itemID = checkBox.attr('item-id');
                var itemName = checkBox.siblings('.item-name').text()
                var itemPurchaseCost = checkBox.siblings('.item-name').attr('list-price')

                if (event.target.checked) {
                    selectItemList.push({ "item_id": itemID, "item_name": itemName, "list_price": itemPurchaseCost })
                    checkBox.siblings('.item-chose').show();
                    checkBox.siblings('.item-not-chose').hide();
                    localStorage.setItem("listItem", JSON.stringify(selectItemList))
                }
                else {
                    checkBox.siblings('.item-chose').hide();
                    checkBox.siblings('.item-not-chose').show();
                    selectItemList.forEach(function (item, index) {
                        if (item.item_id === itemID) {
                            selectItemList.splice(index, 1);
                        }
                    })
                    localStorage.setItem("listItem", JSON.stringify(selectItemList))
                }
                self.showSelectedItem()
            })
        },
        showSelectedItem: function () {
            var self = this;
            var listSelectedItems = JSON.parse(localStorage.getItem("listItem"))
            var savedItemSelected = self.model.get('details')
            savedItemSelected.forEach(function (item, idnex) {
                if (listSelectedItems == null) {
                    listSelectedItems = []
                }
                listSelectedItems.push({ "item_id": item.item_id, "item_name": item.item_name, "list_price": item.list_price })
            })
            if (listSelectedItems != undefined && listSelectedItems != null) {
                listSelectedItems.forEach(function (item, index) {
                    var itemCheckBox = self.$el.find('.item-checkbox[item-id = ' + item.item_id + ']')
                    if (itemCheckBox.attr('item-id') == item.item_id) {
                        itemCheckBox.prop("checked", true);
                        itemCheckBox.siblings('.item-chose').show();
                        itemCheckBox.siblings('.item-not-chose').hide();
                    }
                })
                self.$el.find('.btn-hoantat').unbind('click').bind('click', function () {
                    self.$el.find('.chose-item').hide()
                    self.$el.find('.body-item-new').remove()
                    listSelectedItems.forEach(function (item, index) {
                        savedItemSelected.forEach(function (item2, index2) {
                            if (item.item_id == item2.item_id) {
                                listSelectedItems.splice(index, 1);
                            }
                        })
                    })
                    self.htmlShowSelectedItem(listSelectedItems);
                })
            }
        },
        taxExcluded: function () {
            var self = this;
            var bodyItemNew = self.$el.find('.body-item-new')
            var bodyItemOld = self.$el.find('.body-item-old')
            var bodyItem = [bodyItemNew, bodyItemOld]
            bodyItem.forEach(function (itemBody, indexBody) {
                if (itemBody.length > 0) {
                    itemBody.each(function (index, item) {
                        $(item).find('.quantity').change(function () {
                            if ($(item).find('.list-price').val() != null && $(item).find('.list-price').val() != '') {
                                var purchaseCost = $(item).find('.list-price').val();
                                var quantity = $(item).find('.quantity').val();
                                $(item).find('.net-amount').val(purchaseCost * quantity);
                            }
                        })
                        $(item).find('.list-price').change(function () {
                            if ($(item).find('.quantity').val() != null && $(item).find('.quantity').val() != '') {
                                var purchaseCost = $(item).find('.list-price').val();
                                var quantity = $(item).find('.quantity').val();
                                $(item).find('.net-amount').val(purchaseCost * quantity);
                            }
                        })
                    })
                }
            })
        },
        htmlShowSelectedItem: function (listSelectedItems) {
            var self = this;
            if (listSelectedItems) {
                listSelectedItems.forEach(function (item, index) {
                    self.$el.find('#body-items').append(`
                            <tr class="body-item-new" item-id="${item.item_id}" >
                            <td id="item_name" item-name="${item.item_name}">
                            ${item.item_name}
                            </td>
                            <td style="text-align: left;">
                                <input type="number" class="form-control list-price"  value="${item.list_price}" />
                            </td>
                            <td><input type="number" class="form-control quantity" /></td>
                            <td style="width: 160px"><input type="number" class="form-control net-amount"  readonly /></td>
                            <td style="width: 50px; line-height: 34px; margin-top: 20px" >
                                <div class="itemRemove" ind = "${index}">
                                    <i class="fa fa-trash" style="font-size: 17px"></i>
                                </div>
                            </td>
                            </tr>
                        `)
                })
                self.listItemsNewRemove(listSelectedItems);
                self.taxExcluded();
            }
        },
        listItemsNewRemove: function (listSelectedItems) {
            var self = this;
            self.$el.find('.body-item-new .itemRemove').unbind('click').bind('click', function () {
                $(self.$el.find('.body-item-new')[$(this).attr('ind')]).remove();
                listSelectedItems.splice($(this).attr('ind'), 1);
                localStorage.setItem('listItem', JSON.stringify(listSelectedItems))
                self.taxExcluded();
            })
        },
        pagination: function (text) {
            var self = this;
            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + '/api/v1/length_data',
                data: JSON.stringify(12),
                success: function (response) {
                    var lengthAllData = Math.ceil(response);
                    self.$el.find('.page-max').find('a').text(lengthAllData);
                    self.$el.find('.page-max,.page-3dot-max,.page-3dot-min,.page-min').hide()
                    if (lengthAllData > 4) {
                        self.$el.find('.page-3dot-max').show()
                    }
                    if (lengthAllData >= 6) {
                        self.$el.find('.page-max').show()
                    }
                    if (lengthAllData == 1) {
                        $(self.$el.find('.page-number')[2]).hide()
                        $(self.$el.find('.page-number')[3]).hide()
                        $(self.$el.find('.page-number')[4]).hide()
                    }
                    if (lengthAllData == 2) {
                        $(self.$el.find('.page-number')[3]).hide()
                        $(self.$el.find('.page-number')[4]).hide()
                    }
                    if (lengthAllData == 3) {
                        $(self.$el.find('.page-number')[4]).hide()
                    }
                    self.$el.find('.trang-thiet-bi-y-te').find('.item-show').remove();
                    self.htmlShowItem(0, text)
                    var page = self.$el.find('.page-number')



                    page.unbind('click').bind('click', function () {
                        self.$el.find('.trang-thiet-bi-y-te').find('.item-show').remove();
                        self.$el.find('.page-number').removeClass('active')
                        $(this).addClass('active')
                        var pageCurrent = Number($(this).find('a').text());
                        var pageFirst = Number($(page[1]).find('a').text());
                        var pageEnd = Number($(page[4]).find('a').text());

                        if (pageCurrent - pageFirst == 3) {
                            if (pageCurrent < lengthAllData) {
                                self.$el.find('.page-number').removeClass('active')
                                $(page[3]).addClass('active')
                                $(page[1]).find('a').html(pageCurrent - 2)
                                $(page[2]).find('a').html(pageCurrent - 1)
                                $(page[3]).find('a').html(pageCurrent)
                                $(page[4]).find('a').html(pageCurrent + 1)
                                pageFirst = Number($(page[1]).find('a').text());
                                pageEnd = Number($(page[4]).find('a').text());
                            }
                            if (pageCurrent == lengthAllData || lengthAllData - pageCurrent == 1) {
                                self.$el.find('.page-3dot-max').hide()
                            }
                        }
                        if (pageEnd - pageCurrent == 3) {
                            if (pageCurrent == 1) {
                                self.$el.find('.page-number').removeClass('active')
                                $(page[1]).addClass('active')
                                $(page[1]).find('a').html(pageCurrent)
                                $(page[2]).find('a').html(pageCurrent + 1)
                                $(page[3]).find('a').html(pageCurrent + 2)
                                $(page[4]).find('a').html(pageCurrent + 3)
                                pageFirst = Number($(page[1]).find('a').text());
                                pageEnd = Number($(page[4]).find('a').text());

                            }
                            if (pageCurrent > 1) {
                                self.$el.find('.page-number').removeClass('active')
                                $(page[2]).addClass('active')
                                $(page[1]).find('a').html(pageCurrent - 1)
                                $(page[2]).find('a').html(pageCurrent)
                                $(page[3]).find('a').html(pageCurrent + 1)
                                $(page[4]).find('a').html(pageCurrent + 2)
                                pageFirst = Number($(page[1]).find('a').text());
                                pageEnd = Number($(page[4]).find('a').text());
                            }
                            if (pageCurrent <= 2) {
                                self.$el.find('.page-3dot-min').hide()
                            }

                        }
                        if (lengthAllData - pageEnd >= 1) {
                            self.$el.find('.page-3dot-max').show()
                        }
                        if (lengthAllData - pageEnd < 2) {
                            self.$el.find('.page-3dot-max').hide()
                        }
                        else {
                            self.$el.find('.page-3dot-max').show()
                        }
                        if (lengthAllData - pageEnd < 1) {
                            self.$el.find('.page-max').hide()
                        }
                        else {
                            self.$el.find('.page-max').show()
                        }
                        if (pageFirst > 1) {
                            self.$el.find('.page-3dot-min').show()
                        }
                        if (pageFirst > 2) {
                            self.$el.find('.page-min').show()
                        }
                        else {
                            self.$el.find('.page-min').hide()
                        }
                        self.htmlShowItem(pageCurrent - 1, text);

                    })
                    self.$el.find('.page-min').unbind('click').bind('click', function () {
                        self.$el.find('.trang-thiet-bi-y-te').find('.item-show').remove();
                        self.$el.find('.page-number').removeClass('active')
                        $(page[1]).addClass('active')
                        $(page[1]).find('a').html(1)
                        $(page[2]).find('a').html(2)
                        $(page[3]).find('a').html(3)
                        $(page[4]).find('a').html(4)
                        self.$el.find('.page-min,.page-3dot-min').hide()
                        self.$el.find('.page-max,.page-3dot-max').show()
                        self.htmlShowItem(0, text);
                    })
                    self.$el.find('.page-max').unbind('click').bind('click', function () {
                        self.$el.find('.trang-thiet-bi-y-te').find('.item-show').remove();
                        self.$el.find('.page-number').removeClass('active')
                        $(page[4]).addClass('active')
                        $(page[1]).find('a').html(lengthAllData - 3)
                        $(page[2]).find('a').html(lengthAllData - 2)
                        $(page[3]).find('a').html(lengthAllData - 1)
                        $(page[4]).find('a').html(lengthAllData)
                        self.$el.find('.page-min,.page-3dot-min').show()
                        self.$el.find('.page-max,.page-3dot-max').hide()
                        self.htmlShowItem(lengthAllData - 1, text);
                    })
                }
            });

        },
        // ############################ HẾT CHỨC NĂNG CHỌN ITEM ##########################################################

    });

});
