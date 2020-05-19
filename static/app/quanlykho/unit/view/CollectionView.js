define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');

    var template = require('text!app/quanlykho/unit/tpl/collection.html'),
        schema = require('json!schema/UnitSchema.json');

    var CustomFilterView = require('app/base/view/CustomFilterView');
    return Gonrin.CollectionView.extend({
        template: template,
        modelSchema: schema,
        urlPrefix: "/api/v1/",
        collectionName: "unit",

        tools: [{
            name: "defaultgr",
            type: "group",
            groupClass: "toolbar-group",
            buttons: [{
                name: "create",
                type: "button",
                buttonClass: "btn btn-primary font-weight-bold btn-sm",
                label: "+ Đơn Vị Tính",
                command: function () {
                    var self = this;
                    this.getApp().getRouter().navigate("#unit/model");
                }
            },]
        }],

        uiControl: {
            fields: [
                { field: "code", label: "Loại đơn vị" },
                { field: "name", label: "Tên đơn vị" },
                {
                    field: "unit_exchange", label: "Đơn vị quy đổi",
                    template: function (rowObject) {
                        if (rowObject.unit_exchange) {
                            return `<div style="min-width: 100px;">1 ${rowObject.name} =${rowObject.unit_price_exchange} ${rowObject.unit_name[0]}</div>`;
                        } else {
                            return ``;
                        }
                    }
                }

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

            self.registerEvent();

            function capitalizeFirstLetter(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }
            var filter = new CustomFilterView({
                el: $("#filter"),
                sessionKey: "unit_filter"
            });
            filter.render();

            if (!filter.isEmptyFilter()) {
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
                                { "code": { "$eq": text } }
                            ]
                        };
                        $col.data('gonrin').filter(filters);
                    } else {
                        filters = {
                            "$and": [
                                { "tenant_id": { "$eq": self.getApp().currentTenant } },
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

        registerEvent: function () {
            var self = this;
            var currentURL = window.location.href;
            if (self.getApp().isMobile == "ANDROID") {
                $("#project-search-windows").html(``);

                // $("#project-btn").html(`<button type="button" class="btn btn-primary font-weight-bold create-new">+ Xuất hàng</button>`)
                // $(".create-new").on("click", function () {
                // 	self.getApp().getRouter().navigate("#unit/model");
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