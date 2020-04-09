import string, time
import random
import uuid
import base64, re
import binascii
# import aiohttp
import requests
import ujson
import copy
from math import floor
import json as json_load

from gatco.response import json, text, html
from application.extensions import sqlapimanager
# from application.models import User, Permission, Role, Notify,
from application.models.user import User, Permission, Role
from application.models.notify import Notify, NotifyUser

from application.extensions import auth
# from application.database import db, redisdb_firebase
from application.server import app
from sqlalchemy import or_, and_, desc, asc
from gatco_restapi.helpers import to_dict
from application.common.helper import current_user
from application.common.constants import STATUS_CODE, ERROR_CODE, ERROR_MSG



async def apply_user_filter(request=None, search_params=None, **kw):
    uid = await current_user(request)
    if uid is not None:
        list_user_notify = db.session.query(NotifyUser).filter(NotifyUser.user_id == uid).order_by(desc(NotifyUser.updated_at)).limit(100)
        if list_user_notify is None or list_user_notify:
            return json({"objects":[]})
        arr_uid = []
        for uid in list_user_notify:
            arr_uid.append(uid["id"])

        search_params["filters"] = {"id": {"$in": arr_uid}}
    else:
        return json({"error_code": "SESSION_EXPIRED", "error_message": "Hết phiên làm việc, vui lòng đăng nhập lại"}, status=520)


@app.route('/api/v1/notify/read-all')
async def read_all(request):
    uid = await current_user(request)
    if uid is None:
        return json({"error_code": "SESSION_EXPIRED", "error_message": "Hết phiên làm việc, vui lòng đăng nhập lại"}, status=520)
    else:
        notify_user = db.session.query(NotifyUser).\
        filter(and_(NotifyUser.user_id == uid["id"])).order_by(desc(NotifyUser.updated_at)).limit(100)

        if notify_user is not None:
            for nf in notify_user:
                notify = to_dict(nf.notify)
                notify["read_at"] = nf.read_at
                if nf.read_at is None:
                    nf.read_at = floor(time.time())

        db.session.commit()
        return json(None)

@app.route('/api/v1/notify/unread', methods=['POST'])
async def read_notify(request):
    uid = await current_user(request)
    if uid is None:
        return json({"error_code": "SESSION_EXPIRED", "error_message": "Hết phiên làm việc, vui lòng đăng nhập lại"}, status=520)
    else:
        arrNotify = []
        notify_user = db.session.query(NotifyUser).\
        filter(and_(NotifyUser.user_id == uid["id"])).order_by(desc(NotifyUser.created_at)).limit(100)
        # notify_user = db.session.query(NotifyUser).order_by(desc(NotifyUser.updated_at)).limit(100)

        if notify_user is not None:
            for nf in notify_user:
                notify = to_dict(nf.notify)
                notify["read_at"] = nf.read_at

                # print("===============", notify)
                arrNotify.append(copy.deepcopy(notify))
                # if nf.read_at is None:
                    # nf.read_at = floor(time.time())
        db.session.commit()
        return json({"objects": arrNotify})

@app.route("/api/v1/notify/read", methods=["POST"])
async def unread_notify(request):
    data = request.json

    # print("ntify _ id ", data["notify_id"])
    uid = await current_user(request)
    if uid is None:
        return json({"error_code": "SESSION_EXPIRED", "error_message": "Hết phiên làm việc, vui lòng đăng nhập lại"}, status=520)
    else:
        notify_user = db.session.query(NotifyUser).filter(NotifyUser.notify_id==data["notify_id"]).first()

        # print("=================>", notify_user)
        if notify_user is not None:
            notify_user.read_at = floor(time.time())
            db.session.commit()

            return json(to_dict(notify_user))

        else:
            return json({
                "ok": False,
                "message": "error",
            }, status = 520)


@app.route('/api/v1/notify/check', methods=['GET'])
async def check_notify(request):
    uid = await current_user(request)
    if uid is None:
        return json({"error_code": "SESSION_EXPIRED", "error_message": "Hết phiên làm việc, vui lòng đăng nhập lại"}, status=520)
    else:
        count = 0
        notify_user = db.session.query(NotifyUser).\
        filter(and_(NotifyUser.user_id == uid["id"], NotifyUser.read_at == None)).count()
        if notify_user is not None:
            count = notify_user
    return json({"error_message": "successful","data":count})


async def send_notify_single(user_id, title, content, record_type, action, id_url):
# type_action
    if(title is None or title == ""):
        title = "Thông báo"
    notify_record = Notify()
    notify_record.title = title
    notify_record.content = content
    notify_record.type = record_type
    notify_record.action = None

    notify_record.url = record_type+"/model?id="+str(id_url)
    db.session.add(notify_record)
    db.session.flush()

    firebase_token = redisdb_firebase.get("notify_token:" + str(user_id))
    print("notify_record=====",to_dict(notify_record), "user_id====",user_id)
    if firebase_token is not None:
        firebase_token = firebase_token.decode('utf8')
        notify_user = NotifyUser()
        notify_user.user_id = user_id
        notify_user.notify_id = notify_record.id
        notify_user.notify_at = floor(time.time())
        notify_user.read_at = None
        db.session.add(notify_user)
        db.session.commit()
        await send_firebase_notify([firebase_token], title, to_dict(notify_record))


