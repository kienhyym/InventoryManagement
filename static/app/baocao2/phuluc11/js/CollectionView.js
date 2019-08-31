define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');
    var template = require('text!app/baocao2/phuluc11/tpl/collection.html'),
	schema = require('json!schema/TongHopKetQuaKhamDinhKyNguoiMacBenhNgheNghiepSchema.json');
    return Gonrin.CollectionView.extend({
        template: template,
        modelSchema: schema,
        urlPrefix: "/api/v1/",
        collectionName: "tonghopketquakhamdinhkynguoimacbenhnghenghiep",
        uiControl:{
            fields: [
                {
                    field: "cosolaodong", label: "Cơ sở lao động", width: 250, readonly: true,
                },
                {
                    field: "cosokhambenhnghenghiep", label: "Cơ sở khám bệnh nghề nghiệp", width: 250, readonly: true,
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
            return this;
        },
        
    });
});