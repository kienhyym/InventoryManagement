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
async def get_item(request):
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

async def get_unit_exchange_name(request=None, Model=None, result=None, **kw):
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
                if obj_tmp['unit'] is not None:
                    if obj_tmp['unit']['unit_exchange'] is not None:
                        unit = db.session.query(Unit.name).filter(and_(Unit.id == obj_tmp['unit']['unit_exchange'] )).first()
                        obj_tmp["unit_exchange_name"] = unit[0]
                obj_tmp["stt"] = i
                # obj_tmp["unit_name"] = unit
                i = i + 1
                datas.append(obj_tmp)
        result = datas

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
    postprocess=dict(POST=[], PUT_SINGLE=[], DELETE_SINGLE=[], GET_MANY =[get_unit_exchange_name]),
    collection_name='item')

sqlapimanager.create_api(Recipe, max_results_per_page=1000000,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    # preprocess=dict(GET_SINGLE=[], GET_MANY=[], POST=[], PUT_SINGLE=[]),
    preprocess=dict(GET_SINGLE=[], GET_MANY=[], POST=[], PUT_SINGLE=[]),
    postprocess=dict(POST=[], PUT_SINGLE=[], DELETE_SINGLE=[], GET_MANY =[]),
    collection_name='recipe')



@app.route("/api/v1/load_item_materials_dropdown", methods=["POST"])
async def load_item_materials_dropdown(request):
    data = request.json
    tenant_id = data.get("tenant_id", None)
    item = db.session.query(Item).filter(and_(Item.tenant_id==tenant_id, Item.item_type == "material")).all()
    result = []
    if item is not None:
        for _ in item:
            items = to_dict(_)    
            unitItem = db.session.query(Unit.name,Unit.unit_exchange).filter(Unit.id==to_dict(_)['unit_id']).first()
            items['unit_name'] = str(unitItem[0])
            if unitItem[1] is not None:
                unitExchange = db.session.query(Unit.name).filter(Unit.id == str(unitItem[1])).first()
                items['unit_exchange'] = unitExchange[0]
            else:
                items['unit_exchange'] = str(unitItem[0])
            result.append(items)
    return json(result)


@app.route("/api/v1/create_recipe", methods=["POST"])
async def create_recipe(request):
    data = request.json
    for _ in data:
        new_item = Recipe()
        new_item.item_id = _["item_id"]
        new_item.tenant_id = _["tenant_id"]
        new_item.quantity = _["quantity"]
        new_item.item_exchange_id = _["item_exchange_id"]
        db.session.add(new_item)
        db.session.commit()
    return json({"message":"create success"})


@app.route('/api/v1/update_recipe', methods=["POST"])
async def update_recipe(request):
    data = request.json
    for _ in data:
        recipe = db.session.query(Recipe).filter(Recipe.id == _['id']).first()
        recipe.quantity = _['quantity']
        db.session.commit()
    return json({"message": "Update Success"})

@app.route('/api/v1/delete_recipe', methods=["POST"])
async def delete_recipe(request):
    list_id = request.json
    for _ in list_id:
        itemBalances = db.session.query(Recipe).filter(Recipe.id == _).first()
        db.session.delete(itemBalances)
        db.session.commit()
    return json({"message": "Delete Success"})


@app.route("/api/v1/recipe_detail", methods=["POST"])
async def recipe_detail(request):
    data = request.json
    result = []
    if data is not None:
        for _ in data:
            items = to_dict(_)   
            item = db.session.query(Item.item_name,Item.unit_id,Item.purchase_cost).filter(Item.id == items['item_exchange_id']).first()
            unitName = db.session.query(Unit.name,Unit.unit_exchange).filter(Unit.id == str(item[1])).first()
            unitNameExchange = db.session.query(Unit.name).filter(Unit.id == unitName[1]).first()

            items['name'] = item[0]
            items['unit_name'] = unitName[0]
            if unitNameExchange is not None:
                items['unit_exchange'] = unitNameExchange[0]
            else:
                items['unit_exchange'] = unitName[0]
            items['purchase_cost'] = item[2]
            result.append(items)
    return json(result)
