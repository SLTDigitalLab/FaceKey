from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from src.app.api.v1 import door_access
from src.app.core.config import settings
from src.utils.logger import Logger

# ✅ NEW: import database + models
from src.app.core.database import Base, engine

from dotenv import load_dotenv
load_dotenv()

# Initialize logger
Logger()
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version
)

# =========================
# DATABASE INITIALIZATION
# =========================

# Only create tables if they do not exist
Base.metadata.create_all(bind=engine)

# =========================
# CORS CONFIGURATION
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# ROUTES
# =========================
app.include_router(
    door_access.router,
    prefix="/api/v1/door-access",
    tags=["Door Access"]
)