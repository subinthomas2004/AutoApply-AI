import os
from fastapi import APIRouter
from app.config import settings

router = APIRouter(prefix="/config", tags=["config"])

@router.get("/")
def get_system_config():
    return {
        "groq_configured": bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip()),
        "groq_model": settings.GROQ_MODEL,
        "smtp_configured": bool(settings.SMTP_USER and settings.SMTP_PASSWORD),
        "smtp_user": settings.SMTP_USER,
        "smtp_host": settings.SMTP_HOST,
        "smtp_port": settings.SMTP_PORT,
        "smtp_from_email": settings.SMTP_FROM_EMAIL,
        "smtp_from_name": settings.SMTP_FROM_NAME,
        "human_approval_required": True
    }

@router.post("/update")
def update_system_config(payload: dict):
    if "smtp_user" in payload:
        settings.SMTP_USER = payload["smtp_user"].strip()
    if "smtp_password" in payload and payload["smtp_password"]:
        settings.SMTP_PASSWORD = payload["smtp_password"].strip().replace(" ", "")
    if "smtp_from_email" in payload:
        settings.SMTP_FROM_EMAIL = payload["smtp_from_email"].strip() or settings.SMTP_USER
    if "smtp_from_name" in payload:
        settings.SMTP_FROM_NAME = payload["smtp_from_name"].strip()
    if "smtp_host" in payload:
        settings.SMTP_HOST = payload["smtp_host"].strip()
    if "smtp_port" in payload and payload["smtp_port"]:
        settings.SMTP_PORT = int(payload["smtp_port"])

    # Persist to .env file
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
    try:
        lines = []
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
        
        updated_keys = {
            "SMTP_USER": settings.SMTP_USER,
            "SMTP_PASSWORD": settings.SMTP_PASSWORD,
            "SMTP_FROM_EMAIL": settings.SMTP_FROM_EMAIL,
            "SMTP_FROM_NAME": settings.SMTP_FROM_NAME,
            "SMTP_HOST": settings.SMTP_HOST,
            "SMTP_PORT": str(settings.SMTP_PORT)
        }
        
        new_lines = []
        existing_keys = set()
        for line in lines:
            key = line.split("=")[0].strip() if "=" in line else ""
            if key in updated_keys:
                new_lines.append(f"{key}={updated_keys[key]}\n")
                existing_keys.add(key)
            else:
                new_lines.append(line)
                
        for k, v in updated_keys.items():
            if k not in existing_keys:
                new_lines.append(f"{k}={v}\n")
                
        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
    except Exception as e:
        print(f"Error saving to .env: {e}")

    return {
        "status": "updated",
        "smtp_configured": bool(settings.SMTP_USER and settings.SMTP_PASSWORD),
        "smtp_user": settings.SMTP_USER
    }
