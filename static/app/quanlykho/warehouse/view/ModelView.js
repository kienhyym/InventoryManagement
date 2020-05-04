define(function(require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');

    var template = require('text!app/quanlykho/warehouse/tpl/model.html'),
        schema = require('json!schema/WarehouseSchema.json');

    // var OrganizationView = require("app/view/organization/view/SelectView")
    // var ItemView = require("app/view/warehouse/view/ItemBalances");

    var Helpers = require('app/base/view/Helper');
    var TemplateHelper = require('app/base/view/TemplateHelper');
    var CustomFilterView = require('app/base/view/CustomFilterView');

    return Gonrin.ModelView.extend({
        template: template,
        modelSchema: schema,
        urlPrefix: "/api/v1/",
        collectionName: "warehouse",
        selectItemList: [],
        listItemRemove: [],
        uiControl: {
            fields: [
                // {
                // 	field: "organization",
                // 	uicontrol: "ref",
                // 	textField: "organization_name",
                // 	foreignRemoteField: "id",
                // 	foreignField: "organization_id",
                // 	dataSource: OrganizationView
                // },

                // {
                // 	field: "details",
                // 	uicontrol: false,
                // 	itemView: ItemView,
                // 	tools: [
                // 		{
                // 			name: "create",
                // 			type: "button",
                // 			buttonClass: "btn btn-outline-secondary btn-fw btn-sm",
                // 			label: "<i class='fa fa-plus'></i>",
                // 			command: "create"
                // 		},
                // 	],
                // 	toolEl: "#add-item"
                // },

                // {
                // 	field: "deleted",
                // 	uicontrol: "combobox",
                // 	textField: "text",
                // 	valueField: "value",
                // 	dataSource: [
                // 		{ "value": false, "text": "Hoạt động" },
                // 		{ "value": true, "text": "Ngừng hoạt động" }
                // 	],
                // }
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
                        Backbone.history.history.back();
                    }
                },
                {
                    name: "save",
                    type: "button",
                    buttonClass: "btn-primary btn-sm",
                    label: "TRANSLATE:SAVE",
                    command: function() {
                        var self = this;
                        var id = self.getApp().getRouter().getParam("id");
                        // if (!self.validate()) {
                        // 	return;
                        // }
                        var method = "update";
                        if (!id) {
                            var method = "create";
                            self.model.set("tenant_id", self.getApp().currentTenant[0]);
                        }
                        self.model.save(null, {
                            success: function(model, respose, options) {
                                console.log(respose)
                                self.createItem(respose.id, self.getApp().currentTenant[0]);
                                self.updateItem();
                                self.deleteItem();
                                toastr.info("Lưu thông tin thành công");
                                self.getApp().getRouter().navigate(self.collectionName + "/collection");
                            },
                            error: function(xhr, error) {
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
                    name: "success",
                    type: "button",
                    buttonClass: "btn-success btn-sm btn-chotkho",
                    label: "Chốt kho",
                    command: function() {
                        var self = this;
                        var id = self.getApp().getRouter().getParam("id");
                        // if (!self.validate()) {
                        // 	return;
                        // }
                        var method = "update";
                        self.model.set("status", "success");

                        if (!id) {
                            var method = "create";
                            self.model.set("tenant_id", self.getApp().currentTenant[0]);
                        }
                        self.model.save(null, {
                            success: function(model, respose, options) {
                                console.log(respose)
                                self.createItem(respose.id, self.getApp().currentTenant[0]);
                                self.updateItem();
                                self.deleteItem();
                                toastr.info("Lưu thông tin thành công");
                                self.getApp().getRouter().navigate(self.collectionName + "/collection");
                            },
                            error: function(xhr, error) {
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
                // {
                // 	name: "delete",
                // 	type: "button",
                // 	buttonClass: "btn-danger btn btn-sm",
                // 	label: "TRANSLATE:DELETE",
                // 	visible: function () {
                // 		return this.getApp().getRouter().getParam("id") !== null;
                // 	},
                // 	command: function () {
                // 		var self = this;
                // 		self.model.destroy({
                // 			success: function (model, response) {
                // 				toastr.info('Xoá dữ liệu thành công');
                // 				self.getApp().getRouter().navigate(self.collectionName + "/collection");
                // 			},
                // 			error: function (model, xhr, options) {
                // 				toastr.error('Xoá dữ liệu không thành công!');

                // 			}
                // 		});
                // 	}
                // },
            ],
        }],


        render: function() {
            var self = this;
            self.$el.find('.chothanghoa').unbind('click').bind('click', function() {
                self.model.set('status_init', 'chot')
            })
            var id = this.getApp().getRouter().getParam("id");
            if (id) {
                this.model.set('id', id);
                this.model.fetch({
                    success: function(data) {
                        if (self.model.get('status_init') == 'chot') {
                            self.$el.find('.chothanghoa').hide();
                            self.$el.find('#show-list-item').removeAttr('id')
                        }
                        self.applyBindings();
                        self.showDetail();
                        self.listItemsOldRemove()
                        self.loadItemDropdown();
                        if (self.model.get('status') == "success") {
                            self.$el.find('.btn-chotkho').hide()
                            self.$el.find('#list-item div').hide();
                        }

                        if (self.model.get('status_init') == 'chot') {
                            self.$el.find('.body-item-old').hide();
                        }
                    },
                    error: function() {
                        toastr.error("Get data Eror");
                    },
                });
            } else {
                self.applyBindings();
                self.loadItemDropdown();


            }
        },

        loadData: function(data) {
            var self = this;
            self.$el.find("#grid").grid({
                refresh: true,
                primaryField: "id",
                pagination: {
                    page: 1,
                    pageSize: 8
                },
                fields: [
                    { field: "item_no", label: "Mã", width: "150px" },
                    {
                        field: "",
                        label: "ĐVT",
                        template: function(rowObj) {
                            if (rowObj.unit_code) {
                                return `<div style="min-width: 100px">${rowObj.unit_code}</div>`;
                            } else {
                                return `<div style="min-width: 100px"></div>`;
                            }
                        }
                    },
                    {
                        field: "item_name",
                        label: "Tên hàng hóa",
                        template: function(rowObject) {
                            return `<div style="min-width: 140px;">${rowObject.item_name}</div>`;
                        }
                    },
                    {
                        field: "specification",
                        label: "Quy cách",
                        template: function(rowObject) {
                            if (rowObject.specification) {
                                return `<div style="min-width: 140px">${rowObject.specification}</div>`;
                            } else {
                                return `<div style="min-width: 70px"></div>`;
                            }
                        }
                    },
                    {
                        field: "",
                        label: "Tồn kho",
                        template: function(rowObject) {
                            return `<div style="min-width: 120px">${rowObject.quantity}</div>`;
                        }
                    },
                    {
                        field: "deleted",
                        label: " ",
                        template: function(rowObj) {
                            return TemplateHelper.statusRender(!rowObj.deleted);
                        }
                    }
                ],
                dataSource: data.object_data,

            });
        },
        validate: function() {
            var self = this;
            if (!self.model.get("organization")) {
                toastr.error("Vui lòng chọn công ty")
                return;
            } else if (!self.model.get("warehouse_name")) {
                toastr.error("Vui lòng nhập tên kho");
                return;
            } else if (!self.model.get("warehouse_no")) {
                toastr.error("Vui lòng nhập mã kho");
                return;
            }
            return true;
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
            if (self.model.get('status') != "success") {
                if (self.model.get('details').length > 0) {
                    var stt = 0;
                    self.model.get('details').forEach(function(item, index) {
                        if (item.item_balances_type == "warehouse") {
                            stt++;
                            var resultPurchaseCost = new Number(item.purchase_cost).toLocaleString("en-AU");
                            var resultNetAmount = new Number(item.net_amount).toLocaleString("en-AU");
                            self.$el.find('#list-item').before(`
                            <div style="width: 955px;height: 50px;" selected-item-id = "${item.id}" class = "selected-item-old" >
                                <div style="width: 45px; display: inline-block;text-align: center;padding: 5px;">
                                    <input selected-item-id = "${item.id}" col-type="STT" class="form-control text-center p-1" value="${stt}" style="font-size:14px">
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
                        }
                    })
                    self.clickPurchaseCost();
                }
            } else {
                $.ajax({
                    type: "POST",
                    url: self.getApp().serviceURL + "/api/v1/assets_in_each_warehouse_no_search",
                    data: JSON.stringify({
                        warehouse_id: self.model.get("id"),
                        tenant_id: self.getApp().currentTenant[0],
                    }),
                    success: function(response) {
                        response.forEach(function(item, index) {
                            var resultPurchaseCost = new Number(item.purchase_cost).toLocaleString("en-AU");
                            var resultNetAmount = new Number(item.purchase_cost * item.quantity).toLocaleString("en-AU");
                            self.$el.find('#list-item').before(`
                                <div style="width: 955px;height: 50px;" selected-item-id = "${item.id}" class = "selected-item-old" >
                                    <div style="width: 45px; display: inline-block;text-align: center;padding: 5px;">
                                        <input selected-item-id = "${item.id}" col-type="STT" class="form-control text-center p-1" value="${index+1}" style="font-size:14px">
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
                                        <input selected-item-id = "${item.id}" col-type="NET_AMOUNT" class="form-control text-center p-1" net-amount="${item.purchase_cost * item.quantity}" value="${resultNetAmount} VNĐ" readonly style="font-size:14px">
                                    </div>
                                </div>
                                `)
                        })
                    }
                })
            }



        },
        createItem: function(warehouse_id, tenant_id) {
            var self = this;
            var arr = [];
            self.$el.find('.selected-item-new').each(function(index, item) {
                var obj = {
                    "warehouse_id": warehouse_id,
                    "item_id": $(item).attr('item-id'),
                    "item_no": $(item).attr('item-no'),
                    "unit_id": $(item).attr('unit-id'),
                    "list_price": $(item).attr('list-price'),
                    "item_name": $(item).find('[col-type="NAME"]').val(),
                    "tenant_id": tenant_id,
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
                    data: JSON.stringify({ "data": arr, "item_balances_type": 'warehouse' }),
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
                    data: JSON.stringify({ "arr": arr, "item_balances_type": "warehouse" }),
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