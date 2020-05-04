define(function(require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');

    var template = require('text!app/quanlykho/unit/tpl/select.html'),
        schema = require('json!schema/UnitSchema.json');

    var CustomFilterView = require('app/base/view/CustomFilterView');

    return Gonrin.CollectionDialogView.extend({
        template: template,
        modelSchema: schema,
        urlPrefix: "/api/v1/",
        collectionName: "unit",

        textField: "code",
        tools: [{
            name: "select",
            type: "button",
            buttonClass: "btn btn-info btn-sm font-weight-bold margin-left-5",
            label: "TRANSLATE:SELECT",
            command: function() {
                this.trigger("onSelected");
                this.close();
            }
        }],

        uiControl: {
            fields: [
                { field: "name", label: "Tên" },
                { field: "code", label: "Ký hiệu" }
            ],
            onRowClick: function(event) {
                var select = [];
                for (var i = 0; i < event.selectedItems.length; i++) {
                    console.log(event.selectedItems[i]);
                    var o = {
                        id: event.selectedItems[i].id,
                        name: event.selectedItems[i].name,
                        code: event.selectedItems[i].code
                    }
                    select.push(o);
                }
                this.uiControl.selectedItems = select;
                this.trigger("onSelected");
                this.close();

            },
            onRendered: function(e) {
                this.trigger("onRendered");
            }
        },
        render: function() {
            var self = this;

            function capitalizeFirstLetter(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }
            var filter = new CustomFilterView({
                el: self.$el.find("#filter"),
                sessionKey: "unit_filter"
            });
            filter.render();

            if (!filter.isEmptyFilter()) {
                var filters = {
                    "$and": [
                        { "tenant_id": { "$eq": self.getApp().currentTenant } },
                        { "deleted": { "$eq": false } },
                    ]
                };
                self.uiControl.filters = filters;
            }
            self.applyBindings();

            filter.on('filterChanged', function(evt) {
                var $col = self.getCollectionElement();
                var text = !!filter.model.get("text") ? filter.model.get("text").trim() : "";
                var textUpper = !!filter.model.get("text") ? filter.model.get("text").trim().toUpperCase() : "";
                var textLower = !!filter.model.get("text") ? filter.model.get("text").trim().toLowerCase() : "";
                var textFirst = !!filter.model.get("text") ? capitalizeFirstLetter(filter.model.get("text").trim()) : "";
                if ($col) {
                    if (text) {
                        var filters = {
                            "$and": [
                                { "tenant_id": { "$eq": self.getApp().currentTenant } },
                                { "deleted": { "$eq": false } },
                                { "code": { "$like": text } }
                            ]
                        };
                        $col.data('gonrin').filter(filters);
                    } else {
                        filters = {
                            "$and": [
                                { "tenant_id": { "$eq": self.getApp().currentTenant } },
                                { "deleted": { "$eq": false } }
                            ]
                        };
                        $col.data('gonrin').filter(filters);
                    }
                }
                self.applyBindings();
            });
            return this;
        },
    });
});