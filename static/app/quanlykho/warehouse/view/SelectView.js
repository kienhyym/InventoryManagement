define(function (require) {
	"use strict";
	var $ = require('jquery'),
		_ = require('underscore'),
		Gonrin = require('gonrin');

	var template = require('text!app/quanlykho/view/warehouse/tpl/select.html'),
		schema = require('json!schema/WarehouseSchema.json');

	var CustomFilterView = require('app/base/search/CustomFilterView');
	var TemplateHelper = require('app/common/TemplateHelper');

	return Gonrin.CollectionDialogView.extend({
		template: template,
		modelSchema: schema,
		urlPrefix: "/api/v1/",
		collectionName: "warehouse",
		textField: "warehouse_name",

		uiControl: {
			fields: [
				{ field: "warehouse_name", label: "Tên sản phẩm" },
				{ field: "warehouse_no", label: "Mã sản phẩm" },
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
				this.trigger("onSelected");
				this.close();
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
				el: self.$el.find("#filter"),
				sessionKey: "warehouse_dialog_filter"
			});
			filter.render();

			if (!filter.isEmptyFilter()) {
				var text = !!filter.model.get("text") ? filter.model.get("text").trim() : "";
				var textUpper = !!filter.model.get("text") ? filter.model.get("text").trim().toUpperCase() : "";
				var textLower = !!filter.model.get("text") ? filter.model.get("text").trim().toLowerCase() : "";
				var textFirst = !!filter.model.get("text") ? capitalizeFirstLetter(filter.model.get("text").trim()) : "";
				var filters = {
					"$or": [
						{ "warehouse_no": { "$like": text } },
						{ "warehouse_no": { "$like": textUpper } },
						{ "warehouse_no": { "$like": textLower } },
						{ "warehouse_no": { "$like": textFirst } },
						{ "warehouse_name": { "$like": text } },
						{ "warehouse_name": { "$like": textUpper } },
						{ "warehouse_name": { "$like": textLower } },
						{ "warehouse_name": { "$like": textFirst } }
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
					if (text !== null) {
						var filters = {
							"$or": [
								{ "warehouse_no": { "$like": text } },
								{ "warehouse_no": { "$like": textUpper } },
								{ "warehouse_no": { "$like": textLower } },
								{ "warehouse_no": { "$like": textFirst } },
								{ "warehouse_name": { "$like": text } },
								{ "warehouse_name": { "$like": textUpper } },
								{ "warehouse_name": { "$like": textLower } },
								{ "warehouse_name": { "$like": textFirst } }
							]
						};
						$col.data('gonrin').filter(filters);
						//self.uiControl.filters = filters;
					} else {
						self.uiControl.filters = null;
					}
				}
				self.applyBindings();
			});

			return this;
		}

	});

});