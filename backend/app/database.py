import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

Base = declarative_base()

active_engine = None
active_db_name = "SQLite"

if settings.DATABASE_TYPE.lower() == "mysql":
    try:
        # Attempt connection to MySQL server
        temp_engine = create_engine(
            settings.MYSQL_URL,
            pool_pre_ping=True,
            connect_args={"connect_timeout": 3}
        )
        with temp_engine.connect() as conn:
            pass
        active_engine = temp_engine
        active_db_name = "MySQL"
        print(f"✓ Connected to MySQL database at {settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DB}")
    except Exception as e:
        print(f"! MySQL connection to {settings.MYSQL_HOST}:{settings.MYSQL_PORT} failed ({e}).")
        print("  Auto-fallback to SQLite enabled.")
        active_engine = create_engine(
            settings.SQLITE_URL,
            connect_args={"check_same_thread": False}
        )
        active_db_name = "SQLite"
else:
    active_engine = create_engine(
        settings.SQLITE_URL,
        connect_args={"check_same_thread": False}
    )
    active_db_name = "SQLite"
    print(f"✓ Connected to SQLite database ({settings.SQLITE_URL}) - Primary DB for Candidates, Jobs, and Application History.")

engine = active_engine
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
