import string
import random
import uuid
import base64, re
import binascii
import aiohttp
import os, sys
import aiofiles
import base64
import json as load_json
import copy
from gatco.response import json, text, html
from application.extensions import sqlapimanager
from application.database import db, redisdb
from application.models.user import *
from datetime import datetime
from application.server import app
from gatco_restapi.helpers import to_dict
from sqlalchemy.sql.expression import except_
import time
from math import floor
from application.client import HTTPClient
from application.controllers.helper import *
from sqlalchemy import or_, and_, desc
from application.extensions import auth, jwt
import ujson
# import pandas
# from excel2json import convert_from_file


def check_token_app(token):
    uid = redisdb.get("sessions:" + user_token)
    if uid is not None:
        return uid.decode('utf8')
    return None
            

async def pre_process_post_put_appinfo(request=None, data=None, Model=None, **kw):
    if request.method == "POST" or request.method == "PUT":
        if "secret" not in data or data["secret"] is None or data["secret"] == "":
            return json({"error_code":"PARAMS_ERROR","error_message":"Vui lòng nhập mật khẩu của ứng dụng!"}, status=520)
 

# sqlapimanager.create_api(AppInfo,
#     methods=['GET', 'POST', 'DELETE', 'PUT'],
#     url_prefix='/api/v1',
#     preprocess=dict(GET_SINGLE=[auth_func], GET_MANY=[auth_func], POST=[auth_func,pre_process_post_put_appinfo], PUT_SINGLE=[auth_func,pre_process_post_put_appinfo]),
#     exclude_columns= ["secret"],
#     collection_name='appinfo')


@app.route('/app_api/v1/token', methods=['POST'])
async def get_token(request):
    if not check_content_json(request):
        return json({'error_code':"ERROR_PARAMS", 'error_message':'Header request không hợp lệ'}, status=200)
    
    appkey = request.json.get("appkey", None)
    secret = request.json.get("secret", None)
    if appkey is None or secret is None:
        return json({'error_code':"ERROR_PARAMS", 'error_message':u'Tài khoản ứng dụng hoặc mật khẩu không đúng, vui lòng kiểm tra lại!'}, status=520)
    appInfo = db.session.query(AppInfo).filter(AppInfo.appkey == appkey).first()
    if (appInfo is not None) and (auth.verify_password(secret, appInfo.secret)):
        expired_time = app.config.get('APP_API_EXPIRATION_DELTA', 86400)
        token = generate_user_token(appkey, expired_time)
        return json({'error_code':"OK", 'token':'token'}, status=520)
#         token = jwt.encode(payload)
#         return json({'token': token})
    else:
        return json({'error_code':"NOT_FOUND", 'error_message':u'Tài khoản ứng dụng hoặc mật khẩu không đúng, vui lòng kiểm tra lại!'}, status=520)
        


# @app.route('/api/v1/date_sort', methods=['POST'])
# async def date_sort(request):
#     data = request.json
#     equipmentinspectionform = db.session.query(EquipmentInspectionForm).filter(EquipmentInspectionForm.date.between(data['thoiGianBatDau'], data['thoiGianKetThuc'])).all()
#     repairrequestform = db.session.query(RepairRequestForm).filter(RepairRequestForm.time_of_problem.between(data['thoiGianBatDau'], data['thoiGianKetThuc'])).all()
#     devicestatusverificationform = db.session.query(DeviceStatusVerificationForm).filter(DeviceStatusVerificationForm.date.between(data['thoiGianBatDau'], data['thoiGianKetThuc'])).all()
#     certificateform = db.session.query(CertificateForm).filter(CertificateForm.date_of_certification.between(data['thoiGianBatDau'], data['thoiGianKetThuc'])).all()
#     return json({
#         "equipmentinspectionform":[str(date_today.id) for date_today in equipmentinspectionform],
#         "repairrequestform":[str(date_today.id) for date_today in repairrequestform],
#         "devicestatusverificationform":[str(date_today.id) for date_today in devicestatusverificationform],
#         "certificateform":[str(date_today.id) for date_today in certificateform],
#         })
        
# @app.route('/api/v1/count_of_month', methods=['POST'])
# async def count_of_month(request):
#     data = request.json
#     month = ["01","02","03","04","05","06","07","08","09","10","11","12"]
#     month_timestamp = []
#     for i in range(len(month)): 
#         if month[i] == "12":
#             month_timestamp.append({
#                 "batdauthang":str(data['nam'])+"-"+month[i]+"-01T00:00:01",
#                 "kethucthang":str(data['nam']+1)+"-01-01T00:00:01"
#                 })
#         else:
#             month_timestamp.append({
#                 "batdauthang":str(data['nam'])+"-"+month[i]+"-01T00:00:01",
#                 "kethucthang":str(data['nam'])+"-"+month[i+1]+"-01T00:00:01"
#                 })
#     equipmentinspectionform_count = []
#     repairrequestform_count = []
#     devicestatusverificationform_count = []
#     certificateform_count = []
#     for i in month_timestamp: 
#         batdauthang_format = datetime.strptime(i['batdauthang'], '%Y-%m-%dT%H:%M:%S')
#         kethucthang_format = datetime.strptime(i['kethucthang'], '%Y-%m-%dT%H:%M:%S')
#         equipmentinspectionform = db.session.query(EquipmentInspectionForm).filter(EquipmentInspectionForm.date.between(batdauthang_format.timestamp(), kethucthang_format.timestamp())).all()
#         repairrequestform = db.session.query(RepairRequestForm).filter(RepairRequestForm.time_of_problem.between(batdauthang_format.timestamp(), kethucthang_format.timestamp())).all()
#         devicestatusverificationform = db.session.query(DeviceStatusVerificationForm).filter(DeviceStatusVerificationForm.date.between(batdauthang_format.timestamp(), kethucthang_format.timestamp())).all()
#         certificateform = db.session.query(CertificateForm).filter(CertificateForm.date_of_certification.between(batdauthang_format.timestamp(), kethucthang_format.timestamp())).all()
#         equipmentinspectionform_count.append(len([str(sl.id) for sl in equipmentinspectionform]))
#         repairrequestform_count.append(len([str(sl.id) for sl in repairrequestform]))
#         devicestatusverificationform_count.append(len([str(sl.id) for sl in devicestatusverificationform]))
#         certificateform_count.append(len([str(sl.id) for sl in certificateform]))
#     return json(
#         {
#             "equipmentinspectionform_count":equipmentinspectionform_count,
#             "repairrequestform_count":repairrequestform_count,
#             "devicestatusverificationform_count":devicestatusverificationform_count,
#             "certificateform_count":certificateform_count,
#         })

