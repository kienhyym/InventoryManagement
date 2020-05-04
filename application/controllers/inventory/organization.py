from gatco.response import json,text, html
from application.extensions import sqlapimanager
from application.extensions import auth
from application.database import db
from application.server import app
from sqlalchemy import or_, and_
from datetime import datetime
import time
from application.models.inventory.organization import *
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


sqlapimanager.create_api(Organization,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    preprocess=dict(GET_SINGLE=[auth_func],
    GET_MANY=[auth_func],
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

