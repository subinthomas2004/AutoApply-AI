from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.db_models import Application, ApplicationStatus, Job, Candidate
from app.models.schemas import (
    GenerateEmailRequest,
    ApplicationOut,
    ApplicationActionRequest,
    SmtpConfigTest
)
from app.services.ai_engine import generate_personalized_email
from app.services.email_sender import send_application_email, send_via_brevo_api

router = APIRouter(prefix="/applications", tags=["applications"])

@router.get("/", response_model=List[ApplicationOut])
def list_applications(db: Session = Depends(get_db)):
    return db.query(Application).order_by(Application.id.desc()).all()

@router.post("/generate", response_model=ApplicationOut)
def generate_application_email(req: GenerateEmailRequest, db: Session = Depends(get_db)):
    cand = db.query(Candidate).filter(Candidate.id == req.candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    job = db.query(Job).filter(Job.id == req.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    email_content = generate_personalized_email(
        candidate_name=cand.full_name,
        candidate_summary=cand.summary or "",
        candidate_skills=cand.extracted_skills or "",
        job_title=job.title,
        company=job.company,
        job_description=job.description or "",
        custom_instructions=req.custom_instructions or ""
    )

    # User can supply recipient manually, or fallback to job recruiter / company HR email
    recipient = req.recipient_email or job.recruiter_email or f"hr@{job.company.lower().replace(' ', '')}.com"

    application = Application(
        candidate_id=cand.id,
        job_id=job.id,
        recipient_email=recipient,
        subject=email_content.get("subject", f"Job Application: {job.title} - {cand.full_name}"),
        email_body=email_content.get("email_body", ""),
        status=ApplicationStatus.PENDING_APPROVAL.value
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    return application

@router.post("/{app_id}/action", response_model=ApplicationOut)
def handle_human_approval_action(
    app_id: int,
    action_req: ApplicationActionRequest,
    db: Session = Depends(get_db)
):
    """
    Dual-Mode Human Approval Gate:
    1. Supports manual sender recipient override for safe testing (e.g. your personal test inbox).
    2. Supports production automated dispatch to company HR with candidate CV attached.
    """
    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # If the user edited recipient, subject, or body during human review
    if action_req.recipient_email:
        application.recipient_email = action_req.recipient_email.strip()
    if action_req.subject:
        application.subject = action_req.subject.strip()
    if action_req.email_body:
        application.email_body = action_req.email_body.strip()

    if action_req.action == "REJECT":
        application.status = ApplicationStatus.REJECTED.value
        application.rejection_reason = action_req.rejection_reason or "Rejected by user during review."
        db.commit()
        db.refresh(application)
        return application

    elif action_req.action == "APPROVE_AND_SEND":
        application.status = ApplicationStatus.APPROVED.value
        cand = application.candidate
        cv_path = cand.cv_filepath if cand else None
        
        # Dispatches email with candidate CV attached to whichever recipient is set
        send_result = send_application_email(
            to_email=application.recipient_email,
            subject=application.subject,
            body=application.email_body,
            attachment_path=cv_path
        )

        if send_result.get("success"):
            application.status = ApplicationStatus.SENT.value
            application.sent_at = datetime.utcnow()
            application.error_message = send_result.get("message", f"Sent successfully to {application.recipient_email}")
        else:
            application.status = ApplicationStatus.FAILED.value
            application.error_message = send_result.get("error", "Failed to dispatch email")

        db.commit()
        db.refresh(application)
        return application

    elif action_req.action == "UPDATE":
        db.commit()
        db.refresh(application)
        return application

    else:
        raise HTTPException(status_code=400, detail="Invalid action")

@router.post("/test-brevo")
def test_brevo_api_key(payload: dict):
    key = payload.get("brevo_api_key")
    recipient = payload.get("test_recipient") or "recipient@example.com"
    from_email = payload.get("from_email")
    result = send_via_brevo_api(
        to_email=recipient,
        subject="AI Job Finder - Brevo API Dispatch Verification",
        body="This is a test notification confirming that Brevo API integration is active and verified for automated CV job applications.",
        api_key=key,
        from_email=from_email
    )
    return result

@router.post("/test-smtp")
def test_smtp_configuration(config: SmtpConfigTest):
    result = send_application_email(
        to_email=config.smtp_from_email,
        subject="AI Job Finder - SMTP Configuration Test",
        body="Congratulations! Your SMTP settings for AI Job Finder & Automated Application System are working correctly.",
        attachment_path=None,
        smtp_override={
            "host": config.smtp_host,
            "port": config.smtp_port,
            "user": config.smtp_user,
            "password": config.smtp_password,
            "from_email": config.smtp_from_email
        }
    )
    return result
