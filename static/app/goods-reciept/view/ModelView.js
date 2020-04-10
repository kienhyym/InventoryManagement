define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');

    var template = require('text!app/goods-reciept/tpl/model.html'),
        schema = require('json!schema/GoodsRecieptSchema.json');

    // var WarehouseView = require("app/view/warehouse/view/SelectView");
    // var CurrencyView = require("app/view/currency/view/SelectView");
    var ContactView = require("app/contact/view/SelectView");
    var ItemView = require("app/goods-reciept/view/ItemView")
    var Helpers = require('app/base/view/Helper');
    var ItemDialogView = require("app/goods-reciept/view/ItemDialogView");
    var PaymentView = require("app/goods-reciept/view/Payment");

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
        selectItemList: [],
        listItemRemove: [],
        refresh: true,
        uiControl: {
            fields: [
                {
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
                    },],
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
            buttons: [
                {
                    name: "back",
                    type: "button",
                    buttonClass: "btn-dark btn-sm",
                    label: "TRANSLATE:BACK",
                    command: function () {
                        var self = this;
                        Backbone.history.history.back();
                    }
                },
                {
                    name: "save",
                    type: "button",
                    buttonClass: "btn-primary btn-sm",
                    label: "TRANSLATE:Lưu",
                    command: function () {
                        var self = this;

                        self.model.save(null, {
                            success: function (model, respose, options) {
                                self.createItem(respose.id);
                                self.updateItem();
                                self.deleteItem();
                                self.getApp().notify("Lưu thông tin thành công");
                                self.getApp().getRouter().navigate(self.collectionName + "/collection");
                            },
                            error: function (xhr, status, error) {
                                try {
                                    if (($.parseJSON(error.xhr.responseText).error_code) === "SESSION_EXPIRED") {
                                        self.getApp().notify("Hết phiên làm việc, vui lòng đăng nhập lại!");
                                        self.getApp().getRouter().navigate("login");
                                    } else {
                                        self.getApp().notify({ message: $.parseJSON(error.xhr.responseText).error_message }, { type: "danger", delay: 1000 });
                                    }
                                }
                                catch (err) {
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
                    visible: function () {
                        return this.getApp().getRouter().getParam("id") !== null;
                    },
                    command: function () {
                        var self = this;

                        $.jAlert({
                            'title': 'Bạn có chắc muốn xóa?',
                            'content': '<button class="btn btn-sm btn-danger" id="yes">Có!</button><button class="btn btn-sm btn-light" id="no">Không</button>',
                            'theme': 'red',
                            'onOpen': function ($el) {
                                $el.find("#yes").on("click", function () {
                                    self.getApp().saveLog("delete", "goodsreciept", self.model.get("goodsreciept_no"), null, null, self.model.get("details"), Helpers.utcToUtcTimestamp());
                                    self.model.destroy({
                                        success: function (model, response) {
                                            $el.closeAlert();
                                            if ($("body").hasClass("sidebar-icon-only")) {
                                                $("#btn-menu").trigger("click");
                                            }
                                            self.getApp().notify('Xoá dữ liệu thành công');
                                            self.getApp().getRouter().navigate(self.collectionName + "/collection");
                                        },
                                        error: function (xhr, status, error) {
                                            try {
                                                if (($.parseJSON(error.xhr.responseText).error_code) === "SESSION_EXPIRED") {
                                                    self.getApp().notify("Hết phiên làm việc, vui lòng đăng nhập lại!");
                                                    self.getApp().getRouter().navigate("login");
                                                } else {
                                                    self.getApp().notify({ message: $.parseJSON(error.xhr.responseText).error_message }, { type: "danger", delay: 1000 });
                                                }
                                            }
                                            catch (err) {
                                                self.getApp().notify({ message: "Xóa dữ liệu không thành công" }, { type: "danger", delay: 1000 });
                                            }
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
                    name: "confirm",
                    type: "button",
                    buttonClass: "btn btn-warning btn-sm btn-confirm hide",
                    label: "Duyệt yêu cầu",
                    visible: function () {
                        return this.getApp().getRouter().getParam("id") !== null;
                    },
                    command: function () {
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
                            success: function (response) {
                                if (response) {
                                    self.model.set("payment_status", "confirm");
                                    self.getApp().saveLog("confirm", "goodsreciept", self.model.get("goodsreciept_no"), null, null, self.model.get("details"), Helpers.utcToUtcTimestamp());
                                    self.model.save(null, {
                                        success: function (model, respose, options) {
                                            self.getApp().notify("Lưu thông tin thành công");
                                            self.getApp().getRouter().navigate(self.collectionName + "/collection");
                                        },
                                        error: function (xhr, status, error) {
                                            try {
                                                if (($.parseJSON(error.xhr.responseText).error_code) === "SESSION_EXPIRED") {
                                                    self.getApp().notify("Hết phiên làm việc, vui lòng đăng nhập lại!");
                                                    self.getApp().getRouter().navigate("login");
                                                } else {
                                                    self.getApp().notify({ message: $.parseJSON(error.xhr.responseText).error_message }, { type: "danger", delay: 1000 });
                                                }
                                            }
                                            catch (err) {
                                                self.getApp().notify({ message: "Lưu thông tin không thành công" }, { type: "danger", delay: 1000 });
                                            }
                                        }
                                    });
                                }
                                loader.hide();
                            },
                            error: function () {
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
                    visible: function () {
                        return this.getApp().getRouter().getParam("id") !== null;
                    },
                    command: function () {
                        var self = this;
                        var paymentView = new PaymentView({
                            "viewData": self.model.toJSON()
                        });
                        paymentView.dialog({
                            // size: "large"
                        });
                        paymentView.on("close", function (e) {
                            self.model.set("payment_status", "paid");
                            self.model.set("payment_no", e.payment_no);
                            self.getApp().saveLog("paid", "goodsreciept", self.model.get("goodsreciept_no"), null, null, self.model.get("details"), Helpers.utcToUtcTimestamp());
                            self.model.save(null, {
                                success: function (model, respose, options) {
                                    self.getApp().notify("Lưu thông tin thành công");
                                    self.getApp().getRouter().navigate(self.collectionName + "/collection");
                                },
                                error: function (xhr, status, error) {
                                    try {
                                        if (($.parseJSON(error.xhr.responseText).error_code) === "SESSION_EXPIRED") {
                                            self.getApp().notify("Hết phiên làm việc, vui lòng đăng nhập lại!");
                                            self.getApp().getRouter().navigate("login");
                                        } else {
                                            self.getApp().notify({ message: $.parseJSON(error.xhr.responseText).error_message }, { type: "danger", delay: 1000 });
                                        }
                                    }
                                    catch (err) {
                                        self.getApp().notify({ message: "Lưu thông tin không thành công" }, { type: "danger", delay: 1000 });
                                    }
                                }
                            });
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
            // self.changeDetails = [];
            var id = this.getApp().getRouter().getParam("id");
            if (id) {
                this.model.set('id', id);
                this.model.fetch({
                    success: function (data) {
                        self.applyBindings();
                        self.registerEvent();
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
            // self.changeDetails = self.model.get("details");
            self.loadCombox();
            // self.toggleEvent();
            self.ShowListItem();
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
            self.$el.find("#copy-no").unbind("click").bind("click", function (event) {
                var copyText = document.getElementById("text-copy");
                copyText.select();
                document.execCommand("copy");
                toastr.success("Copied success");
            });

            self.calculateItemAmounts();
            self.model.on("change:details", function () {
                self.calculateItemAmounts();
            });

            self.model.on("change:tax_amount", function () {
                self.caculateTaxAmount();
            });

            self.model.on("change:tax_percent", function () {
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

            self.model.on("change:taxtype", function (e) {
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

        calculateItemAmounts: function () {
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

        loadCombox: function () {
            loader.show();
            var self = this;
            var tenantID = self.getApp().currentTenant[0]
            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/get_all_warehouse_by_tenant",
                data: JSON.stringify({
                    tenant_id: tenantID,
                }),
                success: function (res) {
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
                success: function (res) {
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
                url: self.getApp().serviceURL + "/api/v1/get_all_organization",
                data: JSON.stringify({
                    tenant_id: tenantID
                }),
                success: function (res) {
                    loader.hide();
                    if (res) {
                        self.$el.find("#organization").combobox({
                            textField: "organization_name",
                            valueField: "id",
                            dataSource: res,
                            value: self.model.get("organization_id")
                        });
                        self.$el.find("#organization").on('change.gonrin', function (e) {
                            self.$el.find(".nguoiDaiDien").html(`
                                <label>Đại diện</label>
                                <input type="text" class="form-control " id="contact">
                            `)
                            var organization_id = $(this).data('gonrin').getValue();
                            $.ajax({
                                type: "POST",
                                url: self.getApp().serviceURL + "/api/v1/get_all_organizationstaff",
                                data: JSON.stringify(organization_id),
                                success: function (res) {
                                    loader.hide();
                                    if (res) {
                                        self.$el.find("#contact").combobox({
                                            textField: "name",
                                            valueField: "id",
                                            dataSource: res,
                                        });
                                    }
                                }
                            })
                            self.$el.find("#contact").on("change.gonrin", function (event) {
                                self.model.set("contact_id", self.$el.find("#contact").data("gonrin").getValue());
                                self.model.set("contact_name", self.$el.find("#contact").data("gonrin").getText());
                            });
                        });
                    }
                }
            })
            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/get_all_organizationstaff",
                data: JSON.stringify(self.model.get("organization_id")),
                success: function (res) {
                    loader.hide();
                    if (res) {
                        self.$el.find("#contact").combobox({
                            textField: "name",
                            valueField: "id",
                            dataSource: res,
                            value: self.model.get("contact_id")
                        });
                    }
                }
            })

            self.$el.find("#organization").on("change.gonrin", function (event) {
                self.model.set("organization_id", self.$el.find("#organization").data("gonrin").getValue());
                self.model.set("organization_name", self.$el.find("#organization").data("gonrin").getText());
            });

            self.$el.find("#warehouse").on("change.gonrin", function (event) {
                self.model.set("warehouse_id", self.$el.find("#warehouse").data("gonrin").getValue());
                self.model.set("warehouse_name", self.$el.find("#warehouse").data("gonrin").getText());
            });
            self.$el.find("#currency").on("change.gonrin", function (event) {
                self.model.set("currency_id", self.$el.find("#currency").data("gonrin").getValue());
                self.model.set("currency_name", self.$el.find("#currency").data("gonrin").getText());
            });

        },

        printScreen: function () {
            var self = this;
            self.$el.find("#print").on("click", function () {
                var viewData = JSON.stringify(self.model.toJSON());
                // window.open('https://upstart.vn/inventory/#print-goodsreciept?viewdata=' + viewData);
                self.getApp().getRouter().navigate("print-goodsreciept?viewdata=" + viewData);

            });
        },

        validate: function () {
            var self = this;
            if (!self.model.get("warehouse_name")) {
                toastr.warning("Vui lòng chọn kho phù hợp");
                return;
            }
            return true;
        },


        // ############################CHỨC NĂNG CHỌN ITEM ##########################################################


        createItem: function (goodreciept_id) {
            var self = this;
            var arr = [];
            self.$el.find('.body-item-new').each(function (index, item) {
                var obj = {};
                obj.item_id = $(item).attr('item-id')
                obj.item_name = $(item).find('#item_name').attr('item-name')
                obj.purchase_cost = Number($(item).find('td .purchase-cost').val())
                obj.quantity = Number($(item).find('td .quantity').val())
                obj.net_amount = Number($(item).find('td .net-amount').val())
                arr.push(obj)
            })
            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/create_goods_reciept_details_item",
                data: JSON.stringify({ "goodreciept_id": goodreciept_id, "data": arr }),
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
                obj.purchase_cost = Number($(item).find('td .purchase-cost').val())
                obj.quantity = Number($(item).find('td .quantity').val())
                obj.net_amount = Number($(item).find('td .net-amount').val())
                arr.push(obj)
            })
            $.ajax({
                type: "POST",
                url: self.getApp().serviceURL + "/api/v1/update_goods_reciept_details_item",
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
                    url: self.getApp().serviceURL + "/api/v1/delete_goods_reciept_details_item",
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
                        <input type="text" class="form-control purchase-cost"  value="${item.purchase_cost}" />
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
                                        <label class="item-name" purchase-cost=${item.purchase_cost}  style="font-size: 10px;width:100%;overflow: hidden;text-overflow: ellipsis;line-height: 20px;-webkit-line-clamp: 3;display: -webkit-box;-webkit-box-orient: vertical;">${item.item_name}</label>
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

                if (event.target.checked) {
                    selectItemList.push({ "item_id": itemID, "item_name": itemName, "purchase_cost": itemPurchaseCost })
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
                listSelectedItems.push({ "item_id": item.item_id, "item_name": item.item_name, "purchase_cost": item.purchase_cost })
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
                            if ($(item).find('.purchase-cost').val() != null && $(item).find('.purchase-cost').val() != '') {
                                var purchaseCost = $(item).find('.purchase-cost').val();
                                var quantity = $(item).find('.quantity').val();
                                $(item).find('.net-amount').val(purchaseCost * quantity);
                            }
                        })
                        $(item).find('.purchase-cost').change(function () {
                            if ($(item).find('.quantity').val() != null && $(item).find('.quantity').val() != '') {
                                var purchaseCost = $(item).find('.purchase-cost').val();
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
                        <input type="number" class="form-control purchase-cost"  value="${item.purchase_cost}" />
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


        bindPaymentStatus: function () {
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

        toggleEvent: function () {
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
        }
    });

});
