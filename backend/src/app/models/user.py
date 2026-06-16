from sqlalchemy import Boolean, Column, DateTime, JSON, String, Text
from sqlalchemy.sql import func

from src.app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), default="")
    department = Column(String(100), default="")
    role = Column(String(50), default="employee")
    face_registered = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    authorized_doors = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
