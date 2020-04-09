class Config(object):
    # DEV MODE
    DEBUG = True
    SYSTEM_MAINTAINANCE = False
    STATIC_URL = "static"
    SQLALCHEMY_DATABASE_URI = 'postgresql://quanlykhouser:123456abcA@localhost:5432/quanlykho'
    

    AUTH_LOGIN_ENDPOINT = 'login'
    AUTH_PASSWORD_HASH = 'sha512_crypt'
    AUTH_PASSWORD_SALT = 'add_salt'
    APP_API_SECRET = 'da19u3esds121'
    APP_API_EXPIRATION_DELTA = 2592000 #seconds 30 day
    
    SECRET_KEY = 'acndefs'
    SESSION_COOKIE_SALT = 'salt_key'

    TRANSACTION_TOKEN_EXPIRE_TIME = 120
    
    # DOMAIN_URL = 'http://127.0.0.1:7100'
    DOMAIN_URL = 'https://upstart.vn/inven'

    MAIL_SERVER_HOST = 'kienhyym.gmail.com'
    MAIL_SERVER_PORT = 587
    MAIL_SERVER_USER = 'cucvsmtboyte@gmail.com'
    MAIL_SERVER_PASSWORD = '123456abcA'
    #'somevabe.com@gmail.com'
    #'123abc!@#'
    MAIL_SERVER_USE_TLS = False
    MAIL_SERVER_USE_SSL = True
    EMAIL_SUBJECT_PASSWORD_RESET = "Thanh Tra - Cục Môi Trường - Bộ Y Tế"


    ACCOUNT_KIT_URL = "https://graph.accountkit.com"


    FIREBASE_SERVER_KEY = "AIzaSyBj_Mat5FFPMAkXmUPjxjbgYby1Z9tkZgU"

#     FS_ROOT= "/Users/namdv/workspace/thanhtra_moitruong/repo/static/uploads/"
    # FS_ROOT= "/opt/deploy/thanhtra-moitruong/repo/static/uploads/"
    # FILE_SERVICE_URL = 'http://103.74.120.65:7100/static/uploads'


    FS_ROOT= "static/uploads/"

    # FILE_SERVICE_URL = 'http://103.74.120.65:9081/static/uploads'
    FILE_SERVICE_URL = '/static/uploads'
