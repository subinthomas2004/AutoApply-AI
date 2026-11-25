import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.db_models import Job, Candidate
from app.models.schemas import JobSearchRequest, JobOut, MatchRequest, MatchResponse
from app.services.job_search import search_jobs
from app.services.ai_engine import match_cv_to_job

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("/", response_model=List[JobOut])
def list_jobs(experience_level: str = None, db: Session = Depends(get_db)):
    q = db.query(Job)
    if experience_level and experience_level not in ["All", "all"]:
        q = q.filter(Job.experience_level == experience_level)
    return q.order_by(Job.id.desc()).all()

@router.post("/search", response_model=List[JobOut])
def search_and_store_jobs(req: JobSearchRequest, db: Session = Depends(get_db)):
    is_all_roles = not req.job_title or req.job_title.strip().lower() in ["all", "all roles", "all jobs", "all job openings", "all matching roles"]
    exp_filter = req.experience_level if req.experience_level and req.experience_level not in ["All", "all"] else None
    loc_filter = req.location.strip() if req.location and req.location.strip() not in ["All Locations", "All"] else None
    mode_filter = req.work_mode.strip() if req.work_mode and req.work_mode.strip() not in ["All", "All Modes", "All Work Modes"] else None

    cand = None
    if req.candidate_id:
        cand = db.query(Candidate).filter(Candidate.id == req.candidate_id).first()
    if not cand:
        cand = db.query(Candidate).order_by(Candidate.id.desc()).first()

    # Always perform the live multi-engine search so new queries, roles, and locations are fetched
    results = search_jobs(
        skills=req.skills,
        job_title=req.job_title,
        location=req.location or "All Locations",
        work_mode=req.work_mode or "All",
        experience_level=req.experience_level or "All",
        max_results=req.max_results or 25
    )

    created_jobs = []
    for item in results:
        existing = db.query(Job).filter(Job.title == item["title"], Job.company == item["company"]).first()
        job_obj = existing
        if not existing:
            job_obj = Job(
                title=item["title"],
                company=item["company"],
                location=item.get("location"),
                description=item.get("description"),
                requirements=item.get("requirements"),
                url=item.get("url"),
                recruiter_email=item.get("recruiter_email"),
                experience_level=item.get("experience_level", "Fresher"),
                source=item.get("source", "Web Search")
            )
            db.add(job_obj)
        else:
            if item.get("requirements"):
                job_obj.requirements = item.get("requirements")
            if item.get("location"):
                job_obj.location = item.get("location")
            if item.get("description"):
                job_obj.description = item.get("description")
            if item.get("recruiter_email"):
                job_obj.recruiter_email = item.get("recruiter_email")
            if item.get("experience_level"):
                job_obj.experience_level = item.get("experience_level")
            if item.get("url") and not job_obj.url:
                job_obj.url = item.get("url")

        # Automatically evaluate deterministic skill fit if candidate is available
        if cand:
            match_res = match_cv_to_job(
                cv_text=cand.parsed_cv_text or "",
                candidate_skills=cand.extracted_skills or "",
                job_title=job_obj.title,
                job_desc=job_obj.description or "",
                job_reqs=job_obj.requirements or "",
                use_llm=False
            )
            job_obj.match_score = match_res.get("match_score", 0.0)
            job_obj.match_analysis = match_res.get("analysis", "")
            job_obj.matching_skills = json.dumps(match_res.get("matching_skills", []))
            job_obj.missing_skills = json.dumps(match_res.get("missing_skills", []))

        db.commit()
        db.refresh(job_obj)
        created_jobs.append(job_obj)

    # If is_all_roles and no results returned from search, fallback to matching DB records
    if is_all_roles and not created_jobs:
        q = db.query(Job)
        if exp_filter:
            q = q.filter(Job.experience_level == exp_filter)
        if loc_filter:
            loc_city = loc_filter.split(",")[0].strip()
            q = q.filter(Job.location.ilike(f"%{loc_city}%"))
        if mode_filter:
            q = q.filter(Job.location.ilike(f"%{mode_filter}%"))
        created_jobs = q.order_by(Job.id.desc()).limit(req.max_results or 50).all()

    # Filter created_jobs strictly by the user's unified criteria (like Flipkart)
    filtered = []
    for j in created_jobs:
        # Experience filter
        if exp_filter and j.experience_level and j.experience_level != exp_filter:
            continue
        # Location filter
        if loc_filter:
            loc_city = loc_filter.split(",")[0].strip().lower()
            j_loc = (j.location or "").lower()
            # If user specifies a city e.g. "hyderabad", job location must match or be remote
            if loc_city not in j_loc and "remote" not in j_loc and "global" not in j_loc:
                continue
        # Work mode filter
        if mode_filter and mode_filter not in ["All", "All Modes"]:
            j_loc = (j.location or "").lower()
            if mode_filter.lower() not in j_loc:
                continue
        filtered.append(j)

    return filtered if filtered else created_jobs

    return created_jobs

@router.post("/match", response_model=MatchResponse)
def match_job_with_cv(req: MatchRequest, db: Session = Depends(get_db)):
    cand = db.query(Candidate).filter(Candidate.id == req.candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    job = db.query(Job).filter(Job.id == req.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    match_result = match_cv_to_job(
        cv_text=cand.parsed_cv_text or "",
        candidate_skills=cand.extracted_skills or "",
        job_title=job.title,
        job_desc=job.description or "",
        job_reqs=job.requirements or "",
        use_llm=True
    )

    # Persist match score, detailed analysis and lists to job record
    job.match_score = match_result.get("match_score", 0.0)
    job.match_analysis = match_result.get("analysis", "")
    job.matching_skills = json.dumps(match_result.get("matching_skills", []))
    job.missing_skills = json.dumps(match_result.get("missing_skills", []))
    db.commit()
    db.refresh(job)

    return MatchResponse(
        job_id=job.id,
        candidate_id=cand.id,
        match_score=job.match_score,
        analysis=job.match_analysis,
        matching_skills=match_result.get("matching_skills", []),
        missing_skills=match_result.get("missing_skills", [])
    )
