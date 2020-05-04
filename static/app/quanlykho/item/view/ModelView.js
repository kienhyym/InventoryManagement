define(function(require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');

    var template = require('text!app/quanlykho/item/tpl/model.html'),
        schema = require('json!schema/ItemSchema.json');
    // var MedicalEquipmentView = require('app/danhmuc/medicalequipment/js/SelectView');

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
                    buttonClass: "btn-primary btn btn-sm",
                    label: "TRANSLATE:SAVE",
                    // visible: function () {
                    // 	return false;
                    // },
                    command: function() {
                        var self = this;

                        // self.model.set("importer", self.getApp().currentUser.fullname ? self.getApp().currentUser.fullname : self.getApp().currentUser.email);
                        if (self.invali) {
                            toastr.error("Mã hàng hóa bị trùng");
                            return;
                        }

                        // if (!self.validate()) {
                        // 	return;
                        // }
                        // console.log('xxxxxxxxxxxxxxx', delete self.model.get('medicalequipment').stt)

                        // self.model.set("item_no", self.model.get("item_no").toLocaleUpperCase());
                        // self.model.set("item_name", self.model.get('medicalequipment').name);

                        var id = this.getApp().getRouter().getParam("id");
                        var method = "update";
                        if (!id) {
                            var method = "create";
                            self.model.set("tenant_id", self.getApp().currentTenant[0]);
                        }
                        self.model.sync(method, self.model, {
                            success: function(model, respose, options) {
                                toastr.info("Lưu thông tin thành công");
                                self.getApp().getRouter().navigate(self.collectionName + "/collection");
                            },
                            error: function(model, xhr, options) {
                                toastr.error('Lưu thông tin không thành công!');
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
                        return false;
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

    });

});