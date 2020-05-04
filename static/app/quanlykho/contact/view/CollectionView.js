define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');

    var template = require('text!app/quanlykho/contact/tpl/collection.html'),
        schema = require('json!schema/ContactSchema.json');

    // var TemplateHelper = require('app/common/TemplateHelper');
    // var Helpers = require("app/common/Helper");
    // var ContacModel = require("app/view/contact/view/ModelView");
    // var CustomFilterView = require('app/base/search/CustomFilterView');
    var Helpers = require('app/base/view/Helper');
	var TemplateHelper = require('app/base/view/TemplateHelper');
	var CustomFilterView = require('app/base/view/CustomFilterView');

    return Gonrin.CollectionView.extend({
        template: template,
        modelSchema: schema,
        urlPrefix: "/api/v1/",
        collectionName: "contact",

        tools: [{
            name: "defaultgr",
            type: "group",
            groupClass: "toolbar-group",
            buttons: [{
                name: "create",
                type: "button",
                buttonClass: "btn btn-primary font-weight-bold",
                label: "+ Khách Hàng",
                command: function () {
                    var self = this;
                    this.getApp().getRouter().navigate("#contact/model");
                }
            },]
        }],

        uiControl: {
            fields: [{
                field: "contact_no",
                label: "Mã khách hàng",
                template: function (obj) {
                    if (obj.contact_no) {
                        return `<div style="width: 120px">${obj.contact_no}</div>`;
                    } else {
                        return `<div style="width: 100px"></div>`;
                    }
                }
            },
            {
                field: "contact_name",
                label: "Tên khách hàng",
                template: function (obj) {
                    if (obj.contact_name) {
                        return `<div style="width: 120px">${obj.contact_name}</div>`;
                    } else {
                        return `<div style="width: 100px"></div>`;
                    }
                }
            },
            {
                field: "email",
                label: "Email",
                template: function (obj) {
                    if (obj.email) {
                        return `<div style="width: 120px">${obj.email}</div>`;
                    } else {
                        return `<div style="width: 100px"></div>`;
                    }
                }
            },
            {
                field: "phone",
                label: "Số điện thoại",
                template: function (obj) {
                    if (obj.phone) {
                        return `<div style="width: 120px">${obj.phone}</div>`;
                    } else {
                        return `<div style="width: 100px"></div>`;
                    }
                }
            },
            {
                field: "address_street",
                label: "Địa chỉ",
                template: function (obj) {
                    if (obj.address_street) {
                        return `<div style="width: 120px">${obj.address_street}</div>`;
                    } else {
                        return `<div style="width: 100px"></div>`;
                    }
                }
            },
            {
                field: "deleted",
                label: " ",
                template: function (rowObj) {
                    return TemplateHelper.statusRender(!rowObj.deleted);
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
                sessionKey: "contact_filter"
            });
            filter.render();

            if (!filter.isEmptyFilter()) {
                var filters = {
                    "$and": [{
                        "tenant_id": {
                            "$eq": self.getApp().currentTenant
                        }
                    },
                    {
                        "deleted": {
                            "$eq": false
                        }
                    }
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
                    if (text) {
                        var filters = {
                            "$and": [
                                { "tenant_id": { "$eq": self.getApp().currentTenant } },
                                { "deleted": { "$eq": false } },
                                {
                                    "$or": [
                                        { "contact_no": { "$like": text } },
                                        { "contact_no": { "$like": textUpper } },
                                        { "contact_no": { "$like": textLower } },
                                        { "contact_no": { "$like": textFirst } },

                                        { "contact_name": { "$like": text } },
                                        { "contact_name": { "$like": textUpper } },
                                        { "contact_name": { "$like": textLower } },
                                        { "contact_name": { "$like": textFirst } },

                                        { "email": { "$like": text } },
                                        { "email": { "$like": textUpper } },
                                        { "email": { "$like": textLower } },
                                        { "email": { "$like": textFirst } },

                                        { "phone": { "$like": text } },
                                        { "phone": { "$like": textUpper } },
                                        { "phone": { "$like": textLower } },
                                        { "phone": { "$like": textFirst } },
                                    ]
                                }
                            ],
                        };
                        $col.data('gonrin').filter(filters);
                    } else {
                        var filters = {
                            "$and": [{
                                "tenant_id": {
                                    "$eq": self.getApp().currentTenant
                                }
                            },
                            {
                                "deleted": {
                                    "$eq": false
                                }
                            },
                            ]
                        };
                        $col.data('gonrin').filter(filters);
                    }
                }
                self.applyBindings();
            });
            return;
        },

        registerEvent: function () {
            var self = this;
            var currentURL = window.location.href;
            if (self.getApp().isMobile == "ANDROID") {
                $("#project-search-windows").html(``);

                // $("#project-btn").html(`<button type="button" class="btn btn-primary font-weight-bold create-new">+ Xuất hàng</button>`)
                // $(".create-new").on("click", function () {
                // 	self.getApp().getRouter().navigate("#contact/model");
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
