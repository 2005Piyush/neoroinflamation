import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Session, BaselineStats } from '../types';
import { buildBaseline } from '../utils/nlp';

interface AppContextType {
    sessions: Session[];
    baseline: BaselineStats | null;
    modalSession: Session | null;
    addSession: (session: Session) => void;
    clearModal: () => void;
    clearAll: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

function loadState() {
    try {
        const d = JSON.parse(localStorage.getItem('neurolingo_v4') || '{}');
        return { sessions: d.sessions || [], baseline: d.baseline || null };
    } catch { return { sessions: [], baseline: null }; }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
    const initial = loadState();
    const [sessions, setSessions] = useState<Session[]>(initial.sessions);
    const [baseline, setBaseline] = useState<BaselineStats | null>(initial.baseline);
    const [modalSession, setModalSession] = useState<Session | null>(null);

    useEffect(() => {
        try { localStorage.setItem('neurolingo_v4', JSON.stringify({ sessions, baseline })); }
        catch (e) { console.warn('Persist failed', e); }
    }, [sessions, baseline]);

    const addSession = (session: Session) => {
        setSessions(prev => {
            const updated = [...prev, session];
            const newBaseline = buildBaseline(updated);
            setBaseline(newBaseline);
            return updated;
        });
        setModalSession(session);
    };

    const clearModal = () => setModalSession(null);
    const clearAll = () => { setSessions([]); setBaseline(null); };

    return (
        <AppContext.Provider value={{ sessions, baseline, modalSession, addSession, clearModal, clearAll }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
