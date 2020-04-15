from gatco.response import json,text, html
from application.extensions import sqlapimanager
from application.extensions import auth
from application.database import db
from application.server import app
from sqlalchemy import or_, and_, func
from datetime import datetime
# import json

import time
import requests
import json as json_load
from application.common.helper import pre_post_set_user_tenant_id, pre_get_many_user_tenant_id, get_tennat_id, current_user, auth_func
from application.common.constants import ERROR_CODE, ERROR_MSG, STATUS_CODE
from gatco_restapi.helpers import to_dict

from application.models.movewarehouse import *
from application.models.goodsreciept import *
from application.models.warehouse import *

@app.route("/api/v1/get_all_item_in_warehouse", methods=["POST"])
def get_all_item_in_warehouse(request):
    data = request.json
    dataWarehouse = db.session.query(GoodsRecieptDetails.item_id,GoodsRecieptDetails.item_name,GoodsRecieptDetails.purchase_cost, func.sum(GoodsRecieptDetails.quantity)).group_by(GoodsRecieptDetails.item_id,GoodsRecieptDetails.item_name,GoodsRecieptDetails.purchase_cost).filter(and_(GoodsRecieptDetails.tenant_id==data['tenant'],GoodsRecieptDetails.payment_status=='paid')).all()
    return json(dataWarehouse)

@app.route("/api/v1/get_all_warehouse_tennat_id", methods=["POST"])
def get_all_warehouse_tennat_id(request):
    data = request.json
    if data is not None:
        warehouse = db.session.query(Warehouse).filter(Warehouse.tenant_id == data).all()
        result = []
        if warehouse is not None:
            for g in warehouse:
                list_g = to_dict(g)
                result.append(list_g)
            return json(result)


@app.route('/api/v1/get_all_item_warehouse_tennat_id',methods=['POST'])
async def get_all_item_warehouse_tennat_id(request):
    req = request.json
    pageNumber = req['page_number']
    tenant = req['tenant']
    if req['text'] is not None:
        keySearch = req['text']
        search = "%{}%".format(keySearch)
        tex_capitalize = keySearch.capitalize()
        search_capitalize = "%{}%".format(tex_capitalize)
        list = db.session.query(Warehouse).filter(Warehouse.tenant_id == tenant).filter(or_(Item.item_name.like(search),Item.item_name.like(search_capitalize))).offset(12*pageNumber).limit(12)
        arr = []
        for i in list:
            obj = to_dict(i)
            arr.append(obj)
        return json(arr)
    else:
        # details =  db.session.query(GoodsRecieptDetails.item_id,GoodsRecieptDetails.item_name,GoodsRecieptDetails.purchase_cost, func.sum(GoodsRecieptDetails.quantity)).group_by(GoodsRecieptDetails.item_id,GoodsRecieptDetails.item_name,GoodsRecieptDetails.purchase_cost).filter(and_(GoodsRecieptDetails.tenant_id==tenant,GoodsRecieptDetails.payment_status=='paid')).offset(12*pageNumber).limit(12)
        dataWarehouse = db.session.query(GoodsRecieptDetails.item_id,GoodsRecieptDetails.item_name,GoodsRecieptDetails.purchase_cost, func.sum(GoodsRecieptDetails.quantity)).group_by(GoodsRecieptDetails.item_id,GoodsRecieptDetails.item_name,GoodsRecieptDetails.purchase_cost).filter(and_(GoodsRecieptDetails.tenant_id==tenant,GoodsRecieptDetails.payment_status=='paid')).offset(12*pageNumber).limit(12)
        arr = []
        for i in dataWarehouse:
            obj = {}
            obj['id'] = str(i[0])+'-'+str(int(i[2]))
            obj['item_id'] = i[0]
            obj['item_name'] = i[1]
            obj['purchase_cost'] = i[2]
            obj['quantity'] = i[3]
            arr.append(obj)
        return json(arr)







@app.route("/api/v1/create_moveware_house_details_item", methods=["POST"])
def create_moveware_house_details_item(request):
    data = request.json
    if data is not None:
        data_goodsRecieptDetails = data['data']
        for _ in data_goodsRecieptDetails:
            moveWarehouseDetails = MoveWarehouseDetails()
            moveWarehouseDetails.movewarehouse_id = data['movewarehouse_id']
            moveWarehouseDetails.item_id = _['item_id']
            moveWarehouseDetails.item_id_origin = _['item_id_origin']
            moveWarehouseDetails.item_name = _['item_name']
            moveWarehouseDetails.quantity = _['quantity']
            moveWarehouseDetails.purchase_cost = _['purchase_cost']
            moveWarehouseDetails.quantity_delivery = _['quantity_delivery']
            moveWarehouseDetails.tenant_id = _['tenant_id']
            moveWarehouseDetails.warehouse_from_id = _['warehouse_from_id']
            moveWarehouseDetails.warehouse_to_id = _['warehouse_to_id']
            db.session.add(moveWarehouseDetails)
            db.session.commit()
    return json({"message": "Create Success"})

