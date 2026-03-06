import React from 'react';
import { useApp } from '../context/AppContext';

export default function Modal() {
    const { modalSession, clearModal } = useApp();
    if (!modalSession) return null;
    const s = modalSession;

    return (
        <div className="modal-bg show" onClick={e => { if (e.target === e.currentTarget) clearModal(); }}>
            <div className="modal glass-card">
                <div className="modal-icon">✅</div>
                <h3>Session Analysed!</h3>
                <div id="modal-content">
                    <div dangerouslySetInnerHTML={{ __html: s.summary }} style={{ marginBottom: 16, lineHeight: 1.7, color: 'var(--muted)', fontSize: '.85rem' }} />
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {[
                            { val: s.features.wordCount, lbl: 'Words' },
                            { val: s.riskScore ?? '—', lbl: 'Risk Score' },
                            { val: s.features.speechRate.toFixed(0), lbl: 'WPM' },
                        ].map(item => (
                            <div key={item.lbl} style={{ textAlign: 'center' }}>
                                <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent)' }}>{item.val}</div>
                                <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{item.lbl}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="modal-btns">
                    <button className="btn btn-glass" onClick={clearModal}>Close</button>
                    <button className="btn btn-primary" onClick={clearModal}>Dashboard →</button>
                </div>
            </div>
        </div>
    );
}
