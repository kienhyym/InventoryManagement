from sqlalchemy import (
    Column, String, Integer, DateTime, Date, Boolean, DECIMAL, ForeignKey, Text,
    PrimaryKeyConstraint, ForeignKeyConstraint, BigInteger
)

from application.database import db
from sqlalchemy.dialects.postgresql import UUID
from application.database.model import CommonModel

from sqlalchemy.orm import relationship
from sqlalchemy.orm import *
from sqlalchemy import *


import uuid


def default_uuid():
    return str(uuid.uuid4())


class Currency(CommonModel):
    __tablename__ = 'currency'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    currency_name = db.Column(String(50), unique=True, nullable=True)
    currency_code = db.Column(String(11), unique=True, nullable=True)
    currency_symbol = db.Column(String(11), nullable=True) 
    tenant_id = db.Column(db.String)