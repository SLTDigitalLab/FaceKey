#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Door Access Control Models
Defines data structures for groups, doors, and user access permissions.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class DoorStatus(str, Enum):
    """Door status enumeration."""
    ONLINE = "online"
    OFFLINE = "offline"
    LOCKED = "locked"
    UNLOCKED = "unlocked"
    ERROR = "error"


class AccessLogType(str, Enum):
    """Access log event types."""
    GRANTED = "granted"
    DENIED = "denied"
    DOOR_OPENED = "door_opened"
    DOOR_CLOSED = "door_closed"
    MANUAL_UNLOCK = "manual_unlock"
    EMERGENCY = "emergency"

class AdminRole(str, Enum):
    """Admin role types."""
    SUPER_ADMIN = "super_admin"
    TENANT_ADMIN = "tenant_admin"
    BUILDING_ADMIN = "building_admin"

class Door(BaseModel):
    """Represents a physical door with access control."""
    id: str = Field(..., description="Unique door identifier")
    name: str = Field(..., description="Door display name")
    location: str = Field(default="", description="Physical location description")
    ip_address: str = Field(default="", description="Door controller IP address")
    port: int = Field(default=80, description="Door controller port")
    status: DoorStatus = Field(default=DoorStatus.ONLINE)
    is_locked: bool = Field(default=True)
    building_id: str = Field(..., description="Building this door belongs to")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class User(BaseModel):
    """Represents a user with face recognition access."""
    id: str = Field(..., description="Unique user identifier (employee ID)")
    name: str = Field(..., description="User display name")
    email: str = Field(default="", description="User email")
    department: str = Field(default="", description="Department")
    role: str = Field(default="employee", description="User role")
    face_registered: bool = Field(default=True)
    is_active: bool = Field(default=True)
    authorized_doors: List[str] = Field(default_factory=list, description="Specific doors user can access")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class Building(BaseModel):
    """Represents a building containing multiple doors."""
    id: str = Field(..., description="Unique building identifier")
    name: str = Field(..., description="Building display name")
    description: str = Field(default="", description="Building description")
    color: str = Field(default="#667eea", description="UI color for the building")
    icon: str = Field(default="building", description="FontAwesome icon name")
    tenant_id: Optional[str] = Field(default=None, description="Tenant this building belongs to")
    default_admin_id: Optional[str] = Field(default=None, description="Default building admin ID")
    doors: List[str] = Field(default_factory=list, description="Door IDs in this building")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}

class Tenant(BaseModel):
    """Represents a tenant/company/unit in the system."""
    id: str = Field(..., description="Unique tenant identifier")
    name: str = Field(..., description="Tenant display name")
    code: str = Field(..., description="Unique tenant code, example: slt_interns")
    description: str = Field(default="", description="Tenant description")
    is_active: bool = Field(default=True)
    default_admin_id: Optional[str] = Field(default=None, description="Default tenant admin ID")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class AdminUser(BaseModel):
    id: str
    company_user_id: str
    username: str
    name: str
    email: str = ""
    role: AdminRole

    tenant_id: Optional[str] = None
    tenant_name: Optional[str] = None
    tenant_code: Optional[str] = None

    building_id: Optional[str] = None
    building_name: Optional[str] = None

    is_default_admin: bool = False
    is_active: bool = True
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}

class AdminLoginRequest(BaseModel):
    username: str
    password: str 

class AccessLog(BaseModel):
    """Represents an access attempt or door event."""
    id: str = Field(..., description="Unique log identifier")
    timestamp: datetime = Field(default_factory=datetime.now)
    door_id: str = Field(..., description="Door that was accessed")
    user_id: Optional[str] = Field(default=None, description="User who attempted access")
    user_name: Optional[str] = Field(default=None, description="User display name")
    event_type: AccessLogType = Field(..., description="Type of access event")
    similarity_score: Optional[float] = Field(default=None, description="Face match score")
    building_id: Optional[str] = Field(default=None, description="Building context")
    details: str = Field(default="", description="Additional details")
    
    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class DoorOpenRequest(BaseModel):
    """Request to open a specific door."""
    user_id: Optional[str] = None
    reason: str = "manual"


class BuildingCreate(BaseModel):
    """Request to create a new building."""
    name: str
    description: str = ""
    color: str = "#667eea"
    icon: str = "building"


class DoorCreate(BaseModel):
    """Request to create a new door."""
    name: str
    location: str = ""
    ip_address: str = ""
    port: int = 80
    building_id: str


class UserCreate(BaseModel):
    """Request to create a new user."""
    id: str
    name: str
    email: str = ""
    department: str = ""
    role: str = "employee"


class DoorAuthorizationUpdate(BaseModel):
    """Request to update user authorization for specific doors."""
    door_ids: List[str]

class CameraAccessRequest(BaseModel):
    """Request body for camera/face-recognition door access event."""
    door_id: str = Field(..., description="Door ID where the camera detected the user")
    user_id: str = Field(..., description="Recognized employee/user ID")
    similarity_score: float = Field(..., ge=0, le=1, description="Face match score between 0 and 1")
    camera_id: Optional[str] = Field(default=None, description="Optional camera/device identifier")    

class DefaultAdminCreate(BaseModel):
    """Default admin details when creating tenant/building."""
    company_user_id: str = Field(..., description="Company user ID")
    name: str = Field(..., description="Admin name")
    email: str = Field(default="", description="Admin email")
    username: str = Field(..., description="Admin login username")
    password: str = Field(..., description="Admin login password")


class TenantCreate(BaseModel):
    """Request to create a tenant with default tenant admin."""
    name: str
    code: str
    description: str = ""
    default_admin: DefaultAdminCreate


class AdminCreate(BaseModel):
    company_user_id: str
    name: str
    email: str = ""
    username: str
    password: str


class BuildingCreateWithAdmin(BaseModel):
    """Request to create a building with default building admin."""
    name: str
    description: str = ""
    color: str = "#667eea"
    icon: str = "building"
    tenant_id: Optional[str] = None
    default_admin: Optional[DefaultAdminCreate] = None