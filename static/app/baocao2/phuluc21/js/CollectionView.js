define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');
    var template = require('text!app/baocao2/phuluc21/tpl/collection.html'),
        schema = require('json!schema/SoKhamSucKhoeDinhKyCuaNguoiLaiXeOToSchema.json');
        
    return Gonrin.CollectionView.extend({
        template: template,
        modelSchema: schema,
        urlPrefix: "/api/v1/",
        collectionName: "sokhamsuckhoedinhkycuanguoilaixeoto",
        uiControl: {
            fields: [
                {
                    field: "hovaten", label: "Họ tên ", width: 250, readonly: true,
                },
                {
                    field: "tuoi", label: "Tuổi", width: 250, readonly: true,
                },
            ],
            onRowClick: function (event) {
                if (event.rowId) {
                    var path = this.collectionName + '/model?id=' + event.rowId;
                    this.getApp().getRouter().navigate(path);
                }
            }
        },
        render: function () {

            this.applyBindings();
            console.log(this);
            return this;
        },

    });
});