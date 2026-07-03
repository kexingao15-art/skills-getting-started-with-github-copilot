import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_root():
    """Test that the root endpoint redirects"""
    response = client.get("/", allow_redirects=False)
    assert response.status_code in [301, 302, 307, 308]


def test_get_activities():
    """Test that we can get the activities list"""
    response = client.get("/activities")
    assert response.status_code == 200
    activities = response.json()
    assert isinstance(activities, dict)
    assert len(activities) > 0


def test_signup_for_activity():
    """Test signing up for an activity"""
    response = client.post(
        "/activities/Chess Club/signup?email=test@mergington.edu"
    )
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
