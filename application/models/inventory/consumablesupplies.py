from sqlalchemy import (
    Column, String, Integer, DateTime, Date, Boolean, DECIMAL, ForeignKey, Text,
    PrimaryKeyConstraint, ForeignKeyConstraint, BigInteger
)
from application.database import db
from sqlalchemy.dialects.postgresql import UUID, JSON, JSONB
from application.database.model import CommonModel
from application.models.inventory.unit import Unit

from application.models.inventory.warehouse import *
from sqlalchemy.orm import relationship
from sqlalchemy.orm import *
from sqlalchemy import *
import uuid


def default_uuid():
    return str(uuid.uuid4())

# consumablesupplies
items_categories = db.Table('items_categories',
    db.Column('item_id', UUID(as_uuid=True), db.ForeignKey('item.id',onupdate='cascade'), primary_key=True),
    db.Column('category_id', UUID(as_uuid=True), db.ForeignKey('itemcategory.id',onupdate='cascade'), primary_key=True))


class ItemCategory (CommonModel):
    __tablename__ = 'itemcategory'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    #organization_id = db.Column(UUID(as_uuid=True), ForeignKey("organization.id", ondelete="set null"))
    tenant_id = db.Column(db.String, index=True)
    category_exid = db.Column(String(100), nullable=True, index=True)
    category_no = db.Column(String(100), nullable=True)
    category_name = db.Column(String(150), nullable=False)
    is_show = db.Column(Boolean(), default=True)
    position = db.Column(Integer())
    items = db.relationship("Item", secondary=items_categories)
    extension_data = db.Column(JSONB(), nullable=True)
    def __repr__(self):
        return '<itemCategory: {}>'.format(self.category_name)

class PriceList (CommonModel):
    __tablename__ = 'pricelist'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    tenant_id = db.Column(db.String, index=True, nullable=False)
    name = db.Column(db.String())
    description    = db.Column(db.Text())
    currency_id = db.Column(UUID(as_uuid=True), ForeignKey('currency.id'))
    currency_code = db.Column(db.String())
    type = db.Column(db.String(), default="is_sales") # is_Purchases #is_sales
    status = db.Column(db.String)
    start_time = db.Column(db.BigInteger)
    end_time = db.Column(db.BigInteger)
    workstations = db.Column(JSONB())
    scope = db.Column(JSONB())
    extension_data = db.Column(JSONB(), nullable=True)
    details = db.relationship("Item", order_by="Item.created_at", cascade="all, delete-orphan")

class PriceListDetails (CommonModel):
    __tablename__ = 'pricelistdetails'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    tenant_id = db.Column(db.String, index=True, nullable=False)
    pricelist_id = db.Column(UUID(as_uuid=True), ForeignKey('pricelist.id'), nullable=True)
    unit_id = db.Column(UUID(as_uuid=True), ForeignKey('unit.id', ondelete="set null"))
    unit_no = db.Column(db.String)
    item_id = db.Column(UUID(as_uuid=True), ForeignKey('item.id', ondelete="set null"))
    item_name = db.Column(db.String)
    item_no = db.Column(db.String)
    list_price = db.Column(DECIMAL(27,8), default=0)


class Item (CommonModel):
    __tablename__ = 'item'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    pricelist_id = db.Column(UUID(as_uuid=True), ForeignKey('pricelist.id'), nullable=True)
    # pricelist_id = db.Column(UUID(as_uuid=True), ForeignKey('pricelist.id'), nullable=True)
    #organization_id = db.Column(UUID(as_uuid=True), ForeignKey("organization.id", ondelete="set null"))
    item_exid = db.Column(String(100), index=True) #id tich hop tu he thong khac
    item_name = db.Column(db.String)
    item_no = db.Column(db.String)
    tenant_id = db.Column(db.String, index=True)
    specification = db.Column(db.Text())
    categories = db.relationship("ItemCategory", secondary=items_categories)
    unit = relationship('Unit')
    unit_id = db.Column(UUID(as_uuid=True), ForeignKey('unit.id'))
    unit_code = db.Column(db.String)
    description = db.Column(db.String)
    status = db.Column(db.String)
    manufacturer = db.Column(String(200), nullable=True)
    importer = db.Column(db.String(200))
    list_price = db.Column(DECIMAL(27,8), default=0)
    purchase_cost = db.Column(DECIMAL(27,8), default=0)
    pack_size = db.Column(db.DECIMAL, nullable=True)
    weight = db.Column(db.DECIMAL, nullable=True)
    cost_factor = db.Column(db.DECIMAL, nullable=True)
    discontinued = db.Column(db.Boolean, nullable=True)
    vendor_part_no = db.Column(db.String, nullable=True)
    allow_delivery = db.Column(db.Boolean, nullable=True)
    image = db.Column(db.String, default="static/images/default-dist.jpeg", nullable=True)
    item_type = db.Column(db.String(), default="material")
    # is_product = db.Column(db.Boolean, default=False) # la dich vu
    # is_service = db.Column(db.Boolean, default=False) # la dich vu
    # is_package = db.Column(db.Boolean, default=False) # la combo
    # is_raw_material = db.Column(db.Boolean, default=False) # nguyen lieu tho
    # is_material = db.Column(db.Boolean, default=False) # vat lieu
    parent_id = db.Column(UUID(as_uuid=True))
    package_products = db.Column(JSONB(), nullable=True)
    position = db.Column(db.Integer(), nullable=True)
    extension_data = db.Column(JSONB(), nullable=True)
    status = db.Column(db.String)
    # medicalequipment_id = db.Column(UUID(as_uuid=True), ForeignKey('medicalequipment.id'))
    # medicalequipment = relationship('MedicalEquipment', viewonly=True)