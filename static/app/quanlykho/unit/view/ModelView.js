define(function (require) {
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
                command: function () {
                    var self = this;
                    Backbone.history.history.back();
                }
            },
            {
                name: "save",
                type: "button",
                buttonClass: "btn-primary btn btn-sm",
                label: "TRANSLATE:SAVE",
                command: function () {
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
                        success: function (model, respose, options) {
                            toastr.info("Lưu thông tin thành công");
                            self.getApp().getRouter().navigate(self.collectionName + "/collection");

                        },
                        error: function (model, xhr, options) {
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
                visible: function () {
                    return this.getApp().getRouter().getParam("id") !== null;
                },
                command: function () {
                    var self = this;
                    self.model.destroy({
                        success: function (model, response) {
                            toastr.info('Xoá dữ liệu thành công');
                            self.getApp().getRouter().navigate(self.collectionName + "/collection");
                        },
                        error: function (model, xhr, options) {
                            toastr.error('Xoá dữ liệu không thành công!');

                        }
                    });
                }
            },
            ],
        }],

        render: function () {
            var self = this;
            self.$el.find('.unit-name').keyup(function () {
                console.log(self.$el.find('.quydoi1').text('1 ' + $(this).val()));
            })
            self.$el.find('.unit-name-exchange').keyup(function () {
                console.log(self.$el.find('.quydoi2').text($(this).val()));
            })
            self.$el.find('.value-exchange').keyup(function () {
                console.log(self.$el.find('.giatriquydoi').text($(this).val()));
            })
            var id = this.getApp().getRouter().getParam("id");
            if (id) {
                this.model.set('id', id);
                this.model.fetch({
                    success: function (data) {
                        self.applyBindings();
                        self.showUnitExchange();

                        if (self.model.get('unit_exchange')) {
                            self.$el.find('.quydoi2').text(self.model.get('unit_exchange'))
                        }
                        if (self.model.get('unit_price_exchange')) {
                            self.$el.find('.giatriquydoi').text(self.model.get('unit_price_exchange'))

                        }
                        if (self.model.get('name')) {
                            self.$el.find('.quydoi1').text('1 ' + self.model.get('name'))

                        }
                        self.loadItemDropdown();
                    },
                    error: function () {
                        toastr.error("Get data Eror");
                    },
                });
            } else {
                self.loadItemDropdown();
                self.applyBindings();
            }

        },

        validate: function () {
            var self = this;
            if (!self.model.get("name")) {
                toastr.error("Vui lòng nhập tên");
                return
            } else if (!self.model.get("code")) {
                toastr.error("Vui lòng nhập Code");
                return;
            }
            return true;
        },
        loadItemDropdown: function () { // Đổ danh sách Item vào ô tìm kiếm
            var self = this;
            self.$el.find('.search-item').bind('click', function name() {
                self.$el.find('.dropdown-item').remove();
                var text = $(this).val()
                $.ajax({
                    type: "POST",
                    url: self.getApp().serviceURL + "/api/v1/load_unit",
                    data: JSON.stringify({ "text": text, "tenant_id": self.getApp().currentTenant[0] }),
                    success: function (response) {
                        console.log(response)
                        var count = response.length
                        response.forEach(function (item, index) {
                            self.$el.find('.dropdown-menu-item').append(`
                            <button
                            item-id = "${item.id}" 
                            unit-name = "${item.name}"
                            class="dropdown-item" style="text-overflow: ellipsis;overflow: hidden;white-space: nowrap;">${item.name}</button>
                            `)
                        })
                        if (count == 0) {
                            self.$el.find('.dropdown-menu-item').hide()
                        }
                        if (count == 1) {
                            self.$el.find('.dropdown-menu-item').css("height", "45px")
                            self.$el.find('.dropdown-menu-item').show()
                        }
                        if (count == 2) {
                            self.$el.find('.dropdown-menu-item').css("height", "80px")
                            self.$el.find('.dropdown-menu-item').show()
                        }
                        if (count > 2) {
                            self.$el.find('.dropdown-menu-item').css("height", "110px")
                            self.$el.find('.dropdown-menu-item').show()
                        }
                        self.chooseItemInListDropdownItem();

                    }
                });
            })
            self.$el.find('.out-click').bind('click', function () {
                self.$el.find('.dropdown-menu-item').hide()
            })

        },
        chooseItemInListDropdownItem: function () {
            var self = this;
            self.$el.find('.dropdown-item').unbind('click').bind('click', function () {
                var dropdownItemClick = $(this);
                var itemID = dropdownItemClick.attr('item-id')
                var itemName = dropdownItemClick.attr('unit-name')
                self.$el.find('.dropdown-menu-item').hide()
                self.$el.find('.search-item').val(itemName)
                self.model.set('unit_exchange', itemID)
            })
        },
        showUnitExchange: function () {
            var self = this;
            var filters = {
                filters: {
                    "$and": [
                        { "id": { "$eq": self.model.get('unit_exchange') } }
                    ]
                },
                order_by: [{ "field": "created_at", "direction": "desc" }]
            }
            $.ajax({
                type: "GET",
                url: self.getApp().serviceURL + "/api/v1/unit?results_per_page=100000&max_results_per_page=1000000",
                data: "q=" + JSON.stringify(filters),
                success: function (res) {
                    console.log(res)
                    self.$el.find('.search-item').val(res.objects[0].name)
                }
            })
        },
    });

});