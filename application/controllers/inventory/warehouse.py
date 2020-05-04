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
from application.models.inventory.movewarehouse import *
from application.models.inventory.warehouse import Warehouse, ItemBalances
from gatco_restapi.helpers import to_dict
from application.common.constants import ERROR_CODE, ERROR_MSG, STATUS_CODE
from application.controllers.notify import send_notify_single
# from application.common.helper import current_user, auth_func
from application.common.helper import pre_post_set_user_tenant_id, pre_get_many_user_tenant_id, get_tennat_id, current_user, auth_func
from application.models.inventory.goodsreciept import *
from application.models.inventory.purchaseorder import *
from application.models.inventory.consumablesupplies import *



    
# @app.route("/api/v1/get_item_in_warehouse", methods=["POST"])
# async def get_item_in_warehouse(request):
#     data = request.json
#     dataitemBalances = db.session.query(ItemBalances.item_id,ItemBalances.item_name,ItemBalances.purchase_cost, func.sum(ItemBalances.quantity)).group_by(ItemBalances.item_id,ItemBalances.item_name,ItemBalances.purchase_cost).filter(and_(ItemBalances.warehouse_id ==data['id'], ItemBalances.tenant_id==data['tenant'])).all()
#     dataGoodsRecieptDetails = db.session.query(GoodsRecieptDetails.item_id,GoodsRecieptDetails.item_name,GoodsRecieptDetails.purchase_cost, func.sum(GoodsRecieptDetails.quantity)).group_by(GoodsRecieptDetails.item_id,GoodsRecieptDetails.item_name,GoodsRecieptDetails.purchase_cost).filter(and_(GoodsRecieptDetails.warehouse_id ==data['id'], GoodsRecieptDetails.tenant_id==data['tenant'],GoodsRecieptDetails.payment_status=='paid')).all()
#     dataPurchaseOrderDetails = db.session.query(PurchaseOrderDetails.item_id,PurchaseOrderDetails.item_name,PurchaseOrderDetails.purchase_cost, func.sum(PurchaseOrderDetails.quantity)).group_by(PurchaseOrderDetails.item_id,PurchaseOrderDetails.item_name,PurchaseOrderDetails.purchase_cost).filter(and_(PurchaseOrderDetails.warehouse_id ==data['id'], PurchaseOrderDetails.tenant_id==data['tenant'],PurchaseOrderDetails.payment_status=='paid')).all()
#     dataMoveWareHouseFrom = db.session.query(MoveWarehouseDetails.item_id_origin,MoveWarehouseDetails.purchase_cost,  func.sum(MoveWarehouseDetails.quantity_delivery),MoveWarehouseDetails.item_name).group_by(MoveWarehouseDetails.item_id_origin,MoveWarehouseDetails.item_name,MoveWarehouseDetails.purchase_cost).filter(and_(MoveWarehouseDetails.warehouse_from_id ==data['id'], MoveWarehouseDetails.tenant_id==data['tenant'])).all()
#     dataMoveWareHouseTo = db.session.query(MoveWarehouseDetails.item_id_origin,MoveWarehouseDetails.purchase_cost,  func.sum(MoveWarehouseDetails.quantity_delivery),MoveWarehouseDetails.item_name).group_by(MoveWarehouseDetails.item_id_origin,MoveWarehouseDetails.item_name,MoveWarehouseDetails.purchase_cost).filter(and_(MoveWarehouseDetails.warehouse_to_id ==data['id'], MoveWarehouseDetails.tenant_id==data['tenant'])).all()
#     arr = []
#     if(len(dataitemBalances) != 0):
#         for ib in dataitemBalances:
#             obj= {}
#             obj['item_id'] = ib[0]
#             obj['item_name'] = ib[1]
#             obj['purchase_cost'] = ib[2]
#             obj['quantity'] = ib[3]
#         arr.append(obj)
#     if(len(dataGoodsRecieptDetails) != 0):
#         for grd in dataGoodsRecieptDetails:
#             dem = 0
#             for a in arr:
#                 if grd[0] == a['item_id'] and grd[2] == a['purchase_cost']:
#                     a['quantity'] = a['quantity'] + grd[3]
#                 else:
#                     dem = dem + 1
#             if dem == len(arr): 
#                 obj= {}
#                 obj['item_id'] = grd[0]
#                 obj['item_name'] = grd[1]
#                 obj['purchase_cost'] = grd[2]
#                 obj['quantity'] = grd[3]
#                 arr.append(obj)
#     if(len(dataPurchaseOrderDetails) != 0):
#         for pod in dataPurchaseOrderDetails:
#             dem = 0
#             for a in arr:
#                 if pod[0] == a['item_id'] and pod[2] == a['purchase_cost']:
#                     a['quantity'] = a['quantity'] - pod[3]
#                 else:
#                     dem = dem + 1
#             if dem == len(arr): 
#                 obj= {}
#                 obj['item_id'] = pod[0]
#                 obj['item_name'] = pod[1]
#                 obj['purchase_cost'] = pod[2]
#                 obj['quantity'] = 0-pod[3]
#                 arr.append(obj)

