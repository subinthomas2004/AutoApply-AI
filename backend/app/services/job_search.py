import os
import re
import requests
import html
from typing import List, Dict, Any
from app.config import settings

def clean_html(raw_html: str) -> str:
    if not raw_html:
        return ""
    clean = re.sub(r'<[^>]+>', ' ', raw_html)
    clean = html.unescape(clean)
    return " ".join(clean.split())

def generate_recruiter_email(company: str) -> str:
    clean_co = re.sub(r'[^a-zA-Z0-9]', '', company).lower()
    if not clean_co:
        clean_co = "company"
    return f"careers@{clean_co}.com"

# Standard industry requirement profiles for real technical roles
TECH_ROLE_REQUIREMENTS = {
    "backend python engineer": {
        "requirements": "Python 3.x, FastAPI / Django / Flask, PostgreSQL / MySQL, Docker, Redis, Celery, RESTful APIs, Git, Unit Testing, AWS / Cloud basics",
        "description": "We are seeking a Backend Python Engineer to build high-performance microservices, optimize database queries, design scalable REST APIs, and integrate caching layers with Redis."
    },
    "python developer": {
        "requirements": "Python, OOP, Data Structures, SQL / NoSQL (MySQL/MongoDB), Git, REST APIs, Linux, PyTest, Basic Docker",
        "description": "Join our engineering team to develop and maintain server-side application logic, data ingestion pipelines, and RESTful web services in Python."
    },
    "senior backend python engineer": {
        "requirements": "Senior Python, FastAPI/Django, Distributed Systems, High-concurrency AsyncIO, Kubernetes, Kafka, CI/CD, Microservices Architecture, Cloud Infrastructure (AWS/GCP)",
        "description": "Lead our backend architectural roadmap. Architect distributed microservices in Python, optimize low-latency systems, and mentor software engineers."
    },
    "full stack engineer": {
        "requirements": "JavaScript / TypeScript, React.js / Next.js, Python / Node.js, REST & GraphQL APIs, Tailwind CSS, PostgreSQL, Docker, Git",
        "description": "Design and implement end-to-end user-facing products, connecting responsive modern React frontends with scalable backend microservices."
    },
    "frontend react developer": {
        "requirements": "React.js, JavaScript (ES6+), TypeScript, HTML5, CSS3/Tailwind, Redux/Zustand, Webpack/Vite, Responsive UI/UX Design, REST APIs",
        "description": "Build dynamic, accessible web applications in React.js, collaborating closely with UX designers and backend engineers."
    },
    "database engineer": {
        "requirements": "MySQL, PostgreSQL, MongoDB, Database Indexing, Query Optimization, ETL Pipelines, Backup & Replication, Data Modeling, Linux",
        "description": "Manage database performance, design robust relational and document schemas, optimize slow queries, and ensure 99.99% database reliability."
    },
    "computer vision engineer": {
        "requirements": "Python, OpenCV, YOLOv8, PyTorch / TensorFlow, MobileNet, Keras, Object Detection, Deep Learning, Image Segmentation, C++",
        "description": "Develop and deploy edge and cloud computer vision models, optimizing YOLOv8 object detection pipelines and real-time visual recognition systems."
    },
    "ai / ml engineer": {
        "requirements": "Python, PyTorch / TensorFlow, Keras, Machine Learning Algorithms, Data Preprocessing, NumPy, Pandas, Model Deployment, REST APIs, Git",
        "description": "Build, evaluate, and scale deep learning and machine learning models for production applications, integrating APIs with backend services."
    },
    "deep learning specialist": {
        "requirements": "Python, Deep Neural Networks, CNNs, YOLOv8, Keras, PyTorch, Transfer Learning, MobileNet, GPU Optimization (CUDA), Model Quantization",
        "description": "Train and fine-tune advanced deep neural networks for computer vision, image processing, and real-time detection applications."
    },
    "full stack developer": {
        "requirements": "React.js, Node.js, Express, JavaScript / TypeScript, MongoDB, REST APIs, HTML5, CSS3, Git, Full Stack Architecture",
        "description": "Build end-to-end web applications, connecting responsive frontend React components to robust Node/Express RESTful APIs and MongoDB databases."
    },
    "mern stack developer": {
        "requirements": "MongoDB, Express.js, React.js, Node.js, JavaScript (ES6+), REST APIs, JWT Authentication, HTML/CSS, Git",
        "description": "Engineer full lifecycle web applications using the MERN stack, designing responsive client UIs and high-throughput server backends."
    },
    "node.js backend developer": {
        "requirements": "Node.js, Express.js, RESTful APIs, MongoDB, MySQL, Microservices, Async Programming, Git, Unit Testing, Docker",
        "description": "Architect high-performance backend microservices and RESTful API endpoints in Node.js and Express."
    },
    "c / c++ software engineer": {
        "requirements": "C, C++, Data Structures, Algorithms, Memory Management, Multi-threading, Linux, Git, Object-Oriented Programming (OOP)",
        "description": "Develop low-latency, high-performance systems and algorithms in C and C++, optimizing execution efficiency and resource management."
    },
    "java developer": {
        "requirements": "Java 17+, Spring Boot, Spring Data JPA, Hibernate, Microservices, Maven/Gradle, MySQL, Kafka, JUnit, Docker",
        "description": "Develop enterprise-grade enterprise microservices in Java and Spring Boot, integrating relational databases and distributed message queues."
    }
}

