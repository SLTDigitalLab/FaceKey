#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Door Access Control API Routes
RESTful API endpoints for managing door access control.
"""
from fastapi import APIRouter, Header, HTTPException, Query, UploadFile, File, Form
from typing import List, Optional
import logging
from pydantic import BaseModel
from src.app.models.door_access import (
    Door, User, Building, AccessLog,
    AdminCreate, AdminLoginRequest, BuildingCreate, BuildingCreateWithAdmin,
    CameraAccessRequest, DoorAuthorizationUpdate,
    DoorCreate, DoorOpenRequest, TenantCreate, UserCreate,
)
from src.app.services.door_access_service import get_door_access_service

router = APIRouter()
logger = logging.getLogger(__name__)

class EmailOtpRequest(BaseModel):
    door_id: str
    email: str
    camera_id: Optional[str] = None


class EmailOtpVerify(BaseModel):
    door_id: str
    email: str
    otp: str
    camera_id: Optional[str] = None

def get_actor_admin_id(x_admin_id: Optional[str] = Header(default=None, alias="X-Admin-Id")) -> str:
    if not x_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")
    return x_admin_id


def handle_admin_error(error: Exception):
    if isinstance(error, PermissionError):
        raise HTTPException(status_code=403, detail=str(error))

    if isinstance(error, LookupError):
        raise HTTPException(status_code=404, detail=str(error))

    if isinstance(error, ValueError):
        raise HTTPException(status_code=400, detail=str(error))

    raise HTTPException(status_code=500, detail=str(error))

# ==================== Admin / Tenant Management ====================

@router.post("/admin/bootstrap-super-admin")
async def bootstrap_super_admin():
    """
    Initial setup endpoint.

    Creates or updates the only super admin using backend .env credentials.
    """
    service = get_door_access_service()

    try:
        admin = service.bootstrap_super_admin()

        return {
            "success": True,
            "message": "Super admin bootstrapped successfully",
            "admin": admin.model_dump(mode="json"),
        }

    except Exception as error:
        handle_admin_error(error)

@router.post("/auth/admin/login")
async def admin_login(login_data: AdminLoginRequest):
    service = get_door_access_service()

    try:
        admin = service.login_admin(
            username=login_data.username,
            password=login_data.password,
        )

        return {
            "success": True,
            "message": "Login successful",
            "admin": admin.model_dump(mode="json"),
            "admin_id": admin.id,
        }

    except Exception as error:
        handle_admin_error(error)

@router.get("/admin/me")
async def get_current_admin(actor_admin_id: str = Header(default=None, alias="X-Admin-Id")):
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    admin = service.get_admin(actor_admin_id)

    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    return admin.model_dump(mode="json")


@router.post("/admin/tenants")
async def create_tenant(
    tenant_data: TenantCreate,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        result = service.create_tenant(
            actor_admin_id=actor_admin_id,
            name=tenant_data.name,
            code=tenant_data.code,
            description=tenant_data.description,
            default_admin_company_user_id=tenant_data.default_admin.company_user_id,
            default_admin_name=tenant_data.default_admin.name,
            default_admin_email=tenant_data.default_admin.email,
            default_admin_username=tenant_data.default_admin.username,
            default_admin_password=tenant_data.default_admin.password,
        )

        return {
            "success": True,
            "message": "Tenant created successfully",
            "tenant": result["tenant"].model_dump(mode="json"),
            "default_admin": result["default_admin"].model_dump(mode="json"),
        }

    except Exception as error:
        handle_admin_error(error)


@router.get("/admin/tenants")
async def get_admin_tenants(
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        tenants = service.get_tenants_for_admin(actor_admin_id)
        return [tenant.model_dump(mode="json") for tenant in tenants]

    except Exception as error:
        handle_admin_error(error)


@router.delete("/admin/tenants/{tenant_id}")
async def delete_tenant(
    tenant_id: str,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        if service.delete_tenant(actor_admin_id, tenant_id):
            return {"success": True, "message": "Tenant deleted successfully"}

        raise HTTPException(status_code=404, detail="Tenant not found")

    except HTTPException:
        raise
    except Exception as error:
        handle_admin_error(error)


@router.post("/admin/tenants/{tenant_id}/admins")
async def create_tenant_admin(
    tenant_id: str,
    admin_data: AdminCreate,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        admin = service.create_tenant_admin(
            actor_admin_id=actor_admin_id,
            tenant_id=tenant_id,
            company_user_id=admin_data.company_user_id,
            name=admin_data.name,
            email=admin_data.email,
            username=admin_data.username,
            password=admin_data.password,
        )

        return {
            "success": True,
            "message": "Tenant admin created successfully",
            "admin": admin.model_dump(mode="json"),
        }

    except Exception as error:
        handle_admin_error(error)


@router.get("/admin/tenants/{tenant_id}/admins")
async def get_tenant_admins(
    tenant_id: str,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        admins = service.get_tenant_admins(actor_admin_id, tenant_id)
        return [admin.model_dump(mode="json") for admin in admins]

    except Exception as error:
        handle_admin_error(error)


@router.post("/admin/buildings")
async def create_admin_building(
    building_data: BuildingCreateWithAdmin,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    """
    Create building with default building admin.

    Super admin must pass tenant_id.
    Tenant admin uses own tenant_id automatically.
    Building admin cannot create buildings.
    """
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    if not building_data.default_admin:
        raise HTTPException(status_code=400, detail="default_admin is required")

    try:
        result = service.create_building_with_default_admin(
            actor_admin_id=actor_admin_id,
            name=building_data.name,
            tenant_id=building_data.tenant_id,
            description=building_data.description,
            color=building_data.color,
            icon=building_data.icon,
            default_admin_company_user_id=building_data.default_admin.company_user_id,
            default_admin_name=building_data.default_admin.name,
            default_admin_email=building_data.default_admin.email,
            default_admin_username=building_data.default_admin.username,
            default_admin_password=building_data.default_admin.password,
        )

        return {
            "success": True,
            "message": "Building created successfully",
            "building": result["building"].model_dump(mode="json"),
            "default_admin": result["default_admin"].model_dump(mode="json"),
        }

    except Exception as error:
        handle_admin_error(error)


@router.get("/admin/buildings")
async def get_admin_buildings(
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        buildings = service.get_buildings_for_admin(actor_admin_id)
        return [building.model_dump(mode="json") for building in buildings]

    except Exception as error:
        handle_admin_error(error)


@router.post("/admin/buildings/{building_id}/admins")
async def create_building_admin(
    building_id: str,
    admin_data: AdminCreate,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        admin = service.create_building_admin(
            actor_admin_id=actor_admin_id,
            building_id=building_id,
            company_user_id=admin_data.company_user_id,
            name=admin_data.name,
            email=admin_data.email,
            username=admin_data.username,
            password=admin_data.password,
        )

        return {
            "success": True,
            "message": "Building admin created successfully",
            "admin": admin.model_dump(mode="json"),
        }

    except Exception as error:
        handle_admin_error(error)


@router.get("/admin/buildings/{building_id}/admins")
async def get_building_admins(
    building_id: str,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        admins = service.get_building_admins(actor_admin_id, building_id)
        return [admin.model_dump(mode="json") for admin in admins]

    except Exception as error:
        handle_admin_error(error)


@router.delete("/admin/admins/{admin_id}")
async def delete_admin(
    admin_id: str,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        if service.delete_admin(actor_admin_id, admin_id):
            return {"success": True, "message": "Admin deleted successfully"}

        raise HTTPException(status_code=404, detail="Admin not found")

    except HTTPException:
        raise
    except Exception as error:
        handle_admin_error(error)

# ==================== Dashboard & Stats ====================

@router.get("/stats")
async def get_dashboard_stats(
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    """Get dashboard statistics based on admin scope."""
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        return service.get_dashboard_stats_for_admin(actor_admin_id)

    except Exception as error:
        handle_admin_error(error)


# ==================== Buildings ====================

@router.get("/buildings", response_model=List[dict])
async def get_all_buildings(
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    """Get buildings based on admin scope."""
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        buildings = service.get_buildings_for_admin(actor_admin_id)

        result = []
        for b in buildings:
            building_dict = b.model_dump(mode="json")
            building_dict["door_count"] = len(b.doors)

            users = service.get_users_for_admin(
                actor_admin_id=actor_admin_id,
                building_id=b.id,
            )
            building_dict["user_count"] = len(users)

            result.append(building_dict)

        return result

    except Exception as error:
        handle_admin_error(error)


@router.get("/buildings/{building_id}")
async def get_building(
    building_id: str,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    """Get a specific building by ID based on admin scope."""
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        building = service.get_building_row_for_admin(actor_admin_id, building_id)

        if not building:
            raise HTTPException(status_code=404, detail="Building not found")

        doors = service.get_doors_for_admin(
            actor_admin_id=actor_admin_id,
            building_id=building_id,
        )

        users = service.get_users_for_admin(
            actor_admin_id=actor_admin_id,
            building_id=building_id,
        )

        return {
            **building.model_dump(mode="json"),
            "doors_detail": [d.model_dump(mode="json") for d in doors],
            "users_detail": [u.model_dump(mode="json") for u in users],
        }

    except HTTPException:
        raise
    except Exception as error:
        handle_admin_error(error)


@router.post("/buildings")
async def create_building(
    building_data: BuildingCreate,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    """
    Old building creation endpoint is blocked.

    Use POST /admin/buildings because every building must have
    a tenant and default building admin.
    """
    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    raise HTTPException(
        status_code=400,
        detail="Use /api/v1/door-access/admin/buildings to create buildings with tenant and default building admin",
    )


@router.put("/buildings/{building_id}")
async def update_building(
    building_id: str,
    building_data: dict,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    """Update a building based on admin scope."""
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        building = service.update_building_for_admin(
            actor_admin_id,
            building_id,
            **building_data,
        )

        if not building:
            raise HTTPException(status_code=404, detail="Building not found")

        return {"success": True, "building": building.model_dump(mode="json")}

    except HTTPException:
        raise
    except Exception as error:
        handle_admin_error(error)


@router.delete("/buildings/{building_id}")
async def delete_building(
    building_id: str,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    """Delete a building based on admin scope."""
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        if service.delete_building_for_admin(actor_admin_id, building_id):
            return {"success": True, "message": "Building deleted"}

        raise HTTPException(status_code=404, detail="Building not found")

    except HTTPException:
        raise
    except Exception as error:
        handle_admin_error(error)

# ==================== Doors ====================

@router.get("/doors", response_model=List[dict])
async def get_all_doors(
    building_id: Optional[str] = None,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    """Get all doors based on admin scope."""
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        doors = service.get_doors_for_admin(
            actor_admin_id,
            building_id=building_id,
        )

        result = []
        for d in doors:
            door_dict = d.model_dump(mode="json")
            building = service.get_building(d.building_id)
            door_dict["building_name"] = building.name if building else "Unknown"
            result.append(door_dict)

        return result

    except Exception as error:
        handle_admin_error(error)


@router.get("/doors/{door_id}")
async def get_door(
    door_id: str,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    """Get a specific door by ID based on admin scope."""
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        door = service.get_door_for_admin(actor_admin_id, door_id)

        if not door:
            raise HTTPException(status_code=404, detail="Door not found")

        door_dict = door.model_dump(mode="json")
        building = service.get_building(door.building_id)
        door_dict["building_name"] = building.name if building else "Unknown"
        door_dict["building_color"] = building.color if building else "#667eea"

        return door_dict

    except HTTPException:
        raise
    except Exception as error:
        handle_admin_error(error)


@router.post("/doors")
async def create_door(
    door_data: DoorCreate,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    """Create a new door under admin scope."""
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        door = service.create_door_for_admin(
            actor_admin_id=actor_admin_id,
            name=door_data.name,
            building_id=door_data.building_id,
            location=door_data.location,
            ip_address=door_data.ip_address,
            port=door_data.port,
        )

        if not door:
            raise HTTPException(status_code=400, detail="Invalid building ID")

        return {"success": True, "door": door.model_dump(mode='json')}

    except HTTPException:
        raise
    except Exception as error:
        handle_admin_error(error)


@router.put("/doors/{door_id}")
async def update_door(
    door_id: str,
    door_data: dict,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        door = service.update_door_for_admin(actor_admin_id, door_id, **door_data)
        if not door:
            raise HTTPException(status_code=404, detail="Door not found")
        return {"success": True, "door": door.model_dump(mode='json')}

    except HTTPException:
        raise
    except Exception as error:
        handle_admin_error(error)


@router.delete("/doors/{door_id}")
async def delete_door(
    door_id: str,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        if service.delete_door_for_admin(actor_admin_id, door_id):
            return {"success": True, "message": "Door deleted"}
        raise HTTPException(status_code=404, detail="Door not found")

    except HTTPException:
        raise
    except Exception as error:
        handle_admin_error(error)


@router.post("/doors/{door_id}/open")
async def open_door(
    door_id: str,
    request: Optional[DoorOpenRequest] = None,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    user_id = request.user_id if request else None
    reason = request.reason if request else "manual"

    try:
        result = await service.trigger_door_open_for_admin(
            actor_admin_id=actor_admin_id,
            door_id=door_id,
            user_id=user_id,
            reason=reason,
        )

        return result

    except Exception as error:
        handle_admin_error(error)


# ==================== Users ====================

@router.get("/users/verify/{user_id:path}")
async def verify_user_exists(
    user_id: str,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    """
    Verify if a user exists in the central Visage server.
    Returns normalized employee details for frontend auto-fill.
    """
    import aiohttp
    from src.app.core.config import settings

    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        service.require_admin_exists(actor_admin_id)
    except Exception as error:
        handle_admin_error(error)

    def normalize_employee_identifier(value: str):
        raw_id = str(value or "").strip()
        clean_id = raw_id.split(" - ")[0].strip()

        name_from_id = ""
        if " - " in raw_id:
            name_from_id = raw_id.split(" - ", 1)[1].strip()

        return raw_id, clean_id, name_from_id

    def split_name(full_name: str):
        parts = str(full_name or "").strip().split()
        if not parts:
            return "", ""
        return parts[0], " ".join(parts[1:])

    def build_employee_data(raw_id: str, clean_id: str, name: str = "", department: str = "", email: str = ""):
        first_name, last_name = split_name(name)

        return {
            "id": clean_id,
            "raw_id": raw_id,
            "clean_id": clean_id,
            "display_id": f"{clean_id} - {name}" if name else clean_id,
            "name": name,
            "first_name": first_name,
            "last_name": last_name,
            "department": department or "",
            "email": email or "",
        }

    raw_user_id, clean_user_id, name_from_id = normalize_employee_identifier(user_id)

    logger.info(f"Verifying employee ID: {raw_user_id}")

    # Check local DB using both formats
    local_user = service.get_user(raw_user_id) or service.get_user(clean_user_id)

    if not local_user:
        # Support older records saved as "ID - Name"
        for user in service.get_all_users():
            if user.id.startswith(f"{clean_user_id} - "):
                local_user = user
                break

    if local_user:
        return {
            "exists": True,
            "message": "User already exists locally",
            "local": True,
            "data": build_employee_data(
                raw_id=raw_user_id,
                clean_id=clean_user_id,
                name=local_user.name or name_from_id,
                department=local_user.department,
                email=local_user.email,
            ),
        }

    # Try to verify against central server
    try:
        headers = {
            "api": settings.validation_api_key,
            "user": settings.validation_api_user,
            "uname": raw_user_id,
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                settings.validation_api_url,
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=5),
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    msg = result.get("msg", "")

                    if "Username found" in msg:
                        # Try to read employee details if central API provides them.
                        # If not provided, fallback to name parsed from "ID - Name".
                        central_name = (
                            result.get("name")
                            or result.get("full_name")
                            or result.get("employee_name")
                            or name_from_id
                        )

                        central_department = (
                            result.get("department")
                            or result.get("dept")
                            or ""
                        )

                        central_email = result.get("email") or ""

                        return {
                            "exists": True,
                            "message": "Employee verified successfully",
                            "local": False,
                            "data": build_employee_data(
                                raw_id=raw_user_id,
                                clean_id=clean_user_id,
                                name=central_name,
                                department=central_department,
                                email=central_email,
                            ),
                        }

                    if "Username Available" in msg:
                        return {
                            "exists": False,
                            "message": "Employee not found in central server. Please register first at the main Visage portal.",
                            "data": build_employee_data(
                                raw_id=raw_user_id,
                                clean_id=clean_user_id,
                                name=name_from_id,
                            ),
                        }

                    logger.warning(f"Unexpected validation response: {msg}")
                    return {
                        "exists": False,
                        "message": f"Verification failed: {msg}",
                        "data": build_employee_data(
                            raw_id=raw_user_id,
                            clean_id=clean_user_id,
                            name=name_from_id,
                        ),
                    }

                logger.error(f"Validation API returned status {response.status}")
                return {
                    "exists": False,
                    "message": f"Central server verification failed (Status {response.status})",
                    "data": build_employee_data(
                        raw_id=raw_user_id,
                        clean_id=clean_user_id,
                        name=name_from_id,
                    ),
                }

    except Exception as e:
        logger.warning(f"Could not verify user against central server: {e}")

        return {
            "exists": True,
            "message": "Offline mode - user accepted",
            "offline": True,
            "data": build_employee_data(
                raw_id=raw_user_id,
                clean_id=clean_user_id,
                name=name_from_id,
            ),
        }

@router.get("/users", response_model=List[dict])
async def get_all_users(
    building_id: Optional[str] = None,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    """Get users based on admin scope."""
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        users = service.get_users_for_admin(
            actor_admin_id=actor_admin_id,
            building_id=building_id,
        )

        return [u.model_dump(mode="json") for u in users]

    except Exception as error:
        handle_admin_error(error)

@router.get("/users/{user_id:path}")
async def get_user(
    user_id: str,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    """Get a specific user by ID based on admin scope."""
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        user = service.get_user_for_admin(actor_admin_id, user_id)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user_dict = user.model_dump(mode="json")

        if "authorized_doors" not in user_dict:
            user_dict["authorized_doors"] = []

        return user_dict

    except HTTPException:
        raise
    except Exception as error:
        handle_admin_error(error)


@router.post("/users")
async def create_user(
    user_data: UserCreate,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        user = service.create_user_for_admin(
            actor_admin_id=actor_admin_id,
            user_id=user_data.id,
            name=user_data.name,
            email=user_data.email,
            department=user_data.department,
            role=user_data.role,
        )

        return {"success": True, "user": user.model_dump(mode="json")}

    except Exception as error:
        handle_admin_error(error)


@router.put("/users/{user_id:path}")
async def update_user(
    user_id: str,
    user_data: dict,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        user = service.update_user_for_admin(actor_admin_id, user_id, **user_data)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {"success": True, "user": user.model_dump(mode="json")}

    except HTTPException:
        raise
    except Exception as error:
        handle_admin_error(error)


@router.delete("/users/{user_id:path}")
async def delete_user(
    user_id: str,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        if service.delete_user_for_admin(actor_admin_id, user_id):
            return {"success": True, "message": "User deleted"}

        raise HTTPException(status_code=404, detail="User not found")

    except HTTPException:
        raise
    except Exception as error:
        handle_admin_error(error)


@router.post("/users/{user_id:path}/authorize-doors")
async def authorize_user_doors(
    user_id: str,
    auth_data: DoorAuthorizationUpdate,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    logger.info(f"Authorizing user: {user_id} doors: {auth_data.door_ids}")
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        if service.authorize_user_for_doors_by_admin(
            actor_admin_id,
            user_id,
            auth_data.door_ids,
        ):
            return {"success": True, "message": "Door access updated"}

        raise HTTPException(status_code=404, detail="User not found")

    except HTTPException:
        raise
    except Exception as error:
        handle_admin_error(error)


@router.post("/users/{user_id:path}/face-registered")
async def set_face_registered(
    user_id: str,
    registered: bool = True,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        if service.set_user_face_registered_for_admin(
            actor_admin_id=actor_admin_id,
            user_id=user_id,
            registered=registered,
        ):
            return {"success": True, "message": f"Face registration status updated to {registered}"}

        raise HTTPException(status_code=404, detail="User not found")

    except HTTPException:
        raise
    except Exception as error:
        handle_admin_error(error)


# ==================== Access Control ====================

@router.post("/access/check")
async def check_access(
    user_id: str,
    door_id: str,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        return service.check_user_access_for_admin(
            actor_admin_id=actor_admin_id,
            user_id=user_id,
            door_id=door_id,
        )

    except Exception as error:
        handle_admin_error(error)


@router.post("/access/face-recognition")
async def process_face_recognition(
    user_id: str,
    similarity_score: float,
    door_id: Optional[str] = None,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    """
    Process a face recognition event for testing.

    For real camera integration, use /access/camera-event.
    """
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        return service.process_face_recognition_access_for_admin(
            actor_admin_id=actor_admin_id,
            user_id=user_id,
            similarity_score=similarity_score,
            door_id=door_id,
        )

    except Exception as error:
        handle_admin_error(error)

@router.post("/access/face-image")
async def process_face_image_access(
    door_id: str = Form(...),
    camera_id: Optional[str] = Form("postman_camera"),
    image: UploadFile = File(...),
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    """
    Receive employee image from Postman/camera, verify it with Visage,
    then check whether the matched employee can open the selected door.
    """

    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    allowed_content_types = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/octet-stream",
    ]

    if image.content_type not in allowed_content_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, JPEG, PNG, or WEBP images are allowed",
        )

    image_bytes = await image.read()

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Image file is empty")

    max_size = 5 * 1024 * 1024

    if len(image_bytes) > max_size:
        raise HTTPException(
            status_code=400,
            detail="Image size must be less than 5MB",
        )

    try:
        return await service.process_face_image_access_event_for_admin(
            actor_admin_id=actor_admin_id,
            door_id=door_id,
            image_bytes=image_bytes,
            image_filename=image.filename or "employee.jpg",
            image_content_type=image.content_type or "image/jpeg",
            camera_id=camera_id,
        )

    except Exception as error:
        handle_admin_error(error)

@router.post("/access/camera-event")

@router.post("/access/otp/request")
async def request_email_otp_access(
    payload: EmailOtpRequest,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    """
    Temporary demo endpoint.
    Sends email OTP for door access fallback.
    """

    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        return await service.request_email_otp_for_door(
            actor_admin_id=actor_admin_id,
            door_id=payload.door_id,
            email=payload.email,
            camera_id=payload.camera_id,
        )

    except Exception as error:
        handle_admin_error(error)


@router.post("/access/otp/verify")
async def verify_email_otp_access(
    payload: EmailOtpVerify,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    """
    Temporary demo endpoint.
    Verifies email OTP and opens/simulates the door.
    """

    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        return await service.verify_email_otp_and_open_door(
            actor_admin_id=actor_admin_id,
            door_id=payload.door_id,
            email=payload.email,
            otp=payload.otp,
            camera_id=payload.camera_id,
        )

    except Exception as error:
        handle_admin_error(error)
        
async def process_camera_event(
    camera_data: CameraAccessRequest,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    logger.info(
        f"Camera event received: door={camera_data.door_id}, "
        f"user={camera_data.user_id}, score={camera_data.similarity_score}, "
        f"camera={camera_data.camera_id}"
    )

    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        result = await service.process_camera_access_event_for_admin(
            actor_admin_id=actor_admin_id,
            door_id=camera_data.door_id,
            user_id=camera_data.user_id,
            similarity_score=camera_data.similarity_score,
            camera_id=camera_data.camera_id,
        )

        return result

    except Exception as error:
        handle_admin_error(error)

# ==================== Access Logs ====================

@router.get("/access-logs", response_model=List[dict])
async def get_access_logs(
    limit: int = Query(100, ge=1, le=1000),
    door_id: Optional[str] = None,
    user_id: Optional[str] = None,
    building_id: Optional[str] = None,
    actor_admin_id: str = Header(default=None, alias="X-Admin-Id"),
):
    """Get access logs based on admin scope."""
    service = get_door_access_service()

    if not actor_admin_id:
        raise HTTPException(status_code=401, detail="X-Admin-Id header is required")

    try:
        logs = service.get_access_logs_for_admin(
            actor_admin_id=actor_admin_id,
            limit=limit,
            door_id=door_id,
            user_id=user_id,
            building_id=building_id,
        )

        result = []
        for log in logs:
            log_dict = log.model_dump(mode="json")

            door = service.get_door(log.door_id)
            if door:
                log_dict["door_name"] = door.name
                log_dict["door_location"] = door.location

            building = service.get_building(log.building_id) if log.building_id else None
            if building:
                log_dict["building_name"] = building.name
                log_dict["building_color"] = building.color

            result.append(log_dict)

        return result

    except Exception as error:
        handle_admin_error(error)


# ==================== System Config ====================

@router.get("/config")
async def get_config_info():
    """Get system configuration information."""
    from src.app.core.config import settings
    return {
        "app_name": settings.app_name,
        "app_version": settings.app_version,
        "api_user": settings.validation_api_user
    }