#     if(len(dataMoveWareHouseFrom) != 0):
#         for mwhf in dataMoveWareHouseFrom:
#             dem = 0
#             for a in arr:
#                 if mwhf[0] == a['item_id'] and mwhf[1] == a['purchase_cost']:
#                     a['quantity'] = a['quantity'] - mwhf[2]
#                 else:
#                     dem = dem + 1
#             if dem == len(arr): 
#                 obj= {}
#                 obj['item_id'] = mwhf[0]
#                 obj['item_name'] = mwhf[3]
#                 obj['purchase_cost'] = mwhf[1]
#                 obj['quantity'] = 0-mwhf[2]
#                 arr.append(obj)


#     if(len(dataMoveWareHouseTo) != 0):
#         for mwht in dataMoveWareHouseTo:
#             dem = 0
#             for a in arr:
#                 if mwht[0] == a['item_id'] and mwht[1] == a['purchase_cost']:
#                     a['quantity'] = a['quantity'] + mwht[2]
#                 else:
#                     dem = dem + 1
#             if dem == len(arr): 
#                 obj= {}
#                 obj['item_id'] = mwht[0]
#                 obj['item_name'] = mwht[3]
#                 obj['purchase_cost'] = mwht[1]
#                 obj['quantity'] = mwht[2]
#                 arr.append(obj)

#     return json(arr)   




@app.route("/api/v1/create_init_warehouse", methods=["POST"])
def create_init_warehouse(request):
    data = request.json
    if data is not None:
        data_itemBalances = data['data']
        for _ in data_itemBalances:
            itemBalances = ItemBalances()
            itemBalances.item_id = _['item_id']
            itemBalances.item_name = _['item_name']
            itemBalances.quantity = _['quantity']
            itemBalances.purchase_cost = _['purchase_cost']
            itemBalances.net_amount = _['net_amount']
            itemBalances.tenant_id = _['tenant_id']
            itemBalances.warehouse_id = _['warehouse_id']
            db.session.add(itemBalances)
            db.session.commit()
    return json({"message": "Create Success"})


@app.route('/api/v1/update_init_warehouse', methods=["POST"])
async def update_init_warehouse(request):
    data_itemBalances = request.json
    for _ in data_itemBalances:
        itemBalances = db.session.query(ItemBalances).filter(ItemBalances.id == _['item_id']).first()
        itemBalances.quantity = _['quantity']
        itemBalances.purchase_cost = _['purchase_cost']
        itemBalances.net_amount = _['net_amount']
        itemBalances.tenant_id = _['tenant_id']
        db.session.commit()
    return json({"message": "Update Success"})



@app.route('/api/v1/delete_init_warehouse', methods=["POST"])
async def delete_init_warehouse(request):
    list_id = request.json
    for _ in list_id:
        itemBalances = db.session.query(ItemBalances).filter(ItemBalances.id == _).first()
        db.session.delete(itemBalances)
        db.session.commit()
    return json({"message": "Delete Success"})


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


