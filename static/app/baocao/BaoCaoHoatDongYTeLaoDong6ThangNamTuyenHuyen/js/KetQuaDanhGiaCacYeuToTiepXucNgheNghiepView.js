define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');
    var itemTemplate = require('text!app/baocao/BaoCaoHoatDongYTeLaoDong6ThangNamTuyenHuyen/tpl/ketquadanhgiacacyeutotiepxucnghenghiep.html'),
        itemSchema = require('json!schema/KetQuaDanhGiaCacYeuToTiepXucNgheNghiepSchema.json');

    return Gonrin.ItemView.extend({
        bindings: "ketquadanhgiacacyeutotiepxucnghenghiep-bind",
        template: itemTemplate,
        tagName: 'tr',
        modelSchema: itemSchema,
        urlPrefix: "/api/v1/",
        collectionName: "ketquadanhgiacacyeutotiepxucnghenghiep",
        foreignRemoteField: "id",
        foreignField: "baocaohoatdongytelaodong6thangnamtuyenhuyen_id",
        uiControl:{
            fields:[
                
            
                {
                    field:"tongsonguoilaodong",
                    cssClass:false
                },
                {
                    field:"yeutotiepxuc",
                    cssClass:false
                },
                {
                    field:"songuoitiepxuc",
                    cssClass:false
                },
                {
                    field:"ketquadanhgia",
                    cssClass:false
                },
                {
                    field:"songuoiduocdanhgiaecgonomy",
                    cssClass:false
                },
                {
                    field:"ketquadanhgiaecgonomy",
                    cssClass:false
                },
            
            
            ]
        },
        render: function () {
            var self = this;
            self.applyBindings();
            self.registerEvent();
            // self.model.set("id", gonrin.uuid())
        
        },
        registerEvent: function () {
            const self = this;
            self.$el.find("#itemRemove").unbind("click").bind("click", function () {
                self.remove(true);
            });
        }
    });
});