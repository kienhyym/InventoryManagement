define(function(require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');

    var template = require('text!app/quanlykho/unit/tpl/model.html'),
        schema = require('json!schema/UnitSchema.json');

    return Gonrin.ModelView.extend({
        template: template,
        modelSchema: schema,
        urlPrefix: "/api/v1/",
        collectionName: "unit",

        // uiControl: {
        // 	fields: [{
        // 		field: "compound_tax",
        // 		uicontrol: "combobox",
        // 		textField: "text",
        // 		valueField: "value",
        // 		dataSource: [
        // 			{ value: 1, text: "Cho phép gộp thuế" },
        // 			{ value: 0, text: "Không cho phép" }

        // 		],
        // 	}]
        // },
        tools: [{
            name: "defaultgr",
            type: "group",
            groupClass: "toolbar-group",
            buttons: [{
                    name: "back",
                    type: "button",
                    buttonClass: "btn-light btn btn-sm",
                    label: "TRANSLATE:BACK",
                    command: function() {
                        var self = this;
                        Backbone.history.history.back();
                    }
                },
                {
                    name: "save",
                    type: "button",
                    buttonClass: "btn-primary btn btn-sm",
                    label: "TRANSLATE:SAVE",
                    command: function() {
                        var self = this;
                        var id = self.getApp().getRouter().getParam("id");
                        if (!self.validate()) {
                            return;
                        }

                        var method = "update";
                        if (!id) {
                            var method = "create";
                            self.model.set("tenant_id", self.getApp().currentTenant[0]);
                        }

                        self.model.sync(method, self.model, {
                            success: function(model, respose, options) {
                                toastr.info("Lưu thông tin thành công");
                                self.getApp().getRouter().navigate(self.collectionName + "/collection");

                            },
                            error: function(model, xhr, options) {
                                toastr.error('Lưu thông tin không thành công!');

                            }
                        });
                    }
                },
                {
                    name: "delete",
                    type: "button",
                    buttonClass: "btn-danger btn btn-sm",
                    label: "TRANSLATE:DELETE",
                    visible: function() {
                        return this.getApp().getRouter().getParam("id") !== null;
                    },
                    command: function() {
                        var self = this;
                        self.model.destroy({
                            success: function(model, response) {
                                toastr.info('Xoá dữ liệu thành công');
                                self.getApp().getRouter().navigate(self.collectionName + "/collection");
                            },
                            error: function(model, xhr, options) {
                                toastr.error('Xoá dữ liệu không thành công!');

                            }
                        });
                    }
                },
            ],
        }],

        render: function() {
            var self = this;

            var id = this.getApp().getRouter().getParam("id");
            if (id) {
                this.model.set('id', id);
                this.model.fetch({
                    success: function(data) {
                        self.applyBindings();
                    },
                    error: function() {
                        toastr.error("Get data Eror");
                    },
                });
            } else {
                self.applyBindings();
            }

        },

        validate: function() {
            var self = this;
            if (!self.model.get("name")) {
                toastr.error("Vui lòng nhập tên");
                return
            } else if (!self.model.get("code")) {
                toastr.error("Vui lòng nhập Code");
                return;
            }
            return true;
        }
    });

});