@app.route("/api/v1/create_itembalances", methods=["POST"])
async def create_itembalances(request):
    data = request.json
    dataItembBalances = data['data']
    itemBalancesType = data['item_balances_type']
    for _ in dataItembBalances:
        new_item = ItemBalances()
        new_item.item_balances_type = itemBalancesType
        if itemBalancesType == "goodsreciept":
            new_item.goodsreciept_id = _["goodsreciept_id"]
        if itemBalancesType == "purchaseorder":
            new_item.purchaseorder_id = _["purchaseorder_id"]
        if itemBalancesType == "movewarehouse":
            new_item.move_warehouse_id = _["move_warehouse_id"]
        new_item.warehouse_from_id = _["warehouse_from_id"]
        new_item.warehouse_to_id = _["warehouse_to_id"]
        new_item.item_id = _["item_id"]
        new_item.item_no = _["item_no"]
        if _["unit_id"] != "null":
            new_item.unit_id = _["unit_id"]
        new_item.list_price = _["list_price"]
        new_item.item_name = _["item_name"]
        new_item.tenant_id = _["tenant_id"]
        new_item.warehouse_id = _["warehouse_id"]
        new_item.warehouse_name = _["warehouse_name"]
        new_item.quantity = _["quantity"]
        new_item.purchase_cost = _["purchase_cost"]
        new_item.net_amount = _["net_amount"]
        db.session.add(new_item)
        db.session.commit()
    return json({"message":"create success"})

@app.route('/api/v1/update_itembalances', methods=["POST"])
async def update_itembalances(request):
    data = request.json
    for _ in data['arr']:
        itemBalances = db.session.query(ItemBalances).filter(ItemBalances.id == _['id']).first()
        itemBalances.quantity = _['quantity']
        if data['item_balances_type'] == "goodsreciept":
            itemBalances.purchase_cost = _['purchase_cost']
        if data['item_balances_type'] == "purchaseorder":
            itemBalances.list_price = _['list_price']
        if data['item_balances_type'] == "movewarehouse":
            itemBalances.warehouse_from_id = _["warehouse_from_id"]
            itemBalances.warehouse_to_id = _["warehouse_to_id"]
        itemBalances.net_amount = _['net_amount']
        db.session.commit()
    return json({"message": "Update Success"})

@app.route('/api/v1/delete_itembalances', methods=["POST"])
async def delete_itembalances(request):
    list_id = request.json
    for _ in list_id:
        itemBalances = db.session.query(ItemBalances).filter(ItemBalances.id == _).first()
        db.session.delete(itemBalances)
        db.session.commit()
    return json({"message": "Delete Success"})




