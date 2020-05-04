from gatco.response import json,text, html
from application.extensions import sqlapimanager
from application.extensions import auth
from application.database import db
from application.server import app
from sqlalchemy import or_, and_
from datetime import datetime
import time
from application.models.inventory.activitylog import *

from gatco_restapi.helpers import to_dict
from application.common.helper import pre_post_set_user_tenant_id, pre_get_many_user_tenant_id, get_tennat_id, current_user, auth_func

@app.route("/api/v1/activitylog/save", methods=["POST"])
def save_log(request):
    data = request.json
    action = data.get('action', None)
    actor = data.get('actor', None)
    workstation_id = data.get('workstation_id', None)
    workstation_name = data.get('workstation_name', None)
    tenant_id = data.get('tenant_id', None)
    user_id = data.get('user_id', None)
    items = data.get('items', [])
    object_type = data.get('object_type', None)
    object_no = data.get('object_no', None)
    created_at = data.get('created_at', None)
    new_log = ActivityLog()
    new_log.action = action
    new_log.actor = actor
    new_log.workstation_id = workstation_id
    new_log.workstation_name = workstation_name
    new_log.tenant_id = tenant_id
    new_log.user_id = user_id
    new_log.items = items
    new_log.object_no = object_no
    new_log.object_type = object_type
    new_log.created_at = created_at

    db.session.add(new_log)
    db.session.commit()

    return json({
        "ok": True,
        "message": "SAVE LOG SUCCESS"
    })

@app.route("/api/v1/activitylog/get", methods=["POST"])
def get_activity_log(request):

    data = request.json
    log = db.session.query(ActivityLog).filter(ActivityLog.tenant_id == data.get('tenant_id', None)).limit(100).all()
    if log is not None:
        result = []
        for _ in log:
            result.append(to_dict(_))
        
        return json(result)


sqlapimanager.create_api(ActivityLog,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    preprocess=dict(GET_SINGLE=[auth_func],
    GET_MANY=[auth_func],
    POST=[auth_func],
    PUT_SINGLE=[auth_func],
    DELETE_SINGLE=[auth_func]),
    collection_name='activitylog')
