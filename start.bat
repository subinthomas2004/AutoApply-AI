@echo off
echo ========================================================
echo Starting AI Job Finder & Automated Application System
echo ========================================================

REM Set python path
set PYTHONPATH=%~dp0backend

echo Starting Backend Server (FastAPI) on port 8000...
start "Backend - FastAPI" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Frontend Server (React Vite) on port 3000...
start "Frontend - React Vite" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Application initialized!
echo Open your browser at: http://localhost:3000 or http://localhost:5173
echo API Docs available at: http://127.0.0.1:8000/docs
echo ========================================================
pause
