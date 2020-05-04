define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');
    var template = require('text!app/quanlykho/view/goods-reciept/tpl/move-item.html');

    return Gonrin.DialogView.extend({
        template: template,
        modelSchema: {},
        stayItems: [],
        moveItems: [],
        selectWarehouse: [],

        render: function () {
            var self = this;
            self.applyBindings();
            self.registerEvent();
        },

        registerEvent: function () {
            var self = this;
            loader.show();
            self.stayItems = clone(self.viewData.details);

            self.$el.find("#position_info").text(self.viewData.goodsreciept_no + " - " + self.viewData.warehouse_name);
            $.ajax({
                url: self.getApp().serviceURL + "/api/v1/get-goodsreciept",
                success: function (response) {
                    loader.hide();

                    self.$el.find("#search_warehouse input").unbind("keyup").bind("keyup", function (event) {
                        var text = event.target.value ? event.target.value.trim() : "";
                        if (text) {
                            self.$el.find("#search_warehouse").find(".dropdown-menu").addClass("show");
                        } else {
                            if (self.$el.find("#search_warehouse").find(".dropdown-menu").hasClass("show")) {
                                self.$el.find("#search_warehouse").find(".dropdown-menu").removeClass("show");
                            }
                        }
                        var filteredWarehouse = response.filter(w => (w.warehouse_no ? w.warehouse_no.toLocaleLowerCase().includes(text.toLocaleLowerCase()) : false) || (w.goodsreciept_no ? w.goodsreciept_no.toLocaleLowerCase().includes(text.toLocaleLowerCase()) : false));
                        self.renderSuggestion(filteredWarehouse, 5);

                        if (event.keyCode === 13) {
                            if (filteredWarehouse.length === 1) {
                                // self.model.set(filteredWarehouse[0]);

                                if (self.$el.find("#search_warehouse").find(".dropdown-menu").hasClass("show")) {
                                    self.$el.find("#search_warehouse").find(".dropdown-menu").removeClass("show");
                                }

                            } else {
                                var selectedWarehouse = filteredWarehouse.filter(item => item.search_warehouse.toLocaleLowerCase() == text.toLocaleLowerCase() || item.item_no.toLocaleLowerCase() == text.toLocaleLowerCase());
                                if (selectedWarehouse.length == 1) {

                                    // self.model.set(selectedWarehouse[0]);
                                    if (self.$el.find("#search_warehouse").find(".dropdown-menu").hasClass("show")) {
                                        self.$el.find("#search_warehouse").find(".dropdown-menu").removeClass("show");
                                    }
                                }
                            }
                        }
                    });

                },
                error: function (xhr, statusText, errorThrow) {
                    loader.hide();
                }
            });

            self.renderStayItems(self.stayItems);
            self.$el.find("#btn_close").unbind("click").bind("click", function () {
                self.close();
            });

            if (self.moveItems = []) {
                self.$el.find("#move_all").addClass("hide");
            }

            self.$el.find("#stay_all").unbind("click").bind("click", function () {
                self.$el.find("#stay_items").empty();
                self.$el.find("#move_all").removeClass("hide");

                self.stayItems.forEach(item => {
                    self.moveItems.push(item);
                    self.renderMoveItems(item);
                })
                self.stayItems = [];
            });

            self.$el.find("#move_all").unbind("click").bind("click", function () {
                self.$el.find("#will_move_items").empty();
                self.stayItems = self.moveItems;
                self.moveItems = [];
                self.renderStayItems(self.stayItems);
            });
        },

        renderMoveItems: function (items) {
            var self = this;
            self.$el.find("will_move_items").empty();
            self.$el.find("#will_move_items").append(self.getMoveItemTemplate(items));
        },

        getMoveItemTemplate: function (item, idx = 0) {
            if (!item) {
                return;
            }
            return `<tr id="${item.id}">
                <td></td>
                <td class="ellipsis">${item.item_name}</td>
                <td>${item.quantity}</td>
            </tr>`;
        },

        renderStayItems: function (stayItems) {
            const self = this;
            self.$el.find("#stay_items").empty();
            stayItems.forEach(item => {
                self.$el.find("#stay_items").append(self.getStayItemTemplate(item));
                self.$el.find("#stay_items").find("#" + item.id).find("td[id='move']").unbind("mousedown").bind("mousedown", function () {
                    self.$el.find("#move_all").removeClass("hide");
                    self.moveItems.push(item);
                    self.renderMoveItems(item);
                    self.$el.find("#stay_items").find("#" + item.id).empty();
                    self.stayItems.splice(item, 1);
                })
            })
        },


        getStayItemTemplate: function (item, idx = 0) {
            if (!item) {
                return;
            }
            return `<tr id="${item.id}">
                <td class="ellipsis">${item.item_name}</td>
                <td>${item.quantity}</td>
                <td style="padding: 0px; font-size: 32px; color: #3489a5;" id="move"><span class="fa fa-arrow-alt-circle-right btn-pointer"></span></td>
            </tr>`;
        },

        renderSuggestion: function (filteredWarehouse, limit = 5) {
            const self = this;
            var suggestionEl = self.$el.find("#suggestion_list");
            suggestionEl.empty();
            var count = 0;
            filteredWarehouse.forEach((item, idx) => {
                count++;
                if (count <= limit) {
                    suggestionEl.append(self.getDropdownTemplate(item));

                    self.$el.find("#dropdown_item_" + item.id).unbind("click").bind("click", function (event) {
                        if (self.$el.find("#search_warehouse").find(".dropdown-menu").hasClass("show")) {
                            self.$el.find("#search_warehouse").find(".dropdown-menu").removeClass("show");
                        }

                        if (self.$el.find("#search_warehouse").find(".dropdown-menu").hasClass("show")) {
                            self.$el.find("#search_warehouse").find(".dropdown-menu").removeClass("show");
                        }
                    });
                }
            });
        },

        getDropdownTemplate: function (w) {
            var html = `<a class="dropdown-item ellipsis-290" id="dropdown_item_${w.id}" style="overflow: hidden; color: #1d2238; padding: 5px; display: block">`;
            html += w.goodsreciept_no.toLocaleUpperCase() + " - " + w.warehouse_name;
            html += '</a>';
            html += '</br>';
            return html;
        },


    });
});
