"""
WebSocket router — /ws/projects/{project_id}

Clients authenticate by passing the JWT as a query param:
  ws://host/ws/projects/<id>?token=<jwt>

Lifecycle:
  1. Parse & validate token
  2. Join the project room
  3. Stay alive (send periodic pings)
  4. On disconnect → leave room
"""
import json
import asyncio
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.ws.manager import manager
from app.security import decode_token
from app.models.user import User

router = APIRouter(tags=["WebSocket"])


def _get_user_from_token(token: str, db: Session) -> User | None:
    try:
        payload = decode_token(token)
        if not payload:
            return None
        user_id_str = payload.get("sub")
        if not user_id_str:
            return None
        user_id = uuid.UUID(user_id_str)
        return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None


@router.websocket("/ws/projects/{project_id}")
async def project_ws(
    project_id: str,
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token"),
    db: Session = Depends(get_db),
):
    # ── Auth ──────────────────────────────────────────────────────────────────
    user = _get_user_from_token(token, db)
    if not user:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    # ── Join room ─────────────────────────────────────────────────────────────
    await manager.connect(project_id, websocket)

    # Announce arrival to other participants
    await manager.broadcast(project_id, {
        "event":   "user_joined",
        "user_id": str(user.id),
        "name":    user.name or user.email,
    })

    try:
        # ── Keep-alive loop ──────────────────────────────────────────────────
        # We also listen for any client messages (future expansion)
        while True:
            try:
                raw = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                data = json.loads(raw)
                # clients can send a "ping" to keep the connection alive
                if data.get("event") == "ping":
                    await websocket.send_text(json.dumps({"event": "pong"}))
            except asyncio.TimeoutError:
                # Server-side ping to detect stale connections
                await websocket.send_text(json.dumps({"event": "ping"}))
    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(project_id, websocket)
        await manager.broadcast(project_id, {
            "event":   "user_left",
            "user_id": str(user.id),
        })
