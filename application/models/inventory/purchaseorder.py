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

from sqlalchemy.orm import relationship
from sqlalchemy.orm import *
from sqlalchemy import *


def default_uuid():
    return str(uuid.uuid4())


class PurchaseOrder(CommonModel):
    __tablename__ = 'purchaseorder'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    tenant_id = db.Column(db.String)
    purchaseorder_no = db.Column(db.String)
    department = db.Column(db.String, nullable=True)

    organization_name = db.Column(db.String, nullable=True)
    organization_id = db.Column(db.String)

    tax_code = db.Column(db.String, nullable=True)
    address = db.Column(db.String, nullable=True)

    proponent = db.Column(db.String, nullable=True) #nguoi de nghi
    phone = db.Column(db.String, nullable=True)

    description = db.Column(Text(), nullable=True)
    payment_status = db.Column(String(20), default="pending")

    workstation_id = db.Column(db.String)
    workstation_name = db.Column(db.String)

    is_pos = db.Column(db.Boolean, default=False)

    # organization_name = db.Column(db.String)
    # organization_id = db.Column(db.String)

    net_amount = db.Column(DECIMAL(25,8), default=0)    # list_price * quantity
    amount = db.Column(DECIMAL(25,8), default=0)        # amount after it minus discount amount
    discount_percent = db.Column(DECIMAL(7,3), default=0) # % giảm theo chương trình KM
    discount_amount = db.Column(DECIMAL(25,8), default=0) # tiền giảm theo chương trình KM
    item_discount = db.Column(DECIMAL(25,8), default=0)
    warehouse_id = db.Column(db.String)
    payment = db.relationship("Payment", order_by="Payment.created_at", cascade="all, delete-orphan")
    details = db.relationship("ItemBalances", order_by="ItemBalances.created_at", cascade="all, delete-orphan")
    custom_fields = db.Column(JSONB(), nullable=True)

# class PurchaseOrderDetails(CommonModel):
#     __tablename__ = 'purchaseorderdetails'
#     id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
#     purchaseorder_id = db.Column(UUID(as_uuid=True), ForeignKey('purchaseorder.id'), nullable=True)
#     item_exid = db.Column(db.String, nullable=True)
#     item_id = db.Column(db.String, nullable=True)
#     item_name = db.Column(String(150))
#     item_no = db.Column(String(40))
#     item_image = db.Column(db.String)

#     user_id = db.Column(db.String)
#     tenant_id = db.Column(db.String)
#     warehouse_id = db.Column(db.String)
#     warehouse_name = db.Column(db.String)
#     payment_status = db.Column(db.String)
#     unit_id = db.Column(UUID(as_uuid=True))
#     unit_code = db.Column(db.String)
#     purchase_cost = db.Column(DECIMAL(27,8), default=0)
#     lot_number = db.Column(db.DECIMAL)
#     quantity = db.Column(DECIMAL(25,3), default=0)
#     list_price = db.Column(DECIMAL(27,8), default=0)  #selling price, unit price, don gia

#     item_type = db.Column(db.String(), default="material")
#     discount_percent = db.Column(DECIMAL(7,3), default=0)
#     discount_amount = db.Column(DECIMAL(27,8), default=0)
#     net_amount = db.Column(DECIMAL(27,8), default=0)  #thanh tien truoc khi tru discount
#     amount = db.Column(DECIMAL(27,8), default=0)
#     tax_percent = db.Column(DECIMAL(7,3), default=0)
#     tax_amount = db.Column(DECIMAL(25,8), default=0)
#     description = db.Column(db.String)
