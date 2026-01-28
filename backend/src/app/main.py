from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from src.app.api.v1 import door_access
from src.app.core.config import settings
from src.utils.logger import Logger

# Initialize logger
Logger()
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(door_access.router, prefix="/api/v1/door-access", tags=["Door Access"])
