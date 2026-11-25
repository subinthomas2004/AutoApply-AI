import json
import re
from typing import Dict, Any, List
from app.config import settings

# LangChain Groq integration
try:
    from langchain_groq import ChatGroq
    from langchain_core.messages import SystemMessage, HumanMessage
    HAS_LANGCHAIN = True
except ImportError:
    HAS_LANGCHAIN = False

def get_groq_llm(temperature: float = 0.2):
    api_key = settings.GROQ_API_KEY
    if HAS_LANGCHAIN and api_key and api_key.strip():
        try:
            return ChatGroq(
                groq_api_key=api_key.strip(),
                model_name=settings.GROQ_MODEL,
                temperature=temperature,
                request_timeout=15
            )
        except Exception as e:
            print(f"Error initializing LangChain ChatGroq: {e}")
    return None

def analyze_cv_with_ai(cv_text: str) -> Dict[str, Any]:
    llm = get_groq_llm(temperature=0.1)
    if llm:
        try:
            sys_msg = SystemMessage(content="You are an expert AI Resume Parser. Return strictly valid JSON.")
            user_msg = HumanMessage(content=f"""
Analyze the candidate's CV text:
\"\"\"
{cv_text[:4000]}
\"\"\"

Carefully determine if the candidate is a "Fresher" (college student, recent graduate, entry-level, 0-1 year experience, academic projects only) or "Experienced" (full-time industry work experience, multiple years in corporate roles). Also estimate years of experience (float, 0.0 for freshers).

Output strictly a JSON object:
{{
  "full_name": "Candidate Name",
  "email": "Candidate Email",
  "phone": "Phone number or empty",
  "summary": "2-3 sentence professional summary",
  "skills": ["Skill1", "Skill2", "Skill3"],
  "experience_level": "Fresher" or "Experienced",
  "years_of_experience": 0.0
}}
""")
            response = llm.invoke([sys_msg, user_msg])
            content = response.content.strip()
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'```$', '', content).strip()
            parsed = json.loads(content)
            if "experience_level" not in parsed:
                parsed["experience_level"] = "Fresher"
            if "years_of_experience" not in parsed:
                parsed["years_of_experience"] = 0.0
            return parsed
        except Exception as e:
            print(f"Groq CV analysis fallback: {e}")

    # Fallback extractor
    emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', cv_text)
    email = emails[0] if emails else ""
    phones = re.findall(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', cv_text)
    phone = phones[0] if phones else ""
    first_lines = [l.strip() for l in cv_text.splitlines() if l.strip()][:5]
    name = first_lines[0] if first_lines and "@" not in first_lines[0] and len(first_lines[0]) < 40 else "Candidate"
    
    common_skills = [
        "Python", "Java", "JavaScript", "TypeScript", "React", "Node.js", "FastAPI", "Flask",
        "Django", "Spring Boot", "SQL", "PostgreSQL", "MySQL", "MongoDB", "Docker", "Kubernetes",
        "AWS", "Git", "REST API", "Pandas", "PyTorch", "TensorFlow", "HTML", "CSS", "C#", "C++", "C", "OOP"
    ]
    found_skills = [s for s in common_skills if re.search(r'\b' + re.escape(s) + r'\b', cv_text, re.IGNORECASE)]
    if not found_skills:
        found_skills = ["Python", "JavaScript", "MySQL", "MongoDB", "Git"]

    # Rule-based detection for Fresher vs Experienced
    lower_cv = cv_text.lower()
    fresher_indicators = ["fresher", "entry level", "student", "graduate", "college", "cgpa", "btech", "b.tech", "b.e", "bachelor", "academic projects", "2024", "2025", "2026"]
    exp_indicators = [
        r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?experience',
        r'senior\s+(?:engineer|developer)',
        r'lead\s+(?:engineer|developer)',
        r'work\s+experience\s*:\s*\d+',
        r'employed\s+at',
        r'staff\s+software'
    ]
    
    years_found = 0.0
    for exp_pat in exp_indicators:
        match = re.search(exp_pat, lower_cv)
        if match and match.groups():
            try:
                years_found = float(match.group(1))
            except Exception:
                years_found = 2.0
            break

    # If graduation year is recent or currently studying, or years < 1.5 -> Fresher
    if years_found >= 2.0 and not any(k in lower_cv for k in ["btech\n2022 – 2026", "2022 – 2026", "2023 – 2027"]):
        exp_level = "Experienced"
    else:
        exp_level = "Fresher"

    return {
        "full_name": name,
        "email": email,
        "phone": phone if isinstance(phone, str) else "",
        "summary": f"{'Fresher' if exp_level == 'Fresher' else 'Experienced'} software engineer skilled in {', '.join(found_skills[:4])}.",
        "skills": found_skills,
        "experience_level": exp_level,
        "years_of_experience": years_found
    }

def evaluate_skill_fit(cv_text: str, candidate_skills: str, job_reqs: str) -> Dict[str, Any]:
    cand_tokens = [s.strip() for s in candidate_skills.split(',') if s.strip()]
    cand_lower = (candidate_skills + " " + cv_text).lower()
    raw_skills = [s.strip() for s in re.split(r'[,;]+', job_reqs) if s.strip()]
    if not raw_skills:
        raw_skills = [s.strip() for s in re.split(r'[,/•;|\n]+', job_reqs) if s.strip()]

    matched = []
    missing = []

    for item in raw_skills:
        item_lower = item.lower()
        sub = [t.strip() for t in re.split(r'[/|()]+', item) if t.strip()]
        has_match = False

        # 1. Does any candidate skill appear in the requirement item?
        for cs in cand_tokens:
            clean_cs = re.sub(r'[^a-zA-Z0-9\+#\.]', '', cs).strip()
            if not clean_cs or len(clean_cs) < 2:
                continue
            if re.search(r'\b' + re.escape(clean_cs) + r'\b', item_lower, re.IGNORECASE):
                has_match = True
                break

        # 2. Does any requirement sub-token appear in candidate CV?
        if not has_match:
            for t in sub:
                clean_t = re.sub(r'[^a-zA-Z0-9\+#\.]', '', t).strip()
                if not clean_t or len(clean_t) < 2:
                    continue
                if re.search(r'\b' + re.escape(clean_t) + r'\b', cand_lower, re.IGNORECASE):
                    has_match = True
                    break

        if has_match:
            matched.append(item)
        else:
            missing.append(item)

    clean_matched = list(dict.fromkeys(matched))
    clean_missing = list(dict.fromkeys(missing))

    total_reqs = max(len(clean_matched) + len(clean_missing), 1)
    ratio = len(clean_matched) / total_reqs
    score = round(ratio * 100.0, 1)

    if clean_missing:
        analysis = f"Candidate matches {len(clean_matched)} of {total_reqs} required skills ({', '.join(clean_matched[:3]) if clean_matched else 'none'}). Lacking critical experience in: {', '.join(clean_missing[:5])}."
    else:
        analysis = f"Outstanding match ({score}%)! Candidate fulfills all required technical competencies: {', '.join(clean_matched)}."

    return {
        "match_score": score,
        "matching_skills": clean_matched,
        "missing_skills": clean_missing,
        "analysis": analysis
    }

def match_cv_to_job(cv_text: str, candidate_skills: str, job_title: str, job_desc: str, job_reqs: str, use_llm: bool = False) -> Dict[str, Any]:
    """
    Evaluates exact skills in candidate CV against Job Requirements.
    Accurately computes matching skills and explicitly identifies missing skills (what the candidate is lacking).
    """
    if use_llm:
        llm = get_groq_llm(temperature=0.2)
        if llm:
            try:
                sys_msg = SystemMessage(content="You are an expert Technical Recruiter evaluating candidates. Output strictly valid JSON.")
                user_msg = HumanMessage(content=f"""
Compare the candidate's skills with the job requirements.

Candidate Skills: {candidate_skills}
Candidate Resume Excerpt:
{cv_text[:2000]}

Job Title: {job_title}
Job Description: {job_desc[:1200]}
Required Technical Skills: {job_reqs}

Instructions:
1. Identify which required skills the candidate HAS (matching_skills).
2. Identify which required skills the candidate is LACKING (missing_skills).
3. Compute an objective match_score (0 to 100) based strictly on requirements met.
4. Provide a clear 2-sentence analysis stating what is matched and explicitly what the candidate is lacking.

Output JSON:
{{
  "match_score": 50.0,
  "matching_skills": ["Python", "MySQL", "Git"],
  "missing_skills": ["Docker", "FastAPI", "AWS"],
  "analysis": "Candidate possesses solid foundation in Python and MySQL, but lacks required production experience in Docker, FastAPI, and AWS infrastructure."
}}
""")
                response = llm.invoke([sys_msg, user_msg])
                content = response.content.strip()
                content = re.sub(r'^```json\s*', '', content)
                content = re.sub(r'```$', '', content).strip()
                parsed = json.loads(content)
                if isinstance(parsed, dict) and "match_score" in parsed:
                    return parsed
            except Exception as e:
                print(f"Groq LLM Job Matching fallback: {e}")

    # Deterministic high-speed skill fit
    return evaluate_skill_fit(cv_text, candidate_skills, job_reqs)

def generate_personalized_email(
    candidate_name: str,
    candidate_summary: str,
    candidate_skills: str,
    job_title: str,
    company: str,
    job_description: str,
    custom_instructions: str = ""
) -> Dict[str, str]:
    llm = get_groq_llm(temperature=0.3)
    if llm:
        try:
            sys_msg = SystemMessage(content="You are an expert career agent drafting recruiter application emails. Output strictly JSON.")
            user_msg = HumanMessage(content=f"""
Write a personalized job application email:

Candidate: {candidate_name}
Background: {candidate_summary}
Skills: {candidate_skills}

Job Title: {job_title}
Company: {company}
Description: {job_description[:1200]}

Special Instructions: {custom_instructions or "Keep it concise and professional. State that CV is attached."}

Output JSON:
{{
  "subject": "Clear, engaging subject",
  "email_body": "Structured email text with professional greeting and sign-off"
}}
""")
            response = llm.invoke([sys_msg, user_msg])
            content = response.content.strip()
            content = re.sub(r'^```json\s*', '', content)
            content = re.sub(r'```$', '', content).strip()
            return json.loads(content)
        except Exception as e:
            print(f"Groq LLM email generation error: {e}")

    subject = f"Job Application: {job_title} - {candidate_name}"
    body = f"""Dear Hiring Team at {company},

I am writing to express my strong interest in the {job_title} position at {company}. With expertise in {candidate_skills.split(',')[0] if candidate_skills else 'software development'} and practical experience building scalable applications, I am confident in my ability to contribute effectively to your engineering goals.

Key Qualifications:
• Core proficiencies: {candidate_skills}
• Background: {candidate_summary}

I would welcome the opportunity to discuss how my skill set aligns with your team's objectives. Please find my CV attached for your review.

Thank you for your time and consideration.

Warm regards,

{candidate_name}
"""
    return {
        "subject": subject,
        "email_body": body
    }
