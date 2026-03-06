import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LogOut,
    LayoutDashboard,
    Layers,
    ListTodo,
    Users,
    Settings,
    Search,
    Moon,
    Sun,
    Calendar,
    BarChart2,
    HelpCircle,
    Bell,
    Mail,
    Plus,
    X
} from 'lucide-react';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import CommandPalette from './CommandPalette';
import { api } from '../api';
import { useWorkspace } from '../context/WorkspaceContext';

const Layout = () => {
    const { user, logout } = useAuth();
    const { activeWorkspaceId } = useWorkspace();
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = React.useState(false);
    const [globalSearch, setGlobalSearch] = React.useState('');
    const [showSettings, setShowSettings] = React.useState(false);
    const [taskCount, setTaskCount] = React.useState(0);
    const [unreadCount, setUnreadCount] = React.useState(0);

    const [showNotifications, setShowNotifications] = React.useState(false);
    const [notifications, setNotifications] = React.useState([]);
    const [loadingNotifications, setLoadingNotifications] = React.useState(false);

    React.useEffect(() => {
        const theme = localStorage.getItem('theme') || 'light';
        setIsDarkMode(theme === 'dark');
        document.documentElement.setAttribute('data-theme', theme);
    }, []);

    const fetchNotifications = async () => {
        setLoadingNotifications(true);
        try {
            const data = await api.getNotifications();
            setNotifications(data);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoadingNotifications(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.markAllRead();
            setUnreadCount(0);
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await api.markNotificationRead(id);
            fetchNotifications();
            const unread = await api.getUnreadCount();
            setUnreadCount(unread.count || 0);
        } catch (err) {
            console.error(err);
        }
    };

    React.useEffect(() => {
        if (!activeWorkspaceId) return;

        const fetchCounts = async () => {
            try {
                const [tasks, notifications] = await Promise.all([
                    api.getTasks({ orgId: activeWorkspaceId, limit: 1 }),
                    api.getUnreadCount()
                ]);
                // For simplicity, we'll use the total count from the tasks response if it provides it, 
                // or just fetch all and count if needed. api.getTasks returns the list.
                // Let's just fetch tasks once and set count.
                const allTasks = await api.getTasks({ orgId: activeWorkspaceId });
                setTaskCount(allTasks.length);
                setUnreadCount(notifications.count || 0);
            } catch (err) {
                console.error('Failed to fetch counts', err);
            }
        };

        fetchCounts();
        // Set interval for real-time-ish updates
        const interval = setInterval(fetchCounts, 30000);
        return () => clearInterval(interval);
    }, [activeWorkspaceId]);

    // Close notification dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (showNotifications && !event.target.closest('.notifications-wrapper')) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNotifications]);

    const toggleTheme = () => {
        const newTheme = isDarkMode ? 'light' : 'dark';
        setIsDarkMode(!isDarkMode);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (globalSearch.trim()) {
            navigate(`/tasks?search=${encodeURIComponent(globalSearch.trim())}`);
            setGlobalSearch('');
        }
    };

    const navItemStyle = ({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0.85rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
        backgroundColor: 'transparent',
        fontWeight: isActive ? '700' : '500',
        textDecoration: 'none',
        transition: 'var(--transition)',
        position: 'relative',
        fontSize: '1.05rem'
    });

    const activeIndicatorStyle = {
        position: 'absolute',
        left: '-1.5rem',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '6px',
        height: '40px',
        backgroundColor: 'var(--brand-primary)',
        borderRadius: '0 100px 100px 0',
        transition: 'var(--transition)'
    };

    const sectionHeaderStyle = {
        padding: '0 1.25rem',
        fontSize: '0.8rem',
        fontWeight: '600',
        color: 'var(--text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginTop: '2rem',
        marginBottom: '1rem'
    };

    return (
        <div className="layout-container" style={{ backgroundColor: 'var(--bg-main)' }}>
            <aside className="sidebar" style={{
                width: 'var(--sidebar-w)',
                backgroundColor: 'var(--bg-card)',
                borderRight: '1px solid var(--border-light)',
                padding: '2rem 1.5rem',
                height: '100vh',
                position: 'sticky',
                top: 0,
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Logo */}
                <div className="sidebar-logo" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0 0.5rem',
                    marginBottom: '3rem',
                    cursor: 'pointer'
                }} onClick={() => navigate('/')}>
                    <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                        <div style={{
                            position: 'absolute', top: 0, left: 0, width: '30px', height: '30px',
                            border: '3px solid var(--brand-primary)', borderRadius: '10px'
                        }} />
                        <div style={{
                            position: 'absolute', bottom: 0, right: 0, width: '30px', height: '30px',
                            backgroundColor: 'var(--brand-primary)', borderRadius: '10px',
                            boxShadow: '0 4px 12px var(--brand-primary-subtle)'
                        }} />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1.75rem', color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>Orbiflow</span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                    <div style={sectionHeaderStyle}>Menu</div>
                    <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <NavLink to="/" end style={navItemStyle} className="nav-link">
                            {({ isActive }) => (
                                <>
                                    {isActive && <div style={activeIndicatorStyle} />}
                                    <LayoutDashboard size={22} strokeWidth={isActive ? 2.5 : 2} />
                                    <span>Dashboard</span>
                                </>
                            )}
                        </NavLink>
                        {user?.role && ['admin', 'manager'].includes(user.role) && (
                            <NavLink to="/projects" style={navItemStyle} className="nav-link">
                                {({ isActive }) => (
                                    <>
                                        {isActive && <div style={activeIndicatorStyle} />}
                                        <Layers size={22} strokeWidth={isActive ? 2.5 : 2} />
                                        <span>Projects</span>
                                    </>
                                )}
                            </NavLink>
                        )}
                        <NavLink to="/tasks" style={navItemStyle} className="nav-link">
                            {({ isActive }) => (
                                <>
                                    {isActive && <div style={activeIndicatorStyle} />}
                                    <ListTodo size={22} strokeWidth={isActive ? 2.5 : 2} />
                                    <span>Tasks Board</span>
                                    {taskCount > 0 && (
                                        <span style={{
                                            marginLeft: 'auto',
                                            backgroundColor: 'var(--brand-primary)',
                                            color: 'white',
                                            fontSize: '0.7rem',
                                            fontWeight: '800',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '6px'
                                        }}>{taskCount}</span>
                                    )}
                                </>
                            )}
                        </NavLink>

                        <div style={{ padding: '1rem 0', margin: '0.5rem 1.25rem' }}>
                            <button
                                onClick={() => navigate('/tasks')}
                                style={{
                                    width: '100%',
                                    padding: '0.85rem',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))',
                                    border: 'none',
                                    color: 'white',
                                    fontWeight: '700',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.6rem',
                                    boxShadow: '0 8px 16px var(--brand-primary-subtle)',
                                    cursor: 'pointer'
                                }}
                                className="hover-effect"
                            >
                                <Plus size={18} strokeWidth={3} /> Quick Create
                            </button>
                        </div>

                        <NavLink to="/calendar" style={navItemStyle} className="nav-link">
                            {({ isActive }) => (
                                <>
                                    {isActive && <div style={activeIndicatorStyle} />}
                                    <Calendar size={22} strokeWidth={isActive ? 2.5 : 2} />
                                    <span>Calendar</span>
                                </>
                            )}
                        </NavLink>
                        <NavLink to="/analytics" style={navItemStyle} className="nav-link">
                            {({ isActive }) => (
                                <>
                                    {isActive && <div style={activeIndicatorStyle} />}
                                    <BarChart2 size={22} strokeWidth={isActive ? 2.5 : 2} />
                                    <span>Analytics</span>
                                </>
                            )}
                        </NavLink>
                        {user?.role === 'admin' && (
                            <NavLink to="/team" style={navItemStyle} className="nav-link">
                                {({ isActive }) => (
                                    <>
                                        {isActive && <div style={activeIndicatorStyle} />}
                                        <Users size={22} strokeWidth={isActive ? 2.5 : 2} />
                                        <span>Team Directory</span>
                                    </>
                                )}
                            </NavLink>
                        )}
                    </nav>

                    <div style={sectionHeaderStyle}>General</div>
                    <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <button onClick={() => setShowSettings(true)} style={{ ...navItemStyle({ isActive: false }), border: 'none', background: 'none', width: '100%', cursor: 'pointer', paddingLeft: '1.25rem' }}>
                            <Settings size={22} />
                            <span>Settings</span>
                        </button>
                        <NavLink to="/help" style={navItemStyle} className="nav-link">
                            {({ isActive }) => (
                                <>
                                    {isActive && <div style={activeIndicatorStyle} />}
                                    <HelpCircle size={22} strokeWidth={isActive ? 2.5 : 2} />
                                    <span>Help</span>
                                </>
                            )}
                        </NavLink>
                        <button onClick={handleLogout} style={{ ...navItemStyle({ isActive: false }), border: 'none', background: 'none', width: '100%', cursor: 'pointer', paddingLeft: '1.25rem' }}>
                            <LogOut size={22} />
                            <span>Logout</span>
                        </button>
                    </nav>
                </div>

            </aside>

            <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                <header className="topbar" style={{
                    height: 72,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 2rem',
                    backgroundColor: 'var(--bg-card)',
                    borderBottom: '1px solid var(--border-light)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}>
                    <form onSubmit={handleSearch} style={{ position: 'relative', maxWidth: '450px', width: '100%' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                            <input
                                type="text"
                                value={globalSearch}
                                onChange={e => setGlobalSearch(e.target.value)}
                                placeholder="Search task"
                                style={{
                                    paddingRight: '3.5rem',
                                    paddingLeft: '3rem',
                                    height: 48,
                                    borderRadius: 'var(--radius-md)',
                                    backgroundColor: 'var(--bg-card)',
                                    border: '1px solid var(--border-light)',
                                    width: '100%',
                                    fontSize: '0.95rem',
                                    color: 'var(--text-primary)',
                                    transition: 'var(--transition)'
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                right: '0.75rem',
                                transform: 'translateY(-50%)',
                                display: 'flex', gap: '0.25rem', alignItems: 'center',
                                border: '1px solid var(--border-light)',
                                borderRadius: '6px',
                                padding: '0.1rem 0.35rem',
                                backgroundColor: 'var(--bg-card)'
                            }}>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>⌘ F</span>
                            </div>
                        </div>
                    </form>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="notifications-wrapper" style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
                            <button className="topbar-btn" title="Coming Soon" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', cursor: 'pointer', padding: '0.65rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Mail size={20} />
                            </button>
                            <button
                                className="topbar-btn"
                                onClick={() => {
                                    if (!showNotifications) fetchNotifications();
                                    setShowNotifications(!showNotifications);
                                }}
                                style={{
                                    background: showNotifications ? 'var(--brand-primary-subtle)' : 'var(--bg-subtle)',
                                    border: '1px solid var(--border-light)',
                                    color: showNotifications ? 'var(--brand-primary)' : 'var(--text-primary)',
                                    cursor: 'pointer',
                                    padding: '0.65rem',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative'
                                }}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <div style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, padding: '0 4px', backgroundColor: 'var(--status-danger)', borderRadius: '10px', border: '2px solid var(--bg-card)', color: 'white', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </div>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {showNotifications && (
                                <div style={{
                                    position: 'absolute', top: '120%', right: 0, width: '320px',
                                    backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-lg)',
                                    zIndex: 1000, overflow: 'hidden'
                                }}>
                                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: '700' }}>Notifications</h4>
                                        <button onClick={handleMarkAllRead} style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Mark all read</button>
                                    </div>
                                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                        {loadingNotifications ? (
                                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Loading...</div>
                                        ) : notifications.length === 0 ? (
                                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No new notifications</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div
                                                    key={n.id}
                                                    onClick={() => !n.is_read && handleMarkRead(n.id)}
                                                    style={{
                                                        padding: '0.875rem 1rem',
                                                        borderBottom: '1px solid var(--border-light)',
                                                        backgroundColor: n.is_read ? 'transparent' : 'var(--brand-primary-subtle)',
                                                        cursor: 'pointer',
                                                        transition: 'background 0.2s'
                                                    }}
                                                    className="dropdown-item"
                                                >
                                                    <p style={{ fontSize: '0.85rem', fontWeight: n.is_read ? '500' : '700', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{n.title}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{n.message}</p>
                                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '0.4rem' }}>{new Date(n.created_at).toLocaleString()}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    <button style={{ width: '100%', padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-subtle)', border: 'none', cursor: 'pointer', fontWeight: '600' }}>View all history</button>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.25rem', borderLeft: '1px solid var(--border-light)' }}>
                            <div className="avatar" style={{
                                width: 44, height: 44, borderRadius: '50%',
                                overflow: 'hidden', backgroundColor: 'var(--brand-primary-subtle)',
                                border: '2px solid white', boxShadow: '0 0 0 1px var(--border-light)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || user?.email}`} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)' }}>{user?.name || 'User'}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{user?.email}</span>
                            </div>
                        </div>

                        <button
                            className="topbar-btn"
                            onClick={toggleTheme}
                            style={{
                                background: 'var(--bg-subtle)',
                                border: '1px solid var(--border-light)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                width: 42, height: 42,
                                borderRadius: '12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginLeft: '1rem',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: isDarkMode ? 'inset 0 2px 4px rgba(0,0,0,0.2)' : 'var(--shadow-sm)'
                            }}
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                </header>

                <div className="page-content" style={{ flex: 1, overflowY: 'auto', padding: '2rem', backgroundColor: 'var(--bg-main)' }}>
                    <Outlet />
                </div>
            </main>

            {
                showSettings && (
                    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowSettings(false)}>
                        <div className="modal-content card fade-in" style={{ maxWidth: '450px', padding: '0' }}>
                            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Workspace Settings</h3>
                                <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div style={{ padding: '2rem' }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Workspace Name</label>
                                    <input type="text" defaultValue={`${user?.name}'s Workspace`} style={{ width: '100%' }} />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Theme Preference</label>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button onClick={() => isDarkMode && toggleTheme()} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: !isDarkMode ? '2px solid var(--brand-primary)' : '1px solid var(--border-light)', background: !isDarkMode ? 'var(--brand-primary-subtle)' : 'var(--bg-card)', color: !isDarkMode ? 'var(--brand-primary)' : 'var(--text-secondary)', fontWeight: '600' }}>Light Mode</button>
                                        <button onClick={() => !isDarkMode && toggleTheme()} style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: isDarkMode ? '2px solid var(--brand-primary)' : '1px solid var(--border-light)', background: isDarkMode ? 'var(--brand-primary-subtle)' : 'var(--bg-card)', color: isDarkMode ? 'var(--brand-primary)' : 'var(--text-secondary)', fontWeight: '600' }}>Dark Mode</button>
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: '1.25rem 2rem', backgroundColor: 'var(--bg-subtle)', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>Cancel</button>
                                <button className="btn" onClick={() => { alert('Settings saved!'); setShowSettings(false); }}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                )
            }
            <CommandPalette />
        </div >
    );
};

export default Layout;
