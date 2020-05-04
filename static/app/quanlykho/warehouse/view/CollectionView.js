// define(function (require) {
// 	"use strict";
// 	var $ = require('jquery'),
// 		_ = require('underscore'),
// 		Gonrin = require('gonrin');

// 	var template = require('text!app/warehouse/tpl/collection.html'),
// 		schema = require('json!schema/WarehouseSchema.json');

// 	var Helpers = require('app/base/view/Helper');
// 	var TemplateHelper = require('app/base/view/TemplateHelper');
// 	var CustomFilterView = require('app/base/view/CustomFilterView');

// 	return Gonrin.CollectionView.extend({
// 		template: template,
// 		modelSchema: schema,
// 		urlPrefix: "/api/v1/",
// 		collectionName: "warehouse",

// 		tools: [
// 			{
// 				name: "defaultgr",
// 				type: "group",
// 				groupClass: "toolbar-group",
// 				buttons: [
// 					{
// 						name: "create",
// 						type: "button",
// 						buttonClass: "btn btn-primary font-weight-bold",
// 						label: "+ Kho",
// 						command: function () {
// 							var self = this;
// 							this.getApp().getRouter().navigate("#warehouse/model");
// 						}
// 					},
// 				]
// 			}],

// 		uiControl: {
// 			fields: [
// 				{
// 					field: "warehouse_no", label: "Mã kho", template: function (r) {
// 						if (r.warehouse_no) {
// 							return `<div style="width: 170px">${r.warehouse_no}</div>`;
// 						} else {
// 							return ``;
// 						}
// 					}
// 				},
// 				{
// 					field: "warehouse_name", label: "Tên kho", template: function (r) {
// 						if (r.warehouse_name) {
// 							return `<div style="width: 170px">${r.warehouse_name}</div>`;
// 						} else {
// 							return ``;
// 						}
// 					}
// 				},
// 				{
// 					field: "address_city", label: "Thành phố", template: function (r) {
// 						if (r.address_city) {
// 							return `<div style="width: 170px">${r.address_city}</div>`;
// 						} else {
// 							return ``;
// 						}
// 					}
// 				},
// 				{
// 					field: "address_code", label: "Số nhà", template: function (r) {
// 						if (r.address_code) {
// 							return `<div style="width: 200px">${r.address_code}</div>`;
// 						} else {
// 							return ``;
// 						}
// 					}
// 				},
// 				{
// 					field: "address_country", label: "Quốc gia", template: function (r) {
// 						if (r.address_country) {
// 							return `<div style="width: 170px">${r.address_country}</div>`;
// 						} else {
// 							return ``;
// 						}
// 					}
// 				},
// 				{
// 					field: "deleted",
// 					label: " ",
// 					template: function (rowObj) {
// 						if (rowObj.deleted) {
// 							return TemplateHelper.statusRender(!rowObj.deleted);
// 						} else {
// 							return ``;
// 						}
// 					}
// 				}

// 			],
// 			onRowClick: function (event) {
// 				if (event.rowId) {
// 					var path = this.collectionName + '/model?id=' + event.rowId;
// 					this.getApp().getRouter().navigate(path);
// 				}

// 			}
// 		},

// 		render: function () {
// 			var self = this;
// 			// self.registerEvent();
// 			// function capitalizeFirstLetter(string) {
// 			// 	return string.charAt(0).toUpperCase() + string.slice(1);
// 			// }
// 			// var filter = new CustomFilterView({
// 			// 	el: $("#filter"),
// 			// 	sessionKey: "user_filter"
// 			// });
// 			// filter.render();

// 			// if (!filter.isEmptyFilter()) {
// 			// 	axios.get("http://localhost:7100/accounts/api/v1/tenant/user_permission?user_id=" + self.getApp().currentUser.id + "&tenant_id=" + self.getApp().currentTenant).then(response => {
// 			// 		if (self.getApp().roleInfo == "admin") {
// 			// 			var filters = {
// 			// 				"$and": [
// 			// 					{ "tenant_id": { "$eq": self.getApp().currentTenant } },
// 			// 					{ "deleted": { "$eq": false } },
// 			// 				],
// 			// 			};
// 			// 			self.uiControl.filters = filters;
// 			// 		} else if (self.getApp().roleInfo == "2") {
// 			// 			var listWarehouse = [];
// 			// 			response.data.warehouses.forEach((ware) => {
// 			// 				if (ware.role) {
// 			// 					if (ware.role == "manager") {
// 			// 						listWarehouse.push(ware.warehouse_id);
// 			// 					}
// 			// 				}

