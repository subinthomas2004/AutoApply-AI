import json
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime

class CandidateCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    summary: Optional[str] = None
    extracted_skills: Optional[str] = None

class CandidateOut(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str]
    cv_filename: Optional[str]
    parsed_cv_text: Optional[str]
    extracted_skills: Optional[str]
    summary: Optional[str]
    experience_level: Optional[str] = "Fresher"
    years_of_experience: Optional[float] = 0.0
    created_at: datetime

    class Config:
        from_attributes = True

class JobSearchRequest(BaseModel):
    skills: str
    job_title: str
    location: Optional[str] = "All Locations"
    work_mode: Optional[str] = "All"
    experience_level: Optional[str] = "All" # "All", "Fresher", "Experienced"
    max_results: Optional[int] = 15
    candidate_id: Optional[int] = None

class JobCreate(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    url: Optional[str] = None
    recruiter_email: Optional[str] = None
    experience_level: Optional[str] = "Fresher"

class JobOut(BaseModel):
    id: int
    title: str
    company: str
    location: Optional[str]
    description: Optional[str]
    requirements: Optional[str]
    url: Optional[str]
    recruiter_email: Optional[str]
    match_score: Optional[float]
    match_analysis: Optional[str]
    matching_skills: Optional[List[str]] = []
    missing_skills: Optional[List[str]] = []
    experience_level: Optional[str] = "Fresher"
    source: Optional[str]
    created_at: datetime

    @field_validator("matching_skills", "missing_skills", mode="before")
    @classmethod
    def parse_skill_lists(cls, v):
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                pass
            return [s.strip() for s in v.split(",") if s.strip()]
        if isinstance(v, list):
            return v
        return []

    class Config:
        from_attributes = True

class MatchRequest(BaseModel):
    candidate_id: int
    job_id: int

class MatchResponse(BaseModel):
    job_id: int
    candidate_id: int
    match_score: float
    analysis: str
    matching_skills: List[str] = []
    missing_skills: List[str] = []

class GenerateEmailRequest(BaseModel):
    candidate_id: int
    job_id: int
    recipient_email: Optional[str] = None
    custom_instructions: Optional[str] = None

class EmailReviewUpdate(BaseModel):
    subject: str
    email_body: str
    recipient_email: str

class ApplicationActionRequest(BaseModel):
    action: str
    rejection_reason: Optional[str] = None
    subject: Optional[str] = None
    email_body: Optional[str] = None
    recipient_email: Optional[str] = None

class ApplicationOut(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    recipient_email: str
    subject: str
    email_body: str
    status: str
    rejection_reason: Optional[str]
    error_message: Optional[str]
    sent_at: Optional[datetime]
    created_at: datetime
    job: Optional[JobOut] = None
    candidate: Optional[CandidateOut] = None

    class Config:
        from_attributes = True

class SmtpConfigTest(BaseModel):
    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_password: str
    smtp_from_email: str
