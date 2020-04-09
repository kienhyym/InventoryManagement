define(function (require) {
	"use strict";
	var $ = require('jquery'),
		_ = require('underscore'),
		Gonrin = require('gonrin');
	return [
		{
			"text": "Vật tư y tế",
			"icon": "fa fa-book",
			"type": "view",
			"collectionName": "item",
			"route": "item/collection",
			"visible": function () {
				return true
			}
		},
		{
			"text": "Mua hàng",
			"icon": "fa fa-book",
			"type": "view",
			"collectionName": "purchaseorder",
			"route": "purchaseorder/collection",
			"visible": function () {
				return true
			}
		},
		{
			"text": "Khách hàng",
			"icon": "fa fa-book",
			"type": "view",
			"collectionName": "contact",
			"route": "contact/collection",
			"visible": function () {
				return true
			}
		},
		{
			"text": "Nhập hàng",
			"icon": "fa fa-book",
			"type": "view",
			"collectionName": "goodsreciept",
			"route": "goodsreciept/collection",
			"visible": function () {
				return true
			}
		},
		{
			"text": "Kho",
			"icon": "fa fa-book",
			"type": "view",
			"collectionName": "warehouse",
			"route": "warehouse/collection",
			"visible": function () {
				return true
			}
		},
		{
			"text": "Tiền tệ",
			"icon": "fa fa-book",
			"type": "view",
			"collectionName": "currency",
			"route": "currency/collection",
			"visible": function () {
				return true
			}
		},
		{
			"text": "Doanh nghiệp",
			"icon": "fa fa-book",
			"type": "view",
			"collectionName": "organization",
			"route": "organization/collection",
			"visible": function () {
				return true
			}
		},
	];

});


