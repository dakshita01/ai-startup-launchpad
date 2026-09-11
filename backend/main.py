"""
AI Startup Launchpad - Backend

FastAPI server that takes a raw startup idea, sends ONE request
to Google Gemini, receives all 8 startup-analysis sections as
structured JSON, and streams each section back to the browser
using Server-Sent Events (SSE).
"""

import os
import json
import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from google import genai
from google.genai import types


# -------------------------------------------------
# 1. CONFIGURATION
# -------------------------------------------------

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY environment variable is not set"
    )

client = genai.Client(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-3.6-flash"

app = FastAPI(
    title="AI Startup Launchpad API"
)


# -------------------------------------------------
# 2. CORS
# -------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------
# 3. STARTUP ANALYSIS SCHEMA
# -------------------------------------------------

class StartupAnalysis(BaseModel):
    business_summary: str
    problem_statement: str
    target_audience: str
    unique_value_proposition: str
    swot_analysis: str
    mvp_features: str
    revenue_model: str
    elevator_pitch: str


class IdeaRequest(BaseModel):
    idea: str


# -------------------------------------------------
# 4. MASTER PROMPT
# -------------------------------------------------

MASTER_PROMPT = """
You are an expert startup strategist helping founders evaluate
and communicate startup ideas.

Analyze the following startup idea:

"{idea}"

Generate exactly these 8 sections:

1. BUSINESS SUMMARY
Write a concise, professional 3-4 sentence summary.
Be specific to the startup idea.

2. PROBLEM STATEMENT
Write a clear 3-4 sentence explanation of the real-world
problem this startup solves.

3. TARGET AUDIENCE
Describe the target customers in 3-4 sentences.
Explain who they are and why they need this product.

4. UNIQUE VALUE PROPOSITION
Write a sharp 2-3 sentence UVP explaining what makes this
startup different from existing alternatives.

5. SWOT ANALYSIS
Provide:
Strengths:
- 1-2 concise points

Weaknesses:
- 1-2 concise points

Opportunities:
- 1-2 concise points

Threats:
- 1-2 concise points

6. MVP FEATURES
Provide 4-6 concise MVP features as a bullet list.

7. REVENUE MODEL
Write 2-3 sentences explaining practical monetization
options. Mention 1-2 realistic revenue sources.

8. ELEVATOR PITCH
Write a punchy 2-3 sentence elevator pitch suitable for
speaking aloud in approximately 30 seconds.

Return ONLY the requested structured information.
Do not add an introduction or conclusion.
"""


# -------------------------------------------------
# 5. GENERATE ALL 8 SECTIONS IN ONE GEMINI REQUEST
# -------------------------------------------------

async def generate_analysis(idea: str) -> dict:

    prompt = MASTER_PROMPT.format(idea=idea)

    try:

        response = await asyncio.to_thread(
            client.models.generate_content,
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=StartupAnalysis,
            ),
        )

        # The structured response is returned as JSON text.
        analysis = json.loads(response.text)

        return analysis

    except Exception as e:

        print("========================================")
        print("GEMINI ERROR:", repr(e))
        print("========================================")

        raise


# -------------------------------------------------
# 6. STREAMING ENDPOINT
# -------------------------------------------------

@app.post("/generate")
async def generate(req: IdeaRequest):

    idea = req.idea.strip()

    # ---------------------------------------------
    # Input validation
    # ---------------------------------------------

    if not idea:

        async def empty_error_stream():

            error_result = {
                "section": "error",
                "status": "error",
                "content": "Idea text cannot be empty."
            }

            yield f"data: {json.dumps(error_result)}\n\n"

        return StreamingResponse(
            empty_error_stream(),
            media_type="text/event-stream",
        )

    # Limit input size
    if len(idea) > 2000:
        idea = idea[:2000]

    # ---------------------------------------------
    # Generate all sections with ONE API request
    # ---------------------------------------------

    try:

        analysis = await generate_analysis(idea)

    except Exception as e:

        async def error_stream():

            error_result = {
                "section": "error",
                "status": "error",
                "content": str(e),
            }

            yield f"data: {json.dumps(error_result)}\n\n"

        return StreamingResponse(
            error_stream(),
            media_type="text/event-stream",
        )

    # ---------------------------------------------
    # Send the 8 sections to frontend
    # ---------------------------------------------

    async def event_stream():

        sections = [
            "business_summary",
            "problem_statement",
            "target_audience",
            "unique_value_proposition",
            "swot_analysis",
            "mvp_features",
            "revenue_model",
            "elevator_pitch",
        ]

        for section in sections:

            result = {
                "section": section,
                "status": "success",
                "content": analysis.get(
                    section,
                    "No content generated."
                ),
            }

            yield f"data: {json.dumps(result)}\n\n"

            # Small delay so the frontend visually receives
            # the cards one after another.
            await asyncio.sleep(0.15)

        # Tell frontend generation is complete
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
    )


# -------------------------------------------------
# 7. HEALTH CHECK
# -------------------------------------------------

@app.get("/")
def health_check():

    return {
        "status": "ok",
        "message": "AI Startup Launchpad API is running",
    }