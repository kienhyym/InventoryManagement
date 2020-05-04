define(function(require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');
    return [{
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
            "$ref": "app/quanlykho/item/view/CollectionView",
        },
        {
            "collectionName": "item",
            "route": "item/model(/:id)",
            "$ref": "app/quanlykho/item/view/ModelView",
        },

        {
            "collectionName": "purchaseorder",
            "route": "purchaseorder/collection",
            "$ref": "app/quanlykho/purchaseorder/view/CollectionView",
        },
        {
            "collectionName": "purchaseorder",
            "route": "purchaseorder/model(/:id)",
            "$ref": "app/quanlykho/purchaseorder/view/ModelView",
        },

        {
            "collectionName": "movewarehouse",
            "route": "movewarehouse/collection",
            "$ref": "app/quanlykho/move-warehouse/view/CollectionView",
        },
        {
            "collectionName": "movewarehouse",
            "route": "movewarehouse/model(/:id)",
            "$ref": "app/quanlykho/move-warehouse/view/ModelView",
        },


        {
            "collectionName": "contact",
            "route": "contact/collection",
            "$ref": "app/quanlykho/contact/view/CollectionView",
        },
        {
            "collectionName": "contact",
            "route": "contact/model(/:id)",
            "$ref": "app/quanlykho/contact/view/ModelView",
        },

        {
            "collectionName": "goodsreciept",
            "route": "goodsreciept/collection",
            "$ref": "app/quanlykho/goods-reciept/view/CollectionView",
        },
        {
            "collectionName": "goodsreciept",
            "route": "goodsreciept/model(/:id)",
            "$ref": "app/quanlykho/goods-reciept/view/ModelView",
        },

        {
            "collectionName": "warehouse",
            "route": "warehouse/collection",
            "$ref": "app/quanlykho/warehouse/view/CollectionView",
        },
        {
            "collectionName": "warehouse",
            "route": "warehouse/model(/:id)",
            "$ref": "app/quanlykho/warehouse/view/ModelView",
        },

        {
            "collectionName": "currency",
            "route": "currency/collection",
            "$ref": "app/quanlykho/currency/view/CollectionView",
        },
        {
            "collectionName": "currency",
            "route": "currency/model(/:id)",
            "$ref": "app/quanlykho/currency/view/ModelView",
        },


        {
            "collectionName": "unit",
            "route": "unit/collection",
            "$ref": "app/quanlykho/unit/view/CollectionView",
        },
        {
            "collectionName": "unit",
            "route": "unit/model(/:id)",
            "$ref": "app/quanlykho/unit/view/ModelView",
        },

        {
            "collectionName": "organization",
            "route": "organization/collection",
            "$ref": "app/quanlykho/organization/view/CollectionView",
        },
        {
            "collectionName": "organization",
            "route": "organization/model(/:id)",
            "$ref": "app/quanlykho/organization/view/ModelView",
        },

        {
            "collectionName": "workstation",
            "route": "workstation/collection",
            "$ref": "app/quanlykho/workstation/view/CollectionView",
        },
        {
            "collectionName": "workstation",
            "route": "workstation/model(/:id)",
            "$ref": "app/quanlykho/workstation/view/ModelView",
        },
    ];

});