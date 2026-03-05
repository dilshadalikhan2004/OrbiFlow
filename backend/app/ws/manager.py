"""
WebSocket Connection Manager
Manages per-project rooms and broadcasts JSON events to all connected clients.
"""
import asyncio
import json
from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # project_id (str) -> list of active WebSocket connections
        self._rooms: Dict[str, List[WebSocket]] = {}
        self._lock = None
        self._loop = None

    @property
    def lock(self):
        if self._lock is None:
            self._lock = asyncio.Lock()
        return self._lock

    def sync_broadcast(self, project_id: str, payload: dict):
        """Thread-safe way to broadcast from synchronous code."""
        if not self._rooms.get(project_id):
            return
        if self._loop is not None:
            asyncio.run_coroutine_threadsafe(self.broadcast(project_id, payload), self._loop)


    async def connect(self, project_id: str, websocket: WebSocket):
        await websocket.accept()
        async with self.lock:
            self._rooms.setdefault(project_id, []).append(websocket)

    async def disconnect(self, project_id: str, websocket: WebSocket):
        async with self.lock:
            room = self._rooms.get(project_id, [])
            if websocket in room:
                room.remove(websocket)
            if not room:
                self._rooms.pop(project_id, None)

    async def broadcast(self, project_id: str, payload: dict):
        """Send JSON payload to every client in the project room."""
        data = json.dumps(payload)
        room = list(self._rooms.get(project_id, []))   # snapshot to avoid race
        dead: list[WebSocket] = []
        for ws in room:
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)
        # prune dead connections
        for ws in dead:
            await self.disconnect(project_id, ws)

    def client_count(self, project_id: str) -> int:
        return len(self._rooms.get(project_id, []))


# Singleton shared across the app
manager = ConnectionManager()
