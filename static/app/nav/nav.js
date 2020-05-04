define(function(require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');
    return [{
            "text": "Vật tư y tế",
            "type": "view",
            "collectionName": "item",
            "route": "item/collection",
            "visible": function() {
                return true
            }
        },
        {
            "text": "Mua hàng",
            "type": "view",
            "collectionName": "purchaseorder",
            "route": "purchaseorder/collection",
            "visible": function() {
                return true
            }
        },

        {
            "text": "Chuyển kho",
            "type": "view",
            "collectionName": "movewarehouse",
            "route": "movewarehouse/collection",
            "visible": function() {
                return true
            }
        },

        {
            "text": "Khách hàng",
            "type": "view",
            "collectionName": "contact",
            "route": "contact/collection",
            "visible": function() {
                return true
            }
        },
        {
            "text": "Nhập hàng",
            "type": "view",
            "collectionName": "goodsreciept",
            "route": "goodsreciept/collection",
            "visible": function() {
                return true
            }
        },
        {
            "text": "Kho",
            "type": "view",
            "collectionName": "warehouse",
            "route": "warehouse/collection",
            "visible": function() {
                return true
            }
        },
        {
            "text": "Tiền tệ",
            "type": "view",
            "collectionName": "currency",
            "route": "currency/collection",
            "visible": function() {
                return true
            }
        },
        {
            "text": "Đơn vị tính",
            "type": "view",
            "collectionName": "unit",
            "route": "unit/collection",
            "visible": function() {
                return true
            }
        },
        {
            "text": "Doanh nghiệp",
            "type": "view",
            "collectionName": "organization",
            "route": "organization/collection",
            "visible": function() {
                return true
            }
        },
        // {
        //     "type": "view",
        //     "collectionName": "workstation",
        //     "route": "workstation/collection",
        //     "visible": function() {
        //         return true
        //     }
        // },
    ];

});