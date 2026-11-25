import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ApplicationStatus(str, enum.Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SENT = "SENT"
    FAILED = "FAILED"

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(100), nullable=True)
    cv_filename = Column(String(255), nullable=True)
    cv_filepath = Column(String(500), nullable=True)
    parsed_cv_text = Column(Text, nullable=True)
    extracted_skills = Column(Text, nullable=True) # JSON array or comma separated
    summary = Column(Text, nullable=True)
    experience_level = Column(String(50), default="Fresher") # "Fresher" or "Experienced"
    years_of_experience = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    url = Column(String(1000), nullable=True)
    recruiter_email = Column(String(255), nullable=True)
    match_score = Column(Float, default=0.0) # 0 to 100%
    match_analysis = Column(Text, nullable=True)
    matching_skills = Column(Text, nullable=True) # JSON array of matching skills
    missing_skills = Column(Text, nullable=True) # JSON array of missing skills
    experience_level = Column(String(50), default="Fresher") # "Fresher" or "Experienced"
    source = Column(String(100), default="DuckDuckGo Search")
    created_at = Column(DateTime, default=datetime.utcnow)

    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    
    recipient_email = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    email_body = Column(Text, nullable=False)
    
    status = Column(String(50), default=ApplicationStatus.PENDING_APPROVAL.value)
    rejection_reason = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="applications")
    job = relationship("Job", back_populates="applications")
