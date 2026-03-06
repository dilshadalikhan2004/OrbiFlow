import React from 'react';
import { Book, MessageSquare, ExternalLink } from 'lucide-react';

const Help = () => {
    return (
        <div className="fade-in" style={{ padding: '0', maxWidth: '800px', margin: '0 auto' }}>
            <div className="page-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Help & Documentation</h2>
                <p className="text-secondary mt-1">Get assistance and learn how to use the platform effectively.</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="card hover-effect" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: '1px solid var(--border-light)' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '16px', background: 'var(--brand-primary-subtle)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <Book size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Documentation</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Detailed guides on every feature, from projects to task workflows.</p>
                    <a href="https://github.com/dilshadalikhan2004/OrbiFlow#readme" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ width: '100%', textDecoration: 'none' }}>Read Docs <ExternalLink size={14} style={{ marginLeft: '6px' }} /></a>
                </div>

                <div className="card hover-effect" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', border: '1px solid var(--border-light)' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '16px', background: 'var(--info-bg)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <MessageSquare size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Support Direct</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Contact our technical team for hands-on, rapid assistance.</p>
                    <a href="mailto:dilshadalikhanji123@gmail.com?subject=OrbiFlow Support Request" className="btn" style={{ width: '100%', textDecoration: 'none' }}>Contact Support</a>
                </div>
            </div>
        </div>
    );
};

export default Help;
