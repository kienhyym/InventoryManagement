from gatco.response import json,text, html
from application.extensions import sqlapimanager
from application.extensions import auth
from application.database import db
from application.server import app
from sqlalchemy import or_, and_
from datetime import datetime
import time
from gatco_restapi.helpers import to_dict
from application.models.inventory.warehouse import *
from application.models.inventory.goodsreciept import *
from application.models.inventory.consumablesupplies import *


from application.common.constants import ERROR_CODE, ERROR_MSG, STATUS_CODE
# from application.common.helper import auth_func
from application.common.helper import pre_post_set_user_tenant_id, pre_get_many_user_tenant_id, get_tennat_id, current_user, auth_func




# @app.route("/api/v1/create_goods_reciept_details_item", methods=["POST"])
# def create_goods_reciept_details_item(request):
#     data = request.json
#     if data is not None:
#         data_goodsRecieptDetails = data['data']
#         for _ in data_goodsRecieptDetails:
#             goodsRecieptDetails = GoodsRecieptDetails()
#             goodsRecieptDetails.goodsreciept_id = data['goodreciept_id']
#             goodsRecieptDetails.item_id = _['item_id']
#             goodsRecieptDetails.item_name = _['item_name']
#             goodsRecieptDetails.quantity = _['quantity']
#             goodsRecieptDetails.purchase_cost = _['purchase_cost']
#             goodsRecieptDetails.list_price = _['list_price']
#             goodsRecieptDetails.net_amount = _['net_amount']
#             goodsRecieptDetails.tenant_id = _['tenant_id']
#             goodsRecieptDetails.warehouse_id = _['warehouse_id']
#             db.session.add(goodsRecieptDetails)
#             db.session.commit()
#     return json({"message": "Create Success"})

# @app.route('/api/v1/update_goods_reciept_details_item', methods=["POST"])
# async def update_goods_reciept_details_item(request):
#     data_goodsRecieptDetails = request.json
#     for _ in data_goodsRecieptDetails:
#         goodsRecieptDetails = db.session.query(GoodsRecieptDetails).filter(GoodsRecieptDetails.id == _['item_id']).first()
#         goodsRecieptDetails.quantity = _['quantity']
#         goodsRecieptDetails.purchase_cost = _['purchase_cost']
#         goodsRecieptDetails.net_amount = _['net_amount']
#         goodsRecieptDetails.tenant_id = _['tenant_id']
#         goodsRecieptDetails.warehouse_id = _['warehouse_id']
#         db.session.commit()
#     return json({"message": "Update Success"})
# @app.route('/api/v1/update_goods_reciept_details_item_bill', methods=["POST"])
# async def update_goods_reciept_details_item_bill(request):
#     data_goodsRecieptDetails = request.json
#     for _ in data_goodsRecieptDetails:
#         goodsRecieptDetails = db.session.query(GoodsRecieptDetails).filter(GoodsRecieptDetails.id == _['id']).first()
#         goodsRecieptDetails.payment_status = 'paid'
#         db.session.commit()
#     return json({"message": "Update Success"})

# @app.route('/api/v1/delete_goods_reciept_details_item', methods=["POST"])
# async def delete_goods_reciept_details_item(request):
#     list_id = request.json
#     for _ in list_id:
#         goodsRecieptDetails = db.session.query(GoodsRecieptDetails).filter(GoodsRecieptDetails.id == _).first()
#         db.session.delete(goodsRecieptDetails)
#         db.session.commit()
#     return json({"message": "Delete Success"})


# @app.route("/api/v1/length_data", methods=["POST"])
# def length_data(request):
#     data = request.json
#     if data is not None:
#         length = db.session.query(Item).count()
#         return json(length/12)



@app.route('/api/v1/load_item_dropdown',methods=['POST'])
async def load_item_dropdown(request):
    req = request.json
    if req['text'] is not None and req['text'] != "":
        keySearch = req['text']
        tenant_id = req['tenant_id']
        print ('________________________',keySearch)
        search = "%{}%".format(keySearch)
        tex_capitalize = keySearch.capitalize()
        search_capitalize = "%{}%".format(tex_capitalize)
        list = db.session.query(Item).filter(or_(and_(Item.item_name.like(search),Item.tenant_id == tenant_id),and_(Item.item_name.like(search_capitalize),Item.tenant_id == tenant_id)))
        arr = []
        for i in list:
            obj = to_dict(i)
            arr.append(obj)
        return json(arr)
    else:
        result = []
        return json(result)











# @app.route("/api/v1/goods-reciept-by-goodsreciept-id", methods=["POST"])
# def goodsreciept_bywarehouse(request):
#     data = request.json
#     goodsreciept_id = data["goodsreciept_id"]
#     if data is not None:
#         result = []
#         details = db.session.query(GoodsRecieptDetails).filter(GoodsRecieptDetails.goodsreciept_id == goodsreciept_id).all()
        
#         for d in details:
#             list_d = to_dict(d)
#             result.append(list_d)

#         return json(result)
        

# @app.route("/api/v1/get_all_goodsreciept_details", methods=["GET"])
# def get_goodsreciept_details(request):
    
#     goodsrecieptdetails = db.session.query(GoodsRecieptDetails).all()
#     result = []
#     if goodsrecieptdetails is not None:
#         for g in goodsrecieptdetails:
#             listg = to_dict(g)
#             result.append(listg)
#         # print("result", result)
#         return json(result)


@app.route("/api/v1/get-goodsreciept", methods=["GET"])
async def get_goodsreciept(request):
    # uid = await current_user(request)
    tenant_id = await get_tennat_id(request)
    goodsreciept = db.session.query(GoodsReciept).filter(GoodsReciept.tenant_id==tenant_id).all()
    result = []
    if goodsreciept is not None:
        for g in goodsreciept:
            listg = to_dict(g)
            result.append(listg)
        # print("result", result)
        return json(result)


@app.route("/api/v1/get-goodsreciept-by-id", methods=["POST"])
async def get_goodsreciept(request):
    data = request.json
    # uid = await current_user(request)
    tenant_id = await get_tennat_id(request)

    if data is not None:
        goodsreciept = db.session.query(GoodsReciept).filter(and_(GoodsReciept.id == data["id"], GoodsReciept.tenant_id==tenant_id)).first()
        result = []
        if goodsreciept is not None:
            list_goods = to_dict(goodsreciept)
            result.append(list_goods)
            return json(result)




sqlapimanager.create_api(GoodsReciept,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    preprocess=dict(GET_SINGLE=[auth_func],
                    GET_MANY=[auth_func],
                    POST=[auth_func],
                    PUT_SINGLE=[auth_func]),
    postprocess=dict(
        POST=[],
        GET_MANY=[],
        PUT_SINGLE=[],
        DELETE_SINGLE=[]),
    collection_name='goodsreciept')

# sqlapimanager.create_api(GoodsRecieptDetails,
#     methods=['GET', 'POST', 'DELETE', 'PUT'],
#     url_prefix='/api/v1',
#     preprocess=dict(GET_SINGLE=[auth_func],
#                     GET_MANY=[auth_func],
#                     POST=[auth_func],
#                     PUT_SINGLE=[auth_func]),
#     collection_name='goodsrecieptdetails')