// 			// 			});

// 			// 			var filters = {
// 			// 				"$and": [
// 			// 					{ "tenant_id": { "$eq": self.getApp().currentTenant } },
// 			// 					{ "deleted": { "$eq": false } },
// 			// 					{
// 			// 						"id": {
// 			// 							"$in": listWarehouse
// 			// 						}
// 			// 					}
// 			// 				],
// 			// 			};
// 			// 			self.uiControl.filters = filters;
// 			// 		} else if (self.getApp().roleInfo == "3") {
// 			// 			var listWarehouse = [];
// 			// 			response.data.warehouses.forEach((ware) => {
// 			// 				if (ware.role) {
// 			// 					if (ware.role == "employee") {
// 			// 						listWarehouse.push(ware.warehouse_id);
// 			// 					}
// 			// 				}
// 			// 			});

// 			// 			var filters = {
// 			// 				"$and": [
// 			// 					{ "tenant_id": { "$eq": self.getApp().currentTenant } },
// 			// 					{ "deleted": { "$eq": false } },
// 			// 					{
// 			// 						"id": {
// 			// 							"$in": listWarehouse
// 			// 						}
// 			// 					}
// 			// 				],
// 			// 			};
// 			// 			self.uiControl.filters = filters;
// 			// 		}
// 			// 		self.applyBindings();
// 			// 	});
// 			// }

// 			// filter.on('filterChanged', function (evt) {
// 			// 	var $col = self.getCollectionElement();
// 			// 	var text = !!evt.data.text ? evt.data.text.trim() : "";
// 			// 	var textUpper = !!filter.model.get("text") ? filter.model.get("text").trim().toUpperCase() : "";
// 			// 	var textLower = !!filter.model.get("text") ? filter.model.get("text").trim().toLowerCase() : "";
// 			// 	var textFirst = !!filter.model.get("text") ? capitalizeFirstLetter(filter.model.get("text").trim()) : "";
// 			// 	if ($col) {
// 			// 		if (text !== null) {
// 			// 			axios.get("http://localhost:7100/accounts/api/v1/tenant/user_permission?user_id=" + self.getApp().currentUser.id + "&tenant_id=" + self.getApp().currentTenant).then(response => {
// 			// 				if (self.getApp().roleInfo == "admin") {
// 			// 					var filters = {
// 			// 						"$and": [
// 			// 							{ "tenant_id": { "$eq": self.getApp().currentTenant } },
// 			// 							{ "deleted": { "$eq": false } },
// 			// 							{
// 			// 								"$or": [
// 			// 									{ "warehouse_no": { "$like": text } },
// 			// 									{ "warehouse_no": { "$like": textUpper } },
// 			// 									{ "warehouse_no": { "$like": textLower } },
// 			// 									{ "warehouse_no": { "$like": textFirst } },

// 			// 									{ "phone": { "$like": text } },
// 			// 									{ "phone": { "$like": textUpper } },
// 			// 									{ "phone": { "$like": textLower } },
// 			// 									{ "phone": { "$like": textFirst } },

// 			// 									{ "email": { "$like": text } },
// 			// 									{ "email": { "$like": textUpper } },
// 			// 									{ "email": { "$like": textLower } },
// 			// 									{ "email": { "$like": textFirst } },
// 			// 								]
// 			// 							}
// 			// 						],
// 			// 					};
// 			// 					$col.data('gonrin').filter(filters);
// 			// 				} else if (self.getApp().roleInfo == "2") {
// 			// 					var listWarehouse = [];
// 			// 					response.data.warehouses.forEach((ware) => {
// 			// 						if (ware.role) {
// 			// 							if (ware.role == "manager") {
// 			// 								listWarehouse.push(ware.warehouse_id);
// 			// 							}
// 			// 						}

// 			// 					});

// 			// 					var filters = {
// 			// 						"$and": [
// 			// 							{ "tenant_id": { "$eq": self.getApp().currentTenant } },
// 			// 							{ "deleted": { "$eq": false } },
// 			// 							{
// 			// 								"id": {
// 			// 									"$in": listWarehouse
// 			// 								}
// 			// 							},
// 			// 							{
// 			// 								"$or": [
// 			// 									{ "warehouse_no": { "$like": text } },
// 			// 									{ "warehouse_no": { "$like": textUpper } },
// 			// 									{ "warehouse_no": { "$like": textLower } },
// 			// 									{ "warehouse_no": { "$like": textFirst } },

