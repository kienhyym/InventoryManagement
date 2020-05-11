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
from application.models.inventory.warehouse import *
from application.models.inventory.purchaseorder import *
from application.models.inventory.goodsreciept import *


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


@app.route('/api/v1/load_import_export_dropdown',methods=['POST'])
async def load_import_export_dropdown(request):
    req = request.json
    if req['text'] is not None and req['text'] != "":
        keySearch = req['text']
        tenant_id = req['tenant_id']
        search = "%{}%".format(keySearch)
        tex_capitalize = keySearch.capitalize()
        search_capitalize = "%{}%".format(req['text'].upper())
        if len(req['text']) >3:
            if req['text'].upper().find('NH', 0, 3) != -1:
                list = db.session.query(GoodsReciept).filter(and_(GoodsReciept.goodsreciept_no.like(search_capitalize),GoodsReciept.tenant_id == tenant_id)).all()
                print ('_______________________',search_capitalize,list)
                arr = []
                for i in list:
                    obj = {}
                    obj['item_id'] = to_dict(i)['id']
                    obj['item_no'] = to_dict(i)['goodsreciept_no']
                    obj['item_organization_id'] = to_dict(i)['organization_id']
                    obj['item_type'] = 'goodsreciept'

                    arr.append(obj)
                return json(arr)
            if req['text'].upper().find('MH', 0, 3) != -1:
                list = db.session.query(PurchaseOrder).filter(and_(PurchaseOrder.purchaseorder_no.like(search_capitalize),PurchaseOrder.tenant_id == tenant_id)).all()
                arr = []
                for i in list:
                    obj = {}
                    obj['item_id'] = to_dict(i)['id']
                    obj['item_no'] = to_dict(i)['purchaseorder_no']
                    obj['item_organization_id'] = to_dict(i)['organization_id']
                    obj['item_type'] = 'purchaseorder'
                    arr.append(obj)
                return json(arr)
        else:
            result = []
            return json(result)
    else:
        result = []
        return json(result)


@app.route('/api/v1/load_organization',methods=['POST'])
async def load_organization(request):
    req = request.json
    if req['text'] is not None and req['text'] != "":
        keySearch = req['text']
        tenant_id = req['tenant_id']
        search = "%{}%".format(keySearch)
        tex_capitalize = keySearch.capitalize()
        search_capitalize = "%{}%".format(req['text'].upper())
        list = db.session.query(Organization).filter(and_(Organization.organization_name.like(search),Organization.tenant_id == tenant_id)).all()
        print ('_______________________',search,list)
        arr = []
        for i in list:
            arr.append(to_dict(i))
        return json(arr)
    else:
        result = []
        return json(result)