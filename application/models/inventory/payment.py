from sqlalchemy import (
    Column, String, Integer, DateTime, Date, Boolean, DECIMAL, ForeignKey, Text,
    PrimaryKeyConstraint, ForeignKeyConstraint, BigInteger
)

from application.database import db
from sqlalchemy.dialects.postgresql import UUID, JSON, JSONB
from application.database.model import CommonModel
import uuid
from application.models.inventory.goodsreciept import GoodsReciept

from sqlalchemy.orm import relationship
from sqlalchemy.orm import *
from sqlalchemy import *
def default_uuid():
    return str(uuid.uuid4())


class Payment(CommonModel):
    __tablename__ = 'payment'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    payment_no = db.Column(db.String)

    goodsreciept_id = db.Column(UUID(as_uuid=True), ForeignKey('goodsreciept.id'), nullable=True)
    goodsreciept_no = db.Column(db.String)

    user_id = db.Column(db.String)
    tenant_id = db.Column(db.String)

    receiver = db.Column(db.String) # nguoi nhan tien
    receiver_address = db.Column(db.String)

    amount = db.Column(DECIMAL(25,8), default=0) # so tien

    description = db.Column(db.Text())
    
    custom_fields = db.Column(JSONB(), nullable=True)


