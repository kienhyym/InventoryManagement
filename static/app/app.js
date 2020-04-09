define('jquery', [], function () {
	return jQuery;
});

require.config({
	baseUrl: static_url + '/js/lib',
	paths: {
		app: '../../app',
		tpl: '../tpl',
		vendor: '../../vendor',
		schema: '../../schema'
	},
	//	paths: {
	//		app: '../app',
	//		schema: '../schema',
	//		tpl: '../tpl',
	//		vendor: '../../vendor'
	//	},
	shim: {
		'gonrin': {
			deps: ['underscore', 'jquery', 'backbone'],
			exports: 'Gonrin'
		},
		'backbone': {
			deps: ['underscore', 'jquery'],
			exports: 'Backbone'
		},
		'underscore': {
			exports: '_'
		}
	}
});
window.clone = function (objectData) {
	return JSON.parse(JSON.stringify(objectData));
}
class Loader {
	show() {
		if (!$('.load-process').hasClass('active')) {
			$('.load-process').addClass('active');
		}
	}
	hide() {
		if ($('.load-process').hasClass('active')) {
			$('.load-process').removeClass('active');
		}
	}
}
var loader = new Loader();
require(['jquery',
	'gonrin',
	'app/router',
	'app/nav/NavbarView',
	'text!app/base/tpl/index.html',
	'i18n!app/nls/app',
	'vendor/lodash-4.17.10'],
	function ($, Gonrin, Router, Nav, layout, lang, lodash) {
		$.ajaxSetup({
			headers: {
				'content-type': 'application/json'
			}
		});

		window.lodash = lodash;
		var domain = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '')
		if (domain !== "http://0.0.0.0:7100"){
			domain = domain+"/inven"
		}
		console.log('xxxxxxxxxxxxxxxx',domain)

		var app = new Gonrin.Application({
			
			// serviceURL: location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '')+"/inven",
			serviceURL: domain,
			router: new Router(),
			lang: lang,
			layout: layout,
			staticURL: static_url,
			initialize: function () {
				this.getRouter().registerAppRoute();
				this.getCurrentUser();
			},
			getCurrentUser: function () {
				var self = this;
				$.ajax({
					url: self.serviceURL + "/api/v1/current_user",
					dataType: "json",
					success: function (data) {
						self.postLogin(data);
					},
					error: function (XMLHttpRequest, textStatus, errorThrown) {
						loader.hide();

						self.router.navigate("login");
					}
				});
			},
			postLogin: function (data) {
				var self = this;
				loader.show();

				self.currentTenant = data.current_tenant_id;
				self.currentUser = new Gonrin.User(data);
				var tpl = gonrin.template(layout)({});
				$('.content-contain').html(tpl);
				this.$header = $('body').find(".main-sidebar");
				this.$content = $('body').find(".content-area");
				this.$navbar = $('body').find(".main-sidebar .nav-wrapper");

				this.nav = new Nav({ el: this.$navbar });
				self.nav.render();

				$("span#display_name").html(self.get_displayName(data));

				self.bind_event();
				$("#changepassword").on("click", function () {
					self.router.navigate("changepassword");
				});
				loader.hide();
				//edit user-panel
				$('.user-panel image img').attr('src',self.currentUser.user_image)
				$('.user-info p').html(self.currentUser.name)
				$('.user-panel').unbind('click').bind('click', function () {
					var path = 'user/model?id=' + self.currentUser.id;
					self.router.navigate(path);
				})
			},
			bind_event: function () {
				var self = this;
				var currentUser = self.currentUser.id;
				$(".navbar-brand").bind('click', function () {
					self.router.navigate("index");

					location.reload()
				});

				$("#logout").unbind('click').bind('click', function () {
					self.router.navigate("logout");
				});
				$("#info_myself").unbind('click').bind('click', function () {
					self.router.navigate("user/model?id=" + currentUser);

				});
				// $('#list_search').hide()
				// $('#list_search_mobile').hide()

				// $('#search_keyup').unbind('click').bind('click', function (params) {
				// 	$('#list_search').show()
				// })
				// $('#search_keyup_mobile').unbind('click').bind('click', function (params) {
				// 	$('#list_search_mobile').show()
				// })

				// self.gridSearch();
				// self.CountTheNumberOfDevicesTested();
				// self.chartCountNumberOfMonth();
				// self.waitingForProgress();
				// self.listToday();

				// $('.showthongbao').hide();
				// $('.clickthongbao').unbind('click').bind('click', function () {
				// 	$('.showthongbao').toggle();
				// })

				// $.ajax({
				// 	url: self.serviceURL + "/api/v1/certificateform?results_per_page=100000&max_results_per_page=1000000",
				// 	method: "GET",
				// 	data: { "q": JSON.stringify({ "order_by": [{ "field": "created_at", "direction": "desc" }] }) },
				// 	contentType: "application/json",
				// 	success: function (data) {
				// 		data.objects.forEach(function (item, index) {
				// 			if (item.status == 'active') {
				// 				var ngayhomnay = moment(moment().unix() * 1000).format("DD/MM/YYYY");
				// 				var hethansau7ngay = moment(item.expiration_date * 1000).subtract(7, 'days').format("DD/MM/YYYY");
				// 				var hethansau5ngay = moment(item.expiration_date * 1000).subtract(5, 'days').format("DD/MM/YYYY");
				// 				if (ngayhomnay === hethansau7ngay || ngayhomnay === hethansau5ngay) {
				// 					$.ajax({
				// 						url: self.serviceURL + "/api/v1/notification?results_per_page=100000&max_results_per_page=1000000",
				// 						method: "GET",
				// 						data: { "q": JSON.stringify({ "order_by": [{ "field": "created_at", "direction": "desc" }] }) },
				// 						contentType: "application/json",
				// 						success: function (data) {
				// 							var dem = 0;
				// 							(data.objects).forEach(function (item2, index2) {
				// 								if (item2.notification_type_id == item.id && moment(item2.notification_time * 1000).format("DD/MM/YYYY") == ngayhomnay) {
				// 									dem++;
				// 								}
				// 							})
				// 							if (dem == 0) {
				// 								$.ajax({
				// 									method: "POST",
				// 									url: self.serviceURL + "/api/v1/notification",
				// 									data: JSON.stringify({
				// 										name: item.name,
				// 										model_serial_number: item.model_serial_number,
				// 										notification_type_id: item.id,
				// 										notification_type: "Kiểm định thiết bị",
				// 										notification_type_code: "certificateform",
				// 										status: "chuaxem",
				// 										notification_time: moment().unix()
				// 									}),
				// 									headers: {
				// 										'content-type': 'application/json'
				// 									},
				// 									dataType: 'json',
				// 									success: function (response) {
				// 										location.reload();

				// 									}, error: function (xhr, ere) {
				// 										console.log('xhr', ere);

				// 									}
				// 								})
				// 							}

				// 						}
				// 					}
				// 					)

				// 				}
				// 			}

				// 		})
				// 	},
				// 	error: function (xhr, status, error) {

				// 	}
				// });

				// $.ajax({
				// 	url: self.serviceURL + "/api/v1/notification?results_per_page=100000&max_results_per_page=1000000",
				// 	method: "GET",
				// 	data: { "q": JSON.stringify({ "order_by": [{ "field": "created_at", "direction": "desc" }] }) },
				// 	contentType: "application/json",
				// 	success: function (data) {
				// 		var tong = 0;
				// 		data.objects.forEach(function (item, index) {
				// 			if (item.status == "chuaxem") {
				// 				tong++;
				// 			}
				// 		})
				// 		if (tong != 0) {
				// 			$('.fa-bell').css("color", "red")
				// 			$('#bgcolor').css("backgroundColor", "red")

				// 		}
				// 		$('#soluong').append(tong);


				// 		data.objects.forEach(function (itemmangthongbao, indexmangthongbao) {
				// 			$('#bangthongbao').append('<tr class="danhsachthongbaomoi"><td>' + itemmangthongbao.notification_type + '</td><td>' + itemmangthongbao.name + '[' + itemmangthongbao.model_serial_number + ']</td></tr>')

				// 			if (itemmangthongbao.status == "chuaxem") {
				// 				$($('.danhsachthongbaomoi')[indexmangthongbao]).css("background-color", "yellow")
				// 			}
				// 		})

				// 		$('.danhsachthongbaomoi').each(function (indexdanhsachthongbaomoi, itemdanhsachthongbaomoi) {
				// 			$(itemdanhsachthongbaomoi).unbind('click').bind("click", function () {
				// 				var link = data.objects[indexdanhsachthongbaomoi].notification_type_code + "/model?id=" + data.objects[indexdanhsachthongbaomoi].notification_type_id
				// 				self.router.navigate(link);
				// 				var link2 = self.serviceURL + "/api/v1/notification/" + data.objects[indexdanhsachthongbaomoi].id
				// 				$.ajax({
				// 					url: link2,
				// 					method: "PUT",
				// 					data: JSON.stringify({
				// 						"status": "status"
				// 					}),
				// 					contentType: "application/json",
				// 					success: function (data) {
				// 						console.log('thanhcong')

				// 					},
				// 					error: function (xhr, status, error) {
				// 					}
				// 				});
				// 				location.reload();
				// 				$('.showthongbao').hide();

				// 			})
				// 		})


				// 	},
				// 	error: function (xhr, status, error) {

				// 	}
				// });
				$.extend($.easing, {
					easeOutSine: function easeOutSine(x, t, b, c, d) {
						return c * Math.sin(t / d * (Math.PI / 2)) + b;
					}
				});
				var slideConfig = {
					duration: 270,
					easing: 'easeOutSine'
				};

				// Add dropdown animations when toggled.
				$(':not(.main-sidebar--icons-only) .dropdown').on('show.bs.dropdown', function () {
					$(this).find('.dropdown-menu').first().stop(true, true).slideDown(slideConfig);
				});

				$(':not(.main-sidebar--icons-only) .dropdown').on('hide.bs.dropdown', function () {
					$(this).find('.dropdown-menu').first().stop(true, true).slideUp(slideConfig);
				});
				$('.toggle-sidebar').unbind("click").bind('click', function (e) {
					$('.main-sidebar').toggleClass('open');
				});


			},
			// gridSearch: function () {
			// 	var self = this;
			// 	var arrSearch = [
			// 		{ "search_keyup": "search_keyup", "list_search": "list_search" },
			// 		{ "search_keyup": "search_keyup_mobile", "list_search": "list_search_mobile" },
			// 	];
			// 	$.ajax({
			// 		url: self.serviceURL + "/api/v1/equipmentdetails?results_per_page=100000&max_results_per_page=1000000",
			// 		method: "GET",
			// 		contentType: "application/json",
			// 		success: function (data) {
			// 			arrSearch.forEach(function (item, index) {
			// 				$('#' + item.search_keyup).keyup(function () {
			// 					var arr = [];
			// 					data.objects.forEach(function (item_data, index_data) {
			// 						if ((item_data.name).indexOf($('#' + item.search_keyup).val()) !== -1) {
			// 							arr.push(item_data)
			// 						}
			// 					});
			// 					$("#" + item.list_search).grid({
			// 						showSortingIndicator: true,
			// 						language: {
			// 							no_records_found: "không tìm thấy kết quả"
			// 						},
			// 						noResultsClass: "alert alert-default no-records-found",
			// 						refresh: true,
			// 						orderByMode: "client",
			// 						tools: [
			// 						],
			// 						fields: [
			// 							{ field: "name", label: "Tên thiết bị", width: 350, height: "20px" },
			// 							{ field: "model_serial_number", label: "serial", width: 250, height: "20px" },
			// 						],
			// 						dataSource: arr,
			// 						primaryField: "id",
			// 						selectionMode: false,
			// 						pagination: {
			// 							page: 1,
			// 							pageSize: 20
			// 						},
			// 						onRowClick: function (event) {
			// 							if (event.rowId) {
			// 								self.router.navigate("equipmentdetails/model?id=" + event.rowId);
			// 								$("#" + item.list_search).hide()

			// 							}
			// 						},
			// 					});
			// 				});
			// 				$('#' + item.search_keyup).focusout(function () {
			// 					setTimeout(function () {
			// 						$("#" + item.list_search).hide()
			// 					}, 300);
			// 				})
			// 			})
			// 		},
			// 		error: function (xhr, status, error) {
			// 		},
			// 	})
			// },
			// CountTheNumberOfDevicesTested: function () {
			// 	var self = this;
			// 	var thoiGianBatDau = moment().format('MMMM Do YYYY') + ' 00:00:01';
			// 	var thoiGianKetThuc = String(moment().format('MMMM Do YYYY')) + ' 23:59:59';
			// 	$.ajax({
			// 		url: self.serviceURL + "/api/v1/date_sort",
			// 		method: "POST",
			// 		data: JSON.stringify(
			// 			{
			// 				"thoiGianBatDau": Date.parse(thoiGianBatDau) / 1000,
			// 				"thoiGianKetThuc": Date.parse(thoiGianKetThuc) / 1000
			// 			}
			// 		),
			// 		contentType: "application/json",
			// 		success: function (data) {
			// 			$("#countTheNumberOfDevicesTested").html(data.equipmentinspectionform.length);
			// 			$("#countTheNumberOfDevicesToTest").html(data.devicestatusverificationform.length);
			// 			$("#countTheNumberOfDevicesThatRequireRepair").html(data.repairrequestform.length);
			// 			$("#countTheNumberOfVerifiedDevices").html(data.certificateform.length);

			// 		}
			// 	})
			// },
			// chartCountNumberOfMonth: function () {
			// 	var self = this;
			// 	$.ajax({
			// 		url: self.serviceURL + "/api/v1/count_of_month",
			// 		method: "POST",
			// 		data: JSON.stringify(
			// 			{
			// 				"nam": Number(moment().format('YYYY')),
			// 			}
			// 		),
			// 		contentType: "application/json",
			// 		success: function (data) {
			// 			var ctx = document.getElementById('myChart');
			// 			var myChart = new Chart(ctx, {
			// 				type: 'line',
			// 				data: {
			// 					labels: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
			// 					datasets: [
			// 						{
			// 							label: 'Số lượng thiết bị được kiểm tra trong các tháng',
			// 							data: data.equipmentinspectionform_count,
			// 							backgroundColor: 'rgba(65, 183, 255, 1)',
			// 							borderColor: 'rgba(65, 183, 255, 1)',
			// 							borderWidth: 1,
			// 							fill: false
			// 						},
			// 						{
			// 							label: 'Số lượng thiết bị được yêu cầu kiểm tra',
			// 							data: data.devicestatusverificationform_count,
			// 							backgroundColor: 'rgba(255, 144, 55, 1)',
			// 							borderColor: 'rgba(255, 144, 55, 1)',
			// 							borderWidth: 1,
			// 							fill: false

			// 						},
			// 						{
			// 							label: 'Số lượng thiết bị yêu cầu sửa chữa',
			// 							data: data.repairrequestform_count,
			// 							backgroundColor: 'rgba(255, 33, 0, 1)',
			// 							borderColor: 'rgba(255, 33, 0, 1)',
			// 							borderWidth: 1,
			// 							fill: false

			// 						},
			// 						{
			// 							label: 'Số lượng thiết bị được kiểm định',
			// 							data: data.certificateform_count,
			// 							backgroundColor: 'rgba(114, 182, 17, 1)',
			// 							borderColor: 'rgba(114, 182, 17, 1)',
			// 							borderWidth: 1,
			// 							fill: false
			// 						},
			// 					]
			// 				},
			// 				options: {
			// 					responsive: true,
			// 					title: {
			// 						display: true,
			// 						text: 'Biểu đồ thống kê kiểm tra thiết bị hàng tháng'
			// 					},
			// 					legend: {
			// 						fullWidth: 'true',
			// 						labels: {
			// 							padding: 20,
			// 						},
			// 						align:"start"
			// 					}
			// 				}
			// 			});
			// 		}
			// 	})

			// 	var kichthuocmanhinh = $(window).width();
			// 	if(kichthuocmanhinh < 768){
			// 		$('#myChart').attr('height','400')
			// 	}
			// },
			// waitingForProgress: function () {
			// 	var self = this;
			// 	var trangthai = ["dangyeucaukiemtrathietbi", "dangyeucausuachua", "dangchokiemdinh"];
			// 	trangthai.forEach(function (item, index) {
			// 		var filters = {
			// 			filters: {
			// 				"$and": [
			// 					{ "status": { "$eq": item } }
			// 				]
			// 			},
			// 			order_by: [{ "field": "created_at", "direction": "desc" }]
			// 		}

			// 		$.ajax({
			// 			url: self.serviceURL + "/api/v1/equipmentdetails?results_per_page=100000&max_results_per_page=1000000",
			// 			method: "GET",
			// 			data: "q=" + JSON.stringify(filters),
			// 			contentType: "application/json",
			// 			success: function (data) {
			// 				$('#' + item).text(data.objects.length)
			// 				$('.' + item).attr('trangthai', item)
			// 			},
			// 		})
			// 	})
			// 	$('.yeucauxuly').unbind('click').bind('click', function () {
			// 		localStorage.setItem('TrangThaiThietBi', $(this).attr('trangthai'))
			// 		self.getRouter().navigate("equipmentdetails/collection");
			// 	})
			// },
			// listToday: function () {
			// 	var self = this;
			// 	$('.danhsachhomnay').unbind('click').bind('click', function () {
			// 		localStorage.setItem('LoaiDanhSachHomNay', $(this).attr('table-name'))
			// 		self.getRouter().navigate($(this).attr('table-name') + "/collection");
			// 	})
			// },
			get_displayName: function (data) {
				var displayName = "";
				if (!!data.name) {
					displayName = data.name;
				}
				if (displayName === null || displayName === "") {
					if (!!data.phone_number) {
						displayName = data.phone_number;
					} else if (!!data.email) {
						displayName = data.email;
					}

				}
				return displayName;
			},

			saveLog: function (action, object_type, object_no, workstation_id, workstation_name, items, created_at) {
				var self = this;
				$.ajax({
					type: "POST",
					url: self.serviceURL + "/api/v1/activitylog/save",
					data: JSON.stringify({
						action: action,
						actor: self.currentUser.display_name,
						workstation_id: workstation_id,
						workstation_name: workstation_name,
						tenant_id: self.currentTenant,
						user_id: self.currentUser.id,
						items: items,
						object_no: object_no,
						object_type: object_type,
						created_at: created_at

					}), success: function (res) {
						// console.log("res", res);
					}, error: function (err) {
						// console.log("err", err);
					}
				})
			},
		});
		Backbone.history.start();

	});