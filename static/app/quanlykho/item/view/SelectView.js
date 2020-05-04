define(function (require) {
	"use strict";
	var $ = require('jquery'),
		_ = require('underscore'),
		Gonrin = require('gonrin');

	var template = require('text!app/item/tpl/select.html'),
		schema = require('json!schema/ItemSchema.json');

	var TemplateHelper = require('app/base/view/TemplateHelper.js');
	var CustomFilterView = require('app/base/view/CustomFilterView.js');

	return Gonrin.CollectionDialogView.extend({
		template: template,
		modelSchema: schema,
		urlPrefix: "/api/v1/",
		collectionName: "item",
		textField: "item_name",

		tools: [
			{
				name: "select",
				type: "button",
				buttonClass: "btn-info btn-sm btn margin-left-5",
				label: "TRANSLATE:SELECT",
				command: function () {
					this.trigger("onSelected");
					this.close();
				}
			}
		],
		uiControl: {
			fields: [
				{ field: "item_name", label: "Tên sản phẩm" },
				{ field: "item_no", label: "Mã sản phẩm" },
				// { field: "list_price", label: "Đơn giá" },
				{
					field: "deleted",
					label: " ",
					width: "60px",
					template: function (rowObject) {
						return TemplateHelper.statusRender(!rowObject.deleted);
					}
				}
			],
			onRowClick: function (event) {
				this.uiControl.selectedItems = event.selectedItems;
			}
		},
    	/**
    	 * 
    	 */
		render: function () {
			var self = this;
			function capitalizeFirstLetter(string) {
				return string.charAt(0).toUpperCase() + string.slice(1);
			}
			var filter = new CustomFilterView({
				el: $("#filter"),
				sessionKey: "item_dialog_filter"
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
								{ "item_no": { "$like": text } },
								{ "item_no": { "$like": textUpper } },
								{ "item_no": { "$like": textLower } },
								{ "item_no": { "$like": textFirst } },
								{ "item_name": { "$like": text } },
								{ "item_name": { "$like": textUpper } },
								{ "item_name": { "$like": textLower } },
								{ "item_name": { "$like": textFirst } }
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
					}
				}
				self.applyBindings();
			});
		},
	});

});