from pydantic_settings import BaseSettings, SettingsConfigDict
import os
import configparser

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
    
    # Validation settings from config.ini
    validation_api_url: str = "https://visage.sltdigitallab.lk/api/username_val"
    validation_api_user: str = "slt_interns"
    validation_api_key: str = "26PytkCBcZ"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()

# Load config.ini overrides
config = configparser.ConfigParser()
# Check both current directory and parent directory for config.ini
config_path = os.path.join(os.getcwd(), 'config.ini')
if not os.path.exists(config_path):
    config_path = os.path.join(os.path.dirname(os.getcwd()), 'config.ini')
if os.path.exists(config_path):
    config.read(config_path)
    if 'API' in config:
        if 'url' in config['API']:
            settings.validation_api_url = config['API']['url']
        if 'user' in config['API']:
            settings.validation_api_user = config['API']['user']
        if 'key' in config['API']:
            settings.validation_api_key = config['API']['key']

