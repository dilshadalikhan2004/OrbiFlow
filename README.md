# Enterprise Task & Workflow Management API

A robust, enterprise-grade FastAPI backend with JWT Authentication, Role-Based Access Control (RBAC), and full Project/Task management.

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Python 3.11+ (for local development)

### Running with Docker (Recommended)
This is the easiest way to get the system up and running with a PostgreSQL database.

```bash
docker-compose up --build
```

The API will be available at [http://localhost:8000](http://localhost:8000).
Interactive Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Local Development (without Docker)
1. **Create Virtual Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Run Application**:
   ```bash
   uvicorn app.main:app --reload
   ```
   *Note: By default, it will use a local `enterprise.db` (SQLite).*

## 🧪 Testing
Run the test suite using PyTest:
```bash
pytest
```
*Tests use an isolated `test.db` (SQLite) and do not require Docker.*

## 🔐 Authentication & RBAC
- **Registration**: `POST /api/v1/auth/register`
- **Login**: `POST /api/v1/auth/login` (Returns JWT)
- **Roles**:
  - `admin`: Full system access.
  - `manager`: Can create projects and tasks.
  - `employee`: Can view assigned tasks and update status.

## 📡 API Health Check
You can verify the system status at:
`GET http://localhost:8000/health`

## 📁 Project Structure
- `app/`: Source code
  - `models/`: SQLAlchemy ORM models
  - `schemas/`: Pydantic validation schemas
  - `services/`: Business logic layer
  - `routes/`: API endpoint definitions
  - `dependencies/`: FastAPI dependencies (Auth/RBAC)
- `tests/`: PyTest suite
- `Dockerfile` & `docker-compose.yml`: Containerization
