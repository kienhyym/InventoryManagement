from application.database import db,redisdb
from application.database.model import CommonModel

from sqlalchemy import (and_, or_, String,SmallInteger, Integer, BigInteger, Boolean, DECIMAL, Float, Text, ForeignKey, UniqueConstraint, Index, DateTime)
from sqlalchemy.dialects.postgresql import UUID, JSONB

from sqlalchemy.orm import relationship, backref
import uuid

def default_uuid():
    return str(uuid.uuid4())





# class OrganizationUser(CommonModel):
#     __tablename__ = 'organization_user'
#     organization_id = db.Column(UUID(as_uuid=True), ForeignKey('organization.id',onupdate='CASCADE', ondelete='SET NULL'),index=True, nullable=False)
#     organization_exid = db.Column(db.String())
#     organization = db.relationship("Organization")
#     user_id = db.Column(UUID(as_uuid=True), ForeignKey('user.id',onupdate='CASCADE', ondelete='SET NULL'),index=True, nullable=False)
#     user = db.relationship("User")
#     role = relationship('Role')
#     role_id = db.Column(UUID(as_uuid=True), ForeignKey('role.id'))
#     role_code = db.Column(db.String())
#     status = db.Column(String, nullable=True, default='pending')#actived, pending,banned
#     confirmed_at = db.Column(db.DateTime())

def default_user_config():
    data = {
        'show_navbar': True,
        'theme_color': '#2b404b',
        'working': True
    }
    return data

class User(CommonModel):
    __tablename__ = 'user'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    email = db.Column(String(200), nullable=False, unique=True)
    phone_number = db.Column(String(20), nullable=True, unique=True)
    password = db.Column(String(255), nullable=True)
    name = db.Column(String(255), nullable=True)
    birthday = db.Column(DateTime())
    salt = db.Column(String(255), nullable=True)
    user_image = db.Column(String(250), nullable=True)
    phone_country_prefix = db.Column(String(10))
    phone_national_number = db.Column(String(20))
    # organizations = db.relationship("Organization", secondary=organization_user)
    active = db.Column(db.Boolean, default=False)
    custom_fields = db.Column(JSONB(), nullable=True)
    config_data = db.Column(JSONB(), default=default_user_config)
    role = relationship('Role')
    role_id = db.Column(UUID(as_uuid=True), ForeignKey('role.id'))
    def __repr__(self):
        """ Show user object info. """
        return '<User: {}>'.format(self.phone_number)

class Role(CommonModel):
    __tablename__ = 'role'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    # users = db.relationship("User", order_by="User.created_at", cascade="all, delete-orphan")
    role_code = db.Column(String(), index=True, nullable=True)
    role_name = db.Column(String(100), index=True, nullable=False, unique=True)
    display_name = db.Column(String(255), nullable=False)
    description = db.Column(String(255))
    permissions = db.relationship("Permission", order_by="Permission.id", cascade="all")
    tenant_id = db.Column(db.String())
    
class Permission(CommonModel):
    __tablename__ = 'permission'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    role_id = db.Column(UUID(as_uuid=True), ForeignKey('role.id'), nullable=False)
    subject = db.Column(String,index=True)
    permission = db.Column(String)
    value = db.Column(Boolean, default=False)
    __table_args__ = (UniqueConstraint('role_id', 'subject', 'permission', name='uq_permission_role_subject_permission'),)
