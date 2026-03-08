import React, { useRef, useEffect } from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';
import { useApp } from '../context/AppContext';
import { riskColor, riskBand, computeDegradation, DOMAIN_CFG, computeRiskScore, computeZScores, computeDomainScores, computeFatigue, ageCalibration } from '../utils/nlp';
import type { ViewName } from '../types';
import AgeCard from './AgeCard';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

export default function Dashboard({ onNavigate }: { onNavigate: (v: ViewName) => void }) {
    const { sessions, baseline, age } = useApp();
    const last = sessions[sessions.length - 1] || null;
    const gaugeRef = useRef<HTMLCanvasElement>(null);

    // ── Recompute scores live using current age calibration ──
    const z = last && baseline ? computeZScores(last.features, baseline) : null;
    const rs = z ? computeRiskScore(z, age) : (last?.riskScore ?? null);
    const doms = z ? computeDomainScores(z, age) : (last?.cognitiveDomains ?? null);
    const fat = last ? computeFatigue(last.features, baseline, age) : null;
    const band = riskBand(rs);

    // Show age calibration note
    const { riskMultiplier } = ageCalibration(age);
    const ageNote = age
        ? riskMultiplier < 1
            ? `Age ${age} · protective factor applied (×${riskMultiplier.toFixed(2)})`
            : riskMultiplier > 1
                ? `Age ${age} · elevated risk factor applied (×${riskMultiplier.toFixed(2)})`
                : `Age ${age} · baseline risk profile`
        : 'Enter age above to calibrate scores';

    // ── Draw gauge ──
    useEffect(() => {
        const canvas = gaugeRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        const cx = 100, cy = 110, r = 82;
        const startA = -Math.PI * 1.1;
        ctx.clearRect(0, 0, 200, 220);
        ctx.beginPath(); ctx.arc(cx, cy, r, startA, startA + Math.PI * 2.2);
        ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.stroke();
        if (rs != null) {
            const fillEnd = startA + (rs / 100) * Math.PI * 2.2;
            const grad = ctx.createLinearGradient(20, 0, 180, 0);
            grad.addColorStop(0, '#00d4aa'); grad.addColorStop(0.5, '#fbbf24'); grad.addColorStop(1, '#ff4757');
            ctx.beginPath(); ctx.arc(cx, cy, r, startA, fillEnd);
            ctx.strokeStyle = grad; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.stroke();
        }
    }, [rs]);

    const deg = computeDegradation(sessions);

    // Baseline ring math
    const n = Math.min(sessions.length, 3);
    const circ = 2 * Math.PI * 34;
    const dashArr = `${(n / 3) * circ} ${circ}`;

    // Radar data (uses live age-calibrated doms)
    const radarData = {
        labels: Object.values(DOMAIN_CFG).map(d => d.label),
        datasets: [{
            data: doms ? Object.keys(DOMAIN_CFG).map(k => (doms as any)[k]) : [0, 0, 0, 0],
            backgroundColor: 'rgba(79,139,255,.15)',
            borderColor: 'rgba(79,139,255,.7)',
            pointBackgroundColor: '#4f8bff', pointRadius: 4,
        }],
    };

    return (
        <div className="view active">
            <div className="view-header dash-header-row">
                <div>
                    <h1>Neural Health Dashboard</h1>
                    <p>{baseline?.established
                        ? `Baseline established · ${sessions.length} sessions · Risk scoring active`
                        : `${sessions.length}/3 sessions — ${Math.max(0, 3 - sessions.length)} more needed to activate risk scoring`}</p>
                    <p style={{ fontSize: '0.78rem', color: age ? 'var(--teal)' : 'var(--muted)', marginTop: 2 }}>🧬 {ageNote}</p>
                </div>
                <AgeCard />
            </div>
            <div className="dash-grid">

                {/* Risk Gauge */}
                <div className="glass-card gauge-card">
                    <div className="card-label">Neuroinflammation Risk Score</div>
                    <div className="gauge-wrap">
                        <canvas ref={gaugeRef} width={200} height={200} />
                        <div className="gauge-overlay">
                            <div className="gauge-num" style={{ color: riskColor(rs) }}>{rs ?? '—'}</div>
                            <div className="gauge-band">{band.label}</div>
                        </div>
                    </div>
                    <div className="risk-key">
                        <span className="rk low">Low &lt;25</span>
                        <span className="rk mod">Moderate 25–50</span>
                        <span className="rk elev">Elevated 50–75</span>
                        <span className="rk high">High &gt;75</span>
                    </div>
                </div>

                {/* Radar */}
                <div className="glass-card radar-card">
                    <div className="card-label">Cognitive Domain Impact</div>
                    <div className="radar-wrap">
                        <Radar data={radarData} options={{
                            animation: { duration: 600 },
                            plugins: { legend: { display: false } },
                            scales: { r: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,.06)' }, angleLines: { color: 'rgba(255,255,255,.06)' }, ticks: { color: '#5a6a9a', backdropColor: 'transparent', font: { size: 9 } }, pointLabels: { color: '#dde4f5', font: { size: 11 } } } },
                        }} />
                    </div>
                    <div className="domain-pills">
                        {Object.entries(DOMAIN_CFG).map(([dk, cfg]) => (
                            <span key={dk} className="dpill">
                                {cfg.icon} {cfg.label} <b>{doms ? (doms as any)[dk] : '—'}</b>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Baseline */}
                <div className="glass-card baseline-card">
                    <div className="card-label">Personal Baseline Profile</div>
                    <div className="baseline-ring-wrap">
                        <div className="baseline-ring">
                            <svg viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
                                <circle className="ring-bg" cx="40" cy="40" r="34" />
                                <circle className="ring-fill" cx="40" cy="40" r="34" style={{ strokeDasharray: dashArr }} />
                            </svg>
                            <div className="ring-text"><span>{sessions.length}</span>/3</div>
                        </div>
                        <div className="baseline-info">
                            {baseline?.established
                                ? <p>Baseline <strong style={{ color: 'var(--teal)' }}>established</strong> from {baseline.count} sessions.</p>
                                : <p>Record <strong>{3 - sessions.length} more session(s)</strong> to build your linguistic identity profile.</p>}
                        </div>
                    </div>
                    {baseline?.established && (
                        <div className="baseline-mini">
                            {['ttr', 'speechRate', 'coherenceScore', 'complexityScore'].map(k => (
                                <div key={k} className="bmini-row">
                                    <span>{k === 'ttr' ? 'TTR' : k === 'speechRate' ? 'WPM' : k === 'coherenceScore' ? 'Coherence' : 'Complexity'}</span>
                                    <b>{k === 'speechRate' ? baseline.means[k].toFixed(0) : (baseline.means[k] * 100).toFixed(1) + '%'}</b>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Last Session */}
                <div className="glass-card last-session-card">
                    <div className="card-label">Last Session</div>
                    {last ? (
                        <>
                            <div className="last-sess-grid">
                                {[
                                    { val: last.riskScore ?? '—', lbl: 'Risk Score' },
                                    { val: last.features.wordCount, lbl: 'Words' },
                                    { val: last.features.speechRate.toFixed(0), lbl: 'WPM' },
                                    { val: (last.features.ttr * 100).toFixed(0) + '%', lbl: 'TTR' },
                                ].map(item => (
                                    <div key={item.lbl} className="lsg-item">
                                        <div className="lsg-val">{item.val}</div>
                                        <div className="lsg-lbl">{item.lbl}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="lsg-meta">
                                <span className="lsg-tag">{last.taskType.replace(/_/g, ' ')}</span>
                                <span className="lsg-tag">{new Date(last.timestamp).toLocaleDateString()}</span>
                                <span className="lsg-tag">{last.duration}s</span>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">🎙</div>
                            <p>No sessions yet</p>
                            <button className="btn btn-primary" onClick={() => onNavigate('record')}>Start Now →</button>
                        </div>
                    )}
                </div>

                {/* Fatigue */}
                <div className="glass-card fatigue-card">
                    <div className="card-label">Short-Term Cognitive Fatigue</div>
                    <div className="fatigue-score-wrap">
                        <div className="fatigue-score">{fat?.overall ?? '—'}</div>
                        <div className="fatigue-lbl">Fatigue Index</div>
                    </div>
                    <div className="fatigue-rows">
                        {[
                            { id: 'hesitation', label: 'Hesitation', val: fat?.hesitation ?? 0 },
                            { id: 'slowdown', label: 'Speech Slowdown', val: fat?.slowdown ?? 0 },
                            { id: 'complexity', label: 'Complexity Drop', val: fat?.complexityDrop ?? 0 },
                        ].map(row => (
                            <div key={row.id} className="fat-row">
                                <span>{row.label}</span>
                                <div className="fat-bar"><div className="fat-fill" style={{ width: row.val + '%' }} /></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Degradation Velocity */}
                <div className="glass-card velocity-card">
                    <div className="card-label">Longitudinal Degradation</div>
                    <div className="vel-grid">
                        <div className="vel-box">
                            <div className="vel-val" style={{ color: deg.velocity != null ? riskColor(deg.velocity > 0 ? 60 : 20) : 'var(--muted)' }}>
                                {deg.velocity != null ? `${deg.velocity > 0 ? '+' : ''}${deg.velocity}` : '—'}
                            </div>
                            <div className="vel-lbl">Velocity</div>
                            <div className="vel-sub">Δ risk / session</div>
                        </div>
                        <div className="vel-divider" />
                        <div className="vel-box">
                            <div className="vel-val">
                                {deg.acceleration != null ? `${deg.acceleration > 0 ? '+' : ''}${deg.acceleration}` : '—'}
                            </div>
                            <div className="vel-lbl">Acceleration</div>
                            <div className="vel-sub">Δ of Δ</div>
                        </div>
                    </div>
                    <div className={`trend-chip ${deg.trend}`}>
                        {deg.trend === 'awaiting' ? 'Awaiting data' : deg.trend.charAt(0).toUpperCase() + deg.trend.slice(1)}
                    </div>
                </div>

            </div>
        </div>
    );
}
