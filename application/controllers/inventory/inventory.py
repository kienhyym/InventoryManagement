import string
import random
import uuid
import base64, re
import binascii
import aiohttp
import requests
import json as json_load

import copy
from gatco.response import json, text, html
from application.extensions import sqlapimanager
from application.extensions import auth
from application.database import db, redisdb
from application.models.inventory.unit import *
from application.models.inventory.contact import *




from application.server import app
from gatco_restapi.helpers import to_dict
from sqlalchemy.sql.expression import except_
import time
from math import floor, ceil
from application.client import HTTPClient
from application.controllers.helper import *
from sqlalchemy import or_, and_, desc
# from application.components.activitylog.model import ActivityLog
from application.controllers.helper import current_user






@app.route("/api/v1/item/sync/account", methods=["OPTIONS", "POST"])
async def sync_item(request):
    data = request.json
    if data is None:
        return json({
            "error_code": ERROR_CODE['INPUT_DATA_ERROR'],
            "error_message": ERROR_MSG['INPUT_DATA_ERROR']
        }, status=STATUS_CODE['ERROR'])

    objmap = {
        "item": Item,
        "workstation": Workstation,
        "warehouse": Warehouse
    }

    if 'url' in data and data['url'] is not None and (data["object"] in objmap):
        headers = {
            'content-type': 'application/json'
        }

        response = requests.get(data['url'], headers=headers)
        if response.status_code == 200:
            items = response.json()
            
            OBJ = objmap[data["object"]]
            obj = db.session.query(OBJ).filter(and_(OBJ.id == items["id"], OBJ.tenant_id == items["tenant_id"])).first()

            if obj is None:
                insert = True
                obj = OBJ()

            for key in items:
                if hasattr(obj, key):
                    setattr(obj, key, items[key])

            if insert:
                db.session.add(obj)
            
            db.session.commit()
            return json({
                    "ok": True,
                    "message": "CREATE " + data["object"].upper() + " SUCCESS"
                })



async def get_unit_name(request=None, Model=None, result=None, **kw):
    if result is not None and "objects" in result:
        objects = to_dict(result["objects"])
        datas = []
        i = 1
        page = request.args.get("page",None)
        results_per_page = request.args.get("results_per_page",None)
        currentUser = await current_user(request)
        if currentUser is None:
            return json({"error_code":"PERMISSION_DENY","error_message":"Hết phiên làm việc!"}, status=520)
        if page is not None and results_per_page is not None and int(page) != 1:
            i = i + int(results_per_page)*int(page)
        for obj in objects:
            if obj is not None:
                obj_tmp = to_dict(obj)
                unit = db.session.query(Unit.name).filter(and_(Unit.id==to_dict(obj)['unit_exchange'])).first()
                obj_tmp["stt"] = i
                obj_tmp["unit_name"] = unit
                i = i + 1
                datas.append(obj_tmp)
        result = datas

def get_singer_unit_name(request=None, Model=None, result=None, **kw):
    # if result is not None and "objects" in result:
    print ('_____________________--------------------------', result)
        # objects = to_dict(result["objects"])
        # data = []
        # i = 1
        # currentUser = await current_user(request)
        # if currentUser is None:
        #     return json({"error_code":"PERMISSION_DENY","error_message":"Hết phiên làm việc!"}, status=520)
        # print ('_____________________',objects)
        # result = data


sqlapimanager.create_api(Unit, max_results_per_page=1000000,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    # preprocess=dict(GET_SINGLE=[], GET_MANY=[], POST=[], PUT_SINGLE=[]),
    preprocess=dict(GET_SINGLE=[], GET_MANY=[], POST=[], PUT_SINGLE=[]),
    postprocess=dict(POST=[], PUT_SINGLE=[], DELETE_SINGLE=[], GET_MANY =[get_unit_name],GET_SINGLE=[get_singer_unit_name]),
    collection_name='unit')

sqlapimanager.create_api(Contact, max_results_per_page=1000000,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    # preprocess=dict(GET_SINGLE=[], GET_MANY=[], POST=[], PUT_SINGLE=[]),
    preprocess=dict(GET_SINGLE=[], GET_MANY=[], POST=[], PUT_SINGLE=[]),
    postprocess=dict(POST=[], PUT_SINGLE=[], DELETE_SINGLE=[], GET_MANY =[]),
    collection_name='contact')


@app.route("/api/v1/load_unit", methods=["POST"])
async def load_unit(request):
    data = request.json
    tenant_id = data.get("tenant_id", None)
    units = db.session.query(Unit).filter(and_(Unit.tenant_id==tenant_id)).all()
    result = []
    if units is not None:
        for _ in units:
            unit = to_dict(_)    
            result.append(unit)
    return json(result)