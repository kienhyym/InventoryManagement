from gatco.response import json,text, html
from application.extensions import sqlapimanager
from application.extensions import auth
from application.database import db
from application.server import app
from sqlalchemy import or_, and_
from datetime import datetime
import time
from gatco_restapi.helpers import to_dict

from application.models.purchaseorder import *
from application.models.consumablesupplies import Item
from application.models.user import User
from application.models.workstation import *

# from application.models.deliverynote import *


from application.common.helper import no_generator
from application.common.constants import ERROR_CODE, ERROR_MSG, STATUS_CODE
import requests
import json as json_load
from application.controllers.notify import send_notify_multiple
from application.common.helper import pre_post_set_user_tenant_id, pre_get_many_user_tenant_id, get_tennat_id, current_user, auth_func, super_access


# def check_config_data():
#     user_info = db.session.query(User).all()
#     if user_info is not None:
#         result = []
#         for _ in user_info:
#             list_ = to_dict(_)
#             result.append(list_)
#         for _ in result:
#             if 'config_data' in _ and _['config_data'] is not None:
#                 if _['config_data']['working'] == False:
#                     return json({
#                         "error_code": "DATE_TIME_ERROR",
#                         "error_message": "Đã hết giờ làm việc vui lòng quay lại sau!"
#                     }, status=520)


# @app.route("/api/v1/purchase/filter-by-role", methods=["GET"])
# async def purchase_filter_by_role(request):

#     uid = await current_user(request)
#     tenant_id = await get_tennat_id(request)

#     url = "http://localhost:7100/accounts/api/v1/tenant/user_permission?user_id="+ uid["id]" + "&tenant_id=" + tenant_id
#     response = requests.get(url)

#     print("====================>", r)

#     return json({})
#     # print("urrrrrr", response)

#     # # print("response", response)

#     # if response.status_code == STATUS_CODE['OK']:
#     #     r = response.json()
#     #     print("==========", r)

#     #     return json(r)

#     return json({})



@app.route("/api/v1/create_purchase_order_details_item", methods=["POST"])
def create_purchase_order_details_item(request):
    data = request.json
    if data is not None:
        data_purchaseOrderDetails = data['data']
        for _ in data_purchaseOrderDetails:
            purchaseOrderDetails = PurchaseOrderDetails()
            purchaseOrderDetails.purchaseorder_id = data['purchaseorder_id']
            purchaseOrderDetails.item_id = _['item_id']
            purchaseOrderDetails.item_name = _['item_name']
            purchaseOrderDetails.quantity = _['quantity']
            purchaseOrderDetails.list_price = _['list_price']
            purchaseOrderDetails.net_amount = _['net_amount']
            db.session.add(purchaseOrderDetails)
            db.session.commit()
    return json({"message": "Create Success"})

@app.route('/api/v1/update_purchase_order_details_item', methods=["POST"])
async def update_purchase_order_details_item(request):
    data_purchaseOrderDetails = request.json
    for _ in data_purchaseOrderDetails:
        purchaseOrderDetails = db.session.query(PurchaseOrderDetails).filter(PurchaseOrderDetails.id == _['item_id']).first()
        purchaseOrderDetails.quantity = _['quantity']
        purchaseOrderDetails.list_price = _['list_price']
        purchaseOrderDetails.net_amount = _['net_amount']
        db.session.commit()
    return json({"message": "Update Success"})

@app.route('/api/v1/delete_purchase_order_details_item', methods=["POST"])
async def delete_purchase_order_details_item(request):
    list_id = request.json
    for _ in list_id:
        purchaseOrderDetails = db.session.query(PurchaseOrderDetails).filter(PurchaseOrderDetails.id == _).first()
        db.session.delete(purchaseOrderDetails)
        db.session.commit()
    return json({"message": "Delete Success"})





