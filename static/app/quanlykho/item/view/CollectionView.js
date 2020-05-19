define(function(require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');

    var template = require('text!app/quanlykho/item/tpl/collection.html'),
        schema = require('json!schema/ItemSchema.json');

    var TemplateHelper = require('app/base/view/TemplateHelper');
    var CustomFilterView = require('app/base/view/CustomFilterView');

    return Gonrin.CollectionView.extend({
        template: template,
        modelSchema: schema,
        urlPrefix: "/api/v1/",
        collectionName: "item",
        uiControl: {
            orderBy: [{
                    field: "item_name",
                    direction: "asc"
                },
                {
                    field: "created_at",
                    direction: "desc"
                }
            ],

            fields: [
                {
                    field: "stt",
                    label: "STT",
                    width: "50px"
                },
                
                {
                    field: "item_name",
                    label: "Tên sản phẩm",
                    template: function(rowObject) {
                        return `<div style="min-width: 140px;">${rowObject.item_name}</div>`;
                    }
                },
                {
                    field: "",
                    label: "Loại sản phẩm",
                    template: function(rowObj) {
                        if (rowObj.item_type) {
                            if (rowObj.item_type == "material") {
                                return `<div style="min-width: 100px">Nguyên liệu</div>`;
                            } else if (rowObj.item_type == "raw_material") {
                                return `<div style="min-width: 100px">Nguyên liệu thô</div>`;
                            } else if (rowObj.item_type == "package") {
                                return `<div style="min-width: 100px">Combo</div>`;
                            } else if (rowObj.item_type == "service") {
                                return `<div style="min-width: 100px">Dịch vụ</div>`;
                            } else if (rowObj.item_type == "product") {
                                return `<div style="min-width: 100px">sản phẩm</div>`;
                            } else {
                                return `<div style="min-width: 100px"></div>`;
                            }
                        } else {
                            return `<div style="min-width: 100px"></div>`;
                        }
                    }
                },
                {
                    field: "unit_id",
                    label: "Đơn vị tính",
                    template: function(rowObject) {
                        return `<div style="min-width: 140px;">${rowObject.unit.name}</div>`;
                    }
                },
                {
                    field: "unit_id",
                    label: "Quy đổi",
                    template: function(rowObject) {
                        if (rowObject.unit){
                            if (rowObject.unit.unit_exchange != null){
                                return `<div style="min-width: 140px;"> 1 ${rowObject.unit.name} = ${rowObject.unit.unit_price_exchange} ${rowObject.unit_exchange_name}</div>`;

                            }
                            else{
                                return `<div style="min-width: 100px"></div>`;
    
                            }
                        }
                        
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
            onRowClick: function(event) {
                if (event.rowId) {
                    var path = this.collectionName + '/model?id=' + event.rowId;
                    this.getApp().getRouter().navigate(path);
                }
            },

        },
        tools: [{
            name: "defaultgr",
            type: "group",
            groupClass: "toolbar-group ",
            buttons: [{
                name: "create",
                type: "button",
                buttonClass: "btn btn-primary font-weight-bold btn-sm",
                label: "+ Mặt hàng",
                command: function() {
                    var self = this;
                    this.getApp().getRouter().navigate("#item/model");
                }
            }, ]
        }],

        render: function() {
            var self = this;

            self.registerEvent();

            function capitalizeFirstLetter(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }
            var filter = new CustomFilterView({
                el: self.$el.find("#filter"),
                sessionKey: "item_filter"
            });


            filter.render();

            if (!filter.isEmptyFilter()) {
                var filters = {
                    "$and": [
                        // { "tenant_id": { "$eq": self.getApp().currentTenant } },
                        { "deleted": { "$eq": false } },
                    ]
                };
                self.uiControl.filters = filters;
            }
            self.applyBindings();

            filter.on('filterChanged', function(evt) {
                var $col = self.getCollectionElement();
                var text = !!filter.model.get("text") ? filter.model.get("text").trim() : "";
                var textUpper = !!filter.model.get("text") ? filter.model.get("text").trim().toUpperCase() : "";
                var textLower = !!filter.model.get("text") ? filter.model.get("text").trim().toLowerCase() : "";
                var textFirst = !!filter.model.get("text") ? capitalizeFirstLetter(filter.model.get("text").trim()) : "";
                if ($col) {
                    if (text) {
                        var filters = {
                            "$and": [
                                { "tenant_id": { "$eq": self.getApp().currentTenant } },
                                { "deleted": { "$eq": false } },

                                {
                                    "$or": [
                                        { "item_no": { "$like": textUpper } },
                                        { "item_no": { "$like": textUpper } },
                                        { "item_no": { "$like": textLower } },
                                        { "item_no": { "$like": textFirst } },
                                        { "item_name": { "$like": textUpper } },
                                        { "item_name": { "$like": textUpper } },
                                        { "item_name": { "$like": textLower } },
                                        { "item_name": { "$like": textFirst } },
                                    ]
                                }
                            ]
                        };
                        $col.data('gonrin').filter(filters);
                    } else {
                        filters = {
                            "$and": [
                                // { "tenant_id": { "$eq": self.getApp().currentTenant } },
                                { "deleted": { "$eq": false } }
                            ]
                        };
                        $col.data('gonrin').filter(filters);
                    }
                }
                self.applyBindings();
            });
            return this;
        },

        getTotalItem: function() {
            var self = this;

            self.$el.find("#total-item").combobox({
                textField: "text",
                valueField: "value",
                dataSource: [
                    { text: "__Tất cả__", value: "all" },
                    { text: "Ngừng hoạt động", value: true },
                    { text: "Đang hoạt động", value: false },
                ],
                value: false
            });

            self.$el.find("#total-item").on("change.gonrin", function(event) {
                var text = event.target.value;
                var $col = self.getCollectionElement();
                if (text != "all") {
                    var filters = {
                        "$and": [
                            { "tenant_id": { "$eq": self.getApp().currentTenant } },
                            { "deleted": { "$eq": text } }
                        ],

                    };
                    $col.data('gonrin').filter(filters);
                } else if (text == "all") {
                    var filters = {
                        "$and": [
                            { "tenant_id": { "$eq": self.getApp().currentTenant } }
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

        registerEvent: function() {
            var self = this;
            var currentURL = window.location.href;
            if (self.getApp().isMobile == "ANDROID") {
                $("#project-search-windows").html(``);

                // $("#project-btn").html(`<button type="button" class="btn btn-primary font-weight-bold create-new">+ Xuất hàng</button>`)
                // $(".create-new").on("click", function () {
                // 	self.getApp().getRouter().navigate("#item/model");
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