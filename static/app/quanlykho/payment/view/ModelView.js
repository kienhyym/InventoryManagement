define(function (require) {
	"use strict";
	var $ = require('jquery'),
		_ = require('underscore'),
		Gonrin = require('gonrin');

	var template = require('text!app/quanlykho/payment/tpl/model.html'),
		schema = require('json!schema/PaymentSchema.json');

	var Helpers = require('app/base/view/Helper');


	var currencyFormat = {
		symbol: "VNĐ",		// default currency symbol is '$'
		format: "%v %s",	// controls output: %s = symbol, %v = value (can be object, see docs)
		decimal: ",",		// decimal point separator
		thousand: ".",		// thousands separator
		precision: 0,		// decimal places
		grouping: 3		// digit grouping (not implemented yet)
	};


	return Gonrin.ModelDialogView.extend({
		template: template,
		modelSchema: schema,
		urlPrefix: "/api/v1/",
		collectionName: "payment",
		listItemRemove: [],

		tools: [
			{
				name: "defaultgr",
				type: "group",
				groupClass: "toolbar-group",
				buttons: [
					{
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
							if(self.model.get('organization_id') == null){
								self.getApp().notify({ message: "Bạn chưa chọn doanh nghiệp" }, { type: "danger", delay: 1000 });
								return false
							}
							if(self.model.get('receiver') == null){
								self.getApp().notify({ message: "Bạn chưa viết người nhận tiền" }, { type: "danger", delay: 1000 });
								return false
							}
							if(self.model.get('amount') == 0 || self.model.get('amount') < 0){
								self.getApp().notify({ message: "Bạn chưa viết số tiền" }, { type: "danger", delay: 1000 });
								return false
							}
							self.checkStatus();
							var id = this.getApp().getRouter().getParam("id");
							var method = "update";
							if (!id) {
								var method = "create";
								self.model.set("created_at", Helpers.utcToUtcTimestamp());
								var tenant_id = self.getApp().currentTenant[0];
								self.model.set("tenant_id", tenant_id);
								var payNo = Helpers.makeNoGoods(6, "TT0").toUpperCase();
								self.model.set("payment_no", payNo);
							}

							self.model.sync(method, self.model, {
								success: function (model, respose, options) {
									self.deleteItem();
									self.updateItem();
									self.createItem(model.id);
									self.updateStatus();
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
						name: "save",
						type: "button",
						buttonClass: "btn-success btn btn-sm",
						label: "Xác nhận",
						command: function () {
							var self = this;
							if(self.model.get('organization_id') == null){
								self.getApp().notify({ message: "Bạn chưa chọn doanh nghiệp" }, { type: "danger", delay: 1000 });
								return false
							}
							if(self.model.get('receiver') == null){
								self.getApp().notify({ message: "Bạn chưa viết người nhận tiền" }, { type: "danger", delay: 1000 });
								return false
							}
							if(self.model.get('amount') == 0 || self.model.get('amount') < 0){
								self.getApp().notify({ message: "Bạn chưa viết số tiền" }, { type: "danger", delay: 1000 });
								return false
							}						
							self.checkStatus();

							var id = this.getApp().getRouter().getParam("id");
							var method = "update";
							self.checkFinish();

							// self.model.set("status", "finish");
							if (!id) {
								var method = "create";
								self.model.set("created_at", Helpers.utcToUtcTimestamp());
								var tenant_id = self.getApp().currentTenant[0];
								self.model.set("tenant_id", tenant_id);
								var payNo = Helpers.makeNoGoods(6, "TT0").toUpperCase();
								self.model.set("payment_no", payNo);

							}

							self.model.sync(method, self.model, {
								success: function (model, respose, options) {
									self.deleteItem();
									self.updateItem();
									self.createItem(model.id);
									self.updateStatus();

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

		uiControl: {
			fields: [{
				field: "amount",
				uicontrol: "currency",
				currency: currencyFormat,
				cssClass: "text-right"
			},
			{
				field: "type",
				uicontrol: "combobox",
				textField: "text",
				valueField: "value",
				dataSource: [
					{ "value": "goodsreciept", "text": "Phiếu nhập hàng" },
					{ "value": "purchaseorder", "text": "Phiếu xuất hàng" }
				],
			},
			]
		},

		render: function () {
			var self = this;
			var id = this.getApp().getRouter().getParam("id");
			if (id) {
				this.model.set('id', id);
				this.model.fetch({
					success: function (data) {
						if(self.model.get('status') == "finish"){
							self.$el.find('[btn-name="save"],[btn-name="delete"]').remove()
						}
						
						self.applyBindings();
						self.regsiterEvent();
						self.showDetail();
						self.showDataOrganization();
						self.listItemsOldRemove();

						self.$el.find("#created_at").html(`${Helpers.utcToLocal(self.model.get("created_at") * 1000, "DD-MM-YYYY HH:mm")}`);
						self.$el.find("#payment_no").html(self.model.get("payment_no"));
						
					},
					error: function () {
						toastr.error("Lỗi hệ thống, vui lòng thử lại sau.");
					},
				});
			} else {
				self.applyBindings();
				self.regsiterEvent();
			}

		},

		regsiterEvent: function () {
			var self = this;
			self.loadItemDropdown();
			self.loadItemDropdownOrganization();
		},
		loadItemDropdownOrganization: function () { // Đổ danh sách Item vào ô tìm kiếm
			var self = this;
			self.$el.find('.search-item-organization').keyup(function name() {
				self.$el.find('.dropdown-item-organization').remove();
				var text = $(this).val()
				$.ajax({
					type: "POST",
					url: self.getApp().serviceURL + "/api/v1/load_organization",
					data: JSON.stringify({ "text": text, "tenant_id": self.getApp().currentTenant[0] }),
					success: function (response) {
						self.$el.find('.dropdown-item-organization').remove();
						var count = response.length
						response.forEach(function (item, index) {
							self.$el.find('.dropdown-menu-item-organization').append(`
                            <button organization-id="${item.id}" organization-name="${item.organization_name}" class="dropdown-item dropdown-item-organization" style="text-overflow: ellipsis;overflow: hidden;white-space: nowrap;">${item.organization_name}</button>`)
						})
						if (count == 0) {
							self.$el.find('.dropdown-menu-item-organization').hide()
						}
						if (count == 1) {
							self.$el.find('.dropdown-menu-item-organization').css("height", "45px")
							self.$el.find('.dropdown-menu-item-organization').show()
						}
						if (count == 2) {
							self.$el.find('.dropdown-menu-item-organization').css("height", "80px")
							self.$el.find('.dropdown-menu-item-organization').show()
						}
						if (count > 2) {
							self.$el.find('.dropdown-menu-item-organization').css("height", "110px")
							self.$el.find('.dropdown-menu-item-organization').show()
						}
						self.chooseItemInListDropdownItemOrganization();

					}
				});
			})
			self.$el.find('.out-click').bind('click', function () {
				self.$el.find('.dropdown-menu-item-organization').hide()
			})
		},
		chooseItemInListDropdownItemOrganization: function () {
			var self = this;
			self.$el.find('.dropdown-menu-item-organization .dropdown-item').unbind('click').bind('click', function () {
				var dropdownItemClick = $(this);
				var itemOrganizationID = dropdownItemClick.attr('organization-id')
				var itemOrganizationName = dropdownItemClick.attr('organization-name')

				self.$el.find('.dropdown-menu-item-organization').hide()
				self.$el.find('.search-item-organization').val(itemOrganizationName)
				self.model.set("organization_id", itemOrganizationID)
			})
		},
		showDataOrganization: function () {
			var self = this;
			self.$el.find('.search-item-organization').val(self.model.get('organization').organization_name)
			if (self.model.get('goodsreciept_id') != null || self.model.get('purchaseorder_id') != null) {
			}
		},

		//////////////////////////////////////////////////////////
		//////////////////////////////////////////////////////////
		//////////////////////////////////////////////////////////
		//////////////////////////////////////////////////////////
		////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		//////////////////////////////////////////////////////////

		// CHỨC NĂNG CHỌN ITEM.
		chooseItemInListDropdownItem: function () {
			var self = this;
			self.$el.find('.dropdown-item').unbind('click').bind('click', function () {
				var stt = self.$el.find('[col-type="STT"]').length + 1;
				var dropdownItemClick = $(this);
				var ItemId = dropdownItemClick.attr('item-id')
				var ItemNo = dropdownItemClick.attr('item-no')
				var ItemType = dropdownItemClick.attr('item-type')
				var ItemAmount = dropdownItemClick.attr('item-amount')
				var ItemAmountDebt = dropdownItemClick.attr('item-amount-debt')
				var ItemCreatedAt = dropdownItemClick.attr('item-created_at')

				var itemAmountvndFormat = new Number(ItemAmount).toLocaleString("en-AU");
				var itemAmountDebtvndFormat = new Number(ItemAmountDebt).toLocaleString("en-AU");

				var itemCreatedAtFormat = Helpers.utcToLocal(ItemCreatedAt * 1000, "DD/MM/YYYY HH:mm")

				self.$el.find('#list-item').before(`
						<div style="width: 955px;height: 50px;" selected-item-id = "${ItemId}" class = "selected-item-new update-status" type = "${ItemType}"  phieu-id = "${ItemId}">
							<div style="width: 45px; display: inline-block;text-align: center;padding: 5px;">
								<input selected-item-id = "${ItemId}" col-type="STT" class="form-control text-center p-1" value="${stt}" style="font-size:14px">
							</div>
							<div style="width: 200px;display: inline-block;text-align: center;padding: 5px;">
								<input selected-item-id = "${ItemId}" col-type="PHIEU_CODE" class="form-control p-1 text-center" value="${ItemNo}" readonly style="font-size:14px">
							</div>
							<div style="width: 200px;display: inline-block;text-align: center;padding: 5px;">
								<input selected-item-id = "${ItemId}" col-type="PHIEU_TIME" readonly class="form-control text-center p-1" ngay-giao-dich = "${ItemCreatedAt}"  value="${itemCreatedAtFormat}" style="font-size:14px">
							</div>
							<div style="width: 220px; display: inline-block; text-align:center;padding: 5px;">
								<input selected-item-id = "${ItemId}"  title="Số tiền còn nợ :${itemAmountDebtvndFormat} VNĐ" col-type="PHIEU_AMOUNT" readonly class="form-control text-center p-1" gia-can-thanh-toan = "${ItemAmount}"  value="${itemAmountvndFormat} VNĐ" style="font-size:14px">
							</div>
							<div style="width: 220px;display: inline-block;text-align: center;padding: 5px;">
								<input selected-item-id = "${ItemId}" title="Số tiền còn nợ : ${itemAmountDebtvndFormat} VNĐ" col-type="AMOUNT" class="form-control text-center p-1" value="0" style="font-size:14px">
							</div>
							<div style="width: 50px;display: inline-block;text-align: center;padding: 5px;">
									<i selected-item-id = "${ItemId}" class="fa fa-trash" style="font-size: 17px"></i>
								</div>
						</div>
						`)
				self.$el.find('.dropdown-menu-item').hide()
				self.$el.find('.search-item').val('')
				self.clickAmount();
				self.$el.find('.selected-item-new div .fa-trash').unbind('click').bind('click', function () {
					self.$el.find('.selected-item-new[selected-item-id="' + $(this).attr('selected-item-id') + '"]').remove();
				})
			})

		},
		clickAmount: function () {
			var self = this;
			self.$el.find('selected-item')
			//Click AMOUNT
			self.$el.find('[col-type="AMOUNT"]').unbind('click').bind('click', function () {
				var pointer = $(this);
				pointer.val(pointer.attr('amount'));
			});
			//Out Click AMOUNT
			self.$el.find('[col-type="AMOUNT"]').focusout(function () {
				var outSelf = $(this);
				const promise = new Promise((resolve, reject) => {
					var selfChange = outSelf.val();
					if (selfChange == null || selfChange == '') {
						selfChange = 0;
					}
					return resolve(outSelf.attr('amount', selfChange));
				})
				promise.then(function (number) {
					var amountFormat = new Number(number.attr('amount')).toLocaleString("en-AU");
					var amountFormatString = String(amountFormat) + ' VNĐ';
					outSelf.val(amountFormatString);
				});
			});

		},
		loadItemDropdown: function () { // Đổ danh sách Item vào ô tìm kiếm
			var self = this;
			self.$el.find('.search-item').keyup(function name() {
				self.$el.find('.dropdown-item').remove();
				var text = $(this).val()
				$.ajax({
					type: "POST",
					url: self.getApp().serviceURL + "/api/v1/load_import_export_dropdown",
					data: JSON.stringify({ "text": text, "tenant_id": self.getApp().currentTenant[0],"organization_id": self.model.get('organization_id') }),
					success: function (response) {
						console.log(response)
						var count = response.length
						response.forEach(function (item, index) {
							self.$el.find('.dropdown-menu-item').append(`
								<button item-id= "${item.item_id}" 
								item-no="${item.item_no}" 
								item-type="${item.item_type}"
								item-amount="${item.amount}"
								item-amount-debt="${item.amount_debt}"
								item-created_at="${item.created_at}" 
								class="dropdown-item" style="text-overflow: ellipsis;overflow: hidden;white-space: nowrap;font-size:14px">${item.item_no}-${Helpers.utcToLocal(item.created_at * 1000, "DD/MM/YYYY")}</button>`)
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
		showDetail: function () {
			var self = this;
			if (self.model.get('paymentdetails') != null && self.model.get('paymentdetails').length > 0) {
				self.model.get('paymentdetails').forEach(function (item, index) {
					var ItemId = item.id;
					if (item.type == "goodsreciept") {
						var goodsreciept_amount = new Number(item.goodsreciept_amount).toLocaleString("en-AU");
						var amount = new Number(item.amount).toLocaleString("en-AU");
						var itemCreatedAtFormat = Helpers.utcToLocal(item.goodsreciept_create_at * 1000, "DD/MM/YYYY HH:mm")
						self.$el.find('#list-item').before(`
							<div style="width: 955px;height: 50px;" selected-item-id = "${ItemId}" class = "selected-item-old update-status" type = "${item.type}"   phieu-id="${item.goodsreciept_id}">
								<div style="width: 45px; display: inline-block;text-align: center;padding: 5px;">
									<input selected-item-id = "${ItemId}" col-type="STT" class="form-control text-center p-1" value="${index + 1}" style="font-size:14px">
								</div>
								<div style="width: 200px;display: inline-block;text-align: center;padding: 5px;">
									<input selected-item-id = "${ItemId}" col-type="PHIEU_CODE" class="form-control p-1 text-center" value="${item.goodsreciept_no}" readonly style="font-size:14px">
								</div>
								<div style="width: 200px;display: inline-block;text-align: center;padding: 5px;">
									<input selected-item-id = "${ItemId}" col-type="PHIEU_TIME" readonly class="form-control text-center p-1"  value="${itemCreatedAtFormat}" style="font-size:14px">
								</div>
								<div style="width: 220px; display: inline-block; text-align:center;padding: 5px;">
									<input selected-item-id = "${ItemId}" col-type="PHIEU_AMOUNT" readonly class="form-control text-center p-1" value="${goodsreciept_amount} VNĐ" style="font-size:14px">
								</div>
								<div style="width: 220px;display: inline-block;text-align: center;padding: 5px;">
									<input selected-item-id = "${ItemId}" col-type="AMOUNT" class="form-control text-center p-1" amount = "${item.amount}" value="${amount} VNĐ" style="font-size:14px">
								</div>
								<div style="width: 50px;display: inline-block;text-align: center;padding: 5px;">
										<i selected-item-id = "${ItemId}" class="fa fa-trash" style="font-size: 17px"></i>
									</div>
							</div>
							`)
					}
					if (item.type == "purchaseorder") {
						var purchaseorder_amount = new Number(item.purchaseorder_amount).toLocaleString("en-AU");
						var amount = new Number(item.amount).toLocaleString("en-AU");
						var itemCreatedAtFormat = Helpers.utcToLocal(item.purchaseorder_create_at * 1000, "DD/MM/YYYY HH:mm")

						self.$el.find('#list-item').before(`
							<div style="width: 955px;height: 50px;" selected-item-id = "${ItemId}" class = "selected-item-old  update-status" type = "${item.type}"  phieu-id="${item.purchaseorder_id}">
								<div style="width: 45px; display: inline-block;text-align: center;padding: 5px;">
									<input selected-item-id = "${ItemId}" col-type="STT" class="form-control text-center p-1" value="${index + 1}" style="font-size:14px">
								</div>
								<div style="width: 200px;display: inline-block;text-align: center;padding: 5px;">
									<input selected-item-id = "${ItemId}" col-type="PHIEU_CODE" class="form-control p-1 text-center" value="${item.purchaseorder_no}" readonly style="font-size:14px">
								</div>
								<div style="width: 200px;display: inline-block;text-align: center;padding: 5px;">
									<input selected-item-id = "${ItemId}" col-type="PHIEU_TIME" readonly class="form-control text-center p-1"  value="${itemCreatedAtFormat}" style="font-size:14px">
								</div>
								<div style="width: 220px; display: inline-block; text-align:center;padding: 5px;">
									<input selected-item-id = "${ItemId}" col-type="PHIEU_AMOUNT" readonly class="form-control text-center p-1" value="${purchaseorder_amount} VNĐ" style="font-size:14px">
								</div>
								<div style="width: 220px;display: inline-block;text-align: center;padding: 5px;">
									<input selected-item-id = "${ItemId}" col-type="AMOUNT" class="form-control text-center p-1" amount = "${item.amount}" value="${amount} VNĐ" style="font-size:14px">
								</div>
								<div style="width: 50px;display: inline-block;text-align: center;padding: 5px;">
										<i selected-item-id = "${ItemId}" class="fa fa-trash" style="font-size: 17px"></i>
									</div>
							</div>
							`)
					}

				})
				self.clickAmount();

			}



		},
		createItem: function (id) {
			var self = this;
			var arr = [];
			self.$el.find('.selected-item-new').each(function (index, item) {
				var obj = {
					"payment_id": id,
					"tenant_id": self.getApp().currentTenant[0],
					"amount": Number($(item).find('[col-type="AMOUNT"]').attr('amount')),
					"type": $(item).attr('type'),
					"phieu_id": $(item).attr('selected-item-id')
				}
				arr.push(obj)
			})
			if (arr.length > 0) {

				$.ajax({
					type: "POST",
					url: self.getApp().serviceURL + "/api/v1/create_payment_detail",
					data: JSON.stringify(arr),
					success: function (response) {
						console.log(response)
					}
				});
			}
		},
		updateItem: function () {
			var self = this;
			var arr = [];
			self.$el.find('.selected-item-old').each(function (index, item) {
				var obj = {
					"id": $(item).attr('selected-item-id'),
					"amount": Number($(item).find('[col-type="AMOUNT"]').attr('amount')),
				}
				arr.push(obj)
			})
			if (arr.length > 0) {
				$.ajax({
					type: "POST",
					url: self.getApp().serviceURL + "/api/v1/update_payment_detail",
					data: JSON.stringify(arr),
					success: function (response) {
						console.log(response)
					}
				});
			}
		},
		listItemsOldRemove: function () {
			var self = this;
			self.$el.find('.selected-item-old div .fa-trash').unbind('click').bind('click', function () {
				var id = $(this).attr('selected-item-id')
				self.$el.find('.selected-item-old[selected-item-id="' + id + '"]').remove();
				self.listItemRemove.push($(this).attr('selected-item-id'))
			})
		},
		deleteItem: function () {
			var self = this;
			var arrayItemRemove = self.listItemRemove.length;
			if (arrayItemRemove > 0) {
				$.ajax({
					type: "POST",
					url: self.getApp().serviceURL + "/api/v1/delete_payment_detail",
					data: JSON.stringify(self.listItemRemove),
					success: function (response) {
						self.listItemRemove.splice(0, arrayItemRemove);
						console.log(response)
					}
				});
			}
		},
		updateStatus: function () {
			var self = this;
			var arr = [];
			self.$el.find('.update-status').each(function (index, item) {
				var obj = {
					"type": $(item).attr('type'),
					"phieu_id": $(item).attr('phieu-id'),
				}
				arr.push(obj)
			})
			console.log(arr)
			if (arr.length > 0) {

				$.ajax({
					type: "POST",
					url: self.getApp().serviceURL + "/api/v1/update_status",
					data: JSON.stringify(arr),
					success: function (response) {
						console.log(response)
					}
				});
			}
		},
		checkStatus: function () {
			var self = this;
			var arr = [];
			self.$el.find('.update-status').each(function (index, item) {
				arr.push($(item).find('div [col-type="AMOUNT"]').attr('amount'))
			})
			var thanhToan = 0;
			arr.forEach(function(item,index){
				thanhToan = thanhToan + item
			})
			if (thanhToan < self.model.get('amount')){
				self.model.set("status", "slacking");
			}
			if (thanhToan == self.model.get('amount')){
				self.model.set("status", "success");
			}
			if (thanhToan > self.model.get('amount')){
				self.model.set("status", "wrong");
			}
		},
		checkFinish: function () {
			var self = this;
			var arr = [];
			self.$el.find('.update-status').each(function (index, item) {
				arr.push($(item).find('div [col-type="AMOUNT"]').attr('amount'))
			})
			var thanhToan = 0;
			arr.forEach(function(item,index){
				thanhToan = Number(thanhToan) + Number(item)
			})
			console.log(thanhToan,self.model.get('amount'))
			if (thanhToan < self.model.get('amount')){
				self.model.set("status", "slacking");

				self.getApp().notify({ message: "Thừa tiền" }, { type: "danger", delay: 1000 });
				return false
			}
			if (thanhToan == self.model.get('amount')){
				self.model.set("status", "finish");
			}
			if (thanhToan > self.model.get('amount')){
				self.model.set("status", "wrong");

				self.getApp().notify({ message: "Thiếu tiền" }, { type: "danger", delay: 1000 });
				return false
			}
		},

		// HẾT CHỨC NĂNG CHỌN ITEM XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
		// XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
	});

});