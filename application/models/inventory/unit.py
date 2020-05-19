from sqlalchemy import (
    Column, String, Integer, DateTime, Date, Boolean, DECIMAL, ForeignKey, Text,
    PrimaryKeyConstraint, ForeignKeyConstraint
)

from application.database import db
from sqlalchemy.dialects.postgresql import UUID, JSON, JSONB
from application.database.model import CommonModel
from sqlalchemy.orm import relationship
from sqlalchemy.orm import *
from sqlalchemy import *
import uuid

def default_uuid():
    return str(uuid.uuid4())

class Unit (CommonModel):
    __tablename__ = 'unit'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    name = db.Column(db.String, nullable=True)
    code = db.Column(db.String, nullable=False)
    unit_exchange = db.Column(db.String)
    unit_price_exchange = db.Column(db.Integer)
    description = db.Column(db.String)
    user_id = db.Column(db.String)
    tenant_id = db.Column(db.String)