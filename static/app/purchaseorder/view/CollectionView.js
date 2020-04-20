define(function(require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');
    var template = require('text!app/purchaseorder/tpl/collection.html'),
        schema = require('json!schema/PurchaseOrderSchema.json');

    var Helpers = require('app/base/view/Helper');
    var TemplateHelper = require('app/base/view/TemplateHelper');
    var CustomFilterView = require('app/base/view/CustomFilterView');

    return Gonrin.CollectionView.extend({
        template: template,
        modelSchema: schema,
        urlPrefix: "/api/v1/",
        collectionName: "purchaseorder",
        refresh: true,
        tools: [

            {
                name: "defaultgr",
                type: "group",
                groupClass: "toolbar-group",
                buttons: [{
                    name: "create",
                    type: "button",
                    buttonClass: "btn btn-primary font-weight-bold",
                    label: "+ Tạo Phiếu",
                    command: function() {
                        var self = this;
                        this.getApp().getRouter().navigate("#purchaseorder/model");
                    }
                }, ]
            }
        ],

        uiControl: {
            orderBy: [{
                    field: "created_at",
                    direction: "desc"
                },
                // { field: "deleted", direction: true }
            ],
            fields: [{
                    field: "purchaseorder_no",
                    label: "Mã phiếu",
                    template: function(rowObject) {
                        if (rowObject.purchaseorder_no) {
                            return `<div style="min-width: 118px;">${rowObject.purchaseorder_no}</div>`;
                        } else {
                            return ``;
                        }
                    }
                },
                {
                    field: "",
                    label: "Trạng thái",
                    width: "120px",
                    template: function(rowObject) {
                        if (rowObject.payment_status) {
                            if (rowObject.payment_status == "paid") {
                                return `<label style="width: 80px" class="badge badge-success">Đã thanh toán</label>`;
                            } else if (rowObject.payment_status == "created") {
                                return `<label style="width: 80px" class="badge badge-primary">Yêu cầu mới</label>`;
                            } else if (rowObject.payment_status == "pending") {
                                return `<label style="width: 80px" class="badge badge-info">Chờ xử lý</label>`;
                            } else if (rowObject.payment_status == "confirm") {
                                return `<label style="width: 90px" class="badge badge-warning">Đã duyệt yêu cầu</label>`;
                            } else if (rowObject.payment_status == "user-cancel") {
                                return `<label style="width: 80px" class="badge badge-danger">Người dùng hủy</label>`;
                            } else if (rowObject.payment_status == "admin-cancel") {
                                return `<label style="width: 80px" class="badge badge-danger">Quản lý hủy</label>`;
                            } else {
                                return ``;
                            }
                        }
                    }
                },
                {
                    field: "created_at",
                    label: "Thời gian",
                    template: function(rowObject) {
                        if (rowObject.created_at) {
                            var date = rowObject.created_at * 1000;
                            return `<div style="min-width: 120px;">${Helpers.utcToLocal(date, "DD-MM-YYYY HH:mm")}</div>`;
                        } else {
                            return `<div style="width: 120px"></div>`;
                        }
                    }
                },
                {
                    field: "workstation_name",
                    label: "Điểm bán",
                    template: function(rowObject) {
                        if (rowObject.workstation_name) {
                            return `<div style="min-width: 150px; class="ellipsis-150">${rowObject.workstation_name}</div>`;
                        } else {
                            return `<div style="min-width: 150px; class="ellipsis-150"></div>`;
                        }
                    }
                },
                {
                    field: "phone",
                    label: "Số điện thoại",
                    template: function(rowObject) {
                        if (rowObject.phone) {
                            return `<div style="min-width: 118px;">${rowObject.phone}</div>`;
                        } else {
                            return `<div style="min-width: 118px;"><div>`;
                        }
                    }
                },
                {
                    field: "organization_name",
                    label: "Thương hiệu",
                    template: function(rowObject) {
                        if (rowObject.organization_name) {
                            return `<div style="min-width: 150px; class="ellipsis-150">${rowObject.organization_name}</div>`;
                        } else {
                            return `<div style="min-width: 150px; class="ellipsis-150"></div>`;
                        }
                    }
                },
                {
                    field: "proponent",
                    label: "Người đề nghị",
                    template: function(rowObject) {
                        if (rowObject.proponent) {
                            return `<div style="min-width: 150px; class="ellipsis-150">${rowObject.proponent}</div>`;
                        } else {
                            return `<div style="min-width: 150px; class="ellipsis-150"></div>`;
                        }
                    }
                },
                {
                    field: "description",
                    label: "Ghi chú",
                    template: function(rowObject) {
                        if (rowObject.description) {
                            return `<div style="min-width: 150px; class="ellipsis-150">${rowObject.description}</div>`;
                        } else {
                            return `<div style="min-width: 150px; class="ellipsis-150"></div>`;
                        }
                    }
                },

            ],

            onRowClick: function(event) {
                if (event.rowId) {
                    var path = this.collectionName + '/model?id=' + event.rowId;
                    this.getApp().getRouter().navigate(path);
                }
            },
        },

        render: function() {
            this.applyBindings();
            return this;
            // loader.show();
            // axios.get("https://upstart.vn/accounts/api/v1/tenant/user_permission?user_id=" + self.getApp().currentUser.id + "&tenant_id=" + self.getApp().currentTenant).then(res => {
            //     if (res.data.role[0] == "admin" || self.getApp().roleInfo == 1 || self.getApp().roleInfo == "1" || self.getApp().roleInfo == 2 || self.getApp().roleInfo == "2") {
            //         console.log("ROLE FILTERS==============>", self.getApp().roleInfo);
            //         var filters = {
            //             "$and": [{
            //                     "tenant_id": {
            //                         "$eq": self.getApp().currentTenant
            //                     }
            //                 },
            //                 {
            //                     "deleted": {
            //                         "$eq": false
            //                     }
            //                 }
            //             ]
            //         };
            //         self.uiControl.filters = filters;
            //     } else if (res.data.role[0] == "user" || self.getApp().roleInfo == 4 || self.getApp().roleInfo == "4") {
            //         var workstations = lodash.get(res, 'data.workstations', null);


            //         console.log("workstations", workstations);
            //         workstations = workstations.filter(w => w.role == "manager");
            //         console.log("workstations manager", workstations);
            //         var arr = [];
            //         workstations.forEach(item => {
            //             arr.push(item.workstation_id);
            //             console.log("item workstion", item);

            //         });
            //         var filters = {
            //             "$and": [{
            //                     "tenant_id": {
            //                         "$eq": self.getApp().currentTenant
            //                     }
            //                 },
            //                 {
            //                     "deleted": {
            //                         "$eq": false
            //                     }
            //                 },
            //                 {
            //                     "workstation_id": {
            //                         "$in": arr
            //                     }
            //                 }
            //             ]
            //         };
            //         console.log("filter", filters);
            //         self.uiControl.filters = filters;
            // //     }
            //     self.applyBindings();
            // });
            // self.registerEvent();
            // self.searchCombobox();
            // loader.hide();
        },

        searchCombobox: function() {
            var self = this;
            self.$el.find("#search-status").combobox({
                textField: "text",
                valueField: "value",
                dataSource: [
                    { text: "__Tất cả__", value: "all" },
                    {
                        text: "Chờ xử lý",
                        value: "pending"
                    },
                    {
                        text: "Đã duyệt yêu cầu",
                        value: "confirm"
                    },
                    {
                        text: "Đã thanh toán",
                        value: "paid"
                    },
                    {
                        text: "Người dùng hủy",
                        value: "user-cancel"
                    },
                    {
                        text: "Quản lý hủy",
                        value: "admin-cancel"
                    },
                ],
                value: "all"
            });
            self.$el.find("#search-status").on("change.gonrin", function(event) {
                var text = event.target.value;
                var $col = self.getCollectionElement();
                if ($col) {
                    if (text != "all") {
                        axios.get("https://upstart.vn/accounts/api/v1/tenant/user_permission?user_id=" + self.getApp().currentUser.id + "&tenant_id=" + self.getApp().currentTenant).then(res => {
                            if (res.data.role[0] == "admin" || self.getApp().roleInfo == 1 || self.getApp().roleInfo == "1" || self.getApp().roleInfo == 2 || self.getApp().roleInfo == "2") {
                                var filters = {
                                    "$and": [{
                                            "tenant_id": {
                                                "$eq": self.getApp().currentTenant
                                            }
                                        },
                                        {
                                            "deleted": {
                                                "$eq": false
                                            }
                                        },
                                        {
                                            "payment_status": {
                                                "$eq": text
                                            }
                                        },
                                    ]
                                };
                                $col.data('gonrin').filter(filters);
                            } else if (res.data.role[0] == "user" || self.getApp().roleInfo == 4 || self.getApp().roleInfo == "4") {
                                var workstations = lodash.get(res, 'data.workstations', null);
                                workstations = workstations.filter(w => w.role == "manager");
                                var arr = [];
                                workstations.forEach(item => {
                                    arr.push(item.workstation_id);

                                })
                                var filters = {
                                    "$and": [{
                                            "tenant_id": {
                                                "$eq": self.getApp().currentTenant
                                            }
                                        },
                                        {
                                            "deleted": {
                                                "$eq": false
                                            }
                                        },
                                        {
                                            "workstation_id": {
                                                "$in": arr
                                            }
                                        },
                                        {
                                            "payment_status": {
                                                "$eq": text
                                            }
                                        },
                                    ]
                                };
                                $col.data('gonrin').filter(filters);
                            }
                        })

                    } else if (text == "all") {
                        axios.get("https://upstart.vn/accounts/api/v1/tenant/user_permission?user_id=" + self.getApp().currentUser.id + "&tenant_id=" + self.getApp().currentTenant).then(res => {
                            if (res.data.role[0] == "admin" || self.getApp().roleInfo == 1 || self.getApp().roleInfo == "1" || self.getApp().roleInfo == 2 || self.getApp().roleInfo == "2") {
                                var filters = {
                                    "$and": [{
                                            "tenant_id": {
                                                "$eq": self.getApp().currentTenant
                                            }
                                        },
                                        {
                                            "deleted": {
                                                "$eq": false
                                            }
                                        },
                                    ]
                                };
                                $col.data('gonrin').filter(filters);
                            } else if (res.data.role[0] == "user" || self.getApp().roleInfo == 4 || self.getApp().roleInfo == "4") {
                                var workstations = lodash.get(res, 'data.workstations', null);
                                workstations = workstations.filter(w => w.role == "manager");
                                var arr = [];
                                workstations.forEach(item => {
                                    arr.push(item.workstation_id);

                                })
                                var filters = {
                                    "$and": [{
                                            "tenant_id": {
                                                "$eq": self.getApp().currentTenant
                                            }
                                        },
                                        {
                                            "deleted": {
                                                "$eq": false
                                            }
                                        },
                                        {
                                            "workstation_id": {
                                                "$in": arr
                                            }
                                        },
                                    ]
                                };
                                $col.data('gonrin').filter(filters);
                            }
                        })
                    }
                }
                self.applyBindings();
            });
        },
        registerEvent: function() {
            var self = this;
            var currentURL = window.location.href;
            if (self.getApp().isMobile == "ANDROID") {
                $("#project-search-windows").html(``);
                // $("#project-btn").html(`<button type="button" class="btn btn-primary font-weight-bold create-new">+ Nhập hàng</button>`)
                // $(".create-new").on("click", function () {
                // 	self.getApp().getRouter().navigate("#goodsreciept/model");
                // });
                $("#project-search-mobile").html(`
					<li class="nav-item nav-search d-lg-block">
					<div class="col-md-12 col-sm-12 col-xs-12 col-12" id="filter"></div>
				</li>`);
            } else if (self.getApp().isMobile == "WINDOWS") {
                $("#project-search-mobile").html(``);
                $("#project-search-windows").html(`
					<li class="nav-item nav-search d-lg-block">
					<div class="col-md-12 col-sm-12 col-xs-12 col-12" id="filter"></div>
				</li>`);
            }
        },
    });
});