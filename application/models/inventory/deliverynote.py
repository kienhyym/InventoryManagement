from sqlalchemy import (
    Column, String, Integer, DateTime, Date, Boolean, DECIMAL, ForeignKey, Text,
    PrimaryKeyConstraint, ForeignKeyConstraint, BigInteger
)

from application.database import db
from sqlalchemy.dialects.postgresql import UUID, JSON, JSONB
from application.database.model import CommonModel
import uuid
from application.models.inventory.warehouse import Warehouse
from application.models.inventory.currency import Currency
from sqlalchemy.orm import relationship
from sqlalchemy.orm import *
from sqlalchemy import *

def default_uuid():
    return str(uuid.uuid4())


class DeliveryNote(CommonModel):
    __tablename__ = 'deliverynote'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    purchaseorder_no = db.Column(db.String)
    purchaseorder_id = db.Column(UUID(as_uuid=True))
    deliverynote_no = db.Column(db.String)
    tenant_id = db.Column(db.String)

    receipt_no = db.Column(db.String)
    title = db.Column(String(255))

    organization_name = db.Column(db.String)
    organization_id = db.Column(UUID(as_uuid=True))

    workstation_name = db.Column(db.String)
    workstation_id = db.Column(UUID(as_uuid=True))

    #ng yeu cau
    proponent = db.Column(db.String())
    proponent_phone = db.Column(db.String())

    contact_name = db.Column(db.String) #dai dien
    contact_id = db.Column(UUID(as_uuid=True)) #dai dien

    warehouse_name = db.Column(db.String)
    warehouse_id = db.Column(UUID(as_uuid=True))

    address = db.Column(db.String())

    taxtype = db.Column(String(25), default="group") #group: thue tren toan bill - individual: thue tren tung product, service
    tax_percent = db.Column(DECIMAL(7,3), default=0)

    tax_amount = db.Column(DECIMAL(25,8), default=0)
    item_discount = db.Column(DECIMAL(25,8), default=0)

    net_amount = db.Column(DECIMAL(25,8), default=0)    # list_price * quantity
    amount = db.Column(DECIMAL(25,8), default=0)
          # amount after it minus discount amount
    discount_percent = db.Column(DECIMAL(7,3), default=0) # % giảm theo chương trình KM
    discount_amount = db.Column(DECIMAL(25,8), default=0) # tiền giảm theo chương trình KM

    currency_id = db.Column(UUID(as_uuid=True), nullable=True)
    currency_name = db.Column(db.String)
#     currency = relationship("Currency")
    conversion_rate = db.Column(DECIMAL(10,3)) # ty gia currency

    terms_conditions = db.Column(Text()) #dieu khoan dieu kien
    description = db.Column(Text())
#     voucher = db.Column(db.String)
    # payment_method = db.Column(String(50))
    payment_status = db.Column(String(20), default="created")

    note = db.Column(Text())

    custom_fields = db.Column(JSONB(), nullable=True)
#     created_user_name = db.Column(db.String)

    details = db.relationship("DeliveryNoteDetails", order_by="DeliveryNoteDetails.created_at", cascade="all, delete-orphan")



class DeliveryNoteDetails(CommonModel):
    __tablename__ = 'deliverynotedetails'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    deliverynote_id = db.Column(UUID(as_uuid=True), ForeignKey('deliverynote.id'), nullable=True)
    item_exid = db.Column(String(100), index=True) #id tich hop tu he thong khac

    item_id = db.Column(UUID(as_uuid=True), nullable=True)
    item_name = db.Column(String(150), nullable=False)
    item_no = db.Column(String(40), nullable=False)

    item_type = db.Column(db.String(), default="material")
    item_image = db.Column(db.String, default="static/images/default-dist.jpeg", nullable=True)

    user_id = db.Column(db.String(), nullable=True)
    tenant_id = db.Column(db.String(), nullable=True)

    unit_id = db.Column(UUID(as_uuid=True))
    unit_code = db.Column(db.String(), nullable=True)

    lot_number = db.Column(db.DECIMAL, nullable=True)

    quantity = db.Column(DECIMAL(25,3), default=0)
    list_price = db.Column(DECIMAL(27,8), default=0)  #selling price, unit price, don gia

    net_amount = db.Column(DECIMAL(27,8), default=0)  #thanh tien truoc khi tru discount
    amount = db.Column(DECIMAL(27,8), default=0)
    description = db.Column(db.String(), nullable=True)

    status = db.Column(db.String(), nullable=True)
    custom_fields = db.Column(JSONB(), nullable=True)
