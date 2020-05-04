from sqlalchemy import (
    Column, String, Integer, DateTime, Date, Boolean, DECIMAL, ForeignKey, Text,
    PrimaryKeyConstraint, ForeignKeyConstraint, BigInteger
)
from application.database import db
from sqlalchemy.dialects.postgresql import UUID, JSON, JSONB
from application.database.model import CommonModel
from application.models.inventory.unit import Unit
from application.models.inventory.warehouse import Warehouse
from sqlalchemy.orm import relationship
from sqlalchemy.orm import *
from sqlalchemy import *
import uuid


def default_uuid():
    return str(uuid.uuid4())


class ActivityLog(CommonModel):
    __tablename__ = 'activitylog'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    action = db.Column(String(20), nullable=True) # create update delete
    actor = db.Column(String(255), nullable=False)

    object_type = db.Column(String())
    object_no = db.Column(String())

    workstation_id = db.Column(String(), nullable=True)
    workstation_name = db.Column(String())
    
    tenant_id = db.Column(String(), nullable=False)
    user_id = db.Column(String(), nullable=False)
    items = db.Column(JSONB, nullable=True)
