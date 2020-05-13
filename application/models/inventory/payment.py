from sqlalchemy import (
    Column, String, Integer, DateTime, Date, Boolean, DECIMAL, ForeignKey, Text,
    PrimaryKeyConstraint, ForeignKeyConstraint, BigInteger
)

from application.database import db
from sqlalchemy.dialects.postgresql import UUID, JSON, JSONB
from application.database.model import CommonModel
import uuid

from application.models.inventory.goodsreciept import *
from application.models.inventory.purchaseorder import *


from sqlalchemy.orm import relationship
from sqlalchemy.orm import *
from sqlalchemy import *
def default_uuid():
    return str(uuid.uuid4())

class Payment(CommonModel):
    __tablename__ = 'payment'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    payment_no = db.Column(db.String)
    type = db.Column(db.String)
    # goodsreciept_id = db.Column(UUID(as_uuid=True), ForeignKey('goodsreciept.id'), nullable=True)
    # goodsreciept_no = db.Column(db.String)
    # purchaseorder_id = db.Column(UUID(as_uuid=True), ForeignKey('purchaseorder.id'), nullable=True)
    # purchaseorder_no = db.Column(db.String)

    organization_id = db.Column(UUID(as_uuid=True), ForeignKey('organization.id'), nullable=True)
    organization = relationship('Organization')

    user_id = db.Column(db.String)
    tenant_id = db.Column(db.String)

    receiver = db.Column(db.String) # nguoi nhan tien
    receiver_address = db.Column(db.String)

    amount = db.Column(DECIMAL(25,8), default=0) # so tien
    description = db.Column(db.Text())
    custom_fields = db.Column(JSONB(), nullable=True)
    paymentdetails = relationship('PaymentDetails')
    status = db.Column(db.String)


class PaymentDetails(CommonModel):
    __tablename__ = 'paymentdetails'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    payment_id = db.Column(UUID(as_uuid=True), ForeignKey('payment.id'), nullable=True)
    amount = db.Column(DECIMAL(25,8), default=0) # so tien
    tenant_id = db.Column(db.String)
    status = db.Column(db.String)
    type = db.Column(db.String)
    goodsreciept_id = db.Column(UUID(as_uuid=True), ForeignKey('goodsreciept.id'), nullable=True)
    goodsreciept_amount = db.Column(DECIMAL(25,8), default=0) 
    goodsreciept_no = db.Column(db.String) 
    goodsreciept_create_at = db.Column(BigInteger())

    purchaseorder_id = db.Column(UUID(as_uuid=True), ForeignKey('purchaseorder.id'), nullable=True)
    purchaseorder_amount = db.Column(DECIMAL(25,8), default=0) 
    purchaseorder_no = db.Column(db.String) 
    purchaseorder_create_at = db.Column(BigInteger())


