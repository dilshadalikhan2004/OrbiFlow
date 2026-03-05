"""
Migration: Create activity_logs table.
Run once with: venv\Scripts\python.exe migrate_activity.py
"""
import sqlite3
import uuid
from datetime import datetime

DB_PATH = "./enterprise.db"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Check if the table already exists
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='activity_logs';")
exists = cursor.fetchone()

if exists:
    print("activity_logs table already exists — nothing to do.")
else:
    cursor.execute("""
        CREATE TABLE activity_logs (
            id TEXT PRIMARY KEY,
            organization_id TEXT NOT NULL,
            project_id TEXT,
            task_id TEXT,
            user_id TEXT NOT NULL,
            action TEXT NOT NULL,
            details TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
            FOREIGN KEY (project_id)      REFERENCES projects(id)      ON DELETE CASCADE,
            FOREIGN KEY (task_id)         REFERENCES tasks(id)         ON DELETE CASCADE,
            FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE
        )
    """)

    # Indexes for fast feed queries
    cursor.execute("CREATE INDEX ix_activity_logs_org_id    ON activity_logs (organization_id);")
    cursor.execute("CREATE INDEX ix_activity_logs_project_id ON activity_logs (project_id);")
    cursor.execute("CREATE INDEX ix_activity_logs_created_at ON activity_logs (created_at);")

    conn.commit()
    print("[OK] activity_logs table and indexes created successfully.")

conn.close()
