define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');
    var template = require('text!app/quanlykho/view/warehouse/tpl/inventory-delivery.html');

    var Helper = require('app/common/Helper');
    var TemplateHelper = require('app/common/TemplateHelper');
    var lodash = require('vendor/lodash/lodash-4.17.10');

    return Gonrin.ModelView.extend({
        template: template,
        modelSchema: [],
        selectWarehouse: null,

        render: function () {
            const self = this;
            self.applyBindings();
            // console.log("model", self.model.toJSON());
            self.loadDefault();
            self.registerEvent();
            self.loadWarehouse();

        },

        loadDefault: function () {
            var self = this;
            if (self.$el.find("#cb-warehouse").val() == "") {
                var warehouseID = null;
                self.loadData(warehouseID);
            }
        },

        registerEvent: function () {
            var self = this;

            self.$el.find("#cb-warehouse").on("change.gonrin", function (event) {
                self.selectWarehouse = event.target.value;
                // self.loadData(event.target.value);
                // console.log(event.target.value);
                self.loadData(event.target.value);
                // console.log("cb", self.$el.find("#cb-warehouse").val())
            });

        },

        loadWarehouse: function () {
            var self = this;
            // console.log(self.getApp().serviceURL);
            $.ajax({
                url: self.getApp().serviceURL + "/api/v1/warehouse/get",
                success: function (data) {
                    // console.log("data", data)
                    self.$el.find("#cb-warehouse").combobox({
                        textField: "warehouse_name",
                        valueField: "id",
                        dataSource: data
                    });
                },
                error: function (xhr, status, error) {

                }
            });
        },

        loadData: function (warehouseID) {
            var self = this;
            loader.show();

            $.ajax({
                url: self.getApp().serviceURL + "/api/v1/product/get_all_inventory_delivery",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({
                    warehouse_id: warehouseID
                }),
                success: function (data) {
                    // console.log("data", data)
                    self.filterByProductNo(data);
                    var result = clone(data);
                    if (result) {
                        self.renderData(result);
                    }
                },
                error: function (xhr, status, error) {
                    loader.hide();
                }
            });
            loader.hide();

        },

        filterByProductNo: function (data) {
            var self = this;
            self.$el.find("#grid_search").unbind("change").bind("change", function (event) {
                // self.$el.find("#grid_search").val()
                // console.log(self.$el.find("#grid_search").val());
                if (!self.$el.find("#grid_search").val()) {
                    self.renderData(data);
                } else {
                    var response = lodash.filter(data, function (o) {
                        return o.product_no == self.$el.find("#grid_search").val();
                    });
                    self.renderData(response);
                }
            })
        },

        renderData: function (data) {
            var self = this;

            self.$el.find("#grid").grid({
                orderByMode: "client",
                refresh: true,
                primaryField: "id",
                // selectionMode: "multiple",
                // paginationMode: false,
                pagination: {
                    page: 1,
                    pageSize: 15
                },

                fields: [
                    {
                        field: "",
                        label: "Mã",
                        template: function (r) {
                            return `<div style="50px">${r.product_no}</div>`;
                        }
                    },
                    {
                        field: "product_name",
                        label: "Sản phẩm",
                        template: function (r) {
                            return `<div style="width: 100px">${r.product_name}</div>`;
                        }
                    },
                    {
                        field: "image",
                        label: "Hình ảnh",
                        template: function (r) {
                            return `<div style="height: 100px; width: 90px"><img src="${r.image}"></div>`;
                        }
                    },
                    {
                        field: "warehouse",
                        label: "Kho",
                        template: function (r) {
                            if (r.warehouse) {
                                return `<div style="width: 70px">${r.warehouse}</div>`;
                            } else {
                                return ``;
                            }
                        }
                    },

                    {
                        field: "date_created",
                        label: "Ngày xuất",
                        template: function (r) {
                            return `<div style="width: 120px">${Helper.utcToLocal(r.date_created, "DD-MM-YYYY HH:mm")}</div>`;
                        }
                    },
                    {
                        field: "quantity_delivery",
                        label: "Số lượng",
                        template: function (r) {
                            // console.log(r);
                            if (r.quantity) {
                                return `<div style="width: 70px">${r.quantity}</div>`;
                            } else {
                                return ``;
                            }
                        }
                    },
                    {
                        field: "price",
                        label: "Giá xuất",
                        template: function (r) {
                            return `<div style="width: 80px">${TemplateHelper.currencyFormat(r.price, false, "")}</div>`;
                        }
                    },
                    {
                        field: "",
                        label: "Thành tiền",
                        template: function (r) {
                            return `<div style="width: 100px">${TemplateHelper.currencyFormat(parseFloat(r.quantity * r.price), false, "")}</div>`;
                        }
                    },
                    {
                        field: "created_by",
                        label: "Người nhập",
                        template: function (r) {
                            // console.log(r);
                            if (r.creator) {
                                return `<div style="width: 100px">${r.creator}</div>`;
                            } else {
                                return ``;
                            }
                        }
                    },


                ],

                dataSource: data,
            });
        }
    });
});
