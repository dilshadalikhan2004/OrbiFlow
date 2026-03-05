import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();
    return (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '2rem', textAlign: 'center' }}>
            <FileQuestion size={64} color="var(--text-tertiary)" style={{ marginBottom: '1.5rem' }} />
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>404 Not Found</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.1rem' }}>We couldn't find the page you were looking for.</p>
            <button className="btn" onClick={() => navigate('/')}>Return to Dashboard</button>
        </div>
    );
};

export default NotFound;
