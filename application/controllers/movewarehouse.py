from gatco.response import json,text, html
from application.extensions import sqlapimanager
from application.extensions import auth
from application.database import db
from application.server import app
from sqlalchemy import or_
from datetime import datetime
import time
from gatco_restapi.helpers import to_dict
from application.models.movewarehouse import *
from application.models.goodsreciept import *
from application.common.helper import pre_post_set_user_tenant_id, pre_get_many_user_tenant_id, get_tennat_id, current_user, auth_func



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