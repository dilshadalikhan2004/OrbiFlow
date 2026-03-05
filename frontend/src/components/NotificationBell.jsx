import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { api } from '../api';

const TYPE_COLORS = {
    task_assigned: { dot: '#3b82f6', label: 'Assignment' },
    task_done: { dot: '#22c55e', label: 'Completed' },
    org_invite: { dot: '#a855f7', label: 'Invite' },
    general: { dot: '#6b7280', label: 'Notice' },
};

const NotificationBell = () => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef(null);

    // ── Fetch unread count (lightweight poll) ─────────────────────────────────
    const fetchCount = useCallback(async () => {
        try {
            const res = await api.getUnreadCount();
            setUnreadCount(res?.count ?? 0);
        } catch {/* silent */ }
    }, []);

    // ── Fetch full list when panel opens ──────────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getNotifications();
            setNotifications(data || []);
            setUnreadCount((data || []).filter(n => !n.read).length);
        } catch {/* silent */ } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 30_000); // poll every 30s
        return () => clearInterval(interval);
    }, [fetchCount]);

    useEffect(() => {
        if (open) fetchNotifications();
    }, [open, fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleMarkRead = async (id) => {
        try {
            await api.markNotificationRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(c => Math.max(0, c - 1));
        } catch {/* silent */ }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.markAllRead();
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch {/* silent */ }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        try {
            await api.deleteNotification(id);
            const deleted = notifications.find(n => n.id === id);
            setNotifications(notifications.filter(n => n.id !== id));
            if (deleted && !deleted.read) setUnreadCount(c => Math.max(0, c - 1));
        } catch {/* silent */ }
    };

    const timeAgo = (dt) => {
        const diff = Date.now() - new Date(dt).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1) return 'just now';
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    };

    return (
        <div style={{ position: 'relative' }} ref={panelRef}>
            {/* Bell button */}
            <button
                id="notification-bell"
                onClick={() => setOpen(v => !v)}
                style={{
                    position: 'relative', background: 'transparent', border: 'none',
                    color: open ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer', padding: '0.5rem', borderRadius: '50%',
                    transition: 'color 0.2s'
                }}
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: 4, right: 4,
                        minWidth: 16, height: 16, borderRadius: '99px',
                        background: '#ef4444', color: '#fff',
                        fontSize: '0.65rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 3px', lineHeight: 1,
                        border: '2px solid var(--bg-main)'
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div
                    className="fade-in"
                    style={{
                        position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                        width: 360, maxHeight: 480,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
                        zIndex: 1000, overflow: 'hidden',
                        display: 'flex', flexDirection: 'column'
                    }}
                >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Bell size={16} style={{ color: 'var(--brand-primary)' }} />
                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Notifications</span>
                            {unreadCount > 0 && (
                                <span style={{ background: 'var(--brand-primary)', color: '#fff', borderRadius: '99px', padding: '0.05rem 0.5rem', fontSize: '0.7rem', fontWeight: 700 }}>
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    title="Mark all read"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 500 }}
                                >
                                    <CheckCheck size={14} /> All Read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                                <Bell size={32} style={{ color: 'var(--text-tertiary)', marginBottom: '0.75rem', opacity: 0.4 }} />
                                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>You're all caught up!</p>
                            </div>
                        ) : (
                            notifications.map((n, i) => {
                                const tc = TYPE_COLORS[n.type] || TYPE_COLORS.general;
                                return (
                                    <div
                                        key={n.id}
                                        onClick={() => !n.read && handleMarkRead(n.id)}
                                        style={{
                                            display: 'flex', gap: '0.875rem', alignItems: 'flex-start',
                                            padding: '0.875rem 1.25rem',
                                            borderBottom: i < notifications.length - 1 ? '1px solid var(--border-light)' : 'none',
                                            background: n.read ? 'transparent' : 'rgba(99,102,241,0.04)',
                                            cursor: n.read ? 'default' : 'pointer',
                                            transition: 'background 0.15s'
                                        }}
                                    >
                                        {/* Dot */}
                                        <div style={{ marginTop: 4, flexShrink: 0, width: 8, height: 8, borderRadius: '50%', background: n.read ? 'var(--bg-subtle)' : tc.dot }} />

                                        {/* Content */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: '0.83rem', color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: 1.45, marginBottom: '0.2rem' }}>
                                                {n.message}
                                            </p>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.7rem', padding: '0.05rem 0.45rem', borderRadius: '99px', background: 'var(--bg-subtle)', color: 'var(--text-tertiary)' }}>
                                                    {tc.label}
                                                </span>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{timeAgo(n.created_at)}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                                            {!n.read && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); handleMarkRead(n.id); }}
                                                    title="Mark as read"
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-primary)', padding: '0.25rem' }}
                                                >
                                                    <Check size={13} />
                                                </button>
                                            )}
                                            <button
                                                onClick={e => handleDelete(n.id, e)}
                                                title="Delete"
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '0.25rem' }}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