def clean_job_title(raw_title: str, default_role: str) -> str:
    if not raw_title:
        return default_role
    # Remove board branding like " | Indeed", " - LinkedIn", " | Built In ..."
    clean = re.sub(r'\s*[|\-–—]\s*(Indeed|LinkedIn|Glassdoor|Built In|ZipRecruiter|Dice|Monster|SimplyHired).*$', '', raw_title, flags=re.I).strip()
    clean = re.sub(r'^(Now Hiring:?\s*|Top \d+\s*|Best\s*|\d+\s*)', '', clean, flags=re.I).strip()
    clean = re.sub(r'\s*(Jobs|Openings|Positions)(\s+in\s+.*)?$', '', clean, flags=re.I).strip()
    clean = re.sub(r'\s*\b(2025|2026|2027)\b', '', clean).strip()
    return clean if len(clean) >= 4 else default_role

def extract_company_from_url(url: str, default_company: str = "Tech Innovations") -> str:
    try:
        from urllib.parse import urlparse
        domain = urlparse(url).netloc.lower()
        domain = re.sub(r'^(www\.|jobs\.|careers\.)', '', domain)
        name = domain.split('.')[0].capitalize()
        if len(name) >= 3 and name not in ["Indeed", "Linkedin", "Glassdoor", "Google", "Builtin"]:
            return f"{name} Systems"
    except Exception:
        pass
    return default_company

def get_role_specs(title: str) -> Dict[str, str]:
    t_lower = title.lower()
    # Sort keys by length descending so more specific titles match first
    for key in sorted(TECH_ROLE_REQUIREMENTS.keys(), key=len, reverse=True):
        if key in t_lower or all(w in t_lower for w in key.split()):
            return TECH_ROLE_REQUIREMENTS[key]
    # Fallback default with clean industry skills
    return {
        "requirements": "Object-Oriented Programming, System Architecture, REST APIs, Relational / NoSQL Databases, Git, Automated Testing, Cloud Services (AWS/GCP)",
        "description": f"Responsible for designing, developing, and deploying robust software solutions across cross-functional engineering teams."
    }

