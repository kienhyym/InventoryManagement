define(function (require) {
	"use strict";
	var $ = require('jquery'),
		_ = require('underscore'),
		Gonrin = require('gonrin');

	var itemTemplate = require('text!app/quanlykho/purchaseorder/tpl/item-view.html'),
		itemSchema = require('json!schema/PurchaseOrderDetailsSchema.json');

	var currencyFormat = {
		symbol: "VNĐ",		// default currency symbol is '$'
		format: "%v %s",	// controls output: %s = symbol, %v = value (can be object, see docs)
		decimal: ",",		// decimal point separator
		thousand: ".",		// thousands separator
		precision: 0,		// decimal places
		grouping: 3		// digit grouping (not implemented yet)
	};

	return Gonrin.ItemView.extend({
		template: itemTemplate,
		tagName: 'tr',
		modelSchema: itemSchema,
		urlPrefix: "/api/v1/",
		collectionName: "collectionName",
		foreignRemoteField: "id",
		foreignField: "purchaseorder_id",
		refresh: true,

		uiControl: {
			fields: [
				{
					field: "list_price",
					uicontrol: "currency",
					currency: currencyFormat,
					cssClass: "text-right"
				},
			]
		},
		render: function () {
			var self = this;
			self.applyBindings();
			self.registerEvent();
			self.caculateAmount();

			self.model.on("change:quantity", function () {
				if (!self.model.get("quantity")) {
					self.model.set("quantity", 1);
				} else {
					self.caculateAmount();
				}
			});

			self.model.on("change:list_price", function () {
				self.caculateAmount();
			});
		},
		caculateAmount: function () {
			var self = this;
			var netAmount = self.model.get("list_price") * self.model.get("quantity");
			self.model.set("net_amount", netAmount);
		},

		registerEvent: function () {
			var self = this;
			loader.show();
			var url = "/api/v1/item/get";

			axios({
				method: "POST",
				url: self.getApp().serviceURL + url,
				data: {
					tenant_id: self.getApp().currentTenant[0]
				}
			}).then(response => {
				// console.log(response.data);
				if (response.data) {
					loader.hide();
					self.$el.find("#item_name input").unbind("keyup").bind("keyup", function (event) {
						var text = event.target.value ? event.target.value.trim() : "";
						if (text) {
							self.$el.find("#item_name").find(".dropdown-menu").addClass("show");
						} else {
							if (self.$el.find("#item_name").find(".dropdown-menu").hasClass("show")) {
								self.$el.find("#item_name").find(".dropdown-menu").removeClass("show");
							}
						}
						var filteredProducts = response.data.filter(item => (item.item_name ? item.item_name.toLocaleLowerCase().includes(text.toLocaleLowerCase()) : false) || (item.item_no ? item.item_no.toLocaleLowerCase().includes(text.toLocaleLowerCase()) : false));
						self.renderSuggestion(filteredProducts, 5);

						if (event.keyCode === 13) {
							if (filteredProducts.length === 1) {
								delete filteredProducts[0].manufacturer;
								delete filteredProducts[0].pack_size;
								delete filteredProducts[0].vendor_part_no;
								delete filteredProducts[0].weight;
								delete filteredProducts[0].organization_id;
								delete filteredProducts[0].is_service;
								delete filteredProducts[0].is_raw;
								delete filteredProducts[0].is_package;
								delete filteredProducts[0].is_material;
								delete filteredProducts[0].importer;
								delete filteredProducts[0].discontinued;
								delete filteredProducts[0].cost_factor;
								delete filteredProducts[0].allow_delivery;
								delete filteredProducts[0].active;
								delete filteredProducts[0].importer;
								delete filteredProducts[0].custom_fields;
								// items.item_image = items.image;
								delete filteredProducts[0].image;
								delete filteredProducts[0].specification;
								delete filteredProducts[0].workstation_id;
								delete filteredProducts[0].purchase_cost;
								// delete items.list_price;
								delete filteredProducts[0].parent_id;
								delete filteredProducts[0].package_products;
								delete filteredProducts[0].position;
								delete filteredProducts[0].extension_data;
								delete filteredProducts[0].status

								// var id = filteredProducts[0].id;
								// filteredProducts[0].item_id = gonrin.uuid();
								filteredProducts[0].item_image = filteredProducts[0].image;
								delete filteredProducts[0].image;
								self.model.set(filteredProducts[0]);

								if (self.$el.find("#item_name").find(".dropdown-menu").hasClass("show")) {
									self.$el.find("#item_name").find(".dropdown-menu").removeClass("show");
								}

							} else {
								var selectedItem = filteredProducts.filter(item => item.item_name.toLocaleLowerCase() == text.toLocaleLowerCase() || item.item_no.toLocaleLowerCase() == text.toLocaleLowerCase());
								if (selectedItem.length == 1) {

									delete selectedItem[0].manufacturer;
									delete selectedItem[0].pack_size;
									delete selectedItem[0].vendor_part_no;
									delete selectedItem[0].weight;
									delete selectedItem[0].organization_id;
									delete selectedItem[0].is_service;
									delete selectedItem[0].is_raw;
									delete selectedItem[0].is_package;
									delete selectedItem[0].is_material;
									delete selectedItem[0].importer;
									delete selectedItem[0].discontinued;
									delete selectedItem[0].cost_factor;
									delete selectedItem[0].allow_delivery;
									delete selectedItem[0].active;
									delete selectedItem[0].importer;
									delete selectedItem[0].custom_fields;
									// items.item_image = items.image;
									delete selectedItem[0].image;
									delete selectedItem[0].specification;
									delete selectedItem[0].workstation_id;
									delete selectedItem[0].purchase_cost;
									delete selectedItem[0].status;
									// delete items.list_price;
									delete selectedItem[0].parent_id;
									delete selectedItem[0].package_products;
									delete selectedItem[0].position;
									delete selectedItem[0].extension_data;

									selectedItem[0].item_image = selectedItem[0].image;

									self.model.set(selectedItem[0]);
									if (self.$el.find("#item_name").find(".dropdown-menu").hasClass("show")) {
										self.$el.find("#item_name").find(".dropdown-menu").removeClass("show");
									}
								}
							}
						}
					});
				}
			}).catch(error => {
				loader.hide();
			});

			self.$el.find("#itemRemove").unbind("click").bind("click", function () {
				self.remove(true);
			});
		},

		renderSuggestion: function (filteredProducts, limit = 5) {
			const self = this;

			var suggestionEl = self.$el.find("#suggestion_list");
			suggestionEl.empty();
			var count = 0;
			filteredProducts.forEach((item, idx) => {
				count++;
				if (count <= limit) {
					suggestionEl.append(self.getDropdownTemplate(item));

					self.$el.find("#dropdown_item_" + item.id).unbind("click").bind("click", function (event) {
						if (self.$el.find("#item_name").find(".dropdown-menu").hasClass("show")) {
							self.$el.find("#item_name").find(".dropdown-menu").removeClass("show");
						}

						var items = clone(item);
						delete items.manufacturer;
						delete items.pack_size;
						delete items.vendor_part_no;
						delete items.weight;
						delete items.organization_id;
						delete items.is_service;
						delete items.is_raw;
						delete items.is_package;
						delete items.is_material;
						delete items.importer;
						delete items.discontinued;
						delete items.cost_factor;
						delete items.allow_delivery;
						delete items.active;
						delete items.importer;
						delete items.custom_fields;
						items.item_image = items.image;
						delete items.image;
						delete items.specification;
						delete items.workstation_id;
						delete items.purchase_cost;
						// delete items.list_price;
						delete items.parent_id;
						delete items.package_products;
						delete items.position;
						delete items.extension_data;
						delete items.status;

						self.model.set(items);

						if (self.$el.find("#item_name").find(".dropdown-menu").hasClass("show")) {
							self.$el.find("#item_name").find(".dropdown-menu").removeClass("show");
						}
					});
				}
			});
		},

		getDropdownTemplate: function (item, showImage = true) {
			var image = "";
			if (item.image) {
				image = item.image;
			}
			var html = `<a class="dropdown-item ellipsis-290" id="dropdown_item_${item.id}" style="overflow: hidden; color: #183fe6; padding: 5px; display: block">`;
			if (showImage === true) {
				html += `<img src="${image}" style="overflow: hidden; width: 40px; height: auto; max-height: 35px;"/> `;
			}
			html += item.item_no.toLocaleUpperCase() + " - " + item.item_name;
			html += '</a>';
			html += '</br>';
			return html;
		},
	});

});
