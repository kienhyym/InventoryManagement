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



async def response_getmany_stt(request=None, Model=None, result=None, **kw):
    if result is not None and "objects" in result:
        objects = to_dict(result["objects"])
        datas = []
        i = len(objects)
        page = request.args.get("page",None)
        results_per_page = request.args.get("results_per_page",None)
        currentUser = await current_user(request)
        if currentUser is None:
            return json({"error_code":"PERMISSION_DENY","error_message":"Hết phiên làm việc!"}, status=520)
        if page is not None and results_per_page is not None and int(page) != 1:
            i = i - int(results_per_page)*int(page)
        for obj in objects:
            if obj is not None:
                # paymentdetails = db.session.query(PaymentDetails).filter(PaymentDetails.payment_id == to_dict(obj)['id']).all()
                # thanhtoan = 0;
                # for _ in paymentdetails:
                #     thanhtoan = thanhtoan + to_dict(_)['amount']
                # if obj['amount'] > thanhtoan:
                #     to_dict(obj)["status"]  = "slacking"
                # elif obj['amount'] == thanhtoan:
                #     to_dict(obj)["status"]  = "finish"
                # elif obj['amount'] < thanhtoan:
                #     to_dict(obj)["status"]  = "wrong"
                obj_tmp = to_dict(obj)
                obj_tmp["stt"] = i
                i = i - 1
                datas.append(obj_tmp)
        result = datas



sqlapimanager.create_api(Payment,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    postprocess = dict(GET_SINGLE=[auth_func],
                    GET_MANY=[response_getmany_stt],
                    POST=[],
                    PUT_SINGLE=[]),
    preprocess=dict(GET_SINGLE=[],
                    GET_MANY=[],
                    POST=[],
                    PUT_SINGLE=[]),
    collection_name='payment')

sqlapimanager.create_api(PaymentDetails,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    postprocess = dict(GET_SINGLE=[auth_func],
                    GET_MANY=[],
                    POST=[],
                    PUT_SINGLE=[]),
    preprocess=dict(GET_SINGLE=[],
                    GET_MANY=[],
                    POST=[],
                    PUT_SINGLE=[]),
    collection_name='paymentdetails')



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
                list = db.session.query(GoodsReciept).filter(and_(GoodsReciept.goodsreciept_no.like(search_capitalize),GoodsReciept.tenant_id == tenant_id,GoodsReciept.organization_id == req['organization_id'],or_(GoodsReciept.payment_status == "confirm",GoodsReciept.payment_status == "debt"))).all()
                arr = []
                for i in list:
                    obj = {}
                    paymentDetails = db.session.query(PaymentDetails).filter(and_(PaymentDetails.goodsreciept_id == to_dict(i)['id'])).all()
                    thanhToan = 0
                    if(len(paymentDetails) >0):
                        for paydt in paymentDetails:
                            thanhToan = thanhToan + to_dict(paydt)['amount']
                    debt = to_dict(i)['amount'] - thanhToan  
                    obj['amount_debt'] = debt
                    obj['item_id'] = to_dict(i)['id']
                    obj['item_no'] = to_dict(i)['goodsreciept_no']
                    obj['item_organization_id'] = to_dict(i)['organization_id']
                    obj['item_type'] = 'goodsreciept'
                    obj['amount'] = to_dict(i)['amount']
                    obj['created_at'] = to_dict(i)['created_at']
                    arr.append(obj)
                return json(arr)
            if req['text'].upper().find('MH', 0, 3) != -1:
                list = db.session.query(PurchaseOrder).filter(and_(PurchaseOrder.purchaseorder_no.like(search_capitalize),PurchaseOrder.tenant_id == tenant_id,PurchaseOrder.workstation_id == req['organization_id'],or_(PurchaseOrder.payment_status == "confirm",PurchaseOrder.payment_status == "debt"))).all()
                arr = []
                for i in list:
                    obj = {}
                    paymentDetails = db.session.query(PaymentDetails).filter(and_(PaymentDetails.purchaseorder_id == to_dict(i)['id'])).all()
                    thanhToan = 0
                    if(len(paymentDetails) >0):
                        for paydt in paymentDetails:
                            thanhToan = thanhToan + to_dict(paydt)['amount']
                    debt = to_dict(i)['amount'] - thanhToan  
                    obj['amount_debt'] = debt
                    obj['item_id'] = to_dict(i)['id']
                    obj['item_no'] = to_dict(i)['purchaseorder_no']
                    obj['item_organization_id'] = to_dict(i)['organization_id']
                    obj['item_type'] = 'purchaseorder'
                    obj['amount'] = to_dict(i)['amount']
                    obj['created_at'] = to_dict(i)['created_at']
                    arr.append(obj)
                return json(arr)
        if len(req['text']) == 3:
            if req['text'].upper().find('NH', 0, 3) != -1:
                list = db.session.query(GoodsReciept).filter(and_(GoodsReciept.goodsreciept_no.like(search_capitalize),GoodsReciept.tenant_id == tenant_id,GoodsReciept.organization_id == req['organization_id']),or_(GoodsReciept.payment_status == "confirm",GoodsReciept.payment_status == "debt")).all()
                arr = []
                for i in list:
                    obj = {}
                    paymentDetails = db.session.query(PaymentDetails).filter(and_(PaymentDetails.goodsreciept_id == to_dict(i)['id'])).all()
                    thanhToan = 0
                    if(len(paymentDetails) >0):
                        for paydt in paymentDetails:
                            thanhToan = thanhToan + to_dict(paydt)['amount']
                    debt = to_dict(i)['amount'] - thanhToan  
                    obj['amount_debt'] = debt
                    obj['item_id'] = to_dict(i)['id']
                    obj['item_no'] = to_dict(i)['goodsreciept_no']
                    obj['item_organization_id'] = to_dict(i)['organization_id']
                    obj['item_type'] = 'goodsreciept'
                    obj['amount'] = to_dict(i)['amount']
                    obj['created_at'] = to_dict(i)['created_at']
                    print ('_______________________',to_dict(i)['paymentdetails'])

                    arr.append(obj)
                return json(arr)
            if req['text'].upper().find('MH', 0, 3) != -1:
                list = db.session.query(PurchaseOrder).filter(and_(PurchaseOrder.purchaseorder_no.like(search_capitalize),PurchaseOrder.tenant_id == tenant_id,PurchaseOrder.workstation_id == req['organization_id'],or_(PurchaseOrder.payment_status == "confirm",PurchaseOrder.payment_status == "debt"))).all()
                arr = []
                for i in list:
                    obj = {}
                    paymentDetails = db.session.query(PaymentDetails).filter(and_(PaymentDetails.purchaseorder_id == to_dict(i)['id'])).all()
                    thanhToan = 0
                    if(len(paymentDetails) >0):
                        for paydt in paymentDetails:
                            thanhToan = thanhToan + to_dict(paydt)['amount']
                    debt = to_dict(i)['amount'] - thanhToan  
                    obj['amount_debt'] = debt
                    obj['item_id'] = to_dict(i)['id']
                    obj['item_no'] = to_dict(i)['purchaseorder_no']
                    obj['item_organization_id'] = to_dict(i)['organization_id']
                    obj['item_type'] = 'purchaseorder'
                    obj['amount'] = to_dict(i)['amount']
                    obj['created_at'] = to_dict(i)['created_at']
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
        arr = []
        for i in list:
            arr.append(to_dict(i))
        return json(arr)
    else:
        result = []
        return json(result)


