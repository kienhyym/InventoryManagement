define(function(require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');

    var template = require('text!app/quanlykho/item/tpl/model.html'),
        schema = require('json!schema/ItemSchema.json');
    // var MedicalEquipmentView = require('app/danhmuc/medicalequipment/js/SelectView');
    var Helpers = require("app/base/view/Helper");

    var itemType = [{
            text: "Nguyên liêu",
            value: "material"
        },
        {
            text: "Nguyên liệu thô",
            value: "raw_material"
        },
        {
            text: "Combo",
            value: "package"
        },
        {
            text: "Dịch vụ",
            value: "service"
        },
        {
            text: "Sản phẩm",
            value: "product"
        },
    ];

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
        collectionName: "item",
        allData: [],
        onInt: false,
        invali: false,
        listItemRemove: [],
        uiControl: {
            fields: [

                {
                    field: "purchase_cost",
                    uicontrol: "currency",
                    currency: currencyFormat,
                    cssClass: "text-right"
                },
                {
                    field: "list_price",
                    uicontrol: "currency",
                    currency: currencyFormat,
                    cssClass: "text-right"
                },
                {
                    field: "image",
                    uicontrol: "imagelink",
                    service: {
                        url: "https://upstart.vn/services/api/image/upload?path=uperp"
                    }
                },
                // {
                // 	field: "categories",
                // 	uicontrol: "ref",
                // 	textField: "category_name",
                // 	selectionMode: "multiple",
                // 	dataSource: CategoryCollectionView
                // },
                // {
                // 	field:forgot_password "unit",
                // 	uicontrol: "ref",
                // 	textField: "code",
                // 	foreignRemoteField: "id",
                // 	foreignField: "unit_id",
                // 	dataSource: UnitCollectionView
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
                // },
                {
                    field: "item_type",
                    uicontrol: "combobox",
                    textField: "text",
                    valueField: "value",
                    dataSource: itemType
                },
                // {
                //     field: "medicalequipment",
                //     uicontrol: "ref",
                //     textField: "name",
                //     foreignRemoteField: "id",
                //     foreignField: "medicalequipment_id",
                //     dataSource: MedicalEquipmentView
                // },
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
                    buttonClass: "btn btn-primary font-weight-bold save btn-sm",
                    label: "TRANSLATE:SAVE",
                    command: function() {
                        var self = this;
                        var id = self.getApp().getRouter().getParam("id");
                        var method = "update";
                        if (!id) {
                            var method = "create";
                            self.model.set("created_at", Helpers.utcToUtcTimestamp());
                            var tenant_id = self.getApp().currentTenant[0];
                            self.model.set("tenant_id", tenant_id);
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
                        return true;
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
            axios({
                method: "POST",
                url: self.getApp().serviceURL + "/api/v1/item/get",
                data: {
                    tenant_id: self.getApp().currentTenant[0]
                }
            }).then(res => {
                self.allData = res.data;
            })


            var id = this.getApp().getRouter().getParam("id");
            if (id) {
                this.model.set('id', id);
                this.model.fetch({
                    success: function(data) {
                        self.applyBindings();
                        self.regsiterEvent();
                        self.showDetail();
                    },
                    error: function() {
                        toastr.error("Get data Error");
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
            self.chooseUnit();
            var id = this.getApp().getRouter().getParam("id");
            self.$el.find("#item-image").attr("src", self.model.get("image"));
            self.$el.find("#item_no").unbind("keypress").bind("keypress", function() {
                if (self.$el.find("#item_no").hasClass("input-invalid")) {
                    self.$el.find("#item_no").removeClass("input-invalid");
                }
            });
            self.model.on("change:item_no", function() {
                if (id && self.onInt) {
                    self.onInt = false;
                    return;
                }
                const itemNo = self.model.get("item_no") ? self.model.get("item_no").toLocaleUpperCase() : "";
                if (self.allData) {
                    let isExist = false;
                    self.allData.forEach(item => {
                        if (item.item_no == itemNo) {
                            isExist = true;
                        }
                    })
                    if (isExist) {
                        self.$el.find("#item_no").addClass("input-invalid");
                        toastr.error("Mã hàng hóa bị trùng");
                        self.invali = true;
                    } else {
                        self.invali = false;
                    }
                }
            })

            self.model.on("change:unit", function(e) {
                self.model.set("unit_code", e.changed.unit.code);
                self.model.set("unit_id", e.changed.unit.id);
            });
        },

        validate: function() {
            var self = this;
            if (!self.model.get("item_no")) {
                toastr.warning("Vui lòng nhập mã hàng hóa");
                return;
            } else if (!self.model.get("item_name")) {
                toastr.warning("Vui lòng nhập tên hàng hóa");
                return;
            }
            return true;
        },
        chooseUnit: function() {
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
                url: self.getApp().serviceURL + "/api/v1/unit?results_per_page=100000&max_results_per_page=1000000",
                data: "q=" + JSON.stringify(filters),
                success: function(res) {
                    loader.hide();
                    if (res.objects) {
                        res.objects.forEach(function(item, index) {
                            self.$el.find(".unit .selectpicker").append(`
                            <option value="${item.id}">${item.code} (${item.name})</option>
                            `)
                        })
                        if (self.model.get('unit_id') != null) {
                            self.$el.find('.unit .selectpicker').selectpicker('val', self.model.get('unit_id'));

                        } else {
                            self.$el.find('.unit .selectpicker').selectpicker('val', 'deselectAllText');

                        }
                        self.$el.find(".unit .selectpicker").on('changed.bs.select', function(e, clickedIndex, isSelected, previousValue) {
                            self.model.set('unit_id', $(this).val())
                        });

                    }
                }
            })
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
                        unit-name = "${dropdownItemClick.attr('unit-id')}"
                        unit-exchange = "${dropdownItemClick.attr('unit-exchange')}"
                        >
                            <div style="width: 45px; display: inline-block;text-align: center;padding: 5px;">
                                <input selected-item-id = "${itemID}" col-type="STT" class="form-control text-center p-1" value="${stt}" style="font-size:14px">
                            </div>
                            <div style="width: 290px;display: inline-block;padding: 5px;">
                                <input selected-item-id = "${itemID}" col-type="NAME" class="form-control p-1" value="${dropdownItemClick.attr('title')}" readonly style="font-size:14px">
                            </div>
                            <div style="width: 190px;display: inline-block;text-align: center;padding: 5px;">
                                <input selected-item-id = "${itemID}" col-type="PURCHASE_COST" class="form-control text-center p-1" readonly purchase-cost = "${dropdownItemClick.attr('purchase-cost')}" value="${purchaseCostFormat} vnđ/${dropdownItemClick.attr('unit-name')}" style="font-size:14px">
                            </div>
                            <div style="width: 190px; display: inline-block; text-align:center;padding: 5px;">
                                <input selected-item-id = "${itemID}" col-type="QUANTITY" type="number" class="form-control text-center p-1" value = "0" style="font-size:14px">
                            </div>
                            <div style="width: 190px;display: inline-block;text-align: center;padding: 5px;">
                                <input selected-item-id = "${itemID}" col-type="UNIT_EXCHANGE" class="form-control text-center p-1" readonly value="${dropdownItemClick.attr('unit-exchange')}" style="font-size:14px">
                            </div>
                            <div style="width: 30px;display: inline-block;text-align: center;padding: 5px;">
                                    <i selected-item-id = "${itemID}" class="fa fa-trash" style="font-size: 17px"></i>
                                </div>
                        </div>
                        `)
                        self.$el.find('.dropdown-menu-item').hide()
                        self.$el.find('.search-item').val('')
                        // self.clickPurchaseCost();
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
                            self.$el.find('[col-type="UNIT_EXCHANGE"][selected-item-id = ' + selectedItemId + ']').attr('net-amount', netAmount);
        
                            var netAmountValueChange = new Number(netAmount).toLocaleString("en-AU");
                            self.$el.find('[col-type="UNIT_EXCHANGE"][selected-item-id = ' + selectedItemId + ']').val(netAmountValueChange + " VNĐ");
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
                    //Out Click UNIT_EXCHANGE
                    self.$el.find('[col-type="QUANTITY"]').focusout(function() {
                        var pointerOutQuantity = $(this);
                        var pointerOutQuantityValue = pointerOutQuantity.val();
                        if (pointerOutQuantityValue == null || pointerOutQuantityValue == '') {
                            pointerOutQuantity.val(0)
                        }
                        var selectedItemId = pointerOutQuantity.attr('selected-item-id');
                        var pointerOutValuePurchaseCost = self.$el.find('[col-type="PURCHASE_COST"][selected-item-id = ' + selectedItemId + ']').attr('purchase-cost');
                        var resultNetAmount = pointerOutValuePurchaseCost * pointerOutQuantity.val();
                        self.$el.find('[col-type="UNIT_EXCHANGE"][selected-item-id = ' + selectedItemId + ']').attr('net-amount', resultNetAmount);
                        var resultNetAmountChange = new Number(resultNetAmount).toLocaleString("en-AU");
                        self.$el.find('[col-type="UNIT_EXCHANGE"][selected-item-id = ' + selectedItemId + ']').val(resultNetAmountChange + " VNĐ");
                    });
                },
                loadItemDropdown: function() { // Đổ danh sách Item vào ô tìm kiếm
                    var self = this;
                    self.$el.find('.search-item').keyup(function name() {
                        self.$el.find('.dropdown-item').remove();
                        var text = $(this).val()
                        $.ajax({
                            type: "POST",
                            url: self.getApp().serviceURL + "/api/v1/load_item_materials_dropdown",
                            data: JSON.stringify({ "text": text, "tenant_id": self.getApp().currentTenant[0] }),
                            success: function(response) {
                                console.log(response)
                                var count = response.length
                                response.forEach(function(item, index) {
                                    self.$el.find('.dropdown-menu-item').append(`
                                    <button
                                    item-id = "${item.id}" 
                                    title="${item.item_name}"
                                    purchase-cost = "${item.purchase_cost}"
                                    unit-name = "${item.unit_name}"
                                    unit-exchange = "${item.unit_exchange}"
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
                    if (self.model.get('recipe').length > 0) {
                        console.log(self.model.get('recipe'))
                        $.ajax({
                            type: "POST",
                            url: self.getApp().serviceURL + "/api/v1/recipe_detail",
                            data: JSON.stringify(self.model.get('recipe')),
                            success: function(response) {
                                response.forEach(function(item, index) {
                                    var resultPurchaseCost = new Number(item.purchase_cost).toLocaleString("en-AU");
                                    self.$el.find('#list-item').before(`
                                    <div style="width: 955px;height: 50px;" selected-item-id = "${item.id}" class = "selected-item-old" >
                                        <div style="width: 45px; display: inline-block;text-align: center;padding: 5px;">
                                            <input selected-item-id = "${item.id}" col-type="STT" class="form-control text-center p-1" value="${index + 1}" style="font-size:14px">
                                        </div>
                                        <div style="width: 290px;display: inline-block;padding: 5px;">
                                            <input selected-item-id = "${item.id}" col-type="NAME" class="form-control p-1" value="${item.name}" readonly style="font-size:14px">
                                        </div>
                                        <div style="width: 190px;display: inline-block;text-align: center;padding: 5px;">
                                            <input selected-item-id = "${item.id}" col-type="PURCHASE_COST" class="form-control text-center p-1" readonly value="${resultPurchaseCost}VNĐ/${item.unit_name}" style="font-size:14px">
                                        </div>
                                        <div style="width: 190px; display: inline-block; text-align:center;padding: 5px;">
                                            <input selected-item-id = "${item.id}" col-type="QUANTITY" type="number" class="form-control text-center p-1" value = "${item.quantity}" style="font-size:14px">
                                        </div>
                                        <div style="width: 190px;display: inline-block;text-align: center;padding: 5px;">
                                            <input selected-item-id = "${item.id}" col-type="UNIT_EXCHANGE" class="form-control text-center p-1"  value="${item.unit_exchange}" readonly style="font-size:14px">
                                        </div>
                                        <div style="width: 30px;display: inline-block;text-align: center;padding: 5px;">
                                            <i selected-item-id = "${item.id}" class="fa fa-trash" style="font-size: 17px"></i>
                                        </div>
                                    </div>
                                    `)
                                })
                                self.listItemsOldRemove();

                            }
                        });

                        // self.clickPurchaseCost();
        
                    }
        
        
                },
                createItem: function(item_id, tenant_id) {
                    var self = this;
                    var arr = [];
                    self.$el.find('.selected-item-new').each(function(index, item) {
                        var obj = {
                            "item_id": item_id,
                            "item_exchange_id": $(item).attr('item-id'),
                            "tenant_id": tenant_id,
                            "quantity": $(item).find('[col-type="QUANTITY"]').val(),
                        }
                        arr.push(obj)
                    })
                    if (arr.length > 0) {
                        $.ajax({
                            type: "POST",
                            url: self.getApp().serviceURL + "/api/v1/create_recipe",
                            data: JSON.stringify(arr),
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
                        }
                        arr.push(obj)
                    })
                    if (arr.length > 0) {
                        $.ajax({
                            type: "POST",
                            url: self.getApp().serviceURL + "/api/v1/update_recipe",
                            data: JSON.stringify(arr),
                            success: function(response) {
                                console.log(response)
                            }
                        });
                    }
                },
                listItemsOldRemove: function() {
                    var self = this;
                    console.log(self.$el.find('.selected-item-old div'))
                    self.$el.find('.selected-item-old div .fa-trash').unbind('click').bind('click', function() {
                        console.log(this)
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
                            url: self.getApp().serviceURL + "/api/v1/delete_recipe",
                            data: JSON.stringify(self.listItemRemove),
                            success: function(response) {
                                self.listItemRemove.splice(0, arrayItemRemove);
                                console.log(response)
                            }
                        });
                    }
                },
        
        
                // HẾT CHỨC NĂNG CHỌN ITEM XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
                // XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

    });

});