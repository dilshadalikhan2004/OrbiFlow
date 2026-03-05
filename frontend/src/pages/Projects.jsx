import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useWorkspace } from '../context/WorkspaceContext';
import { Plus, Layers, Search, MoreVertical } from 'lucide-react';
import EmptyState from '../components/EmptyState';

const Projects = () => {
    const { activeWorkspaceId } = useWorkspace();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [dropdownId, setDropdownId] = useState(null);
    const [editProject, setEditProject] = useState(null);

    useEffect(() => {
        setLoading(true);
        api.getProjects(activeWorkspaceId)
            .then(data => setProjects(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [activeWorkspaceId]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const data = await api.getProjects(activeWorkspaceId);
            setProjects(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.createProject(newProject, activeWorkspaceId);
            setShowModal(false);
            setNewProject({ name: '', description: '' });
            fetchProjects();
        } catch (err) {
            console.error('Failed to create project', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;
        try {
            await api.deleteProject(id);
            fetchProjects();
        } catch (err) {
            console.error('Failed to delete', err);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.updateProject(editProject.id, {
                name: editProject.name,
                description: editProject.description
            });
            setEditProject(null);
            fetchProjects();
        } catch (err) {
            console.error('Failed to update project', err);
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = () => setDropdownId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    if (loading) return <div className="p-4 text-secondary fade-in">Loading projects...</div>;

    return (
        <div className="fade-in">
            <div className="page-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem' }}>
                <div>
                    <h2>Project Portfolio</h2>
                    <p className="text-secondary mt-1">Manage and track all organizational projects</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input type="text" placeholder="Search projects..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '2.5rem', width: '240px' }} />
                    </div>
                    <button className="btn" onClick={() => setShowModal(true)}>
                        <Plus size={16} /> New Project
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6" style={{ marginTop: '2rem' }}>
                {filteredProjects.length === 0 ? (
                    <div style={{ gridColumn: 'span 3', marginTop: '2rem' }}>
                        <EmptyState
                            icon={Layers}
                            title="No projects found"
                            description="Organize your workflow by creating projects and assigning tasks to your team members."
                            actionLabel="Create First Project"
                            onAction={() => setShowModal(true)}
                        />
                    </div>
                ) : filteredProjects.map(proj => (
                    <div key={proj.id} className="card hover-effect" style={{ display: 'flex', flexDirection: 'column', padding: '1.75rem', border: '1px solid var(--border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, var(--brand-primary-subtle), rgba(34, 160, 107, 0.05))', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)', boxShadow: 'inset 0 0 0 1px rgba(34, 160, 107, 0.1)' }}>
                                <Layers size={22} strokeWidth={2.5} />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDropdownId(dropdownId === proj.id ? null : proj.id); }}
                                    style={{ background: 'var(--bg-subtle)', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    className="hover-bg-subtle"
                                >
                                    <MoreVertical size={18} />
                                </button>
                                {dropdownId === proj.id && (
                                    <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', zIndex: 10, padding: '0.5rem', minWidth: '160px', animation: 'fadeIn 0.2s ease' }} onClick={e => e.stopPropagation()}>
                                        <button onClick={() => { setEditProject(proj); setDropdownId(null); }} style={{ display: 'block', width: '100%', padding: '0.6rem 1rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: '600' }} className="hover-bg-subtle">Edit Project</button>
                                        <div style={{ height: '1px', background: 'var(--border-light)', margin: '0.25rem 0' }} />
                                        <button onClick={() => handleDelete(proj.id)} style={{ display: 'block', width: '100%', padding: '0.6rem 1rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '8px', color: 'var(--error)', fontSize: '0.85rem', fontWeight: '600' }} className="hover-bg-subtle">Delete Project</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>{proj.name}</h3>
                        <p className="text-secondary" style={{ fontSize: '0.9rem', lineHeight: '1.5', flexGrow: 1, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1.5rem' }}>{proj.description}</p>

                        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active</span>
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-tertiary)', background: 'var(--bg-subtle)', padding: '0.25rem 0.5rem', borderRadius: '6px' }}>#{proj.id.slice(-6)}</span>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal-content card fade-in" style={{ maxWidth: '500px', padding: '0' }}>
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Create New Project</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                <MoreVertical size={20} style={{ transform: 'rotate(90deg)' }} />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} style={{ padding: '2rem' }}>
                            <div className="form-group mb-4">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Project Name</label>
                                <input
                                    type="text"
                                    value={newProject.name}
                                    placeholder="e.g. Q4 Website Redesign"
                                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div className="form-group mb-6">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Description</label>
                                <textarea
                                    value={newProject.description}
                                    placeholder="Brief context around what this project aims to achieve..."
                                    onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                    rows={4}
                                    required
                                    style={{ width: '100%', resize: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn" style={{ padding: '0.75rem 2rem' }}>Create Project</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editProject && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditProject(null)}>
                    <div className="modal-content card fade-in" style={{ maxWidth: '500px', padding: '0' }}>
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Edit Project</h3>
                            <button onClick={() => setEditProject(null)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                <MoreVertical size={20} style={{ transform: 'rotate(90deg)' }} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} style={{ padding: '2rem' }}>
                            <div className="form-group mb-4">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Project Name</label>
                                <input
                                    type="text"
                                    value={editProject.name}
                                    onChange={e => setEditProject({ ...editProject, name: e.target.value })}
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div className="form-group mb-6">
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Description</label>
                                <textarea
                                    value={editProject.description}
                                    onChange={e => setEditProject({ ...editProject, description: e.target.value })}
                                    rows={4}
                                    style={{ width: '100%', resize: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setEditProject(null)}>Cancel</button>
                                <button type="submit" className="btn" style={{ padding: '0.75rem 2rem' }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
