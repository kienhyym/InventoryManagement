from sqlalchemy import (
    Column, String, Integer, DateTime, Date, Boolean, DECIMAL, ForeignKey, Text,
    PrimaryKeyConstraint, ForeignKeyConstraint, BigInteger
)

from application.database import db
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.dialects.postgresql import JSONB
from application.database.model import CommonModel
import uuid
from application.models.inventory.organization import Organization
from application.models.inventory.movewarehouse import *
from application.models.inventory.goodsreciept import *
from application.models.inventory.purchaseorder import *
from application.models.inventory.consumablesupplies import *
from application.models.inventory.unit import *



from sqlalchemy.orm import relationship
from sqlalchemy.orm import *
from sqlalchemy import *

def default_uuid():
    return str(uuid.uuid4())



class Warehouse(CommonModel):
    __tablename__ = 'warehouse'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)

    warehouse_exid = db.Column(String(100), index=True)
    warehouse_no = db.Column(db.String())
    warehouse_name = db.Column(db.String())
    tenant_id = db.Column(db.String)
    organization = relationship('Organization')
    organization_id = db.Column(UUID(as_uuid=True), ForeignKey('organization.id'))

    is_primary = db.Column(Boolean(), default=False)
    address_city = db.Column(String(30), nullable=True)
    address_code = db.Column(String(30), nullable=True)
    address_country = db.Column(String(30), nullable=True)
    address_state = db.Column(String(30), nullable=True)
    address_street = db.Column(String(255), nullable=True)
    address_street2 = db.Column(String(255), nullable=True)
    address = db.Column(String, nullable=True)
    zip_code = db.Column(String(20), nullable=True)

    email = db.Column(String(100), nullable=True)
    email_other = db.Column(String(100), nullable=True)

    phone = db.Column(String(50), nullable=True)
    phone_other = db.Column(String(50), nullable=True)

    status = db.Column(String(20), nullable=True)
    is_fba_warehouse = db.Column(Boolean(), default=False)

    details = db.relationship("ItemBalances", order_by="ItemBalances.created_at", cascade="all, delete-orphan")
    custom_fields = db.Column(JSONB(), nullable=True)
    status_init = db.Column(String(40))

class ItemBalances(CommonModel):
    __tablename__ = 'item_balances'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)

    item_balances_type = db.Column(String(40))
    warehouse_id = db.Column(UUID(as_uuid=True), ForeignKey('warehouse.id'), nullable=True)
    warehouse_name = db.Column(String(100))
    goodsreciept_id = db.Column(UUID(as_uuid=True), ForeignKey('goodsreciept.id'), nullable=True)
    purchaseorder_id = db.Column(UUID(as_uuid=True), ForeignKey('purchaseorder.id'), nullable=True)
    item_id = db.Column(UUID(as_uuid=True), ForeignKey('item.id'), nullable=True)
    unit_id = db.Column(UUID(as_uuid=True), ForeignKey('unit.id'), nullable=True)

    item_no = db.Column(String(40))
    item_name = db.Column(String(150))
    tenant_id = db.Column(db.String)
    purchase_cost = db.Column(DECIMAL(27,8), default=0)  #purchase price
    list_price = db.Column(DECIMAL(27,8), default=0)  #selling price
    quantity = db.Column(DECIMAL(25,3), default=1)
    net_amount = db.Column(DECIMAL(27,8), default=0)  #thanh tien truoc khi tru discount
    payment_status = db.Column(String(20), default="created")

    warehouse_from_id = db.Column(String(150))
    warehouse_to_id = db.Column(String(150))
    move_warehouse_id = db.Column(UUID(as_uuid=True), ForeignKey('movewarehouse.id'), nullable=True)

    item_image = db.Column(db.String(), default="static/images/default-dist.jpeg", nullable=True)
    unit_code = db.Column(db.String)
    lot_number = db.Column(db.DECIMAL)
    amount = db.Column(DECIMAL(27,8), default=0)
    description = db.Column(db.String)
    item_exid = db.Column(db.String, nullable=True)
    item_type = db.Column(db.String(), default="is_material")