# @app.route("/api/v1/asset_inventory", methods=["POST"])
# def asset_inventory(request):
#     data = request.json
#     if data['text'] is not None and data['text'] != "":
#         keySearch = data['text']
#         print ('____________keySearch____________',keySearch)
#         search = "%{}%".format(keySearch)
#         tex_capitalize = keySearch.capitalize()
#         search_capitalize = "%{}%".format(tex_capitalize)
#         itemBalancesPlus = db.session.query(ItemBalances.item_id,ItemBalances.purchase_cost, ItemBalances.warehouse_id,func.sum(ItemBalances.quantity)).group_by(ItemBalances.item_id,ItemBalances.purchase_cost,ItemBalances.warehouse_id).filter(and_(ItemBalances.tenant_id==data['tenant_id']),ItemBalances.item_balances_type == "goodsreciept",ItemBalances.item_name.like(search)).all()
#         itemBalancesMinus = db.session.query(ItemBalances.item_id,ItemBalances.purchase_cost, ItemBalances.warehouse_id,func.sum(ItemBalances.quantity)).group_by(ItemBalances.item_id,ItemBalances.purchase_cost,ItemBalances.warehouse_id).filter(and_(ItemBalances.tenant_id==data['tenant_id']),ItemBalances.item_balances_type == "purchaseorder",ItemBalances.item_name.like(search)).all()
#         arr = []
#         if(len(itemBalancesMinus) != 0):
#             for plus in range(len(itemBalancesPlus)):
#                 count = 0
#                 length = len(itemBalancesMinus)
#                 for minus in range(len(itemBalancesMinus)):
#                     if itemBalancesPlus[plus][0].urn[9:] == itemBalancesMinus[minus][0].urn[9:] and itemBalancesPlus[plus][1] == itemBalancesMinus[minus][1]  and itemBalancesPlus[plus][2].urn[9:] == itemBalancesMinus[minus][2].urn[9:]:
#                         warehouseInfo = db.session.query(Warehouse.warehouse_name).filter(Warehouse.id==itemBalancesPlus[plus][2].urn[9:]).first();
#                         ItemInfo = db.session.query(Item.item_name,Item.item_no,Item.list_price,Item.unit_id).filter(Item.id==itemBalancesPlus[plus][0].urn[9:]).first();
#                         obj= {}
#                         obj['item_id'] = itemBalancesPlus[plus][0].urn[9:]
#                         obj['item_name'] = ItemInfo[0]
#                         obj['item_no'] = ItemInfo[1]
#                         obj['purchase_cost'] = itemBalancesPlus[plus][1]
#                         obj['warehouse_id'] = itemBalancesPlus[plus][2].urn[9:]
#                         obj['warehouse_name'] = warehouseInfo[0]
#                         obj['list_price'] = ItemInfo[2]
#                         obj['quantity'] = itemBalancesPlus[plus][3] - itemBalancesMinus[minus][3]
#                         obj['unit_id'] = ItemInfo[3]
#                         arr.append(obj)
#                         itemBalancesMinus.pop(minus)
#                         break
#                     else:
#                         count = count + 1
#                 if count == length:
#                     warehouseName = db.session.query(Warehouse.warehouse_name).filter(Warehouse.id==itemBalancesPlus[plus][2].urn[9:]).first();
#                     itemNameAndItemNoAndListPriceAndUnitId = db.session.query(Item.item_name,Item.item_no,Item.list_price,Item.unit_id).filter(Item.id==itemBalancesPlus[plus][0].urn[9:]).first();
#                     obj= {}
#                     obj['item_id'] = itemBalancesPlus[plus][0].urn[9:]
#                     obj['item_name'] = itemNameAndItemNoAndListPriceAndUnitId[0]
#                     obj['item_no'] = itemNameAndItemNoAndListPriceAndUnitId[1]
#                     obj['purchase_cost'] = itemBalancesPlus[plus][1]
#                     obj['warehouse_id'] = itemBalancesPlus[plus][2].urn[9:]
#                     obj['warehouse_name'] = warehouseName[0]
#                     obj['list_price'] = itemNameAndItemNoAndListPriceAndUnitId[2]
#                     obj['quantity'] = itemBalancesPlus[plus][3]
#                     obj['unit_id'] = itemNameAndItemNoAndListPriceAndUnitId[3]
#                     arr.append(obj)
#             return json(arr)
#         else:
#             for _ in itemBalancesPlus:
#                 warehouseName = db.session.query(Warehouse.warehouse_name).filter(Warehouse.id==_[2].urn[9:]).first();
#                 itemNameAndItemNoAndListPriceAndUnitId = db.session.query(Item.item_name,Item.item_no,Item.list_price,Item.unit_id).filter(Item.id==_[0].urn[9:]).first();
#                 obj= {}
#                 obj['item_id'] = _[0].urn[9:]
#                 obj['item_name'] = itemNameAndItemNoAndListPriceAndUnitId[0]
#                 obj['item_no'] = itemNameAndItemNoAndListPriceAndUnitId[1]
#                 obj['purchase_cost'] = _[1]
#                 obj['warehouse_id'] = _[2].urn[9:]
#                 obj['warehouse_name'] = warehouseName[0]
#                 obj['list_price'] = itemNameAndItemNoAndListPriceAndUnitId[2]
#                 obj['quantity'] = _[3]
#                 obj['unit_id'] = itemNameAndItemNoAndListPriceAndUnitId[3]
#                 arr.append(obj)
#             return json(arr)
#     return json({"message":"error"})


