define(function(require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');

    var template = require('text!app/quanlykho/currency/tpl/collection.html'),
        schema = require('json!schema/CurrencySchema.json');

    var CustomFilterView = require('app/base/view/CustomFilterView');

    return Gonrin.CollectionView.extend({
        template: template,
        modelSchema: schema,
        urlPrefix: "/api/v1/",
        collectionName: "currency",

        tools: [{
            name: "defaultgr",
            type: "group",
            groupClass: "toolbar-group",
            buttons: [{
                name: "create",
                type: "button",
                buttonClass: "btn btn-primary font-weight-bold btn-sm",
                label: "+ Tiền Tệ",
                command: function() {
                    var self = this;
                    this.getApp().getRouter().navigate("#currency/model");
                }
            }, ]
        }],

        uiControl: {
            fields: [
                { field: "currency_name", label: "Tên" },
                { field: "currency_code", label: "Code" },
                { field: "currency_symbol", label: "Symbol" },
            ],
            onRowClick: function(event) {
                if (event.rowId) {
                    var path = this.collectionName + '/model?id=' + event.rowId;
                    this.getApp().getRouter().navigate(path);
                }

            }
        },

        render: function() {
            var self = this;
            self.registerEvent();

            var filter = new CustomFilterView({
                el: $("#filter"),
                sessionKey: "deliverynote_filter"
            });
            filter.render();

            if (!filter.isEmptyFilter()) {
                var filters = {
                    "$and": [
                        { "tenant_id": { "$eq": self.getApp().currentTenant } },
                        { "deleted": { "$eq": false } }
                    ]
                };
                self.uiControl.filters = filters;
            }
            self.applyBindings();

            filter.on('filterChanged', function(evt) {
                var $col = self.getCollectionElement();
                var text = !!evt.data.text ? evt.data.text.trim() : "";
                if ($col) {
                    if (text) {
                        var filters = {
                            "$and": [
                                { "tenant_id": { "$eq": self.getApp().currentTenant } },
                                { "deleted": { "$eq": false } },
                                { "currency_code": { "$eq": text } }
                            ]
                        };
                        $col.data('gonrin').filter(filters);
                    } else {
                        var filters = {
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
            return;
        },

        registerEvent: function() {
            var self = this;
            var currentURL = window.location.href;
            if (self.getApp().isMobile == "ANDROID") {
                $("#project-search-windows").html(``);

                // $("#project-btn").html(`<button type="button" class="btn btn-primary font-weight-bold create-new">+ Xuất hàng</button>`)
                // $(".create-new").on("click", function () {
                // 	self.getApp().getRouter().navigate("#currency/model");
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