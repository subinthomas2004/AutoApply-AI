from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import candidates_router, jobs_router, applications_router, config_router

# Initialize SQL Schema (for relational/fallback storage)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack AI-Powered Job Finder & Automated Application System with Groq LLM, LangChain, MongoDB & DuckDuckGo Search",
    version="1.1.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(candidates_router.router, prefix="/api")
app.include_router(jobs_router.router, prefix="/api")
app.include_router(applications_router.router, prefix="/api")
app.include_router(config_router.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "llm": "Groq (" + settings.GROQ_MODEL + ") via LangChain",
        "database": settings.DATABASE_TYPE,
        "web_search": settings.JOB_SEARCH_PROVIDER,
        "human_approval_required": True,
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