// 			// 									{ "phone": { "$like": text } },
// 			// 									{ "phone": { "$like": textUpper } },
// 			// 									{ "phone": { "$like": textLower } },
// 			// 									{ "phone": { "$like": textFirst } },

// 			// 									{ "email": { "$like": text } },
// 			// 									{ "email": { "$like": textUpper } },
// 			// 									{ "email": { "$like": textLower } },
// 			// 									{ "email": { "$like": textFirst } },
// 			// 								]
// 			// 							}
// 			// 						],
// 			// 					};
// 			// 					$col.data('gonrin').filter(filters);

// 			// 				} else if (self.getApp().roleInfo == "3") {
// 			// 					var listWarehouse = [];
// 			// 					response.data.warehouses.forEach((ware) => {
// 			// 						if (ware.role) {
// 			// 							if (ware.role == "employee") {
// 			// 								listWarehouse.push(ware.warehouse_id);
// 			// 							}
// 			// 						}
// 			// 					});

// 			// 					var filters = {
// 			// 						"$and": [
// 			// 							{ "tenant_id": { "$eq": self.getApp().currentTenant } },
// 			// 							{ "deleted": { "$eq": false } },
// 			// 							{
// 			// 								"id": {
// 			// 									"$in": listWarehouse
// 			// 								}
// 			// 							},
// 			// 							{
// 			// 								"$or": [
// 			// 									{ "warehouse_no": { "$like": text } },
// 			// 									{ "warehouse_no": { "$like": textUpper } },
// 			// 									{ "warehouse_no": { "$like": textLower } },
// 			// 									{ "warehouse_no": { "$like": textFirst } },

// 			// 									{ "phone": { "$like": text } },
// 			// 									{ "phone": { "$like": textUpper } },
// 			// 									{ "phone": { "$like": textLower } },
// 			// 									{ "phone": { "$like": textFirst } },

// 			// 									{ "email": { "$like": text } },
// 			// 									{ "email": { "$like": textUpper } },
// 			// 									{ "email": { "$like": textLower } },
// 			// 									{ "email": { "$like": textFirst } },
// 			// 								]
// 			// 							}
// 			// 						],
// 			// 					};
// 			// 					$col.data('gonrin').filter(filters);
// 			// 				}
// 			// 				self.applyBindings();
// 			// 			});
// 			// 		}
// 			// 	}
// 			// });
// 		},

// 		registerEvent: function () {
// 			var self = this;
// 			var currentURL = window.location.href;
// 			if (self.getApp().isMobile == "ANDROID") {
// 				$("#project-search-windows").html(``);

// 				// $("#project-btn").html(`<button type="button" class="btn btn-primary font-weight-bold create-new">+ Xuất hàng</button>`)
// 				// $(".create-new").on("click", function () {
// 				// 	self.getApp().getRouter().navigate("#warehouse/model");
// 				// });
// 				$("#project-search-mobile").html(`
// 					<li class="nav-item nav-search d-lg-block">
// 					<div class="col-md-12 col-sm-12 col-xs-12 col-12" id="filter"></div>
// 				</li>`);

// 			} else if (self.getApp().isMobile == "WINDOWS") {
// 				$("#project-search-mobile").html(``);
// 				$("#project-search-windows").html(`
// 					<li class="nav-item nav-search d-lg-block">
// 					<div class="col-md-12 col-sm-12 col-xs-12 col-12" id="filter"></div>
// 				</li>`);
// 			}
// 		},
// 	});

// });




define(function(require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');

    var template = require('text!app/quanlykho/warehouse/tpl/collection.html'),
        schema = require('json!schema/WarehouseSchema.json');

    return Gonrin.CollectionView.extend({
        template: template,
        modelSchema: schema,
        urlPrefix: "/api/v1/",
        collectionName: "warehouse",
        tools: [{
            name: "defaultgr",
            type: "group",
            groupClass: "toolbar-group",
            buttons: [{
                name: "create",
                type: "button",
                buttonClass: "btn btn-primary font-weight-bold btn-sm",
                label: "+ Kho",
                command: function() {
                    var self = this;
                    this.getApp().getRouter().navigate("#warehouse/model");
                }
            }, ]
        }],
        uiControl: {
            fields: [{
                    field: "warehouse_name",
                    label: "Tên kho",
                    width: 250,
                    readonly: true,
                },


            ],
            onRowClick: function(event) {
                if (event.rowId) {
                    var path = this.collectionName + '/model?id=' + event.rowId;
                    this.getApp().getRouter().navigate(path);
                }
            }
        },
        render: function() {
            this.applyBindings();
            return this;
        },

    });

});