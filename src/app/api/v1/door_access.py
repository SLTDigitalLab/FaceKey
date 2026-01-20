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
    Door, User, Group, AccessLog, 
    GroupCreate, DoorCreate, UserCreate, 
    AuthorizationUpdate, DoorAuthorizationUpdate, DoorOpenRequest
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


# ==================== Groups ====================

@router.get("/groups", response_model=List[dict])
async def get_all_groups():
    """Get all groups with door and user counts."""
    service = get_door_access_service()
    groups = service.get_all_groups()
    result = []
    for g in groups:
        group_dict = g.model_dump(mode='json')
        group_dict['door_count'] = len(g.doors)
        group_dict['user_count'] = len(g.authorized_users)
        result.append(group_dict)
    return result


@router.get("/groups/{group_id}")
async def get_group(group_id: str):
    """Get a specific group by ID."""
    service = get_door_access_service()
    group = service.get_group(group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Get full door and user details
    doors = service.get_doors_by_group(group_id)
    users = service.get_users_by_group(group_id)
    
    return {
        **group.model_dump(mode='json'),
        "doors_detail": [d.model_dump(mode='json') for d in doors],
        "users_detail": [u.model_dump(mode='json') for u in users]
    }


@router.post("/groups")
async def create_group(group_data: GroupCreate):
    """Create a new group."""
    service = get_door_access_service()
    group = service.create_group(
        name=group_data.name,
        description=group_data.description,
        color=group_data.color,
        icon=group_data.icon
    )
    return {"success": True, "group": group.model_dump(mode='json')}


@router.put("/groups/{group_id}")
async def update_group(group_id: str, group_data: dict):
    """Update an existing group."""
    service = get_door_access_service()
    group = service.update_group(group_id, **group_data)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return {"success": True, "group": group.model_dump(mode='json')}


@router.delete("/groups/{group_id}")
async def delete_group(group_id: str):
    """Delete a group."""
    service = get_door_access_service()
    if service.delete_group(group_id):
        return {"success": True, "message": "Group deleted"}
    raise HTTPException(status_code=404, detail="Group not found")


# ==================== Doors ====================

@router.get("/doors", response_model=List[dict])
async def get_all_doors(group_id: Optional[str] = None):
    """Get all doors, optionally filtered by group."""
    service = get_door_access_service()
    if group_id:
        doors = service.get_doors_by_group(group_id)
    else:
        doors = service.get_all_doors()
    
    result = []
    for d in doors:
        door_dict = d.model_dump(mode='json')
        # Add group name
        group = service.get_group(d.group_id)
        door_dict['group_name'] = group.name if group else "Unknown"
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
    group = service.get_group(door.group_id)
    door_dict['group_name'] = group.name if group else "Unknown"
    door_dict['group_color'] = group.color if group else "#667eea"
    return door_dict


@router.post("/doors")
async def create_door(door_data: DoorCreate):
    """Create a new door."""
    service = get_door_access_service()
    door = service.create_door(
        name=door_data.name,
        group_id=door_data.group_id,
        location=door_data.location,
        ip_address=door_data.ip_address,
        port=door_data.port
    )
    if not door:
        raise HTTPException(status_code=400, detail="Invalid group ID")
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
            "api": settings.remote_api_api_key,
            "user": settings.remote_api_username,
            "empID": user_id
        }
        
        async with aiohttp.ClientSession() as session:
            # Try the attendance update endpoint as a way to verify if user exists
            async with session.post(
                settings.remote_api_attendance_update_endpoint,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=5)
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    # If the response indicates success, user exists
                    if "success" in result.get("msg", "").lower() or result.get("msg", "").lower() != "user not found":
                        # Extract name from user_id if format is "ID - Name"
                        name = user_id
                        if " - " in user_id:
                            name = user_id.split(" - ")[-1].strip()
                        
                        return {
                            "exists": True,
                            "name": name,
                            "message": "Employee verified successfully"
                        }
                
                # User not found
                return {
                    "exists": False,
                    "message": "Employee not found in central server. Please register first."
                }
                
    except Exception as e:
        logger.warning(f"Could not verify user against central server: {e}")
        # If we can't reach central server, allow user to be added with extracted name
        # This is a fallback for offline scenarios
        name = user_id
        if " - " in user_id:
            name = user_id.split(" - ")[-1].strip()
        
        return {
            "exists": True,
            "name": name,
            "message": "Offline mode - user accepted",
            "offline": True
        }


@router.get("/users", response_model=List[dict])
async def get_all_users(group_id: Optional[str] = None):
    """Get all users, optionally filtered by group."""
    service = get_door_access_service()
    if group_id:
        users = service.get_users_by_group(group_id)
    else:
        users = service.get_all_users()
    
    result = []
    for u in users:
        user_dict = u.model_dump(mode='json')
        # Add group details
        user_dict['groups_detail'] = []
        for gid in u.authorized_groups:
            group = service.get_group(gid)
            if group:
                user_dict['groups_detail'].append({
                    'id': group.id,
                    'name': group.name,
                    'color': group.color
                })
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
    user_dict['groups_detail'] = []
    for gid in user.authorized_groups:
        group = service.get_group(gid)
        if group:
            user_dict['groups_detail'].append({
                'id': group.id,
                'name': group.name,
                'color': group.color,
                'icon': group.icon
            })
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


@router.post("/users/{user_id:path}/authorize")
async def authorize_user(user_id: str, auth_data: AuthorizationUpdate):
    """Update user's authorized groups (legacy)."""
    service = get_door_access_service()
    if service.authorize_user_for_groups(user_id, auth_data.group_ids):
        return {"success": True, "message": "Authorization updated"}
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
    group_id: Optional[str] = None
):
    """Get access logs with optional filters."""
    service = get_door_access_service()
    logs = service.get_access_logs(limit=limit, door_id=door_id, 
                                   user_id=user_id, group_id=group_id)
    
    result = []
    for log in logs:
        log_dict = log.model_dump(mode='json')
        # Add door and group names
        door = service.get_door(log.door_id)
        if door:
            log_dict['door_name'] = door.name
            log_dict['door_location'] = door.location
        group = service.get_group(log.group_id) if log.group_id else None
        if group:
            log_dict['group_name'] = group.name
            log_dict['group_color'] = group.color
        result.append(log_dict)
    return result
