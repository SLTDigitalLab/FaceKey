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


class Door(BaseModel):
    """Represents a physical door with access control."""
    id: str = Field(..., description="Unique door identifier")
    name: str = Field(..., description="Door display name")
    location: str = Field(default="", description="Physical location description")
    ip_address: str = Field(default="", description="Door controller IP address")
    port: int = Field(default=80, description="Door controller port")
    status: DoorStatus = Field(default=DoorStatus.ONLINE)
    is_locked: bool = Field(default=True)
    group_id: str = Field(..., description="Group this door belongs to")
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
    face_registered: bool = Field(default=False)
    is_active: bool = Field(default=True)
    authorized_groups: List[str] = Field(default_factory=list, description="Groups user can access (legacy)")
    authorized_doors: List[str] = Field(default_factory=list, description="Specific doors user can access")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class Group(BaseModel):
    """Represents a group containing multiple doors and authorized users."""
    id: str = Field(..., description="Unique group identifier")
    name: str = Field(..., description="Group display name")
    description: str = Field(default="", description="Group description")
    color: str = Field(default="#667eea", description="UI color for the group")
    icon: str = Field(default="building", description="FontAwesome icon name")
    doors: List[str] = Field(default_factory=list, description="Door IDs in this group")
    authorized_users: List[str] = Field(default_factory=list, description="User IDs authorized for this group")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class AccessLog(BaseModel):
    """Represents an access attempt or door event."""
    id: str = Field(..., description="Unique log identifier")
    timestamp: datetime = Field(default_factory=datetime.now)
    door_id: str = Field(..., description="Door that was accessed")
    user_id: Optional[str] = Field(default=None, description="User who attempted access")
    user_name: Optional[str] = Field(default=None, description="User display name")
    event_type: AccessLogType = Field(..., description="Type of access event")
    similarity_score: Optional[float] = Field(default=None, description="Face match score")
    group_id: Optional[str] = Field(default=None, description="Group context")
    details: str = Field(default="", description="Additional details")
    
    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class DoorOpenRequest(BaseModel):
    """Request to open a specific door."""
    door_id: str
    user_id: Optional[str] = None
    reason: str = "manual"


class GroupCreate(BaseModel):
    """Request to create a new group."""
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
    group_id: str


class UserCreate(BaseModel):
    """Request to create a new user."""
    id: str
    name: str
    email: str = ""
    department: str = ""
    role: str = "employee"


class AuthorizationUpdate(BaseModel):
    """Request to update user authorization for groups."""
    user_id: str
    group_ids: List[str]


class DoorAuthorizationUpdate(BaseModel):
    """Request to update user authorization for specific doors."""
    user_id: str
    door_ids: List[str]
