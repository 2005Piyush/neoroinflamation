import React from 'react';
import { useApp } from '../context/AppContext';
import { FEAT_CFG, DOMAIN_CFG, formatVal, riskColor, riskBand, computeDegradation } from '../utils/nlp';
import type { ViewName } from '../types';

export default function Report({ onNavigate }: { onNavigate: (v: ViewName) => void }) {
    const { sessions, baseline, clearAll } = useApp();
    const ready = sessions.length >= 3 && baseline?.established;

    if (!ready) return (
        <div className="view active">
            <div className="view-header"><h1>Clinical Report</h1></div>
            <div className="empty-full">
                <div className="empty-icon" style={{ fontSize: '3rem' }}>📋</div>
                <p>Complete at least 3 sessions to generate a full report.</p>
                <button className="btn btn-primary" onClick={() => onNavigate('record')}>Record Session</button>
            </div>
        </div>
    );

    const last = sessions[sessions.length - 1];
    const deg = computeDegradation(sessions);
    const daySpan = Math.round((last.timestamp - sessions[0].timestamp) / 86400000);
    const rs = last.riskScore ?? 0;

    const handleClear = () => {
        if (confirm('Clear all data? This cannot be undone.')) clearAll();
    };
    const exportJSON = () => {
        const blob = new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), sessions, baseline }, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'neurolingo_report.json'; a.click();
    };

    return (
        <div className="view active">
            <div className="view-header"><h1>Clinical Report</h1><p>Comprehensive neuroinflammation risk assessment.</p></div>
            <div className="report-doc glass-card">

                {/* Header */}
                <div className="report-letterhead">
                    <div className="report-logo-row">
                        <span className="rlogo">🧠 NeurOlingo AI</span>
                        <span className="rdraft">RESEARCH PROTOTYPE</span>
                    </div>
                    <div className="report-meta-grid">
                        <div><span>Generated</span><strong>{new Date().toLocaleString()}</strong></div>
                        <div><span>Sessions</span><strong>{sessions.length}</strong></div>
                        <div><span>Baseline</span><strong>Established ({baseline!.count} sessions)</strong></div>
                        <div><span>Span</span><strong>{daySpan} days</strong></div>
                    </div>
                </div>

                {/* Summary */}
                <div className="report-section">
                    <h2>Executive Summary</h2>
                    <div className="report-summary">
                        <div dangerouslySetInnerHTML={{ __html: last.summary }} />
                        <br />
                        Longitudinal trend: <strong>{deg.trend}</strong> (velocity {deg.velocity != null ? (deg.velocity > 0 ? '+' : '') + deg.velocity : 'N/A'} risk/session). {sessions.length} sessions spanning {daySpan} days.
                    </div>
                </div>

                {/* Risk Score */}
                <div className="report-section">
                    <h2>Risk Score</h2>
                    <div className="rpt-risk-row">
                        <div className="rpt-risk-num" style={{ color: riskColor(last.riskScore) }}>{last.riskScore ?? '—'}</div>
                        <div className="rpt-risk-bar-wrap">
                            <div className="rpt-risk-bar"><div className="rpt-risk-fill" style={{ width: rs + '%' }} /></div>
                            <div className="rpt-bar-labels"><span>0 Low</span><span>50 Moderate</span><span>100 High</span></div>
                        </div>
                    </div>
                </div>

                {/* Degradation Table */}
                <div className="report-section">
                    <h2>Linguistic Degradation Metrics</h2>
                    <table className="rpt-table">
                        <thead><tr><th>Feature</th><th>Baseline</th><th>Latest</th><th>Z-Score</th><th>Status</th></tr></thead>
                        <tbody>
                            {Object.entries(FEAT_CFG).map(([k, cfg]) => {
                                const bv = baseline!.means[k], lv = (last.features as any)[k], zv = last.zScores?.[k];
                                const zStr = zv != null ? zv.toFixed(2) : '—';
                                const status = zv == null ? '—' : Math.abs(zv) < 0.5 ? 'Normal' : (cfg.direction === 'lower' ? zv > 0.5 : zv < -0.5) ? '⚠ Impacted' : 'Normal';
                                return (
                                    <tr key={k}>
                                        <td>{cfg.label}</td>
                                        <td style={{ fontFamily: 'var(--font-mono)' }}>{formatVal(k, bv)}</td>
                                        <td style={{ fontFamily: 'var(--font-mono)' }}>{formatVal(k, lv)}</td>
                                        <td style={{ fontFamily: 'var(--font-mono)', color: parseFloat(zStr) > 0.5 ? 'var(--danger)' : parseFloat(zStr) < -0.5 ? 'var(--teal)' : 'var(--muted)' }}>{zStr}σ</td>
                                        <td style={{ fontSize: '.8rem' }}>{status}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Domain Report */}
                <div className="report-section">
                    <h2>Cognitive Domain Impact</h2>
                    <div className="domain-report">
                        {Object.entries(DOMAIN_CFG).map(([dk, cfg]) => {
                            const score = last.cognitiveDomains ? (last.cognitiveDomains as any)[dk] ?? 0 : 0;
                            const cls = score < 25 ? 'low' : score < 50 ? 'mod' : 'high';
                            return (
                                <div key={dk} className="dom-report-card">
                                    <div className="dom-report-head">
                                        <span>{cfg.icon} {cfg.label}</span>
                                        <span style={{ color: riskColor(score), fontFamily: 'var(--font-head)' }}>{score}</span>
                                    </div>
                                    <div className="dom-score-bar"><div className={`dom-score-fill ${cls}`} style={{ width: score + '%' }} /></div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Explanation */}
                <div className="report-section">
                    <h2>Explanation</h2>
                    <div className="rpt-explain">
                        <div dangerouslySetInnerHTML={{ __html: last.summary }} />
                        {last.topFeatures.length > 0 && (
                            <p style={{ marginTop: 10 }}>
                                Top contributing indicators: {last.topFeatures.map(t => `<strong>${t.label}</strong> (${t.riskZ > 0 ? '▲' : '▼'}${Math.abs(t.riskZ).toFixed(2)}σ)`).join(', ')}.
                            </p>
                        )}
                        <p style={{ marginTop: 10, fontSize: '.78rem', color: 'var(--muted)' }}>All comparisons are relative to your personal linguistic baseline, not a population average. σ = standard deviations from baseline mean.</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="rpt-footer">
                    <p>⚠ This tool is a research prototype and does not constitute medical advice. Consult a qualified neurologist for clinical assessment.</p>
                    <div className="rpt-actions">
                        <button className="btn btn-glass" onClick={() => window.print()}>🖨 Print</button>
                        <button className="btn btn-primary" onClick={exportJSON}>⬇ Export JSON</button>
                        <button className="btn btn-danger" onClick={handleClear}>🗑 Clear All Data</button>
                    </div>
                </div>

            </div>
        </div>
    );
}
