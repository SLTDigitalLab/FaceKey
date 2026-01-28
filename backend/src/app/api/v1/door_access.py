#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Door Access Control API Routes
RESTful API endpoints for managing door access control.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import logging

from src.app.models.door_access import (
    Door, User, Building, AccessLog, 
    BuildingCreate, DoorCreate, UserCreate, 
    DoorAuthorizationUpdate, DoorOpenRequest
)
from src.app.services.door_access_service import get_door_access_service

router = APIRouter()
logger = logging.getLogger(__name__)


# ==================== Dashboard & Stats ====================

@router.get("/stats")
async def get_dashboard_stats():
    """Get dashboard statistics."""
    service = get_door_access_service()
    return service.get_dashboard_stats()


# ==================== Buildings ====================

@router.get("/buildings", response_model=List[dict])
async def get_all_buildings():
    """Get all buildings with door and user counts."""
    service = get_door_access_service()
    buildings = service.get_all_buildings()
    result = []
    for b in buildings:
        building_dict = b.model_dump(mode='json')
        building_dict['door_count'] = len(b.doors)
        # Use service method to get accurate count including door-level authorization
        users = service.get_users_by_building(b.id)
        building_dict['user_count'] = len(users)
        result.append(building_dict)
    return result


@router.get("/buildings/{building_id}")
async def get_building(building_id: str):
    """Get a specific building by ID."""
    service = get_door_access_service()
    building = service.get_building(building_id)
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    
    # Get full door and user details
    doors = service.get_doors_by_building(building_id)
    users = service.get_users_by_building(building_id)
    
    return {
        **building.model_dump(mode='json'),
        "doors_detail": [d.model_dump(mode='json') for d in doors],
        "users_detail": [u.model_dump(mode='json') for u in users]
    }


@router.post("/buildings")
async def create_building(building_data: BuildingCreate):
    """Create a new building."""
    service = get_door_access_service()
    building = service.create_building(
        name=building_data.name,
        description=building_data.description,
        color=building_data.color,
        icon=building_data.icon
    )
    return {"success": True, "building": building.model_dump(mode='json')}


@router.put("/buildings/{building_id}")
async def update_building(building_id: str, building_data: dict):
    """Update an existing building."""
    service = get_door_access_service()
    building = service.update_building(building_id, **building_data)
    if not building:
        raise HTTPException(status_code=404, detail="Building not found")
    return {"success": True, "building": building.model_dump(mode='json')}


@router.delete("/buildings/{building_id}")
async def delete_building(building_id: str):
    """Delete a building."""
    service = get_door_access_service()
    if service.delete_building(building_id):
        return {"success": True, "message": "Building deleted"}
    raise HTTPException(status_code=404, detail="Building not found")


# ==================== Doors ====================

@router.get("/doors", response_model=List[dict])
async def get_all_doors(building_id: Optional[str] = None):
    """Get all doors, optionally filtered by building."""
    service = get_door_access_service()
    if building_id:
        doors = service.get_doors_by_building(building_id)
    else:
        doors = service.get_all_doors()
    
    result = []
    for d in doors:
        door_dict = d.model_dump(mode='json')
        # Add building name
        building = service.get_building(d.building_id)
        door_dict['building_name'] = building.name if building else "Unknown"
        result.append(door_dict)
    return result


@router.get("/doors/{door_id}")
async def get_door(door_id: str):
    """Get a specific door by ID."""
    service = get_door_access_service()
    door = service.get_door(door_id)
    if not door:
        raise HTTPException(status_code=404, detail="Door not found")
    
    door_dict = door.model_dump(mode='json')
    building = service.get_building(door.building_id)
    door_dict['building_name'] = building.name if building else "Unknown"
    door_dict['building_color'] = building.color if building else "#667eea"
    return door_dict


@router.post("/doors")
async def create_door(door_data: DoorCreate):
    """Create a new door."""
    service = get_door_access_service()
    door = service.create_door(
        name=door_data.name,
        building_id=door_data.building_id,
        location=door_data.location,
        ip_address=door_data.ip_address,
        port=door_data.port
    )
    if not door:
        raise HTTPException(status_code=400, detail="Invalid building ID")
    return {"success": True, "door": door.model_dump(mode='json')}


@router.put("/doors/{door_id}")
async def update_door(door_id: str, door_data: dict):
    """Update an existing door."""
    service = get_door_access_service()
    door = service.update_door(door_id, **door_data)
    if not door:
        raise HTTPException(status_code=404, detail="Door not found")
    return {"success": True, "door": door.model_dump(mode='json')}


@router.delete("/doors/{door_id}")
async def delete_door(door_id: str):
    """Delete a door."""
    service = get_door_access_service()
    if service.delete_door(door_id):
        return {"success": True, "message": "Door deleted"}
    raise HTTPException(status_code=404, detail="Door not found")


@router.post("/doors/{door_id}/open")
async def open_door(door_id: str, request: Optional[DoorOpenRequest] = None):
    """Manually trigger a door to open."""
    service = get_door_access_service()
    user_id = request.user_id if request else None
    reason = request.reason if request else "manual"
    result = await service.trigger_door_open(door_id, user_id=user_id, reason=reason)
    return result


# ==================== Users ====================

