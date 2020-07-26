define(function(require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');

    var template = require('text!app/quanlykho/goods-reciept/tpl/model.html'),
        schema = require('json!schema/GoodsRecieptSchema.json');

    var ContactView = require("app/quanlykho/contact/view/SelectView");
    var ItemView = require("app/quanlykho/goods-reciept/view/ItemView")
    var Helpers = require('app/base/view/Helper');
    var ItemDialogView = require("app/quanlykho/goods-reciept/view/ItemDialogView");
    var PaymentView = require("app/quanlykho/goods-reciept/view/Payment");

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
        collectionName: "goodsreciept",
        // changeDetails: [],
        // selectItemList: [],
        listItemRemove: [],
        refresh: true,
        uiControl: {
            fields: [{
                    field: "contact",
                    uicontrol: "ref",
                    textField: "contact_name",
                    foreignRemoteField: "id",
                    foreignField: "contact_id",
                    dataSource: ContactView
                },
                {
                    field: "net_amount",
                    uicontrol: "currency",
                    currency: currencyFormat,
                    cssClass: "text-right"
                },
                {
                    field: "amount",
                    uicontrol: "currency",
                    currency: currencyFormat,
                    cssClass: "text-right"
                },
                {
                    field: "discount_amount",
                    uicontrol: "currency",
                    currency: currencyFormat,
                    cssClass: "text-right"
                },
                {
                    field: "tax_amount",
                    uicontrol: "currency",
                    currency: currencyFormat,
                    cssClass: "text-right"
                },
                {
                    field: "discount_percent",
                    cssClass: "text-right"
                },
                {
                    field: "tax_percent",
                    cssClass: "text-right"
                },
                {
                    field: "taxtype",
                    uicontrol: "combobox",
                    textField: "text",
                    valueField: "value",
                    dataSource: [{
                            "value": "group",
                            "text": "Theo hoá đơn"
                        },
                        {
                            "value": "individual",
                            "text": "Theo hàng hoá"
                        },
                    ],
                    value: "male"
                },
                {
                    field: "payment_status",
                    uicontrol: "combobox",
                    textField: "text",
                    valueField: "value",
                    dataSource: [{
                            "value": "created",
                            "text": "Tạo yêu cầu"
                        },
                        {
                            "value": "confirm",
                            "text": "Đã duyệt yêu cầu"
                        },
                        {
                            "value": "done",
                            "text": "Đã về kho"
                        },
                        {
                            "value": "paid",
                            "text": "Đã thanh toán"
                        }
                    ]
                },
                {
                    field: "details",
                    uicontrol: false,
                    itemView: ItemView,
                    tools: [{
                        name: "create",
                        type: "button",
                        buttonClass: "btn btn-outline-secondary btn-fw btn-sm",
                        label: "<i class='fa fa-plus'></i>",
                        command: "create"
                    }, ],
                    toolEl: "#add-item"
                },
            ]
        },
        // tools: [
        //     {
        //         name: "defaultgr",
        //         type: "group",
        //         groupClass: "toolbar-group",
        //         buttons: [

        //         ],
        //     }],
        tools: [{
            name: "defaultgr",
            type: "group",
            groupClass: "toolbar-group",
            buttons: [{
                    name: "back",
                    type: "button",
                    buttonClass: "btn-dark btn-sm",
                    label: "TRANSLATE:BACK",
                    command: function() {
                        var self = this;
                        Backbone.history.history.back();
                    }
                },
                {
                    name: "save",
                    type: "button",
                    buttonClass: "btn-primary btn-sm",
                    label: "TRANSLATE:Lưu",
                    command: function() {
                        var self = this;
                        var id = self.getApp().getRouter().getParam("id");
                        if (id == null) {
                            var tenant_id = self.getApp().currentTenant[0];
                            self.model.set("tenant_id", tenant_id);
                            var makeNo = Helpers.makeNoGoods(6, "NH0").toUpperCase();
                            self.model.set("goodsreciept_no", makeNo);
                            var payNo = Helpers.makeNoGoods(6, "PM0").toUpperCase();
                            self.model.set("payment_no", payNo);
                        }
                        self.model.save(null, {
                            success: function(model, respose, options) {
                                self.createItem(respose.id, self.getApp().currentTenant[0]);
                                self.updateItem();
                                self.deleteItem();
                                self.getApp().notify("Lưu thông tin thành công");
                                self.getApp().getRouter().navigate(self.collectionName + "/collection");
                            },
                            error: function(xhr, status, error) {
                                try {
                                    if (($.parseJSON(error.xhr.responseText).error_code) === "SESSION_EXPIRED") {
                                        self.getApp().notify("Hết phiên làm việc, vui lòng đăng nhập lại!");
                                        self.getApp().getRouter().navigate("login");
                                    } else {
                                        self.getApp().notify({ message: $.parseJSON(error.xhr.responseText).error_message }, { type: "danger", delay: 1000 });
                                    }
                                } catch (err) {
                                    self.getApp().notify({ message: "Lưu thông tin không thành công" }, { type: "danger", delay: 1000 });
                                }
                            }
                        });


                    }
                },
                {
                    name: "delete",
                    type: "button",
                    buttonClass: "btn btn-danger btn-sm btn-delete hide",
                    label: "Xóa",
                    visible: function() {
                        return this.getApp().getRouter().getParam("id") !== null;
                    },
                    command: function() {
                        var self = this;

                        $.jAlert({
                            'title': 'Bạn có chắc muốn xóa?',
                            'content': '<button class="btn btn-sm btn-danger" id="yes">Có!</button><button class="btn btn-sm btn-light" id="no">Không</button>',
                            'theme': 'red',
                            'onOpen': function($el) {
                                $el.find("#yes").on("click", function() {
                                    self.getApp().saveLog("delete", "goodsreciept", self.model.get("goodsreciept_no"), null, null, self.model.get("details"), Helpers.utcToUtcTimestamp());
                                    self.model.destroy({
                                        success: function(model, response) {
                                            $el.closeAlert();
                                            if ($("body").hasClass("sidebar-icon-only")) {
                                                $("#btn-menu").trigger("click");
                                            }
                                            self.getApp().notify('Xoá dữ liệu thành công');
                                            self.getApp().getRouter().navigate(self.collectionName + "/collection");
                                        },
                                        error: function(xhr, status, error) {
                                            try {
                                                if (($.parseJSON(error.xhr.responseText).error_code) === "SESSION_EXPIRED") {
                                                    self.getApp().notify("Hết phiên làm việc, vui lòng đăng nhập lại!");
                                                    self.getApp().getRouter().navigate("login");
                                                } else {
                                                    self.getApp().notify({ message: $.parseJSON(error.xhr.responseText).error_message }, { type: "danger", delay: 1000 });
                                                }
                                            } catch (err) {
                                                self.getApp().notify({ message: "Xóa dữ liệu không thành công" }, { type: "danger", delay: 1000 });
                                            }
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
                    name: "confirm",
                    type: "button",
                    buttonClass: "btn btn-warning btn-sm btn-confirm hide",
                    label: "Duyệt yêu cầu",
                    visible: function() {
                        return this.getApp().getRouter().getParam("id") !== null;
                    },
                    command: function() {
                        loader.show();
                        var self = this;
                        var warehouseID = self.model.get("warehouse_id");
                        var items = self.model.get("details");
                        $.ajax({
                            method: "POST",
                            url: self.getApp().serviceURL + "/api/v1/warehouse/add-item",
                            data: JSON.stringify({
                                warehouse_id: warehouseID,
                                items: items,
                                user_id: self.getApp().currentUser.id
                            }),
                            success: function(response) {
                                if (response) {
                                    self.model.set("payment_status", "confirm");
                                    self.getApp().saveLog("confirm", "goodsreciept", self.model.get("goodsreciept_no"), null, null, self.model.get("details"), Helpers.utcToUtcTimestamp());
                                    self.model.save(null, {
                                        success: function(model, respose, options) {
                                            self.getApp().notify("Lưu thông tin thành công");
                                            self.getApp().getRouter().navigate(self.collectionName + "/collection");
                                            // self.createItem(respose.id);
                                            // self.updateItem();
                                            // self.deleteItem();
                                        },
                                        error: function(xhr, status, error) {
                                            try {
                                                if (($.parseJSON(error.xhr.responseText).error_code) === "SESSION_EXPIRED") {
                                                    self.getApp().notify("Hết phiên làm việc, vui lòng đăng nhập lại!");
                                                    self.getApp().getRouter().navigate("login");
                                                } else {
                                                    self.getApp().notify({ message: $.parseJSON(error.xhr.responseText).error_message }, { type: "danger", delay: 1000 });
                                                }
                                            } catch (err) {
                                                self.getApp().notify({ message: "Lưu thông tin không thành công" }, { type: "danger", delay: 1000 });
                                            }
                                        }
                                    });
                                }
                                loader.hide();
                            },
                            error: function() {
                                loader.hide();
                            }
                        })
                    }
                },
                {
                    name: "bill",
                    type: "button",
                    buttonClass: "btn-primary btn btn-sm btn-paid hide",
                    label: "Thanh toán",
                    visible: function() {
                        return this.getApp().getRouter().getParam("id") !== null;
                    },
                    command: function() {
                        var self = this;
                        var paymentView = new PaymentView({
                            "viewData": self.model.toJSON()
                        });
                        paymentView.dialog({
                            // size: "large"
                        });
                        paymentView.on("close", function(e) {
                            self.model.set("payment_status", "paid");
                            self.model.set("payment_no", e.payment_no);
                            self.getApp().saveLog("paid", "goodsreciept", self.model.get("goodsreciept_no"), null, null, self.model.get("details"), Helpers.utcToUtcTimestamp());
                            self.model.save(null, {
                                success: function(model, respose, options) {
                                    self.updateItemBill()
                                    self.getApp().notify("Lưu thông tin thành công");
                                    self.getApp().getRouter().navigate(self.collectionName + "/collection");
                                },
                                error: function(xhr, status, error) {
                                    try {
                                        if (($.parseJSON(error.xhr.responseText).error_code) === "SESSION_EXPIRED") {
                                            self.getApp().notify("Hết phiên làm việc, vui lòng đăng nhập lại!");
                                            self.getApp().getRouter().navigate("login");
                                        } else {
                                            self.getApp().notify({ message: $.parseJSON(error.xhr.responseText).error_message }, { type: "danger", delay: 1000 });
                                        }
                                    } catch (err) {
                                        self.getApp().notify({ message: "Lưu thông tin không thành công" }, { type: "danger", delay: 1000 });
                                    }
                                }
                            });
                        });

                    }
                },
            ],
        }],


        render: function() {
            var self = this;
            if (!$("body").hasClass("sidebar-icon-only")) {
                $("#btn-menu").trigger("click");
            }
            if (self.getApp().platforms == "ANDROID" || self.getApp().platforms == "IOS") {
                self.$el.find("#print").remove();
            }
            // self.changeDetails = [];
            var id = this.getApp().getRouter().getParam("id");
            if (id) {
                this.model.set('id', id);
                this.model.fetch({
                    success: function(data) {
                        self.applyBindings();
                        self.registerEvent();
                        self.showDetail();
                        self.listItemsOldRemove();
                        self.paymentStatus();
                        self.historyPay();
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
        // CHỨC NĂNG CHỌN ITEM.
        chooseItemInListDropdownItem: function() {
            var self = this;
            self.$el.find('.dropdown-item').unbind('click').bind('click', function() {
                var stt = self.$el.find('[col-type="STT"]').length + 1;
                var dropdownItemClick = $(this);
                var itemID = dropdownItemClick.attr('item-id') + '-' + dropdownItemClick.attr('purchase-cost')
                var purchaseCostFormat = new Number(dropdownItemClick.attr('purchase-cost')).toLocaleString("en-AU");
                self.$el.find('#list-item').before(`
                <div style="width: 955px;height: 50px;" selected-item-id = "${itemID}" class = "selected-item-new" 
                item-id = "${dropdownItemClick.attr('item-id')}"
                item-no = "${dropdownItemClick.attr('item-no')}"
                unit-id = "${dropdownItemClick.attr('unit-id')}"
                list-price = "${dropdownItemClick.attr('list-price')}"
                >
                    <div style="width: 45px; display: inline-block;text-align: center;padding: 5px;">
                        <input selected-item-id = "${itemID}" col-type="STT" class="form-control text-center p-1" value="${stt}" style="font-size:14px">
                    </div>
                    <div style="width: 290px;display: inline-block;padding: 5px;">
                        <input selected-item-id = "${itemID}" col-type="NAME" class="form-control p-1" value="${dropdownItemClick.attr('title')}" readonly style="font-size:14px">
                    </div>
                    <div style="width: 190px;display: inline-block;text-align: center;padding: 5px;">
                        <input selected-item-id = "${itemID}" col-type="PURCHASE_COST" class="form-control text-center p-1" purchase-cost = "${dropdownItemClick.attr('purchase-cost')}" value="${purchaseCostFormat} VNĐ" style="font-size:14px">
                    </div>
                    <div style="width: 190px; display: inline-block; text-align:center;padding: 5px;">
                        <input selected-item-id = "${itemID}" col-type="QUANTITY" type="number" class="form-control text-center p-1" value = "0" style="font-size:14px">
                    </div>
                    <div style="width: 190px;display: inline-block;text-align: center;padding: 5px;">
                        <input selected-item-id = "${itemID}" col-type="NET_AMOUNT" class="form-control text-center p-1" readonly style="font-size:14px">
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
                //Click PURCHASE_COST
            self.$el.find('[col-type="PURCHASE_COST"]').unbind('click').bind('click', function() {
                var pointer = $(this);
                pointer.val(pointer.attr('purchase-cost'));
            });
            //Out Click PURCHASE_COST
            self.$el.find('[col-type="PURCHASE_COST"]').focusout(function() {
                var pointerOutPurchaseCost = $(this);
                const promise = new Promise((resolve, reject) => {
                    var purchaseCostValueChange = pointerOutPurchaseCost.val();
                    //net-amount
                    if (purchaseCostValueChange == null || purchaseCostValueChange == '') {
                        purchaseCostValueChange = 0;
                    }
                    var selectedItemId = pointerOutPurchaseCost.attr('selected-item-id');
                    var pointerOutValueQuantity = self.$el.find('[col-type="QUANTITY"][selected-item-id = ' + selectedItemId + ']').val();
                    var netAmount = pointerOutValueQuantity * purchaseCostValueChange;
                    self.$el.find('[col-type="NET_AMOUNT"][selected-item-id = ' + selectedItemId + ']').attr('net-amount', netAmount);

                    var netAmountValueChange = new Number(netAmount).toLocaleString("en-AU");
                    self.$el.find('[col-type="NET_AMOUNT"][selected-item-id = ' + selectedItemId + ']').val(netAmountValueChange + " VNĐ");
                    //purchase-cost
                    pointerOutPurchaseCost.attr('purchase-cost', purchaseCostValueChange);
                    return resolve(pointerOutPurchaseCost.attr('purchase-cost', purchaseCostValueChange));
                })
                promise.then(function(number) {
                    var purchaseCostFormat = new Number(number.attr('purchase-cost')).toLocaleString("en-AU");
                    var purchaseCostFormatString = String(purchaseCostFormat) + ' VNĐ';
                    pointerOutPurchaseCost.val(purchaseCostFormatString);
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
                var pointerOutValuePurchaseCost = self.$el.find('[col-type="PURCHASE_COST"][selected-item-id = ' + selectedItemId + ']').attr('purchase-cost');
                var resultNetAmount = pointerOutValuePurchaseCost * pointerOutQuantity.val();
                self.$el.find('[col-type="NET_AMOUNT"][selected-item-id = ' + selectedItemId + ']').attr('net-amount', resultNetAmount);
                var resultNetAmountChange = new Number(resultNetAmount).toLocaleString("en-AU");
                self.$el.find('[col-type="NET_AMOUNT"][selected-item-id = ' + selectedItemId + ']').val(resultNetAmountChange + " VNĐ");
            });
        },
        loadItemDropdown: function() { // Đổ danh sách Item vào ô tìm kiếm
            var self = this;
            self.$el.find('.search-item').keyup(function name() {
                self.$el.find('.dropdown-item').remove();
                var text = $(this).val()
                $.ajax({
                    type: "POST",
                    url: self.getApp().serviceURL + "/api/v1/load_item_dropdown",
                    data: JSON.stringify({ "text": text, "tenant_id": self.getApp().currentTenant[0] }),
                    success: function(response) {
                        var count = response.length
                        response.forEach(function(item, index) {
                            self.$el.find('.dropdown-menu-item').append(`
                            <button
                            item-id = "${item.id}" 
                            item-no = "${item.item_no}" 
                            unit-id = "${item.unit_id}" 
                            title="${item.item_name}"
                            purchase-cost = "${item.purchase_cost}"
                            list-price = "${item.list_price}"
                            class="dropdown-item" style="text-overflow: ellipsis;overflow: hidden;white-space: nowrap;">${item.item_name}</button>
                            `)
                        })
                        if (count == 0) {
                            self.$el.find('.dropdown-menu-item').hide()
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
        showDetail: function() {
            var self = this;
            if (self.model.get('details').length > 0) {
                self.model.get('details').forEach(function(item, index) {
                    var resultPurchaseCost = new Number(item.purchase_cost).toLocaleString("en-AU");
                    var resultNetAmount = new Number(item.net_amount).toLocaleString("en-AU");
                    self.$el.find('#list-item').before(`
                    <div style="width: 955px;height: 50px;" selected-item-id = "${item.id}" class = "selected-item-old" >
                        <div style="width: 45px; display: inline-block;text-align: center;padding: 5px;">
                            <input selected-item-id = "${item.id}" col-type="STT" class="form-control text-center p-1" value="${index + 1}" style="font-size:14px">
                        </div>
                        <div style="width: 290px;display: inline-block;padding: 5px;">
                            <input selected-item-id = "${item.id}" col-type="NAME" class="form-control p-1" value="${item.item_name}" readonly style="font-size:14px">
                        </div>
                        <div style="width: 190px;display: inline-block;text-align: center;padding: 5px;">
                            <input selected-item-id = "${item.id}" col-type="PURCHASE_COST" class="form-control text-center p-1" purchase-cost = "${item.purchase_cost}" value="${resultPurchaseCost} VNĐ" style="font-size:14px">
                        </div>
                        <div style="width: 190px; display: inline-block; text-align:center;padding: 5px;">
                            <input selected-item-id = "${item.id}" col-type="QUANTITY" type="number" class="form-control text-center p-1" value = "${item.quantity}" style="font-size:14px">
                        </div>
                        <div style="width: 190px;display: inline-block;text-align: center;padding: 5px;">
                            <input selected-item-id = "${item.id}" col-type="NET_AMOUNT" class="form-control text-center p-1" net-amount="${item.net_amount}" value="${resultNetAmount} VNĐ" readonly style="font-size:14px">
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
        createItem: function(goodsreciept_id, tenant_id) {
            var self = this;
            var arr = [];
            self.$el.find('.selected-item-new').each(function(index, item) {
                var obj = {
                    "goodsreciept_id": goodsreciept_id,
                    "item_id": $(item).attr('item-id'),
                    "item_no": $(item).attr('item-no'),
                    "unit_id": $(item).attr('unit-id'),
                    "list_price": $(item).attr('list-price'),
                    "item_name": $(item).find('[col-type="NAME"]').val(),
                    "tenant_id": tenant_id,
                    "warehouse_id": self.model.get('warehouse_id'),
                    "warehouse_from_id": null,
                    "warehouse_to_id": null,
                    "quantity": $(item).find('[col-type="QUANTITY"]').val(),
                    "purchase_cost": $(item).find('[col-type="PURCHASE_COST"]').attr('purchase-cost'),
                    "net_amount": $(item).find('[col-type="NET_AMOUNT"]').attr('net-amount'),
                    "warehouse_name": null,
                }
                arr.push(obj)
            })
            if (arr.length > 0) {
                $.ajax({
                    type: "POST",
                    url: self.getApp().serviceURL + "/api/v1/create_itembalances",
                    data: JSON.stringify({ "data": arr, "item_balances_type": 'goodsreciept' }),
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
                    "warehouse_id": self.model.get('warehouse_id'),
                    "quantity": $(item).find('[col-type="QUANTITY"]').val(),
                    "purchase_cost": $(item).find('[col-type="PURCHASE_COST"]').attr('purchase-cost'),
                    "net_amount": $(item).find('[col-type="NET_AMOUNT"]').attr('net-amount'),
                }
                arr.push(obj)
            })
            if (arr.length > 0) {
                $.ajax({
                    type: "POST",
                    url: self.getApp().serviceURL + "/api/v1/update_itembalances",
                    data: JSON.stringify({ "arr": arr, "item_balances_type": "goodsreciept" }),
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


        // HẾT CHỨC NĂNG CHỌN ITEM XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
        registerEvent: function() {
            var self = this;
            self.loadItemDropdown();
            // self.changeDetails = self.model.get("details");
            self.loadCombox();
            // self.toggleEvent();
            // self.printScreen();

            if (self.model.get("payment_status") == "confirm" || self.model.get("payment_status") == "done") {
                self.$el.find(".save").addClass("hide");
                // self.$el.find(".btn-delete").addClass("hide");
                self.$el.find(".btn-confirm").addClass("hide");
            } else {
                self.$el.find(".save").removeClass("hide");
                // self.$el.find(".btn-delete").removeClass("hide");
                self.$el.find(".btn-confirm").removeClass("hide");
            }
            self.$el.find("#copy-no").unbind("click").bind("click", function(event) {
                var copyText = document.getElementById("text-copy");
                copyText.select();
                document.execCommand("copy");
                toastr.success("Copied success");
            });

            self.calculateItemAmounts();
            self.model.on("change:details", function() {
                self.calculateItemAmounts();
            });

            self.model.on("change:tax_amount", function() {
                self.caculateTaxAmount();
            });

            self.model.on("change:tax_percent", function() {
                if (self.model.get("tax_percent") > 100) {
                    self.model.set("tax_percent", 0);
                }
                self.caculateTaxPercent();
            });

            // init tax
            if (self.model.get("taxtype") === "individual") {
                self.$el.find("#tax_percent").attr("readonly", true);
                self.$el.find("#tax_amount").attr("readonly", true);
            } else {
                self.$el.find("#tax_percent").attr("readonly", false);
                self.$el.find("#tax_amount").attr("readonly", false);
            }

            self.model.on("change:taxtype", function(e) {
                if (e.changed) {
                    if (e.changed.taxtype === "individual") {
                        self.$el.find("#tax_percent").attr("readonly", true);
                        self.$el.find("#tax_amount").attr("readonly", true);
                    } else {
                        self.$el.find("#tax_percent").attr("readonly", false);
                        self.$el.find("#tax_amount").attr("readonly", false);
                    }
                }
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
                    quantity += item.quantity;
                    details[index].net_amount = parseFloat(item.purchase_cost) * parseFloat(item.quantity);
                    netAmount = netAmount + parseFloat(item.net_amount);
                });
            }

            self.$el.find("#total_quantity").val(quantity);
            self.$el.find("#total_item").val(totalItem);
            self.model.set("net_amount", netAmount);
            self.caculateTaxPercent();
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

        loadCombox: function() {
            loader.show();
            var self = this;
            var tenantID = self.getApp().currentTenant[0]
            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/get_all_warehouse_by_tenant",
                data: JSON.stringify({
                    tenant_id: tenantID,
                }),
                success: function(res) {
                    loader.hide();
                    if (res) {
                        self.$el.find("#warehouse").combobox({
                            textField: "warehouse_name",
                            valueField: "id",
                            dataSource: res,
                            value: self.model.get("warehouse_id")
                        });
                    }
                }
            })

            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/get_all_curency",
                data: JSON.stringify({
                    "tenant_id": tenantID
                }),
                success: function(res) {
                    loader.hide();
                    if (res) {
                        self.$el.find("#currency").combobox({
                            textField: "currency_name",
                            valueField: "id",
                            dataSource: res,
                            value: self.model.get("currency_id")
                        });
                    }
                }
            })

            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/get_all_organization_reseller",
                data: JSON.stringify({
                    tenant_id: tenantID
                }),
                success: function(res) {
                    loader.hide();
                    if (res) {
                        self.$el.find("#organization").combobox({
                            textField: "organization_name",
                            valueField: "id",
                            dataSource: res,
                            value: self.model.get("organization_id")
                        });
                    }
                }
            })

            self.$el.find("#organization").on("change.gonrin", function(event) {
                self.model.set("organization_id", self.$el.find("#organization").data("gonrin").getValue());
                self.model.set("organization_name", self.$el.find("#organization").data("gonrin").getText());
            });

            self.$el.find("#warehouse").on("change.gonrin", function(event) {
                self.model.set("warehouse_id", self.$el.find("#warehouse").data("gonrin").getValue());
                self.model.set("warehouse_name", self.$el.find("#warehouse").data("gonrin").getText());
            });
            self.$el.find("#currency").on("change.gonrin", function(event) {
                self.model.set("currency_id", self.$el.find("#currency").data("gonrin").getValue());
                self.model.set("currency_name", self.$el.find("#currency").data("gonrin").getText());
            });

        },

        printScreen: function() {
            var self = this;
            self.$el.find("#print").on("click", function() {
                var viewData = JSON.stringify(self.model.toJSON());
                // window.open('https://upstart.vn/inventory/#print-goodsreciept?viewdata=' + viewData);
                self.getApp().getRouter().navigate("print-goodsreciept?viewdata=" + viewData);

            });
        },

        validate: function() {
            var self = this;
            if (!self.model.get("warehouse_name")) {
                toastr.warning("Vui lòng chọn kho phù hợp");
                return;
            }
            return true;
        },

        bindPaymentStatus: function() {
            var self = this;
            if (self.model.get("payment_status") == "done") {
                self.$el.find("#payment_status").html(`<label style="width: 100%" class="badge badge-info">Đã về kho</label>`);
            } else if (self.model.get("payment_status") == "created") {
                self.$el.find("#payment_status").html(`<label style="width: 100%" class="badge badge-primary">Tạo yêu cầu</label>`);
            } else if (self.model.get("payment_status") == "pending") {
                self.$el.find("#payment_status").html(`<label style="width: 100% class="badge badge-danger">Chờ xử lý</label>`);
            } else if (self.model.get("payment_status") == "confirm") {
                self.$el.find("#payment_status").html(`<label style="width: 100%" class="badge badge-warning">Đã duyệt yêu cầu</label>`);
            } else if (self.model.get("payment_status") == "paid") {
                self.$el.find("#payment_status").html(`<label style="width: 100%" class="badge badge-success">Đã thanh toán</label>`);
            } else {
                return ``;
            }
        },

        toggleEvent: function() {
            var self = this;
            if (self.model.get("payment_status") == "confirm") {
                self.$el.find(".btn-paid").removeClass('hide');
                self.$el.find(".btn-confirm").hide();
                self.$el.find(".save").hide();
                self.$el.find(".btn-delete").hide();

            } else if (self.model.get("payment_status") == "paid") {
                self.$el.find(".btn-confirm").hide();
                self.$el.find(".save").hide();
                self.$el.find(".btn-paid").hide();
                self.$el.find(".btn-delete").hide();
            }
        },
        paymentStatus: function() {
            var self = this;

            if (self.model.get('payment_status') == "done") {
                self.$el.find('#payment_status').html(`<label style="width: 70px" class="badge badge-dark">Đã về kho</label>`)
            } else if (self.model.get('payment_status') == "created") {
                self.$el.find('#payment_status').html(`<label style="width: 70px" class="badge badge-primary">Tạo yêu cầu</label>`)
            } else if (self.model.get('payment_status') == "pending") {
                self.$el.find('#payment_status').html(`<label style="width: 70px class="badge badge-danger">Chờ xử lý</label>`)
            } else if (self.model.get('payment_status') == "confirm") {
                self.$el.find('#payment_status').html(`<label style="width: 90px" class="badge badge-warning">Đã duyệt yêu cầu</label>`)
            } else if (self.model.get('payment_status') == "debt") {
                self.$el.find('#payment_status').html(`<label style="width: 70px" class="badge badge-info">Còn nợ</label>`)
            } else if (self.model.get('payment_status') == "paid") {
                self.$el.find('#payment_status').html(`<label style="width: 90px" class="badge badge-success">Đã thanh toán</label>`)
            } else {
                return ``;
            }
        },
        historyPay: function() {
            var self = this;
            if (self.model.get('paymentdetails').length > 0) {
                self.$el.find('.lich-su-thanh-toan').append(`
                    <div class="row m-2">
                    <div class="col-1 text-center">
                    <label for="">STT</label>
                    </div>
                    <div class="col-4 text-center">
                    <label>Ngày thanh toán</label>
                    </div>
                    <div class="col-4 text-center">
                    <label for="">Số tiền</label>
                    </div>
                    <div class="col-3 text-center">
                    <label>xem chi tiết</label>
                    </div>
                </div>
                    `)
                self.model.get('paymentdetails').forEach(function(item, index) {
                    var amount = new Number(item.amount).toLocaleString("en-AU");
                    var itemCreatedAtFormat = Helpers.utcToLocal(item.goodsreciept_create_at * 1000, "DD/MM/YYYY HH:mm");
                    self.$el.find('.lich-su-thanh-toan').append(`
                    <div class="row m-2">
                        <div class="col-1 text-center">
                            <input type="text" class="form-control text-center"  disabled value="${index+1}">
                        </div>
                        <div class="col-4 text-center">
                            <input type="text" class="form-control text-center"  disabled value="${itemCreatedAtFormat}">
                        </div>
                        <div class="col-4 text-center">
                        <input type="text" class="form-control text-center"  disabled value="${amount} VNĐ">
                        </div>
                       
                        <div class="col-3 text-center">
                            <a href="#payment/model?id=${item.payment_id}" class="btn btn-secondary w-100" >Xem phiếu thanh toán</a>
                        </div>
                    </div>
                    `)
                })
            }
        }
    });

});