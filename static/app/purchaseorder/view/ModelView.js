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
                        success: function (model, respose, options) {
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
        showPurchaseOrderDetails: function () {
            var self = this;
            if (self.model.get('details').length != 0) {
                self.model.get('details').forEach(function (item, index) {
                    self.$el.find('#body-items').append(`
                    <tr class="item-update-list" id="${item.id}" >
                        <td style="width: 250px;position: relative;">
                            <input  type="text" id-item-update="${item.id}" class="form-control search-update" placeholder="Tìm kiếm" value ="${item.item_name}" id-item-update2 = "update-${item.item_id}-${item.purchase_cost}">
                            <div class="bg-white border list-update" id-list-update="${item.id}" style="display:none;max-height:150px;position: absolute;overflow: scroll;overflow-x: hidden;width:90%;z-index:1"/>
                        </td>
                        <td style="min-width: 170px; text-align: center;"><input type="text" warehouse-id-update="${item.warehouse_id}" warehouse-name-update="${item.warehouse_name}" item-update-id-giaban="${item.item_id}"  value ="${item.purchase_cost}" class="form-control gia-update"  item-update-giaban = "update-${item.item_id}-${item.purchase_cost}"></td>
                        <td style="min-width: 100px; text-align: center;"><input type="text"  class="form-control sl-update" value ="${item.quantity}"></td>
                        <td style="min-width: 170px; text-align: center;"><input type="text" class="form-control tinhtien-update"></td>
                        <td style="min-width: 170px; text-align: center;"><input type="text" class="form-control" value="${item.warehouse_name}"></td>
                        <td class="pt-4"><i class="fa fa-trash itemRemove" id-xoa="${item.id}" style="font-size: 17px"></i></td>
                    </tr>
                    `)
                })
                self.$el.find('.search-update').each(function (index, item) {
                    $(item).keyup(function () {
                        var seachUpdate = $(this);
                        var searchKey = $(this).val()
                        self.$el.find('.item-update').remove();
                        self.$el.find('.list-update[id-list-update=' + $(this).attr('id-item-update') + ']').show();
                        $.ajax({
                            type: "POST",
                            url: self.getApp().serviceURL + "/api/v1/list_item_in_warehouse",
                            data: JSON.stringify({ "tenant": self.getApp().currentTenant[0], "id": localStorage.getItem('warehouse_id'), "text": searchKey }),
                            success: function (res) {
                                res.forEach(function (itemSearch, index) {
                                    self.$el.find('.list-update').append(`
                                          <p class="item-update p-2 m-0" style="white-space: nowrap;overflow: hidden;
                                          text-overflow: ellipsis;width: 100%;" item-update-id = "${itemSearch.item_id}" purchase-cost = "${itemSearch.purchase_cost}"  item-name-update = "${itemSearch.item_name}">${itemSearch.item_name} - ${itemSearch.purchase_cost}VND-SL:${itemSearch.quantity} </p>
                                        `)
                                })
                                self.$el.find(".item-update").hover(function () {
                                    $(this).css("background-color", "#9da1a5");
                                }, function () {
                                    $(this).css("background-color", "white");
                                });
                                self.$el.find(".list-update").hover(function () { },
                                    function () {
                                        $(this).hide();
                                    }
                                );
                                self.$el.find(".item-update").unbind('click').bind('click', function () {
                                    seachUpdate.val($(this).attr('item-name-update'))
                                    var itemID = seachUpdate.attr('id-item-update2')
                                    self.$el.find('[item-update-giaban=' + itemID + ']').val($(this).attr('purchase-cost'))
                                    self.$el.find('[item-update-giaban=' + itemID + ']').attr('warehouse-id-update', localStorage.getItem('warehouse_id'))
                                    self.$el.find('[item-update-giaban=' + itemID + ']').attr('warehouse-name-update', localStorage.getItem('warehouse_name'))
                                    self.$el.find('[item-update-giaban=' + itemID + ']').attr('item-update-id-giaban', $(this).attr('item-update-id'))

                                    self.$el.find('.list-update').hide();
                                })
                            }
                        })
                    });
                })
                self.taxExcluded();
            }
        },
        listItemsOldRemove: function () {
            var self = this;
            self.$el.find('.itemRemove').unbind('click').bind('click', function () {
                self.$el.find('.item-update-list[id="' + $(this).attr('id-xoa') + '"]').remove();
                self.listItemRemove.push($(this).attr('id-xoa'))
            })
        },
        deleteItem: function () {
            var self = this;
            console.log(self.listItemRemove)
            var arrayItemRemove = self.listItemRemove.length;
            if (arrayItemRemove > 0) {
                $.ajax({
                    type: "POST",
                    url: self.getApp().serviceURL + "/api/v1/delete_purchaseorderdetails",
                    data: JSON.stringify(self.listItemRemove),
                    success: function (response) {
                        self.listItemRemove.splice(0, arrayItemRemove);
                        console.log(response)
                    }
                });
            }
        },
        updateItem: function () {
            var self = this;
            var arr = [];
            self.$el.find('.item-update-list').each(function (index, item) {
                var obj = {}
                obj.item_name = $(item).find('td .search-update').val();
                obj.purchase_cost = Number($(item).find('td .gia-update').val());
                obj.warehouse_id = $(item).find('td .gia-update').attr('warehouse-id-update');
                obj.warehouse_name = $(item).find('td .gia-update').attr('warehouse-name-update');
                obj.item_id = $(item).find('td .gia-update').attr('item-update-id-giaban');
                obj.quantity = Number($(item).find('td .sl-update').val());
                obj.purchaseorder_id = $(item).attr('id');
                arr.push(obj)
            })
            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/update_purchaseorderdetails",
                data: JSON.stringify(arr),
                success: function (res) {
                    console.log(res)
                }
            })
        },
        createItem: function (purchaseorder_id) {
            var self = this;
            var arr = [];
            self.$el.find('.onceRowItem').each(function (index, item) {
                var obj = {}
                obj.item_name = $(item).find('td .search-after').val();
                obj.purchase_cost = Number($(item).find('td .giaban').val());
                obj.warehouse_id = $(item).find('td .giaban').attr('warehouse_id');
                obj.warehouse_name = $(item).find('td .giaban').attr('warehouse_name');
                obj.item_id = $(item).find('td .giaban').attr('item-id-origin');
                obj.quantity = Number($(item).find('td .quantity').val());
                obj.purchaseorder_id = purchaseorder_id;
                arr.push(obj)
            })
            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/save_purchaseorderdetails",
                data: JSON.stringify({ "tenant": self.getApp().currentTenant[0], "data": arr }),
                success: function (res) {
                    console.log(res)
                }
            })
        },




        registerEvent: function () {
            var self = this;
            self.choseListWarehouse();
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
        loadWorkstation: function () {
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

        choseListWarehouse: function () {
            var self = this;
            var searchKey = null;
            var warehouse_id = null;
            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/list_warehouse",
                data: JSON.stringify(self.getApp().currentTenant[0]),
                success: function (res) {
                    loader.hide();
                    if (res) {
                        self.$el.find(".show-list-warehouse input").combobox({
                            textField: "name",
                            valueField: "id",
                            dataSource: res,
                            value: self.model.get("workstation_id")
                        });
                    }
                }
            })
            self.$el.find(".search").keyup(function (event) {
                searchKey = $(this).val()
                self.$el.find('.item').remove();
                self.$el.find('.list-item').show();
                $.ajax({
                    type: "POST",
                    url: self.getApp().serviceURL + "/api/v1/list_item_in_warehouse",
                    data: JSON.stringify({ "tenant": self.getApp().currentTenant[0], "id": warehouse_id, "text": searchKey }),
                    success: function (res) {
                        res.forEach(function (itemSearch, index) {
                            self.$el.find('.list-item').append(`
                              <p class="item p-2 m-0" style="white-space: nowrap;overflow: hidden;
                              text-overflow: ellipsis;width: 100%;" item-name="${itemSearch.item_name}" item-id="${itemSearch.item_id}" purchase-cost="${itemSearch.purchase_cost}">${itemSearch.item_name} - ${itemSearch.purchase_cost}VND-SL:${itemSearch.quantity} </p>
                            `)
                        })
                        self.$el.find(".item").hover(function () {
                            $(this).css("background-color", "#9da1a5");
                        }, function () {
                            $(this).css("background-color", "white");
                        });
                        self.$el.find(".list-item").hover(function () { },
                            function () {
                                $(this).hide();
                            }
                        );
                        self.$el.find(".item").unbind('click').bind('click', function () {
                            var itemID = $(this).attr('item-id') + "-" + $(this).attr('purchase-cost')
                            self.$el.find(".search").val('')
                            self.$el.find("#body-items").append(`
                            <tr class="onceRowItem" id-rm="${$(this).attr('item-id')}-${$(this).attr('purchase-cost')}">
                                <td style="width: 250px;position: relative;" class="item-td-after">
                                    <input  type="text" class="form-control search-after" placeholder="Tìm kiếm" item-id = "${$(this).attr('item-id')}-${$(this).attr('purchase-cost')}"  value ="${$(this).attr('item-name')}">
                                    <div class="bg-white border list-item-after" style="display:none;max-height:150px;position: absolute;overflow: scroll;overflow-x: hidden;width:90%;z-index:1"/>
                                </td>
                                <td style="min-width: 170px; text-align: center;"><input type="text" warehouse_name="${localStorage.getItem('warehouse_name')}" item-id-origin="${$(this).attr('item-id')}" warehouse_id="${warehouse_id}" value ="${$(this).attr('purchase-cost')}" class="form-control giaban" giaban-item-id = "${$(this).attr('item-id')}-${$(this).attr('purchase-cost')}" ></td>
                                <td style="min-width: 100px; text-align: center;"><input type="text" class="form-control quantity"></td>
                                <td style="min-width: 170px; text-align: center;"><input type="text" class="form-control "></td>
                                <td style="min-width: 170px; text-align: center;"><input type="text" class="form-control" value="${localStorage.getItem('warehouse_name')}" ></td>
                                <td class="pt-4"><i class="fa fa-trash rmove" id-rmove=${$(this).attr('item-id')}-${$(this).attr('purchase-cost')} style="font-size: 17px"></i></td>

                            </tr>
                            `)
                            self.$el.find('.rmove').unbind('click').bind('click', function (index, item) {
                                self.$el.find('[id-rm=' + $(this).attr('id-rmove') + ']').remove();
                            })
                            self.$el.find('[item-id=' + itemID + ']').keyup(function (event) {
                                var inputKeyup = $(this)
                                searchKey = inputKeyup.val()
                                self.$el.find('.item-after').remove();
                                console.log(inputKeyup.attr('item-id'))
                                inputKeyup.siblings('.list-item-after').show()
                                $.ajax({
                                    type: "POST",
                                    url: self.getApp().serviceURL + "/api/v1/list_item_in_warehouse",
                                    data: JSON.stringify({ "tenant": self.getApp().currentTenant[0], "id": warehouse_id, "text": searchKey }),
                                    success: function (res) {
                                        res.forEach(function (itemAfter, index) {
                                            inputKeyup.siblings('.list-item-after').append(`
                                                          <p class="item-after p-2 m-0" style="white-space: nowrap;overflow: hidden;
                                                          text-overflow: ellipsis;" item-id-origin="${itemAfter.item_id}" item-name="${itemAfter.item_name}" purchase-cost="${itemAfter.purchase_cost}">${itemAfter.item_name} - ${itemAfter.purchase_cost}VND-SL:${itemAfter.quantity} </p>
                                                        `)
                                        })
                                        self.$el.find(".item-after").unbind('click').bind('click', function () {
                                            inputKeyup.val($(this).attr('item-name'))
                                            self.$el.find('[giaban-item-id=' + itemID + ']').val($(this).attr('purchase-cost'))
                                            self.$el.find('[giaban-item-id=' + itemID + ']').attr('warehouse_id', warehouse_id)
                                            self.$el.find('[giaban-item-id=' + itemID + ']').attr('warehouse_name', localStorage.getItem('warehouse_name'))

                                            self.$el.find('[giaban-item-id=' + itemID + ']').attr('item-id-origin', $(this).attr('item-id-origin'))
                                            self.$el.find('.list-item-after').hide();
                                        })
                                        self.$el.find(".item-after").hover(function () {
                                            $(this).css("background-color", "#9da1a5");
                                        }, function () {
                                            $(this).css("background-color", "white");
                                        });
                                        self.$el.find(".list-item-after").hover(function () { },
                                            function () {
                                                $(this).hide();
                                            }
                                        );
                                    }
                                })
                            });
                        });
                    }
                })
            });
            self.showPurchaseOrderDetails(warehouse_id);
            self.$el.find(".show-list-warehouse input").on("change.gonrin", function (event) {
                warehouse_id = $(this).data("gonrin").getValue();
                var warehouse_name = $(this).data("gonrin").getText();
                self.model.set("warehouse_id", warehouse_id);
                localStorage.setItem("warehouse_id", warehouse_id)
                localStorage.setItem("warehouse_name", warehouse_name)

            });
        },
        taxExcluded: function () {
            var self = this;
            var New = self.$el.find('.item-update-list')
            // var Old = self.$el.find('.onceRowItem')
            // var bodyItem = [New, Old]
            New.each(function (indexBody,itemBody) {
                var gia= $(itemBody).find('td .gia-update').val()
                var sl = $(itemBody).find('td .sl-update').val()
                $(itemBody).find('td .tinhtien-update').val(gia * sl)
            })
        },
        updateItemBill: function () {
            var self = this;
            console.log(self.model.get('details'))
            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/update_purchaseorderdetails_item_bill",
                data: JSON.stringify(self.model.get('details')),
                success: function (res) {
                    console.log(res)
                }
            })
        },
    });

});
