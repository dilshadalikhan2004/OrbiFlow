import React from 'react';
import { Plus } from 'lucide-react';

const EmptyState = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    compact = false
}) => {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: compact ? '2rem' : '4rem 2rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-lg)',
            border: '2px dashed var(--border-light)',
            width: '100%',
            gap: '1rem'
        }}>
            {Icon && (
                <div style={{
                    width: compact ? 48 : 64,
                    height: compact ? 48 : 64,
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-tertiary)',
                    marginBottom: '0.5rem',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <Icon size={compact ? 24 : 32} />
                </div>
            )}
            <div>
                <h3 style={{
                    fontSize: compact ? '1rem' : '1.25rem',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    marginBottom: '0.25rem'
                }}>
                    {title}
                </h3>
                <p style={{
                    fontSize: compact ? '0.8rem' : '0.9rem',
                    color: 'var(--text-secondary)',
                    maxWidth: '300px',
                    margin: '0 auto'
                }}>
                    {description}
                </p>
            </div>
            {actionLabel && (
                <button
                    onClick={onAction}
                    className="btn"
                    style={{
                        marginTop: '0.5rem',
                        padding: compact ? '0.5rem 1rem' : '0.75rem 1.5rem',
                        fontSize: compact ? '0.8rem' : '0.875rem'
                    }}
                >
                    <Plus size={compact ? 14 : 16} />
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
