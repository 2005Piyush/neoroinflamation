import React from 'react';
import { useApp } from '../context/AppContext';
import { FEAT_CFG, featureNorm, formatVal, DOMAIN_CFG } from '../utils/nlp';
import { getAgeGroup } from './AgeCard';
import type { ViewName } from '../types';

function groupScore(group: string, z: Record<string, number> | null): string {
    if (!z) return 'No baseline';
    const map: Record<string, string[]> = {
        lexical: ['ttr', 'vocabularyRichness', 'repetitionRate'],
        syntactic: ['avgSentenceLength', 'complexityScore', 'clauseRatio'],
        semantic: ['coherenceScore', 'topicDriftIndex'],
        temporal: ['speechRate'],
        discourse: ['transitionRatio', 'redundancyIndex'],
    };
    const keys = map[group] || [];
    let risk = 0, cnt = 0;
    for (const k of keys) {
        if (z[k] == null) continue;
        const rz = FEAT_CFG[k].direction === 'higher' ? -z[k] : z[k];
        risk += Math.max(0, rz); cnt++;
    }
    if (!cnt) return 'No baseline';
    const r = Math.min(100, Math.round((risk / cnt) * 40));
    return r < 25 ? 'Healthy' : r < 50 ? 'Moderate' : r < 75 ? 'Elevated' : 'Impaired';
}
function badgeCls(s: string) { return { Healthy: 'good', Moderate: 'warn', Elevated: 'bad', Impaired: 'bad' }[s] || 'neutral'; }

const GROUPS: { id: string; icon: string; label: string; keys: string[] }[] = [
    { id: 'lexical', icon: '📝', label: 'Lexical', keys: ['ttr', 'vocabularyRichness', 'repetitionRate'] },
    { id: 'syntactic', icon: '🔗', label: 'Syntactic', keys: ['avgSentenceLength', 'complexityScore', 'clauseRatio'] },
    { id: 'semantic', icon: '💡', label: 'Semantic', keys: ['coherenceScore', 'topicDriftIndex'] },
    { id: 'temporal', icon: '⏱', label: 'Temporal', keys: ['speechRate', 'wordCount', 'sentenceCount'] },
    { id: 'discourse', icon: '🔄', label: 'Discourse', keys: ['transitionRatio', 'redundancyIndex'] },
];

export default function Analysis({ onNavigate }: { onNavigate: (v: ViewName) => void }) {
    const { sessions } = useApp();
    const last = sessions[sessions.length - 1] || null;

    if (!last) return (
        <div className="view active">
            <div className="view-header"><h1>Linguistic Analysis</h1></div>
            <div className="empty-full">
                <div className="empty-icon" style={{ fontSize: '3rem' }}>🔬</div>
                <p>No session yet.</p>
                <button className="btn btn-primary" onClick={() => onNavigate('record')}>Record Session</button>
            </div>
        </div>
    );

    const f = last.features;
    const z = last.zScores;
    const top = last.topFeatures;
    const sessionAge = last.age ?? null;
    const ageGroup = sessionAge ? getAgeGroup(sessionAge) : null;

    return (
        <div className="view active">
            <div className="view-header">
                <h1>Linguistic Analysis</h1>
                <p>Session {last.sessionNumber} · {last.taskType.replace(/_/g, ' ')} · {new Date(last.timestamp).toLocaleDateString()} · {f.wordCount} words
                    {sessionAge ? <span style={{ color: 'var(--teal)', marginLeft: 8 }}>· Age {sessionAge}</span> : null}
                </p>
            </div>
            <div className="analysis-grid">

                {/* Age Context Card */}
                {ageGroup ? (
                    <div className="glass-card age-context-card">
                        <div className="card-label">AI Analysis Context</div>
                        <div className="age-ctx-body">
                            <div className="age-ctx-icon">{ageGroup.icon}</div>
                            <div className="age-ctx-info">
                                <div className="age-ctx-row">
                                    <span className="age-ctx-lbl">User Age</span>
                                    <span className="age-ctx-val" style={{ color: ageGroup.color }}>{sessionAge} years</span>
                                </div>
                                <div className="age-ctx-row">
                                    <span className="age-ctx-lbl">Age Category</span>
                                    <span className="age-ctx-val" style={{ color: ageGroup.color }}>{ageGroup.label}</span>
                                </div>
                                <div className="age-ctx-row">
                                    <span className="age-ctx-lbl">AI Baseline Model</span>
                                    <span className="age-ctx-val">{ageGroup.baseline}</span>
                                </div>
                                <div className="age-ctx-desc">Speech patterns are compared to the {ageGroup.baseline} reference. Age-adjusted risk multipliers are applied to all domain scores.</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="glass-card age-context-card">
                        <div className="card-label">AI Analysis Context</div>
                        <p style={{ color: '#ff8232', fontSize: '0.85rem' }}>⚠ No age recorded for this session. Return to Dashboard and set your age for calibrated results.</p>
                    </div>
                )}

                {GROUPS.map(grp => {
                    const score = groupScore(grp.id, z);
                    return (
                        <div key={grp.id} className="glass-card feat-card">
                            <div className="feat-head">
                                <span className="feat-icon">{grp.icon}</span>
                                <div>
                                    <div className="card-label">{grp.label} Features</div>
                                    <div className={`feat-badge ${badgeCls(score)}`}>{score}</div>
                                </div>
                            </div>
                            <div className="feat-metrics">
                                {grp.keys.map(k => {
                                    const val = (f as any)[k] as number;
                                    const cfg = FEAT_CFG[k];
                                    const zv = z?.[k];
                                    const norm = featureNorm(k, val);
                                    const devCls = zv != null
                                        ? cfg?.direction === 'higher' ? (zv < -0.5 ? 'pos' : 'neg') : (zv > 0.5 ? 'pos' : 'neg')
                                        : '';
                                    return (
                                        <div key={k} className="metric-row">
                                            <div className="metric-top">
                                                <span className="metric-key">{cfg?.label || k}</span>
                                                <span className="metric-val">
                                                    {formatVal(k, val)}
                                                    {zv != null && (
                                                        <span className={`metric-dev ${devCls}`} style={{ marginLeft: 6 }}>
                                                            {zv > 0 ? '▲' : '▼'}{Math.abs(zv).toFixed(2)}σ
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="mbar"><div className="mfill" style={{ width: norm + '%' }} /></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {/* Explainability */}
                <div className="glass-card explain-card">
                    <div className="feat-head">
                        <span className="feat-icon">🧩</span>
                        <div><div className="card-label">AI Explainability</div></div>
                    </div>
                    <div className="top-features">
                        {top.length ? top.map((tf, i) => (
                            <div key={tf.key} className="tf-row">
                                <div className="tf-rank">{i + 1}</div>
                                <div className="tf-lbl">{tf.label}</div>
                                <div className="tf-delta">{tf.riskZ > 0 ? '▲' : ''} {tf.riskZ.toFixed(2)}σ</div>
                            </div>
                        )) : <p style={{ color: 'var(--muted)', fontSize: '.82rem' }}>Baseline not yet established. Score 3 sessions first.</p>}
                    </div>
                    <div className="ai-summary" dangerouslySetInnerHTML={{ __html: last.summary }} />
                </div>

            </div>
        </div>
    );
}