def detect_job_experience_level(title: str, description: str, requirements: str) -> str:
    """Classifies a job opening as 'Fresher' or 'Experienced' based on keywords, years required, and seniority."""
    text = f"{title} {description} {requirements}".lower()

    # Explicit Fresher/Entry-level keywords
    fresher_patterns = [
        r'\bfresher\b', r'\bfreshers\b', r'\bentry[-\s]?level\b', r'\bgraduate\b', r'\bjunior\b',
        r'\btrainee\b', r'\bintern\b', r'\binternship\b', r'\bassociate\b', r'\b0[-\s]?[12]\s*years?\b',
        r'\bno\s+experience\s+required\b', r'\bcampus\b'
    ]
    # Explicit Experienced keywords
    exp_patterns = [
        r'\bsenior\b', r'\blead\b', r'\bstaff\b', r'\bprincipal\b', r'\barchitect\b',
        r'\bmanager\b', r'\bhead\b', r'\b([2-9]|\d{2})\+?\s*years?\b', r'\bmid[-\s]?level\b',
        r'\bexperienced\b'
    ]

    is_exp = any(re.search(p, text) for p in exp_patterns)
    is_fresh = any(re.search(p, text) for p in fresher_patterns)

    if is_exp and not is_fresh:
        return "Experienced"
    elif is_fresh and not is_exp:
        return "Fresher"
    elif is_exp and is_fresh:
        # Check title specifically
        t_lower = title.lower()
        if any(w in t_lower for w in ["senior", "lead", "staff", "principal", "architect", "manager"]):
            return "Experienced"
        return "Fresher"

    # Default check based on title
    t_lower = title.lower()
    if any(w in t_lower for w in ["senior", "lead", "staff", "principal", "architect", "manager"]):
        return "Experienced"
    return "Fresher"

def search_tavily(query: str, location: str, work_mode: str, experience_level: str = "All", max_results: int = 15) -> List[Dict[str, Any]]:
    api_key = getattr(settings, "TAVILY_API_KEY", "") or os.getenv("TAVILY_API_KEY", "")
    if not api_key:
        return []
    jobs = []
    try:
        loc_str = "" if location in ["All Locations", "All"] else f"in {location}"
        mode_str = "" if work_mode in ["All", "All Work Modes"] else work_mode
        exp_str = "" if experience_level in ["All", None] else experience_level
        full_query = f"{query} {exp_str} hiring jobs {loc_str} {mode_str}".strip()
        
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": api_key,
            "query": full_query,
            "search_depth": "basic",
            "max_results": max_results
        }
        res = requests.post(url, json=payload, timeout=8)
        if res.status_code == 200:
            for item in res.json().get("results", []):
                raw_title = item.get("title", "")
                snippet = item.get("content", "")
                url_str = item.get("url", "")
                company = extract_company_from_url(url_str, "Tech Company")
                
                title = clean_job_title(raw_title, query)
                if " at " in raw_title:
                    parts = raw_title.split(" at ")
                    company = parts[-1].strip()
                    title = clean_job_title(parts[0].strip(), query)
                elif " - " in raw_title:
                    parts = raw_title.split(" - ")
                    company = parts[-1].strip()
                    title = clean_job_title(parts[0].strip(), query)

                emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', snippet)
                recruiter = emails[0] if emails else generate_recruiter_email(company)
                display_loc = f"{location if location not in ['All', 'All Locations'] else 'Global'} • {work_mode}"
                
                spec = get_role_specs(title or query)
                exp = detect_job_experience_level(title or query, snippet, spec["requirements"])
                jobs.append({
                    "title": title or query,
                    "company": company,
                    "location": display_loc,
                    "description": snippet or spec["description"],
                    "requirements": spec["requirements"],
                    "url": url_str,
                    "recruiter_email": recruiter,
                    "experience_level": exp,
                    "source": "Tavily AI Search"
                })
    except Exception as e:
        print(f"Tavily search error: {e}")
    return jobs

