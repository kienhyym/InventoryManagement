define(function(require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');



    var template = require('text!app/quanlykho/move-warehouse/tpl/model.html'),
        schema = require('json!schema/MoveWarehouseSchema.json');

    var ItemView = require("app/quanlykho/move-warehouse/view/Item");
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
        collectionName: "movewarehouse",
        selectWarehouseFrom: null,
        selectWarehouseTo: null,
        selectItemList: [],
        listItemRemove: [],
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

        tools: [{
            name: "defaultgr",
            type: "group",
            groupClass: "toolbar-group",
            buttons: [{
                    name: "back",
                    type: "button",
                    buttonClass: "btn btn-secondary btn-sm back",
                    label: "TRANSLATE:BACK",
                    command: function() {
                        var self = this;
                        Backbone.history.history.back();
                    }
                },
                {
                    name: "save",
                    type: "button",
                    buttonClass: "btn btn-primary font-weight-bold save btn-sm",
                    label: "TRANSLATE:SAVE",
                    command: function() {
                        var self = this;
                        var id = self.getApp().getRouter().getParam("id");
                        // if (!self.validate()) {
                        //     return;
                        // }
                        var method = "update";
                        if (!id) {
                            var method = "create";
                            self.model.set("created_at", Helpers.utcToUtcTimestamp());
                            var makeNo = Helpers.makeNoGoods(6, "CK0").toUpperCase();
                            self.model.set("movewarehouse_no", makeNo);
                            var tenant_id = self.getApp().currentTenant[0];
                            self.model.set("tenant_id", tenant_id);
                            self.model.set("status", "initialization")
                        }
                        self.model.sync(method, self.model, {
                            success: function(model, respose, options) {
                                self.createItem(model.id, self.getApp().currentTenant[0]);
                                self.updateItem();
                                self.deleteItem();
                                toastr.info("Lưu thông tin thành công");
                                self.getApp().getRouter().navigate(self.collectionName + "/collection");

                            },
                            error: function(model, xhr, options) {
                                // console.log(model)
                                toastr.error("Lưu không thành công")

                            }
                        });
                    }
                },
                {
                    name: "translation",
                    type: "button",
                    buttonClass: "btn btn-warning font-weight-bold btn-sm",
                    label: "Xác Nhận",
                    command: function() {
                        var self = this;
                        var id = self.getApp().getRouter().getParam("id");
                        // if (!self.validate()) {
                        //     return;
                        // }
                        self.model.set("status", "translation")

                        var method = "update";
                        if (!id) {
                            var method = "create";
                            self.model.set("created_at", Helpers.utcToUtcTimestamp());
                            var makeNo = Helpers.makeNoGoods(6, "CK0").toUpperCase();
                            self.model.set("movewarehouse_no", makeNo);
                            var tenant_id = self.getApp().currentTenant[0];
                            self.model.set("tenant_id", tenant_id);
                            self.model.set("status", "initialization")
                        }
                        self.model.sync(method, self.model, {
                            success: function(model, respose, options) {
                                self.createItem(model.id, self.getApp().currentTenant[0]);
                                self.updateItem();
                                self.deleteItem();
                                toastr.info("Lưu thông tin thành công");
                                self.getApp().getRouter().navigate(self.collectionName + "/collection");

                            },
                            error: function(model, xhr, options) {
                                // console.log(model)
                                toastr.error("Lưu không thành công")

                            }
                        });
                    }
                },
                {
                    name: "success",
                    type: "button",
                    buttonClass: "btn btn-success font-weight-bold  btn-sm",
                    label: "Hoàn thành",
                    command: function() {
                        var self = this;
                        var id = self.getApp().getRouter().getParam("id");
                        // if (!self.validate()) {
                        //     return;
                        // }
                        self.model.set("status", "success")

                        var method = "update";
                        if (!id) {
                            var method = "create";
                            self.model.set("created_at", Helpers.utcToUtcTimestamp());
                            var makeNo = Helpers.makeNoGoods(6, "CK0").toUpperCase();
                            self.model.set("movewarehouse_no", makeNo);
                            var tenant_id = self.getApp().currentTenant[0];
                            self.model.set("tenant_id", tenant_id);
                            self.model.set("status", "initialization")
                        }
                        self.model.sync(method, self.model, {
                            success: function(model, respose, options) {
                                self.createItem(model.id, self.getApp().currentTenant[0]);
                                self.updateItem();
                                self.deleteItem();
                                toastr.info("Lưu thông tin thành công");
                                self.getApp().getRouter().navigate(self.collectionName + "/collection");

                            },
                            error: function(model, xhr, options) {
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
                    visible: function() {
                        return this.getApp().getRouter().getParam("id") !== null;
                    },
                    command: function() {
                        var self = this;
                        self.model.destroy({
                            success: function(model, response) {
                                toastr.info('Xoá dữ liệu thành công');
                                self.getApp().getRouter().navigate(self.collectionName + "/collection");
                            },
                            error: function(model, xhr, options) {
                                toastr.error('Xoá dữ liệu không thành công!');

                            }
                        });
                    }
                },
            ],
        }],

        render: function() {
            var self = this;
            localStorage.removeItem("listItem");

            var id = this.getApp().getRouter().getParam("id");
            if (id) {
                this.model.set('id', id);
                this.model.fetch({
                    success: function(data) {
                        self.applyBindings();
                        self.regsiterEvent();
                        self.showDetail();
                        self.listItemsOldRemove();
                        if (self.model.get('warehouse_from_id') != null) {
                            self.$el.find('#list-item div input').removeAttr('disabled')
                        }

                    },
                    error: function() {
                        toastr.error("Lỗi hệ thống, vui lòng thử lại sau.");
                    },
                });
            } else {
                self.applyBindings();
                self.regsiterEvent();
            }

        },

        regsiterEvent: function() {
            var self = this;
            self.loadItemDropdown();
            self.loadCombox();

            self.$el.find("#add-item").addClass("hide");
            var id = self.getApp().getRouter().getParam("id");
            if (id) {
                self.$el.find("#movewarehouse_no").text(self.model.get("movewarehouse_no"));
            } else {}
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

            self.$el.find("#confirm").unbind("click").bind("click", function() {
                self.model.set("received_date", Helpers.utcToUtcTimestamp());
                self.model.set("status", "finish");
                self.$el.find(".save").trigger("click");
            });

            self.$el.find("#delivery").unbind("click").bind("click", function() {
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

        loadCombox: function() {
            loader.show();
            var self = this;
            var filters = {
                filters: {
                    "$and": [
                        { "tenant_id": { "$eq": self.getApp().currentTenant[0] } }
                    ]
                },
                order_by: [{ "field": "created_at", "direction": "desc" }]
            }
            $.ajax({
                type: "GET",
                url: self.getApp().serviceURL + "/api/v1/warehouse?results_per_page=100000&max_results_per_page=1000000",
                data: "q=" + JSON.stringify(filters),
                success: function(res) {
                    loader.hide();
                    if (res) {
                        self.$el.find("#warehouse_from").combobox({
                            textField: "warehouse_name",
                            valueField: "id",
                            dataSource: res.objects,
                            value: self.model.get("warehouse_from_id")
                        });
                        self.$el.find("#warehouse_to").combobox({
                            textField: "warehouse_name",
                            valueField: "id",
                            dataSource: res.objects,
                            value: self.model.get("warehouse_to_id")
                        });
                    }
                }
            })
            self.$el.find("#warehouse_from").on("change.gonrin", function(event) {
                self.model.set("warehouse_from_id", self.$el.find("#warehouse_from").data("gonrin").getValue());
                self.model.set("warehouse_from_name", self.$el.find("#warehouse_from").data("gonrin").getText());
                self.$el.find('#list-item div input').removeAttr('disabled')
            });
            self.$el.find("#warehouse_to").on("change.gonrin", function(event) {
                self.model.set("warehouse_to_id", self.$el.find("#warehouse_to").data("gonrin").getValue());
                self.model.set("warehouse_to_name", self.$el.find("#warehouse_to").data("gonrin").getText());
            });
        },

        validate: function() {
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
        },
        // CHỨC NĂNG CHỌN ITEM.?????????????????????????????????????????????????????
        chooseItemInListDropdownItem: function() {
            var self = this;
            self.$el.find('.dropdown-item-other').unbind('click').bind('click', function() {
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
                            <input selected-item-id = "${itemID}" col-type="NAME" class="form-control p-1" value="${dropdownItemClick.attr('item-name')}" readonly style="font-size:14px">
                        </div>
                        <div style="width: 190px;display: inline-block;text-align: center;padding: 5px;">
                            <input selected-item-id = "${itemID}" col-type="PURCHASE_COST" class="form-control text-center p-1" readonly purchase-cost = "${dropdownItemClick.attr('purchase-cost')}" value="${purchaseCostFormat} VNĐ" style="font-size:14px">
                        </div>
                        <div style="width: 190px; display: inline-block; text-align:center;padding: 5px;">
                            <input selected-item-id = "${itemID}" col-type="QUANTITY" type="number" class="form-control text-center p-1" title="Trong kho còn: ${dropdownItemClick.attr('quantity')}" value = "0" style="font-size:14px">
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
                self.$el.find('.dropdown-item-other').remove();
                var text = $(this).val()
                $.ajax({
                    type: "POST",
                    url: self.getApp().serviceURL + "/api/v1/assets_in_each_warehouse",
                    data: JSON.stringify({ "text": text, "tenant_id": self.getApp().currentTenant[0], "warehouse_id": self.model.get('warehouse_from_id') }),
                    success: function(response) {
                        console.log(response)
                        var count = response.length
                        self.$el.find('.dropdown-item-other').remove();
                        if (count > 0) {
                            response.forEach(function(item, index) {
                                self.$el.find('.dropdown-menu-item').append(`
                                    <button
                                    item-id = "${item.item_id}" 
                                    item-no = "${item.item_no}" 
                                    item-name = "${item.item_name}" 
                                    unit-id = "${item.unit_id}" 
                                    title="${item.item_name} - ${item.warehouse_name} - SL:${item.quantity}"
                                    purchase-cost = "${item.purchase_cost}"
                                    list-price = "${item.list_price}"
                                    quantity = "${item.quantity}"
                                    class="dropdown-item dropdown-item-other" style="text-overflow: ellipsis;overflow: hidden;white-space: nowrap;font-size:12px">${item.item_name} - ${item.warehouse_name} - SL:${item.quantity}</button>
                                    `)
                            })
                        }

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
                                <input selected-item-id = "${item.id}" col-type="PURCHASE_COST" class="form-control text-center p-1" readonly purchase-cost = "${item.purchase_cost}" value="${resultPurchaseCost} VNĐ" style="font-size:14px">
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
        createItem: function(move_warehouse_id, tenant_id) {
            var self = this;
            var arr = [];
            self.$el.find('.selected-item-new').each(function(index, item) {
                var obj = {
                    "move_warehouse_id": move_warehouse_id,
                    "item_id": $(item).attr('item-id'),
                    "item_no": $(item).attr('item-no'),
                    "unit_id": $(item).attr('unit-id'),
                    "list_price": $(item).attr('list-price'),
                    "item_name": $(item).find('[col-type="NAME"]').val(),
                    "tenant_id": tenant_id,
                    "warehouse_id": null,
                    "warehouse_from_id": String(self.model.get('warehouse_from_id')),
                    "warehouse_to_id": String(self.model.get('warehouse_to_id')),
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
                    data: JSON.stringify({ "data": arr, "item_balances_type": 'movewarehouse' }),
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
                    "warehouse_from_id": String(self.model.get('warehouse_from_id')),
                    "warehouse_to_id": String(self.model.get('warehouse_to_id')),
                }
                arr.push(obj)
            })
            if (arr.length > 0) {
                $.ajax({
                    type: "POST",
                    url: self.getApp().serviceURL + "/api/v1/update_itembalances",
                    data: JSON.stringify({ "arr": arr, "item_balances_type": "movewarehouse" }),
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


    });

});