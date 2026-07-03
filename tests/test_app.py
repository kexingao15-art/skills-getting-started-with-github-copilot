import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


class TestRootEndpoint:
    """Test the root endpoint"""
    
    def test_root_redirects(self):
        """Test that the root endpoint redirects to static/index.html"""
        response = client.get("/", follow_redirects=False)
        assert response.status_code in [301, 302, 307, 308]
        assert "static" in response.headers["location"]


class TestGetActivities:
    """Test the GET /activities endpoint"""
    
    def test_get_activities_success(self):
        """Test that we can get the activities list"""
        response = client.get("/activities")
        assert response.status_code == 200
        activities = response.json()
        assert isinstance(activities, dict)
        assert len(activities) > 0
    
    def test_get_activities_structure(self):
        """Test that activities have the correct structure"""
        response = client.get("/activities")
        activities = response.json()
        
        for activity_name, activity_data in activities.items():
            assert isinstance(activity_name, str)
            assert "description" in activity_data
            assert "schedule" in activity_data
            assert "max_participants" in activity_data
            assert "participants" in activity_data
            assert isinstance(activity_data["participants"], list)
    
    def test_get_activities_returns_chess_club(self):
        """Test that Chess Club is in the activities"""
        response = client.get("/activities")
        activities = response.json()
        assert "Chess Club" in activities
        assert activities["Chess Club"]["max_participants"] == 12


class TestSignup:
    """Test the POST /activities/{activity_name}/signup endpoint"""
    
    def test_signup_for_activity_success(self):
        """Test successfully signing up for an activity"""
        response = client.post(
            "/activities/Programming Class/signup?email=newstudent@mergington.edu"
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "newstudent@mergington.edu" in data["message"]
    
    def test_signup_activity_not_found(self):
        """Test signup for non-existent activity"""
        response = client.post(
            "/activities/Non-Existent Activity/signup?email=test@mergington.edu"
        )
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "Activity not found" in data["detail"]
    
    def test_signup_duplicate_email(self):
        """Test that duplicate email signup fails"""
        email = "duplicate@mergington.edu"
        activity = "Art Club"
        
        # First signup should succeed
        response1 = client.post(
            f"/activities/{activity}/signup?email={email}"
        )
        assert response1.status_code == 200
        
        # Second signup with same email should fail
        response2 = client.post(
            f"/activities/{activity}/signup?email={email}"
        )
        assert response2.status_code == 400
        data = response2.json()
        assert "Email already registered" in data["detail"]
    
    def test_signup_updates_participant_list(self):
        """Test that signup actually adds participant to the list"""
        email = "verify@mergington.edu"
        activity = "Science Club"
        
        # Get initial count
        response_before = client.get("/activities")
        initial_count = len(response_before.json()[activity]["participants"])
        
        # Sign up
        client.post(f"/activities/{activity}/signup?email={email}")
        
        # Get updated count
        response_after = client.get("/activities")
        final_count = len(response_after.json()[activity]["participants"])
        
        assert final_count == initial_count + 1
        assert email in response_after.json()[activity]["participants"]


class TestUnregister:
    """Test the DELETE /activities/{activity_name}/signup endpoint"""
    
    def test_unregister_success(self):
        """Test successfully unregistering from an activity"""
        email = "unregister@mergington.edu"
        activity = "Debate Team"
        
        # First sign up
        client.post(f"/activities/{activity}/signup?email={email}")
        
        # Then unregister
        response = client.delete(
            f"/activities/{activity}/signup?email={email}"
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert email in data["message"]
    
    def test_unregister_not_registered(self):
        """Test unregistering when not registered"""
        response = client.delete(
            "/activities/Drama Club/signup?email=notregistered@mergington.edu"
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "not registered" in data["detail"]
    
    def test_unregister_activity_not_found(self):
        """Test unregister for non-existent activity"""
        response = client.delete(
            "/activities/Non-Existent/signup?email=test@mergington.edu"
        )
        assert response.status_code == 404
        data = response.json()
        assert "Activity not found" in data["detail"]
    
    def test_unregister_removes_from_list(self):
        """Test that unregister actually removes participant"""
        email = "remove@mergington.edu"
        activity = "Basketball Team"
        
        # Sign up
        client.post(f"/activities/{activity}/signup?email={email}")
        
        # Verify in list
        response_before = client.get("/activities")
        assert email in response_before.json()[activity]["participants"]
        
        # Unregister
        client.delete(f"/activities/{activity}/signup?email={email}")
        
        # Verify removed
        response_after = client.get("/activities")
        assert email not in response_after.json()[activity]["participants"]
