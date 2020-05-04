define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');
    var template = require('text!app/quanlykho/goods-reciept/tpl/item-dialog-view.html');

	var TempalteHelper = require('app/base/view/TemplateHelper');

    return Gonrin.DialogView.extend({
        template: template,
        selectItems: [],

        render: function () {
            var self = this;
            self.selectItems = [];

            self.applyBindings();
            self.registerEvent();

            var timer = setTimeout(() => {
                $(".bootbox-close-button").css("display", "none");
                clearTimeout(timer);
            }, 200);
        },


        registerEvent: function () {
            loader.show();
            var self = this;
            self.$el.find("bootbox-close-button").addClass("d-none");
            self.$el.find("#close").unbind("click").bind("click", function () {
                self.close();
            });
            var listItemEL = self.$el.find("#list-item");

            axios({
                method: "POST",
                url: self.getApp().serviceURL + "/api/v1/item/get",
                data: {
                    tenant_id: self.getApp().currentTenant[0]
                }
            }).then(response => {
                if (response.data) {
                    var itemNos = lodash.get(self.viewData, 'detailNos', []);
                    var listItems = response.data.filter(item => !itemNos.includes(item.item_no));

                    self.$el.find("#search-item").unbind("keyup").bind("keyup", function () {
                        var text = event.target.value ? event.target.value.trim() : "";
                        if (text) {
                            var filteredItems = listItems.filter(item => (item.item_name ? item.item_name.toLocaleLowerCase().includes(text.toLocaleLowerCase()) : false) || (item.item_no ? item.item_no.toLocaleLowerCase().includes(text.toLocaleLowerCase()) : false));
                            self.renderSuggestion(filteredItems, 30);
                        } else if (text == null || text == "" || text == undefined) {
                            self.renderSuggestion(listItems, 30);
                        }
                    });
                    var count = 0;
                    listItems.forEach(item => {
                        count++;
                        if (count <= 30) {
                            listItemEL.append(self.renderTemplate(item));
                            self.$el.find("#" + item.id).unbind("click").bind("click", function (event) {
                                if (self.$el.find("#" + item.id).find("#check").hasClass("d-none")) {
                                    self.$el.find("#" + item.id).find("#check").removeClass("d-none")
                                } else {
                                    self.$el.find("#" + item.id).find("#check").addClass("d-none")
                                }
                                self.addItemToGoodsReciept(item);
                            })
                        }
                    })
                }
            })
            loader.hide();
        },

        renderSuggestion: function (filteredItems, limit = 30) {
            var self = this;
            var listItemEL = self.$el.find("#list-item");
            listItemEL.empty();

            var count = 0;
            filteredItems.forEach(item => {
                count++;
                if (count <= limit) {
                    listItemEL.append(self.renderTemplate(item));
                    self.$el.find("#" + item.id).unbind("click").bind("click", function (event) {
                        console.log("click");
                        if (self.$el.find("#" + item.id).find("#check").hasClass("d-none")) {
                            self.$el.find("#" + item.id).find("#check").removeClass("d-none")
                        } else {
                            self.$el.find("#" + item.id).find("#check").addClass("d-none")
                        }
                        self.addItemToGoodsReciept(item);
                    })
                }
            })
        },

        addItemToGoodsReciept: function (item) {
            loader.show();
            var self = this;
            var items = clone(item);
            delete items.manufacturer;
            delete items.pack_size;
            delete items.vendor_part_no;
            delete items.weight;
            delete items.organization_id;
            delete items.is_service;
            delete items.is_raw;
            delete items.is_package;
            delete items.is_material;
            delete items.importer;
            delete items.discontinued;
            delete items.cost_factor;
            delete items.allow_delivery;
            delete items.active;
            delete items.importer;
            delete items.custom_fields;
            items.item_image = items.image;
            delete items.image;
            delete items.specification;
            delete items.workstation_id;
            // delete items.list_price;
            delete items.parent_id;
            delete items.package_products;
            delete items.position;
            delete items.extension_data;


            items.item_type = items.item_type;
            items.purchase_cost = items.purchase_cost ? items.purchase_cost : 0;
            items.list_price = items.list_price ? items.list_price : 0;
            items.quantity = 0;
            items.id = gonrin.uuid();

            var flag = false;
            self.selectItems.forEach(param => {
                if (param.item_no == items.item_no) {
                    flag = true;
                }
            });
            if (!flag) {
                self.selectItems.push(items);
            } else {
                self.selectItems.forEach((param, index) => {
                    console.log(param);
                    if (param.item_no == items.item_no) {
                        self.selectItems.splice(index, 1);
                    }
                });
            }

            self.$el.find("#done").unbind("click").bind("click", function () {
                console.log("click", self.selectItems);
                self.trigger("close", self.selectItems);
                self.close();
            });
            loader.hide();
        },

        renderTemplate: function (item) {
            var self = this;
            var image = item.image ? item.image : "static/images/default-dist.jpeg";
            var purchasePrice = item.purchase_cost ? item.purchase_cost : 0
            var html = `<div class="col-xl-4 col-lg-4 col-md-4 col-sm-4 col-6" id="${item.id}" style="position: relative">
                            <div class="row card product-item-m mb-0">
                            <i id="check" class="icon-check d-none" style="position: absolute; right: 10px; color: #ed0d0d; font-size: 18px"></i>
                                <div class="no-gutters"></div>
                                    <div class="float-left image-space" style="background-image: url(${image})">
                                    </div>
                                    <div class="float-left pl-1 pr-4" style="height: 100%; width: calc(100% - 78px);">
                                        <div class="card-body-item" title="${item.item_name}">
                                            <h5 class="mb-1">${item.item_name}(${item.item_no})</h5>
                                            <p class="card-text m-0">
                                                <i class="fa fa-tag" style="font-size: 10px;"></i>
                                                <span class="payment-item-qty">${TempalteHelper.currencyFormat(purchasePrice)}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`;

            self.$el.find("#list-item").append(html)
        }

    });
});
