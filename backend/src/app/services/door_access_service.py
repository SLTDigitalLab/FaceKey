#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Door Access Control Service
Manages groups, doors, users, and access permissions.
"""
import json
import os
import logging
import uuid
import asyncio
import aiohttp
from datetime import datetime
from typing import Dict, List, Optional, Any
from threading import Lock

from src.app.models.door_access import (
    Door, User, Building, AccessLog, DoorStatus, AccessLogType
)

logger = logging.getLogger(__name__)


class DoorAccessService:
    """Service for managing door access control."""
    
    _instance = None
    _lock = Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(DoorAccessService, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        # Use parent directory since we're in backend/src/app/services
        self.data_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "Data", "door_access")
        self.data_dir = os.path.abspath(self.data_dir)
        os.makedirs(self.data_dir, exist_ok=True)
        
        self.buildings_file = os.path.join(self.data_dir, "buildings.json")
        self.doors_file = os.path.join(self.data_dir, "doors.json")
        self.users_file = os.path.join(self.data_dir, "users.json")
        self.access_logs_file = os.path.join(self.data_dir, "access_logs.json")
        
        self.buildings: Dict[str, Building] = {}
        self.doors: Dict[str, Door] = {}
        self.users: Dict[str, User] = {}
        self.access_logs: List[AccessLog] = []
        
        self._load_data()
        
        self._initialized = True
        logger.info("Door Access Service initialized")
    
    def _load_data(self):
        """Load all data from JSON files."""
        # Load buildings
        if os.path.exists(self.buildings_file):
            try:
                with open(self.buildings_file, 'r') as f:
                    data = json.load(f)
                    self.buildings = {b['id']: Building(**b) for b in data}
            except Exception as e:
                logger.error(f"Error loading buildings: {e}")
        
        # Load doors
        if os.path.exists(self.doors_file):
            try:
                with open(self.doors_file, 'r') as f:
                    data = json.load(f)
                    self.doors = {d['id']: Door(**d) for d in data}
            except Exception as e:
                logger.error(f"Error loading doors: {e}")
        
        # Load users
        if os.path.exists(self.users_file):
            try:
                with open(self.users_file, 'r') as f:
                    data = json.load(f)
                    for u in data:
                        # Ensure authorized_doors field exists
                        if 'authorized_doors' not in u:
                            u['authorized_doors'] = []
                        # Remove legacy authorized_groups if present in data but not in model
                        if 'authorized_groups' in u:
                            del u['authorized_groups']
                        self.users[u['id']] = User(**u)
            except Exception as e:
                logger.error(f"Error loading users: {e}")
        
        # Load access logs (last 1000)
        if os.path.exists(self.access_logs_file):
            try:
                with open(self.access_logs_file, 'r') as f:
                    data = json.load(f)
                    self.access_logs = [AccessLog(**l) for l in data[-1000:]]
            except Exception as e:
                logger.error(f"Error loading access logs: {e}")
    
    def _save_buildings(self):
        """Save buildings to JSON file."""
        try:
            with open(self.buildings_file, 'w') as f:
                json.dump([b.model_dump(mode='json') for b in self.buildings.values()], f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving buildings: {e}")
    
    def _save_doors(self):
        """Save doors to JSON file."""
        try:
            with open(self.doors_file, 'w') as f:
                json.dump([d.model_dump(mode='json') for d in self.doors.values()], f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving doors: {e}")
    
    def _save_users(self):
        """Save users to JSON file."""
        try:
            with open(self.users_file, 'w') as f:
                json.dump([u.model_dump(mode='json') for u in self.users.values()], f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving users: {e}")
    
    def _save_access_logs(self):
        """Save access logs to JSON file."""
        try:
            with open(self.access_logs_file, 'w') as f:
                json.dump([l.model_dump(mode='json') for l in self.access_logs[-1000:]], f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving access logs: {e}")
    
    # ==================== Building Operations ====================
    
    def get_all_buildings(self) -> List[Building]:
        """Get all buildings with their door and user counts."""
        return list(self.buildings.values())
    
    def get_building(self, building_id: str) -> Optional[Building]:
        """Get a specific building by ID."""
        return self.buildings.get(building_id)
    
    def create_building(self, name: str, description: str = "", color: str = "#667eea", icon: str = "building") -> Building:
        """Create a new building."""
        building_id = f"bld_{uuid.uuid4().hex[:8]}"
        building = Building(
            id=building_id,
            name=name,
            description=description,
            color=color,
            icon=icon
        )
        self.buildings[building_id] = building
        self._save_buildings()
        logger.info(f"Created building: {name} ({building_id})")
        return building
    
    def update_building(self, building_id: str, **kwargs) -> Optional[Building]:
        """Update an existing building."""
        if building_id not in self.buildings:
            return None
        
        building = self.buildings[building_id]
        for key, value in kwargs.items():
            if hasattr(building, key) and key not in ['id', 'created_at']:
                setattr(building, key, value)
        building.updated_at = datetime.now()
        self._save_buildings()
        return building
    
    def delete_building(self, building_id: str) -> bool:
        """Delete a building and its doors."""
        if building_id not in self.buildings:
            return False
        
        # Remove doors from this building
        # Create a copy of the list because delete_door modifies the building's door list
        door_ids = list(self.buildings[building_id].doors)
        for door_id in door_ids:
            self.delete_door(door_id)
        
        del self.buildings[building_id]
        self._save_buildings()
        return True
    
    # ==================== Door Operations ====================
    
    def get_all_doors(self) -> List[Door]:
        """Get all doors."""
        return list(self.doors.values())
    
    def get_door(self, door_id: str) -> Optional[Door]:
        """Get a specific door by ID."""
        return self.doors.get(door_id)
    
    def get_doors_by_building(self, building_id: str) -> List[Door]:
        """Get all doors in a specific building."""
        return [d for d in self.doors.values() if d.building_id == building_id]
    
    def create_door(self, name: str, building_id: str, location: str = "", 
                   ip_address: str = "", port: int = 80) -> Optional[Door]:
        """Create a new door in a building."""
        if building_id not in self.buildings:
            return None
        
        door_id = f"door_{uuid.uuid4().hex[:8]}"
        door = Door(
            id=door_id,
            name=name,
            location=location,
            ip_address=ip_address,
            port=port,
            building_id=building_id
        )
        self.doors[door_id] = door
        self.buildings[building_id].doors.append(door_id)
        self._save_doors()
        self._save_buildings()
        logger.info(f"Created door: {name} ({door_id}) in building {building_id}")
        return door
    
    def update_door(self, door_id: str, **kwargs) -> Optional[Door]:
        """Update an existing door."""
        if door_id not in self.doors:
            return None
        
        door = self.doors[door_id]
        old_building_id = door.building_id
        
        for key, value in kwargs.items():
            if hasattr(door, key) and key not in ['id', 'created_at']:
                setattr(door, key, value)
        
        # Handle building change
        if 'building_id' in kwargs and kwargs['building_id'] != old_building_id:
            if old_building_id in self.buildings:
                self.buildings[old_building_id].doors.remove(door_id)
            if door.building_id in self.buildings:
                self.buildings[door.building_id].doors.append(door_id)
            self._save_buildings()
        
        door.updated_at = datetime.now()
        self._save_doors()
        return door
    
    def delete_door(self, door_id: str) -> bool:
        """Delete a door."""
        if door_id not in self.doors:
            return False
        
        door = self.doors[door_id]
        if door.building_id in self.buildings:
            # Check if door is in the list before trying to remove it
            if door_id in self.buildings[door.building_id].doors:
                self.buildings[door.building_id].doors.remove(door_id)
                self._save_buildings()
        
        # Remove door from users' authorized_doors
        for user in self.users.values():
            if hasattr(user, 'authorized_doors') and door_id in user.authorized_doors:
                user.authorized_doors.remove(door_id)
        self._save_users()
        
        del self.doors[door_id]
        self._save_doors()
        return True
    
    async def trigger_door_open(self, door_id: str, user_id: Optional[str] = None, 
                                reason: str = "authorized") -> Dict[str, Any]:
        """Trigger a door to open (send HTTP request to door controller)."""
        if door_id not in self.doors:
            return {"success": False, "message": "Door not found"}
        
        door = self.doors[door_id]
        
        # Log the access attempt
        log_entry = AccessLog(
            id=str(uuid.uuid4()),
            door_id=door_id,
            user_id=user_id,
            user_name=self.users[user_id].name if user_id and user_id in self.users else None,
            event_type=AccessLogType.GRANTED if user_id else AccessLogType.MANUAL_UNLOCK,
            building_id=door.building_id,
            details=f"Door opened: {reason}"
        )
        self.access_logs.append(log_entry)
        self._save_access_logs()
        
        # If door has IP address, try to send open command
        if door.ip_address:
            try:
                async with aiohttp.ClientSession() as session:
                    # Send unlock command to door controller
                    # This URL pattern can be customized based on your door controller API
                    url = f"http://{door.ip_address}:{door.port}/unlock"
                    async with session.post(url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                        if response.status == 200:
                            logger.info(f"Door {door.name} opened successfully")
                            return {"success": True, "message": f"Door {door.name} opened"}
                        else:
                            logger.warning(f"Door controller returned status {response.status}")
                            return {"success": True, "message": f"Command sent to {door.name} (simulated)"}
            except Exception as e:
                logger.warning(f"Could not reach door controller: {e}")
                return {"success": True, "message": f"Door {door.name} open command logged (controller unreachable)"}
        
        return {"success": True, "message": f"Door {door.name} open command logged"}
    
    # ==================== User Operations ====================
    
    def get_all_users(self) -> List[User]:
        """Get all users."""
        return list(self.users.values())
    
    def get_user(self, user_id: str) -> Optional[User]:
        """Get a specific user by ID."""
        return self.users.get(user_id)
    
    def get_users_by_building(self, building_id: str) -> List[User]:
        """Get all users authorized for a specific building (via doors)."""
        # Get IDs of all doors in this building
        building_door_ids = set(d.id for d in self.doors.values() if d.building_id == building_id)
        
        authorized_users = []
        for u in self.users.values():
            # Check if user is authorized for ANY door in this building
            if hasattr(u, 'authorized_doors') and u.authorized_doors:
                if any(did in building_door_ids for did in u.authorized_doors):
                    authorized_users.append(u)
                    
        return authorized_users
    
    def create_user(self, user_id: str, name: str, email: str = "", 
                   department: str = "", role: str = "employee") -> User:
        """Create a new user."""
        user = User(
            id=user_id,
            name=name,
            email=email,
            department=department,
            role=role,
            face_registered=True # Verified users always have face registered
        )
        self.users[user_id] = user
        self._save_users()
        logger.info(f"Created user: {name} ({user_id})")
        return user
    
    def update_user(self, user_id: str, **kwargs) -> Optional[User]:
        """Update an existing user."""
        if user_id not in self.users:
            return None
        
        user = self.users[user_id]
        for key, value in kwargs.items():
            if hasattr(user, key) and key not in ['id', 'created_at']:
                setattr(user, key, value)
        user.updated_at = datetime.now()
        self._save_users()
        return user
    
    def delete_user(self, user_id: str) -> bool:
        """Delete a user."""
        if user_id not in self.users:
            return False
        
        del self.users[user_id]
        self._save_users()
        return True
    
    def authorize_user_for_doors(self, user_id: str, door_ids: List[str]) -> bool:
        """Update user's authorized doors."""
        if user_id not in self.users:
            return False
        
        user = self.users[user_id]
        
        # Validate that all door_ids exist
        valid_door_ids = [d_id for d_id in door_ids if d_id in self.doors]
        
        user.authorized_doors = valid_door_ids
        user.updated_at = datetime.now()
        
        self._save_users()
        logger.info(f"Updated door access for user {user_id}: {len(valid_door_ids)} doors")
        return True
    
    def set_user_face_registered(self, user_id: str, registered: bool = True) -> bool:
        """Update user's face registration status."""
        if user_id not in self.users:
            return False
        self.users[user_id].face_registered = registered
        self.users[user_id].updated_at = datetime.now()
        self._save_users()
        return True
    
    # ==================== Access Control ====================
    
    def check_user_access(self, user_id: str, door_id: str) -> Dict[str, Any]:
        """Check if a user has access to a specific door."""
        if user_id not in self.users:
            return {"authorized": False, "reason": "User not found"}
        
        if door_id not in self.doors:
            return {"authorized": False, "reason": "Door not found"}
        
        user = self.users[user_id]
        door = self.doors[door_id]
        
        if not user.is_active:
            return {"authorized": False, "reason": "User account is inactive"}
        
        if not user.face_registered:
            return {"authorized": False, "reason": "Face not registered"}
        
        # Check door-level access
        if hasattr(user, 'authorized_doors') and user.authorized_doors:
            if door_id in user.authorized_doors:
                return {
                    "authorized": True, 
                    "user": user,
                    "door": door,
                    "building": self.buildings.get(door.building_id)
                }
        
        return {"authorized": False, "reason": "User not authorized for this door"}
    
    def process_face_recognition_access(self, user_id: str, similarity_score: float,
                                        door_id: Optional[str] = None) -> Dict[str, Any]:
        """Process a face recognition event for door access."""
        if user_id not in self.users:
            logger.warning(f"Unknown user ID in face recognition: {user_id}")
            return {"success": False, "message": "User not found in access control system"}
        
        user = self.users[user_id]
        
        # If no specific door, find all accessible doors and open them
        if door_id is None:
            accessible_doors = []
            
            # Use authorized_doors directly
            if hasattr(user, 'authorized_doors'):
                for d_id in user.authorized_doors:
                    if d_id in self.doors and self.doors[d_id].status == DoorStatus.ONLINE:
                        accessible_doors.append(d_id)
            
            if not accessible_doors:
                return {"success": False, "message": "No accessible doors found"}
            
            # For now, just log the access - actual door opening would be async
            for d_id in accessible_doors:
                log_entry = AccessLog(
                    id=str(uuid.uuid4()),
                    door_id=d_id,
                    user_id=user_id,
                    user_name=user.name,
                    event_type=AccessLogType.GRANTED,
                    similarity_score=similarity_score,
                    building_id=self.doors[d_id].building_id if d_id in self.doors else None,
                    details=f"Face recognition access granted (score: {similarity_score:.2f})"
                )
                self.access_logs.append(log_entry)
            
            self._save_access_logs()
            return {
                "success": True, 
                "message": f"Access granted for {user.name}",
                "doors": accessible_doors,
                "user": user.model_dump(mode='json')
            }
        
        # Check access for specific door
        access_check = self.check_user_access(user_id, door_id)
        
        if not access_check["authorized"]:
            # Log denied access
            log_entry = AccessLog(
                id=str(uuid.uuid4()),
                door_id=door_id,
                user_id=user_id,
                user_name=user.name,
                event_type=AccessLogType.DENIED,
                similarity_score=similarity_score,
                building_id=self.doors[door_id].building_id if door_id in self.doors else None,
                details=f"Access denied: {access_check['reason']}"
            )
            self.access_logs.append(log_entry)
            self._save_access_logs()
            return {"success": False, "message": access_check["reason"]}
        
        # Log granted access
        log_entry = AccessLog(
            id=str(uuid.uuid4()),
            door_id=door_id,
            user_id=user_id,
            user_name=user.name,
            event_type=AccessLogType.GRANTED,
            similarity_score=similarity_score,
            building_id=self.doors[door_id].building_id,
            details=f"Face recognition access granted (score: {similarity_score:.2f})"
        )
        self.access_logs.append(log_entry)
        self._save_access_logs()
        
        return {
            "success": True,
            "message": f"Access granted for {user.name}",
            "door": self.doors[door_id].model_dump(mode='json'),
            "user": user.model_dump(mode='json')
        }
    
    # ==================== Access Logs ====================
    
    def get_access_logs(self, limit: int = 100, door_id: Optional[str] = None,
                       user_id: Optional[str] = None, building_id: Optional[str] = None) -> List[AccessLog]:
        """Get access logs with optional filters."""
        logs = self.access_logs
        
        if door_id:
            logs = [l for l in logs if l.door_id == door_id]
        if user_id:
            logs = [l for l in logs if l.user_id == user_id]
        if building_id:
            logs = [l for l in logs if l.building_id == building_id]
        
        return sorted(logs, key=lambda x: x.timestamp, reverse=True)[:limit]
    
    def get_dashboard_stats(self) -> Dict[str, Any]:
        """Get statistics for the dashboard."""
        from datetime import datetime
        
        today = datetime.now().date()
        today_logs = [l for l in self.access_logs 
                     if l.timestamp.date() == today]
        
        return {
            "total_buildings": len(self.buildings),
            "total_doors": len(self.doors),
            "total_users": len(self.users),
            "registered_faces": sum(1 for u in self.users.values() if u.face_registered),
            "online_doors": sum(1 for d in self.doors.values() if d.status == DoorStatus.ONLINE),
            "today_access_events": len(today_logs),
            "today_granted": sum(1 for l in today_logs if l.event_type == AccessLogType.GRANTED),
            "today_denied": sum(1 for l in today_logs if l.event_type == AccessLogType.DENIED),
        }


# Singleton instance getter
_door_access_service: Optional[DoorAccessService] = None

def get_door_access_service() -> DoorAccessService:
    """Get the singleton DoorAccessService instance."""
    global _door_access_service
    if _door_access_service is None:
        _door_access_service = DoorAccessService()
    return _door_access_service
