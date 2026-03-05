import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base

# Setup as in test_auth (could be moved to conftest.py in a real project)
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_tasks.db"
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

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def get_token(email, role="manager"):
    client.post(
        "/api/v1/auth/register",
        json={"name": "Test User", "email": email, "password": "Password123!", "role": role}
    )
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "Password123!"}
    )
    return resp.json()["access_token"]

def test_employee_cannot_create_project():
    token = get_token("emp@example.com", "employee")
    response = client.post(
        "/api/v1/projects/",
        json={"name": "Top Secret", "description": "No employees allowed"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 403

def test_manager_can_create_project():
    token = get_token("mgr@example.com", "manager")
    response = client.post(
        "/api/v1/projects/",
        json={"name": "Valid Project", "description": "Manager project"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
