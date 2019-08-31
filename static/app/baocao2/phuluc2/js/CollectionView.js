define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');
    var template = require('text!app/baocao2/phuluc2/tpl/collection.html'),
	schema = require('json!schema/PhieuKhamSucKhoeTruocKhiBoTriLamViecSchema.json');
    return Gonrin.CollectionView.extend({
        template: template,
        modelSchema: schema,
        urlPrefix: "/api/v1/",
        collectionName: "phieukhamsuckhoetruockhibotrilamviec",
        uiControl:{
            fields: [
                {
                    field: "hovaten", label: "Họ và tên", width: 250, readonly: true,
                },
                {
                    field: "lydokham", label: "Lý do khám", width: 250, readonly: true,
                },
            ],
            onRowClick: function (event) {
                if (event.rowId) {
                    var path =  this.collectionName + '/model?id=' + event.rowId;
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