# @app.route('/api/v1/list_today', methods=['POST'])
# async def list_today(request):
#     data = request.json
#     arr = []
#     if data['tableName'] == "equipmentinspectionform" :
#         list = db.session.query(EquipmentInspectionForm).filter(EquipmentInspectionForm.date.between(data['thoiGianBatDau'], data['thoiGianKetThuc'])).all()
#     if data['tableName'] == "repairrequestform" :
#         list = db.session.query(RepairRequestForm).filter(RepairRequestForm.time_of_problem.between(data['thoiGianBatDau'], data['thoiGianKetThuc'])).all()
#     if data['tableName'] == "devicestatusverificationform" :
#         list = db.session.query(DeviceStatusVerificationForm).filter(DeviceStatusVerificationForm.date.between(data['thoiGianBatDau'], data['thoiGianKetThuc'])).all()
#     if data['tableName'] == "certificateform" :
#         list = db.session.query(CertificateForm).filter(CertificateForm.date_of_certification.between(data['thoiGianBatDau'], data['thoiGianKetThuc'])).all()
#     for _ in list :
#         arr.append(to_dict(_))
#     return json(arr)


# @app.route('/api/v1/link_file_upload', methods=['POST'])
# async def link_file_upload(request):
#     url = app.config['FILE_SERVICE_URL']
#     fsroot = app.config['FS_ROOT']
#     if request.method == 'POST':
#         file = request.files.get('file', None)
#         if file :
#             rand = ''.join(random.choice(string.digits) for _ in range(15))
#             file_name = os.path.splitext(file.name)[0]
#             extname = os.path.splitext(file.name)[1]
#             newfilename = file_name + extname 
#             new_filename = newfilename.replace(" ", "_")
#             async with aiofiles.open(fsroot + new_filename, 'wb+') as f:
#                 await f.write(file.body)
#             df = pandas.read_excel("static/uploads/"+new_filename)
#             count = df.ID.count()
#             i = 0
#             arr = []
#             while i < count:
#                 obj = {}
#                 obj['ID'] = df.ID[i]
#                 obj['name'] = df.name[i]
#                 obj['age'] = df.age[i]
#                 arr.append(obj)
#                 i += 1
#             return json({'data':"success"})
    
#     return json({
#         "error_code": "Upload Error",
#         "error_message": "Could not upload file to store"
#     }, status=520)


# @app.route('/api/v1/read_file_json',methods=['POST'])
# async def read_file_json(request):
#     # with open('static/data_thietbiyte.json') as f:
#     #     data = load_json.load(f)

#     with open('static/data_thietbiyte.json') as myfile:
#         data = myfile.read()
#         obj = load_json.loads(data)
#         for _ in obj:
#             medicalEquipment_new = MedicalEquipment()
#             medicalEquipment_new.name = _['name']
#             medicalEquipment_new.classify = _['type'][11]
#             medicalEquipment_new.implementing_organization_classification = _['organization_action']
#             medicalEquipment_new.circulation_number = _['code_document_public']
#             medicalEquipment_new.organization_requesting_classification = _['organization_require']
#             medicalEquipment_new.status = _['status']
#             db.session.add(medicalEquipment_new)
#             db.session.commit()

#     return json({
#         "error_code": "Upload success",
#     })

# @app.route('/api/v1/get_data_medical',methods=['POST'])
# async def get_data_medical(request):
#     req = request.json
#     if req  != None and req != "":
#         find_text = req['text']
#         search = "%{}%".format(find_text)
#         list = db.session.query(MedicalEquipment).filter(MedicalEquipment.name.like(search)).all()
#         if len(list) == 0 :
#             find_text = req['text']
#             tex = find_text.capitalize()
#             search = "%{}%".format(tex)
#             list = db.session.query(MedicalEquipment).filter(MedicalEquipment.name.like(search)).all()
#         arr = []
#         for i in range(len(list)):
#             obj = to_dict(list[i])
#             obj['stt'] = i+1
#             arr.append(obj)
#         return json(arr)
#     else :
#         list = db.session.query(MedicalEquipment).all()
#         arr = []
#         for i in range(len(list)):
#             obj = to_dict(list[i])
#             obj['stt'] = i+1
#             arr.append(obj)
#         return json(arr)

