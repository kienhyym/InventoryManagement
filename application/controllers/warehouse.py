from gatco.response import json,text, html
from application.extensions import sqlapimanager
from application.extensions import auth
from application.database import db
from application.server import app
from sqlalchemy import or_, and_, func
from datetime import datetime
import time
import requests
import json as json_load
from application.models.warehouse import Warehouse, ItemBalances
from gatco_restapi.helpers import to_dict
from application.common.constants import ERROR_CODE, ERROR_MSG, STATUS_CODE
from application.controllers.notify import send_notify_single
# from application.common.helper import current_user, auth_func
from application.common.helper import pre_post_set_user_tenant_id, pre_get_many_user_tenant_id, get_tennat_id, current_user, auth_func
from application.models.goodsreciept import GoodsReciept, GoodsRecieptDetails
from application.models.purchaseorder import *

@app.route("/api/v1/get_item_in_warehouse", methods=["POST"])
def get_item_in_warehouse(request):
    data = request.json
    dataWarehouse = db.session.query(GoodsRecieptDetails.item_id,GoodsRecieptDetails.item_name,GoodsRecieptDetails.purchase_cost, func.sum(GoodsRecieptDetails.quantity)).group_by(GoodsRecieptDetails.item_id,GoodsRecieptDetails.item_name,GoodsRecieptDetails.purchase_cost).filter(and_(GoodsRecieptDetails.warehouse_id ==data['id'], GoodsRecieptDetails.tenant_id==data['tenant'],GoodsRecieptDetails.payment_status=='paid')).all()
    arr = []
    for i in dataWarehouse:
        obj = {}
        obj['item_id'] = i[0].urn[9:]
        obj['item_name'] = i[1]
        obj['purchase_cost'] = i[2]
        obj['quantity'] = i[3]
        arr.append(obj)
    return json(arr)
        
@app.route("/api/v1/warehouse/add-item", methods=["POST"])
async def add_item_in_warehouse(request):
    data = request.json
    warehouse_id = data["warehouse_id"]

    if data is None:
        return json({
            "error_code": ERROR_CODE['INPUT_DATA_ERROR'],
            "error_message": ERROR_MSG['INPUT_DATA_ERROR']
        }, status=STATUS_CODE['ERROR'])

    for _ in data["items"]:

        itembalances = db.session.query(ItemBalances).filter(and_(ItemBalances.warehouse_id == warehouse_id, ItemBalances.item_no == _["item_no"])).first()
        if itembalances is None:

            new_item = ItemBalances()
            new_item.id = _.get("id")
            new_item.warehouse_id = warehouse_id
            new_item.item_exid = _.get("item_exid", None)
            new_item.item_name = _.get("item_name", None)
            new_item.item_no = _.get("item_no", None)
            new_item.purchase_cost = _.get("purchase_cost", 0)
            new_item.list_price = _.get("list_price", 0)
            new_item.quantity = _.get("quantity", 0)
            new_item.lot_number = _.get("lot_number", None)
            new_item.unit_code = _.get("unit_code", None)
            new_item.unit_id = _.get("unit_id", None)
            new_item.item_image = _.get("item_image", None)

            db.session.add(new_item)
            db.session.commit()

        else:

            itembalances.quantity += _["quantity"] if 'quantity' in _ and _["quantity"] is not None else 0
            db.session.commit()

    return json({
        "ok": True,
        "message": "success"
    })
    return json({"success"})

@app.route("/api/v1/warehouse/add-delivery", methods=["POST"])
def add_item_in_warehouse(request):
    data = request.json
    warehouse_id = data["warehouse_id"]

    if data is None:
        return json({
            "error_code": ERROR_CODE['INPUT_DATA_ERROR'],
            "error_message": ERROR_MSG['INPUT_DATA_ERROR']
        }, status=STATUS_CODE['ERROR'])

    quantity_reduction = []

    for _ in data["items"]:
        itembalances = db.session.query(ItemBalances).filter(and_(ItemBalances.warehouse_id == warehouse_id, ItemBalances.item_no == _["item_no"])).first()
        if itembalances is None:
            return json({"error_code":"ERROR_CODE","error_message":"Hàng hóa không có trong kho"}, status=520)
        # if itembalances.quantity < _["quantity"]:
        #     return json({"error_code":"ERROR_CODE","error_message":"Số lượng trong kho không đủ"}, status=520)
        if itembalances.quantity >= _['quantity']:
            itembalances.quantity -= _["quantity"] if 'quantity' in _ and _["quantity"] is not None else 0
            # print("===============================", _)
            del _['item_image']
            quantity_reduction.append(_)
            db.session.commit()

            print("========================================", quantity_reduction)
            return json({
                "ok": True,
                "message": "Hàng hóa: " + str(_['item_name']) + " " + " Đã giảm SL: " + str(_['quantity'])
            })

