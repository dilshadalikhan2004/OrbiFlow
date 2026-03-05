import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { useWorkspace } from '../context/WorkspaceContext';
import {
    Plus,
    ArrowUpRight,
    Video,
    Pause,
    Square,
    CheckCircle,
    Layout,
    Activity,
    Smartphone,
    Monitor,
    Shield,
    X,
    Users,
    ClipboardList,
    Clock,
    History,
    MessageSquare,
    UserPlus,
    Calendar as CalendarIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    ResponsiveContainer,
    BarChart, Bar,
    XAxis, YAxis, Tooltip,
    Cell,
} from 'recharts';
import EmptyState from '../components/EmptyState';

// Specific Prompt Colors
const PRIMARY = '#22A06B';
const ACCENT = '#10B981';

const KPICard = ({ title, value, sub, isPrimary = false, icon: Icon = ArrowUpRight, trend = 'up' }) => (
    <div style={{
        background: isPrimary ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))' : 'var(--bg-card)',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: isPrimary ? 'none' : '1px solid var(--border-light)',
        color: isPrimary ? 'white' : 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        boxShadow: isPrimary ? '0 10px 25px -5px var(--brand-primary-subtle)' : 'var(--shadow-sm)',
        transition: 'var(--transition)'
    }} className="hover-effect">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{
                width: 32, height: 32, borderRadius: '8px',
                backgroundColor: isPrimary ? 'rgba(255,255,255,0.2)' : 'var(--brand-primary-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isPrimary ? 'white' : 'var(--brand-primary)'
            }}>
                <Icon size={16} />
            </div>
            {sub && (
                <span style={{
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isPrimary ? 'rgba(255,255,255,0.15)' : 'var(--bg-subtle)',
                    color: isPrimary ? 'white' : 'var(--text-secondary)'
                }}>
                    {trend === 'up' ? '↑' : '↓'} {sub}
                </span>
            )}
        </div>
        <div style={{ marginTop: '0.5rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em' }}>{value}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: '500', opacity: 0.8 }}>{title}</div>
        </div>
    </div>
);

