import sys
import os
import json
from pathlib import Path

from fastapi.testclient import TestClient


# -------------------------------------------------
# 1. FIND BACKEND DIRECTORY
# -------------------------------------------------

ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"

sys.path.insert(0, str(BACKEND_DIR))


# -------------------------------------------------
# 2. SET TEST API KEY
# -------------------------------------------------
# This is only a dummy key.
# No real Gemini API request will be made by these tests.

os.environ["GEMINI_API_KEY"] = "test-key"


# -------------------------------------------------
# 3. IMPORT FASTAPI APP
# -------------------------------------------------

from main import app


client = TestClient(app)


# -------------------------------------------------
# 4. TEST HEALTH CHECK
# -------------------------------------------------

def test_health_check():

    response = client.get("/")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "ok"
    assert "AI Startup Launchpad API is running" in data["message"]


# -------------------------------------------------
# 5. TEST EMPTY IDEA
# -------------------------------------------------

def test_empty_idea():

    response = client.post(
        "/generate",
        json={"idea": ""}
    )

    assert response.status_code == 200

    assert "Idea text cannot be empty." in response.text


# -------------------------------------------------
# 6. TEST WHITESPACE-ONLY IDEA
# -------------------------------------------------

def test_whitespace_idea():

    response = client.post(
        "/generate",
        json={"idea": "     "}
    )

    assert response.status_code == 200

    assert "Idea text cannot be empty." in response.text


# -------------------------------------------------
# 7. TEST MISSING IDEA FIELD
# -------------------------------------------------

def test_missing_idea():

    response = client.post(
        "/generate",
        json={}
    )

    # Pydantic validation rejects the request
    assert response.status_code == 422


# -------------------------------------------------
# 8. TEST SUCCESSFUL GENERATION
# -------------------------------------------------

def test_successful_generation(monkeypatch):

    # Fake Gemini response containing all 8 sections
    fake_analysis = {
        "business_summary": "A startup that helps students find affordable internships.",
        "problem_statement": "Students struggle to find suitable internships.",
        "target_audience": "College students looking for internships.",
        "unique_value_proposition": "Personalized internship matching and skill-gap analysis.",
        "swot_analysis": "Strengths: personalization. Weaknesses: AI dependency.",
        "mvp_features": "Skill analysis, internship matching, and roadmap generation.",
        "revenue_model": "Freemium subscriptions and premium career services.",
        "elevator_pitch": "An AI platform that helps students become internship-ready."
    }

    # Fake response object.
    # Your backend reads response.text and then json.loads() it.
    class FakeResponse:

        text = json.dumps(fake_analysis)


    # Replace the real Gemini API call with our fake response.
    def fake_generate_content(*args, **kwargs):

        return FakeResponse()


    monkeypatch.setattr(
        "main.client.models.generate_content",
        fake_generate_content
    )


    response = client.post(
        "/generate",
        json={
            "idea": "An AI platform that helps college students find internships."
        }
    )


    assert response.status_code == 200

    content = response.text


    # -------------------------------------------------
    # Check all 8 sections
    # -------------------------------------------------

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

        assert section in content


    # -------------------------------------------------
    # Check successful status
    # -------------------------------------------------

    assert '"status": "success"' in content


    # -------------------------------------------------
    # Check completion event
    # -------------------------------------------------

    assert "event: done" in content


# -------------------------------------------------
# 9. TEST LONG IDEA
# -------------------------------------------------

def test_long_idea_is_accepted(monkeypatch):

    fake_analysis = {
        "business_summary": "Test summary",
        "problem_statement": "Test problem",
        "target_audience": "Test audience",
        "unique_value_proposition": "Test value proposition",
        "swot_analysis": "Test SWOT",
        "mvp_features": "Test features",
        "revenue_model": "Test revenue model",
        "elevator_pitch": "Test elevator pitch"
    }


    class FakeResponse:

        text = json.dumps(fake_analysis)


    def fake_generate_content(*args, **kwargs):

        return FakeResponse()


    monkeypatch.setattr(
        "main.client.models.generate_content",
        fake_generate_content
    )


    # Create an idea longer than your 2000-character limit
    long_idea = "A" * 3000


    response = client.post(
        "/generate",
        json={"idea": long_idea}
    )


    assert response.status_code == 200

    assert "event: done" in response.text