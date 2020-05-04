from application.database import db,redisdb
from application.database.model import CommonModel

from sqlalchemy import (and_, or_, String,SmallInteger, Integer, BigInteger, Boolean, DECIMAL, Float, Text, ForeignKey, UniqueConstraint, Index, DateTime)
from sqlalchemy.dialects.postgresql import UUID, JSONB

from sqlalchemy.orm import relationship, backref
import uuid

def default_uuid():
    return str(uuid.uuid4())


class EthnicGroup(CommonModel):
    __tablename__ = 'ethnicgroup'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    code = db.Column(String(255), index=True)
    name = db.Column(String(255))
    
class Nation(CommonModel):
    __tablename__ = 'nation'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    code = db.Column(String(255), index=True)
    name = db.Column(String(255))

class Province(CommonModel):
    __tablename__ = 'province'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    code = db.Column(String(255),unique=True, index=True)
    name = db.Column(String(255))
    nation_id = db.Column(UUID(as_uuid=True), ForeignKey('nation.id'))
    nation = relationship('Nation', viewonly=True)

class District(CommonModel):
    __tablename__ = 'district'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    code = db.Column(String(255),unique=True, index=True)
    name = db.Column(String(255))
    province_id = db.Column(UUID(as_uuid=True), ForeignKey('province.id'))
    province = relationship('Province', viewonly=True)
    
class Wards(CommonModel):
    __tablename__ = 'wards'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    code = db.Column(String(255),unique=True, index=True)
    name = db.Column(String(255))
    district_id = db.Column(UUID(as_uuid=True), ForeignKey('district.id'))
    district = relationship('District', viewonly=True)