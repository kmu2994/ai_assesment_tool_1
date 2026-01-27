"""
Application Configuration
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AI Inclusive Assessment System"
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/assessment.db"
    
    # AI Models
    SBERT_MODEL: str = "all-MiniLM-L6-v2"
    
    # File Upload
    UPLOAD_DIR: str = "./data/uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    class Config:
        env_file = ".env"
        extra = "allow"

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs("./data", exist_ok=True)
