import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Plus, ListTodo, CalendarClock, CheckCircle, Search, MoreHorizontal, X, Filter, Wifi, WifiOff, Sparkles, User } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTaskWebSocket } from '../hooks/useTaskWebSocket';
import AITaskCreator from '../components/AITaskCreator';

const STATUSES = ['', 'todo', 'in_progress', 'done'];
const PRIORITIES = ['', 'low', 'medium', 'high', 'critical'];

const PRIORITY_COLORS = {
    low: { badge: 'var(--success)', bg: 'var(--success-bg)' },
    medium: { badge: 'var(--info)', bg: 'var(--info-bg)' },
    high: { badge: 'var(--warning)', bg: 'var(--warning-bg)' },
    critical: { badge: 'var(--error)', bg: 'var(--error-bg)' },
};

const kanbanCols = [
    { id: 'todo', title: 'To Do', icon: ListTodo, color: 'var(--warning)', bg: 'var(--bg-subtle)' },
    { id: 'in_progress', title: 'In Progress', icon: CalendarClock, color: 'var(--info)', bg: 'var(--bg-subtle)' },
    { id: 'done', title: 'Done', icon: CheckCircle, color: 'var(--success)', bg: 'var(--bg-subtle)' },
];

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [draggedTaskId, setDraggedTaskId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', project_id: '', assignee_id: '', priority: 'medium', deadline: '' });
    const [projectsList, setProjectsList] = useState([]);
    const [userList, setUserList] = useState([]);

    const location = useLocation();
    const navigate = useNavigate();

    // ─── Filter state (sent to backend) ───────────────────────────────────────
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterAssignee, setFilterAssignee] = useState('');
    const [filterProject, setFilterProject] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const query = params.get('search');
        if (query !== null) {
            setSearch(query);
            setSearchInput(query);

            // Re-sync URL so it doesn't get stuck if they clear local search
            navigate('/tasks', { replace: true });
        }
    }, [location.search, navigate]);

    const { user } = useAuth();
    const { activeWorkspaceId } = useWorkspace();

    // Active project for WS room — use filter project if set, else first in list
    const wsProjectId = useMemo(
        () => filterProject || (projectsList[0]?.id ?? null),
        [filterProject, projectsList]
    );

    // ─── Fetch data (re-runs when filter changes) ──────────────────────────────
    const fetchData = useCallback(async () => {
        if (!activeWorkspaceId) { setLoading(false); return; }
        setLoading(true);
        try {
            const filters = { orgId: activeWorkspaceId };
            if (search) filters.search = search;
            if (filterStatus) filters.status = filterStatus;
            if (filterPriority) filters.priority = filterPriority;
            if (filterAssignee) filters.assigneeId = filterAssignee;
            if (filterProject) filters.projectId = filterProject;

            const ts = await api.getTasks(filters);
            setTasks(ts);

            if (user.role !== 'employee') {
                const [ps, us] = await Promise.all([
                    api.getProjects(activeWorkspaceId),
                    api.getOrganizationMembers(activeWorkspaceId).catch(() => [])
                ]);
                setProjectsList(ps);
                setUserList((us || []).map(m => m.user).filter(Boolean));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [activeWorkspaceId, search, filterStatus, filterPriority, filterAssignee, filterProject, user]);

    useEffect(() => {
        if (activeWorkspaceId) {
            fetchData();
        } else {
            setTasks([]); setProjectsList([]); setUserList([]); setLoading(false);
        }
    }, [fetchData, activeWorkspaceId]);

    // ─── WebSocket real-time updates ──────────────────────────────────────────
    const { connected: wsConnected } = useTaskWebSocket(wsProjectId, {
        onTaskCreated: useCallback(() => {
            // Refetch so we get the full task+assignee object from backend
            fetchData();
        }, [fetchData]),

        onTaskMoved: useCallback(({ task_id, status }) => {
            setTasks(prev =>
                prev.map(t => t.id === task_id ? { ...t, status } : t)
            );
        }, []),

        onTaskUpdated: useCallback(({ task_id, title, priority, assignee_id }) => {
            setTasks(prev =>
                prev.map(t => t.id === task_id
                    ? { ...t, title: title ?? t.title, priority: priority ?? t.priority, assignee_id: assignee_id ?? t.assignee_id }
                    : t
                )
            );
        }, []),

        onTaskDeleted: useCallback(({ task_id }) => {
            setTasks(prev => prev.filter(t => t.id !== task_id));
        }, []),
    });

    // ─── Debounce search input ─────────────────────────────────────────────────
    useEffect(() => {
        const t = setTimeout(() => setSearch(searchInput), 350);
        return () => clearTimeout(t);
    }, [searchInput]);

    const clearFilters = () => {
        setSearchInput(''); setSearch(''); setFilterStatus('');
        setFilterPriority(''); setFilterAssignee(''); setFilterProject('');
    };
    const hasFilters = search || filterStatus || filterPriority || filterAssignee || filterProject;

    // ─── Drag & Drop ───────────────────────────────────────────────────────────
    const handleDragStart = (e, taskId) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDrop = async (e, status) => {
        e.preventDefault();
        if (!draggedTaskId) return;
        try {
            const task = tasks.find(t => t.id === draggedTaskId);
            if (task?.status === status) return;
            setTasks(tasks.map(t => t.id === draggedTaskId ? { ...t, status } : t));
            await api.updateTask(draggedTaskId, { status });
        } catch (err) {
            console.error('Failed to update task status', err);
            fetchData();
        }
        setDraggedTaskId(null);
    };

    const handleAssign = async (taskId, assigneeId) => {
        try {
            setTasks(tasks.map(t => t.id === taskId ? { ...t, assignee_id: assigneeId || null } : t));
            await api.updateTask(taskId, { assignee_id: assigneeId || null });
        } catch (err) {
            console.error('Failed to update assignee', err);
            fetchData();
        }
    };

    // ─── Create ────────────────────────────────────────────────────────────────
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.createTask({
                ...newTask,
                assignee_id: newTask.assignee_id || undefined,
                deadline: newTask.deadline || undefined,
            });
            setShowModal(false);
            setNewTask({ title: '', description: '', project_id: '', assignee_id: '', priority: 'medium', deadline: '' });
            fetchData();
        } catch (err) {
            console.error('Failed to create task', err);
        }
    };

    if (loading) return <div className="p-4 text-secondary fade-in">Loading workspace...</div>;

    return (
        <div className="fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

            {/* ── Page Header ── */}
            <div className="page-header" style={{ flexShrink: 0, borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem' }}>
                <div>
                    <h2>Workflow Board</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.25rem' }}>
                        <p className="text-secondary">Manage and assign tasks across different stages</p>
                        {wsProjectId && (
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '99px',
                                background: wsConnected ? 'var(--brand-primary-subtle)' : 'var(--bg-subtle)',
                                color: wsConnected ? 'var(--brand-primary)' : 'var(--text-tertiary)',
                                fontWeight: 600,
                                border: '1px solid var(--border-light)'
                            }}>
                                {wsConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
                                {wsConnected ? 'LIVE' : 'SYNCING…'}
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', top: '50%', left: '0.875rem', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            style={{ paddingLeft: '2.25rem', paddingRight: '0.875rem', width: '220px' }}
                        />
                    </div>

                    {/* Filter toggle */}
                    <button
                        className={`btn btn-secondary ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(v => !v)}
                        style={{ position: 'relative' }}
                    >
                        <Filter size={15} /> Filters
                        {hasFilters && (
                            <span style={{ position: 'absolute', top: -5, right: -5, width: 8, height: 8, borderRadius: '50%', background: 'var(--brand-primary)' }} />
                        )}
                    </button>

                    {hasFilters && (
                        <button className="btn btn-secondary" onClick={clearFilters} title="Clear all filters">
                            <X size={15} />
                        </button>
                    )}

                    {user.role !== 'employee' && (
                        <>
                            <button
                                className="btn"
                                onClick={() => setShowAIModal(true)}
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                                <Sparkles size={15} /> AI Create
                            </button>
                            <button className="btn" onClick={() => setShowModal(true)}>
                                <Plus size={16} /> New Task
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── Filter Row ── */}
            {showFilters && (
                <div className="fade-in" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', padding: '1rem 0', borderBottom: '1px solid var(--border-light)', marginBottom: '0.25rem' }}>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex: '1', minWidth: '130px' }}>
                        <option value="">All Statuses</option>
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                    </select>

                    <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ flex: '1', minWidth: '130px' }}>
                        <option value="">All Priorities</option>
                        {PRIORITIES.filter(Boolean).map(p => (
                            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                        ))}
                    </select>

                    {user.role !== 'employee' && (
                        <>
                            <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={{ flex: '1', minWidth: '160px' }}>
                                <option value="">All Assignees</option>
                                {userList.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                            </select>
                            <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ flex: '1', minWidth: '160px' }}>
                                <option value="">All Projects</option>
                                {projectsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </>
                    )}
                </div>
            )}

            {/* ── Board Layout or Empty State ── */}
            {tasks.length === 0 && !hasFilters ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EmptyState
                        icon={ListTodo}
                        title="No tasks here yet"
                        description="Create tasks to track your progress and collaborate with your team."
                        actionLabel="Create First Task"
                        onAction={() => setShowModal(true)}
                    />
                </div>
            ) : (
                <div className="kanban-board mt-4" style={{ flex: 1, overflowY: 'hidden' }}>
                    {kanbanCols.map(col => {
                        const colTasks = tasks.filter(t => t.status === col.id);
                        return (
                            <div
                                key={col.id}
                                className="kanban-column hover-effect"
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => handleDrop(e, col.id)}
                                style={{ border: draggedTaskId ? '1px dashed var(--border-light)' : '1px solid transparent' }}
                            >
                                {/* Column header */}
                                <div className="column-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: col.color }} />
                                        <span>{col.title}</span>
                                        <span className="badge badge-default" style={{ marginLeft: '0.2rem' }}>{colTasks.length}</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setNewTask({ ...newTask, status: col.id });
                                            setShowModal(true);
                                        }}
                                        style={{
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-light)',
                                            borderRadius: '6px',
                                            padding: '4px',
                                            cursor: 'pointer',
                                            color: 'var(--text-tertiary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        className="hover-bg-subtle"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                <div className="column-body pt-1">
                                    {colTasks.length === 0 ? (
                                        <div style={{ padding: '2rem 1rem', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
                                            No tasks in {col.title}
                                        </div>
                                    ) : colTasks.map(t => {
                                        const pColor = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.medium;
                                        return (
                                            <div
                                                key={t.id}
                                                className="kanban-task"
                                                draggable
                                                onDragStart={e => handleDragStart(e, t.id)}
                                                style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                                            >
                                                {/* Header: Priority + menu */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{
                                                        padding: '2px 8px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.65rem',
                                                        fontWeight: '800',
                                                        textTransform: 'uppercase',
                                                        backgroundColor: pColor.bg,
                                                        color: pColor.badge
                                                    }}>
                                                        {t.priority}
                                                    </span>
                                                    <button style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                                        <MoreHorizontal size={15} />
                                                    </button>
                                                </div>

                                                {/* Title */}
                                                <h4 className="task-title" style={{ marginBottom: 0, fontSize: '0.9rem', fontWeight: '700' }}>{t.title}</h4>

                                                {/* Description */}
                                                {t.description && (
                                                    <p className="text-secondary" style={{ fontSize: '0.75rem', WebkitLineClamp: 1, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {t.description}
                                                    </p>
                                                )}

                                                {/* Meta: Deadline + Project */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div
                                                            className="avatar"
                                                            title={t.assignee?.name || t.assignee?.email || 'Unassigned'}
                                                            style={{
                                                                width: 24,
                                                                height: 24,
                                                                fontSize: '0.6rem',
                                                                background: t.assignee ? 'var(--brand-primary)' : 'var(--bg-subtle)',
                                                                color: t.assignee ? '#fff' : 'var(--text-tertiary)',
                                                                border: t.assignee ? 'none' : '1px dashed var(--border-light)'
                                                            }}
                                                        >
                                                            {t.assignee ? (t.assignee.name || t.assignee.email).charAt(0).toUpperCase() : <User size={10} />}
                                                        </div>
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>
                                                            {t.deadline ? new Date(t.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'No date'}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'var(--bg-subtle)', borderRadius: '4px', color: 'var(--text-tertiary)' }}>
                                                        PRO-{t.id.slice(-4).toUpperCase()}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {user.role !== 'employee' && col.id === 'todo' && colTasks.length === 0 && (
                                        <button
                                            className="btn-secondary w-full"
                                            style={{ borderStyle: 'dashed', padding: '1rem', color: 'var(--text-tertiary)', backgroundColor: 'transparent', marginTop: '0.5rem' }}
                                            onClick={() => setShowModal(true)}
                                        >
                                            <Plus size={15} /> Add Task
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Create Task Modal ── */}
            {showModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal-content card fade-in" style={{ maxWidth: '580px', padding: '0' }}>
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Create New Task</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} style={{ padding: '2rem' }}>
                            <div className="form-group mb-4">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Task Title *</label>
                                <input
                                    type="text"
                                    value={newTask.title}
                                    placeholder="e.g. Design System Implementation"
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div className="form-group mb-4">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Description</label>
                                <textarea
                                    value={newTask.description}
                                    placeholder="Acceptance criteria or technical details..."
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                    rows={3}
                                    style={{ width: '100%', resize: 'none' }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="form-group mb-0">
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Project *</label>
                                    <select value={newTask.project_id} onChange={e => setNewTask({ ...newTask, project_id: e.target.value })} required style={{ width: '100%' }}>
                                        <option value="" disabled>Select project</option>
                                        {projectsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group mb-0">
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Priority</label>
                                    <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })} style={{ width: '100%' }}>
                                        {PRIORITIES.filter(Boolean).map(p => (
                                            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="form-group mb-0">
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Assignee</label>
                                    <select value={newTask.assignee_id} onChange={e => setNewTask({ ...newTask, assignee_id: e.target.value })} style={{ width: '100%' }}>
                                        <option value="">Unassigned</option>
                                        {userList.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
                                    </select>
                                </div>
                                <div className="form-group mb-0">
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Due Date</label>
                                    <input type="date" value={newTask.deadline} onChange={e => setNewTask({ ...newTask, deadline: e.target.value })} style={{ width: '100%' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn" style={{ padding: '0.75rem 2rem' }}>Create Task</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Task Creator Modal */}
            {showAIModal && (
                <AITaskCreator
                    projects={projectsList}
                    onTaskCreated={() => { fetchData(); setShowAIModal(false); }}
                    onClose={() => setShowAIModal(false)}
                />
            )}
        </div>
    );
};

export default Tasks;
