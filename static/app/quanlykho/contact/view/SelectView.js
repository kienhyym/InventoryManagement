define(function (require) {
	"use strict";
	var $ = require('jquery'),
		_ = require('underscore'),
		Gonrin = require('gonrin');

	var template = require('text!app/quanlykho/contact/tpl/collection.html'),
		schema = require('json!schema/ContactSchema.json');

	return Gonrin.CollectionDialogView.extend({
		template: template,
		modelSchema: schema,
		urlPrefix: "/api/v1/",
		collectionName: "contact",

		textField: "contact_name",
		valueField: "id",
		// tools: [
		// 	{
		// 		name: "defaultgr",
		// 		type: "group",
		// 		groupClass: "toolbar-group",
		// 		buttons: [
		// 			{
		// 				name: "select",
		// 				type: "button",
		// 				buttonClass: "btn-success btn-sm",
		// 				label: "TRANSLATE:SELECT",
		// 				command: function () {
		// 					var self = this;
		// 					self.trigger("onSelected");
		// 					self.close();
		// 				}
		// 			},
		// 		]
		// 	},
		// ],

		uiControl: {
			fields: [

				{ field: "contact_name", label: "Tên" },
				{ field: "contact_no", label: "Mã" },
				{ field: "ity", label: "Địa chỉ thành phố" },
				// { field: "address_zip_code", label: "Zip code" },

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
			self.applyBindings();
			return this;
		},


	});

});