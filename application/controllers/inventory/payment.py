from gatco.response import json,text, html
from application.extensions import sqlapimanager
from application.extensions import auth
from application.database import db
from application.server import app
from sqlalchemy import or_
from datetime import datetime
import time
from gatco_restapi.helpers import to_dict
from application.models.inventory.payment import *

from application.common.helper import pre_post_set_user_tenant_id, pre_get_many_user_tenant_id, get_tennat_id, current_user, auth_func

@app.route("/api/v1/add-payment-voucher", methods=["POST"])
async def add_payment_voucher(request):
    data = request.json
    # print("data", data["payment"])
    # uid = await current_user(request)
    # tenant_id = await get_tennat_id(request)
    tenant_id = 'tenants123'
    if data is not None:
        payment_voucher = db.session.query(Payment).filter(Payment.goodsreciept_id == data["payment"]["goodsreciept_id"]).first()
        if payment_voucher is None:
            new_payment = Payment(goodsreciept_id=data["payment"]["goodsreciept_id"], goodsreciept_no=data["payment"]["goodsreciept_no"], receiver_address=data["payment"]["address"], amount=data["payment"]["amount"], description=data["payment"]["description"],\
                payment_no=data["payment"]["payment_no"], receiver=data["payment"]["receiver"], created_at=data["payment"]["created_at"])
                # , created_by_name=data["payment"]["created_by_name"]

            db.session.add(new_payment)
            db.session.commit()

            return json(to_dict(new_payment))
            
        else:
            payment_voucher.user_id = uid["id"]
            payment_voucher.tenant_id = tenant_id
            payment_voucher.goodsreciept_id=data["payment"]["goodsreciept_id"]
            payment_voucher.goodsreciept_no=data["payment"]["goodsreciept_no"]
            payment_voucher.receiver=data["payment"]["receiver"]
            payment_voucher.receiver_address=data["payment"]["address"]
            payment_voucher.amount=data["payment"]["amount"]
            payment_voucher.description=data["payment"]["description"]
            payment_voucher.payment_no=data["payment"]["payment_no"]
            payment_voucher.created_at=data["payment"]["created_at"]
            # payment_voucher.created_by_name=data["payment"]["created_by_name"]

            db.session.commit()

    
        return json({"success"})


sqlapimanager.create_api(Payment,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    # preprocess=dict(GET_SINGLE=[auth_func],
    #                 GET_MANY=[pre_get_many_user_tenant_id],
    #                 POST=[pre_post_set_user_tenant_id],
    #                 PUT_SINGLE=[pre_post_set_user_tenant_id]),
    # collection_name='payment')
        preprocess=dict(GET_SINGLE=[],
                    GET_MANY=[],
                    POST=[],
                    PUT_SINGLE=[]),
    collection_name='payment')

