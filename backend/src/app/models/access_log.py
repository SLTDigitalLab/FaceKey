from sqlalchemy import Column, DateTime, Float, String, Text
from sqlalchemy.sql import func

from src.app.core.database import Base


class AccessLog(Base):
    __tablename__ = "access_logs"

    id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    door_id = Column(String(64), nullable=False, index=True)
    user_id = Column(String(64), nullable=True, index=True)
    user_name = Column(String(100), nullable=True)
    event_type = Column(String(32), nullable=False)
    similarity_score = Column(Float, nullable=True)
    building_id = Column(String(64), nullable=True, index=True)
    details = Column(Text, default="")
