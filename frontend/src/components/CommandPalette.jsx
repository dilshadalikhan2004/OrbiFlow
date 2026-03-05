import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, LayoutDashboard, Layers, ListTodo,
    Calendar, BarChart2, Users, Settings, HelpCircle,
    Bell, Sparkles, UserPlus
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';

const CommandPalette = () => {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { activeWorkspaceId } = useWorkspace();
    const { user } = useAuth();

    // Toggle the menu when ⌘K or Ctrl+K is pressed
    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
            if (e.key === '/' && !(['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName))) {
                e.preventDefault();
                setOpen(true);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = (command) => {
        setOpen(false);
        command();
    };

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Global Command Palette"
            style={{
                position: 'fixed',
                top: '20%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: '640px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '16px',
                boxShadow: '0 32px 64px rgba(0,0,0,0.3)',
                border: '1px solid var(--border-light)',
                zIndex: 2000,
                padding: '0',
                overflow: 'hidden',
                animation: 'slideUp 0.15s ease-out'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', padding: '1.25rem', borderBottom: '1px solid var(--border-light)' }}>
                <Search size={20} color="var(--text-tertiary)" style={{ marginRight: '1rem' }} />
                <Command.Input
                    placeholder="Type a command or search..."
                    style={{
                        width: '100%',
                        border: 'none',
                        background: 'none',
                        outline: 'none',
                        fontSize: '1.1rem',
                        color: 'var(--text-primary)',
                        fontWeight: '500'
                    }}
                />
            </div>

            <Command.List style={{ maxHeight: '450px', overflowY: 'auto', padding: '0.75rem' }}>
                <Command.Empty style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                    No results found.
                </Command.Empty>

                <Command.Group heading="Navigation" style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-tertiary)', padding: '0.5rem 0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <CommandPaletteItem icon={LayoutDashboard} label="Go to Dashboard" onSelect={() => runCommand(() => navigate('/'))} />
                    {user?.role && ['admin', 'manager'].includes(user.role) && (
                        <CommandPaletteItem icon={Layers} label="Project Portfolio" onSelect={() => runCommand(() => navigate('/projects'))} />
                    )}
                    <CommandPaletteItem icon={ListTodo} label="Tasks Board" onSelect={() => runCommand(() => navigate('/tasks'))} />
                    <CommandPaletteItem icon={Calendar} label="Team Calendar" onSelect={() => runCommand(() => navigate('/calendar'))} />
                    <CommandPaletteItem icon={BarChart2} label="Analytics & Reports" onSelect={() => runCommand(() => navigate('/analytics'))} />
                    {user?.role === 'admin' && (
                        <CommandPaletteItem icon={Users} label="Team Members" onSelect={() => runCommand(() => navigate('/team'))} />
                    )}
                </Command.Group>

                <Command.Separator style={{ height: '1px', background: 'var(--border-light)', margin: '0.75rem 0' }} />

                <Command.Group heading="Actions" style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-tertiary)', padding: '0.5rem 0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <CommandPaletteItem icon={Plus} label="Create New Task" shortcut="N" onSelect={() => runCommand(() => navigate('/tasks'))} />
                    <CommandPaletteItem icon={Sparkles} label="AI Task Assistant" shortcut="A" onSelect={() => runCommand(() => navigate('/tasks'))} />
                    <CommandPaletteItem icon={UserPlus} label="Invite Team Member" onSelect={() => runCommand(() => navigate('/team'))} />
                    <CommandPaletteItem icon={Layers} label="Start New Project" shortcut="P" onSelect={() => runCommand(() => navigate('/projects'))} />
                </Command.Group>

                <Command.Separator style={{ height: '1px', background: 'var(--border-light)', margin: '0.75rem 0' }} />

                <Command.Group heading="System" style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-tertiary)', padding: '0.5rem 0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <CommandPaletteItem icon={Settings} label="Preferences & Settings" onSelect={() => runCommand(() => navigate('/'))} />
                    <CommandPaletteItem icon={HelpCircle} label="Help & Documentation" onSelect={() => runCommand(() => navigate('/help'))} />
                </Command.Group>
            </Command.List>

            <div style={{ padding: '0.85rem 1.25rem', background: 'var(--bg-subtle)', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <KbdHint keyName="↵" label="to select" />
                <KbdHint keyName="↑↓" label="to navigate" />
                <KbdHint keyName="esc" label="to close" />
            </div>

            <style>{`
                [cmdk-item] {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.85rem 1rem;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.15s;
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                    font-weight: 600;
                }
                [cmdk-item][aria-selected='true'] {
                    background: var(--brand-primary-subtle);
                    color: var(--brand-primary);
                }
                [cmdk-list] {
                    scrollbar-width: thin;
                    scrollbar-color: var(--border-light) transparent;
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translate(-50%, 10%); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
            `}</style>
        </Command.Dialog>
    );
};

const CommandPaletteItem = ({ icon: Icon, label, onSelect, shortcut }) => (
    <Command.Item onSelect={onSelect}>
        <Icon size={18} />
        <span>{label}</span>
        {shortcut && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                <kbd style={{
                    fontFamily: 'inherit',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.7rem',
                    color: 'var(--text-tertiary)',
                    fontWeight: 800
                }}>{shortcut}</kbd>
            </div>
        )}
    </Command.Item>
);

const KbdHint = ({ keyName, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
        <kbd style={{
            fontFamily: 'inherit',
            padding: '2px 4px',
            borderRadius: '4px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            fontWeight: 800
        }}>{keyName}</kbd>
        <span>{label}</span>
    </div>
);

export default CommandPalette;
