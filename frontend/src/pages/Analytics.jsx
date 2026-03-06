import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';
import {
    ResponsiveContainer,
    LineChart, Line, CartesianGrid,
    XAxis, YAxis, Tooltip,
    PieChart, Pie, Cell
} from 'recharts';
import { api } from '../api';
import { useWorkspace } from '../context/WorkspaceContext';

const StatCard = ({ title, value, change, isUp }) => (
    <div className="card hover-effect" style={{
        padding: '1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-sm)'
    }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>{title}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{value}</h3>
            {change && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                    color: isUp ? 'var(--success)' : 'var(--error)',
                    backgroundColor: isUp ? 'var(--success-bg)' : 'var(--error-bg)',
                    padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: '800'
                }}>
                    {isUp ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
                    {change}
                </div>
            )}
        </div>
        <div style={{ height: '4px', width: '40%', background: isUp ? 'var(--success)' : 'var(--error)', borderRadius: '2px', opacity: 0.3 }} />
    </div>
);

const Analytics = () => {
    const { activeWorkspaceId } = useWorkspace();
    const [timeRange, setTimeRange] = useState('7d');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!activeWorkspaceId) return;
            setLoading(true);
            try {
                const data = await api.getAnalytics(activeWorkspaceId);
                setStats(data);
            } catch (error) {
                console.error("Failed to load analytics: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [activeWorkspaceId]);

    const COLORS = ['var(--brand-primary)', 'var(--warning)', 'var(--error)'];

    if (loading || !stats) {
        return (
            <div className="fade-in" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <div className="page-header" style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: '800' }}>Analytics</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading your dashboard data...</p>
                </div>
            </div>
        );
    }

    // Prepare line chart data (from right to left in backend, let's just reverse or use as is)
    // Server sends oldest to newest if we mapped it right, or newest to oldest.
    // The server code appends `6` down to `0` meaning older to newer. So it's chronologically correct.
    const lineData = stats.tasks_per_day.map(d => ({
        name: d.date,
        value: d.created + d.completed // Just visualizing total activity
    }));

    // Prepare Pie Chart data (Task Status)
    const pieData = [
        { name: 'Completed', value: stats.completed_tasks },
        { name: 'In Progress', value: stats.in_progress_tasks },
        { name: 'Pending', value: stats.pending_tasks },
    ].filter(d => d.value > 0); // Hide empty slices

    const totalPieValue = pieData.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="fade-in" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div className="page-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.4rem', letterSpacing: '-0.025em' }}>Analytics</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Deep dive into your workspace's actual performance metrics.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.35rem', borderRadius: '12px' }}>
                        {['7d', '30d', '6m'].map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontSize: '0.8rem',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    backgroundColor: timeRange === range ? 'var(--bg-card)' : 'transparent',
                                    color: timeRange === range ? 'var(--brand-primary)' : 'var(--text-tertiary)',
                                    boxShadow: timeRange === range ? 'var(--shadow-sm)' : 'none',
                                    transition: 'var(--transition)'
                                }}
                            >
                                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '6 Months'}
                            </button>
                        ))}
                    </div>
                    <button className="btn btn-secondary">
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <StatCard
                    title="Active Projects"
                    value={stats.active_projects}
                    change=""
                    isUp={true}
                />
                <StatCard
                    title="Total Tasks"
                    value={stats.total_tasks}
                    change={`+${stats.tasks_this_week} this week`}
                    isUp={true}
                />
                <StatCard
                    title="Tasks Completed"
                    value={stats.completed_tasks}
                    change={`+${stats.completed_this_week} this week`}
                    isUp={true}
                />
                <StatCard
                    title="Avg. Completion Time"
                    value={`${stats.avg_completion_time} Days`}
                    change={stats.avg_completion_time > 0 ? "" : "0%"}
                    isUp={stats.avg_completion_time < 5}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="card" style={{ padding: '2rem', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)' }}>Workspace Activity (7 Days)</h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '6px', background: 'var(--brand-primary-subtle)', color: 'var(--brand-primary)', fontWeight: '700' }}>Tasks Created/Completed</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={lineData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 13, fontWeight: 500 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 13, fontWeight: 500 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)', color: 'var(--text-primary)' }}
                                itemStyle={{ fontWeight: 700, color: 'var(--brand-primary)' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="var(--brand-primary)"
                                strokeWidth={4}
                                dot={{ r: 6, fill: 'var(--brand-primary)', strokeWidth: 0 }}
                                activeDot={{ r: 8, strokeWidth: 2, stroke: 'white' }}
                                name="Activity"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid var(--border-light)' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', alignSelf: 'flex-start', marginBottom: '2rem', color: 'var(--text-primary)' }}>Task Distribution</h3>

                    {totalPieValue === 0 ? (
                        <div style={{ padding: '4rem 0', color: 'var(--text-tertiary)', fontSize: '0.9rem', textAlign: 'center' }}>
                            No tasks created yet.
                        </div>
                    ) : (
                        <>
                            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            innerRadius={75}
                                            outerRadius={100}
                                            paddingAngle={8}
                                            dataKey="value"
                                            cornerRadius={8}
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)', color: 'var(--text-primary)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>{totalPieValue}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>TOTAL TASKS</div>
                                </div>
                            </div>
                            <div style={{ width: '100%', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                {pieData.map((d, i) => {
                                    const percent = Math.round((d.value / totalPieValue) * 100);
                                    return (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '10px', background: 'var(--bg-subtle)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: 12, height: 12, borderRadius: '4px', backgroundColor: COLORS[i % COLORS.length] }} />
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{d.name}</span>
                                            </div>
                                            <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>{percent}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
