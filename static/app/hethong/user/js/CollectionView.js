define(function (require) {
    "use strict";
    var $ = require('jquery'),
        _ = require('underscore'),
        Gonrin = require('gonrin');

    var template = require('text!app/hethong/user/tpl/collection.html'),
		schema = require('json!schema/UserSchema.json');

    return Gonrin.CollectionView.extend({
        template: template,
        modelSchema: schema,
        urlPrefix: "/api/v1/",
        collectionName: "user",
        uiControl:{
            fields: [
                {
                    field: "stt",
                    label: "STT",
                    width: "30px",
                },
                {
                    field: "name", label: "Tên", width: 250, readonly: true,
                },
                {
                    field: "email", label: "Email", width: 250, readonly: true,
                },
                {
                    field: "phone_number", label: "Số điện thoại", width: 250, readonly: true,
                },
            ],
            onRowClick: function (event) {
                if (event.rowId) {
                    var path =  this.collectionName + '/model?id=' + event.rowId;
                    this.getApp().getRouter().navigate(path);
                }
            }
        },
        tools: [
			{
				name: "defaultgr",
				type: "group",
				groupClass: "toolbar-group",
				buttons: [
					{
						name: "create",
						type: "button",
						buttonClass: "btn btn-primary font-weight-bold",
						label: "+ Người dùng",
						command: function () {
							var self = this;
							this.getApp().getRouter().navigate("#user/model");
						}
					},
				]
			}],
        render: function () {
            
            this.applyBindings();   
            this.locData();

			return this;
		},
		locData: function () {
			var self = this;
			$.ajax({
				url: self.getApp().serviceURL + "/api/v1/user?results_per_page=100000&max_results_per_page=1000000",
				method: "GET",
				data: { "q": JSON.stringify({ "order_by": [{ "field": "updated_at", "direction": "desc" }] }) },
				contentType: "application/json",
				success: function (data) {
					var arr = [];
					data.objects.forEach(function (item, index) {
						item.stt = index+1;
						arr.push(item)
					})
					console.log(arr)
					self.render_grid(arr);
				}
			})
		},
		render_grid: function (dataSource) {
			sessionStorage.clear();

			var self = this;
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
                        label: "Thông tin",
                        template: function (rowData) {
                            if (!!rowData) {
                                var rank = '';
                                if(rowData.rank == 1){
                                    rank = "Giám đốc" 
                                }
                                if(rowData.rank == 2){
                                    rank = "Trưởng phòng vật tư" 
                                }
                                if(rowData.rank == 3){
                                    rank = "Nhân viên kỹ thuật" 
                                }
                                if(rowData.rank == 4){
                                    rank = "Nhân sự department phòng" 
                                }
                                return `    <div style="position: relative;">
                                                <div>Tên:${rowData.name}</div>
                                                <div>Email:${rowData.email}</div>
                                                <div>Số điện thoại:${rowData.phone_number}</div>
                                                <div>Vai trò:${rank}</div>

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
					pageSize: 15
				},
				events: {
					"rowclick": function (e) {
						self.getApp().getRouter().navigate("user/model?id=" + e.rowId);
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