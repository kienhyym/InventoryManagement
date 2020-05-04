define(function (require) {
	"use strict";
	var $ = require('jquery'),
		_ = require('underscore'),
		Gonrin = require('gonrin');

	var template = require('text!app/quanlykho/organization/tpl/select.html'),
		schema = require('json!schema/OrganizationSchema.json');

	var CustomFilterView = require('app/base/view/CustomFilterView');

	return Gonrin.CollectionDialogView.extend({
		template: template,
		modelSchema: schema,
		urlPrefix: "/api/v1/",
		collectionName: "organization",

		textField: "organization_name",
		valueField: "id",
		tools: [
			{
				name: "defaultgr",
				type: "group",
				groupClass: "toolbar-group",
				buttons: [
					{
						name: "select",
						type: "button",
						buttonClass: "btn-info btn-sm btn",
						label: "TRANSLATE:SELECT",
						command: function () {
							var self = this;
							self.trigger("onSelected");
							self.close();
						}
					},
				]
			},
		],

		uiControl: {
			fields: [

				{ field: "organization_name", label: "Mã", width: "90" },
				{ field: "address_city", label: "Địa chỉ thành phố", width: "160" },
				{ field: "address_zip_code", label: "Zip code", width: "120" },

			],
			onRowClick: function (event) {
				var select = [];
				this.uiControl.selectedItems = event.selectedItems;
				this.trigger("onSelected");
				this.close();
			},
			onRendered: function (e) {
				this.trigger("onRendered");
			}
		},

		render: function () {
			var self = this;
			function capitalizeFirstLetter(string) {
				return string.charAt(0).toUpperCase() + string.slice(1);
			}
			var filter = new CustomFilterView({
				el: self.$el.find("#filter"),
				sessionKey: "category_filter"
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

	});

});
