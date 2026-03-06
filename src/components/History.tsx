import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { useApp } from '../context/AppContext';
import { riskColor, riskBand, FEAT_CFG, TASK_LABELS } from '../utils/nlp';
import type { ViewName } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const FEAT_TABS = [
    { key: 'ttr', label: 'TTR' },
    { key: 'speechRate', label: 'WPM' },
    { key: 'coherenceScore', label: 'Coherence' },
    { key: 'complexityScore', label: 'Complexity' },
];

const CHART_OPTS = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(10,16,40,.95)', titleColor: '#4f8bff', bodyColor: '#dde4f5', borderColor: 'rgba(79,139,255,.2)', borderWidth: 1 } },
    scales: {
        x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#5a6a9a', font: { size: 10 } } },
        y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#5a6a9a', font: { size: 10 } } },
    },
};

export default function History({ onNavigate }: { onNavigate: (v: ViewName) => void }) {
    const { sessions } = useApp();
    const [featKey, setFeatKey] = useState('ttr');

    if (!sessions.length) return (
        <div className="view active">
            <div className="view-header"><h1>Session History</h1></div>
            <div className="empty-full">
                <div className="empty-icon" style={{ fontSize: '3rem' }}>📈</div>
                <p>No history yet.</p>
                <button className="btn btn-primary" onClick={() => onNavigate('record')}>Record Session</button>
            </div>
        </div>
    );

    const labels = sessions.map(s => `S${s.sessionNumber}`);

    const riskDataset = {
        label: 'Risk Score',
        data: sessions.map(s => s.riskScore),
        borderColor: '#ff4757', backgroundColor: 'rgba(255,71,87,.15)',
        tension: 0.4, pointBackgroundColor: '#ff4757', pointRadius: 5, fill: true,
    };

    const featDataset = {
        label: FEAT_CFG[featKey]?.label || featKey,
        data: sessions.map(s => (s.features as any)[featKey]),
        borderColor: '#4f8bff', backgroundColor: 'rgba(79,139,255,.15)',
        tension: 0.4, pointBackgroundColor: '#4f8bff', pointRadius: 5, fill: true,
    };

    return (
        <div className="view active">
            <div className="view-header">
                <h1>Session History</h1>
                <p>Longitudinal linguistic trend analysis across {sessions.length} sessions.</p>
            </div>
            <div className="history-layout">

                <div className="glass-card chart-card">
                    <div className="card-label">Risk Score Over Time</div>
                    <div className="chart-wrap">
                        <Line data={{ labels, datasets: [riskDataset] }} options={{ ...CHART_OPTS, scales: { ...CHART_OPTS.scales, y: { ...CHART_OPTS.scales.y, min: 0, max: 100 } } }} />
                    </div>
                </div>

                <div className="glass-card chart-card">
                    <div className="card-label">
                        Linguistic Feature Trend
                        <span className="feat-tabs">
                            {FEAT_TABS.map(t => (
                                <button key={t.key} className={`ft${featKey === t.key ? ' active' : ''}`} onClick={() => setFeatKey(t.key)}>
                                    {t.label}
                                </button>
                            ))}
                        </span>
                    </div>
                    <div className="chart-wrap">
                        <Line data={{ labels, datasets: [featDataset] }} options={CHART_OPTS as any} />
                    </div>
                </div>

                <div className="glass-card table-card">
                    <div className="card-label">All Sessions</div>
                    <div className="tbl-wrap">
                        <table className="sess-table">
                            <thead>
                                <tr><th>#</th><th>Date</th><th>Task</th><th>Words</th><th>WPM</th><th>TTR</th><th>Coherence</th><th>Risk</th></tr>
                            </thead>
                            <tbody>
                                {sessions.map(s => {
                                    const rb = riskBand(s.riskScore);
                                    return (
                                        <tr key={s.id}>
                                            <td>{s.sessionNumber}</td>
                                            <td>{new Date(s.timestamp).toLocaleDateString()}</td>
                                            <td>{TASK_LABELS[s.taskType]}</td>
                                            <td>{s.features.wordCount}</td>
                                            <td>{s.features.speechRate.toFixed(0)}</td>
                                            <td>{(s.features.ttr * 100).toFixed(1)}%</td>
                                            <td>{(s.features.coherenceScore * 100).toFixed(1)}%</td>
                                            <td><span className={`risk-pill ${rb.cls}`}>{s.riskScore ?? '—'}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
