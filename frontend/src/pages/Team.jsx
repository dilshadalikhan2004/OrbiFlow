import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Users, Shield, Mail, MoreHorizontal } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import EmptyState from '../components/EmptyState';

const Team = () => {
    const { activeWorkspaceId } = useWorkspace();
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('employee');

    useEffect(() => {
        if (!activeWorkspaceId) { setTeam([]); setLoading(false); return; }
        setLoading(true);
        api.getOrganizationMembers(activeWorkspaceId)
            .then(data => setTeam(data))
            .catch(err => console.error('Failed to fetch users', err))
            .finally(() => setLoading(false));
    }, [activeWorkspaceId]);

    const fetchUsers = async () => {
        if (!activeWorkspaceId) return;
        setLoading(true);
        try {
            const data = await api.getOrganizationMembers(activeWorkspaceId);
            setTeam(data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        try {
            await api.inviteMember(activeWorkspaceId, { email: inviteEmail, role: inviteRole });
            setShowInviteModal(false);
            setInviteEmail('');
            setInviteRole('employee');
            fetchUsers();
        } catch (err) {
            console.error('Failed to invite member', err);
            alert(err.message || 'Failed to invite member');
        }
    };

    if (loading) return <div className="p-4 text-secondary fade-in">Loading team directory...</div>;

    return (
        <div className="fade-in">
            <div className="page-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem' }}>
                <div>
                    <h2>Team Directory</h2>
                    <p className="text-secondary mt-1">Manage users, roles, and platform access</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn" onClick={() => setShowInviteModal(true)}>
                        <Users size={16} /> Invite Member
                    </button>
                </div>
            </div>

            {team.length > 0 ? (
                <div className="grid grid-cols-3 gap-6 mt-6">
                    {team.map((member) => (
                        <div key={member.user.id} className="card hover-effect" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ position: 'relative' }}>
                                    <div className="avatar" style={{
                                        width: 64, height: 64, fontSize: '1.75rem',
                                        background: 'linear-gradient(135deg, var(--brand-primary-subtle), rgba(34, 160, 107, 0.05))',
                                        color: 'var(--brand-primary)',
                                        fontWeight: '800',
                                        border: '1px solid rgba(34, 160, 107, 0.1)'
                                    }}>
                                        {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, background: 'var(--success)', borderRadius: '50%', border: '2.5px solid var(--bg-card)' }} title="Active Now"></div>
                                </div>
                                <div className={`badge badge-${member.role === 'admin' ? 'completed' : member.role === 'manager' ? 'progress' : 'default'}`} style={{ fontWeight: '700', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                                    {member.role}
                                </div>
                            </div>

                            <div style={{ marginTop: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{member.user.name || 'Unnamed User'}</h3>
                                <p className="text-secondary" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Mail size={12} /> {member.user.email}
                                </p>
                            </div>

                            <div style={{
                                marginTop: '1.5rem',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '1rem',
                                padding: '1rem',
                                backgroundColor: 'var(--bg-subtle)',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div>
                                    <p style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Assigned</p>
                                    <p style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>12</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Completed</p>
                                    <p style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--brand-primary)' }}>8</p>
                                </div>
                            </div>

                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Workflow Status</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                                    Active
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ marginTop: '3rem' }}>
                    <EmptyState
                        icon={Users}
                        title="Your team is empty"
                        description="Collaborate better by inviting your team members to this workspace."
                        actionLabel="Invite First Member"
                        onAction={() => setShowInviteModal(true)}
                    />
                </div>
            )}

            {showInviteModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowInviteModal(false)}>
                    <div className="modal-content card fade-in" style={{ maxWidth: '450px', padding: '0' }}>
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Invite Team Member</h3>
                            <button onClick={() => setShowInviteModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                <MoreHorizontal size={20} style={{ transform: 'rotate(90deg)' }} />
                            </button>
                        </div>
                        <form onSubmit={handleInvite} style={{ padding: '2rem' }}>
                            <div className="form-group mb-4">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email Address</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    placeholder="colleague@company.com"
                                    onChange={e => setInviteEmail(e.target.value)}
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div className="form-group mb-6">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Access Role</label>
                                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} required style={{ width: '100%' }}>
                                    <option value="employee">Employee (Limited Access)</option>
                                    <option value="manager">Manager (Project Creation)</option>
                                    <option value="admin">Admin (Full Access)</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>Cancel</button>
                                <button type="submit" className="btn" style={{ padding: '0.75rem 2rem' }}>Send Invitation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Team;
