from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from src.app.core.database import Base


class Door(Base):
    __tablename__ = "doors"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    location = Column(String(255), default="")
    ip_address = Column(String(100), default="")
    port = Column(Integer, default=80)
    status = Column(String(32), default="online")
    is_locked = Column(Boolean, default=True)
    api_key = Column(String(128), nullable=True)

    # 🔴 IMPORTANT: must stay STRING (not int)
    building_id = Column(String(64), ForeignKey("buildings.id"), nullable=False, index=True)

    temporary_otp = Column(String(32), nullable=True)
    temporary_otp_expires_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    building = relationship("Building", back_populates="doors")

class GuestOTP(Base):
    __tablename__ = "guest_otps"

    id = Column(String(64), primary_key=True, index=True)
    isnp_number = Column(String(100), nullable=False)
    door_id = Column(String(64), nullable=False, index=True)
    otp = Column(String(10), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_one_time = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())