async def send_notify_multiple(user_id, title, content, record_type, action, id_url):
# type_action
    if(title is None or title == ""):
        title = "Thông báo"
    notify_record = Notify()
    notify_record.title = title
    notify_record.content = content
    notify_record.type = record_type
    notify_record.action = None

    notify_record.url = record_type+"/model?id="+str(id_url)
    db.session.add(notify_record)
    db.session.flush()


    list_key = []
    for key in redisdb_firebase.scan_iter():
        for _ in user_id:

            parseKey = key.decode("utf8")
            if parseKey == _:
                print("================", parseKey)
                list_key.append(redisdb_firebase.get(key).decode("utf8"))

    print("list_key", list_key)
    if list_key is not None:
        for _ in user_id:


            notify_user = NotifyUser()
            notify_user.user_id = _
            notify_user.notify_id = notify_record.id
            notify_user.notify_at = floor(time.time())
            notify_user.read_at = None
            db.session.add(notify_user)
            db.session.commit()
        await send_firebase_notify(list_key, title, to_dict(notify_record))

        return json({
            "ok": True,
            "message": "Send success"
        })


# @app.route('/api/v1/set_notify_token', methods=['POST'])
# async def set_notify_token(request):
#     uid = await current_user(request)
#     if uid is None:
#         return json({
#             "error_code": "USER_NOT_LOGIN",
#             "error_message": None
#         }, status=520)

#     data = request.json
#     token = data.get("data", None)
#     print("----------------ID------------", token)

#     redisdb_firebase.set(str(uid["id"]), token)

#     return json({
#         "ok": True,
#         "message": "set token success"
#     })


@app.route('/api/v1/send-notify-multiple', methods=['POST'])
async def test_notify(request):
    uid = await current_user(request)
    if uid is None:
        return json({
            "error_code": "USER_NOT_LOGIN",
            "error_message": None
        }, status=520)

    data = request.json
    list_user = data.get("list_user", None)
    delivery_no = data.get("delivery_no", None)

    print("================", delivery_no)
    print("================", data["delivery_id"])

    await send_notify_multiple(list_user, "Mã phiếu : " + str(delivery_no), "Có phiếu xuất hàng mới mau đến xem ngay!", "deliverynote", "confirm", data.get("delivery_id", None))
    return json({
        "ok": True,
        "message": "success"
    })



@app.route('/api/v1/send-notify-multiple-accountant', methods=['POST'])
async def test_notify(request):
    uid = await current_user(request)
    if uid is None:
        return json({
            "error_code": "USER_NOT_LOGIN",
            "error_message": None
        }, status=520)

    data = request.json
    list_user = data.get("list_user", None)
    no = data.get("no", None)

    await send_notify_multiple(list_user, "Mã phiếu : " + str(no), "Có phiếu mua hàng mới mau đến xem ngay!!", "purchaseorder", "confirm", data.get("id", None))
    return json({
        "ok": True,
        "message": "success"
    })


async def send_firebase_notify(firebase_tokens, title, body):
    server_key = app.config.get("FIREBASE_SERVER_KEY")
    print("send firebase notify", server_key)
    headers = {
        "Content-Type": "application/json",
        "Authorization": "key=" + server_key
    }

    url = "https://fcm.googleapis.com/fcm/send"

    # if "title" not in title:
    #     data["title"] = body
    params = {
        "notification": {
            "subtitle": "QUẢN LÝ KHO",
            "title": title,
            "body": body["content"],
            "sound": "default",
            "color": "default",
            "icon": "default"
        },
        "registration_ids": firebase_tokens  # this is list token [token]
    }

    print("send_firebase_notify param: ", params)

    response = requests.post(url, data=json_load.dumps(params), headers=headers)
    # print("resssss",to_dict(response))

    if response == 200:
        await response.json()

    else:
        return json({
            "ok": False,
            "message": "error"
        })

    # async with aiohttp.ClientSession(headers=fb_headers, json_serialize=ujson.dumps) as session:
    #     async with session.post(url, json=params) as response:
    #         # if response.status == 200:
    #         await response.json()


sqlapimanager.create_api(Notify, max_results_per_page=1000000,
                         methods=['GET', 'POST', 'DELETE', 'PUT'],
                         url_prefix='/api/v1',
                         preprocess=dict(GET_SINGLE=[], GET_MANY=[], POST=[], PUT_SINGLE=[]),
                        #  postprocess=dict(POST=[postprocess_send_notify_cosoKCB]),
                         collection_name='notify')

sqlapimanager.create_api(Permission, max_results_per_page=1000000,
                         methods=['GET', 'POST', 'DELETE', 'PUT'],
                         url_prefix='/api/v1',
                         preprocess=dict(GET_SINGLE=[], GET_MANY=[apply_user_filter], POST=[], PUT_SINGLE=[]),
                         postprocess=dict(POST=[]),
                         collection_name='permission')
