from sqlalchemy import (
    Column, String, Integer, DateTime, Date, Boolean, DECIMAL, ForeignKey, Text,
    PrimaryKeyConstraint, ForeignKeyConstraint, BigInteger
)

from application.database import db
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.dialects.postgresql import JSONB
from application.database.model import CommonModel
import uuid
from sqlalchemy.orm import relationship
from sqlalchemy.orm import *
from sqlalchemy import *

def default_uuid():
    return str(uuid.uuid4())

class Workstation(CommonModel):
    __tablename__ = 'workstation'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    workstation_no = db.Column(db.String())
    tenant_id = db.Column(db.String())
    workstation_name = db.Column(db.String())
    address = db.Column(db.String())
    position = db.Column(db.String())
    status = db.Column(db.String())

