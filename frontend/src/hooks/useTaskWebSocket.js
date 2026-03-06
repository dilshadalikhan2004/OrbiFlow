/**
 * useTaskWebSocket
 *
 * Connects to /ws/projects/{projectId}?token=<jwt>
 * and dispatches real-time task events to the board.
 *
 * Returns { connected }
 *
 * Usage:
 *   useTaskWebSocket(projectId, { onTaskCreated, onTaskUpdated, onTaskMoved, onTaskDeleted })
 */
import { useEffect, useRef, useState, useCallback } from 'react';

// Use explicit env var, or derive from VITE_API_URL, or fallback to localhost
const WS_BASE = import.meta.env.VITE_WS_URL ||
    (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('http', 'ws').replace('/api/v1', '') : 'ws://localhost:8000');

const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECTS = 10;

export function useTaskWebSocket(projectId, handlers = {}) {
    const wsRef = useRef(null);
    const reconnects = useRef(0);
    const timerRef = useRef(null);
    const [connected, setConnected] = useState(false);

    const connect = useCallback(function performConnect() {
        if (!projectId) return;

        const token = localStorage.getItem('token');
        if (!token) return;

        const url = `${WS_BASE}/ws/projects/${projectId}?token=${token}`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            reconnects.current = 0;
        };

        ws.onclose = () => {
            setConnected(false);
            if (reconnects.current < MAX_RECONNECTS) {
                reconnects.current += 1;
                timerRef.current = setTimeout(performConnect, RECONNECT_DELAY_MS);
            }
        };

        ws.onerror = () => {
            ws.close();
        };

        ws.onmessage = (e) => {
            let data;
            try { data = JSON.parse(e.data); }
            catch { return; }

            const { event, task_id, status, title, priority, assignee_id } = data;

            switch (event) {
                case 'task_created':
                    handlers.onTaskCreated?.(data);
                    break;
                case 'task_updated':
                    handlers.onTaskUpdated?.({ task_id, title, priority, assignee_id });
                    break;
                case 'task_moved':
                    handlers.onTaskMoved?.({ task_id, status });
                    break;
                case 'task_deleted':
                    handlers.onTaskDeleted?.({ task_id });
                    break;
                case 'ping':
                    ws.send(JSON.stringify({ event: 'ping' }));
                    break;
                default:
                    break;
            }
        };
    }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        connect();
        return () => {
            clearTimeout(timerRef.current);
            wsRef.current?.close();
        };
    }, [connect]);

    return { connected };
}