const ActivityItem = ({ log }) => {
    const getIcon = (action) => {
        if (action.includes('task')) return <ClipboardList size={14} />;
        if (action.includes('project')) return <Layout size={14} />;
        if (action.includes('comment')) return <MessageSquare size={14} />;
        if (action.includes('member') || action.includes('invite')) return <UserPlus size={14} />;
        return <Activity size={14} />;
    };

    return (
        <div style={{
            display: 'flex',
            gap: '1rem',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            backgroundColor: 'var(--bg-card)',
            transition: 'var(--transition)'
        }}>
            <div style={{
                width: 36, height: 36, borderRadius: '50%',
                backgroundColor: 'var(--brand-primary-subtle)',
                color: 'var(--brand-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
            }}>
                {getIcon(log.action)}
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                        <span style={{ color: 'var(--brand-primary)' }}>{log.user?.name || log.user?.email || 'System'}</span> {log.details || log.action}
                    </p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {new Date(log.created_at).toLocaleDateString()}
                </p>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const { activeWorkspaceId } = useWorkspace();
    const navigate = useNavigate();

    const [analytics, setAnalytics] = useState(null);
    const [team, setTeam] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [inviteStatus, setInviteStatus] = useState(null);

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail || !activeWorkspaceId) return;
        setInviting(true);
        try {
            await api.inviteMember(activeWorkspaceId, { email: inviteEmail, role: 'member' });
            setInviteStatus({ type: 'success', message: 'Invite sent successfully!' });
            setInviteEmail('');
            setTimeout(() => {
                setShowInviteModal(false);
                setInviteStatus(null);
            }, 2000);
        } catch (err) {
            setInviteStatus({ type: 'error', message: err.message || 'Failed to send invite' });
        } finally {
            setInviting(false);
        }
    };

    useEffect(() => {
        const fetchAll = async () => {
            if (!activeWorkspaceId) {
                setLoading(false);
                return;
            }
            try {
                const [anData, teamData, activityData] = await Promise.all([
                    api.getAnalytics(activeWorkspaceId),
                    api.getOrganizationMembers(activeWorkspaceId),
                    api.getActivity(activeWorkspaceId)
                ]);
                setAnalytics(anData);
                setTeam(teamData);
                setActivities(activityData || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [activeWorkspaceId]);

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px', color: 'var(--text-tertiary)', fontFamily: 'Plus Jakarta Sans' }}>Loading dashboard...</div>;

    const an = analytics || {};
    const analyticsData = an.last_7_days_activity || [];
    const completionRate = an.total_tasks > 0 ? Math.round((an.completed_tasks / an.total_tasks) * 100) : 0;

    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

            {/* Welcome Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.4rem', letterSpacing: '-0.025em' }}>
                        Welcome back, {user?.name.split(' ')[0]}! 👋
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Here's what's happening in your workspace today.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary" onClick={() => navigate('/projects')}>
                        <Layout size={18} /> Projects
                    </button>
                    <button className="btn" onClick={() => navigate('/tasks')}>
                        <Plus size={18} /> New Task
                    </button>
                </div>
            </div>

            {/* 1. KPI Cards */}
            <div className="grid grid-cols-4" style={{ gap: '1.25rem' }}>
                <KPICard
                    title="Active Projects"
                    value={an.total_projects || 0}
                    icon={Layout}
                    isPrimary={true}
                />
                <KPICard
                    title="Tasks Today"
                    value={an.tasks_today || 0}
                    sub="Due today"
                    icon={ClipboardList}
                    trend={an.tasks_today > 0 ? 'up' : 'down'}
                />
                <KPICard
                    title="Approaching Deadlines"
                    value={an.upcoming_deadlines?.length || 0}
                    sub="Next 48h"
                    icon={Clock}
                    trend="up"
                />
                <KPICard
                    title="Task Completion"
                    value={`${completionRate}%`}
                    sub="Avg speed"
                    icon={CheckCircle}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>

                {/* Left Column: Activity & Charts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Activity Feed */}
                    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <History size={20} color="var(--brand-primary)" /> Recent Activity
                            </h3>
                            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => navigate('/analytics')}>
                                View History
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {activities.length > 0 ? (
                                activities.slice(0, 5).map((log, i) => (
                                    <ActivityItem key={i} log={log} />
                                ))
                            ) : (
                                <EmptyState
                                    icon={Activity}
                                    title="No activity yet"
                                    description="Start working on tasks to see the activity feed come to life."
                                    compact={true}
                                />
                            )}
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '1.5rem' }}>Weekly Productivity</h3>
                        {analyticsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={analyticsData}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} dy={10} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)' }} />
                                    <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={32}>
                                        {analyticsData.map((entry, index) => (
                                            <Cell key={index} fill={entry.value > 0 ? 'var(--brand-primary)' : 'var(--bg-subtle)'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                                Not enough data for chart
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Deadlines & Team */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Deadlines Section */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CalendarIcon size={18} color="var(--warning)" /> Upcoming Deadlines
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {an.upcoming_deadlines?.length > 0 ? (
                                an.upcoming_deadlines.slice(0, 3).map((t, i) => (
                                    <div key={i} style={{ padding: '0.8rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
                                        <p style={{ fontWeight: '700', fontSize: '0.85rem' }}>{t.title}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--error)', fontWeight: '600' }}>
                                                {new Date(t.deadline).toLocaleDateString()}
                                            </span>
                                            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--bg-card)', color: 'var(--text-tertiary)' }}>
                                                {t.project_name}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    icon={Clock}
                                    title="All clear"
                                    description="No deadlines approaching in the next few days."
                                    compact={true}
                                />
                            )}
                        </div>
                    </div>

                    {/* Team Section */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '800' }}>Team</h3>
                            <button onClick={() => setShowInviteModal(true)} style={{ color: 'var(--brand-primary)', background: 'none', border: 'none', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}>
                                + Invite
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {team.length > 0 ? (
                                team.slice(0, 5).map((m, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div className="avatar" style={{ width: 32, height: 32, borderRadius: '50%', fontSize: '0.75rem' }}>
                                            {(m.user.name || m.user.email).charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: '700', fontSize: '0.85rem' }}>{m.user.name || 'Member'}</p>
                                            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>{m.role}</p>
                                        </div>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    icon={Users}
                                    title="No team members"
                                    description="Invite colleagues to collaborate on projects."
                                    actionLabel="Invite Member"
                                    onAction={() => setShowInviteModal(true)}
                                    compact={true}
                                />
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowInviteModal(false)}>
                    <div className="modal-content card fade-in" style={{ maxWidth: '450px', padding: '0' }}>
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Invite Team Member</h3>
                            <button onClick={() => setShowInviteModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleInvite} style={{ padding: '2rem' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email Address</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="colleague@example.com"
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>
                            {inviteStatus && (
                                <div style={{
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    marginBottom: '1.5rem',
                                    fontSize: '0.875rem',
                                    backgroundColor: inviteStatus.type === 'success' ? 'var(--success-bg)' : 'var(--error-bg)',
                                    color: inviteStatus.type === 'success' ? 'var(--success)' : 'var(--error)',
                                    border: `1px solid ${inviteStatus.type === 'success' ? 'var(--success)' : 'var(--error)'}`,
                                    fontWeight: '500'
                                }}>
                                    {inviteStatus.message}
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>Cancel</button>
                                <button type="submit" className="btn" disabled={inviting}>
                                    {inviting ? 'Sending...' : 'Send Invitation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
