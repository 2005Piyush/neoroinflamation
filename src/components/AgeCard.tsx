import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useApp } from '../context/AppContext';

export function getAgeGroup(age: number): { label: string; baseline: string; icon: string; color: string } {
    if (age >= 5 && age <= 17) return { label: 'Child', baseline: 'Child Speech Baseline', icon: '🧒', color: '#a78bfa' };
    if (age <= 40) return { label: 'Young Adult', baseline: 'Young Adult Baseline', icon: '🧑', color: '#00d2be' };
    if (age <= 60) return { label: 'Middle Age', baseline: 'Middle Age Baseline', icon: '🧑‍💼', color: '#fbbf24' };
    return { label: 'Elderly', baseline: 'Elderly Speech Baseline', icon: '🧓', color: '#ff8232' };
}

export default function AgeCard() {
    const { setAge: setContextAge, age: contextAge } = useApp();
    const [inputAge, setInputAge] = useState('');
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    // Load from Firestore/context on mount
    useEffect(() => {
        if (contextAge && !inputAge) { setInputAge(String(contextAge)); setSaved(true); return; }
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        getDoc(doc(db, 'users', uid, 'profile', 'info'))
            .then(snap => {
                if (snap.exists() && snap.data().age) {
                    const a = snap.data().age;
                    setInputAge(String(a));
                    setContextAge(a);
                    setSaved(true);
                }
            }).catch(() => { });
    }, []);

    // Close popup when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const validate = (val: string): boolean => {
        if (!val) { setError('Please enter a valid age to continue analysis.'); return false; }
        const n = parseInt(val, 10);
        if (isNaN(n) || n < 5 || n > 100) { setError('Age must be between 5 and 100.'); return false; }
        setError(''); return true;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputAge(e.target.value);
        setSaved(false);
        if (e.target.value) validate(e.target.value); else setError('');
    };

    const handleSave = async () => {
        if (!validate(inputAge)) return;
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        setLoading(true);
        try {
            const n = parseInt(inputAge, 10);
            await setDoc(doc(db, 'users', uid, 'profile', 'info'), { age: n }, { merge: true });
            setContextAge(n);
            setSaved(true);
        } catch { setError('Save failed. Please try again.'); }
        finally { setLoading(false); }
    };

    const ageNum = parseInt(inputAge, 10);
    const group = saved && !isNaN(ageNum) ? getAgeGroup(ageNum) : null;

    return (
        <div className="age-chip-wrap" ref={popupRef}>
            {/* ── Compact trigger chip ── */}
            <button className={`age-chip-trigger${open ? ' active' : ''}`} onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}>
                <span>👤</span>
                <span className="act-label">
                    {saved && group ? `Age ${ageNum} · ${group.label}` : 'Enter Age'}
                </span>
                {saved && group && (
                    <span className="act-dot" style={{ background: group.color }} />
                )}
                {!saved && <span className="act-warn">⚠</span>}
                <span className="act-arrow">{open ? '▴' : '▾'}</span>
            </button>

            {/* ── Popup panel ── */}
            {open && (
                <div className="age-popup">
                    {/* Header */}
                    <div className="age-popup-header">
                        <div className="age-popup-icon">👤</div>
                        <div>
                            <div className="age-popup-title">User Information</div>
                            <div className="age-popup-sub">Set your profile to personalise AI analysis</div>
                        </div>
                        <button className="age-popup-close" onClick={() => setOpen(false)}>✕</button>
                    </div>

                    {/* Age Input */}
                    <div className="age-popup-field">
                        <label className="age-popup-label">User Age</label>
                        <div className="age-popup-input-row">
                            <div className="age-popup-input-wrap">
                                <input
                                    type="number"
                                    className={`age-popup-input${error ? ' err' : ''}${saved ? ' ok' : ''}`}
                                    placeholder="Enter user age"
                                    value={inputAge}
                                    onChange={handleChange}
                                    min={5} max={100}
                                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                                    autoFocus
                                />
                                <span className="age-popup-unit">yrs</span>
                            </div>
                            {saved && inputAge === String(contextAge) ? (
                                <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                                    <button
                                        className="age-popup-save-btn saved"
                                        disabled
                                        style={{ flex: 1 }}
                                    >✓ Saved</button>
                                    <button
                                        className="age-popup-save-btn"
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'var(--text)' }}
                                        onClick={() => setSaved(false)}
                                    >Change</button>
                                </div>
                            ) : (
                                <button
                                    className="age-popup-save-btn"
                                    onClick={handleSave}
                                    disabled={loading || !inputAge || !!error}
                                >
                                    {loading ? '…' : 'Save Age'}
                                </button>
                            )}
                        </div>
                        <p className="age-popup-desc">Age is used by the AI system to adjust language analysis according to age-related speech patterns.</p>
                        {error && <p className="age-popup-error">⚠ {error}</p>}
                    </div>

                    {/* Age Group Badge */}
                    {group && (
                        <div className="age-popup-badge" style={{ borderColor: group.color + '55', background: group.color + '15' }}>
                            <span className="age-popup-badge-icon">{group.icon}</span>
                            <div className="age-popup-badge-info">
                                <div className="age-popup-badge-name" style={{ color: group.color }}>
                                    {group.label} <span>· Age {ageNum}</span>
                                </div>
                                <div className="age-popup-badge-baseline">
                                    AI Model: <strong>{group.baseline}</strong>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Warning if not saved */}
                    {!saved && (
                        <div className="age-popup-warning">
                            ⚠ Age is required before running speech analysis. Please enter and save your age.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
