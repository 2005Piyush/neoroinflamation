import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NeuralBackground from '../NeuralBackground';

function firebaseMsg(code: string): string {
    switch (code) {
        case 'auth/user-not-found': return 'No account found with this email.';
        case 'auth/wrong-password': return 'Incorrect password. Please try again.';
        case 'auth/invalid-email': return 'Please enter a valid email address.';
        case 'auth/too-many-requests': return 'Too many attempts. Please wait a moment.';
        case 'auth/invalid-credential': return 'Invalid email or password. Please try again.';
        default: return 'Sign in failed. Please try again.';
    }
}

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err: any) {
            setError(firebaseMsg(err.code));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <NeuralBackground />

            <div className="auth-card">
                <div className="auth-logo">
                    <div className="auth-logo-mark">🧠</div>
                    <span className="auth-logo-text">NeurO<em>lingo</em> AI</span>
                </div>

                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-subtitle">Sign in to continue monitoring your neural health</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <label className="auth-label">Email address</label>
                        <input
                            type="email"
                            className="auth-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label className="auth-label">Password</label>
                        <div className="auth-input-wrap">
                            <input
                                type={showPass ? 'text' : 'password'}
                                className="auth-input"
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                            <button type="button" className="auth-eye" onClick={() => setShowPass(v => !v)}>
                                {showPass ? '🙈' : '👁'}
                            </button>
                        </div>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? <span className="auth-spinner" /> : 'Sign In'}
                    </button>
                </form>

                <div className="auth-footer">
                    Don't have an account?{' '}
                    <Link to="/signup" className="auth-link">Create one</Link>
                </div>
            </div>
        </div>
    );
}
