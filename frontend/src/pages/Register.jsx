import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, AlertCircle } from 'lucide-react';
import { api } from '../api';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('employee');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await api.register({
                name,
                email,
                password,
                role
            });
            // Auto login could be added, but standard dictates redirecting to login with success msg
            navigate('/login');
        } catch (err) {
            setError(err.message || 'Registration failed. Check your data.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-hero fade-in">
                <div className="auth-hero-content">
                    <div className="auth-logo-large">
                        <div className="orbiflow-icon">
                            <div className="orbiflow-icon-outline"></div>
                            <div className="orbiflow-icon-solid"></div>
                        </div>
                        Orbiflow
                    </div>
                </div>
            </div>

            <div className="auth-form-wrapper">
                <div className="auth-card fade-in">
                    <h2 className="auth-title">Create your workspace</h2>
                    <p className="auth-subtitle">Join us today to supercharge your workflow.</p>

                    {error && (
                        <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}



                    <form onSubmit={handleSubmit}>
                        <div className="form-group mb-4">
                            <label>Full Name</label>
                            <input
                                type="text"
                                className="modern-input"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group mb-4">
                            <label>Email Address</label>
                            <input
                                type="email"
                                className="modern-input"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group mb-4">
                            <label>Password</label>
                            <input
                                type="password"
                                className="modern-input"
                                placeholder="Minimum 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group mb-6">
                            <label>Account Role</label>
                            <select
                                className="modern-input"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                required
                            >
                                <option value="employee">Standard Employee</option>
                                <option value="manager">Project Manager</option>
                                <option value="admin">System Administrator</option>
                            </select>
                        </div>

                        <button type="submit" className="btn-primary-modern" disabled={isLoading}>
                            {isLoading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="mt-6 text-center" style={{ fontSize: '0.9rem', color: '#aaaaaa' }}>
                        Already have an account? <Link to="/login" style={{ color: '#ffffff', fontWeight: '500' }}>Log in</Link>
                    </p>
                </div>

                <div className="auth-footer-links">
                    © Orbiflow • <a href="#">Privacy</a> • <a href="#">Terms</a>
                </div>
            </div>
        </div>
    );
};

export default Register;
