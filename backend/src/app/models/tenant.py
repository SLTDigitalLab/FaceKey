from sqlalchemy import Boolean, Column, DateTime, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.app.core.database import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text, default="")
    is_active = Column(Boolean, default=True)

    # Default tenant admin cannot be deleted directly.
    # It is removed only when tenant is deleted.
    default_admin_id = Column(String(64), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    buildings = relationship(
        "Building",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )

    admins = relationship(
        "AdminUser",
        back_populates="tenant",
        cascade="all, delete-orphan",
        foreign_keys="AdminUser.tenant_id",
    )