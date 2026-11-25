# AI-Powered Job Finder & Automated Application System

An end-to-end intelligent job search and personalized email application automation system with **strict Human-in-the-Loop review and approval** safeguards.

---

## 🌟 Key Features

1. **Job Search (Web Integration)**
   - Integrates live web job feeds (Jobicy Open API) and search integration (DuckDuckGo / web scraping fallbacks).
   - Searches openings based on **skills, job title, and location**.
   - Extracts company name, job requirements, URLs, and recruiter/careers email addresses.

2. **CV & Job Matching**
   - Automatically parses candidate resumes (**PDF, DOCX, TXT**) using `pypdf`, `python-docx`, and NLP.
   - Extracts candidate summary, contact info, and core skill stack.
   - Calculates a quantitative **compatibility match score (0–100%)** and qualitative gap analysis using **Groq LLM** (`llama-3.3-70b-versatile`) with robust NLP scoring fallbacks.

3. **AI Email Generation**
   - Crafts customized, role-tailored application emails highlighting matching skills and candidate achievements.
   - Supports custom instructions (e.g. emphasizing availability, tone adjustments).

4. **Human Approval Safeguard (Strict Human-in-the-Loop)**
   - **No email is ever sent automatically.**
   - All generated drafts are queued in the **Pending Approvals** outbox.
   - Users can **review, edit subjects/recipients/bodies, approve, or reject** with reason logging.

5. **Email Automation with Attachments**
   - Automatically attaches the candidate's original CV file.
   - Sends via SMTP (Gmail, Outlook, custom mail servers) with TLS/SSL.
   - Built-in dry-run / simulated dispatch mode for safe offline evaluation without accidental emailing.

6. **Database Persistence**
   - Built with SQLAlchemy ORM and SQLite (readily switchable to PostgreSQL or MySQL).
   - Persists candidates, job postings, matching scores, and audit trail of applications and approval statuses.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React (Vite, Lucide React, Modern Glassmorphism UI)
- **Backend**: FastAPI (Python 3.10+, RESTful API architecture, SQLAlchemy ORM)
- **AI / LLM Engine**: Groq Cloud SDK (`llama-3.3-70b-versatile` / `llama3-70b-8192`) + NLP parser
- **Database**: SQLite / SQLAlchemy
- **Containerization**: Docker & Docker Compose

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- (Optional) Docker & Docker Compose

### 2. Configure Environment
Create or edit `backend/.env`:
```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Email configuration (Optional for live sending; safe simulated mode if blank)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_16_char_google_app_password
SMTP_FROM_EMAIL=your_email@gmail.com
SMTP_FROM_NAME="Alex Johnson"
```

### 3. Running Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- Interactive API Docs: `http://localhost:8000/docs`

### 4. Running Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
- Open browser at: `http://localhost:3000` or `http://localhost:5173`

---

## 🐳 Docker Deployment

To launch the full system using Docker Compose:
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## 🔒 Security & Human Approval Workflow

```
[Job Found] 
      │
      ▼
[CV Match Analysis] 
      │
      ▼
[AI Generates Email Draft] 
      │
      ▼
[Status: PENDING_APPROVAL] ──▶ (Held in Database)
      │
      ├───────────▶ [User Edits Draft] ──▶ Saved to DB
      ├───────────▶ [User Rejects]     ──▶ Status: REJECTED (Never sent)
      │
      ▼
[Explicit Human Approval Clicked]
      │
      ▼
[SMTP Dispatch with Attached CV] ──▶ Status: SENT
```
