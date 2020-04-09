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
from application.models.user import *


from application.server import app
from gatco_restapi.helpers import to_dict
from sqlalchemy.sql.expression import except_
import time
from math import floor, ceil
from application.client import HTTPClient
from application.controllers.helper import *
from sqlalchemy import or_, and_, desc

from application.controllers.helper import current_user

def user_to_dict(user):
    obj = to_dict(user)
    if "password" in obj:
        del(obj["password"])
    if "salt" in obj:
        del(obj["salt"])
    return obj
@app.route('api/v1/current_user')
async def get_current_user(request):
    error_msg = None
    currentUser = await current_user(request)
    print("===============", currentUser)
    if currentUser is not None:
        user_info = to_dict(currentUser)
        user_info['tenants'] = [
            {"id":"tenants123",
            "image_url":"static/images/default-dist.jpeg"
        }
        ],
        user_info["current_tenant_id"]= "tenants123",
        user_info["display_name"]= "Kien"

        return json(user_info)
    else:
        error_msg = "Tài khoản không tồn tại"
    return json({
        "error_code": "USER_NOT_FOUND",
        "error_message":error_msg
    }, status = 520)
    
@app.route('api/v1/logout')
async def logout(request):
    try:
        auth.logout_user(request)
    except:
        pass
    return json({})


@app.route('/api/v1/login', methods=['POST', 'OPTIONS'])
async def login(request):
    data = request.json
    print("==================data", data)
    username = data['username']
    password = data['password']
    print("==================USER NAME", username)
    print("==================PASSWORD", password)
    user = db.session.query(User).filter(or_(User.email == username, User.phone_number == username)).first()


    print("==================", user)
    if (user is not None) and auth.verify_password(password, user.password):
        
        auth.login_user(request, user)
        result = user_to_dict(user)
        return json(result)
        
    return json({"error_code":"LOGIN_FAILED","error_message":"Tài khoản hoặc mật khẩu không đúng"}, status=520)

@app.route('/api/v1/changepassword', methods=['POST'])
async def changepassword(request):
    data = request.json
    print("==================data", data)
    password_old = data['password_old']
    password_new = data['password_new']
    current_uid = data['user_id']

    print("==================PASSWORD_OLD", password_old)
    print("==================PASSWORD_NEW", password_new)
    print("===================current_uid============", current_uid)
    user = db.session.query(User).filter(or_(User.id == current_uid)).first()

    if current_uid and password_new is not None and auth.verify_password(password_old, user.password):
        print("==============USER INFO", auth.verify_password(password_old, user.password))

        user_info = db.session.query(User).filter(User.id == current_uid).first()
        print("==============USER INFO", user_info)
        if user_info is not None:
            user_info.password = auth.encrypt_password(password_new)

            db.session.commit()
            return json({})
()

@app.route('/api/v1/register', methods=["POST"])
def register(request):
    data = request.json
    print("===================", data)
    user = db.session.query(User).filter(or_(User.email==data["email"], User.phone_number==data["phone_number"])).first()
    if user is not None:
        return json({
            "error_code": "USER_EXISTED",
            "error_message": "Email hoặc phone đã tồn tại"
            }, status = 520)
    else:
        new_user = User()
        new_user.name = data["name"]
        new_user.email = data["email"]
        new_user.phone_number = data["phone_number"]
        # new_user.user_image = data["user_image"]
        new_user.password = auth.encrypt_password(data["password"])
        new_user.rank = data["rank"]
        db.session.add(new_user)
        db.session.commit()
        result = user_to_dict(new_user)
        return json(result)


@app.route('/api/v1/newpassword', methods=['POST'])
async def changepassword(request):
    data = request.json
    id = data['id']
    password_new = data['password']
    user_info = db.session.query(User).filter(User.id == id).first()
    user_info.password = auth.encrypt_password(password_new)
    db.session.commit()
    return json({})


    
@app.route('api/v1/tokenuser', methods=["POST"])
def tokenuser(request):
    token = random.randint(10000, 99999)
    print ("===========randum============",token)
    data = request.json
    email = data['email']
    user_info = db.session.query(User).filter(User.email == email).first()

    if user_info is not None:
        print("user_info", email)

        email_info = {
            "from": {
                "id": "sothietbi@gmail.com",
                "password": "kocopass"
            },
            "to": email,
            "message": "Mã token của bạn là" + str(token),
            "subject": "Yêu cầu đổi mật khẩu"
        }
        url = "https://upstart.vn/services/api/email/send"

        re = requests.post(url=url, data=json_load.dumps(email_info))
    return json({
        "ok": token,
        'id':to_dict(user_info)['id']
    })






