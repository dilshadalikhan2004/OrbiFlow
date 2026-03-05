import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date(2024, 11, 1)); // Dec 2024
    const [showAddModal, setShowAddModal] = useState(false);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const monthYear = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const changeMonth = (offset) => {
        const next = new Date(currentDate);
        next.setMonth(next.getMonth() + offset);
        setCurrentDate(next);
    };

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const startPadding = Array.from({ length: firstDayOfMonth }, (_, i) => null);

    return (
        <div className="fade-in" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.4rem', letterSpacing: '-0.025em' }}>Calendar</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Organize your schedule and project deadlines.</p>
                </div>
                <button className="btn"
                    onClick={() => setShowAddModal(true)}
                    style={{
                        background: 'linear-gradient(to bottom right, var(--brand-primary), var(--brand-accent))',
                        color: 'white', border: 'none', padding: '0.8rem 1.75rem',
                        display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: '700',
                        borderRadius: 'var(--radius-full)', boxShadow: '0 4px 12px rgba(34, 160, 107, 0.25)'
                    }}
                >
                    <Plus size={18} strokeWidth={3} /> Add Event
                </button>
            </div>

            <div className="card" style={{ padding: '2rem', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{monthYear}</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '0.35rem', borderRadius: '12px' }}>
                            <button
                                onClick={() => changeMonth(-1)}
                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => changeMonth(1)}
                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>Today</button>
                        <select style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                            <option>Month View</option>
                            <option>Week View</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: 'var(--border-light)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                        {days.map(day => (
                            <div key={day} style={{ backgroundColor: 'var(--bg-subtle)', padding: '1.25rem 1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {day}
                            </div>
                        ))}
                        {startPadding.map((_, i) => (
                            <div key={`pad-${i}`} style={{ backgroundColor: 'rgba(0,0,0,0.02)', minHeight: '110px', border: '0.5px solid var(--border-light)' }} />
                        ))}
                        {dates.map(date => {
                            const isDec2024 = currentDate.getMonth() === 11 && currentDate.getFullYear() === 2024;
                            const isToday = isDec2024 && date === 12;
                            return (
                                <div key={date} style={{
                                    backgroundColor: isToday ? 'var(--brand-primary-subtle)' : 'var(--bg-card)',
                                    minHeight: '110px',
                                    padding: '0.75rem',
                                    position: 'relative',
                                    border: '0.5px solid var(--border-light)',
                                    transition: 'var(--transition)'
                                }} className="calendar-day">
                                    <span style={{
                                        fontSize: '0.85rem',
                                        fontWeight: '700',
                                        color: isToday ? 'var(--brand-primary)' : 'var(--text-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        backgroundColor: isToday ? 'rgba(34, 160, 107, 0.1)' : 'transparent',
                                        marginBottom: '0.25rem'
                                    }}>{date}</span>
                                    {isDec2024 && date === 12 && (
                                        <div style={{
                                            marginTop: '0.25rem', backgroundColor: 'var(--brand-primary)',
                                            color: 'white', padding: '0.3rem 0.5rem',
                                            borderRadius: '6px', fontSize: '0.65rem', fontWeight: '700',
                                            boxShadow: '0 4px 10px var(--brand-primary-subtle)',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                        }}>
                                            API Workshop
                                        </div>
                                    )}
                                    {isDec2024 && date === 16 && (
                                        <div style={{
                                            marginTop: '0.25rem', backgroundColor: 'var(--info-bg)',
                                            color: 'var(--info)', padding: '0.3rem 0.5rem',
                                            borderRadius: '6px', fontSize: '0.65rem', fontWeight: '700',
                                            borderLeft: '3px solid var(--info)',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                        }}>
                                            Client Meeting
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Agenda View Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '2px', backgroundColor: 'var(--brand-primary)' }} />
                            Agenda
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--brand-primary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Today, 12 Dec</p>
                                <h5 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.25rem' }}>API Workshop</h5>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>10:00 AM - 11:30 AM</p>
                            </div>
                            <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Mon, 16 Dec</p>
                                <h5 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.25rem' }}>Client Meeting</h5>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>02:00 PM - 03:00 PM</p>
                            </div>
                            <div style={{
                                padding: '2rem 1rem',
                                textAlign: 'center',
                                borderRadius: '12px',
                                border: '1px dashed var(--border-light)',
                                color: 'var(--text-tertiary)',
                                fontSize: '0.8rem'
                            }}>
                                No more events scheduled for this week.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showAddModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
                    <div className="modal-content card fade-in" style={{ maxWidth: '450px', padding: '0' }}>
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Add Calendar Event</h3>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); }} style={{ padding: '2rem' }}>
                            <div className="form-group mb-4">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Event Title</label>
                                <input type="text" placeholder="e.g. Design Review" required style={{ width: '100%' }} />
                            </div>
                            <div className="form-group mb-6">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Event Date</label>
                                <input type="date" required style={{ width: '100%' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn" style={{ padding: '0.75rem 2rem' }}>Add Event</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
