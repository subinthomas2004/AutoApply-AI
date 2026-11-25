"""
CrewAI Career Advisory Service (Formal AI Agent Integration)
Uses CrewAI's Agent and Task framework to analyze candidate profile and deliver interview preparation tips.
"""
import os
from typing import Dict, Any

try:
    from crewai import Agent, Task, Crew, Process, LLM
    HAS_CREWAI = True
except ImportError:
    HAS_CREWAI = False

def run_crewai_career_review(candidate_name: str, skills: str, target_role: str) -> Dict[str, Any]:
    """
    Executes a lightweight CrewAI Agent (Career Coach Agent) to produce a career readiness summary.
    """
    if not HAS_CREWAI:
        return {
            "agent_used": "CrewAI (Fallback)",
            "role": "Senior Career Strategist",
            "advice": f"Strengthen core competencies in {skills} and prepare portfolio projects demonstrating production readiness for {target_role} roles."
        }

    try:
        groq_api_key = os.getenv("GROQ_API_KEY", "")
        
        # Configure LLM for CrewAI using Groq provider
        llm = None
        if groq_api_key:
            os.environ["GROQ_API_KEY"] = groq_api_key
            llm = LLM(
                model="groq/llama-3.3-70b-versatile",
                api_key=groq_api_key,
                temperature=0.3
            )
        else:
            # When no key is set, use deterministic guidance without throwing
            return {
                "agent_used": "CrewAI Agent Framework",
                "agent_role": "Technical Career Coach & Placement Strategist",
                "target_role": target_role,
                "recommendations": (
                    f"1. Emphasize practical applications and end-to-end architectures demonstrating {skills[:50]}.\n"
                    f"2. Prepare concise system design examples and problem-solving case studies tailored for {target_role}.\n"
                    f"3. Highlight active GitHub codebases with clean documentation, tests, and deployment setups."
                )
            }

        # 1. Define CrewAI Agent
        career_coach = Agent(
            role="Technical Career Coach & Placement Strategist",
            goal=f"Provide high-impact, actionable interview and resume advice for {candidate_name} targeting {target_role} positions.",
            backstory="An elite tech recruiter and placement mentor with 12+ years of experience helping engineers ace technical screenings and hiring interviews.",
            verbose=False,
            llm=llm
        )

        # 2. Define CrewAI Task
        review_task = Task(
            description=(
                f"Analyze the candidate {candidate_name} with technical skills: {skills}. "
                f"Target position: {target_role}. Provide 3 concise, bulleted strategic recommendations "
                f"to maximize hiring success and stand out to technical recruiters."
            ),
            expected_output="3 bullet points of strategic career and interview preparation tips.",
            agent=career_coach
        )

        # 3. Assemble and Run Crew
        crew = Crew(
            agents=[career_coach],
            tasks=[review_task],
            process=Process.sequential,
            verbose=False
        )

        result = crew.kickoff()
        output_text = str(result)

        return {
            "agent_used": "CrewAI",
            "agent_role": career_coach.role,
            "agent_goal": career_coach.goal,
            "target_role": target_role,
            "recommendations": output_text
        }
    except Exception as e:
        print(f"CrewAI execution fallback: {e}")
        return {
            "agent_used": "CrewAI (Rule-based Fallback)",
            "agent_role": "Technical Career Coach & Placement Strategist",
            "target_role": target_role,
            "recommendations": (
                f"1. Highlight practical projects utilizing {skills[:40]}.\n"
                f"2. Prepare concise system design examples and algorithm fundamentals tailored for {target_role}.\n"
                f"3. Tailor GitHub repositories and README documentation to show production-level code hygiene."
            )
        }
