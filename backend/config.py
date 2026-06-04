import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    # Database URL
    DATABASE_URL: str = "mssql+pymssql://sa:MyStrong%40Pass123@localhost:1433/AntigravityDB"

    # Security Configuration
    SECRET_KEY: str = "949f50e95a9e33c69ee0e3e2cdb479bb333a597a7837704dfbd9079f1cdb6d2e"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    ALGORITHM: str = "HS256"

    # OpenAI API Key
    OPENAI_API_KEY: str = "mock-openai-api-key"

    # File Upload Configuration
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 20

    # CORS Allowed Origins
    CORS_ORIGINS: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()

# Ensure Upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
