import string, time
import random
import uuid
import base64, re
import binascii
import aiohttp
import ujson
from math import floor

from gatco.response import json, text, html
from application.extensions import sqlapimanager
from application.models.user import *
from application.extensions import auth
from application.database import db, redisdb
from application.server import app
from gatco_restapi.helpers import to_dict
from application.controllers.helper import current_uid, current_user


async def apply_user_filter(request=None, search_params=None, **kw):
    currentUser = await current_user(request)
    if currentUser is not None:
        search_params["filters"] = {"user_id": {"$eq": str(currentUser.id)}}
    else:
        return json({"error_code": "USER_NOT_FOUND", "error_message": ""}, status=520)


async def send_notify_single(user_id, notify_data):
#     title = db.Column(String, index=True)
#     content = db.Column(String)
#     type = db.Column(String(20))  # text/image/video
#     url = db.Column(String)
#     action = db.Column(JSONB())
#     notify_condition = db.Column(JSONB())

    data = request.json
    firebase_token = redisdb.get("notify_token:" + user_id)
    if firebase_token is not None:
        firebase_token = firebase_token.decode('utf8')

async def postprocess_send_notify_cosoKCB(request=None, Model=None, result=None, **kw):
    notify_condition = result["notify_condition"]
    if notify_condition is not None:
        notify_user_list = []
        for condition in notify_condition:
            user = []
            if condition.get("notify_type", "") == "TO_ALL":
                user = db.session.query(User).has_role("CoSoKCB").all()

            if condition.get("notify_type", "") == "TO_PHONE":
                phone_list = condition.get("notify_phone_number", [])
                for phone in phone_list:
                    user = db.session.query(User).filter(User.phone_number == phone).first()
                    user = user.append(user)

            for user in user:
                notify_user = NotifyUser()
                notify_user['user_id'] = str(user.id)
                notify_user['notify_id'] = result["id"]
                notify_user['notify_at'] = floor(time.time())
                db.session.add(notify_user)
                # notify user
                user_notify_token = redisdb.get("notify_token:" + str(user.id))

                if user_notify_token is not None:
                    user_notify_token = user_notify_token.decode('utf8')
                    notify_user_list.append(user_notify_token)
            db.session.commit()
        noti_data = {
            "push_type": "NORMAL",
            "notify_id": result["id"]
        }

        await send_firebase_notify(notify_user_list, result["title"], noti_data)


# sqlapimanager.create_api(Notify, max_results_per_page=1000000,
#                          methods=['GET', 'POST', 'DELETE', 'PUT'],
#                          url_prefix='/api/v1',
#                          preprocess=dict(GET_SINGLE=[], GET_MANY=[], POST=[], PUT_SINGLE=[]),
#                          postprocess=dict(POST=[postprocess_send_notify_cosoKCB]),
#                          collection_name='notify')

# sqlapimanager.create_api(NotifyUser, max_results_per_page=1000000,
#                          methods=['GET', 'POST', 'DELETE', 'PUT'],
#                          url_prefix='/api/v1',
#                          preprocess=dict(GET_SINGLE=[], GET_MANY=[apply_user_filter], POST=[], PUT_SINGLE=[]),
#                          postprocess=dict(POST=[]),
#                          collection_name='notify_user')


@app.route('/api/v1/send_notify', methods=['POST'])
async def send_notify(request):
    data = request.json
    phone_number = data.get("phone_number", None)
    if phone_number is not None:
        user = db.session.query(User).filter(User.phone_number == phone_number).first()
        print("user: ", user)
        if user is not None:
            firebase_token = redisdb.get("notify_token:" + str(user.id))
            print("firebase_token: ", firebase_token)
            if firebase_token is not None:
                firebase_token = firebase_token.decode('utf8')
                await send_firebase_notify([firebase_token], data.get("title", "Test"), data)

    return json({})


@app.route('/api/v1/set_notify_token', methods=['POST'])
async def set_notify_token(request):
    currentUser = await current_user(request)
    if currentUser is None:
        return json({
            "error_code": "USER_NOT_LOGIN",
            "error_message": None
        }, status=520)

    data = request.json
    token = data.get("data", None)
    redisdb.set("notify_token:" + str(currentUser.id), token)

    return json({})


@app.route('/api/v1/test_notify', methods=['POST'])
async def test_notify(request):
    currentUser = await current_user(request)
    if currentUser is None:
        return json({
            "error_code": "USER_NOT_LOGIN",
            "error_message": None
        }, status=520)
 
    data = request.json
    firebase_token = redisdb.get("notify_token:" + str(currentUser.id))
    if firebase_token is not None:
        firebase_token = firebase_token.decode('utf8')

#         data = {
#                   "data": {
#                         "push_type": "UPDATE_TRANSACTION",
#                         "transaction_hash": transaction_hash,
#                         "title": body
#                   },
#                   "notification"  : {
#                         "body": body,
#                         "sound": "bell.mp3"
#                   },
#                   "registration_ids": [from_token]
#             }

        await send_firebase_notify([firebase_token], data.get("title", "Thông báo"), data)

        return json({})
    else:
        return json({"error_code": "KEY_NOT_SET", "error_message": ""}, status=520)


async def send_firebase_notify(firebase_tokens, body, data):
    server_key = app.config.get("FIREBASE_SERVER_KEY")
    fb_headers = {
        "Content-Type": "application/json",
        "Authorization": "key=" + server_key
    }

    url = "https://fcm.googleapis.com/fcm/send"

    if "title" not in data:
        data["title"] = body

    params = {
        "data": data,
        "notification": {
            "body": body,
            "sound": "bell.mp3"
        },
        "registration_ids": firebase_tokens  # this is list token [token]
    }

    print("send_firebase_notify param: ", params)

    async with aiohttp.ClientSession(headers=fb_headers, json_serialize=ujson.dumps) as session:
        async with session.post(url, json=params) as response:
            # if response.status == 200:
            await response.json()
