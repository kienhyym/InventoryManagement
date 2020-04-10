define(function (require) {
	"use strict";
	var $ = require('jquery'),
		_ = require('underscore'),
		Gonrin = require('gonrin');

	var itemTemplate = require('text!app/move-warehouse/tpl/item.html'),
		itemSchema = require('json!schema/MoveWarehouseDetailsSchema.json');

	// var DeliveryNote = require("app/view/delivery-note/ModelView")

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
		collectionName: "movewarehousedetails",
		foreignRemoteField: "id",
		foreignField: "movewarehouse_id",

		uiControl: {
			fields: [

				// {
				// 	field: "list_price",
				// 	uicontrol: "currency",
				// 	currency: currencyFormat,
				// 	cssClass: "text-right"
				// },
				// {
				// 	field: "net_amount",
				// 	uicontrol: "currency",
				// 	currency: currencyFormat,
				// 	cssClass: "text-right"
				// },
			]
		},
		render: function () {
			var self = this;
			this.applyBindings();
			self.registerEvent();

		},

		// updateQuantityItem: function (itemID, quantity, ID) {
		// 	var self = this;
		// 	loader.show();
		// 	console.log(itemID);
		// 	$.ajax({
		// 		url: self.getApp().serviceURL + "/api/v1/get_all_goodsreciept_details_by_warehouse",
		// 		type: "POST",
		// 		data: JSON.stringify({
		// 			item_id: itemID,
		// 			quantity: quantity,
		// 			// id: ID
		// 		}),
		// 		success: function (response) {
		// 			loader.hide();
		// 			console.log("response", response);
		// 			if (response) {
		// 				var quantityNew = self.model.get("quantity");
		// 				quantityNew += quantity;
		// 				self.model.set("quantity", quantityNew);

		// 			}
		// 			self.getApp().notify({ message: response.error_message }, { type: "success", delay: 1000 });
		// 		},
		// 		error: function (xhr, status, error) {
		// 			loader.hide();
		// 			console.log(xhr.responseJSON);
		// 			// ($.parseJSON(xhr.responseText).error_message)
		// 			self.getApp().notify({ message: $.parseJSON(xhr.responseText).error_message }, { type: "danger", delay: 1000 });
		// 		}
		// 	});
		// },


		registerEvent: function () {
			var self = this;
			loader.show();

			var id = self.getApp().getRouter().getParam("id");
			if (id) {
				self.$el.find("#quantity_delivery").attr("readonly", false);
			}
			// if ($("#goodsreciept_from").attr("data-id") != $("#goodsreciept_to").attr("data-id")) {
			// 	self.$el.find("#quantity_delivery").attr("readonly", false);
			// } else {
			// 	self.getApp().notify("Kho bị trùng");
			// }


			$.ajax({
				url: self.getApp().serviceURL + "/api/v1/get-goodsreciept-details",
				type: "POST",
				data: JSON.stringify({
					goodsreciept_id: $("#goodsreciept_from").attr("data-id")
				}),
				success: function (response) {
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
						var filteredProducts = response.filter(item => (item.item_name ? item.item_name.toLocaleLowerCase().includes(text.toLocaleLowerCase()) : false) || (item.item_no ? item.item_no.toLocaleLowerCase().includes(text.toLocaleLowerCase()) : false));
						self.renderSuggestion(filteredProducts, 5);

						if (event.keyCode === 13) {
							if (filteredProducts.length === 1) {

								delete filteredProducts[0].goodsreciept_id;
								delete filteredProducts[0].purchase_cost;
								delete filteredProducts[0].item_exid;
								delete filteredProducts[0].item_image;
								filteredProducts[0].id = filteredProducts[0].id;

								self.model.set(filteredProducts[0]);

								if (self.$el.find("#item_name").find(".dropdown-menu").hasClass("show")) {
									self.$el.find("#item_name").find(".dropdown-menu").removeClass("show");
								}

							} else {
								var selectedItem = filteredProducts.filter(item => item.item_name.toLocaleLowerCase() == text.toLocaleLowerCase() || item.item_no.toLocaleLowerCase() == text.toLocaleLowerCase());
								if (selectedItem.length == 1) {

									delete selectedItem[0].goodsreciept_id;
									delete selectedItem[0].purchase_cost;
									delete selectedItem[0].item_exid;
									delete selectedItem[0].item_image;

									selectedItem[0].id = selectedItem[0].id;
									self.model.set(selectedItem[0]);

									if (self.$el.find("#item_name").find(".dropdown-menu").hasClass("show")) {
										self.$el.find("#item_name").find(".dropdown-menu").removeClass("show");
									}
								}
							}
						}
					});
				},
				error: function (xhr, statusText, errorThrow) {
					loader.hide();
				}
			});
			self.$el.find("#quantity_delivery").unbind("click").bind("click", function () {
				var id = self.getApp().getRouter().getParam("id");
				if (id) {
					$.confirm({
						title: 'Xác thực!',
						content: '<div><label>Nhập số lượng: </label><input type="text" id="sl" class="form-control" autofocus /></div>',
						buttons: {
							ok: {
								btnClass: "btn btn-sm btn-primary",
								action: function () {
									var sl = $("#sl").val();
									var id = self.getApp().getRouter().getParam("id");
									if (id) {
										var deliverys = clone(self.model.toJSON());
										deliverys.goodsreciept_to_id = $("#goodsreciept_to").attr("data-id");
										deliverys.goodsreciept_from_id = $("#goodsreciept_from").attr("data-id");
										deliverys.quantity_delivery = parseFloat(sl);
										self.confirmDelivery(deliverys);
									}
								}
							},
							cancel: function () {
								// self.getApp().notify({message: "Canceled"}, {type: "info", delay: 100});
							}
						}
					});
				}

			});

			self.$el.find("#itemRemove").unbind("click").bind("click", function () {
				self.remove(true);
			});

			loader.hide();

			self.model.on("change:quantity_delivery", function () {


			});

		},

		renderSuggestion: function (filteredProducts, limit = 5) {
			const self = this;
			var suggestionEl = this.$el.find("#suggestion_list");
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
						delete items.goodsreciept_id;
						delete items.purchase_cost;
						delete items.item_exid;
						delete items.item_image;

						items.id = items.id;

						self.model.set(items);
					});
				}
			});
		},

		getDropdownTemplate: function (item, showImage = true) {
			var image = "";
			var itemNo = item.item_no ? item.item_no.toLocaleUpperCase() : "";
			if (item.image) {
				image = item.image;
			}
			var html = `<a class="dropdown-item ellipsis-290" id="dropdown_item_${item.id}" style="overflow: hidden; width: 230px; color: #183fe6; padding: 5px; display: block">`;
			if (showImage === true) {
				html += `<img src="${image}" style="overflow: hidden; width: 40px; height: auto; max-height: 65px;"/> `;
			}
			html += itemNo + " - " + item.item_name;
			html += '</a>';
			html += '</br>';
			return html;
		},

		confirmDelivery: function (deliverys) {
			var self = this;

			var quantityOld = self.model.get("quantity_delivery");
			self.model.set("quantity_delivery", parseFloat(quantityOld + deliverys.quantity_delivery));

			$.ajax({
				url: self.getApp().serviceURL + "/api/v1/delivery-warehouse",
				type: "POST",
				data: JSON.stringify({
					delivery: deliverys
				}),
				success: function (response) {
					if (response) {
						toastr.info("Chuyển thành công");
						$("#auto-save").trigger("click");
					}
				},
				error: function (xhr) {
					console.log(xhr);
					toastr.error(xhr.responseJSON.error_message);
				}
			});
		},
	});

});