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


class Organization(CommonModel):
    __tablename__ = 'organization'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    organization_exid = db.Column(String(100), index=True)
    organization_no = db.Column(String(100), nullable=True)
    organization_name = db.Column(String(255), nullable=True)
    organization_type = db.Column(String(200), nullable=True, index=True)
    # organization_type = db.Column(String(55), nullable=True)
    tenant_id = db.Column(db.String)
    parentid = db.Column(UUID(as_uuid=True), nullable=True)
    industry = db.Column(String(200), nullable=True)
    annualrevenue = db.Column(DECIMAL(25, 8), nullable=True)
    rating = db.Column(String(200), nullable=True)
    ownership = db.Column(String(50), nullable=True)
    notify_owner = db.Column(String(3), nullable=True)
    siccode = db.Column(String(50), nullable=True)
    ticketsymbol = db.Column(String(30), nullable=True)
    phone = db.Column(String(30), nullable=True)
    phone_other = db.Column(String(30), nullable=True)
    email = db.Column(String(100), nullable=True)
    email_other = db.Column(String(100), nullable=True)
    website = db.Column(String(100), nullable=True)
    fax = db.Column(String(50), nullable=True)
    # employees = db.Column(Integer(), nullable=True, default=0)
    employees = db.relationship('OrganizationStaff', cascade="all, delete-orphan")

    emailoptout = db.Column(String(3), nullable=True)
    isconvertedfromlead = db.Column(String(3), nullable=True)
    tags = db.Column(String(1), nullable=True)

    address = db.Column(Text(), nullable=True)
    bill_address_city = db.Column(String(30), nullable=True)
    bill_address_code = db.Column(String(30), nullable=True)
    bill_address_country = db.Column(String(30), nullable=True)
    bill_address_state = db.Column(String(30), nullable=True)
    bill_address_street = db.Column(String(250), nullable=True)
    bill_address_pobox = db.Column(String(30), nullable=True)

    ship_address_city = db.Column(String(30), nullable=True)
    ship_address_code = db.Column(String(30), nullable=True)
    ship_address_country = db.Column(String(30), nullable=True)
    ship_address_state = db.Column(String(30), nullable=True)
    ship_address_street = db.Column(String(250), nullable=True)
    ship_address_pobox = db.Column(String(30), nullable=True)

    custom_fields = db.Column(JSONB(), nullable=True)


    # Methods
    def __repr__(self):
        return '<organization: {}>'.format(self.id)

class OrganizationStaff(CommonModel):
    __tablename__ = 'organizationstaff'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    name = db.Column(db.String(255))
    phone = db.Column(db.String(255))
    email = db.Column(db.String(255))
    role = db.Column(db.String(255))
    organization_id = db.Column(UUID(as_uuid=True), ForeignKey('organization.id'), nullable=True)

