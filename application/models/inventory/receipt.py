from sqlalchemy import (
    Column, String, Integer, DateTime, Date, Boolean, DECIMAL, ForeignKey, Text,
    PrimaryKeyConstraint, ForeignKeyConstraint, BigInteger
)

from application.database import db
from sqlalchemy.dialects.postgresql import UUID, JSON, JSONB
from application.database.model import CommonModel
import uuid
from application.models.inventory.deliverynote import DeliveryNote

from sqlalchemy.orm import relationship
from sqlalchemy.orm import *
from sqlalchemy import *
def default_uuid():
    return str(uuid.uuid4())


class Receipt(CommonModel):
    __tablename__ = 'receipt'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    receipt_no = db.Column(db.String)
    deliverynote_id = db.Column(UUID(as_uuid=True), ForeignKey('deliverynote.id'), nullable=True)
    deliverynote_no = db.Column(db.String)

    user_id = db.Column(db.String)
    tenant_id = db.Column(db.String)

    receipt_address = db.Column(db.String)
    receipt = db.Column(db.String) # nguoi tra tien

    amount = db.Column(DECIMAL(25,8), default=0) # so tien

    description = db.Column(db.Text())



