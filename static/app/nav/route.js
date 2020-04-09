define(function (require) {
	"use strict";
	var $ = require('jquery'),
		_ = require('underscore'),
		Gonrin = require('gonrin');
	return [
		{
			"collectionName": "user",
			"route": "user/collection",
			"$ref": "app/hethong/user/js/CollectionView",
		},
		{
			"collectionName": "user",
			"route": "user/model(/:id)",
			"$ref": "app/hethong/user/js/ModelView",
		},
		{
			"collectionName": "nation",
			"route": "nation/collection",
			"$ref": "app/danhmuc/Nation/view/CollectionView",
		},
		{
			"collectionName": "nation",
			"route": "nation/model(/:id)",
			"$ref": "app/danhmuc/Nation/view/ModelView",
		},

		{
			"collectionName": "province",
			"route": "province/collection",
			"$ref": "app/danhmuc/Province/view/CollectionView",
		},
		{
			"collectionName": "province",
			"route": "province/model(/:id)",
			"$ref": "app/danhmuc/Province/view/ModelView",
		},

		{
			"collectionName": "district",
			"route": "district/collection",
			"$ref": "app/danhmuc/District/view/CollectionView",
		},
		{
			"collectionName": "district",
			"route": "district/model(/:id)",
			"$ref": "app/danhmuc/District/view/ModelView",
		},

		{
			"collectionName": "wards",
			"route": "wards/collection",
			"$ref": "app/danhmuc/Wards/view/CollectionView",
		},
		{
			"collectionName": "wards",
			"route": "wards/model(/:id)",
			"$ref": "app/danhmuc/Wards/view/ModelView",
		},

		{
			"collectionName": "item",
			"route": "item/collection",
			"$ref": "app/item/view/CollectionView",
		},
		{
			"collectionName": "item",
			"route": "item/model(/:id)",
			"$ref": "app/item/view/ModelView",
		},

		{
			"collectionName": "purchaseorder",
			"route": "purchaseorder/collection",
			"$ref": "app/purchaseorder/view/CollectionView",
		},
		{
			"collectionName": "purchaseorder",
			"route": "purchaseorder/model(/:id)",
			"$ref": "app/purchaseorder/view/ModelView",
		},


		{
			"collectionName": "contact",
			"route": "contact/collection",
			"$ref": "app/contact/view/CollectionView",
		},
		{
			"collectionName": "contact",
			"route": "contact/model(/:id)",
			"$ref": "app/contact/view/ModelView",
		},

		{
			"collectionName": "goodsreciept",
			"route": "goodsreciept/collection",
			"$ref": "app/goods-reciept/view/CollectionView",
		},
		{
			"collectionName": "goodsreciept",
			"route": "goodsreciept/model(/:id)",
			"$ref": "app/goods-reciept/view/ModelView",
		},

		{
			"collectionName": "warehouse",
			"route": "warehouse/collection",
			"$ref": "app/warehouse/view/CollectionView",
		},
		{
			"collectionName": "warehouse",
			"route": "warehouse/model(/:id)",
			"$ref": "app/warehouse/view/ModelView",
		},

		{
			"collectionName": "currency",
			"route": "currency/collection",
			"$ref": "app/currency/view/CollectionView",
		},
		{
			"collectionName": "currency",
			"route": "currency/model(/:id)",
			"$ref": "app/currency/view/ModelView",
		},

		{
			"collectionName": "organization",
			"route": "organization/collection",
			"$ref": "app/organization/view/CollectionView",
		},
		{
			"collectionName": "organization",
			"route": "organization/model(/:id)",
			"$ref": "app/organization/view/ModelView",
		},
	];

});