@app.route("/api/v1/add-purchase-order",  methods=["POST"])
async def add_purchase_order(request):
    data = request.json
    uid = await current_user(request)
    # tenant_id = await get_tennat_id(request)
    # user_info = db.session.query(User).all()

    if data is None:
        return json({
                "error_code": ERROR_CODE['INPUT_DATA_ERROR'],
                "error_message": ERROR_MSG['INPUT_DATA_ERROR']
            }, status=STATUS_CODE['ERROR'])

    else:
        purchaseorder = PurchaseOrder()
        purchaseorder.tenant_id = data.get("tenant_id", None)

        print("===============================================", data["tenant_id"])
        print("===============================================", data["workstation_id"])
        purchaseorder.organization_name = data.get("tenant_id", None)
        purchaseorder.workstation_name = data.get("workstation_name", None)
        purchaseorder.workstation_id = data.get("workstation_id", None)

        purchaseorder.tax_code = data.get("tax_code", None)
        purchaseorder.created_by = data.get("created_by", None)

        purchaseorder.created_at = data.get("created_at", None)
        purchaseorder.address = data.get("address", None)

        purchaseorder.organization_id = data.get("organization_id", None)
        purchaseorder.description = data.get("description", None)

        purchaseorder.organization_name = data.get("tenant_id", None)
        purchaseorder.department = data.get("department", None)

        purchaseorder.phone = data.get("phone", None)
        purchaseorder.custom_fields = data.get("custom_fields", None)

        purchaseorder.purchaseorder_no = no_generator(10)
        purchaseorder.is_pos = True

        purchaseorder.payment_status = "pending"
        purchaseorder.proponent = data.get("proponent", None)

        db.session.add(purchaseorder)
        db.session.commit()


        items = db.session.query(Item).all()
        result = []
        if items is not None:
            for _ in items:
                list_ = to_dict(_)
                result.append(list_)

        for _ in data["details"]:
            print("====================>", _)
            details = PurchaseOrderDetails()
            for item in result:
                if _["item_no"] == item["item_no"]:
                    # print("===============================", item)
                    details.list_price = _.get("list_price", 0)

                details.purchaseorder_id = purchaseorder.id
                details.quantity = _.get("quantity", 0)
                details.amount = _.get("amount", 0)

                details.item_exid = _.get("item_exid")
                details.item_id = _.get("item_id")
                details.item_no = _.get("item_no")
                details.item_image = _.get("item_image")

                details.item_name = _.get("item_name")
                details.lot_number = _.get("lot_number")

                details.discount_percent = _.get("discount_percent", 0)
                details.discount_amount = _.get("discount_amount", 0)

                details.unit_code = _.get("unit_code")
                details.unit_id = _.get("unit_id")

            db.session.add(details)
            db.session.commit()

    headers = {
        'content-type': 'application/json'
    }
    url = "http://localhost:7100/accounts/api/v1/tenant/workstation_user?tenant_id=" + data["tenant_id"] + "&workstation_id=" + data["workstation_id"] + "&role=manager"
    # url = "http://localhost:7100/accounts/api/v1/tenant/workstation_user?tenant_id=" + data["tenant_id"] + "&workstation_id=" + data["workstation_id"] + "&role=manager"
    response = requests.get(url, headers=headers)
    list_user = []
    if response.status_code == STATUS_CODE['OK']:
        r = response.json()
        print("=========================R==================", r)
        for _ in r["objects"]:

            list_user.append(_["user_id"])
    print("=====list_user=======", list_user)
    await send_notify_multiple(list_user, ""+ purchaseorder.workstation_name, "Bạn có phiếu mua hàng mới, mau đến xem ngay!", "purchaseorder", "create", purchaseorder.id)


    return json({
        "ok": True,
        "message": "success",
        "object_id": str(purchaseorder.id)
    })


@app.route("/api/v1/purchaseorder-add-to-deliverynote", methods=["POST"])
async def add_purchase_order_to_deliverynote(request):
    data = request.json
    currentUser = await current_user(request)
    tenant_id = data.get("tenant_id", None)
    delivery = DeliveryNote()

    if data is None:
        return json({
                "error_code": ERROR_CODE['INPUT_DATA_ERROR'],
                "error_message": ERROR_MSG['INPUT_DATA_ERROR']
            }, status=STATUS_CODE['ERROR'])
    else:
        # delivery.user_id = currentUser["id"]
        delivery.tenant_id = tenant_id
        delivery.purchaseorder_id = data.get("purchaseorder_id", None)
        delivery.purchaseorder_no = data.get("purchaseorder_no", None)

        delivery.workstation_name = data.get("workstation_name", None)
        delivery.workstation_id = data.get("workstation_id", None)
        delivery.proponent = data.get("proponent", None)
        delivery.proponent_phone = data.get("phone", None)
        delivery.address = data.get("address", None)

        delivery.created_at = data.get("created_at", None)
        delivery.deliverynote_no=data.get("deliverynote_no", None)

        db.session.add(delivery)
        db.session.commit()

        if data["details"] is not None:
            for _ in data["details"]:
                print("================", _)
                details = DeliveryNoteDetails()
                details.deliverynote_id=delivery.id

                details.quantity = _.get("quantity", 0)
                details.item_exid = _.get("item_exid", None)

                details.item_name = _.get("item_name", None)
                details.item_no = _.get("item_no", None)

                details.unit_code = _.get("unit_code", None)
                # details.unit_id=_["unit_code"]

                details.lot_number = _.get("lot_number", None)
                # details.list_price = _.get("list_price", None)
                details.list_price = _.get("list_price", 0)

                db.session.add(details)
                # pass

            db.session.commit()
            return json({
                "ok": True,
                "message": "success",
                "object_id": str(delivery.id)
            })
        else:
            return json({
                "ok": False,
                "message": "error"
            })

@app.route("/api/v1/purchase/order/get", methods=["GET"])
async def get_all_purchase_order(request):

    # currentUser = await current_user(request)
    tenant_id = await get_tennat_id(request)
    purchaseorder = db.session.query(PurchaseOrder).filter(PurchaseOrder.tenant_id==tenant_id).all()
    if purchaseorder is not None:
        result = []
        for _ in purchaseorder:
            list_purchaseorder = to_dict(_)
            result.append(list_purchaseorder)

        return json(result)


@app.route("/api/v1/get_workstation_by_tenant", methods=["POST"])
async def get_workstation_by_tenant(request):
    tenant_id = request.json
    workstation = db.session.query(Workstation).filter(Workstation.tenant_id==tenant_id).all()
    if workstation is not None:
        result = []
        for _ in workstation:
            list_workstation = to_dict(_)
            result.append(list_workstation)
        return json(result)

sqlapimanager.create_api(PurchaseOrder,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    preprocess=dict(GET_SINGLE=[],
                    GET_MANY=[],
                    POST=[],
                    PUT_SINGLE=[]),
    postprocess=dict(
        POST=[],
        PUT_SINGLE=[],
        DELETE_SINGLE=[]),
    collection_name='purchaseorder')

sqlapimanager.create_api(PurchaseOrderDetails,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    preprocess=dict(GET_SINGLE=[],
                    GET_MANY=[],
                    POST=[auth_func],
                    PUT_SINGLE=[auth_func]),
    collection_name='purchaseorderdetails')
