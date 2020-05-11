from sqlalchemy import (
    Column, String, Integer, DateTime, Date, Boolean, DECIMAL, ForeignKey, Text,
    PrimaryKeyConstraint, ForeignKeyConstraint, BigInteger
)

from application.database import db
from sqlalchemy.dialects.postgresql import UUID, JSON, JSONB
from application.database.model import CommonModel
import uuid
from application.models.inventory.warehouse import *
from application.models.inventory.currency import Currency
from application.models.inventory.contact import Contact
from application.models.inventory.organization import *
from application.models.user import User

from sqlalchemy.orm import relationship
from sqlalchemy.orm import *
from sqlalchemy import *


def default_uuid():
    return str(uuid.uuid4())


class GoodsReciept(CommonModel):
    __tablename__ = 'goodsreciept'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)

    goodsreciept_no = db.Column(db.String)
    payment_no = db.Column(db.String)
    warehouse_id = db.Column(UUID(as_uuid=True))
    warehouse_name = db.Column(db.String)
    tenant_id = db.Column(db.String)
    organization_name = db.Column(db.String)
    organization_id = db.Column(UUID(as_uuid=True))

    contact_name = db.Column(db.String) #dai dien
    contact_id = db.Column(UUID(as_uuid=True)) #dai dien

    taxtype = db.Column(String(25), default="group") #group: thue tren toan bill - individual: thue tren tung product, service
    tax_percent = db.Column(DECIMAL(7,3), default=0)
    tax_amount = db.Column(DECIMAL(25,8), default=0)

    net_amount = db.Column(DECIMAL(25,8), default=0)    # list_price * quantity
    amount = db.Column(DECIMAL(25,8), default=0)        # amount after it minus discount amount
    discount_percent = db.Column(DECIMAL(7,3), default=0) # % giảm theo chương trình KM
    discount_amount = db.Column(DECIMAL(25,8), default=0) # tiền giảm theo chương trình KM
    item_discount = db.Column(DECIMAL(25,8), default=0)
    user_id = db.Column(UUID(as_uuid=True), ForeignKey('user.id'), nullable=True)

    currency_id = db.Column(UUID(as_uuid=True), ForeignKey('currency.id'))
    currency_name = db.Column(db.String)
    conversion_rate = db.Column(DECIMAL(10,3)) # ty gia currency
    note = db.Column(Text())
    # description = db.Column(Text())
    payment_status = db.Column(String(20), default="created")
    details = db.relationship("ItemBalances", order_by="ItemBalances.created_at", cascade="all, delete-orphan")
    payment = db.relationship("Payment", order_by="Payment.created_at", cascade="all, delete-orphan")

    custom_fields = db.Column(JSONB(), nullable=True)

# class GoodsRecieptDetails(CommonModel):
#     __tablename__ = 'goodsrecieptdetails'
#     id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)

#     goodsreciept_id = db.Column(UUID(as_uuid=True), ForeignKey('goodsreciept.id'), nullable=True)
#     item_id = db.Column(String)
#     item_name = db.Column(String(150))
#     item_no = db.Column(String(40))
#     item_type = db.Column(db.String(), default="material")
#     user_id = db.Column(db.String)
#     tenant_id = db.Column(db.String)
#     warehouse_id = db.Column(UUID(as_uuid=True))
#     unit_id = db.Column(UUID(as_uuid=True))
#     quantity = db.Column(DECIMAL(25,3), default=0)
#     purchase_cost = db.Column(DECIMAL(27,8), default=0)  #purchase price, unit price, don gia
#     list_price = db.Column(DECIMAL(27,8), default=0)  #selling price,
#     net_amount = db.Column(DECIMAL(27,8), default=0)  #thanh tien truoc khi tru discount
#     payment_status = db.Column(String(20), default="created")

#     item_image = db.Column(db.String, default="static/images/default-dist.jpeg", nullable=True)
#     unit_code = db.Column(db.String)
#     lot_number = db.Column(db.DECIMAL)
#     item_exid = db.Column(String(100), index=True) #id tich hop tu he thong khac
#     amount = db.Column(DECIMAL(27,8), default=0)
#     description = db.Column(db.String)
#     status = db.Column(db.String)warehouse
