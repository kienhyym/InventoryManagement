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
                            // if (!self.validate()) {
                            //     return;
                            // }
                            var method = "update";
                            if (!id) {
                                var method = "create";
                                self.model.set("created_at", Helpers.utcToUtcTimestamp());
                                var makeNo = Helpers.makeNoGoods(6, "CK0").toUpperCase();
                                self.model.set("movewarehouse_no", makeNo);
                            }
                            self.model.sync(method, self.model, {
                                success: function (model, respose, options) {
                                    console.log(model)
                                    self.createItem(model.id);
                                    self.updateItem();
                                    self.deleteItem();
                                    toastr.info("Lưu thông tin thành công");
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
            localStorage.removeItem("listItem");
            var id = this.getApp().getRouter().getParam("id");
            if (id) {
                this.model.set('id', id);
                this.model.fetch({
                    success: function (data) {
                        self.applyBindings();
                        self.regsiterEvent();
                        self.showSavedItem();
                        self.listItemsOldRemove();
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
            self.loadCombox();
            self.ShowListItem();

            self.$el.find("#add-item").addClass("hide");
            var id = self.getApp().getRouter().getParam("id");
            if (id) {
                self.$el.find("#movewarehouse_no").text(self.model.get("movewarehouse_no"));
            } else {
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
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/get_all_warehouse_tennat_id",
                data: JSON.stringify(self.getApp().currentTenant[0]),
                success: function (res) {
                    loader.hide();
                    if (res) {
                        self.$el.find("#warehouse_from").combobox({
                            textField: "warehouse_name",
                            valueField: "id",
                            dataSource: res,
                            value: self.model.get("warehouse_from_id")
                        });
                    }
                }
            })
            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/get_all_warehouse_tennat_id",
                data: JSON.stringify(self.getApp().currentTenant[0]),
                success: function (res) {
                    loader.hide();
                    if (res) {
                        self.$el.find("#warehouse_to").combobox({
                            textField: "warehouse_name",
                            valueField: "id",
                            dataSource: res,
                            value: self.model.get("warehouse_to_id")
                        });
                    }
                }
            })
            self.$el.find("#warehouse_from").on("change.gonrin", function (event) {
                self.model.set("warehouse_from_id", self.$el.find("#warehouse_from").data("gonrin").getValue());
            });
            self.$el.find("#warehouse_to").on("change.gonrin", function (event) {
                self.model.set("warehouse_to_id", self.$el.find("#warehouse_to").data("gonrin").getValue());
            });
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
        },
        // ############################CHỨC NĂNG CHỌN ITEM ##########################################################


        createItem: function (movewarehouse_id) {
            var self = this;
            var arr = [];
            self.$el.find('.body-item-new').each(function (index, item) {
                var obj = {};
                obj.item_id = String($(item).attr('item-id'))
                obj.item_id_origin = String($(item).attr('item-id-origin'))
                obj.item_name = $(item).find('#item_name').attr('item-name')
                obj.purchase_cost = Number($(item).find('td .purchase-cost').val())
                obj.quantity = Number($(item).find('td .quantity').val())
                obj.quantity_delivery = Number($(item).find('td .quantity-delivery').val())
                obj.warehouse_from_id = self.model.get('warehouse_from_id')
                obj.warehouse_to_id = self.model.get('warehouse_to_id')
                obj.tenant_id = self.getApp().currentTenant[0]

                arr.push(obj)
            })
            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/create_moveware_house_details_item",
                data: JSON.stringify({ "movewarehouse_id": movewarehouse_id, "data": arr }),
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
                obj.quantity_delivery = Number($(item).find('td .quantity-delivery').val())
                obj.warehouse_from_id = self.model.get('warehouse_from_id')
                obj.warehouse_to_id = self.model.get('warehouse_to_id')
                arr.push(obj)
            })
            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/update_moveware_house_details_item",
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
                    url: self.getApp().serviceURL + "/api/v1/delete_moveware_house_details_item",
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
                    <tr class="body-item-old" item-id="${item.id}" item-id-origin="${item.item_id_origin}" >
                    <td id="item_name" item-name="${item.item_name}">
                    ${item.item_name}
                    </td>
                    <td style="text-align: left;">
                        <input type="text" class="form-control purchase-cost" readonly value="${item.purchase_cost}" />
                    </td>
                    <td><input type="text" class="form-control quantity" readonly value="${item.quantity}"/></td>
                    <td style="width: 160px"><input type="text" class="form-control quantity-delivery" value="${item.quantity_delivery}"   /></td>
                    <td style="width: 50px; line-height: 34px; margin-top: 20px" >
                        <div class="itemRemove" item-id-xoa="${item.id}">
                            <i class="fa fa-trash" style="font-size: 17px"></i>
                        </div>
                    </td>
                    </tr>
                `)
                })

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
                url: self.getApp().serviceURL + "/api/v1/get_all_item_warehouse_tennat_id",
                method: "POST",
                data: JSON.stringify({
                    "page_number": page_number,
                    "text": text,
                    "tenant": self.getApp().currentTenant[0]
                }),
                contentType: "application/json",
                success: function (data) {
                    if (data.length != 0) {
                        data.forEach(function (item, index) {
                            console.log(item)
                            self.$el.find('.trang-thiet-bi-y-te').append(`
                            <div class="col-4 col-md-2 p-1 item-show" item-id="${item.id}" >
                                <div class="text-center">
                                    <div title="${item.item_name}" style="margin-left: auto; margin-right: auto; left: 0px; right: 0px;width: 90px;height:170px;position: relative;">
                                        <input class="item-checkbox" item-id="${item.id}" type="checkbox" style="position: absolute; top: 0px; left: 0px;width:90px;height: 90px;opacity:0">
                                        <img src="static/img/user.png" style="width:90px;height: 90px;">
                                        <label class="item-chose" style="position: absolute;top:70px;right:3px;display:none"><i class="far fa-check-square text-success" aria-hidden="true"></i></label>
                                        <label class="item-not-chose"  style="position: absolute;top:70px;right:3px"><i class="far fa-square" aria-hidden="true"></i></label>
                                        <label class="item-name" purchase-cost=${item.purchase_cost} quantity=${item.quantity} item-id-origin="${item.item_id}"  style="font-size: 10px;width:100%;overflow: hidden;text-overflow: ellipsis;line-height: 20px;-webkit-line-clamp: 3;display: -webkit-box;-webkit-box-orient: vertical;">${item.item_name}</label>
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
                var itemPurchaseCost = checkBox.siblings('.item-name').attr('purchase-cost')
                var itemQuantity = checkBox.siblings('.item-name').attr('quantity')
                var itemItemID = checkBox.siblings('.item-name').attr('item-id-origin')
                if (event.target.checked) {
                    selectItemList.push({ "item_id": itemID, "item_name": itemName, "purchase_cost": itemPurchaseCost, "quantity": itemQuantity, "item_id_origin": itemItemID })
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
                listSelectedItems.push({ "item_id": item.item_id, "item_name": item.item_name, "purchase_cost": item.purchase_cost, "quantity": item.quantity, "item_id_origin": item.item_id_origin })
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
        htmlShowSelectedItem: function (listSelectedItems) {
            var self = this;
            if (listSelectedItems) {
                listSelectedItems.forEach(function (item, index) {
                    self.$el.find('#body-items').append(`
                    <tr class="body-item-new" item-id="${item.item_id}" item-id-origin="${item.item_id_origin}">
                    <td id="item_name" item-name="${item.item_name}">
                    ${item.item_name}
                    </td>
                    <td style="text-align: left;">
                        <input type="number" class="form-control purchase-cost" readonly value="${item.purchase_cost}" />
                    </td>
                    <td><input type="number" class="form-control quantity" readonly value="${item.quantity}" /></td>
                    <td style="width: 160px"><input type="number" class="form-control quantity-delivery"  /></td>
                    <td style="width: 50px; line-height: 34px; margin-top: 20px" >
                        <div class="itemRemove" ind = "${index}">
                            <i class="fa fa-trash" style="font-size: 17px"></i>
                        </div>
                    </td>
                    </tr>
                `)
                })
                self.listItemsNewRemove(listSelectedItems);
            }
        },
        listItemsNewRemove: function (listSelectedItems) {
            var self = this;
            self.$el.find('.body-item-new .itemRemove').unbind('click').bind('click', function () {
                $(self.$el.find('.body-item-new')[$(this).attr('ind')]).remove();
                listSelectedItems.splice($(this).attr('ind'), 1);
                localStorage.setItem('listItem', JSON.stringify(listSelectedItems))
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