@app.route("/api/v1/assets_in_each_warehouse", methods=["POST"])
def assets_in_each_warehouse(request):
    data = request.json
    if data['text'] is not None and data['text'] != "":
        keySearch = data['text']
        search = "%{}%".format(keySearch)
        tex_capitalize = keySearch.capitalize()
        search_capitalize = "%{}%".format(tex_capitalize)
        itemBalancesMinus = db.session.query(ItemBalances.item_id,ItemBalances.purchase_cost,func.sum(ItemBalances.quantity)).group_by(ItemBalances.item_id,ItemBalances.purchase_cost).filter(or_(and_(ItemBalances.tenant_id==data['tenant_id'],ItemBalances.item_balances_type == "purchaseorder",ItemBalances.warehouse_id == data["warehouse_id"],ItemBalances.item_name.like(search)),and_(ItemBalances.tenant_id==data['tenant_id'],ItemBalances.item_balances_type == "movewarehouse",ItemBalances.warehouse_from_id == data["warehouse_id"],ItemBalances.item_name.like(search)))).all()
        itemBalancesPlus = db.session.query(ItemBalances.item_id,ItemBalances.purchase_cost,func.sum(ItemBalances.quantity)).group_by(ItemBalances.item_id,ItemBalances.purchase_cost).filter(or_(and_(ItemBalances.tenant_id==data['tenant_id'],ItemBalances.item_balances_type == "goodsreciept",ItemBalances.warehouse_id == data["warehouse_id"],ItemBalances.item_name.like(search)),and_(ItemBalances.tenant_id==data['tenant_id'],ItemBalances.item_balances_type == "movewarehouse",ItemBalances.warehouse_to_id == data["warehouse_id"],ItemBalances.item_name.like(search)),and_(ItemBalances.tenant_id==data['tenant_id'],ItemBalances.item_balances_type == "warehouse",ItemBalances.warehouse_id == data["warehouse_id"],ItemBalances.item_name.like(search)))).all()
        arr = []
        if(len(itemBalancesMinus) != 0):
            for plus in range(len(itemBalancesPlus)):
                count = 0
                length = len(itemBalancesMinus)
                for minus in range(len(itemBalancesMinus)):
                    if itemBalancesPlus[plus][0].urn[9:] == itemBalancesMinus[minus][0].urn[9:] and itemBalancesPlus[plus][1] == itemBalancesMinus[minus][1]:
                        warehouseInfo = db.session.query(Warehouse.warehouse_name).filter(Warehouse.id==data['warehouse_id']).first();
                        ItemInfo = db.session.query(Item.item_name,Item.item_no,Item.list_price,Item.unit_id).filter(Item.id==itemBalancesPlus[plus][0].urn[9:]).first();
                        obj= {}
                        obj['item_id'] = itemBalancesPlus[plus][0].urn[9:]
                        obj['item_name'] = ItemInfo[0]
                        obj['item_no'] = ItemInfo[1]
                        obj['purchase_cost'] = itemBalancesPlus[plus][1]
                        obj['warehouse_id'] = data['warehouse_id']
                        obj['warehouse_name'] = warehouseInfo[0]
                        obj['list_price'] = ItemInfo[2]
                        obj['quantity'] = itemBalancesPlus[plus][2] - itemBalancesMinus[minus][2]
                        obj['unit_id'] = ItemInfo[3]
                        arr.append(obj)
                        itemBalancesMinus.pop(minus)
                        break
                    else:
                        count = count + 1
                if count == length:
                    warehouseName = db.session.query(Warehouse.warehouse_name).filter(Warehouse.id==data['warehouse_id']).first();
                    itemNameAndItemNoAndListPriceAndUnitId = db.session.query(Item.item_name,Item.item_no,Item.list_price,Item.unit_id).filter(Item.id==itemBalancesPlus[plus][0].urn[9:]).first();
                    obj= {}
                    obj['item_id'] = itemBalancesPlus[plus][0].urn[9:]
                    obj['item_name'] = itemNameAndItemNoAndListPriceAndUnitId[0]
                    obj['item_no'] = itemNameAndItemNoAndListPriceAndUnitId[1]
                    obj['purchase_cost'] = itemBalancesPlus[plus][1]
                    obj['warehouse_id'] = data['warehouse_id']
                    obj['warehouse_name'] = warehouseName[0]
                    obj['list_price'] = itemNameAndItemNoAndListPriceAndUnitId[2]
                    obj['quantity'] = itemBalancesPlus[plus][2]
                    obj['unit_id'] = itemNameAndItemNoAndListPriceAndUnitId[3]
                    arr.append(obj)
            return json(arr)
        else:
            for _ in itemBalancesPlus:
                warehouseName = db.session.query(Warehouse.warehouse_name).filter(Warehouse.id==data['warehouse_id']).first();
                itemNameAndItemNoAndListPriceAndUnitId = db.session.query(Item.item_name,Item.item_no,Item.list_price,Item.unit_id).filter(Item.id==_[0].urn[9:]).first();
                obj= {}
                obj['item_id'] = _[0].urn[9:]
                obj['item_name'] = itemNameAndItemNoAndListPriceAndUnitId[0]
                obj['item_no'] = itemNameAndItemNoAndListPriceAndUnitId[1]
                obj['purchase_cost'] = _[1]
                obj['warehouse_id'] = data['warehouse_id']
                obj['warehouse_name'] = warehouseName[0]
                obj['list_price'] = itemNameAndItemNoAndListPriceAndUnitId[2]
                obj['quantity'] = _[2]
                obj['unit_id'] = itemNameAndItemNoAndListPriceAndUnitId[3]
                arr.append(obj)
            return json(arr)
    return json({"message":"error"})



