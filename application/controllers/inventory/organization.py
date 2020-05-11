from gatco.response import json,text, html
from application.extensions import sqlapimanager
from application.extensions import auth
from application.database import db
from application.server import app
from sqlalchemy import or_, and_
from datetime import datetime
import time
from application.models.inventory.organization import *
from application.models.inventory.payment import * 
from application.models.inventory.goodsreciept import *
from application.models.inventory.purchaseorder import *

from gatco_restapi.helpers import to_dict
from application.common.helper import pre_post_set_user_tenant_id, pre_get_many_user_tenant_id, get_tennat_id, current_user, auth_func

@app.route('/api/v1/get_all_organization_reseller', methods=["POST"])
async def get_all_organization_reseller(request):
    data = request.json
    organization = db.session.query(Organization).filter(and_(Organization.organization_type =="reseller", Organization.tenant_id==data['tenant_id'])).all()
    result = []
    if organization is not None:
        for o in organization:
            list_o = to_dict(o)
            result.append(list_o)
    return json(result)

@app.route('/api/v1/get_all_organization_customer', methods=["POST"])
async def get_all_organization_customer(request):
    data = request.json
    organization = db.session.query(Organization).filter(and_(Organization.organization_type =="customer", Organization.tenant_id==data['tenant_id'])).all()
    result = []
    if organization is not None:
        for o in organization:
            list_o = to_dict(o)
            result.append(list_o)
    return json(result)

# @app.route('/api/v1/get_all_organizationstaff', methods=["POST"])
# async def get_all_organization(request):
#     organization_id = request.json
#     organizationStaff = db.session.query(OrganizationStaff).filter(OrganizationStaff.organization_id == organization_id).all()
#     result = []
#     if organizationStaff is not None:
#         for o in organizationStaff:
#             list_o = to_dict(o)
#             result.append(list_o)
#     return json(result)


@app.route('/api/v1/create_organizationstaff', methods=["POST"])
async def save_organizationstaff(request):
    data = request.json
    danhSachNhanVien = data['data']
    for _ in danhSachNhanVien:
        organizationStaff = OrganizationStaff()
        organizationStaff.name = _["name"]
        organizationStaff.phone = _["phone"]
        organizationStaff.email = _["email"]
        organizationStaff.role = _["vaitro"]
        organizationStaff.organization_id = data["organization_id"]
        db.session.add(organizationStaff)
        db.session.commit()
    return json({"message": "Create Success",})

@app.route('/api/v1/update_organizationstaff', methods=["POST"])
async def save_organizationstaff(request):
    data = request.json
    danhSachNhanVien = data['data']
    for _ in danhSachNhanVien:
        organizationStaff = db.session.query(OrganizationStaff).filter(OrganizationStaff.id == _["id"]).first()
        organizationStaff.name = _["name"]
        organizationStaff.phone = _["phone"]
        organizationStaff.email = _["email"]
        organizationStaff.role = _["vaitro"]
        db.session.add(organizationStaff)
        db.session.commit()
    return json({"message": "Update Success",})


@app.route('/api/v1/delete_organizationstaff', methods=["POST"])
async def save_organizationstaff(request):
    danhSachNhanVien = request.json
    for _ in danhSachNhanVien:
        organizationStaffx = db.session.query(OrganizationStaff).filter(OrganizationStaff.id == _).first()
        db.session.delete(organizationStaffx)
        db.session.commit()
    return json({"message": "Delete Success",})


@app.route("/api/v1/organization/add-first", methods=["POST"])
async def organization_add_first(request):
    data = request.json
    if 'tenants' in data and data["tenants"] is not None:
        result = []
        for _ in data["tenants"]:
            result.append(_)
            organization = db.session.query(Organization).filter(Organization.organization_exid == _["id"]).first()
            if organization is None:
                or_new = Organization()
                or_new.organization_exid = _.get("id", None)
                or_new.organization_name = _.get("tenant_name", None)
                or_new.organization_no = _.get("id", None)
                or_new.address = _.get("address", None)
                or_new.created_by = _.get("created_by", None)
                db.session.add(or_new)
            db.session.commit()
        return json({
            "ok": True,
            "message": "success",
            "objects": result
        })
