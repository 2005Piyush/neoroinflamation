import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { ViewName } from '../types';

interface NavbarProps {
    current: ViewName;
    onNavigate: (v: ViewName) => void;
    sessionCount: number;
}

const TABS: { id: ViewName; icon: string; label: string }[] = [
    { id: 'dashboard', icon: '⚡', label: 'Dashboard' },
    { id: 'record', icon: '🎙', label: 'Record' },
    { id: 'analysis', icon: '🔬', label: 'Analysis' },
    { id: 'history', icon: '📈', label: 'History' },
    { id: 'report', icon: '📋', label: 'Report' },
];

export default function Navbar({ current, onNavigate, sessionCount }: NavbarProps) {
    const { logout, user } = useAuth();

    return (
        <nav className="navbar">
            <div className="nav-logo">
                <div className="logo-mark">🧠</div>
                <span className="logo-text">NeurO<em>lingo</em> AI</span>
            </div>
            <div className="nav-tabs">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        className={`nav-tab${current === t.id ? ' active' : ''}`}
                        onClick={() => onNavigate(t.id)}
                    >
                        <span>{t.icon}</span>{t.label}
                    </button>
                ))}
            </div>
            <div className="nav-meta">
                <div className={`live-dot${sessionCount > 0 ? ' on' : ''}`} />
                <span>{sessionCount} session{sessionCount !== 1 ? 's' : ''}</span>
                {user && <span className="nav-user">{user.displayName || user.email}</span>}
                <button onClick={() => logout()} className="logout-btn" title="Sign Out">
                    <LogOut size={16} />
                </button>
            </div>
        </nav>
    );
}
