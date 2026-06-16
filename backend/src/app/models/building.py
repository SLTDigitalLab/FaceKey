from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.app.core.database import Base


class Building(Base):
    __tablename__ = "buildings"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    color = Column(String(32), default="#667eea")
    icon = Column(String(64), default="building")

    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)

    # Default building admin cannot be deleted directly.
    # It is removed only when building is deleted.
    default_admin_id = Column(String(64), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship(
        "Tenant",
        back_populates="buildings",
    )

    doors = relationship(
        "Door",
        back_populates="building",
        cascade="all, delete-orphan",
    )

    admins = relationship(
        "AdminUser",
        back_populates="building",
        cascade="all, delete-orphan",
        foreign_keys="AdminUser.building_id",
    )