async def response_debt_calculation(request=None, Model=None, result=None, **kw):
    if result is not None and "objects" in result:
        objects = to_dict(result["objects"])
        datas = []
        i =1
        page = request.args.get("page",None)
        results_per_page = request.args.get("results_per_page",None)
        if page is not None and results_per_page is not None and int(page) != 1:
            i = i + int(results_per_page)*int(page)
        for obj in objects:
            if obj is not None:
                obj_tmp = to_dict(obj)
                if obj_tmp['organization_type'] == "reseller":
                    list = db.session.query(func.sum(GoodsReciept.amount)).filter(and_(GoodsReciept.organization_id == obj_tmp['id'], GoodsReciept.tenant_id==obj_tmp['tenant_id'])).all()
                if obj_tmp['organization_type'] == "customer":
                    list = db.session.query(func.sum(PurchaseOrder.amount)).filter(and_(PurchaseOrder.workstation_id == obj_tmp['id'], PurchaseOrder.tenant_id==obj_tmp['tenant_id'])).all()
                payment = db.session.query(func.sum(Payment.amount)).filter(and_(Payment.organization_id == obj_tmp['id'], Payment.tenant_id==obj_tmp['tenant_id'])).all()
                result = 0
                if list[0][0] is not None and payment[0][0] is not None:
                    result = list[0][0] - payment[0][0]
                if payment[0][0] is not None and list[0][0] is None:
                    result =  payment[0][0]
                if payment[0][0] is None and list[0][0] is not None:
                    result = list[0][0]
                if payment[0][0] is None and list[0][0] is None:
                    result = 0

                obj_tmp["stt"] = i
                obj_tmp["amount"] = result
                i = i +1
                datas.append(obj_tmp)
        result = datas


        


sqlapimanager.create_api(Organization,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    preprocess=dict(GET_SINGLE=[auth_func],
    GET_MANY=[auth_func],
    POST=[auth_func],
    PUT_SINGLE=[auth_func],
    DELETE_SINGLE=[auth_func]),
    postprocess=dict(GET_SINGLE=[auth_func,response_debt_calculation],
    GET_MANY=[auth_func,response_debt_calculation],
    POST=[auth_func],
    PUT_SINGLE=[auth_func],
    DELETE_SINGLE=[auth_func]),
    collection_name='organization')


sqlapimanager.create_api(OrganizationStaff,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    preprocess=dict(GET_SINGLE=[auth_func],
    GET_MANY=[auth_func],
    POST=[auth_func],
    PUT_SINGLE=[auth_func],
    DELETE_SINGLE=[auth_func]),
    collection_name='organizationstaff')

@app.route('/api/v1/history_pay', methods=["POST"])
async def history_pay(request):
    data = request.json
    payment = db.session.query(Payment).filter(and_(Payment.organization_id == data['organization_id'], Payment.tenant_id==data['tenant_id'])).all()
    result = []
    count = len(payment)
    if payment is not None:
        for o in payment:
            list_o = to_dict(o)
            list_o['stt'] = count
            result.append(list_o)
            count = count-1
    return json(result)

@app.route('/api/v1/history_import_export', methods=["POST"])
async def history_pay(request):
    data = request.json
    if data['organization_type'] == "reseller":
        list = db.session.query(GoodsReciept).filter(and_(GoodsReciept.organization_id == data['organization_id'], GoodsReciept.tenant_id==data['tenant_id'])).all()
    if data['organization_type'] == "customer":
        list = db.session.query(PurchaseOrder).filter(and_(PurchaseOrder.workstation_id == data['organization_id'], PurchaseOrder.tenant_id==data['tenant_id'])).all()
    result = []
    count = len(list)
    if list is not None:
        for o in list:
            list_o = to_dict(o)
            list_o['stt'] = count
            result.append(list_o)
            count = count-1
    return json(result)

@app.route('/api/v1/debt_calculation', methods=["POST"])
async def debt_calculation(request):
    data = request.json
    if data['organization_type'] == "reseller":
        list = db.session.query(func.sum(GoodsReciept.amount)).filter(and_(GoodsReciept.organization_id == data['organization_id'], GoodsReciept.tenant_id==data['tenant_id'])).all()
    if data['organization_type'] == "customer":
        list = db.session.query(func.sum(PurchaseOrder.amount)).filter(and_(PurchaseOrder.workstation_id == data['organization_id'], PurchaseOrder.tenant_id==data['tenant_id'])).all()
    payment = db.session.query(func.sum(Payment.amount)).filter(and_(Payment.organization_id == data['organization_id'], Payment.tenant_id==data['tenant_id'])).all()
    result = 0
    if list[0][0] is not None and payment[0][0] is not None:
        result = list[0][0] - payment[0][0]
    if payment[0][0] is not None and list[0][0] is None:
        result =  payment[0][0]
    if payment[0][0] is None and list[0][0] is not None:
        result = list[0][0]
    if payment[0][0] is None and list[0][0] is None:
        result = 0
    return json(result)

