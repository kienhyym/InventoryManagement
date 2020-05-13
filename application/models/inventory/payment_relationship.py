from sqlalchemy import (
    Column, String, Integer, DateTime, Date, Boolean, DECIMAL, ForeignKey, Text,
    PrimaryKeyConstraint, ForeignKeyConstraint, BigInteger
)

from application.database import db
from sqlalchemy.dialects.postgresql import UUID, JSON, JSONB
from application.database.model import CommonModel
import uuid

from application.models.inventory.payment import *
from application.models.inventory.goodsreciept import *
from application.models.inventory.purchaseorder import *

from sqlalchemy.orm import relationship
from sqlalchemy.orm import *
from sqlalchemy import *


def default_uuid():
    return str(uuid.uuid4())


paymentdetails_purchaseorder = db.Table('paymentdetails_purchaseorder',
    db.Column('paymentdetails_id', UUID(as_uuid=True), db.ForeignKey('paymentdetails.id', ondelete='cascade'), primary_key=True),
    db.Column('purchaseorder_id', UUID(as_uuid=True), db.ForeignKey('purchaseorder.id', onupdate='cascade'), primary_key=True))

paymentdetails_goodsreciept = db.Table('paymentdetails_goodsreciept',
    db.Column('paymentdetails_id', UUID(as_uuid=True), db.ForeignKey('paymentdetails.id', ondelete='cascade'), primary_key=True),
    db.Column('goodsreciept_id', UUID(as_uuid=True), db.ForeignKey('goodsreciept.id', onupdate='cascade'), primary_key=True))
