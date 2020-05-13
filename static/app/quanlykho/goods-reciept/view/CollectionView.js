define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');
    var template = require('text!app/quanlykho/goods-reciept/tpl/collection.html'),
        schema = require('json!schema/GoodsRecieptSchema.json');
    var Helpers = require('app/base/view/Helper');
    var TemplateHelper = require('app/base/view/TemplateHelper');
    var CustomFilterView = require('app/base/view/CustomFilterView');

    return Gonrin.CollectionView.extend({
        template: template,
        modelSchema: schema,
        urlPrefix: "/api/v1/",
        collectionName: "goodsreciept",
        refresh: true,
        tools: [

            {
                name: "defaultgr",
                type: "group",
                groupClass: "toolbar-group",
                buttons: [{
                    name: "create",
                    type: "button",
                    buttonClass: "btn btn-primary font-weight-bold btn-sm",
                    label: "+ Tạo Phiếu",
                    command: function () {
                        var self = this;
                        this.getApp().getRouter().navigate("#goodsreciept/model");
                    }
                },]
            }
        ],
        uiControl: {
            orderBy: [
                { field: "created_at", direction: "desc" }
            ],
            fields: [{
                field: "goodsreciept_no",
                label: "Mã phiếu",
                template: function (rowObject) {
                    if (rowObject.goodsreciept_no) {
                        return `<div style="min-width: 118px;">${rowObject.goodsreciept_no}</div>`;
                    } else {
                        return `<div style="min-width: 118px;"></div>`;
                    }
                }
            },
            {
                field: "",
                label: "Trạng thái",
                template: function (rowObject) {
                    if (rowObject.payment_status) {
                        if (rowObject.payment_status == "done") {
                            return `<label style="width: 70px" class="badge badge-dark">Đã về kho</label>`;
                        } else if (rowObject.payment_status == "created") {
                            return `<label style="width: 70px" class="badge badge-primary">Tạo yêu cầu</label>`;
                        } else if (rowObject.payment_status == "pending") {
                            return `<label style="width: 70px class="badge badge-danger">Chờ xử lý</label>`;
                        } else if (rowObject.payment_status == "confirm") {
                            return `<label style="width: 90px" class="badge badge-warning">Đã duyệt yêu cầu</label>`;
                        }
                        else if (rowObject.payment_status == "debt") {
                            return `<label style="width: 70px" class="badge badge-info">Còn nợ</label>`;
                        }
                        else if (rowObject.payment_status == "paid") {
                            return `<label style="width: 90px" class="badge badge-success">Đã thanh toán</label>`;
                        } else {
                            return ``;
                        }
                    }
                }
            },
            {
                field: "created_at",
                label: "Thời gian",
                template: function (rowObject) {
                    if (rowObject.created_at) {
                        var date = rowObject.created_at * 1000;
                        return `<div style="min-width: 120px;">${Helpers.utcToLocal(date, "DD-MM-YYYY HH:mm")}</div>`;
                    } else {
                        return `<div style="width: 120px"></div>`;
                    }
                }
            },
            // {
            //     field: "",
            //     label: "Mã TT",
            //     template: function (rowObject) {
            //         if (rowObject.payment_no) {
            //             return `<div style="min-width: 118px;">${rowObject.payment_no}</div>`;
            //         } else {
            //             return `<div style="min-width: 118px"></div>`;
            //         }
            //     }
            // },
            {
                field: "",
                label: "Kho",
                template: function (rowObject) {
                    if (rowObject.warehouse_name) {
                        return `<div style="width: 120px">${rowObject.warehouse_name}</div>`;
                    } else {
                        return `<div style="width: 120px"></div>`;
                    }
                },
            },
            // {
            //     field: "",
            //     label: "Người tạo",
            //     template: function (rowObject) {
            //         if (rowObject.created_by_name) {
            //             return `<div style="min-width: 120px">${rowObject.created_by_name}</div>`;
            //         } else {
            //             return `<div style="min-width: 120px"></div>`;
            //         }
            //     }
            // },
            {
                field: "",
                label: "Tổng SL",
                template: function (rowObject) {
                    if (rowObject.details) {
                        var quantity = 0;
                        rowObject.details.forEach(item => {
                            quantity += item.quantity;
                        });
                        return `<div style="min-width: 100px;">${quantity}</div>`;
                    } else {
                        return `<div style="min-width: 100px;"></div>`;
                    }
                }
            },
            // {
            //     field: "",
            //     label: "Tổng thuế",
            //     template: function (rowObject) {
            //         if (rowObject.tax_amount) {
            //             return `<div style="min-width: 120px;">${TemplateHelper.currencyFormat(rowObject.tax_amount)}</div>`;
            //         } else {
            //             return `<div style="min-width: 120px;"></div>`;
            //         }
            //     }
            // },
            {
                field: "",
                label: "Tổng tiền",
                visible: true,
                template: function (rowObject) {
                    if (rowObject.amount) {
                        return `<div style="min-width: 120px;">${TemplateHelper.currencyFormat(rowObject.amount)}</div>`;
                    } else {
                        return `<div style="min-width: 120px;"></div>`;
                    }
                }
            },
            ],
            onRowClick: function (event) {
                if (event.rowId) {
                    var path = this.collectionName + '/model?id=' + event.rowId;
                    this.getApp().getRouter().navigate(path);
                }
            }
        },
        render: function () {
            var self = this;
            loader.show();
            self.registerEvent();

            function capitalizeFirstLetter(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }
            var filter = new CustomFilterView({
                el: $("#filter"),
                sessionKey: "goodsreciept_filter"
            });
            filter.render();
            if (!filter.isEmptyFilter()) {
                var text = !!filter.model.get("text") ? filter.model.get("text").trim() : "";
                var filters = {
                    "$and": [
                        { "tenant_id": { "$eq": self.getApp().currentTenant } },
                        { "deleted": { "$eq": false } },

                    ]
                };
                self.uiControl.filters = filters;
            }
            self.applyBindings();
            filter.on('filterChanged', function (evt) {
                var $col = self.getCollectionElement();
                var text = !!evt.data.text ? evt.data.text.trim() : "";
                var textUpper = !!filter.model.get("text") ? filter.model.get("text").trim().toUpperCase() : "";
                var textLower = !!filter.model.get("text") ? filter.model.get("text").trim().toLowerCase() : "";
                var textFirst = !!filter.model.get("text") ? capitalizeFirstLetter(filter.model.get("text").trim()) : "";
                if ($col) {
                    if (text !== null) {
                        var filters = {
                            "$and": [
                                { "tenant_id": { "$eq": self.getApp().currentTenant } },
                                { "deleted": { "$eq": false } },
                                {
                                    "$or": [
                                        { "goodsreciept_no": { "$like": text } },
                                        { "goodsreciept_no": { "$like": textUpper } },
                                        { "goodsreciept_no": { "$like": textLower } },
                                        { "goodsreciept_no": { "$like": textFirst } },

                                        { "warehouse_name": { "$like": text } },
                                        { "warehouse_name": { "$like": textUpper } },
                                        { "warehouse_name": { "$like": textLower } },
                                        { "warehouse_name": { "$like": textFirst } },

                                        { "created_by_name": { "$like": text } },
                                        { "created_by_name": { "$like": textUpper } },
                                        { "created_by_name": { "$like": textLower } },
                                        { "created_by_name": { "$like": textFirst } },
                                    ]
                                }
                            ],
                        };
                        $col.data('gonrin').filter(filters);
                        //self.uiControl.filters = filters;
                    } else {
                        filters = {
                            "$and": [
                                { "tenant_id": { "$eq": self.getApp().currentTenant } },
                                { "deleted": { "$eq": false } },
                            ],
                        };
                        $col.data('gonrin').filter(filters);
                    }
                }
                self.applyBindings();
            });
            // return;
            self.searchCombobox();
            loader.hide();
        },

        searchCombobox: function () {
            var self = this;
            self.$el.find("#search-status").combobox({
                textField: "text",
                valueField: "value",
                dataSource: [
                    { text: "__Tất cả__", value: "all" },
                    { text: "Tạo yêu cầu", value: "created" },
                    // { text: "Chờ xử lý", value: "pending" },
                    { text: "Đã duyệt yêu cầu", value: "confirm" },
                    { text: "Đã thanh toán", value: "paid" },
                    // {text: "Tạo yêu cầu", value: "done"},
                ],
                value: "all"
            });
            self.$el.find("#search-status").on("change.gonrin", function (event) {
                var text = event.target.value;
                var $col = self.getCollectionElement();
                if (text != "all") {
                    var filters = {
                        "$and": [
                            { "tenant_id": { "$eq": self.getApp().currentTenant } },
                            { "deleted": { "$eq": false } },
                            { "payment_status": { "$eq": text } },
                        ],

                    };
                    $col.data('gonrin').filter(filters);
                } else if (text == "all") {
                    filters = {
                        "$and": [
                            { "tenant_id": { "$eq": self.getApp().currentTenant } },
                            { "deleted": { "$eq": false } },
                        ],
                    };
                    $col.data('gonrin').filter(filters);
                } else {
                    filters = {
                        "$and": [
                            { "tenant_id": { "$eq": self.getApp().currentTenant } },
                            { "deleted": { "$eq": false } },
                        ],
                    };
                    $col.data('gonrin').filter(filters);
                }
                self.applyBindings();
            });
        },
        registerEvent: function () {
            var self = this;
            var currentURL = window.location.href;
            if (self.getApp().isMobile == "ANDROID") {
                $("#project-search-windows").html(``);
                // $("#project-btn").html(`<button type="button" class="btn btn-primary font-weight-bold create-new">+ Nhập hàng</button>`)
                // $(".create-new").on("click", function () {
                // 	self.getApp().getRouter().navigate("#goodsreciept/model");
                // });
                $("#project-search-mobile").html(`
					<li class="nav-item nav-search d-lg-block">
					<div class="col-md-12 col-sm-12 col-xs-12 col-12" id="filter"></div>
				</li>`);
            } else if (self.getApp().isMobile == "WINDOWS") {
                $("#project-search-mobile").html(``);
                $("#project-search-windows").html(`
					<li class="nav-item nav-search d-lg-block">
					<div class="col-md-12 col-sm-12 col-xs-12 col-12" id="filter"></div>
				</li>`);
            }
        },
    });
});