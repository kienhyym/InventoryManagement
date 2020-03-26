define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');

    var template = require('text!app/chungtu/certificateform/tpl/collection.html'),
        schema = require('../../../../../../static/app/chungtu/certificateform/js/node_modules/json!schema/BangKiemDinhSchema.json.js');

    return Gonrin.CollectionView.extend({
        template: template,
        modelSchema: schema,
        urlPrefix: "/api/v1/",
        collectionName: "certificateform",
        tools: [
            {
                name: "defaultgr",
                type: "group",
                groupClass: "toolbar-group",
                buttons: [
                    {
                        name: "back",
                        type: "button",
                        buttonClass: "btn-default btn-sm btn-secondary",
                        label: "TRANSLATE:Quay lại",
                        command: function () {
                            var self = this;
                            Backbone.history.history.back();
                        }
                    },
                ],
            }],
        render: function () {
            var self = this;
            self.$el.find('#date_of_certification').datetimepicker({
                textFormat: 'DD-MM-YYYY',
                extraFormats: ['DDMMYYYY'],
                parseInputDate: function (val) {
                    return moment.unix(val)
                },
                parseOutputDate: function (date) {
                    return date.unix()
                }
            });

            this.applyBindings();
            self.locData();
            return this;
        },
        locData: function () {
            var self = this;
            var IDTB = sessionStorage.getItem('IDThietBi');
            sessionStorage.clear();
            if (IDTB !== null) {
                var filters = {
                    filters: {
                        "$and": [
                            { "equipmentdetails_id": { "$eq": IDTB } }
                        ]
                    },
                    order_by: [{ "field": "created_at", "direction": "desc" }]
                }
                $.ajax({
                    url: self.getApp().serviceURL + "/api/v1/certificateform?results_per_page=100000&max_results_per_page=1000000",
                    method: "GET",
                    data: "q=" + JSON.stringify(filters),
                    contentType: "application/json",
                    success: function (data) {
                        var i = 1;
                        var arr = [];
                        data.objects.forEach(function (item, index) {
                            item.stt = i;
                            i++;
                            arr.push(item)
                        })
                        self.render_grid(arr);


                        self.$el.find("#name").keyup(function () {
                            arr = [];
                            var i = 1;
                            data.objects.forEach(function (item, index) {
                                if ((item.name).indexOf(self.$el.find("#name").val()) !== -1) {
                                    item.stt = i;
                                    i++;
                                    arr.push(item)

                                }
                            });
                            self.render_grid(arr);

                        });
                        self.$el.find('#ngaykiemtra').blur(function () {
                            var x = self.$el.find('#ngaykiemtra').data("gonrin").getValue();

                            if (arr.length != 0) {
                                var arr2 = [];
                                var i = 1;
                                arr.forEach(function (item, index) {
                                    if (moment(item.date * 1000).format("DDMMYYYY") == moment(x * 1000).format("DDMMYYYY")) {
                                        item.stt = i;
                                        i++;
                                        arr2.push(item)
                                    }
                                });
                                self.render_grid(arr2);

                            }
                            else {
                                arr2 = []
                                var i = 1;
                                data.objects.forEach(function (item, index) {
                                    if (moment(item.date * 1000).format("DDMMYYYY") == moment(x * 1000).format("DDMMYYYY")) {
                                        item.stt = i;
                                        i++;
                                        arr2.push(item)
                                    }
                                });
                                self.render_grid(arr2);
                                self.$el.find("#name").keyup(function () {
                                    var arr3 = [];
                                    var i = 1;
                                    arr2.forEach(function (item, index) {
                                        if ((item.name).indexOf(self.$el.find("#name").val()) !== -1) {
                                            item.stt = i;
                                            i++;
                                            arr3.push(item)
                                        }
                                    });
                                    self.render_grid(arr3);

                                });
                            }

                        })

                    },


                })
            }
            else {
                $.ajax({
                    url: self.getApp().serviceURL + "/api/v1/certificateform?results_per_page=100000&max_results_per_page=1000000",
                    method: "GET",
                    data: { "q": JSON.stringify({ "order_by": [{ "field": "created_at", "direction": "desc" }] }) },
                    contentType: "application/json",
                    success: function (data) {
                        var i = 1;
                        var arr = [];
                        data.objects.forEach(function (item, index) {
                            item.stt = i;
                            i++;
                            arr.push(item)
                        })
                        self.render_grid(arr);
                        self.$el.find("#name").keyup(function () {
                            arr = [];
                            var i = 1;
                            data.objects.forEach(function (item, index) {
                                if ((item.name).indexOf(self.$el.find("#name").val()) !== -1) {
                                    item.stt = i;
                                    i++;
                                    arr.push(item)

                                }
                            });
                            self.render_grid(arr);

                        });
                        self.$el.find('#ngaykiemtra').blur(function () {
                            var x = self.$el.find('#ngaykiemtra').data("gonrin").getValue();

                            if (arr.length != 0) {
                                var arr2 = [];
                                var i = 1;
                                arr.forEach(function (item, index) {
                                    if (moment(item.date * 1000).format("DDMMYYYY") == moment(x * 1000).format("DDMMYYYY")) {
                                        item.stt = i;
                                        i++;
                                        arr2.push(item)
                                    }
                                });
                                self.render_grid(arr2);

                            }
                            else {
                                arr2 = []
                                var i = 1;
                                data.objects.forEach(function (item, index) {
                                    if (moment(item.date * 1000).format("DDMMYYYY") == moment(x * 1000).format("DDMMYYYY")) {
                                        item.stt = i;
                                        i++;
                                        arr2.push(item)
                                    }
                                });
                                self.render_grid(arr2);
                                self.$el.find("#name").keyup(function () {
                                    var arr3 = [];
                                    var i = 1;
                                    arr2.forEach(function (item, index) {
                                        if ((item.name).indexOf(self.$el.find("#name").val()) !== -1) {
                                            item.stt = i;
                                            i++;
                                            arr3.push(item)
                                        }
                                    });
                                    self.render_grid(arr3);

                                });
                            }

                        })
                    }
                })
            }
        },
        render_grid: function (dataSource) {
            var self = this;
            // self.$el.find('.medicalequipment').remove();
            // self.$el.find('.xuongdong').remove();
            // console.log(Math.ceil(dataSource.length/10))
            // dataSource.forEach(function (item, index) {
            //     if(index < 10){

            //         self.$el.find('#grid-table').append(`<div class="medicalequipment row">
            //         <div class="d-flex justify-content-center  align-items-center col-md-1 col-sm-1 col-2 p-0 stt">${item.stt}</div>
            //         <div class="col-md-10 col-sm-10 col-8 p-0">
            //             <div style="font-weight:bold">${item.name}(Serial:${item.model_serial_number})</div>
            //             <div class="row">
            //                 <div class = "col-md-4">Ngày cấp: ${moment(item.date_of_certification * 1000).local().format("DD/MM/YYYY")} </div>
            //                 <div class = "col-md-4">Ngày hết hạn:${moment(item.expiration_date * 1000).local().format("DD/MM/YYYY")}</div>
            //             </div>
            //             <div>Trạng thái :${item.status}</div>
            //         </div>
            //         <div class="d-flex justify-content-center align-items-center col-md-1 col-sm-1 col-2 p-0 "><button class="btn btn-primary p-2">Chọn</button></div>
            //         </div><hr class="xuongdong">`)
            //     }

            // })
            // self.$el.find('.medicalequipment').each(function (indexHTML2, itemHTML2) {
            //     $(itemHTML2).bind('click', function () {
            //         var link = (dataSource[parseInt($(itemHTML2).find('.stt').html())-1].id)
            //         self.getApp().getRouter().navigate("certificateform/model?id=" + link);

            //     })
            // })
            // self.$el.find('.xxx').each(function (indexHTML, itemHTML) {

            //     $(itemHTML).click(function () {
            //         self.$el.find('.medicalequipment').remove();
            //         self.$el.find('.xuongdong').remove();

            //         dataSource.forEach(function (item, index) {
            //             if ((indexHTML) * 10 <= index && index < (indexHTML + 1) * 10)
            //                 self.$el.find('#grid-table').append(`<div class="medicalequipment row">
            //             <div class="d-flex justify-content-center  align-items-center col-md-1 col-sm-1 col-2 p-0 stt">${item.stt}</div>
            //             <div class="col-md-10 col-sm-10 col-8 p-0">
            //                 <div style="font-weight:bold">${item.name}(Serial:${item.model_serial_number})</div>
            //                 <div class="row">
            //                     <div class = "col-md-4">Ngày cấp: ${moment(item.date_of_certification * 1000).local().format("DD/MM/YYYY")} </div>
            //                     <div class = "col-md-4">Ngày hết hạn:${moment(item.expiration_date * 1000).local().format("DD/MM/YYYY")}</div>
            //                 </div>
            //                 <div>Trạng thái :${item.status}</div>
            //             </div>
            //             <div class="d-flex justify-content-center align-items-center col-md-1 col-sm-1 col-2 p-0 "><button class="btn btn-primary p-2">Chọn</button></div>
            //             </div><hr class="xuongdong">`)
            //         })

            //         self.$el.find('.medicalequipment').each(function (indexHTML2, itemHTML2) {
            //             $(itemHTML2).bind('click', function () {
            //                 var link = (dataSource[parseInt($(itemHTML2).find('.stt').html())-1].id)
            //                 self.getApp().getRouter().navigate("certificateform/model?id=" + link);

            //             })
            //         })
            //     })
            // })




            var element = self.$el.find("#grid-data");

            element.grid({
                // showSortingIndicator: true,
                orderByMode: "client",
                language: {
                    no_records_found: "Chưa có dữ liệu"
                },
                noResultsClass: "alert alert-default no-records-found",
                fields: [
                    {
                        label: "STT",
                        width: "30px",
                        template: function (rowData) {
                            if (!!rowData) {
                                return `
                                            <div>${rowData.stt}</div>
                                        `;
                            }
                            return "";
                        }
                    },
                    {
                        label: "Phiếu",
                        template: function (rowData) {
                            if (!!rowData) {
                                var utcTolocal = function (times, format) {
                                    return moment(times * 1000).local().format(format);
                                }
                                return `    <div style="position: relative;">
                                                <div>${rowData.name} (Serial:${rowData.model_serial_number})</div>
                                                <div>Ngày cấp:${utcTolocal(rowData.date_of_certification, "DD/MM/YYYY")}</div>
                                                <div>Ngày hết hạn:${utcTolocal(rowData.expiration_date, "DD/MM/YYYY")}</div>
                                                <div>Trạng thái:${rowData.status}</div>
                                                <i style="position: absolute;bottom:0;right:0" class='fa fa-angle-double-right'></i>
                                            </div>
                                            `;
                            }
                            return "";
                        }
                    },

                ],
                dataSource: dataSource,
                primaryField: "id",
                refresh: true,
                selectionMode: false,
                pagination: {
                    page: 1,
                    pageSize: 10
                },
                events: {
                    "rowclick": function (e) {
                        self.getApp().getRouter().navigate("certificateform/model?id=" + e.rowId);
                    },
                },
            });
            $(self.$el.find('.grid-data tr')).each(function (index, item) {
                $(item).find('td:first').css('height',$(item).height())

                console.log($(item).find('td:first').addClass('d-flex align-items-center justify-content-center'))

            })
        },
    });

});