@app.route('/api/v1/item/get/by-warehouse-id', methods=["POST"])
def get_all_warehouse(request):
    data = request.json
    itembalances = db.session.query(ItemBalances).filter(ItemBalances.warehouse_id == data["warehouse_id"]).all()

    result = []
    if itembalances is not None:
        for item in itembalances:
            list_item = to_dict(item)

            result.append(list_item)
    # print("result", result)
    return json(result)


@app.route('/api/v1/warehouse/get-by-tenant', methods=["POST"])
async def get_all_warehouse_by_tenant(request):
    uid = await current_user(request)
    data = request.json
    tenant_id = data["tenant_id"]

    # tenant_id = await get_tennat_id(request)
    warehouse = db.session.query(Warehouse).filter(Warehouse.tenant_id==tenant_id).all()
    result = []
    if warehouse is not None:
        for w in warehouse:
            list_ware = to_dict(w)

            result.append(list_ware)
    return json({
        "ok": True,
        "message": "success",
        "objects": result
    })


@app.route('/api/v1/get_all_warehouse_by_tenant', methods=["POST"])
async def get_all_warehouse_by_tenant(request):
    data = request.json
    tenant_id = data['tenant_id']
    warehouse = db.session.query(Warehouse).filter(Warehouse.tenant_id==tenant_id).all()
    result = []
    if warehouse is not None:
        for w in warehouse:
            list_ware = to_dict(w)
            result.append(list_ware)
    return json(result)

@app.route('/api/v1/warehouse/get-full', methods=["GET"])
async def get_all_warehouse(request):
    uid = await current_user(request)
    tenant_id = await get_tennat_id(request)
    warehouse = db.session.query(Warehouse).all()
    result = []
    if warehouse is not None:
        for w in warehouse:
            list_ware = to_dict(w)

            result.append(list_ware)
    return json(result)


@app.route("/api/v1/item/get-in-warehouse", methods=["POST"])
async def get_all_item_in_warehouse(request):
    data = request.json
    # uid = await current_user(request)
    tenant_id = await get_tennat_id(request)
    warehouse_id = data["warehouse_id"]
    warehouse = db.session.query(Warehouse).filter(and_(Warehouse.id==warehouse_id, Warehouse.tenant_id==tenant_id)).first()
    if warehouse is None:
        return json({
            "ok": False,
            "message": "warehouse is none"
        })
    else:
        list_goods_reciept = []
        list_item = []
        goods_reciept = db.session.query(GoodsReciept).filter(GoodsReciept.warehouse_id==warehouse.id).all()
        if goods_reciept is None:
            return json({
            "ok": False,
            "message": "goods_reciept is none"
        })
        else:

            for _ in goods_reciept:
                list_ = to_dict(_)
                list_goods_reciept.append(list_)
            for _ in list_goods_reciept:
                details = db.session.query(GoodsRecieptDetails).filter(GoodsRecieptDetails.goodsreciept_id==_["id"]).all()

                if details is not None:
                    for __ in details:
                        list_ = to_dict(__)
                        list_item.append(list_)

            return json({
                "ok": True,
                "message": "success",
                "object_data": list_item
            })

@app.route("/api/v1/warehouse/check-quantity-empty", methods=["POST"])
def check_quantity_quantity_empty(request):
    data = request.json
    if data is None:
        return json({
            "error_code": ERROR_CODE['INPUT_DATA_ERROR'],
            "error_message": ERROR_MSG['INPUT_DATA_ERROR']
        }, status=STATUS_CODE['ERROR'])

    warehouse_id = data["warehouse_id"]
    # item_id = data["item_id"]
    warehouse_info = db.session.query(ItemBalances).filter(ItemBalances.warehouse_id==warehouse_id).all()
    if warehouse_info is not None:
        result = []
        for _ in warehouse_info:
            list_item = to_dict(_)
            result.append(list_item)

        return json({
            "ok": True,
            "message": "success",
            "object_items": result
        })