@app.route('/api/v1/update_moveware_house_details_item', methods=["POST"])
async def update_moveware_house_details_item(request):
    data_goodsRecieptDetails = request.json
    for _ in data_goodsRecieptDetails:
        moveWarehouseDetails = db.session.query(MoveWarehouseDetails).filter(MoveWarehouseDetails.id == _['item_id']).first()
        moveWarehouseDetails.quantity_delivery = _['quantity_delivery']
        moveWarehouseDetails.warehouse_from_id = _['warehouse_from_id']
        moveWarehouseDetails.warehouse_to_id = _['warehouse_to_id']
        db.session.commit()
    return json({"message": "Update Success"})

@app.route('/api/v1/delete_moveware_house_details_item', methods=["POST"])
async def delete_moveware_house_details_item(request):
    list_id = request.json
    for _ in list_id:
        moveWarehouseDetails = db.session.query(MoveWarehouseDetails).filter(MoveWarehouseDetails.id == _).first()
        db.session.delete(moveWarehouseDetails)
        db.session.commit()
    return json({"message": "Delete Success"})










































@app.route("/api/v1/get-goodsreciept-details", methods=["POST"])
def get_goodsreciept_details(request):
    data = request.json
    if data is not None:
        # print("data", data)
        goodsreciept = db.session.query(GoodsRecieptDetails).filter(GoodsRecieptDetails.goodsreciept_id == data["goodsreciept_id"]).all()
        result = []
        if goodsreciept is not None:
            for g in goodsreciept:
                list_g = to_dict(g)
                result.append(list_g)

            return json(result)


@app.route("/api/v1/delivery-warehouse", methods=["POST"])
def delivery_warehouse(request):
    data = request.json
    print("------------------------", data["delivery"])
    if data is not None:
        if data["delivery"]["goodsreciept_to_id"] == data["delivery"]["goodsreciept_from_id"]:
            return json({"error_code":"SUCESS_CODE","error_message":"Kho bị trùng mời chọn lại"}, status=520)

        goodsrecieptdetails = db.session.query(GoodsRecieptDetails).filter(GoodsRecieptDetails.id == data["delivery"]["id"]).first()

        if goodsrecieptdetails is not None:
            if goodsrecieptdetails.quantity >= data["delivery"]["quantity_delivery"]:
                quantity_new = goodsrecieptdetails.quantity - data["delivery"]["quantity_delivery"]

                goodsrecieptdetails.quantity = quantity_new  

                delivery_details = db.session.query(GoodsRecieptDetails).filter(GoodsRecieptDetails.goodsreciept_id == data["delivery"]["goodsreciept_to_id"]).first()
                # print("=====================", delivery_details.item_no)
                if delivery_details is not None and delivery_details.item_no == data["delivery"]["item_no"]:

                    delivery_details.goodsreciept_id = data["delivery"]["goodsreciept_to_id"]

                    delivery_details.quantity = delivery_details.quantity + data["delivery"]["quantity_delivery"]
                    db.session.commit()

                    return json({"error_code":"SUCESS_CODE","error_message":"Chuyển sản phẩm thành công"}, status=200)
                else:
                    details = GoodsRecieptDetails(goodsreciept_id=data["delivery"]["goodsreciept_to_id"], item_name=data["delivery"]["item_name"], item_no=data["delivery"]["item_no"], quantity=data["delivery"]["quantity_delivery"],\
                        list_price=data["delivery"]["list_price"], amount=data["delivery"]["amount"], net_amount=data["delivery"]["net_amount"],\
                            lot_number=data["delivery"]["lot_number"])
                    # print("==================", details)
                    db.session.add(details)
                    db.session.commit()

                    return json({"error_code":"SUCESS_CODE","error_message":"Chuyển sản phẩm thành công"}, status=200)
                # elif delivery_details is not None and delivery_details.item_n
                db.session.commit()
            else:
                return json({"error_code":"ERROR_CODE","error_message":"Số lượng trong kho không đủ"}, status=520)

        else:
            return json({"error_code":"ERROR_CODE","error_message":"Không tìm thấy sản phẩm trong kho"}, status=520)
      

# sqlapimanager.create_api(MoveWarehouse,
#     methods=['GET', 'POST', 'DELETE', 'PUT'],
#     url_prefix='/api/v1',
#     preprocess=dict(GET_SINGLE=[auth_func],
#                     GET_MANY=[pre_get_many_user_tenant_id],
#                     POST=[pre_post_set_user_tenant_id],
#                     PUT_SINGLE=[pre_post_set_user_tenant_id]),
#     collection_name='movewarehouse')

sqlapimanager.create_api(MoveWarehouse,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    preprocess=dict(GET_SINGLE=[],
                    GET_MANY=[],
                    POST=[],
                    PUT_SINGLE=[]),
    collection_name='movewarehouse')

sqlapimanager.create_api(MoveWarehouseDetails,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    preprocess=dict(GET_SINGLE=[],
                    GET_MANY=[],
                    POST=[],
                    PUT_SINGLE=[]),
    collection_name='movewarehousedetails')