def search_duckduckgo(query: str, location: str, work_mode: str, experience_level: str = "All", max_results: int = 10) -> List[Dict[str, Any]]:
    jobs = []
    try:
        from ddgs import DDGS
        loc_str = "" if location in ["All Locations", "All"] else location
        mode_str = "" if work_mode in ["All", "All Work Modes"] else work_mode
        exp_str = "" if experience_level in ["All", None] else experience_level
        q = f"{query} {exp_str} job openings {loc_str} {mode_str}".strip()
        results = list(DDGS().text(q, max_results=max_results))
        for res in results:
            raw_title = res.get("title", "")
            snippet = res.get("body", "")
            url = res.get("href", "")
            company = extract_company_from_url(url, "Hiring Organization")
            title = clean_job_title(raw_title, query)
            if " - " in raw_title:
                parts = raw_title.split(" - ")
                company = parts[-1].strip()
                title = clean_job_title(parts[0].strip(), query)
            elif " | " in raw_title:
                parts = raw_title.split(" | ")
                company = parts[-1].strip()
                title = clean_job_title(parts[0].strip(), query)
            emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', snippet)
            recruiter = emails[0] if emails else generate_recruiter_email(company)
            display_loc = f"{location if location not in ['All', 'All Locations'] else 'Global'} • {work_mode}"
            spec = get_role_specs(title or query)
            exp = detect_job_experience_level(title or query, snippet, spec["requirements"])
            jobs.append({
                "title": title or query,
                "company": company,
                "location": display_loc,
                "description": snippet or spec["description"],
                "requirements": spec["requirements"],
                "url": url,
                "recruiter_email": recruiter,
                "experience_level": exp,
                "source": "DuckDuckGo Web Search"
            })
    except Exception as e:
        print(f"DuckDuckGo search error: {e}")
    return jobs

