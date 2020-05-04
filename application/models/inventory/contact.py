from sqlalchemy import (
    Column, String, Integer, DateTime, Date, Boolean, DECIMAL, ForeignKey, Text,
    PrimaryKeyConstraint, ForeignKeyConstraint, BigInteger
)

from application.database import db
from sqlalchemy.dialects.postgresql import UUID, JSONB, JSON
from application.database.model import CommonModel

from sqlalchemy.orm import relationship
from sqlalchemy.orm import *
from sqlalchemy import *
import uuid

def default_uuid():
    return str(uuid.uuid4())
    
class Contact(CommonModel):
    __tablename__ = 'contact'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)

    contact_exid = db.Column(String(100), index=True, unique=True)
    contact_no = db.Column(db.String, nullable=True)
    contact_code = db.Column(String(20))
    contact_name = db.Column(String(255), nullable=False)
    contact_type = db.Column(String(100))
    contact_image = db.Column(String(255))
    gender = db.Column(String(30), nullable=True)
    birthday = db.Column(DateTime(), nullable=True)
    tenant_id = db.Column(db.String)
    bdate = db.Column(Integer())  # date of birthday
    bmonth = db.Column(Integer())  # month of birthday
    byear = db.Column(Integer(), index=True)  # year of birthday

    email = db.Column(String(100), nullable=True, index=True)
    email_other = db.Column(String(100), nullable=True)

    phone = db.Column(String(50), nullable=False, index=True)
    phone_other = db.Column(String(50), nullable=True)

    department = db.Column(String(30), nullable=True)

    # Score to make RANK of membership
    score = db.Column(DECIMAL(25, 8), default=0)
    used_time = db.Column(Integer(), default=0)
    last_order_date = db.Column(DateTime())  # the last time using service

    donotcall = db.Column(Boolean(), nullable=True)
    emailoptout = db.Column(String(3), nullable=True)

    reference = db.Column(String(3), nullable=True)
    reportsto = db.Column(String(30), nullable=True)
    notify_owner = db.Column(String(3), nullable=True)
    tags = db.Column(String(1), nullable=True)
    note = db.Column(Text())

    address_city = db.Column(String(30), nullable=True)
    address_code = db.Column(String(30), nullable=True)
    address_country = db.Column(String(30), nullable=True)
    address_state = db.Column(String(30), nullable=True)
    address_street = db.Column(String(250), nullable=True)
    address_pobox = db.Column(String(30), nullable=True)

    other_address_city = db.Column(String(30), nullable=True)
    other_address_code = db.Column(String(30), nullable=True)
    other_address_country = db.Column(String(30), nullable=True)
    other_address_state = db.Column(String(30), nullable=True)
    other_address_street = db.Column(String(250), nullable=True)
    other_address_pobox = db.Column(String(30), nullable=True)
    extra_data = db.Column(JSONB())
    social_info = db.Column(JSONB())  # list of social
