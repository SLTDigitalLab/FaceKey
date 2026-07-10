from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.app.core.database import Base


class AdminUser(Base):
    __tablename__ = "admin_users"

    # System generated primary key, example: adm_abc123
    id = Column(String(64), primary_key=True, index=True)

    # Company/user/employee ID. This is NOT the primary key.
    # Super admin / tenant admin can use any value.
    # Building admin must use InSP format. We validate that in service.
    company_user_id = Column(String(150), nullable=False, index=True)

    name = Column(String(150), nullable=False)
    email = Column(String(255), default="")

    # super_admin / tenant_admin / building_admin
    role = Column(String(50), nullable=False, index=True)

    tenant_id = Column(String(64), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    building_id = Column(String(64), ForeignKey("buildings.id", ondelete="CASCADE"), nullable=True, index=True)

    is_default_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    created_by = Column(String(64), nullable=True)

    username = Column(String(100), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    tenant = relationship(
        "Tenant",
        back_populates="admins",
        foreign_keys=[tenant_id],
    )

    building = relationship(
        "Building",
        back_populates="admins",
        foreign_keys=[building_id],
    )