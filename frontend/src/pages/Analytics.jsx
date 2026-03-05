import React, { useState } from 'react';
import { BarChart3, TrendingUp, PieChart as PieIcon, ArrowUpRight, ArrowDownRight, Filter, Download } from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart, Bar,
    XAxis, YAxis, Tooltip,
    PieChart, Pie, Cell,
    LineChart, Line, CartesianGrid
} from 'recharts';

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
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                color: isUp ? 'var(--success)' : 'var(--error)',
                backgroundColor: isUp ? 'var(--success-bg)' : 'var(--error-bg)',
                padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: '800'
            }}>
                {isUp ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
                {change}
            </div>
        </div>
        <div style={{ height: '4px', width: '40%', background: isUp ? 'var(--success)' : 'var(--error)', borderRadius: '2px', opacity: 0.3 }} />
    </div>
);

const Analytics = () => {
    const [timeRange, setTimeRange] = useState('7d');

    const data = [
        { name: 'Jan', value: 400 },
        { name: 'Feb', value: 300 },
        { name: 'Mar', value: 600 },
        { name: 'Apr', value: 800 },
        { name: 'May', value: 500 },
        { name: 'Jun', value: 700 },
    ];

    const pieData = [
        { name: 'Success', value: 65 },
        { name: 'Pending', value: 25 },
        { name: 'Failed', value: 10 },
    ];

    const COLORS = ['var(--brand-primary)', 'var(--warning)', 'var(--error)'];

    return (
        <div className="fade-in" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div className="page-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.4rem', letterSpacing: '-0.025em' }}>Analytics</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Deep dive into your project performance metrics.</p>
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
                <StatCard title="Total Revenue" value="$45,231" change="+12.5%" isUp={true} />
                <StatCard title="Active Users" value="2,420" change="+18.2%" isUp={true} />
                <StatCard title="Task Velocity" value="14.2" change="-3.1%" isUp={false} />
                <StatCard title="Completion Rate" value="94.5%" change="+2.4%" isUp={true} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="card" style={{ padding: '2rem', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)' }}>Growth Overview</h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '6px', background: 'var(--brand-primary-subtle)', color: 'var(--brand-primary)', fontWeight: '700' }}>Monthly</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={data}>
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
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid var(--border-light)' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: '800', alignSelf: 'flex-start', marginBottom: '2rem', color: 'var(--text-primary)' }}>Project Distribution</h3>
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
                            <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>100%</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: '600' }}>TOTAL</div>
                        </div>
                    </div>
                    <div style={{ width: '100%', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {pieData.map((d, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', borderRadius: '10px', background: 'var(--bg-subtle)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ width: 12, height: 12, borderRadius: '4px', backgroundColor: COLORS[i] }} />
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{d.name}</span>
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>{d.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
