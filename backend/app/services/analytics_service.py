"""
Analytics Service
Computes dashboard KPIs and chart data from the database.
All queries are scoped to an organization.
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.models.task import Task, TaskStatus
from app.models.project import Project
from app.models.user import User
from app.models.organization import OrganizationUser


class AnalyticsService:

    @staticmethod
    def get_dashboard(db: Session, organization_id: uuid.UUID) -> dict:
        """Return all KPI and chart data for the dashboard in one call."""

        # ── Scoped project IDs ────────────────────────────────────────────────
        project_ids_q = (
            db.query(Project.id)
            .filter(Project.organization_id == organization_id)
            .subquery()
        )

        task_q = db.query(Task).filter(Task.project_id.in_(project_ids_q))

        # ── Summary KPIs ──────────────────────────────────────────────────────
        active_projects = (
            db.query(func.count(Project.id))
            .filter(Project.organization_id == organization_id)
            .scalar() or 0
        )

        total_tasks = task_q.count()

        status_counts = (
            db.query(Task.status, func.count(Task.id))
            .filter(Task.project_id.in_(project_ids_q))
            .group_by(Task.status)
            .all()
        )
        counts_by_status = {str(s): n for s, n in status_counts}

        pending_tasks    = counts_by_status.get("todo",        0)
        in_progress      = counts_by_status.get("in_progress", 0)
        completed_tasks  = counts_by_status.get("done",        0)

        # ── This week ─────────────────────────────────────────────────────────
        week_start = datetime.utcnow() - timedelta(days=7)
        tasks_this_week = (
            task_q.filter(Task.created_at >= week_start).count()
        )
        completed_this_week = (
            task_q
            .filter(Task.status == TaskStatus.DONE, Task.created_at >= week_start)
            .count()
        )

        # ── Avg completion time (days between creation and deadline for DONE) ─
        # Proxy: tasks with deadline set and status DONE
        done_with_deadline = (
            db.query(Task)
            .filter(
                Task.project_id.in_(project_ids_q),
                Task.status == TaskStatus.DONE,
                Task.deadline.isnot(None),
            )
            .all()
        )
        if done_with_deadline:
            deltas = [
                max(0, (t.deadline - t.created_at).days)
                for t in done_with_deadline
                if t.deadline >= t.created_at
            ]
            avg_completion_time = round(sum(deltas) / len(deltas), 1) if deltas else 0
        else:
            avg_completion_time = 0

        # ── Tasks created per day (last 7 days) ───────────────────────────────
        tasks_per_day = []
        for i in range(6, -1, -1):
            day       = datetime.utcnow() - timedelta(days=i)
            day_start = day.replace(hour=0,  minute=0,  second=0,  microsecond=0)
            day_end   = day.replace(hour=23, minute=59, second=59, microsecond=999999)
            count = (
                task_q
                .filter(Task.created_at >= day_start, Task.created_at <= day_end)
                .count()
            )
            completed_count = (
                task_q
                .filter(
                    Task.status == TaskStatus.DONE,
                    Task.created_at >= day_start,
                    Task.created_at <= day_end,
                )
                .count()
            )
            tasks_per_day.append({
                "date":      day.strftime("%a"),  # Mon, Tue …
                "created":   count,
                "completed": completed_count,
            })

        # ── Team productivity (tasks done per member) ─────────────────────────
        productivity_rows = (
            db.query(
                User.name,
                User.email,
                func.count(Task.id).label("completed"),
                func.sum(
                    case((Task.status == TaskStatus.TODO,        1), else_=0)
                ).label("todo"),
                func.sum(
                    case((Task.status == TaskStatus.IN_PROGRESS, 1), else_=0)
                ).label("in_progress"),
            )
            .join(Task, Task.assignee_id == User.id)
            .filter(Task.project_id.in_(project_ids_q))
            .group_by(User.id, User.name, User.email)
            .order_by(func.count(Task.id).desc())
            .limit(8)
            .all()
        )

        team_productivity = [
            {
                "name":        row.name or row.email.split("@")[0],
                "completed":   int(row.completed or 0),
                "todo":        int(row.todo or 0),
                "in_progress": int(row.in_progress or 0),
            }
            for row in productivity_rows
        ]

        # ── Priority breakdown ────────────────────────────────────────────────
        priority_rows = (
            db.query(Task.priority, func.count(Task.id))
            .filter(Task.project_id.in_(project_ids_q))
            .group_by(Task.priority)
            .all()
        )
        priority_breakdown = [
            {"name": str(p).capitalize(), "value": n}
            for p, n in priority_rows
        ]

        return {
            # KPIs
            "active_projects":       active_projects,
            "total_tasks":           total_tasks,
            "pending_tasks":         pending_tasks,
            "in_progress_tasks":     in_progress,
            "completed_tasks":       completed_tasks,
            "tasks_this_week":       tasks_this_week,
            "completed_this_week":   completed_this_week,
            "avg_completion_time":   avg_completion_time,
            # Charts
            "tasks_per_day":         tasks_per_day,
            "team_productivity":     team_productivity,
            "priority_breakdown":    priority_breakdown,
        }