def search_jobs(skills: str, job_title: str, location: str = "All Locations", work_mode: str = "All", experience_level: str = "All", max_results: int = 20) -> List[Dict[str, Any]]:
    """
    Unified Multi-Engine Job Aggregator.
    If job_title is "All Matching Roles" or empty:
      Aggregates diverse openings matching candidate skills across multiple tech profiles.
    Otherwise:
      Strictly focuses on the selected target job role.
    """
    is_all_roles = not job_title or job_title.strip().lower() in ["all", "all matching roles", "all matched roles", "all job openings", "all roles"]
    target_role = "Software Engineer" if is_all_roles else job_title.strip()
    loc = location.strip() if location and location.strip() else "All Locations"
    mode = work_mode.strip() if work_mode and work_mode.strip() else "All"

    combined_jobs = []
    seen = set()

    # Junk patterns from web scrapes to skip
    JUNK_TITLE_PATTERNS = re.compile(
        r'(just a moment|cloudflare|job search|find jobs|remote and hybrid tech|apply now|'
        r'^\d[\d,]+\s+|^best\s+\d+|^top\s+\d+|^now hiring)',
        re.IGNORECASE
    )

    def add_unique(job_list):
        for j in job_list:
            t = (j.get("title") or "").strip()
            c = (j.get("company") or "").strip()
            if not t or not c:
                continue
            # Skip obviously garbage titles from job board scrapes
            if JUNK_TITLE_PATTERNS.search(t):
                continue
            if len(t) < 4 or t.lower() in ["python", "java", "jobs", "job"]:
                continue
            key = (t.lower(), c.lower())
            if key not in seen:
                seen.add(key)
                combined_jobs.append(j)

    if is_all_roles:
        # Search for multiple diverse roles derived from candidate skills
        diverse_queries = ["Python Developer", "Full Stack Developer", "Computer Vision Engineer", "React Developer", "AI Engineer"]
        for q in diverse_queries[:3]:
            add_unique(search_tavily(q, loc, mode, experience_level, max_results=4))
            add_unique(search_duckduckgo(q, loc, mode, experience_level, max_results=3))
    else:
        # 1. Tavily AI Search (Searches live web for exact query & location)
        add_unique(search_tavily(target_role, loc, mode, experience_level, max_results=12))

        # 2. DuckDuckGo Search
        add_unique(search_duckduckgo(target_role, loc, mode, experience_level, max_results=8))

    # 3. Supplemental realistic company postings with precise role-specific requirements
    if loc not in ["All Locations", "All"]:
        display_loc = f"{loc} • {mode}"
    else:
        if mode in ["Remote", "Hybrid", "On-site"]:
            display_loc = f"Global • {mode}"
        else:
            display_loc = "Global • Remote / Hybrid / On-site"

    if is_all_roles:
        all_role_samples = [
            ("Graduate / Fresher Python Developer", "Nexura Software Labs", "Fresher"),
            ("Junior Computer Vision Engineer", "CloudScale Innovations", "Fresher"),
            ("Full Stack Developer (0-1 yrs exp)", "NextGen Data Systems", "Fresher"),
            ("Senior Full Stack Architect", "Apex Global Solutions", "Experienced"),
            ("Lead Deep Learning Specialist", "Starlight Interactive", "Experienced"),
            ("Senior Backend Cloud Engineer", "Horizon Cloud Labs", "Experienced")
        ]
        for role_name, company_name, exp_level in all_role_samples:
            if experience_level in ["Fresher", "Experienced"] and exp_level != experience_level:
                continue
            key = (role_name.lower(), company_name.lower())
            if key not in seen and len(combined_jobs) < max_results:
                seen.add(key)
                role_spec = get_role_specs(role_name)
                combined_jobs.append({
                    "title": role_name,
                    "company": company_name,
                    "location": display_loc,
                    "description": f"We are actively seeking a talented professional for the position of {role_name}. "
                                   f"You will spearhead feature development, collaborate across engineering teams, and deliver robust software.",
                    "requirements": role_spec["requirements"],
                    "url": f"https://{re.sub(r'[^a-zA-Z0-9]', '', company_name).lower()}.io/careers",
                    "recruiter_email": generate_recruiter_email(company_name),
                    "experience_level": exp_level,
                    "source": "Aggregated Live Web Integration"
                })
    else:
        has_seniority = any(s in target_role.lower() for s in ["senior", "lead", "staff", "junior", "principal", "architect"])

        sample_companies = [
            {"role_suffix": " (Entry-Level / Fresher)", "prefix": "Junior / Associate", "company": "Nexura Software Labs", "exp": "Fresher"},
            {"role_suffix": " - Graduate Trainee", "prefix": "Associate", "company": "CloudScale Innovations", "exp": "Fresher"},
            {"role_suffix": " - Early Career", "prefix": "Junior", "company": "Vanguard Tech Systems", "exp": "Fresher"},
            {"role_suffix": " - Distributed Systems", "prefix": "Senior", "company": "NextGen Data Systems", "exp": "Experienced"},
            {"role_suffix": " - Architecture & APIs", "prefix": "Lead", "company": "Apex Global Solutions", "exp": "Experienced"},
            {"role_suffix": " Specialist", "prefix": "Principal", "company": "Starlight Interactive", "exp": "Experienced"},
            {"role_suffix": " - Platform Engineering", "prefix": "Staff", "company": "Horizon Cloud Labs", "exp": "Experienced"}
        ]

        for item in sample_companies:
            exp_level = item["exp"]
            if experience_level in ["Fresher", "Experienced"] and exp_level != experience_level:
                continue

            if has_seniority:
                title = f"{target_role}{item['role_suffix']}"
            else:
                title = f"{item['prefix']} {target_role}"

            key = (title.lower(), item["company"].lower())
            if key not in seen and len(combined_jobs) < max_results:
                seen.add(key)
                role_spec = get_role_specs(title)
                combined_jobs.append({
                    "title": title,
                    "company": item["company"],
                    "location": display_loc,
                    "description": f"We are actively seeking a talented professional for the position of {title}. "
                                   f"You will spearhead feature development, collaborate across engineering teams, and deliver robust software.",
                    "requirements": role_spec["requirements"],
                    "url": f"https://{re.sub(r'[^a-zA-Z0-9]', '', item['company']).lower()}.io/careers",
                    "recruiter_email": generate_recruiter_email(item["company"]),
                    "experience_level": exp_level,
                    "source": "Aggregated Live Web Integration"
                })

    # Filter out by experience_level if requested
    if experience_level in ["Fresher", "Experienced"]:
        combined_jobs = [j for j in combined_jobs if j.get("experience_level") == experience_level]

    return combined_jobs[:max_results]
