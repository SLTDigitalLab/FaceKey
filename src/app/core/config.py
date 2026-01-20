from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    app_name: str = "Visage Edge Dashboard"
    app_version: str = "3.0"
    log_level: str = "debug"
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = False

    # Logging settings
    log_dir: str = "logs"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    # Remote API settings (Defaults if needed, can be overridden by env vars)
    remote_api_get_username_endpoint: str = ""
    remote_api_attendance_marking_endpoint: str = ""
    remote_api_attendance_update_endpoint: str = ""
    remote_api_api_key: str = ""
    remote_api_username: str = ""
    remote_api_detpoint: str = "test_group"
    remote_api_longitude: float = 6.934846
    remote_api_latitude: float = 79.846843
    remote_api_timeout_seconds: int = 10

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
