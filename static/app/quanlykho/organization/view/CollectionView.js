define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');

    var template = require('text!app/quanlykho/organization/tpl/collection.html'),
        schema = require('json!schema/OrganizationSchema.json');

    var TemplateHelper = require('app/base/view/TemplateHelper');
    var Helpers = require("app/base/view/Helper");
    var CustomFilterView = require('app/base/view/CustomFilterView');

    return Gonrin.CollectionView.extend({
        template: template,
        modelSchema: schema,
        urlPrefix: "/api/v1/",
        collectionName: "organization",

        tools: [{
            name: "defaultgr",
            type: "group",
            groupClass: "toolbar-group",
            buttons: [{
                name: "create",
                type: "button",
                buttonClass: "btn btn-primary font-weight-bold btn-sm",
                label: "+ Công Ty",
                command: function () {
                    var self = this;
                    this.getApp().getRouter().navigate("#organization/model");
                }
            },]
        }],

        uiControl: {
            fields: [
                {
                    field: "stt",
                    label: "STT",
                },
                {
                    field: "organization_name",
                    label: "Tên công ty",
                    template: function (r) {
                        if (r.organization_name) {
                            return `<div class="ellipsis-300" style="min-width: 200px">${r.organization_name}</div>`;
                        } else {
                            return ``;
                        }
                    }
                },
                {
                    field: "organization_type",
                    label: "Loại doanh nghiệp",
                    template: function (r) {
                        if (r.organization_type == 'customer') {
                            return `<div class="ellipsis-300" style="min-width: 200px">Đơn vị mua hàng</div>`;
                        }
                        if (r.organization_type == 'reseller') {
                            return `<div class="ellipsis-300" style="min-width: 200px">Đơn vị cung cấp hàng</div>`;
                        }
                         else {
                            return ``;
                        }
                    }
                },
                {
                    field: "amount",
                    label: "Tiền nợ",
                    template: function (rowObject) {
                        if (rowObject.amount) {
                            var resultNetAmount = new Number(rowObject.amount).toLocaleString("en-AU");
                            return `<div class="text-danger font-weight-bold">${resultNetAmount} vnđ</div>`;
                        } else {
                            return ``;
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
            self.registerEvent();

            function capitalizeFirstLetter(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }
            var filter = new CustomFilterView({
                el: $("#filter"),
                sessionKey: "organization_filter"
            });
            filter.render();

            if (!filter.isEmptyFilter()) {
                var filters = {
                    "$and": [
                        { "organization_exid": { "$eq": self.getApp().currentTenant } },
                        { "deleted": { "$eq": false } }
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
                                { "organization_exid": { "$eq": self.getApp().currentTenant } },
                                { "deleted": { "$eq": false } },
                                { "organization_no": { "$eq": text } },
                                { "organization_name": { "$eq": text } },
                                { "organization_no": { "$eq": textUpper } },
                                { "organization_name": { "$eq": textUpper } },
                                { "organization_no": { "$eq": textFirst } },
                                { "organization_name": { "$eq": textFirst } },
                                { "organization_no": { "$eq": textLower } },
                                { "organization_name": { "$eq": textLower } },
                            ]
                        };
                        $col.data('gonrin').filter(filters);
                    } else {
                        filters = {
                            "$and": [
                                { "organization_exid": { "$eq": self.getApp().currentTenant } },
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