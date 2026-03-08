import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NeuralBackground from '../NeuralBackground';

function firebaseMsg(code: string): string {
    switch (code) {
        case 'auth/email-already-in-use': return 'An account with this email already exists.';
        case 'auth/invalid-email': return 'Please enter a valid email address.';
        case 'auth/weak-password': return 'Password must be at least 6 characters.';
        case 'auth/too-many-requests': return 'Too many attempts. Please wait a moment.';
        default: return 'Sign up failed. Please try again.';
    }
}

export function SignupPage() {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirm) { setError('Passwords do not match.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setLoading(true);
        try {
            await signup(name, email, password);
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

                <h1 className="auth-title">Create account</h1>
                <p className="auth-subtitle">Start tracking your neural communication baseline</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <label className="auth-label">Full name</label>
                        <input
                            type="text"
                            className="auth-input"
                            placeholder="Your name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            autoComplete="name"
                            required
                        />
                    </div>

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
                                placeholder="At least 6 characters"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                            <button type="button" className="auth-eye" onClick={() => setShowPass(v => !v)}>
                                {showPass ? '🙈' : '👁'}
                            </button>
                        </div>
                    </div>

                    <div className="auth-field">
                        <label className="auth-label">Confirm password</label>
                        <input
                            type={showPass ? 'text' : 'password'}
                            className="auth-input"
                            placeholder="Repeat password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            autoComplete="new-password"
                            required
                        />
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? <span className="auth-spinner" /> : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account?{' '}
                    <Link to="/login" className="auth-link">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
