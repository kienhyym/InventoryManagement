define(function (require) {
	"use strict";
	var $ = require('jquery'),
		_ = require('underscore'),
		Gonrin = require('gonrin');

	var template = require('text!app/view/currency/tpl/collection.html'),
		schema = require('json!schema/CurrencySchema.json');

	return Gonrin.CollectionDialogView.extend({
		template: template,
		modelSchema: schema,
		urlPrefix: "/api/v1/",
		collectionName: "currency",

		textField: "currency_name",
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
						buttonClass: "btn-success btn-sm",
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

				{ field: "currency_name", label: "Tên" },
				{ field: "currency_no", label: "Mã" },
				{ field: "currecy_symbol", label: "Symbol" }
			],
			onRowClick: function (event) {
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

			filter.on('filterChanged', function (evt) {
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


	});

});