@app.route("/api/v1/assets_in_each_warehouse_no_search", methods=["POST"])
def assets_in_each_warehouse_no_search(request):
    data = request.json
    itemBalancesMinus = db.session.query(ItemBalances.item_id,ItemBalances.purchase_cost,func.sum(ItemBalances.quantity)).group_by(ItemBalances.item_id,ItemBalances.purchase_cost).filter(or_(and_(ItemBalances.tenant_id==data['tenant_id'],ItemBalances.item_balances_type == "purchaseorder",ItemBalances.warehouse_id == data["warehouse_id"]),and_(ItemBalances.tenant_id==data['tenant_id'],ItemBalances.item_balances_type == "movewarehouse",ItemBalances.warehouse_from_id == data["warehouse_id"]))).all()
    itemBalancesPlus = db.session.query(ItemBalances.item_id,ItemBalances.purchase_cost,func.sum(ItemBalances.quantity)).group_by(ItemBalances.item_id,ItemBalances.purchase_cost).filter(or_(and_(ItemBalances.tenant_id==data['tenant_id'],ItemBalances.item_balances_type == "goodsreciept",ItemBalances.warehouse_id == data["warehouse_id"]),and_(ItemBalances.tenant_id==data['tenant_id'],ItemBalances.item_balances_type == "movewarehouse",ItemBalances.warehouse_to_id == data["warehouse_id"]),and_(ItemBalances.tenant_id==data['tenant_id'],ItemBalances.item_balances_type == "warehouse",ItemBalances.warehouse_id == data["warehouse_id"]))).all()
    arr = []
    if(len(itemBalancesMinus) != 0):
        for plus in range(len(itemBalancesPlus)):
            count = 0
            length = len(itemBalancesMinus)
            for minus in range(len(itemBalancesMinus)):
                if itemBalancesPlus[plus][0].urn[9:] == itemBalancesMinus[minus][0].urn[9:] and itemBalancesPlus[plus][1] == itemBalancesMinus[minus][1]:
                    warehouseInfo = db.session.query(Warehouse.warehouse_name).filter(Warehouse.id==data['warehouse_id']).first();
                    ItemInfo = db.session.query(Item.item_name,Item.item_no,Item.list_price,Item.unit_id).filter(Item.id==itemBalancesPlus[plus][0].urn[9:]).first();
                    obj= {}
                    obj['item_id'] = itemBalancesPlus[plus][0].urn[9:]
                    obj['item_name'] = ItemInfo[0]
                    obj['item_no'] = ItemInfo[1]
                    obj['purchase_cost'] = itemBalancesPlus[plus][1]
                    obj['warehouse_id'] = data['warehouse_id']
                    obj['warehouse_name'] = warehouseInfo[0]
                    obj['list_price'] = ItemInfo[2]
                    obj['quantity'] = itemBalancesPlus[plus][2] - itemBalancesMinus[minus][2]
                    obj['unit_id'] = ItemInfo[3]
                    arr.append(obj)
                    itemBalancesMinus.pop(minus)
                    break
                else:
                    count = count + 1
            if count == length:
                warehouseName = db.session.query(Warehouse.warehouse_name).filter(Warehouse.id==data['warehouse_id']).first();
                itemNameAndItemNoAndListPriceAndUnitId = db.session.query(Item.item_name,Item.item_no,Item.list_price,Item.unit_id).filter(Item.id==itemBalancesPlus[plus][0].urn[9:]).first();
                obj= {}
                obj['item_id'] = itemBalancesPlus[plus][0].urn[9:]
                obj['item_name'] = itemNameAndItemNoAndListPriceAndUnitId[0]
                obj['item_no'] = itemNameAndItemNoAndListPriceAndUnitId[1]
                obj['purchase_cost'] = itemBalancesPlus[plus][1]
                obj['warehouse_id'] = data['warehouse_id']
                obj['warehouse_name'] = warehouseName[0]
                obj['list_price'] = itemNameAndItemNoAndListPriceAndUnitId[2]
                obj['quantity'] = itemBalancesPlus[plus][2]
                obj['unit_id'] = itemNameAndItemNoAndListPriceAndUnitId[3]
                arr.append(obj)
        return json(arr)
    else:
        for _ in itemBalancesPlus:
            warehouseName = db.session.query(Warehouse.warehouse_name).filter(Warehouse.id==data['warehouse_id']).first();
            itemNameAndItemNoAndListPriceAndUnitId = db.session.query(Item.item_name,Item.item_no,Item.list_price,Item.unit_id).filter(Item.id==_[0].urn[9:]).first();
            obj= {}
            obj['item_id'] = _[0].urn[9:]
            obj['item_name'] = itemNameAndItemNoAndListPriceAndUnitId[0]
            obj['item_no'] = itemNameAndItemNoAndListPriceAndUnitId[1]
            obj['purchase_cost'] = _[1]
            obj['warehouse_id'] = data['warehouse_id']
            obj['warehouse_name'] = warehouseName[0]
            obj['list_price'] = itemNameAndItemNoAndListPriceAndUnitId[2]
            obj['quantity'] = _[2]
            obj['unit_id'] = itemNameAndItemNoAndListPriceAndUnitId[3]
            arr.append(obj)
        return json(arr)
    return json({"message":"error"})


