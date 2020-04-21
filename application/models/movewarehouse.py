from sqlalchemy import (
    Column, String, Integer, DateTime, Date, Boolean, DECIMAL, ForeignKey, Text,
    PrimaryKeyConstraint, ForeignKeyConstraint, BigInteger
)

from application.database import db
from sqlalchemy.dialects.postgresql import UUID, JSON, JSONB
from application.database.model import CommonModel
import uuid
from application.models.contact import *
from application.models.currency import *
from application.models.warehouse import *

from sqlalchemy.orm import relationship
from sqlalchemy.orm import *
from sqlalchemy import *


def default_uuid():
    return str(uuid.uuid4())


class MoveWarehouse(CommonModel):
    __tablename__ = 'movewarehouse'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)

    movewarehouse_no = db.Column(db.String)
    status = db.Column(db.String) # initialization khoi tao , translation dang chuyen, finish hoàn thành


    user_id = db.Column(db.String)
    tenant_id = db.Column(db.String)

    warehouse_from_id = db.Column(UUID(as_uuid=True))
    warehouse_to_id = db.Column(UUID(as_uuid=True))
    warehouse_from_name = db.Column(db.String)
    warehouse_to_name = db.Column(db.String)

    delivery_date = db.Column(db.BigInteger) # ngay chuyen
    received_date = db.Column(db.BigInteger) # ngay nhan

    description = db.Column(db.Text())

    details = db.relationship("MoveWarehouseDetails", order_by="MoveWarehouseDetails.created_at", cascade="all, delete-orphan")
    custom_fields = db.Column(JSONB(), nullable=True)
        

class MoveWarehouseDetails(CommonModel):
    __tablename__ = 'movewarehousedetails'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)

    movewarehouse_id = db.Column(UUID(as_uuid=True), ForeignKey('movewarehouse.id'), nullable=True)
    item_id = db.Column(String)
    item_id_origin = db.Column(String)

    item_name = db.Column(String(150))
    item_no = db.Column(String(40))
    item_image = db.Column(db.String)

    unit_id = db.Column(UUID(as_uuid=True), ForeignKey('unit.id'))
    unit_code = db.Column(db.String)
    warehouse_from_id = db.Column(db.String)
    warehouse_to_id = db.Column(db.String)
    user_id = db.Column(db.String)
    purchase_cost = db.Column(DECIMAL(27,8), default=0)  #purchase price, unit price, don gia
    tenant_id = db.Column(db.String)

    lot_number = db.Column(db.DECIMAL)

    item_exid = db.Column(String(100), index=True) #id tich hop tu he thong khac

    quantity = db.Column(DECIMAL(25,3), default=1)
    quantity_delivery = db.Column(DECIMAL(25,3)) 

    list_price = db.Column(DECIMAL(27,8), default=0)  #selling price, unit price, don gia
    discount_percent = db.Column(DECIMAL(7,3), default=0)
    discount_amount = db.Column(DECIMAL(27,8), default=0)
    net_amount = db.Column(DECIMAL(27,8), default=0)  #thanh tien truoc khi tru discount
    amount = db.Column(DECIMAL(27,8), default=0)

    tax_percent = db.Column(DECIMAL(7,3), default=0)
    tax_amount = db.Column(DECIMAL(25,8), default=0)
    description = db.Column(db.String)
    status = db.Column(db.String)
    custom_fields = db.Column(JSONB(), nullable=True)