@app.route('/api/v1/create_payment_detail',methods=['POST'])
async def create_payment_detail(request):
    req = request.json
    for _ in req:
        paymentDetail = PaymentDetails()
        paymentDetail.payment_id = _['payment_id']
        paymentDetail.amount= _['amount']
        paymentDetail.tenant_id= _['tenant_id']
        paymentDetail.type= _['type']
        if _['type'] == 'goodsreciept':
            dict = db.session.query(GoodsReciept).filter(GoodsReciept.id == _['phieu_id']).first()
            paymentDetail.goodsreciept_amount = to_dict(dict)['amount']
            paymentDetail.goodsreciept_no= to_dict(dict)['goodsreciept_no']
            paymentDetail.goodsreciept_create_at= to_dict(dict)['created_at']
            paymentDetail.goodsreciept_id= _['phieu_id']

        if _['type'] == 'purchaseorder':
            dict = db.session.query(PurchaseOrder).filter(PurchaseOrder.id == _['phieu_id']).first()
            paymentDetail.purchaseorder_amount = to_dict(dict)['amount']
            paymentDetail.purchaseorder_no= to_dict(dict)['purchaseorder_no']
            paymentDetail.purchaseorder_create_at= to_dict(dict)['created_at']
            paymentDetail.purchaseorder_id= _['phieu_id']

        db.session.add(paymentDetail)
        db.session.commit()

    

    return json({"messenger":"success"})


@app.route('/api/v1/update_payment_detail', methods=["POST"])
async def update_payment_detail(request):
    req = request.json
    for _ in req:
        paymentDetails = db.session.query(PaymentDetails).filter(PaymentDetails.id == _['id']).first()
        paymentDetails.amount = _['amount']
        db.session.commit()
    return json({"message": "Update Success"})

@app.route('/api/v1/delete_payment_detail', methods=["POST"])
async def delete_payment_detail(request):
    list_id = request.json
    for _ in list_id:
        paymentDetails = db.session.query(PaymentDetails).filter(PaymentDetails.id == _).first()
        db.session.delete(paymentDetails)
        db.session.commit()
    return json({"message": "Delete Success"})

@app.route('/api/v1/update_status', methods=["POST"])
async def update_status(request):
    req = request.json
    for _ in req:
        if _['type'] == 'goodsreciept':
            goodsReciept = db.session.query(GoodsReciept).filter(GoodsReciept.id == _['phieu_id']).first()
            amount = to_dict(goodsReciept)['amount']
            paymentDetails = db.session.query(PaymentDetails).filter(PaymentDetails.goodsreciept_id == _['phieu_id']).all()
            thanhtoan = 0
            for pay in paymentDetails:
                thanhtoan = thanhtoan + to_dict(pay)['amount']
            if int(amount) > int(thanhtoan) and int(thanhtoan) > 0:
                goodsReciept.payment_status = "debt"
                db.session.commit()
            elif int(amount) == int(thanhtoan):
                goodsReciept.payment_status = "paid"
                db.session.commit()

        if _['type'] == 'purchaseorder':
            purchaseorder = db.session.query(PurchaseOrder).filter(PurchaseOrder.id == _['phieu_id']).first()
            amount = to_dict(purchaseorder)['amount']
            paymentDetails = db.session.query(PaymentDetails).filter(PaymentDetails.purchaseorder_id == _['phieu_id']).all()
            thanhtoan = 0
            for pay in paymentDetails:
                thanhtoan = thanhtoan + to_dict(pay)['amount']
            print ('______________',amount,thanhtoan)
            if int(amount) > int(thanhtoan) and int(thanhtoan) > 0:
                purchaseorder.payment_status = "debt"
                db.session.commit()
            elif int(amount) == int(thanhtoan):
                purchaseorder.payment_status = "paid"
                db.session.commit()
    return json({"message": "update status Success"})