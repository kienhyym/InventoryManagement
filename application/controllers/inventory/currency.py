from gatco.response import json,text, html
from application.extensions import sqlapimanager
from application.extensions import auth
from application.database import db
from application.server import app
from sqlalchemy import or_, and_
from datetime import datetime
import time
from application.models.inventory.currency import *
from gatco_restapi.helpers import to_dict
from application.common.helper import pre_post_set_user_tenant_id, pre_get_many_user_tenant_id, get_tennat_id, current_user, auth_func










@app.route('/api/v1/get_all_curency', methods=["POST"])
def get_all_curency(request):
    data = request.json
    print ('_________________________',data["tenant_id"])
    curency = db.session.query(Currency).filter(Currency.tenant_id == data["tenant_id"]).all()
    result = []
    if curency is not None:
        for c in curency:
            list_currency = to_dict(c)
            result.append(list_currency)
    return json(result)

sqlapimanager.create_api(Currency,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    preprocess=dict(GET_SINGLE=[auth_func],
    GET_MANY=[auth_func],
    POST=[auth_func],
    PUT_SINGLE=[auth_func],
    DELETE_SINGLE=[auth_func]),
    collection_name='currency')
