import os
from typing import Optional
from dotenv import load_dotenv

# Ensure .env is explicitly loaded from backend directory
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(env_path)

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Job Finder & Automated Application System"
    
    # LLM (Groq & LangChain)
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    # Email Automation: SMTP Configuration
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "")

    # Multi-engine search keys
    JOB_SEARCH_PROVIDER: str = os.getenv("JOB_SEARCH_PROVIDER", "multi_all")
    TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "")
    SERPAPI_API_KEY: str = os.getenv("SERPAPI_API_KEY", "")
    BRAVE_API_KEY: str = os.getenv("BRAVE_API_KEY", "")

    # Database (Single chosen database: SQLite, storing Candidates, Jobs, and Application History)
    DATABASE_TYPE: str = os.getenv("DATABASE_TYPE", "sqlite")
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", 3306))
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DB: str = os.getenv("MYSQL_DB", "job_finder_db")
    SQLITE_URL: str = f"sqlite:///{os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'jobs_app.db')).replace(chr(92), '/')}"

    # Storage paths
    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")

    @property
    def MYSQL_URL(self) -> str:
        pwd = f":{self.MYSQL_PASSWORD}" if self.MYSQL_PASSWORD else ""
        return f"mysql+pymysql://{self.MYSQL_USER}{pwd}@{self.MYSQL_HOST}:{self.MYSQL_PORT}/{self.MYSQL_DB}?charset=utf8mb4"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
