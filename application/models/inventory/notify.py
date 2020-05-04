# import random
# import string
# from sqlalchemy import (
#     Column, String, Integer, DateTime, Date, Boolean, DECIMAL, Text, ForeignKey, UniqueConstraint, BigInteger
# )
# from sqlalchemy.orm import mapper
# from sqlalchemy.dialects.postgresql import UUID, JSONB
# from application.database import db
# from application.database.model import CommonModel




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

class Notify(CommonModel):
    _tablename_ = 'notify'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    title = db.Column(String, index=True)
    content = db.Column(String)
    type = db.Column(String(20))  # text/image/video
    url = db.Column(String)
    action = db.Column(JSONB())
    notify_condition = db.Column(JSONB())
    
class NotifyUser(CommonModel):
    _tablename_ = 'notify_user'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=default_uuid)
    user_id = db.Column(UUID(as_uuid=True))
    notify_id = db.Column(UUID(as_uuid=True), ForeignKey('notify.id'), nullable=True)
    notify = db.relationship('Notify')
    notify_at = db.Column(BigInteger())
    read_at = db.Column(BigInteger())