@app.route("/api/v1/warehouse/async/account", methods=["POST"])
async def sync_warehouse(request):
    data = request.json

    print("===============METHODS==============", data["method"])
    print("===============ID==============", data["id"])
    print("===============URL==============", data["url"])
    print("===============OBJECT==============", data["object"])

    if data is None:
        return json({
            "error_code": ERROR_CODE['INPUT_DATA_ERROR'],
            "error_message": ERROR_MSG['INPUT_DATA_ERROR']
        }, status=STATUS_CODE['ERROR'])

    if 'url' in data and data['url'] is not None:
        headers = {
            'content-type': 'application/json'
        }
        # params = {
        #     "object": "item",
        #     "id": "",
        #     "method": "update",
        #     "at": 112988882,
        #     "uri": "https://upstart.vn/accounts/item/1234318ue8ưe"
        # }
        response = requests.get(data['url'], headers=headers)
        if response.status_code == 200:
            items = response.json()
            print("items-----------------", items)


            if data['method'] == "CREATE" and data["object"] == "item":
                item = db.session.query(Item).filter(and_(Item.id == items["id"], Item.item_no == items["item_no"], Item.tenant_id == items["tenant_id"])).first()
                if item is None:
                    print("CREATE ITEM ---------------> ")
                    new_item = Item()

                    new_item.unit_id = items.get("unit_id", None)
                    new_item.item_exid = None

                    new_item.categories = items.get("categories", None)
                    new_item.unit = items.get("unit", None)

                    new_item.status = items.get("status", None)
                    new_item.tenant_id = items.get("tenant_id", None)

                    new_item.position = items.get("position", None)
                    new_item.image = items.get("image", None)

                    new_item.description = items.get("description", None)
                    new_item.deleted_by = items.get("deleted_by", None)

                    new_item.created_by = items.get("created_by", None)
                    new_item.parent_id = items.get("parent_id", None)

                    new_item.item_name = items.get("item_name", None)
                    new_item.item_type = items.get("item_type", None)

                    new_item.item_no = items.get("item_no", None)
                    new_item.unit_code = items.get("unit_code", None)

                    new_item.id = items.get("id", None)
                    new_item.created_at = items.get("created_at", None)

                    new_item.purchase_cost = items.get("purchase_cost", None)
                    new_item.list_price = items.get("list_price", None)

                    db.session.add(new_item)
                    db.session.commit()

                    return json({
                        "ok": True,
                        "message": "CREATE ITEM SUCCESS"
                    })

            if data['method'] == "UPDATE" and data["object"] == "item":
                item = db.session.query(Item).filter(and_(Item.id == items["id"], Item.tenant_id == items["tenant_id"])).first()
                if item is not None:
                    print("UPDATE ITEM ---------------> ")
                    item.unit_id = items.get("unit_id", None)
                    item.item_exid = None

                    item.categories = items.get("categories", None)
                    item.unit = items.get("unit", None)

                    item.status = items.get("status", None)
                    item.tenant_id = items.get("tenant_id", None)

                    item.position = items.get("position", None)
                    item.image = items.get("image", None)

                    item.description = items.get("description", None)
                    item.parent_id = items.get("parent_id", None)

                    item.item_name = items.get("item_name", None)
                    item.item_type = items.get("item_type", None)

                    item.item_no = items.get("item_no", None)
                    item.unit_code = items.get("unit_code", None)

                    item.purchase_cost = items.get("purchase_cost", None)
                    item.list_price = items.get("list_price", None)
                    db.session.commit()

                    return json({
                        "ok": True,
                        "message": "UPDATE ITEM SUCCESS"
                    })

            return json({})

        else:
            return json({
                "error_code": response.status_code,
                "error_message": "Sync Error!"
            }, status=520)

    return json(None)


sqlapimanager.create_api(Warehouse,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    preprocess=dict(GET_SINGLE=[auth_func],
    GET_MANY=[auth_func],
    POST=[auth_func],
    PUT_SINGLE=[auth_func],
    DELETE_SINGLE=[auth_func]),
    collection_name='warehouse')


sqlapimanager.create_api(ItemBalances,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    preprocess=dict(GET_SINGLE=[auth_func], GET_MANY=[auth_func], POST=[auth_func], PUT_SINGLE=[auth_func], DELETE_SINGLE=[auth_func]),
    collection_name='itembalances')