@router.get("/users/verify/{user_id:path}")
async def verify_user_exists(user_id: str):
    """
    Verify if a user exists in the central Visage server.
    This is called before adding a user to ensure they're registered.
    """
    import aiohttp
    from src.app.core.config import settings
    
    logger.info(f"Verifying employee ID: {user_id}")
    
    # Check if already exists locally
    service = get_door_access_service()
    if service.get_user(user_id):
        return {
            "exists": True,
            "name": service.get_user(user_id).name,
            "message": "User already exists locally",
            "local": True
        }
    
    # Try to verify against central server
    try:
        # Use the remote API to check if user exists
        # We'll make a lightweight request to verify the employee
        headers = {
            "api": settings.validation_api_key,
            "user": settings.validation_api_user,
            "uname": user_id
        }
        
        async with aiohttp.ClientSession() as session:
            # Try the attendance update endpoint as a way to verify if user exists
            async with session.post(
                settings.validation_api_url,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=5)
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    msg = result.get("msg", "")
                    
                    # Check validation messages
                    # "Username found" means the user is already registered -> Success for us (we want to add existing users)
                    # "Username Available" means the user is NOT registered -> Fail for us
                    
                    if "Username found" in msg:
                        # User verification success
                        return {
                            "exists": True,
                            "message": "Employee verified successfully"
                        }
                    elif "Username Available" in msg:
                        return {
                            "exists": False,
                            "message": "Employee not found in central server. Please register first at the main Visage portal."
                        }
                    else:
                        # Fallback for other messages
                        logger.warning(f"Unexpected validation response: {msg}")
                        return {
                            "exists": False,
                            "message": f"Verification failed: {msg}"
                        }
                
                # Server error
                logger.error(f"Validation API returned status {response.status}")
                return {
                    "exists": False,
                    "message": f"Central server verification failed (Status {response.status})"
                }
                
    except Exception as e:
        logger.warning(f"Could not verify user against central server: {e}")
        # If we can't reach central server, allow user to be added
        # This is a fallback for offline scenarios
        
        return {
            "exists": True,
            "message": "Offline mode - user accepted",
            "offline": True
        }


@router.get("/users", response_model=List[dict])
async def get_all_users(building_id: Optional[str] = None):
    """Get all users, optionally filtered by building."""
    service = get_door_access_service()
    if building_id:
        users = service.get_users_by_building(building_id)
    else:
        users = service.get_all_users()
    
    result = []
    for u in users:
        user_dict = u.model_dump(mode='json')
        result.append(user_dict)
    return result


@router.get("/users/{user_id:path}")
async def get_user(user_id: str):
    """Get a specific user by ID."""
    service = get_door_access_service()
    user = service.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_dict = user.model_dump(mode='json')
    # Ensure authorized_doors is included
    if 'authorized_doors' not in user_dict:
        user_dict['authorized_doors'] = []
    return user_dict


@router.post("/users")
async def create_user(user_data: UserCreate):
    """Create a new user."""
    service = get_door_access_service()
    
    # Check if user already exists
    if service.get_user(user_data.id):
        raise HTTPException(status_code=400, detail="User with this ID already exists")
    
    user = service.create_user(
        user_id=user_data.id,
        name=user_data.name,
        email=user_data.email,
        department=user_data.department,
        role=user_data.role
    )
    return {"success": True, "user": user.model_dump(mode='json')}


@router.put("/users/{user_id:path}")
async def update_user(user_id: str, user_data: dict):
    """Update an existing user."""
    service = get_door_access_service()
    user = service.update_user(user_id, **user_data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "user": user.model_dump(mode='json')}


@router.delete("/users/{user_id:path}")
async def delete_user(user_id: str):
    """Delete a user."""
    service = get_door_access_service()
    if service.delete_user(user_id):
        return {"success": True, "message": "User deleted"}
    raise HTTPException(status_code=404, detail="User not found")


@router.post("/users/{user_id:path}/authorize-doors")
async def authorize_user_doors(user_id: str, auth_data: DoorAuthorizationUpdate):
    """Update user's authorized doors."""
    service = get_door_access_service()
    if service.authorize_user_for_doors(user_id, auth_data.door_ids):
        return {"success": True, "message": "Door access updated"}
    raise HTTPException(status_code=404, detail="User not found")


@router.post("/users/{user_id:path}/face-registered")
async def set_face_registered(user_id: str, registered: bool = True):
    """Update user's face registration status."""
    service = get_door_access_service()
    if service.set_user_face_registered(user_id, registered):
        return {"success": True, "message": f"Face registration status updated to {registered}"}
    raise HTTPException(status_code=404, detail="User not found")


# ==================== Access Control ====================

@router.post("/access/check")
async def check_access(user_id: str, door_id: str):
    """Check if a user has access to a door."""
    service = get_door_access_service()
    result = service.check_user_access(user_id, door_id)
    return result


@router.post("/access/face-recognition")
async def process_face_recognition(user_id: str, similarity_score: float, 
                                   door_id: Optional[str] = None):
    """Process a face recognition event for door access."""
    service = get_door_access_service()
    result = service.process_face_recognition_access(user_id, similarity_score, door_id)
    return result


# ==================== Access Logs ====================

@router.get("/access-logs", response_model=List[dict])
async def get_access_logs(
    limit: int = Query(100, ge=1, le=1000),
    door_id: Optional[str] = None,
    user_id: Optional[str] = None,
    building_id: Optional[str] = None
):
    """Get access logs with optional filters."""
    service = get_door_access_service()
    logs = service.get_access_logs(limit=limit, door_id=door_id, 
                                   user_id=user_id, building_id=building_id)
    
    result = []
    for log in logs:
        log_dict = log.model_dump(mode='json')
        # Add door and building names
        door = service.get_door(log.door_id)
        if door:
            log_dict['door_name'] = door.name
            log_dict['door_location'] = door.location
        building = service.get_building(log.building_id) if log.building_id else None
        if building:
            log_dict['building_name'] = building.name
            log_dict['building_color'] = building.color
        result.append(log_dict)
    return result
