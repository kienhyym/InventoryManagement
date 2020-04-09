'''
Created on Oct 14, 2018

@author: namdv
'''
import time
import asyncio
import aiosmtplib
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from email.mime.text import MIMEText
from application.database import redisdb,db
from gatco_restapi.helpers import to_dict
from application.server import app
from application.extensions import  jinja
from application.extensions import auth


from gatco.response import json, text
from application.client import HTTPClient
import ujson
import binascii
import uuid
from sqlalchemy import func
from application.models.user import *

async def generate_token(user_id, time_expire):
    token =  binascii.hexlify(uuid.uuid4().bytes).decode()
    p = redisdb.pipeline()
    p.set("sessions:" + token, user_id)
    p.expire("sessions:" + token, time_expire)
    p.execute()
    print("==================token", token)
    return token

async def send_mail(subject, recipient, body):

    #Thanks: https://github.com/cole/aiosmtplib/issues/1
    host = app.config.get('MAIL_SERVER_HOST')
    port = app.config.get('MAIL_SERVER_PORT')
    user = app.config.get('MAIL_SERVER_USER')
    password = app.config.get('MAIL_SERVER_PASSWORD')

    loop = asyncio.get_event_loop()

    #server = aiosmtplib.SMTP(host, port, loop=loop, use_tls=False, use_ssl=True)
    server = aiosmtplib.SMTP(hostname=host, port=port, loop=loop, use_tls=False)
    await server.connect()

    await server.starttls()
    await server.login(user, password)

    async def send_a_message():
        message = MIMEText(body)
        message['From'] = app.config.get('MAIL_SERVER_USER')
        #message['To'] = ','.join(new_obj.get('email_to'))
        message['To'] = recipient
        message['Subject'] = subject
        await server.send_message(message)

    await send_a_message()

async def send_reset_password_instructions(request, user):
    token = await generate_token(str(user.id), 86400)
    #reset_link = url_for_security('reset_password', token=token, _external=True)
    reset_link = app.config.get('DOMAIN_URL') + "/api/resetpw?token=" + token
    subject = app.config.get('EMAIL_SUBJECT_PASSWORD_RESET')
    
    #get template for forgot password
    #mailbody = reset_link
    mailbody = jinja.render_string('email/reset_instructions.txt',request, reset_link=reset_link) 
    scheduler = AsyncIOScheduler()
    scheduler.add_job(send_mail,args=[subject, user.email, mailbody])
    print("email===",user.email,"===mailbody===",mailbody)
    scheduler.start()
    
    
    
@app.route('/api/resetpw', methods=["POST", "GET"])
async def resetpw_email(request):
    if request.method == 'GET':
        token = request.args.get("token", None)
        static_url = app.config.get("DOMAIN_URL")+"/"+app.config.get("STATIC_URL", "")
        return jinja.render('email/reset_password.html', request, static_url = static_url, token=token)
    
    if request.method == 'POST':
        email = request.json.get("email", None)
        if ((email is None) or (email == '')):
            return json({"error_code": "PARRAM_ERROR", "error_message": "tham số không hợp lệ"},status=520) 
            
        checkuser = db.session.query(User).filter(User.email == email).first()
        if(checkuser is not None):
            await send_reset_password_instructions(request, checkuser)
            return json({"error": 0, "error_message": u"Yêu cầu thành công, mời bạn kiểm tra lại email để thiết lập lại mật khẩu!"})
        else:
            return json({"error_code": "PARRAM_ERROR", "error_message": "Email không tồn tại trong hệ thống"},status=520) 
    return json({"error": "ERROR_RESET", "error_message": 'Không có quyền truy cập'}, status=520)

@app.route('/api/reset_password', methods=["POST","GET"])
async def reset_password(request):
    if request.method == 'GET':
        token = request.args.get("token", None)
        static_url = app.config.get("DOMAIN_URL")+"/"+app.config.get("STATIC_URL", "")
        return jinja.render('email/reset_password.html', request, static_url = static_url, token=token)
    
     
    if request.method == 'POST':
        token = request.form.get("token", None)
        password = request.form.get("password", None)
        confirm_password = request.form.get("confirm_password", None)
         
         
        if token is None or password  is None:
            return json({"error_code": "PARAM_ERROR", "error_message": "Tham số không hợp lệ, vui lòng thực hiện lại"}, status=520)

        uid_current = redisdb.get("sessions:" + token)
        if uid_current is None:
            return json({"error_code": "SESSION_EXPIRED", "error_message": "Hết thời gian thay đổi mật khẩu, vui lòng thực hiện lại"}, status=520)
    
         
        
        redisdb.delete("sessions:" + token)         
        user = User.query.filter(User.id == str(uid_current.decode('ascii'))).first()
        if (user is not None):
            user.password = auth.encrypt_password(password)
            auth.login_user(request, user)
            db.session.commit()
            return text(u'bạn đã lấy lại mật khẩu thành công. mời bạn đăng nhập lại để sử dụng!')
        else:
            return text('Không tìm thấy tài khoản trong hệ thống, vui lòng thử lại sau!')



