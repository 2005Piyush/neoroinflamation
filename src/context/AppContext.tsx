import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { Session, BaselineStats } from '../types';
import { buildBaseline } from '../utils/nlp';

interface AppContextType {
    sessions: Session[];
    baseline: BaselineStats | null;
    modalSession: Session | null;
    age: number | null;
    addSession: (session: Session) => void;
    setAge: (age: number) => void;
    clearModal: () => void;
    clearAll: () => void;
    sessionsLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [baseline, setBaseline] = useState<BaselineStats | null>(null);
    const [modalSession, setModalSession] = useState<Session | null>(null);
    const [uid, setUid] = useState<string | null>(null);
    const [age, setAgeState] = useState<number | null>(null);
    const [sessionsLoading, setSessionsLoading] = useState(true);

    // Listen for auth state and load sessions from Firestore
    useEffect(() => {
        let unsubscribeSessions: (() => void) | null = null;

        const unsubAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUid(user.uid);
                try {
                    // Load age from profile initially
                    const profSnap = await getDocs(collection(db, 'users', user.uid, 'profile'));
                    profSnap.forEach(pd => { if (pd.id === 'info' && pd.data().age) setAgeState(pd.data().age); });
                } catch { /* ignore */ }

                // Real-time listener for sessions
                const q = query(
                    collection(db, 'users', user.uid, 'sessions'),
                    orderBy('timestamp', 'asc')
                );

                unsubscribeSessions = onSnapshot(q, (snap) => {
                    const loaded: Session[] = snap.docs.map(d => ({ ...(d.data() as Session), _docId: d.id } as any));
                    setSessions(loaded);
                    if (loaded.length > 0) setBaseline(buildBaseline(loaded));
                    setSessionsLoading(false);
                }, (error) => {
                    console.warn('Failed to listen to sessions from Firestore', error);
                    setSessionsLoading(false);
                });

            } else {
                setUid(null);
                setSessions([]);
                setBaseline(null);
                setAgeState(null);
                setSessionsLoading(false);
                if (unsubscribeSessions) unsubscribeSessions();
            }
        });

        return () => {
            unsubAuth();
            if (unsubscribeSessions) unsubscribeSessions();
        };
    }, []);

    const addSession = async (session: Session) => {
        const updated = [...sessions, session];
        const newBaseline = buildBaseline(updated);
        setSessions(updated);
        setBaseline(newBaseline);
        setModalSession(session);

        // Persist to Firestore
        if (uid) {
            try {
                await addDoc(collection(db, 'users', uid, 'sessions'), {
                    ...session,
                    timestamp: session.timestamp ?? Date.now(),
                });
            } catch (e: any) {
                console.warn('Failed to save session to Firestore', e);
                alert(`Error saving session: ${e.message}. Please check your internet connection or Firestore database rules.`);
            }
        }
    };

    const setAge = (newAge: number) => {
        setAgeState(newAge);
    };

    const clearModal = () => setModalSession(null);

    const clearAll = async () => {
        setSessions([]);
        setBaseline(null);
        if (uid) {
            try {
                const snap = await getDocs(collection(db, 'users', uid, 'sessions'));
                await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'users', uid, 'sessions', d.id))));
            } catch (e) {
                console.warn('Failed to clear sessions from Firestore', e);
            }
        }
    };



    return (
        <AppContext.Provider value={{ sessions, baseline, modalSession, age, addSession, setAge, clearModal, clearAll, sessionsLoading }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