@app.route("/api/v1/assets_all_warehouse", methods=["POST"])
def assets_all_warehouse(request):
    data = request.json
    if data['text'] is not None and data['text'] != "":
        keySearch = data['text']
        search = "%{}%".format(keySearch)
        tex_capitalize = keySearch.capitalize()
        search_capitalize = "%{}%".format(tex_capitalize)
        warehouse = db.session.query(Warehouse.id).filter(Warehouse.tenant_id==data['tenant_id']).all()
        arr = []
        for wh in warehouse:
            warehouseID = to_dict(wh).id.urn[9:]
            itemBalancesMinus = db.session.query(ItemBalances.item_id,ItemBalances.purchase_cost,func.sum(ItemBalances.quantity)).group_by(ItemBalances.item_id,ItemBalances.purchase_cost).filter(or_(and_(ItemBalances.tenant_id==data['tenant_id'],ItemBalances.item_balances_type == "purchaseorder",ItemBalances.warehouse_id == warehouseID,ItemBalances.item_name.like(search)),and_(ItemBalances.tenant_id==data['tenant_id'],ItemBalances.item_balances_type == "movewarehouse",ItemBalances.warehouse_from_id == warehouseID,ItemBalances.item_name.like(search)))).all()
            itemBalancesPlus = db.session.query(ItemBalances.item_id,ItemBalances.purchase_cost,func.sum(ItemBalances.quantity)).group_by(ItemBalances.item_id,ItemBalances.purchase_cost).filter(or_(and_(ItemBalances.tenant_id==data['tenant_id'],ItemBalances.item_balances_type == "goodsreciept",ItemBalances.warehouse_id == warehouseID,ItemBalances.item_name.like(search)),and_(ItemBalances.tenant_id==data['tenant_id'],ItemBalances.item_balances_type == "movewarehouse",ItemBalances.warehouse_to_id == warehouseID,ItemBalances.item_name.like(search)),and_(ItemBalances.tenant_id==data['tenant_id'],ItemBalances.item_balances_type == "warehouse",ItemBalances.warehouse_id == warehouseID,ItemBalances.item_name.like(search)))).all()
            if(len(itemBalancesMinus) != 0):
                for plus in range(len(itemBalancesPlus)):
                    count = 0
                    length = len(itemBalancesMinus)
                    for minus in range(len(itemBalancesMinus)):
                        if itemBalancesPlus[plus][0].urn[9:] == itemBalancesMinus[minus][0].urn[9:] and itemBalancesPlus[plus][1] == itemBalancesMinus[minus][1]:
                            warehouseInfo = db.session.query(Warehouse.warehouse_name).filter(Warehouse.id==warehouseID).first();
                            ItemInfo = db.session.query(Item.item_name,Item.item_no,Item.list_price,Item.unit_id).filter(Item.id==itemBalancesPlus[plus][0].urn[9:]).first();
                            obj= {}
                            obj['item_id'] = itemBalancesPlus[plus][0].urn[9:]
                            obj['item_name'] = ItemInfo[0]
                            obj['item_no'] = ItemInfo[1]
                            obj['purchase_cost'] = itemBalancesPlus[plus][1]
                            obj['warehouse_id'] = warehouseID
                            obj['warehouse_name'] = warehouseInfo[0]
                            obj['list_price'] = ItemInfo[2]
                            obj['quantity'] = itemBalancesPlus[plus][2] - itemBalancesMinus[minus][2]
                            obj['unit_id'] = ItemInfo[3]
                            arr.append(obj)
                            itemBalancesMinus.pop(minus)
                            break
                        else:
                            count = count + 1
                    if count == length:
                        warehouseName = db.session.query(Warehouse.warehouse_name).filter(Warehouse.id==warehouseID).first();
                        itemNameAndItemNoAndListPriceAndUnitId = db.session.query(Item.item_name,Item.item_no,Item.list_price,Item.unit_id).filter(Item.id==itemBalancesPlus[plus][0].urn[9:]).first();
                        obj= {}
                        obj['item_id'] = itemBalancesPlus[plus][0].urn[9:]
                        obj['item_name'] = itemNameAndItemNoAndListPriceAndUnitId[0]
                        obj['item_no'] = itemNameAndItemNoAndListPriceAndUnitId[1]
                        obj['purchase_cost'] = itemBalancesPlus[plus][1]
                        obj['warehouse_id'] = warehouseID
                        obj['warehouse_name'] = warehouseName[0]
                        obj['list_price'] = itemNameAndItemNoAndListPriceAndUnitId[2]
                        obj['quantity'] = itemBalancesPlus[plus][2]
                        obj['unit_id'] = itemNameAndItemNoAndListPriceAndUnitId[3]
                        arr.append(obj)
                # return json(arr)
            else:
                for _ in itemBalancesPlus:
                    warehouseName = db.session.query(Warehouse.warehouse_name).filter(Warehouse.id==warehouseID).first();
                    itemNameAndItemNoAndListPriceAndUnitId = db.session.query(Item.item_name,Item.item_no,Item.list_price,Item.unit_id).filter(Item.id==_[0].urn[9:]).first();
                    obj= {}
                    obj['item_id'] = _[0].urn[9:]
                    obj['item_name'] = itemNameAndItemNoAndListPriceAndUnitId[0]
                    obj['item_no'] = itemNameAndItemNoAndListPriceAndUnitId[1]
                    obj['purchase_cost'] = _[1]
                    obj['warehouse_id'] = warehouseID
                    obj['warehouse_name'] = warehouseName[0]
                    obj['list_price'] = itemNameAndItemNoAndListPriceAndUnitId[2]
                    obj['quantity'] = _[2]
                    obj['unit_id'] = itemNameAndItemNoAndListPriceAndUnitId[3]
                    arr.append(obj)
        return json(arr)
    return json({"message":"error"})