import React, { useState } from 'react';
import { api } from '../api';
import {
    Sparkles, Send, Loader2, X, Calendar, Flag, User,
    FileText, CheckCircle2, ArrowRight, Wand2, AlertCircle
} from 'lucide-react';

const PRIORITY_CONFIG = {
    low: { label: 'Low', color: 'var(--success)', bg: 'var(--success-bg)' },
    medium: { label: 'Medium', color: 'var(--info)', bg: 'var(--info-bg)' },
    high: { label: 'High', color: 'var(--warning)', bg: 'var(--warning-bg)' },
    critical: { label: 'Critical', color: 'var(--error)', bg: 'var(--error-bg)' },
};

const AITaskCreator = ({ projects = [], onTaskCreated, onClose }) => {
    const [prompt, setPrompt] = useState('');
    const [parsed, setParsed] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);
    const [step, setStep] = useState('input'); // input | preview | done

    // Editable fields (after AI extraction)
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [dueDate, setDueDate] = useState('');
    const [projectId, setProjectId] = useState('');

    // ── Parse ────────────────────────────────────────────────────────────
    const handleParse = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError('');
        try {
            const result = await api.parseTask(prompt);
            setParsed(result);
            setTitle(result.title || '');
            setDescription(result.description || '');
            setPriority(result.priority || 'medium');
            setDueDate(result.due_date || '');
            setStep('preview');
        } catch (err) {
            setError(err.message || 'Failed to parse task');
        } finally {
            setLoading(false);
        }
    };

    // ── Create ───────────────────────────────────────────────────────────
    const handleCreate = async () => {
        if (!title.trim() || !projectId) return;
        setCreating(true);
        try {
            await api.createTask({
                title,
                description,
                priority,
                deadline: dueDate || undefined,
                project_id: projectId,
            });
            setStep('done');
            setTimeout(() => {
                onTaskCreated?.();
                onClose?.();
            }, 1500);
        } catch (err) {
            setError(err.message || 'Failed to create task');
        } finally {
            setCreating(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && step === 'input') {
            e.preventDefault();
            handleParse();
        }
    };

    const prio = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;

    const examples = [
        'Build authentication system by Friday, high priority',
        'Fix login bug tomorrow, assign to Dilshad',
        'Design landing page next week, low priority',
        'Set up CI/CD pipeline, critical, in 3 days',
    ];

    return (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()} style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease',
        }}>
            <div style={{
                background: 'var(--bg-card)', borderRadius: 16,
                width: '100%', maxWidth: 580, maxHeight: '90vh',
                boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                animation: 'slideUp 0.3s ease',
            }}>

                {/* ── Header ── */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--border-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Sparkles size={18} color="white" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>AI Task Creator</h3>
                            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                {parsed?.source === 'gemini' ? '✨ Powered by Gemini' : 'Describe your task in plain English'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-tertiary)', padding: '0.25rem',
                    }}>
                        <X size={18} />
                    </button>
                </div>

                {/* ── Body ── */}
                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>

                    {/* Step: INPUT */}
                    {step === 'input' && (
                        <>
                            <div style={{ position: 'relative' }}>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder='e.g. "Build authentication system by Friday, high priority, assign to Dilshad"'
                                    rows={3}
                                    style={{
                                        width: '100%', resize: 'none',
                                        padding: '0.875rem 3rem 0.875rem 1rem',
                                        borderRadius: 12, fontSize: '0.9rem',
                                        border: '2px solid var(--border-light)',
                                        background: 'var(--bg-subtle)',
                                        color: 'var(--text-primary)',
                                        transition: 'border-color 0.2s',
                                        outline: 'none',
                                        fontFamily: 'inherit',
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                                />
                                <button
                                    onClick={handleParse}
                                    disabled={loading || !prompt.trim()}
                                    style={{
                                        position: 'absolute', right: 12, bottom: 12,
                                        width: 36, height: 36, borderRadius: 10,
                                        background: prompt.trim() ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))' : 'var(--border-light)',
                                        border: 'none', cursor: prompt.trim() ? 'pointer' : 'not-allowed',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {loading
                                        ? <Loader2 size={16} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                                        : <Send size={16} color={prompt.trim() ? 'white' : 'var(--text-tertiary)'} />
                                    }
                                </button>
                            </div>

                            {/* Example prompts */}
                            <div style={{ marginTop: '1.25rem' }}>
                                <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Try an example
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {examples.map((ex, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setPrompt(ex)}
                                            style={{
                                                textAlign: 'left', padding: '0.5rem 0.75rem',
                                                background: 'var(--bg-subtle)', border: '1px solid var(--border-light)',
                                                borderRadius: 8, fontSize: '0.8rem', cursor: 'pointer',
                                                color: 'var(--text-secondary)',
                                                transition: 'all 0.15s',
                                            }}
                                            onMouseEnter={(e) => { e.target.style.borderColor = 'var(--brand-primary)'; e.target.style.color = 'var(--brand-primary)'; }}
                                            onMouseLeave={(e) => { e.target.style.borderColor = 'var(--border-light)'; e.target.style.color = 'var(--text-secondary)'; }}
                                        >
                                            <Wand2 size={12} style={{ marginRight: 6, verticalAlign: -1 }} />
                                            {ex}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Step: PREVIEW */}
                    {step === 'preview' && (
                        <>
                            {/* Source badge */}
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: 99,
                                background: parsed?.source === 'gemini' ? 'rgba(99,102,241,0.1)' : 'rgba(20,184,166,0.1)',
                                color: parsed?.source === 'gemini' ? '#6366f1' : '#14b8a6',
                                fontWeight: 600, marginBottom: '1rem',
                            }}>
                                <Sparkles size={10} />
                                {parsed?.source === 'gemini' ? 'Extracted by Gemini AI' : 'Extracted by smart parser'}
                            </div>

                            {/* Original prompt */}
                            <div style={{
                                padding: '0.6rem 0.875rem', borderRadius: 8,
                                background: 'var(--bg-subtle)', marginBottom: '1.25rem',
                                fontSize: '0.85rem', color: 'var(--text-secondary)',
                                borderLeft: '4px solid var(--brand-primary)',
                                fontStyle: 'italic'
                            }}>
                                "{prompt}"
                            </div>

                            {/* Editable fields */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Title */}
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                                        <FileText size={13} /> Task Title
                                    </label>
                                    <input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                                        <FileText size={13} /> Description
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={2}
                                        style={{ width: '100%', resize: 'none', fontFamily: 'inherit' }}
                                        placeholder="Optional description..."
                                    />
                                </div>

                                {/* Priority + Due date row */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                                            <Flag size={13} style={{ color: prio.color }} /> Priority
                                        </label>
                                        <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ width: '100%' }}>
                                            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                                                <option key={k} value={k}>{v.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                                            <Calendar size={13} /> Due Date
                                        </label>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>
                                </div>

                                {/* Assignee hint (read-only info) */}
                                {parsed?.assignee_hint && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.5rem 0.75rem', borderRadius: 8,
                                        background: 'rgba(99,102,241,0.06)', fontSize: '0.8rem',
                                    }}>
                                        <User size={14} style={{ color: '#6366f1' }} />
                                        <span>Suggested assignee: <strong>{parsed.assignee_hint}</strong></span>
                                    </div>
                                )}

                                {/* Project selector */}
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                                        <ArrowRight size={13} /> Project *
                                    </label>
                                    <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ width: '100%' }}>
                                        <option value="">Select project…</option>
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    {!projectId && (
                                        <p style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '0.25rem' }}>
                                            Please select a project to create the task
                                        </p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Step: DONE */}
                    {step === 'done' && (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: '50%',
                                background: 'var(--brand-primary-subtle)', margin: '0 auto 1.25rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: 'var(--shadow-sm)'
                            }}>
                                <CheckCircle2 size={28} color="var(--brand-primary)" />
                            </div>
                            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>Successfully Created!</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                "{title}" has been successfully added to your project.
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div style={{
                            marginTop: '1rem', padding: '0.75rem 1rem', borderRadius: 8,
                            background: 'var(--error-bg)', color: 'var(--error)',
                            fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem',
                            border: '1px solid rgba(239, 68, 68, 0.1)'
                        }}>
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                </div>

                {/* ── Footer actions ── */}
                {step !== 'done' && (
                    <div style={{
                        padding: '1rem 1.5rem',
                        borderTop: '1px solid var(--border-light)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        {step === 'preview' && (
                            <button
                                onClick={() => { setStep('input'); setParsed(null); setError(''); }}
                                className="btn btn-secondary"
                                style={{ fontSize: '0.85rem' }}
                            >
                                ← Back
                            </button>
                        )}
                        {step === 'input' && <div />}
                        {step === 'input' && (
                            <button
                                onClick={handleParse}
                                disabled={loading || !prompt.trim()}
                                className="btn"
                                style={{
                                    fontSize: '0.85rem',
                                    background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))',
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                }}
                            >
                                {loading
                                    ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</>
                                    : <><Sparkles size={15} /> Extract Task</>
                                }
                            </button>
                        )}
                        {step === 'preview' && (
                            <button
                                onClick={handleCreate}
                                disabled={creating || !title.trim() || !projectId}
                                className="btn"
                                style={{
                                    fontSize: '0.85rem',
                                    background: !projectId ? 'var(--border-light)' : 'linear-gradient(135deg, #22c55e, #14b8a6)',
                                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    cursor: !projectId ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {creating
                                    ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</>
                                    : <><CheckCircle2 size={15} /> Create Task</>
                                }
                            </button>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
                @keyframes spin    { to { transform: rotate(360deg) } }
            `}</style>
        </div>
    );
};

export default AITaskCreator;
