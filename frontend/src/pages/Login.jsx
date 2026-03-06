import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, AlertCircle } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Login failed. Check credentials.');
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
                    <h2 className="auth-title">Sign in</h2>
                    <p className="auth-subtitle">Welcome back! Please sign in to continue.</p>

                    {error && (
                        <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}



                    <form onSubmit={handleSubmit}>
                        <div className="form-group mb-6">
                            <label>Email address</label>
                            <input
                                type="email"
                                className="modern-input"
                                placeholder="hello@app.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {/* Note: I added a password input here for functionality, but the design didn't explicitly show one unless they use magic links. 
                            However, the previous implementation clearly requires it. Let's make it look consistent. */}
                        <div className="form-group mb-6">
                            <label>Password</label>
                            <input
                                type="password"
                                className="modern-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="btn-primary-modern" disabled={isLoading}>
                            {isLoading ? 'Signing in...' : 'Continue'}
                        </button>
                    </form>

                    <p className="mt-6 text-center" style={{ fontSize: '0.9rem', color: '#aaaaaa' }}>
                        Don't have an account? <Link to="/register" style={{ color: '#ffffff', fontWeight: '500' }}>Sign up</Link>
                    </p>
                </div>

                <div className="auth-footer-links">
                    © Orbiflow • <a href="#">Privacy</a> • <a href="#">Terms</a>
                </div>
            </div>
        </div>
    );
};

export default Login;