async def prepost_user(request=None, data=None, Model=None, **kw):
    currentUser = await current_user(request)
    if (currentUser is None):
        return json({"error_code":"SESSION_EXPIRED","error_message":"Hết phiên làm việc, vui lòng đăng nhập lại!"}, status=520)

    if "name" not in data or data['name'] is None or "password" not in data or data['password'] is None:
        return json({"error_code":"PARAMS_ERROR","error_message":"Tham số không hợp lệ"}, status=520)
    if ('phone_number' in data) and ('email' in data) :
        user = db.session.query(User).filter((User.phone_number == data['phone_number']) | (User.email == data['email'])).first()
        if user is not None:
            if user.phone_number == data['phone_number']:
                return json({"error_code":"USER_EXISTED","error_message":'Số điện thoại đã được sử dụng, vui lòng chọn lại'},status=520)
            else:
                return json({"error_code":"USER_EXISTED","error_message":'Email đã được sử dụng trong tài khoản khác'},status=520)

    
    salt = generator_salt()
    data['salt'] = salt
    password = data['password']
    data['password'] = auth.encrypt_password(password, salt)
    data['active']= True
    
async def preput_user(request=None, data=None, Model=None, **kw):
    currentUser = await current_user(request)
    if (currentUser is None):
        return json({"error_code":"SESSION_EXPIRED","error_message":"Hết phiên làm việc, vui lòng đăng nhập lại!"}, status=520)
    
    if "name" not in data or data['name'] is None or "id" not in data or data['id'] is None:
        return json({"error_code":"PARAMS_ERROR","error_message":"Tham số không hợp lệ"}, status=520)
    if ('phone_number' in data) and ('email' in data) :
        check_user = db.session.query(User).filter((User.phone_number == data['phone_number']) | (User.email == data['email'])).filter(User.id != data['id']).first()
        if check_user is not None:
            if check_user.phone_number == data['phone_number']:
                return json({"error_code":"USER_EXISTED","error_message":'Số điện thoại đã được sử dụng, vui lòng chọn lại'},status=520)
            else:
                return json({"error_code":"USER_EXISTED","error_message":'Email đã được sử dụng trong tài khoản khác'},status=520)
    
    user = db.session.query(User).filter(User.id == data['id']).first()
    if user is None:
        return json({"error_code":"NOT_FOUND","error_message":"Không tìm thấy tài khoản người dùng"}, status=520)

    if currentUser.has_role("Giám Đốc") or str(currentUser.id) == data['id']:
        password = data['password']
        data['password'] = auth.encrypt_password(password, user.salt)
    else:
        return json({"error_code":"PERMISSION_DENY","error_message":"Không có quyền thực hiện hành động này"}, status=520)

async def predelete_user(request=None, data=None, Model=None, **kw):
    currentUser = await current_user(request)
    if (currentUser is None):
        return json({"error_code":"SESSION_EXPIRED","error_message":"Hết phiên làm việc, vui lòng đăng nhập lại!"}, status=520)
    if currentUser.has_role("Giám Đốc") == False:
        return json({"error_code":"PERMISSION_DENY","error_message":"Không có quyền thực hiện hành động này"}, status=520)


async def response_getmany_stt(request=None, Model=None, result=None, **kw):
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
                obj_tmp["stt"] = i
                i = i + 1
                datas.append(obj_tmp)
        result = datas



sqlapimanager.create_api(User, max_results_per_page=1000000,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    # exclude_columns= ["password","salt","active"],
    preprocess=dict(GET_SINGLE=[], GET_MANY=[], POST=[], PUT_SINGLE=[]),
    postprocess=dict(POST=[], PUT_SINGLE=[], DELETE_SINGLE=[], GET_MANY =[]),
    collection_name='user')


sqlapimanager.create_api(Role, max_results_per_page=1000000,
    methods=['GET', 'POST', 'DELETE', 'PUT'],
    url_prefix='/api/v1',
    preprocess=dict(GET_SINGLE=[], GET_MANY=[], POST=[], PUT_SINGLE=[]),
    postprocess=dict(POST=[], PUT_SINGLE=[], DELETE_SINGLE=[], GET_MANY =[]),
    collection_name='role')
    
