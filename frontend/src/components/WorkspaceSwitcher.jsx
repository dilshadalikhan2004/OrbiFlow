import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api } from '../api';
import { ChevronDown, Plus, Building } from 'lucide-react';

const WorkspaceSwitcher = () => {
    const { organizations, activeWorkspaceId, switchWorkspace, addWorkspace } = useWorkspace();
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');

    const activeOrg = organizations.find(o => o.id === activeWorkspaceId);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newOrgName.trim()) return;
        try {
            const org = await api.createOrganization({ name: newOrgName });
            addWorkspace(org);
            setIsCreating(false);
            setNewOrgName('');
            setIsOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div style={{ position: 'relative', padding: '0 0.5rem', marginBottom: '1.5rem', zIndex: 100 }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '0.75rem', backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building size={16} className="text-tertiary" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                        {activeOrg ? activeOrg.name : 'Select Workspace'}
                    </span>
                </div>
                <ChevronDown size={16} className="text-tertiary" />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: '0.5rem', right: '0.5rem',
                    backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)', padding: '0.5rem', boxShadow: 'var(--shadow-md)'
                }}>
                    <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', padding: '0 0.5rem' }}>
                        Workspaces
                    </div>
                    {organizations.map(org => (
                        <button
                            key={org.id}
                            onClick={() => { switchWorkspace(org.id); setIsOpen(false); }}
                            style={{
                                display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem',
                                backgroundColor: org.id === activeWorkspaceId ? 'var(--bg-subtle)' : 'transparent',
                                border: 'none', borderRadius: '4px', color: 'var(--text-primary)',
                                cursor: 'pointer', fontSize: '0.875rem'
                            }}
                        >
                            {org.name}
                        </button>
                    ))}

                    <div style={{ borderTop: '1px solid var(--border-light)', margin: '0.5rem 0' }}></div>

                    {!isCreating ? (
                        <button
                            onClick={() => setIsCreating(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
                                padding: '0.5rem', backgroundColor: 'transparent', border: 'none',
                                color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem'
                            }}
                        >
                            <Plus size={16} /> Create Workspace
                        </button>
                    ) : (
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <input
                                type="text" autoFocus
                                value={newOrgName}
                                onChange={(e) => setNewOrgName(e.target.value)}
                                placeholder="Workspace name..."
                                style={{ padding: '0.4rem', fontSize: '0.875rem' }}
                            />
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button type="submit" className="btn" style={{ padding: '0.25rem 0.5rem', flex: 1 }}>Add</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsCreating(false)} style={{ padding: '0.25rem 0.5rem', flex: 1 }}>Cancel</button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};

export default WorkspaceSwitcher;
