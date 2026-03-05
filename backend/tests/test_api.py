import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

# Test Database Setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_registration():
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test Admin",
            "email": "admin@example.com",
            "password": "StrongPassword123!",
            "role": "admin"
        }
    )
    assert response.status_code == 201
    assert response.json()["email"] == "admin@example.com"

def test_login():
    # Login with the user created above
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@example.com",
            "password": "StrongPassword123!"
        }
    )
    assert response.status_code == 200
    assert "access_token" in response.json()
    return response.json()["access_token"]

def test_unauthorized_access():
    # Attempt to project list without token
    response = client.get("/api/v1/projects/")
    assert response.status_code == 401

def test_project_creation():
    # Get token
    token = test_login()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create project
    response = client.post(
        "/api/v1/projects/",
        json={
            "name": "Test Project",
            "description": "A project for testing"
        },
        headers=headers
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Test Project"

def test_employee_rbac_restriction():
    # Register an employee
    client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test Emp",
            "email": "emp@example.com",
            "password": "Password123!",
            "role": "employee"
        }
    )
    
    # Login as employee
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "emp@example.com", "password": "Password123!"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Attempt to create project (restricted to Manager/Admin)
    response = client.post(
        "/api/v1/projects/",
        json={"name": "Restricted Project"},
        headers=headers
    )
    assert response.status_code == 403
