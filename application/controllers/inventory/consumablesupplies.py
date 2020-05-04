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

from application.models.inventory.consumablesupplies import *

from application.server import app
from gatco_restapi.helpers import to_dict
from sqlalchemy.sql.expression import except_
import time
from math import floor, ceil
from application.client import HTTPClient
from application.controllers.helper import *
from sqlalchemy import or_, and_, desc

@app.route("/api/v1/item/get", methods=["POST"])
async def get_all_item(request):
    data = request.json
    tenant_id = data.get("tenant_id", None)
    item = db.session.query(Item).filter(and_(Item.tenant_id==tenant_id), Item.deleted==False).all()
    result = []
    if item is not None:
        for _ in item:
            items = to_dict(_)
            result.append(items)
    return json(result)

@app.route("/api/v1/category/get")
async def get_category(request):
    # uid = await current_user(request)
    tenant_id = await get_tennat_id(request)
    category = db.session.query(ItemCategory).filter(ItemCategory.tenant_id==tenant_id).all()
    if category is not None:
        result = []
        for _ in category:
            list_ = to_dict(_)
            result.append(list_)
        return json(result)


sqlapimanager.create_api(ItemCategory, max_results_per_page=1000000,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    # preprocess=dict(GET_SINGLE=[], GET_MANY=[], POST=[], PUT_SINGLE=[]),
    preprocess=dict(GET_SINGLE=[], GET_MANY=[], POST=[], PUT_SINGLE=[]),
    postprocess=dict(POST=[], PUT_SINGLE=[], DELETE_SINGLE=[], GET_MANY =[]),
    collection_name='itemcategory')


sqlapimanager.create_api(PriceList, max_results_per_page=1000000,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    # preprocess=dict(GET_SINGLE=[], GET_MANY=[], POST=[], PUT_SINGLE=[]),
    preprocess=dict(GET_SINGLE=[], GET_MANY=[], POST=[], PUT_SINGLE=[]),
    postprocess=dict(POST=[], PUT_SINGLE=[], DELETE_SINGLE=[], GET_MANY =[]),
    collection_name='pricelist')


sqlapimanager.create_api(Item, max_results_per_page=1000000,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    # preprocess=dict(GET_SINGLE=[], GET_MANY=[], POST=[], PUT_SINGLE=[]),
    preprocess=dict(GET_SINGLE=[], GET_MANY=[], POST=[], PUT_SINGLE=[]),
    postprocess=dict(POST=[], PUT_SINGLE=[], DELETE_SINGLE=[], GET_MANY =[]),
    collection_name='item')