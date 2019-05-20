define(function (require) {
    "use strict";
    var $                   = require('jquery'),
        _                   = require('underscore'),
        Gonrin				= require('gonrin');
    
    var template 			= require('text!app/kehoachthanhtra/tpl/model.html'),
    	schema 				= require('json!schema/KeHoachThanhTraSchema.json');
	var TinhThanhSelectView = require('app/DanhMuc/TinhThanh/view/SelectView');
    var TemplateHelper		= require('app/base/view/TemplateHelper');

    return Gonrin.ModelView.extend({
    	template : template,
    	urlPrefix: "/api/v1/",
    	modelSchema	: schema,
    	collectionName: "kehoachthanhtra",
    	tools : [
    	    {
    	    	name: "defaultgr",
    	    	type: "group",
    	    	groupClass: "toolbar-group",
    	    	buttons: [
					{
						name: "back",
						type: "button",
						buttonClass: "btn-default btn-sm",
						label: "TRANSLATE:BACK",
						command: function(){
							var self = this;
							
							Backbone.history.history.back();
						},
						visible:function(){
							return this.getApp().currentUser.hasRole("Admin") || this.getApp().currentUser.hasRole("CoSoKCB");
						}
					},
					{
		    	    	name: "delete",
		    	    	type: "button",
		    	    	buttonClass: "btn-danger btn-sm",
		    	    	label: "TRANSLATE:DELETE",
		    	    	visible: function(){
		    	    		
		    	    		return this.getApp().currentUser.hasRole("Admin");
		    	    	},
		    	    	command: function(){
		    	    		var self = this;
		                    self.model.destroy({
		                        success: function(model, response) {
		                        	self.getApp().notify('Xoá dữ liệu thành công');
		                            self.getApp().getRouter().navigate(self.collectionName + "/collection");
		                        },
		                        error: function (model, xhr, options) {
		                            self.getApp().notify('Xoá dữ liệu không thành công!');
		                            
		                        }
		                    });
		    	    	}
		    	    },
    	    	],
    	    }],
    	uiControl:{
    		fields:[
    			{
					field:"ngaysoanthao",
					textFormat:"DD/MM/YYYY",
					extraFormats:["DDMMYYYY"]
				},
				{
					field:"ngaypheduyet",
					textFormat:"DD/MM/YYYY",
					extraFormats:["DDMMYYYY"]
				},
				{
					field:"ngaythanhtra",
					textFormat:"DD/MM/YYYY",
					extraFormats:["DDMMYYYY"]
				},
    			{
					field:"trangthai",
					label:"Trạng thái",
   					uicontrol:"combobox",
   					textField: "text",
                    valueField: "value",
                    cssClass:"form-control",
   					dataSource: [
   						{ value: "new", text: "Tạo mới" },
                        { value: "send_review_truongphong", text: "Chờ cấp phòng duyệt" },
                        { value: "cancel_reviewed_truongphong", text: "Phòng từ chối" },
                        { value: "send_review_pct", text: "Chờ PCT duyệt" },
                        { value: "cancel_reviewed_pct", text: "PCT từ chối" },
                        { value: "send_approved", text: "Chờ CT duyệt" },
                        { value: "cancel_approved", text: "CT từ chối" },
                        { value: "approved", text: "CT đã duyệt quyết định" },
                        { value: "checked", text: "Đã kiểm tra" },
                        { value: "result_checked", text: "Đã có kết luận" },
                        { value: "completed", text: "Hoàn thành" }
                    ],
   				},
        	]
    	},
    	render:function(){
    		var self = this;
    		self.getDoanhNghiep();
    		self.bindEventSelect();
			self.updateUIPermission();
    		
    		
    		var id = this.getApp().getRouter().getParam("id");
    		if(id){
    			this.model.set('id',id);
        		this.model.fetch({
        			success: function(data){
        				self.$el.find("#form-content").find("input").prop("disabled", true );
        				self.$el.find("#trangthai").removeClass("hidden");
        				var danhsachfile = self.model.get("tailieulienquan");
        				if (danhsachfile === null){
        					danhsachfile =[];
        				}
        				self.$el.find(".list_file").html("");
        				if(danhsachfile.length>0){
        					
        					self.$el.find(".highlight").removeClass('d-none');
        				}
        				for(var i=0; i< danhsachfile.length; i++){
        					self.render_list_file(danhsachfile[i], self);
        				}
        				self.applyBindings();
    	    			self.$el.find("#multiselect_donvidoanhnghiep").selectpicker('val',self.model.get("madoanhnghiep"));
    	    			self.updateUITimeline(self.model.toJSON());
    	    			self.updateUIPermission();
        			},
        			error: function (xhr, status, error) {
						try {
							if (($.parseJSON(error.xhr.responseText).error_code) === "SESSION_EXPIRED"){
								self.getApp().notify("Hết phiên làm việc, vui lòng đăng nhập lại!");
								self.getApp().getRouter().navigate("login");
							} else {
								self.getApp().notify({ message: $.parseJSON(error.xhr.responseText).error_message }, { type: "danger", delay: 1000 });
							}
						}
						catch (err) {
						  self.getApp().notify({ message: "Không tìm thấy dữ liệu"}, { type: "danger", delay: 1000 });
						}
					},
        		});
    		}else{
    			self.model.set("trangthai","new");
    			self.$el.find("#trangthai").hide();
    			self.$el.find("#timeline").hide();
    			self.$el.find("#btn_review").hide();
    			self.$el.find("#btn_approve").hide();
    			self.$el.find("#btn_cancel").hide();
    			self.applyBindings();
    		}
    		
    	},
    	updateUIPermission: function(){
    		var self = this;
    		var currentUser = self.getApp().currentUser;
    		var trangthai = self.model.get("trangthai");
    		
    		if (currentUser.hasRole('ChuyenVien')){
    			self.$el.find('.card-header').show();
    			if(trangthai !==null && 
    					(trangthai ==="new" ||
        				trangthai ==="cancel_reviewed_truongphong"))){
    				self.$el.find("#btn_save").show();
    			}else{
    				self.$el.find("#btn_save").hide();
    			}
    			self.$el.find("#btn_review").show();
    			self.$el.find("#btn_approve").hide();
    			self.$el.find("#btn_cancel").hide();
    		}else if (currentUser.hasRole('TruongPhong')){
    			self.$el.find('.card-header').hide();
    			self.$el.find("#btn_approve").hide();
    			self.$el.find("#btn_review").show();
    			self.$el.find("#btn_cancel").show();
    			if(trangthai !==null && trangthai ==="cancel_reviewed_pct"){
    				self.$el.find("#btn_save").show();
    			}else{
    				self.$el.find("#btn_save").hide();
    			}
    			
    		}else if (currentUser.hasRole('CucPho')){
    			self.$el.find('.card-header').hide();
    			self.$el.find("#btn_approve").hide();
    			self.$el.find("#btn_review").show();
    			self.$el.find("#btn_cancel").show();
    			if(trangthai !==null && trangthai ==="cancel_approved"){
    				self.$el.find("#btn_save").show();
    			}else{
    				self.$el.find("#btn_save").hide();
    			}
    			
    		}else if (currentUser.hasRole('CucTruong')){
    			self.$el.find('.card-header').hide();
    			self.$el.find("#btn_approve").show();
    			self.$el.find("#btn_review").hide();
    			self.$el.find("#btn_cancel").show();
    			
    		}
    		
    		if(trangthai !==null){
    			if(trangthai ==="result_checked" ||
        				trangthai ==="checked" ||
        				trangthai ==="approved"){
        			self.$el.find("#btn_approve").hide();
        			self.$el.find("#btn_review").hide();
        			self.$el.find("#btn_cancel").hide();
        			
        		}else if(trangthai ==="completed"){
        			self.$el.find("#btn_save").hide();
        			self.$el.find("#btn_approve").hide();
        			self.$el.find("#btn_review").hide();
        			self.$el.find("#btn_cancel").hide();
        			
        		}
    		}
    				
    	},
    	getDoanhNghiep: function(){
    		var self = this;
    		$.ajax({
    			url: self.getApp().serviceURL + "/api/v1/danhmucdoanhnghiep",
    			method: "GET",
        		data: {"q": JSON.stringify({"order_by":[{"field": "name", "direction": "desc"}], "page":1,"results_per_page":10000})},
    			contentType: "application/json",
    			success: function (data) {
    				self.$el.find("#multiselect_donvidoanhnghiep").html("");
    				for(var i=0; i< data.objects.length; i++){
    					var item = data.objects[i];
    					var data_str = encodeURIComponent(JSON.stringify(item));
    					var option_elm = $('<option>').attr({'value':item.id,'data-ck':data_str}).html(item.name)
    					self.$el.find("#multiselect_donvidoanhnghiep").append(option_elm);
    				}
    				var madoanhnghiep = self.model.get("madoanhnghiep");
    				self.$el.find("#multiselect_donvidoanhnghiep").selectpicker('val',madoanhnghiep);

    				
    			},
    			error: function (xhr, status, error) {
    				try {
    					if (($.parseJSON(error.xhr.responseText).error_code) === "SESSION_EXPIRED"){
    						self.getApp().notify("Hết phiên làm việc, vui lòng đăng nhập lại!");
    						self.getApp().getRouter().navigate("login");
    					} else {
    					    self.getApp().notify({ message: $.parseJSON(error.xhr.responseText).error_message }, { type: "danger", delay: 1000 });
    					}
    				}catch (err) {
    				    self.getApp().notify({ message: "Lỗi không lấy được dữ liệu"}, { type: "danger", delay: 1000 });
    				}
    			}
    		});
    	},
    	bindEventSelect: function(){
    		var self = this;
    		self.$el.find('#multiselect_donvidoanhnghiep').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
    			var data_ck = self.$el.find('#multiselect_donvidoanhnghiep option:selected').attr('data-ck');
    			if(data_ck!== undefined && data_ck !== null){
    				var my_object = JSON.parse(decodeURIComponent(data_ck));
    				if (my_object !== null){
    					self.model.set("doanhnghiep",my_object);
    					self.model.set("madoanhnghiep",my_object.id);
    					self.model.set("tendoanhnghiep",my_object.name);
    				}
    			}
    			
    		});
    		
    		self.$el.find("#btn_save").unbind("click").bind("click", function(){
				self.model.save(null, {
					success: function (model, response, options) {
						self.updateUITimeline(self.model.toJSON());
						self.getApp().notify("Lưu thông tin thành công");
					},
					error: function (xhr, status, error) {
						try {
							if (($.parseJSON(error.xhr.responseText).error_code) === "SESSION_EXPIRED"){
								self.getApp().notify("Hết phiên làm việc, vui lòng đăng nhập lại!");
								self.getApp().getRouter().navigate("login");
							} else {
							  self.getApp().notify({ message: $.parseJSON(error.xhr.responseText).error_message }, { type: "danger", delay: 1000 });
							}
						}
						catch (err) {
						  self.getApp().notify({ message: "Lưu thông tin không thành công"}, { type: "danger", delay: 1000 });
						}
					}
				});
    			
    		});
    		self.$el.find("#btn_review").unbind("click").bind("click", function(){
    			self.confirm_kehoach();
    		});
    		self.$el.find("#btn_approve").unbind("click").bind("click", function(){
    			self.confirm_kehoach();
    		});
    		self.$el.find("#btn_cancel").unbind("click").bind("click", function(){
    			self.cancel_kehoach();
    		});
    		self.$el.find("#upload_files").on("change",function(){
    			var http = new XMLHttpRequest();
                var fd       = new FormData();
           
                fd.append('file', self.$el.find("#upload_files")[0].files[0]);
                http.open('POST', '/api/v1/upload/file');
                http.upload.addEventListener('progress', function(evt){
                  if(evt.lengthComputable){
                    var percent = evt.loaded/evt.total;
                    percent = parseInt(percent*100);
                    console.log(percent);
//                    progess.attr('value',percent);
//                    if(percent == 100)
//                    {
//                        plink.html("Upload 100%");
//                    }
                  }
                },false);
                http.addEventListener('error',function(){
                    console.log("Upload error!");
                },false);

                http.onreadystatechange = function () {
                    if (http.status === 200){
                        if( http.readyState === 4) {
	                       var data_file = JSON.parse(http.responseText), link, p, t;
	                        self.getApp().notify("Tải file thành công");
	                        console.log("response update===",data_file);
	                        var tailieu = self.model.get("tailieulienquan");
	                        if(tailieu === null){
	                        	tailieu = [];
	                        }
	                        tailieu.push(data_file);
	        				self.$el.find(".highlight").removeClass('d-none');
	                        self.model.set("tailieulienquan",tailieu);
	                        self.render_list_file(data_file, self);
//	                        plink.html('');
//	                        plink.html(link);
//	                        status.show();
//	                        progess.hide();
//	                        totalupload=totalupload+1;
//	                        txt_uploaded.val(totalupload+" file uploaded");
	
	                    }
                    } else {
                    	self.getApp().notify("Không thể tải tệp tin lên máy chủ");
//                            status.addClass('glyphicon glyphicon-exclamation-sign');
//                            status.show();
//                            plink.html("Upload Error!");
//                            progess.val(50);
                        }
                };
                http.send(fd);
			});
    	},
    	render_list_file: function(data_file, self){
    		var li_el = $('<li>').attr({"id":data_file.id}).html(data_file.filename_organization + data_file.extname);
            self.$el.find(".list_file").append(li_el);
            var span_el = $('<span>').attr({"class":"close"}).html("X");
            li_el.append(span_el);
            span_el.unbind('click').bind('click',{"data":data_file.id},function(e){
            	var id = e.data.data;
            	var tailieulienquan = self.model.get("tailieulienquan");
                if(tailieulienquan === null){
                	tailieulienquan = [];
                }
                for(var i=0; i< tailieulienquan.length; i++){
                	if(tailieulienquan[i].id === id){
                		tailieulienquan.splice(i, 1); 
                		break;
                	}
                }
                self.$el.find("#"+id).hide();
                self.model.set("tailieulienquan",tailieulienquan);
            });
    	},
    	confirm_kehoach: function(type){
    		var self = this;
    		var id = self.model.get("id");
    		$.ajax({
    			url: self.getApp().serviceURL + "/api/v1/kehoachthanhtra/confirm",
    			method: "POST",
    			data:JSON.stringify({"id":id}),
    			contentType: "application/json",
    			success: function (data) {
    				if (data !== null){
    					self.model.set(data);
    					self.updateUITimeline(data);
    					self.getApp().notify("Xác nhận thành công!");
    					return;
    				}
    			},
    			error: function (xhr, status, error) {
    				try {
    					if (($.parseJSON(error.xhr.responseText).error_code) === "SESSION_EXPIRED"){
    						self.getApp().notify("Hết phiên làm việc, vui lòng đăng nhập lại!");
    						self.getApp().getRouter().navigate("login");
    					} else {
    					    self.getApp().notify({ message: $.parseJSON(error.xhr.responseText).error_message }, { type: "danger", delay: 1000 });
    					}
    				}catch (err) {
    				    self.getApp().notify({ message: "Lỗi không lấy được dữ liệu"}, { type: "danger", delay: 1000 });
    				}
    			}
    		});
    	},
    	cancel_kehoach: function(id, element,lydo){
    		var self = this;
    		
    			    $.ajax({
    					url: self.getApp().serviceURL + "/api/v1/kehoachthanhtra/cancel",
    					method: "POST",
    					data:JSON.stringify({"id":id,"lydo":lydo}),
    					contentType: "application/json",
    					success: function (data) {
    						if (data !== null){
    							self.model.set(data);
    							self.updateUITimeline(data);
    							self.getApp().notify("Từ chối xét duyệt thành công!");
    							return;
    						}
    					},
    					error: function (xhr, status, error) {
    						try {
    							if (($.parseJSON(error.xhr.responseText).error_code) === "SESSION_EXPIRED"){
    								self.getApp().notify("Hết phiên làm việc, vui lòng đăng nhập lại!");
    								self.getApp().getRouter().navigate("login");
    							} else {
    							    self.getApp().notify({ message: $.parseJSON(error.xhr.responseText).error_message }, { type: "danger", delay: 1000 });
    							}
    						}catch (err) {
    						    self.getApp().notify({ message: "Có lỗi xảy ra, vui lòng thử lại sau"}, { type: "danger", delay: 1000 });
    						}
    					}
    				});
    			  
    		
    	},
    	updateUITimeline:function(data){
    		var self = this;
    		var el_status_new = self.$el.find("#timeline .kehoach_new");
			el_status_new.addClass("complete");
			el_status_new.find('.author').html(data.username_nguoisoanthao || "&nbsp;");
			var template_helper = new TemplateHelper();
			var ngaysoanthao = template_helper.datetimeFormat(data.ngaysoanthao, "DD/MM/YYYY");
			el_status_new.find('.date').html(ngaysoanthao || "&nbsp;");
			var arr_timeline_capphong = ["send_review_pct","cancel_reviewed_pct","send_approved","approved","cancel_approved","checked"]
			if(data.trangthai != "new" && data.trangthai != "send_review_truongphong" && 
					data.trangthai != "cancel_reviewed_truongphong"){
				console.log("timeline truong phong");
				var el_status_capphong = self.$el.find("#timeline .kehoach_send_review_capphong");
				el_status_capphong.addClass("complete");
				el_status_capphong.find('.author').html(data.username_phongduyet || "&nbsp;");
				var template_helper = new TemplateHelper();
				var ngaypheduyet_phong = template_helper.datetimeFormat(data.ngaypheduyet_phong, "DD/MM/YYYY");
				el_status_capphong.find('.date').html(ngaypheduyet_phong || "&nbsp;");
			}
			var arr_timeline_cucpho = ["completed","result_checked","checked","cancel_approved","approved","send_approved"]
			if(arr_timeline_cucpho.indexOf(data.trangthai)>=0){
				var el_status_cucpho = self.$el.find("#timeline .kehoach_send_review_pct");
				el_status_cucpho.addClass("complete");
				el_status_cucpho.find('.author').html(data.username_pctduyet || "&nbsp;");
				var template_helper = new TemplateHelper();
				var ngaypheduyet_cucpho = template_helper.datetimeFormat(data.ngaypheduyet_pct, "DD/MM/YYYY");
				ngaypheduyet_cucpho.find('.date').html(ngaypheduyet_cucpho || "&nbsp;");
				self.$el.find(".ngayketthuc").removeClass("d-none");
			}
			var arr_timeline_cuctruong = ["completed","result_checked","checked","approved"]
			if(arr_timeline_cuctruong.indexOf(data.trangthai)>=0){
				var el_status_cuctruong = self.$el.find("#timeline .kechoach_approved");
				el_status_cuctruong.addClass("complete");
				el_status_cuctruong.find('.author').html(data.username_quyetdinh  || "&nbsp;");
				var template_helper = new TemplateHelper();
				var ngaypheduyet_quyetdinh = template_helper.datetimeFormat(data.ngaypheduyet_quyetdinh, "DD/MM/YYYY");
				el_status_cuctruong.find('.date').html(ngaypheduyet_quyetdinh || "&nbsp;");
				self.$el.find(".ngayketthuc").removeClass("d-none");
			}
			var arr_timeline_checked = ["completed","result_checked","checked"]
			if(arr_timeline_checked.indexOf(data.trangthai)>=0){
				var el_status_checked = self.$el.find("#timeline .kechoach_checked");
				el_status_checked.addClass("complete");
				el_status_checked.find('.author').html('&nbsp;');
				var template_helper = new TemplateHelper();
				var ngaythanhtra = template_helper.datetimeFormat(data.ngaythanhtra, "DD/MM/YYYY");
				el_status_checked.find('.date').html(ngaythanhtra  || "&nbsp;");
				self.$el.find(".ngayketthuc").removeClass("d-none");
			}
			var arr_timeline_completed = ["completed","result_checked"]
			if(arr_timeline_completed.indexOf(data.trangthai)>=0){
				var el_status_completed = self.$el.find("#timeline .kechoach_completed");
				el_status_completed.addClass("complete");
				el_status_completed.find('.author').html('&nbsp;');
				var template_helper = new TemplateHelper();
				var ngayketthuc = template_helper.datetimeFormat(data.ngayketthuc, "DD/MM/YYYY");
				el_status_completed.find('.date').html(ngayketthuc  || "&nbsp;");
				self.$el.find(".ngayketthuc").removeClass("d-none");
			}	
    	},
    	validatePhone: function(inputPhone) {
			if (inputPhone == null || inputPhone == undefined) {
				return false;
			}
			var phoneno = /^0([1-9]{1})([0-9]{8})$/;
            const result = inputPhone.match(phoneno);
            if (result!==null && result.indexOf(inputPhone)>=0) {
                return true;
            } else {
                return false;
            }
        }
    });

});