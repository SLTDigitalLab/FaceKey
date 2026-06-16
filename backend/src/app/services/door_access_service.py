#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Door Access Control Service
Manages buildings, doors, users, and access permissions using SQLAlchemy + MySQL.
"""
import logging
import os
import re
import uuid
import secrets
from sqlalchemy import text
from datetime import datetime, timedelta
from threading import Lock
from typing import Any, Dict, List, Optional
from src.app.core.security import hash_password, verify_password
import aiohttp
from src.app.core.config import settings
from src.app.core.database import SessionLocal
from src.app.models import (
    AccessLog as DBAccessLog,
    AdminUser as DBAdminUser,
    Building as DBBuilding,
    Door as DBDoor,
    Tenant as DBTenant,
    User as DBUser,
)
from src.app.models.door_access import (
    AccessLog,
    AccessLogType,
    AdminRole,
    AdminUser,
    Building,
    Door,
    DoorStatus,
    Tenant,
    User,
)

logger = logging.getLogger(__name__)


class DoorAccessService:
    """Service for managing door access control backed by SQLAlchemy."""

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
        self._initialized = True
        logger.info("Door Access Service initialized with SQLAlchemy storage")

    def _new_id(self, prefix: str) -> str:
        return f"{prefix}_{uuid.uuid4().hex[:8]}"

    def _to_building_schema(self, row: DBBuilding) -> Building:
        return Building(
            id=row.id,
            name=row.name,
            description=row.description or "",
            color=row.color or "#667eea",
            icon=row.icon or "building",
            tenant_id=getattr(row, "tenant_id", None),
            default_admin_id=getattr(row, "default_admin_id", None),
            doors=[door.id for door in row.doors],
            created_at=row.created_at or datetime.now(),
            updated_at=row.updated_at or row.created_at or datetime.now(),
        )
    
    def _to_tenant_schema(self, row: DBTenant) -> Tenant:
        return Tenant(
            id=row.id,
            name=row.name,
            code=row.code,
            description=row.description or "",
            is_active=bool(row.is_active),
            default_admin_id=row.default_admin_id,
            created_at=row.created_at or datetime.now(),
            updated_at=row.updated_at or row.created_at or datetime.now(),
        )


    def _to_admin_schema(self, row: DBAdminUser) -> AdminUser:
        tenant_name = None
        tenant_code = None
        building_name = None

        db = self._get_db()

        try:
            if row.tenant_id:
                tenant = db.query(DBTenant).filter(DBTenant.id == row.tenant_id).first()

                if tenant:
                    tenant_name = tenant.name
                    tenant_code = tenant.code

            if row.building_id:
                building = db.query(DBBuilding).filter(DBBuilding.id == row.building_id).first()

                if building:
                    building_name = building.name

        finally:
            db.close()

        return AdminUser(
            id=row.id,
            company_user_id=row.company_user_id,
            username=row.username or "",
            name=row.name,
            email=row.email or "",
            role=AdminRole(row.role),

            tenant_id=row.tenant_id,
            tenant_name=tenant_name,
            tenant_code=tenant_code,

            building_id=row.building_id,
            building_name=building_name,

            is_default_admin=bool(row.is_default_admin),
            is_active=bool(row.is_active),
            created_by=row.created_by,
            created_at=row.created_at or datetime.now(),
            updated_at=row.updated_at or row.created_at or datetime.now(),
        )

    def _to_door_schema(self, row: DBDoor) -> Door:
        return Door(
            id=row.id,
            name=row.name,
            location=row.location or "",
            ip_address=row.ip_address or "",
            port=row.port or 80,
            status=DoorStatus(row.status) if isinstance(row.status, str) else DoorStatus.ONLINE,
            is_locked=bool(row.is_locked),
            building_id=row.building_id,
            created_at=row.created_at or datetime.now(),
            updated_at=row.updated_at or row.created_at or datetime.now(),
        )

    def _to_user_schema(self, row: DBUser) -> User:
        return User(
            id=row.id,
            name=row.name,
            email=row.email or "",
            department=row.department or "",
            role=row.role or "employee",
            face_registered=bool(row.face_registered),
            is_active=bool(row.is_active),
            authorized_doors=list(row.authorized_doors or []),
            created_at=row.created_at or datetime.now(),
            updated_at=row.updated_at or row.created_at or datetime.now(),
        )

    def _to_access_log_schema(self, row: DBAccessLog) -> AccessLog:
        return AccessLog(
            id=row.id,
            timestamp=row.timestamp or datetime.now(),
            door_id=row.door_id,
            user_id=row.user_id,
            user_name=row.user_name,
            event_type=AccessLogType(row.event_type) if isinstance(row.event_type, str) else AccessLogType.GRANTED,
            similarity_score=row.similarity_score,
            building_id=row.building_id,
            details=row.details or "",
        )

    def _get_db(self):
        return SessionLocal()
    
    def _normalize_company_user_id(self, company_user_id: str) -> str:
        raw_value = str(company_user_id or "").strip()

        if " - " in raw_value:
            return raw_value.split(" - ")[0].strip()

        return raw_value


    def _is_valid_insp_id(self, company_user_id: str) -> bool:
        clean_id = self._normalize_company_user_id(company_user_id)
        return bool(re.match(r"^InSP/\d{4}/\d+/\d+$", clean_id))


    def _validate_building_admin_company_id(self, company_user_id: str) -> str:
        clean_id = self._normalize_company_user_id(company_user_id)

        if not self._is_valid_insp_id(clean_id):
            raise ValueError("Building admin company_user_id must be a valid InSP number")

        return clean_id


    def _get_admin_row(self, db, admin_id: str) -> Optional[DBAdminUser]:
        if not admin_id:
            return None

        return db.query(DBAdminUser).filter(DBAdminUser.id == admin_id).first()

    def create_user_for_admin(
        self,
        actor_admin_id: str,
        user_id: str,
        name: str,
        email: str = "",
        department: str = "",
        role: str = "employee",
    ) -> User:
        db = self._get_db()
        try:
            self._require_active_admin(db, actor_admin_id)

            existing_user, raw_user_id, clean_user_id = self._find_user_by_identifier(db, user_id)
            if existing_user:
                raise ValueError("User with this ID already exists")

            row = DBUser(
                id=clean_user_id,
                name=name,
                email=email or "",
                department=department or "",
                role=role or "employee",
                face_registered=True,
                is_active=True,
            )

            db.add(row)
            db.commit()
            db.refresh(row)

            return self._to_user_schema(row)

        finally:
            db.close()

    def login_admin(self, username: str, password: str) -> AdminUser:
        db = self._get_db()
        try:
            clean_username = str(username or "").strip().lower()

            if not clean_username or not password:
                raise ValueError("Username and password are required")

            admin = (
                db.query(DBAdminUser)
                .filter(DBAdminUser.username == clean_username)
                .first()
            )

            if not admin:
                raise PermissionError("Invalid username or password")

            if not admin.is_active:
                raise PermissionError("Admin account is inactive")

            if not admin.password_hash:
                raise PermissionError("Password is not configured for this admin")

            if not verify_password(password, admin.password_hash):
                raise PermissionError("Invalid username or password")

            return self._to_admin_schema(admin)

        finally:
            db.close()

    def _normalize_admin_username(self, username: str) -> str:
        clean_username = str(username or "").strip().lower()

        if not clean_username:
            raise ValueError("Username is required")

        return clean_username


    def _ensure_admin_username_available(self, db, username: str):
        clean_username = self._normalize_admin_username(username)

        existing_admin = (
            db.query(DBAdminUser)
            .filter(DBAdminUser.username == clean_username)
            .first()
        )

        if existing_admin:
            raise ValueError("Username already exists")

        return clean_username


    def _make_password_hash(self, password: str) -> str:
        if not password:
            raise ValueError("Password is required")

        return hash_password(password)        

    def update_user_for_admin(self, actor_admin_id: str, user_id: str, **kwargs) -> Optional[User]:
        db = self._get_db()
        try:
            self._require_active_admin(db, actor_admin_id)

            row, raw_user_id, clean_user_id = self._find_user_by_identifier(db, user_id)
            if not row:
                return None

            for key, value in kwargs.items():
                if hasattr(row, key) and key not in {"id", "created_at", "authorized_doors"}:
                    setattr(row, key, value)

            row.updated_at = datetime.now()

            db.commit()
            db.refresh(row)

            return self._to_user_schema(row)

        finally:
            db.close()


    def delete_user_for_admin(self, actor_admin_id: str, user_id: str) -> bool:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)

            row, raw_user_id, clean_user_id = self._find_user_by_identifier(db, user_id)
            if not row:
                return False

            # Building admin can delete only users who have access to their building.
            if actor.role == AdminRole.BUILDING_ADMIN.value:
                building_door_ids = [
                    item.id
                    for item in db.query(DBDoor.id)
                    .filter(DBDoor.building_id == actor.building_id)
                    .all()
                ]

                if not any(door_id in building_door_ids for door_id in (row.authorized_doors or [])):
                    raise PermissionError("You can only delete users assigned to your building")

            # Tenant admin can delete only users who have access to doors under their tenant.
            if actor.role == AdminRole.TENANT_ADMIN.value:
                tenant_building_ids = [
                    item.id
                    for item in db.query(DBBuilding.id)
                    .filter(DBBuilding.tenant_id == actor.tenant_id)
                    .all()
                ]

                tenant_door_ids = [
                    item.id
                    for item in db.query(DBDoor.id)
                    .filter(DBDoor.building_id.in_(tenant_building_ids))
                    .all()
                ]

                if not any(door_id in tenant_door_ids for door_id in (row.authorized_doors or [])):
                    raise PermissionError("You can only delete users assigned to your tenant")

            db.delete(row)
            db.commit()

            return True

        finally:
            db.close()


    def set_user_face_registered_for_admin(
        self,
        actor_admin_id: str,
        user_id: str,
        registered: bool = True,
    ) -> bool:
        db = self._get_db()
        try:
            self._require_active_admin(db, actor_admin_id)

            row, raw_user_id, clean_user_id = self._find_user_by_identifier(db, user_id)
            if not row:
                return False

            row.face_registered = registered
            row.updated_at = datetime.now()

            db.commit()
            return True

        finally:
            db.close()


    async def trigger_door_open_for_admin(
        self,
        actor_admin_id: str,
        door_id: str,
        user_id: Optional[str] = None,
        reason: str = "manual",
    ) -> Dict[str, Any]:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)

            door = db.query(DBDoor).filter(DBDoor.id == door_id).first()
            if not door:
                return {"success": False, "message": "Door not found"}

            self._require_building_scope(db, actor, door.building_id)

        finally:
            db.close()

        return await self.trigger_door_open(
            door_id=door_id,
            user_id=user_id,
            reason=reason,
        )


    def check_user_access_for_admin(
        self,
        actor_admin_id: str,
        user_id: str,
        door_id: str,
    ) -> Dict[str, Any]:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)

            door = db.query(DBDoor).filter(DBDoor.id == door_id).first()
            if not door:
                return {"authorized": False, "reason": "Door not found"}

            self._require_building_scope(db, actor, door.building_id)

        finally:
            db.close()

        return self.check_user_access(user_id, door_id)

    async def verify_face_with_visage(
        self,
        image_bytes: bytes,
        image_filename: str,
        image_content_type: str,
    ) -> Dict[str, Any]:
        """
        Send employee image to Visage face verification API.
        Visage returns matched employee ID and similarity score.
        """

        url = getattr(
            settings,
            "visage_face_verification_url",
            "https://visage.sltdigitallab.lk/api/face_verification",
        )

        headers = {
            "api": settings.validation_api_key,
            "user": settings.validation_api_user,
        }

        form_data = aiohttp.FormData()
        form_data.add_field(
            "image",
            image_bytes,
            filename=image_filename or "employee.jpg",
            content_type=image_content_type or "image/jpeg",
        )

        timeout_seconds = int(getattr(settings, "remote_api_timeout_seconds", 10) or 10)

        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                headers=headers,
                data=form_data,
                timeout=aiohttp.ClientTimeout(total=timeout_seconds),
            ) as response:
                response_text = await response.text()

                try:
                    result = await response.json(content_type=None)
                except Exception:
                    result = {"raw_response": response_text}

        msg = str(result.get("msg", ""))
        user_payload = result.get("user")

        matched_user_id = None
        similarity_score = None
        threshold_used = None
        confidence = None

        if isinstance(user_payload, dict):
            matched_user_id = user_payload.get("user_id")
            similarity_score = user_payload.get("similarity")
            confidence = user_payload.get("confidence")
            threshold_used = user_payload.get("threshold_used")

        elif isinstance(user_payload, str):
            matched_user_id = user_payload

        if similarity_score is None:
            similarity_score = confidence

        if similarity_score is not None:
            try:
                similarity_score = float(similarity_score)
            except Exception:
                similarity_score = None

        if threshold_used is not None:
            try:
                threshold_used = float(threshold_used)
            except Exception:
                threshold_used = None

        face_verified = (
            response.status == 200
            and "Verification Success" in msg
            and bool(matched_user_id)
        )

        return {
            "face_verified": face_verified,
            "http_status": response.status,
            "message": msg,
            "matched_user_id": matched_user_id,
            "similarity_score": similarity_score,
            "threshold_used": threshold_used,
            "visage_response": result,
        }
        
    async def process_face_image_access_event_for_admin(
        self,
        actor_admin_id: str,
        door_id: str,
        image_bytes: bytes,
        image_filename: str,
        image_content_type: str,
        camera_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Final FaceKey image flow:
        Postman/camera sends image + door_id.
        FaceKey sends image to Visage.
        Visage returns employee ID + similarity.
        FaceKey checks door access and opens/denies door.
        """

        db = self._get_db()

        try:
            actor = self._require_active_admin(db, actor_admin_id)

            door = db.query(DBDoor).filter(DBDoor.id == door_id).first()

            if not door:
                raise LookupError("Door not found")

            self._require_building_scope(db, actor, door.building_id)

        finally:
            db.close()

        visage_result = await self.verify_face_with_visage(
            image_bytes=image_bytes,
            image_filename=image_filename,
            image_content_type=image_content_type,
        )

        if not visage_result["face_verified"]:
            db = self._get_db()

            try:
                door = db.query(DBDoor).filter(DBDoor.id == door_id).first()

                log_entry = DBAccessLog(
                    id=str(uuid.uuid4()),
                    door_id=door_id,
                    user_id=None,
                    user_name=None,
                    event_type=AccessLogType.DENIED.value,
                    similarity_score=visage_result.get("similarity_score"),
                    building_id=door.building_id if door else None,
                    details=(
                        f"Face verification failed from Visage: {visage_result.get('message')}"
                        + (f" | camera_id={camera_id}" if camera_id else "")
                    ),
                )

                db.add(log_entry)
                db.commit()

            finally:
                db.close()

            return {
                "success": True,
                "event_logged": True,
                "face_verified": False,
                "access_granted": False,
                "door_opened": False,
                "message": visage_result.get("message") or "Face verification failed",
                "door_id": door_id,
                "camera_id": camera_id,
                "visage_response": visage_result.get("visage_response"),
            }

        matched_user_id = visage_result["matched_user_id"]
        similarity_score = visage_result.get("similarity_score")

        if similarity_score is None:
            similarity_score = float(getattr(settings, "face_similarity_threshold", 0.6))

        access_result = await self.process_camera_access_event_for_admin(
            actor_admin_id=actor_admin_id,
            door_id=door_id,
            user_id=matched_user_id,
            similarity_score=similarity_score,
            camera_id=camera_id,
        )

        access_result["face_verified"] = True
        access_result["matched_user_id_from_visage"] = matched_user_id
        access_result["visage_similarity_score"] = visage_result.get("similarity_score")
        access_result["visage_threshold_used"] = visage_result.get("threshold_used")
        access_result["visage_message"] = visage_result.get("message")
        access_result["visage_response"] = visage_result.get("visage_response")

        return access_result

    async def send_email_otp_with_brevo(
        self,
        to_email: str,
        otp: str,
        door_name: str,
    ) -> Dict[str, Any]:
        """
        Send OTP email using Brevo transactional email API.
        """

        if not settings.brevo_api_key:
            raise ValueError("BREVO_API_KEY is missing in .env")

        if not settings.brevo_sender_email:
            raise ValueError("BREVO_SENDER_EMAIL is missing in .env")

        url = "https://api.brevo.com/v3/smtp/email"

        headers = {
            "accept": "application/json",
            "api-key": settings.brevo_api_key,
            "content-type": "application/json",
        }

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>FaceKey Door Access OTP</h2>
                <p>Your OTP for door access is:</p>
                <h1 style="letter-spacing: 4px;">{otp}</h1>
                <p>This OTP is valid for {settings.otp_expiry_minutes} minutes.</p>
                <p>Door: <b>{door_name}</b></p>
                <p>If you did not request this, please ignore this email.</p>
            </body>
        </html>
        """

        payload = {
            "sender": {
                "name": settings.brevo_sender_name,
                "email": settings.brevo_sender_email,
            },
            "to": [
                {
                    "email": to_email,
                }
            ],
            "subject": "FaceKey Door Access OTP",
            "htmlContent": html_content,
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=15),
            ) as response:
                response_text = await response.text()

                try:
                    response_json = await response.json(content_type=None)
                except Exception:
                    response_json = {"raw_response": response_text}

                if response.status not in [200, 201, 202]:
                    raise RuntimeError(f"Brevo email failed: {response_json}")

                return {
                    "success": True,
                    "status": response.status,
                    "brevo_response": response_json,
                }


    async def request_email_otp_for_door(
        self,
        actor_admin_id: str,
        door_id: str,
        email: str,
        camera_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Temporary demo OTP flow.
        Sends OTP to any email without employee authorization check.
        """

        clean_email = str(email or "").strip().lower()

        if not clean_email or "@" not in clean_email:
            raise ValueError("Valid email is required")

        db = self._get_db()

        try:
            actor = self._require_active_admin(db, actor_admin_id)

            door = db.query(DBDoor).filter(DBDoor.id == door_id).first()

            if not door:
                raise LookupError("Door not found")

            self._require_building_scope(db, actor, door.building_id)

            otp = f"{secrets.randbelow(1000000):06d}"
            otp_hash = hash_password(otp)
            otp_id = str(uuid.uuid4())
            expires_at = datetime.now() + timedelta(minutes=settings.otp_expiry_minutes)

            db.execute(
                text("""
                    INSERT INTO access_otps (
                        id,
                        door_id,
                        contact_email,
                        otp_hash,
                        expires_at,
                        attempts,
                        max_attempts,
                        camera_id,
                        created_at
                    )
                    VALUES (
                        :id,
                        :door_id,
                        :contact_email,
                        :otp_hash,
                        :expires_at,
                        0,
                        :max_attempts,
                        :camera_id,
                        :created_at
                    )
                """),
                {
                    "id": otp_id,
                    "door_id": door_id,
                    "contact_email": clean_email,
                    "otp_hash": otp_hash,
                    "expires_at": expires_at,
                    "max_attempts": settings.otp_max_attempts,
                    "camera_id": camera_id,
                    "created_at": datetime.now(),
                },
            )

            db.commit()

            await self.send_email_otp_with_brevo(
                to_email=clean_email,
                otp=otp,
                door_name=door.name,
            )

            return {
                "success": True,
                "otp_sent": True,
                "message": "OTP sent to email",
                "door_id": door_id,
                "email": clean_email,
                "expires_in_minutes": settings.otp_expiry_minutes,
                "camera_id": camera_id,
            }

        finally:
            db.close()


    async def verify_email_otp_and_open_door(
        self,
        actor_admin_id: str,
        door_id: str,
        email: str,
        otp: str,
        camera_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Temporary demo OTP verification.
        If OTP is correct, open/simulate the door.
        """

        clean_email = str(email or "").strip().lower()
        clean_otp = str(otp or "").strip()

        if not clean_email or "@" not in clean_email:
            raise ValueError("Valid email is required")

        if not clean_otp or len(clean_otp) != 6:
            raise ValueError("Valid 6-digit OTP is required")

        db = self._get_db()

        try:
            actor = self._require_active_admin(db, actor_admin_id)

            door = db.query(DBDoor).filter(DBDoor.id == door_id).first()

            if not door:
                raise LookupError("Door not found")

            self._require_building_scope(db, actor, door.building_id)

            otp_row = db.execute(
                text("""
                    SELECT *
                    FROM access_otps
                    WHERE door_id = :door_id
                      AND contact_email = :contact_email
                      AND used_at IS NULL
                    ORDER BY created_at DESC
                    LIMIT 1
                """),
                {
                    "door_id": door_id,
                    "contact_email": clean_email,
                },
            ).mappings().first()

            access_granted = False
            door_opened = False
            reason = ""

            if not otp_row:
                reason = "OTP not found or already used"

            elif otp_row["expires_at"] < datetime.now():
                reason = "OTP expired"

            elif otp_row["attempts"] >= otp_row["max_attempts"]:
                reason = "Maximum OTP attempts exceeded"

            elif not verify_password(clean_otp, otp_row["otp_hash"]):
                db.execute(
                    text("""
                        UPDATE access_otps
                        SET attempts = attempts + 1
                        WHERE id = :id
                    """),
                    {"id": otp_row["id"]},
                )
                reason = "Invalid OTP"

            else:
                access_granted = True
                reason = "OTP verified. Door access granted."

                db.execute(
                    text("""
                        UPDATE access_otps
                        SET used_at = :used_at
                        WHERE id = :id
                    """),
                    {
                        "used_at": datetime.now(),
                        "id": otp_row["id"],
                    },
                )

                if door.status in [DoorStatus.OFFLINE.value, DoorStatus.ERROR.value]:
                    access_granted = False
                    reason = f"Door is not available. Current status: {door.status}"

                elif door.ip_address:
                    try:
                        async with aiohttp.ClientSession() as session:
                            url = f"http://{door.ip_address}:{door.port}/unlock"
                            async with session.post(
                                url,
                                timeout=aiohttp.ClientTimeout(total=5),
                            ) as response:
                                if response.status == 200:
                                    door_opened = True
                                    reason = "OTP verified. Door opened by controller."
                                else:
                                    door_opened = False
                                    reason = f"OTP verified, but controller returned status {response.status}"
                    except Exception as exc:
                        logger.warning("OTP verified but controller unreachable: %s", exc)
                        door_opened = False
                        reason = "OTP verified, but door controller is unreachable"

                else:
                    door_opened = True
                    reason = "OTP verified. Door open command simulated."

                if door_opened:
                    door.is_locked = False
                    door.updated_at = datetime.now()

            event_type = (
                AccessLogType.GRANTED.value
                if access_granted and door_opened
                else AccessLogType.DENIED.value
            )

            log_entry = DBAccessLog(
                id=str(uuid.uuid4()),
                door_id=door_id,
                user_id=None,
                user_name=clean_email,
                event_type=event_type,
                similarity_score=None,
                building_id=door.building_id,
                details=(
                    f"{reason} | fallback=email_otp"
                    + (f" | camera_id={camera_id}" if camera_id else "")
                ),
            )

            db.add(log_entry)
            db.commit()

            return {
                "success": True,
                "event_logged": True,
                "otp_verified": access_granted,
                "access_granted": access_granted,
                "door_opened": door_opened,
                "message": reason,
                "door_id": door_id,
                "email": clean_email,
                "camera_id": camera_id,
                "event_type": event_type,
            }

        finally:
            db.close()

    async def process_camera_access_event_for_admin(
        self,
        actor_admin_id: str,
        door_id: str,
        user_id: str,
        similarity_score: float,
        camera_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)

            door = db.query(DBDoor).filter(DBDoor.id == door_id).first()
            if not door:
                # Let the normal camera function log this denied attempt.
                return await self.process_camera_access_event(
                    door_id=door_id,
                    user_id=user_id,
                    similarity_score=similarity_score,
                    camera_id=camera_id,
                )

            self._require_building_scope(db, actor, door.building_id)

        finally:
            db.close()

        return await self.process_camera_access_event(
            door_id=door_id,
            user_id=user_id,
            similarity_score=similarity_score,
            camera_id=camera_id,
        )

    def _require_active_admin(self, db, admin_id: str) -> DBAdminUser:
        admin = self._get_admin_row(db, admin_id)

        if not admin:
            raise PermissionError("Admin not found")

        if not admin.is_active:
            raise PermissionError("Admin account is inactive")

        return admin


    def _require_super_admin(self, actor: DBAdminUser):
        if actor.role != AdminRole.SUPER_ADMIN.value:
            raise PermissionError("Only super admin can perform this action")


    def _require_tenant_scope(self, actor: DBAdminUser, tenant_id: str):
        if actor.role == AdminRole.SUPER_ADMIN.value:
            return

        if actor.role == AdminRole.TENANT_ADMIN.value and actor.tenant_id == tenant_id:
            return

        raise PermissionError("You do not have permission for this tenant")


    def _require_building_scope(self, db, actor: DBAdminUser, building_id: str) -> DBBuilding:
        building = db.query(DBBuilding).filter(DBBuilding.id == building_id).first()

        if not building:
            raise LookupError("Building not found")

        if actor.role == AdminRole.SUPER_ADMIN.value:
            return building

        if actor.role == AdminRole.TENANT_ADMIN.value and actor.tenant_id == building.tenant_id:
            return building

        if actor.role == AdminRole.BUILDING_ADMIN.value and actor.building_id == building_id:
            return building

        raise PermissionError("You do not have permission for this building")

    def get_all_buildings(self) -> List[Building]:
        db = self._get_db()
        try:
            rows = db.query(DBBuilding).order_by(DBBuilding.created_at.desc()).all()
            return [self._to_building_schema(row) for row in rows]
        finally:
            db.close()

    def get_building(self, building_id: str) -> Optional[Building]:
        db = self._get_db()
        try:
            row = db.query(DBBuilding).filter(DBBuilding.id == building_id).first()
            return self._to_building_schema(row) if row else None
        finally:
            db.close()

    def create_building(self, name: str, description: str = "", color: str = "#667eea", icon: str = "building") -> Building:
        db = self._get_db()
        try:
            row = DBBuilding(id=self._new_id("bld"), name=name, description=description, color=color, icon=icon)
            db.add(row)
            db.commit()
            db.refresh(row)
            return self._to_building_schema(row)
        finally:
            db.close()

    def update_building(self, building_id: str, **kwargs) -> Optional[Building]:
        db = self._get_db()
        try:
            row = db.query(DBBuilding).filter(DBBuilding.id == building_id).first()
            if not row:
                return None
            for key, value in kwargs.items():
                if hasattr(row, key) and key not in {"id", "created_at"}:
                    setattr(row, key, value)
            row.updated_at = datetime.now()
            db.commit()
            db.refresh(row)
            return self._to_building_schema(row)
        finally:
            db.close()

    def delete_building(self, building_id: str) -> bool:
        db = self._get_db()
        try:
            row = db.query(DBBuilding).filter(DBBuilding.id == building_id).first()
            if not row:
                return False
            db.delete(row)
            db.commit()
            return True
        finally:
            db.close()

    def get_all_doors(self) -> List[Door]:
        db = self._get_db()
        try:
            rows = db.query(DBDoor).order_by(DBDoor.created_at.desc()).all()
            return [self._to_door_schema(row) for row in rows]
        finally:
            db.close()

    def get_door(self, door_id: str) -> Optional[Door]:
        db = self._get_db()
        try:
            row = db.query(DBDoor).filter(DBDoor.id == door_id).first()
            return self._to_door_schema(row) if row else None
        finally:
            db.close()

    def get_doors_by_building(self, building_id: str) -> List[Door]:
        db = self._get_db()
        try:
            rows = db.query(DBDoor).filter(DBDoor.building_id == building_id).all()
            return [self._to_door_schema(row) for row in rows]
        finally:
            db.close()

    def create_door(self, name: str, building_id: str, location: str = "", ip_address: str = "", port: int = 80) -> Optional[Door]:
        db = self._get_db()
        try:
            building = db.query(DBBuilding).filter(DBBuilding.id == building_id).first()
            if not building:
                return None
            row = DBDoor(id=self._new_id("door"), name=name, location=location, ip_address=ip_address, port=port, building_id=building_id)
            db.add(row)
            db.commit()
            db.refresh(row)
            return self._to_door_schema(row)
        finally:
            db.close()

    def update_door(self, door_id: str, **kwargs) -> Optional[Door]:
        db = self._get_db()
        try:
            row = db.query(DBDoor).filter(DBDoor.id == door_id).first()
            if not row:
                return None
            for key, value in kwargs.items():
                if hasattr(row, key) and key not in {"id", "created_at"}:
                    setattr(row, key, value)
            row.updated_at = datetime.now()
            db.commit()
            db.refresh(row)
            return self._to_door_schema(row)
        finally:
            db.close()

    def delete_door(self, door_id: str) -> bool:
        db = self._get_db()
        try:
            row = db.query(DBDoor).filter(DBDoor.id == door_id).first()
            if not row:
                return False
            db.delete(row)
            db.commit()
            return True
        finally:
            db.close()

    async def trigger_door_open(self, door_id: str, user_id: Optional[str] = None, reason: str = "authorized") -> Dict[str, Any]:
        db = self._get_db()
        try:
            door = db.query(DBDoor).filter(DBDoor.id == door_id).first()
            if not door:
                return {"success": False, "message": "Door not found"}
            user = db.query(DBUser).filter(DBUser.id == user_id).first() if user_id else None
            log_entry = DBAccessLog(
                id=str(uuid.uuid4()),
                door_id=door_id,
                user_id=user_id,
                user_name=user.name if user else None,
                event_type=AccessLogType.GRANTED.value if user_id else AccessLogType.MANUAL_UNLOCK.value,
                building_id=door.building_id,
                details=f"Door opened: {reason}",
            )
            db.add(log_entry)
            db.commit()
            if door.ip_address:
                try:
                    async with aiohttp.ClientSession() as session:
                        url = f"http://{door.ip_address}:{door.port}/unlock"
                        async with session.post(url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                            if response.status == 200:
                                return {"success": True, "message": f"Door {door.name} opened"}
                            return {"success": True, "message": f"Command sent to {door.name} (simulated)"}
                except Exception as exc:
                    logger.warning("Could not reach door controller: %s", exc)
                    return {"success": True, "message": f"Door {door.name} open command logged (controller unreachable)"}
            return {"success": True, "message": f"Door {door.name} open command logged"}
        finally:
            db.close()

    def get_all_users(self) -> List[User]:
        db = self._get_db()
        try:
            rows = db.query(DBUser).order_by(DBUser.created_at.desc()).all()
            return [self._to_user_schema(row) for row in rows]
        finally:
            db.close()

    def get_user(self, user_id: str) -> Optional[User]:
        db = self._get_db()
        try:
            row = db.query(DBUser).filter(DBUser.id == user_id).first()
            return self._to_user_schema(row) if row else None
        finally:
            db.close()

    def get_users_by_building(self, building_id: str) -> List[User]:
        db = self._get_db()
        try:
            door_ids = [row.id for row in db.query(DBDoor.id).filter(DBDoor.building_id == building_id).all()]
            rows = db.query(DBUser).filter(DBUser.authorized_doors.isnot(None)).all()
            return [self._to_user_schema(row) for row in rows if any(did in door_ids for did in (row.authorized_doors or []))]
        finally:
            db.close()

    def create_user(self, user_id: str, name: str, email: str = "", department: str = "", role: str = "employee") -> User:
        db = self._get_db()
        try:
            row = DBUser(id=user_id, name=name, email=email, department=department, role=role, face_registered=True, is_active=True)
            db.add(row)
            db.commit()
            db.refresh(row)
            return self._to_user_schema(row)
        finally:
            db.close()

    def update_user(self, user_id: str, **kwargs) -> Optional[User]:
        db = self._get_db()
        try:
            row = db.query(DBUser).filter(DBUser.id == user_id).first()
            if not row:
                return None
            for key, value in kwargs.items():
                if hasattr(row, key) and key not in {"id", "created_at"}:
                    setattr(row, key, value)
            row.updated_at = datetime.now()
            db.commit()
            db.refresh(row)
            return self._to_user_schema(row)
        finally:
            db.close()

    def delete_user(self, user_id: str) -> bool:
        db = self._get_db()
        try:
            row = db.query(DBUser).filter(DBUser.id == user_id).first()
            if not row:
                return False
            db.delete(row)
            db.commit()
            return True
        finally:
            db.close()

    def get_dashboard_stats_for_admin(self, actor_admin_id: str) -> Dict[str, Any]:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)
            today = datetime.now().date()
            today_start = datetime.combine(today, datetime.min.time())

            if actor.role == AdminRole.SUPER_ADMIN.value:
                building_ids = [row.id for row in db.query(DBBuilding.id).all()]

            elif actor.role == AdminRole.TENANT_ADMIN.value:
                building_ids = [
                    row.id
                    for row in db.query(DBBuilding.id)
                    .filter(DBBuilding.tenant_id == actor.tenant_id)
                    .all()
                ]

            elif actor.role == AdminRole.BUILDING_ADMIN.value:
                building_ids = [actor.building_id]

            else:
                building_ids = []

            door_ids = [
                row.id
                for row in db.query(DBDoor.id)
                .filter(DBDoor.building_id.in_(building_ids))
                .all()
            ]

            users = db.query(DBUser).filter(DBUser.authorized_doors.isnot(None)).all()
            scoped_users = [
                user for user in users
                if any(door_id in door_ids for door_id in (user.authorized_doors or []))
            ]

            scoped_logs_query = db.query(DBAccessLog).filter(DBAccessLog.building_id.in_(building_ids))
            todays_logs_query = scoped_logs_query.filter(DBAccessLog.timestamp >= today_start)

            return {
                "total_buildings": len(building_ids),
                "total_doors": len(door_ids),
                "total_users": len(scoped_users),
                "registered_faces": len([user for user in scoped_users if user.face_registered]),
                "online_doors": (
                    db.query(DBDoor)
                    .filter(
                        DBDoor.id.in_(door_ids),
                        DBDoor.status == DoorStatus.ONLINE.value,
                    )
                    .count()
                ),
                "today_access_events": todays_logs_query.count(),
                "today_granted": (
                    scoped_logs_query
                    .filter(
                        DBAccessLog.event_type == AccessLogType.GRANTED.value,
                        DBAccessLog.timestamp >= today_start,
                    )
                    .count()
                ),
                "today_denied": (
                    scoped_logs_query
                    .filter(
                        DBAccessLog.event_type == AccessLogType.DENIED.value,
                        DBAccessLog.timestamp >= today_start,
                    )
                    .count()
                ),
            }

        finally:
            db.close()


    def update_building_for_admin(self, actor_admin_id: str, building_id: str, **kwargs) -> Optional[Building]:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)

            if actor.role == AdminRole.BUILDING_ADMIN.value:
                raise PermissionError("Building admin cannot update building details")

            building = self._require_building_scope(db, actor, building_id)

            for key, value in kwargs.items():
                if hasattr(building, key) and key not in {
                    "id",
                    "tenant_id",
                    "default_admin_id",
                    "created_at",
                }:
                    setattr(building, key, value)

            building.updated_at = datetime.now()

            db.commit()
            db.refresh(building)

            return self._to_building_schema(building)

        finally:
            db.close()


    def delete_building_for_admin(self, actor_admin_id: str, building_id: str) -> bool:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)

            if actor.role == AdminRole.BUILDING_ADMIN.value:
                raise PermissionError("Building admin cannot delete buildings")

            building = self._require_building_scope(db, actor, building_id)

            if not building:
                return False

            db.delete(building)
            db.commit()

            return True

        finally:
            db.close()


    def get_user_for_admin(self, actor_admin_id: str, user_id: str) -> Optional[User]:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)

            user, raw_user_id, clean_user_id = self._find_user_by_identifier(db, user_id)

            if not user:
                return None

            if actor.role == AdminRole.SUPER_ADMIN.value:
                return self._to_user_schema(user)

            if actor.role == AdminRole.TENANT_ADMIN.value:
                scoped_building_ids = [
                    row.id
                    for row in db.query(DBBuilding.id)
                    .filter(DBBuilding.tenant_id == actor.tenant_id)
                    .all()
                ]

            elif actor.role == AdminRole.BUILDING_ADMIN.value:
                scoped_building_ids = [actor.building_id]

            else:
                scoped_building_ids = []

            scoped_door_ids = [
                row.id
                for row in db.query(DBDoor.id)
                .filter(DBDoor.building_id.in_(scoped_building_ids))
                .all()
            ]

            if any(door_id in scoped_door_ids for door_id in (user.authorized_doors or [])):
                return self._to_user_schema(user)

            raise PermissionError("You do not have permission to view this user")

        finally:
            db.close()


    def require_admin_exists(self, actor_admin_id: str) -> bool:
        db = self._get_db()
        try:
            self._require_active_admin(db, actor_admin_id)
            return True
        finally:
            db.close()


    def process_face_recognition_access_for_admin(
        self,
        actor_admin_id: str,
        user_id: str,
        similarity_score: float,
        door_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not door_id:
            raise ValueError("door_id is required for admin-scoped face recognition testing")

        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)

            door = db.query(DBDoor).filter(DBDoor.id == door_id).first()
            if not door:
                raise LookupError("Door not found")

            self._require_building_scope(db, actor, door.building_id)

        finally:
            db.close()

        return self.process_face_recognition_access(
            user_id=user_id,
            similarity_score=similarity_score,
            door_id=door_id,
        )

    def authorize_user_for_doors(self, user_id: str, door_ids: List[str]) -> bool:
        db = self._get_db()
        try:
            row, raw_user_id, clean_user_id = self._find_user_by_identifier(db, user_id)
            if not row:
                return False

            valid_door_ids = []
            seen = set()

            for door_id in door_ids:
                if door_id in seen:
                    continue

                door_exists = db.query(DBDoor).filter(DBDoor.id == door_id).first()
                if door_exists:
                    valid_door_ids.append(door_id)
                    seen.add(door_id)

            # Replace the full access list.
            # This allows both adding and removing door access.
            row.authorized_doors = valid_door_ids
            row.updated_at = datetime.now()

            db.commit()
            return True

        finally:
            db.close()

    def set_user_face_registered(self, user_id: str, registered: bool = True) -> bool:
        db = self._get_db()
        try:
            row = db.query(DBUser).filter(DBUser.id == user_id).first()
            if not row:
                return False
            row.face_registered = registered
            row.updated_at = datetime.now()
            db.commit()
            return True
        finally:
            db.close()

    def check_user_access(self, user_id: str, door_id: str) -> Dict[str, Any]:
        db = self._get_db()
        try:
            user = db.query(DBUser).filter(DBUser.id == user_id).first()
            door = db.query(DBDoor).filter(DBDoor.id == door_id).first()
            if not user:
                return {"authorized": False, "reason": "User not found"}
            if not door:
                return {"authorized": False, "reason": "Door not found"}
            if not user.is_active:
                return {"authorized": False, "reason": "User account is inactive"}
            if not user.face_registered:
                return {"authorized": False, "reason": "Face not registered"}
            if user.authorized_doors and door_id in user.authorized_doors:
                return {"authorized": True, "user": self._to_user_schema(user), "door": self._to_door_schema(door), "building": self.get_building(door.building_id)}
            return {"authorized": False, "reason": "User not authorized for this door"}
        finally:
            db.close()

    def process_face_recognition_access(self, user_id: str, similarity_score: float, door_id: Optional[str] = None) -> Dict[str, Any]:
        db = self._get_db()
        try:
            user = db.query(DBUser).filter(DBUser.id == user_id).first()
            if not user:
                return {"success": False, "message": "User not found in access control system"}
            if door_id is None:
                accessible_doors = [did for did in (user.authorized_doors or []) if db.query(DBDoor).filter(DBDoor.id == did).first() and db.query(DBDoor).filter(DBDoor.id == did).first().status == DoorStatus.ONLINE.value]
                if not accessible_doors:
                    return {"success": False, "message": "No accessible doors found"}
                for did in accessible_doors:
                    door = db.query(DBDoor).filter(DBDoor.id == did).first()
                    db.add(DBAccessLog(id=str(uuid.uuid4()), door_id=did, user_id=user_id, user_name=user.name, event_type=AccessLogType.GRANTED.value, similarity_score=similarity_score, building_id=door.building_id if door else None, details=f"Face recognition access granted (score: {similarity_score:.2f})"))
                db.commit()
                return {"success": True, "message": f"Access granted for {user.name}", "doors": accessible_doors, "user": self._to_user_schema(user).model_dump(mode='json')}

            access_check = self.check_user_access(user_id, door_id)
            if not access_check["authorized"]:
                door = db.query(DBDoor).filter(DBDoor.id == door_id).first()
                db.add(DBAccessLog(id=str(uuid.uuid4()), door_id=door_id, user_id=user_id, user_name=user.name, event_type=AccessLogType.DENIED.value, similarity_score=similarity_score, building_id=door.building_id if door else None, details=f"Access denied: {access_check['reason']}"))
                db.commit()
                return {"success": False, "message": access_check["reason"]}
            door = db.query(DBDoor).filter(DBDoor.id == door_id).first()
            db.add(DBAccessLog(id=str(uuid.uuid4()), door_id=door_id, user_id=user_id, user_name=user.name, event_type=AccessLogType.GRANTED.value, similarity_score=similarity_score, building_id=door.building_id if door else None, details=f"Face recognition access granted (score: {similarity_score:.2f})"))
            db.commit()
            return {"success": True, "message": f"Access granted for {user.name}", "door": self._to_door_schema(door).model_dump(mode='json'), "user": self._to_user_schema(user).model_dump(mode='json')}
        finally:
            db.close()

    def _normalize_user_identifier(self, user_identifier: str) -> str:
        """
        Normalize user identifier.

        Supports both:
        - InSP/2025/6177/676
        - InSP/2025/6177/676 - Kisanja
        """
        raw_value = str(user_identifier or "").strip()

        if " - " in raw_value:
            return raw_value.split(" - ")[0].strip()

        return raw_value


    def _find_user_by_identifier(self, db, user_identifier: str):
        """
        Find user using either clean employee ID or display label.

        This makes camera-event endpoint support both:
        - clean ID
        - ID + name display format
        """
        raw_user_id = str(user_identifier or "").strip()
        clean_user_id = self._normalize_user_identifier(raw_user_id)

        # 1. Try exact raw value first
        user = db.query(DBUser).filter(DBUser.id == raw_user_id).first()
        if user:
            return user, raw_user_id, clean_user_id

        # 2. Try clean employee ID
        user = db.query(DBUser).filter(DBUser.id == clean_user_id).first()
        if user:
            return user, raw_user_id, clean_user_id

        # 3. Support older records that may have been saved as "ID - Name"
        user = db.query(DBUser).filter(DBUser.id.like(f"{clean_user_id} - %")).first()
        if user:
            return user, raw_user_id, clean_user_id

        return None, raw_user_id, clean_user_id

    async def process_camera_access_event(
        self,
        door_id: str,
        user_id: str,
        similarity_score: float,
        camera_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Process a camera/face-recognition access event.

        This endpoint is for future camera device integration.
        It records both granted and denied attempts in access logs.

        It supports user_id in both formats:
        - InSP/2025/6177/676
        - InSP/2025/6177/676 - Kisanja
        """
        db = self._get_db()
        similarity_threshold = float(getattr(settings, "face_similarity_threshold", 0.6))

        try:
            door = db.query(DBDoor).filter(DBDoor.id == door_id).first()
            user, raw_user_id, clean_user_id = self._find_user_by_identifier(db, user_id)

            resolved_user_id = user.id if user else clean_user_id

            access_granted = False
            door_opened = False
            reason = ""
            event_type = AccessLogType.DENIED.value

            door_data = self._to_door_schema(door).model_dump(mode="json") if door else None
            user_data = self._to_user_schema(user).model_dump(mode="json") if user else None

            if not door:
                reason = "Door not found"
            elif not user:
                reason = "User not found"
            elif not user.is_active:
                reason = "User account is inactive"
            elif not user.face_registered:
                reason = "Face not registered"
            elif similarity_score < similarity_threshold:
                reason = f"Similarity score below threshold ({similarity_score:.2f} < {similarity_threshold:.2f})"
            elif door.status in [DoorStatus.OFFLINE.value, DoorStatus.ERROR.value]:
                reason = f"Door is not available. Current status: {door.status}"
            elif door_id not in (user.authorized_doors or []):
                reason = "User not authorized for this door"
            else:
                access_granted = True
                event_type = AccessLogType.GRANTED.value
                reason = "Camera access granted"

                if door.ip_address:
                    try:
                        async with aiohttp.ClientSession() as session:
                            url = f"http://{door.ip_address}:{door.port}/unlock"
                            async with session.post(
                                url,
                                timeout=aiohttp.ClientTimeout(total=5),
                            ) as response:
                                if response.status == 200:
                                    door_opened = True
                                    reason = "Camera access granted. Door opened by controller."
                                else:
                                    door_opened = False
                                    reason = f"Camera access granted, but controller returned status {response.status}"
                    except Exception as exc:
                        logger.warning("Camera access granted but controller unreachable: %s", exc)
                        door_opened = False
                        reason = "Camera access granted, but door controller is unreachable"
                else:
                    door_opened = True
                    reason = "Camera access granted. Door open command simulated."

                door.is_locked = False
                door.updated_at = datetime.now()

            details_parts = [
                reason,
                f"similarity_score={similarity_score:.2f}",
                f"threshold={similarity_threshold:.2f}",
            ]

            if raw_user_id != clean_user_id:
                details_parts.append(f"raw_user_id={raw_user_id}")
                details_parts.append(f"clean_user_id={clean_user_id}")

            if camera_id:
                details_parts.append(f"camera_id={camera_id}")

            log_entry = DBAccessLog(
                id=str(uuid.uuid4()),
                door_id=door_id,
                user_id=resolved_user_id,
                user_name=user.name if user else None,
                event_type=event_type,
                similarity_score=similarity_score,
                building_id=door.building_id if door else None,
                details=" | ".join(details_parts),
            )

            db.add(log_entry)
            db.commit()

            return {
                "success": True,
                "event_logged": True,
                "access_granted": access_granted,
                "door_opened": door_opened,
                "message": reason,
                "door_id": door_id,
                "requested_user_id": raw_user_id,
                "resolved_user_id": resolved_user_id,
                "clean_user_id": clean_user_id,
                "camera_id": camera_id,
                "similarity_score": similarity_score,
                "threshold": similarity_threshold,
                "event_type": event_type,
                "door": door_data,
                "user": user_data,
            }

        finally:
            db.close()      

    def get_access_logs(self, limit: int = 100, door_id: Optional[str] = None, user_id: Optional[str] = None, building_id: Optional[str] = None) -> List[AccessLog]:
        db = self._get_db()
        try:
            query = db.query(DBAccessLog)
            if door_id:
                query = query.filter(DBAccessLog.door_id == door_id)
            if user_id:
                query = query.filter(DBAccessLog.user_id == user_id)
            if building_id:
                query = query.filter(DBAccessLog.building_id == building_id)
            rows = query.order_by(DBAccessLog.timestamp.desc()).limit(limit).all()
            return [self._to_access_log_schema(row) for row in rows]
        finally:
            db.close()

    # ==================== Admin / Tenant Management ====================

    def bootstrap_super_admin(self) -> AdminUser:
        """
        Create or update the only super admin using .env credentials.

        This is for initial setup only.
        Username/password come from environment variables.
        """
        db = self._get_db()
        try:
            company_user_id = settings.super_admin_company_user_id.strip()
            name = settings.super_admin_name.strip()
            email = settings.super_admin_email.strip()
            username = settings.super_admin_username.strip().lower()
            password = settings.super_admin_password

            if not password:
                raise ValueError("SUPER_ADMIN_PASSWORD is required in .env")

            if not username:
                raise ValueError("SUPER_ADMIN_USERNAME is required in .env")

            existing_super_admin = (
                db.query(DBAdminUser)
                .filter(DBAdminUser.role == AdminRole.SUPER_ADMIN.value)
                .first()
            )

            username_owner = (
                db.query(DBAdminUser)
                .filter(DBAdminUser.username == username)
                .first()
            )

            if username_owner and (
                not existing_super_admin or username_owner.id != existing_super_admin.id
            ):
                raise ValueError("SUPER_ADMIN_USERNAME is already used by another admin")

            if existing_super_admin:
                existing_super_admin.company_user_id = company_user_id
                existing_super_admin.name = name
                existing_super_admin.email = email
                existing_super_admin.username = username

                # If old super admin had no password, configure it now.
                if not existing_super_admin.password_hash:
                    existing_super_admin.password_hash = hash_password(password)

                existing_super_admin.updated_at = datetime.now()

                db.commit()
                db.refresh(existing_super_admin)

                return self._to_admin_schema(existing_super_admin)

            admin = DBAdminUser(
                id=self._new_id("adm"),
                company_user_id=company_user_id,
                username=username,
                password_hash=hash_password(password),
                name=name,
                email=email or "",
                role=AdminRole.SUPER_ADMIN.value,
                tenant_id=None,
                building_id=None,
                is_default_admin=True,
                is_active=True,
                created_by=None,
            )

            db.add(admin)
            db.commit()
            db.refresh(admin)

            return self._to_admin_schema(admin)

        finally:
            db.close()


    def get_admin(self, admin_id: str) -> Optional[AdminUser]:
        db = self._get_db()
        try:
            admin = self._get_admin_row(db, admin_id)
            return self._to_admin_schema(admin) if admin else None
        finally:
            db.close()


    def get_tenants_for_admin(self, actor_admin_id: str) -> List[Tenant]:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)

            if actor.role == AdminRole.SUPER_ADMIN.value:
                rows = db.query(DBTenant).order_by(DBTenant.created_at.desc()).all()
            elif actor.role == AdminRole.TENANT_ADMIN.value:
                rows = db.query(DBTenant).filter(DBTenant.id == actor.tenant_id).all()
            elif actor.role == AdminRole.BUILDING_ADMIN.value:
                building = db.query(DBBuilding).filter(DBBuilding.id == actor.building_id).first()
                rows = db.query(DBTenant).filter(DBTenant.id == building.tenant_id).all() if building else []
            else:
                rows = []

            return [self._to_tenant_schema(row) for row in rows]
        finally:
            db.close()

    def create_tenant(
        self,
        actor_admin_id: str,
        name: str,
        code: str,
        default_admin_company_user_id: str,
        default_admin_name: str,
        default_admin_email: str = "",
        default_admin_username: str = "",
        default_admin_password: str = "",
        description: str = "",
    ) -> Dict[str, Any]:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)
            self._require_super_admin(actor)

            clean_code = str(code or "").strip().lower()

            if not clean_code:
                raise ValueError("Tenant code is required")

            existing = db.query(DBTenant).filter(DBTenant.code == clean_code).first()
            if existing:
                raise ValueError("Tenant code already exists")

            clean_username = self._ensure_admin_username_available(
                db,
                default_admin_username,
            )

            tenant = DBTenant(
                id=self._new_id("tenant"),
                name=name,
                code=clean_code,
                description=description or "",
                is_active=True,
                default_admin_id=None,
            )

            db.add(tenant)
            db.flush()

            default_admin = DBAdminUser(
                id=self._new_id("adm"),
                company_user_id=str(default_admin_company_user_id).strip(),
                username=clean_username,
                password_hash=self._make_password_hash(default_admin_password),
                name=default_admin_name,
                email=default_admin_email or "",
                role=AdminRole.TENANT_ADMIN.value,
                tenant_id=tenant.id,
                building_id=None,
                is_default_admin=True,
                is_active=True,
                created_by=actor.id,
            )

            db.add(default_admin)
            db.flush()

            tenant.default_admin_id = default_admin.id

            db.commit()
            db.refresh(tenant)
            db.refresh(default_admin)

            return {
                "tenant": self._to_tenant_schema(tenant),
                "default_admin": self._to_admin_schema(default_admin),
            }

        finally:
            db.close()


    def delete_tenant(self, actor_admin_id: str, tenant_id: str) -> bool:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)
            self._require_super_admin(actor)

            tenant = db.query(DBTenant).filter(DBTenant.id == tenant_id).first()
            if not tenant:
                return False

            db.delete(tenant)
            db.commit()
            return True

        finally:
            db.close()


    def create_tenant_admin(
        self,
        actor_admin_id: str,
        tenant_id: str,
        company_user_id: str,
        name: str,
        email: str = "",
        username: str = "",
        password: str = "",
    ) -> AdminUser:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)
            self._require_tenant_scope(actor, tenant_id)

            tenant = db.query(DBTenant).filter(DBTenant.id == tenant_id).first()
            if not tenant:
                raise LookupError("Tenant not found")

            clean_username = self._ensure_admin_username_available(db, username)

            admin = DBAdminUser(
                id=self._new_id("adm"),
                company_user_id=str(company_user_id).strip(),
                username=clean_username,
                password_hash=self._make_password_hash(password),
                name=name,
                email=email or "",
                role=AdminRole.TENANT_ADMIN.value,
                tenant_id=tenant_id,
                building_id=None,
                is_default_admin=False,
                is_active=True,
                created_by=actor.id,
            )

            db.add(admin)
            db.commit()
            db.refresh(admin)

            return self._to_admin_schema(admin)

        finally:
            db.close()


    def get_tenant_admins(self, actor_admin_id: str, tenant_id: str) -> List[AdminUser]:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)
            self._require_tenant_scope(actor, tenant_id)

            rows = (
                db.query(DBAdminUser)
                .filter(
                    DBAdminUser.tenant_id == tenant_id,
                    DBAdminUser.role == AdminRole.TENANT_ADMIN.value,
                )
                .order_by(DBAdminUser.created_at.desc())
                .all()
            )

            return [self._to_admin_schema(row) for row in rows]

        finally:
            db.close()


    def get_buildings_for_admin(self, actor_admin_id: str) -> List[Building]:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)

            if actor.role == AdminRole.SUPER_ADMIN.value:
                rows = db.query(DBBuilding).order_by(DBBuilding.created_at.desc()).all()
            elif actor.role == AdminRole.TENANT_ADMIN.value:
                rows = (
                    db.query(DBBuilding)
                    .filter(DBBuilding.tenant_id == actor.tenant_id)
                    .order_by(DBBuilding.created_at.desc())
                    .all()
                )
            elif actor.role == AdminRole.BUILDING_ADMIN.value:
                rows = (
                    db.query(DBBuilding)
                    .filter(DBBuilding.id == actor.building_id)
                    .order_by(DBBuilding.created_at.desc())
                    .all()
                )
            else:
                rows = []

            return [self._to_building_schema(row) for row in rows]

        finally:
            db.close()


    def create_building_with_default_admin(
        self,
        actor_admin_id: str,
        name: str,
        tenant_id: Optional[str],
        default_admin_company_user_id: str,
        default_admin_name: str,
        default_admin_email: str = "",
        default_admin_username: str = "",
        default_admin_password: str = "",
        description: str = "",
        color: str = "#667eea",
        icon: str = "building",
    ) -> Dict[str, Any]:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)

            if actor.role == AdminRole.SUPER_ADMIN.value:
                if not tenant_id:
                    raise ValueError("tenant_id is required for super admin building creation")
                scoped_tenant_id = tenant_id
            elif actor.role == AdminRole.TENANT_ADMIN.value:
                scoped_tenant_id = actor.tenant_id
            else:
                raise PermissionError("Building admin cannot create buildings")

            tenant = db.query(DBTenant).filter(DBTenant.id == scoped_tenant_id).first()
            if not tenant:
                raise LookupError("Tenant not found")

            clean_building_admin_id = self._validate_building_admin_company_id(
                default_admin_company_user_id
            )

            clean_username = self._ensure_admin_username_available(
                db,
                default_admin_username,
            )

            building = DBBuilding(
                id=self._new_id("bld"),
                name=name,
                description=description or "",
                color=color,
                icon=icon,
                tenant_id=scoped_tenant_id,
                default_admin_id=None,
            )

            db.add(building)
            db.flush()

            default_admin = DBAdminUser(
                id=self._new_id("adm"),
                company_user_id=clean_building_admin_id,
                username=clean_username,
                password_hash=self._make_password_hash(default_admin_password),
                name=default_admin_name,
                email=default_admin_email or "",
                role=AdminRole.BUILDING_ADMIN.value,
                tenant_id=scoped_tenant_id,
                building_id=building.id,
                is_default_admin=True,
                is_active=True,
                created_by=actor.id,
            )

            db.add(default_admin)
            db.flush()

            building.default_admin_id = default_admin.id

            db.commit()
            db.refresh(building)
            db.refresh(default_admin)

            return {
                "building": self._to_building_schema(building),
                "default_admin": self._to_admin_schema(default_admin),
            }

        finally:
            db.close()


    def create_building_admin(
        self,
        actor_admin_id: str,
        building_id: str,
        company_user_id: str,
        name: str,
        email: str = "",
        username: str = "",
        password: str = "",
    ) -> AdminUser:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)
            building = self._require_building_scope(db, actor, building_id)

            clean_building_admin_id = self._validate_building_admin_company_id(company_user_id)
            clean_username = self._ensure_admin_username_available(db, username)

            admin = DBAdminUser(
                id=self._new_id("adm"),
                company_user_id=clean_building_admin_id,
                username=clean_username,
                password_hash=self._make_password_hash(password),
                name=name,
                email=email or "",
                role=AdminRole.BUILDING_ADMIN.value,
                tenant_id=building.tenant_id,
                building_id=building.id,
                is_default_admin=False,
                is_active=True,
                created_by=actor.id,
            )

            db.add(admin)
            db.commit()
            db.refresh(admin)

            return self._to_admin_schema(admin)

        finally:
            db.close()


    def get_building_admins(self, actor_admin_id: str, building_id: str) -> List[AdminUser]:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)
            self._require_building_scope(db, actor, building_id)

            rows = (
                db.query(DBAdminUser)
                .filter(
                    DBAdminUser.building_id == building_id,
                    DBAdminUser.role == AdminRole.BUILDING_ADMIN.value,
                )
                .order_by(DBAdminUser.created_at.desc())
                .all()
            )

            return [self._to_admin_schema(row) for row in rows]

        finally:
            db.close()


    def delete_admin(self, actor_admin_id: str, target_admin_id: str) -> bool:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)

            target = db.query(DBAdminUser).filter(DBAdminUser.id == target_admin_id).first()

            if not target:
                return False

            if target.id == actor.id:
                raise PermissionError("You cannot delete your own admin account")

            if target.role == AdminRole.SUPER_ADMIN.value:
                raise PermissionError("Super admin cannot be deleted")

            if target.is_default_admin:
                raise PermissionError("Default admin cannot be deleted directly")

            if actor.role == AdminRole.SUPER_ADMIN.value:
                pass

            elif actor.role == AdminRole.TENANT_ADMIN.value:
                if target.tenant_id != actor.tenant_id:
                    raise PermissionError("You can only delete admins inside your tenant")

            elif actor.role == AdminRole.BUILDING_ADMIN.value:
                if target.role != AdminRole.BUILDING_ADMIN.value:
                    raise PermissionError("Building admin can only delete building admins")

                if target.building_id != actor.building_id:
                    raise PermissionError("You can only delete admins inside your building")

            else:
                raise PermissionError("You do not have permission to delete admins")

            db.delete(target)
            db.commit()
            return True

        finally:
            db.close()

    def get_building_row_for_admin(self, actor_admin_id: str, building_id: str):
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)
            building = self._require_building_scope(db, actor, building_id)
            return self._to_building_schema(building)
        finally:
            db.close()


    def get_doors_for_admin(self, actor_admin_id: str, building_id: Optional[str] = None) -> List[Door]:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)

            query = db.query(DBDoor).join(DBBuilding, DBDoor.building_id == DBBuilding.id)

            if actor.role == AdminRole.SUPER_ADMIN.value:
                pass
            elif actor.role == AdminRole.TENANT_ADMIN.value:
                query = query.filter(DBBuilding.tenant_id == actor.tenant_id)
            elif actor.role == AdminRole.BUILDING_ADMIN.value:
                query = query.filter(DBDoor.building_id == actor.building_id)
            else:
                return []

            if building_id:
                building = self._require_building_scope(db, actor, building_id)
                query = query.filter(DBDoor.building_id == building.id)

            rows = query.order_by(DBDoor.created_at.desc()).all()
            return [self._to_door_schema(row) for row in rows]

        finally:
            db.close()

    def get_door_for_admin(self, actor_admin_id: str, door_id: str) -> Optional[Door]:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)

            door = db.query(DBDoor).filter(DBDoor.id == door_id).first()
            if not door:
                return None

            self._require_building_scope(db, actor, door.building_id)

            return self._to_door_schema(door)

        finally:
            db.close()

    def create_door_for_admin(
        self,
        actor_admin_id: str,
        name: str,
        building_id: str,
        location: str = "",
        ip_address: str = "",
        port: int = 80,
    ) -> Optional[Door]:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)
            building = self._require_building_scope(db, actor, building_id)

            row = DBDoor(
                id=self._new_id("door"),
                name=name,
                location=location,
                ip_address=ip_address,
                port=port,
                building_id=building.id,
            )

            db.add(row)
            db.commit()
            db.refresh(row)

            return self._to_door_schema(row)

        finally:
            db.close()


    def update_door_for_admin(self, actor_admin_id: str, door_id: str, **kwargs) -> Optional[Door]:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)

            door = db.query(DBDoor).filter(DBDoor.id == door_id).first()
            if not door:
                return None

            self._require_building_scope(db, actor, door.building_id)

            for key, value in kwargs.items():
                if hasattr(door, key) and key not in {"id", "created_at", "building_id"}:
                    setattr(door, key, value)

            door.updated_at = datetime.now()
            db.commit()
            db.refresh(door)

            return self._to_door_schema(door)

        finally:
            db.close()


    def delete_door_for_admin(self, actor_admin_id: str, door_id: str) -> bool:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)

            door = db.query(DBDoor).filter(DBDoor.id == door_id).first()
            if not door:
                return False

            self._require_building_scope(db, actor, door.building_id)

            db.delete(door)
            db.commit()

            return True

        finally:
            db.close()


    def get_users_for_admin(self, actor_admin_id: str, building_id: Optional[str] = None) -> List[User]:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)

            if actor.role == AdminRole.SUPER_ADMIN.value:
                allowed_building_ids = [row.id for row in db.query(DBBuilding.id).all()]
            elif actor.role == AdminRole.TENANT_ADMIN.value:
                allowed_building_ids = [
                    row.id
                    for row in db.query(DBBuilding.id)
                    .filter(DBBuilding.tenant_id == actor.tenant_id)
                    .all()
                ]
            elif actor.role == AdminRole.BUILDING_ADMIN.value:
                allowed_building_ids = [actor.building_id]
            else:
                allowed_building_ids = []

            if building_id:
                building = self._require_building_scope(db, actor, building_id)
                allowed_building_ids = [building.id]

            rows = db.query(DBUser).filter(DBUser.authorized_doors.isnot(None)).all()

            allowed_door_ids = [
                row.id
                for row in db.query(DBDoor.id)
                .filter(DBDoor.building_id.in_(allowed_building_ids))
                .all()
            ]

            result = []
            for user in rows:
                user_door_ids = user.authorized_doors or []
                if any(door_id in allowed_door_ids for door_id in user_door_ids):
                    result.append(self._to_user_schema(user))

            return result

        finally:
            db.close()


    def authorize_user_for_doors_by_admin(self, actor_admin_id: str, user_id: str, door_ids: List[str]) -> bool:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)
            user, raw_user_id, clean_user_id = self._find_user_by_identifier(db, user_id)

            if not user:
                return False

            valid_door_ids = []
            seen = set()

            for door_id in door_ids:
                if door_id in seen:
                    continue

                door = db.query(DBDoor).filter(DBDoor.id == door_id).first()
                if not door:
                    continue

                self._require_building_scope(db, actor, door.building_id)

                valid_door_ids.append(door_id)
                seen.add(door_id)

            user.authorized_doors = valid_door_ids
            user.updated_at = datetime.now()

            db.commit()
            return True

        finally:
            db.close()


    def get_access_logs_for_admin(
        self,
        actor_admin_id: str,
        limit: int = 100,
        door_id: Optional[str] = None,
        user_id: Optional[str] = None,
        building_id: Optional[str] = None,
    ) -> List[AccessLog]:
        db = self._get_db()
        try:
            actor = self._require_active_admin(db, actor_admin_id)

            query = db.query(DBAccessLog)

            if actor.role == AdminRole.SUPER_ADMIN.value:
                pass
            elif actor.role == AdminRole.TENANT_ADMIN.value:
                tenant_building_ids = [
                    row.id
                    for row in db.query(DBBuilding.id)
                    .filter(DBBuilding.tenant_id == actor.tenant_id)
                    .all()
                ]
                query = query.filter(DBAccessLog.building_id.in_(tenant_building_ids))
            elif actor.role == AdminRole.BUILDING_ADMIN.value:
                query = query.filter(DBAccessLog.building_id == actor.building_id)
            else:
                return []

            if building_id:
                self._require_building_scope(db, actor, building_id)
                query = query.filter(DBAccessLog.building_id == building_id)

            if door_id:
                door = db.query(DBDoor).filter(DBDoor.id == door_id).first()
                if not door:
                    return []
                self._require_building_scope(db, actor, door.building_id)
                query = query.filter(DBAccessLog.door_id == door_id)

            if user_id:
                query = query.filter(DBAccessLog.user_id == user_id)

            rows = query.order_by(DBAccessLog.timestamp.desc()).limit(limit).all()
            return [self._to_access_log_schema(row) for row in rows]

        finally:
            db.close()

    def get_dashboard_stats(self) -> Dict[str, Any]:
        db = self._get_db()
        try:
            today = datetime.now().date()
            todays_logs = db.query(DBAccessLog).filter(DBAccessLog.timestamp >= datetime.combine(today, datetime.min.time())).all()
            return {
                "total_buildings": db.query(DBBuilding).count(),
                "total_doors": db.query(DBDoor).count(),
                "total_users": db.query(DBUser).count(),
                "registered_faces": db.query(DBUser).filter(DBUser.face_registered.is_(True)).count(),
                "online_doors": db.query(DBDoor).filter(DBDoor.status == DoorStatus.ONLINE.value).count(),
                "today_access_events": len(todays_logs),
                "today_granted": db.query(DBAccessLog).filter(DBAccessLog.event_type == AccessLogType.GRANTED.value, DBAccessLog.timestamp >= datetime.combine(today, datetime.min.time())).count(),
                "today_denied": db.query(DBAccessLog).filter(DBAccessLog.event_type == AccessLogType.DENIED.value, DBAccessLog.timestamp >= datetime.combine(today, datetime.min.time())).count(),
            }
        finally:
            db.close()


_door_access_service: Optional[DoorAccessService] = None


def get_door_access_service() -> DoorAccessService:
    global _door_access_service
    if _door_access_service is None:
        _door_access_service = DoorAccessService()
    return _door_access_service
