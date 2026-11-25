import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.db_models import Candidate
from app.models.schemas import CandidateOut
from app.services.cv_parser import extract_text_from_file
from app.services.ai_engine import analyze_cv_with_ai
from app.config import settings

router = APIRouter(prefix="/candidates", tags=["candidates"])

@router.get("/", response_model=List[CandidateOut])
def list_candidates(db: Session = Depends(get_db)):
    return db.query(Candidate).order_by(Candidate.id.desc()).all()

@router.get("/{candidate_id}", response_model=CandidateOut)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return cand

@router.post("/upload", response_model=CandidateOut)
async def upload_candidate_cv(
    file: UploadFile = File(...),
    full_name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    # Save uploaded file
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text from PDF / DOCX
    extracted_text = extract_text_from_file(file_path)

    # Use AI to parse skills, summary, contact details
    parsed_ai = analyze_cv_with_ai(extracted_text)

    cand_name = full_name or parsed_ai.get("full_name") or "Applicant"
    cand_email = email or parsed_ai.get("email") or "applicant@example.com"
    cand_phone = phone or parsed_ai.get("phone") or ""
    summary = parsed_ai.get("summary") or "Qualified software developer"
    skills = ", ".join(parsed_ai.get("skills", []))
    exp_level = parsed_ai.get("experience_level") or "Fresher"
    years_exp = float(parsed_ai.get("years_of_experience") or 0.0)

    new_candidate = Candidate(
        full_name=cand_name,
        email=cand_email,
        phone=cand_phone,
        cv_filename=file.filename,
        cv_filepath=file_path,
        parsed_cv_text=extracted_text,
        extracted_skills=skills,
        summary=summary,
        experience_level=exp_level,
        years_of_experience=years_exp
    )

    db.add(new_candidate)
    db.commit()
    db.refresh(new_candidate)

    return new_candidate
