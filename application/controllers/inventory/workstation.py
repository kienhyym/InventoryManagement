from gatco.response import json,text, html
from application.extensions import sqlapimanager
from application.extensions import auth
from application.database import db
from application.server import app
from sqlalchemy import or_, and_
from datetime import datetime
import time
from application.models.inventory.workstation import *

from gatco_restapi.helpers import to_dict
from application.common.helper import pre_post_set_user_tenant_id, pre_get_many_user_tenant_id, get_tennat_id, current_user, auth_func


@app.route("/api/v1/get_workstation_tenant", methods=["POST"])
def get_workstation_tenant(request):
    data = request.json
    if data is not None:
        workstation = db.session.query(Workstation).filter(Workstation.tenant_id == data).all()
        if workstation is not None:
            arr = []
            for _ in workstation:
                arr.append(to_dict(_))
        return json(arr)
    return json({"message": "no record"})

sqlapimanager.create_api(Workstation,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    preprocess=dict(GET_SINGLE=[auth_func],
    GET_MANY=[auth_func],
    POST=[auth_func],
    PUT_SINGLE=[auth_func],
    DELETE_SINGLE=[auth_func]),
    collection_name='workstation')
