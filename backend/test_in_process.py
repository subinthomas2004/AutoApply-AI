import os
import sys
sys.path.insert(0, "d:/qaz/backend")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_pipeline():
    print("=== Testing AI Job Finder & Automated Application Pipeline via TestClient ===")
    
    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("✓ Backend health check passed:", res.json())

    # 2. Upload sample candidate CV
    sample_cv_path = "d:/qaz/backend/uploads/sample_developer_cv.txt"
    with open(sample_cv_path, "w", encoding="utf-8") as f:
        f.write("""Alex Johnson
Email: alex.johnson@techdomain.org
Phone: +1 555-0199

Summary:
Full-stack Python & React engineer with 5 years experience designing scalable microservices, FastAPI backends, and containerized architectures.

Skills:
Python, FastAPI, Docker, SQL, PostgreSQL, React, TypeScript, Git, REST APIs
""")

    with open(sample_cv_path, "rb") as f:
        upload_res = client.post(
            "/api/candidates/upload",
            files={"file": ("sample_developer_cv.txt", f, "text/plain")},
            data={"full_name": "Alex Johnson", "email": "alex.johnson@techdomain.org"}
        )
    assert upload_res.status_code == 200, f"CV upload failed: {upload_res.text}"
    cand_data = upload_res.json()
    cand_id = cand_data["id"]
    print(f"✓ Candidate uploaded & analyzed with AI. ID: {cand_id}, Skills: {cand_data['extracted_skills']}")

    # 3. Job Search Integration
    search_res = client.post(
        "/api/jobs/search",
        json={"skills": "Python, FastAPI", "job_title": "Python Developer", "location": "Remote", "max_results": 3}
    )
    assert search_res.status_code == 200, f"Job search failed: {search_res.text}"
    jobs = search_res.json()
    assert len(jobs) > 0, "No jobs returned"
    first_job = jobs[0]
    print(f"✓ Job Search returned {len(jobs)} jobs. Top job: '{first_job['title']}' at '{first_job['company']}'")

    # 4. CV & Job Matching
    match_res = client.post(
        "/api/jobs/match",
        json={"candidate_id": cand_id, "job_id": first_job["id"]}
    )
    assert match_res.status_code == 200, f"Matching failed: {match_res.text}"
    match_data = match_res.json()
    print(f"✓ AI CV & Job Matching score: {match_data['match_score']}% | Analysis: {match_data['analysis'][:90]}...")

    # 5. AI Email Draft Generation (Human Approval Stage)
    gen_res = client.post(
        "/api/applications/generate",
        json={
            "candidate_id": cand_id,
            "job_id": first_job["id"],
            "recipient_email": "recruiter@innovativetech.com",
            "custom_instructions": "Highlight immediate availability and microservices experience."
        }
    )
    assert gen_res.status_code == 200, f"Email generation failed: {gen_res.text}"
    app_data = gen_res.json()
    app_id = app_data["id"]
    assert app_data["status"] == "PENDING_APPROVAL", f"Expected PENDING_APPROVAL, got {app_data['status']}"
    print(f"✓ Application generated in PENDING_APPROVAL status. Application ID: {app_id}")
    print(f"  Draft Subject: {app_data['subject']}")

    # 6. Human Review & Editing of Draft
    edit_res = client.post(
        f"/api/applications/{app_id}/action",
        json={
            "action": "UPDATE",
            "subject": app_data["subject"] + " [Reviewed]",
            "email_body": app_data["email_body"] + "\n\nP.S. Available immediately for interview."
        }
    )
    assert edit_res.status_code == 200, f"Edit failed: {edit_res.text}"
    print("✓ Human review and draft update verified.")

    # 7. Explicit Human Approval & Safe Send
    approve_res = client.post(
        f"/api/applications/{app_id}/action",
        json={"action": "APPROVE_AND_SEND"}
    )
    assert approve_res.status_code == 200, f"Approval failed: {approve_res.text}"
    final_app = approve_res.json()
    assert final_app["status"] in ["SENT", "APPROVED"], f"Unexpected status: {final_app['status']}"
    print(f"✓ Human approval executed. Final status: {final_app['status']} | Info: {final_app.get('error_message')}")

    print("\n🎉 ALL PIPELINE INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_pipeline()
