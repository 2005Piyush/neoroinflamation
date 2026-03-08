import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
    extractFeatures, buildBaseline, computeZScores, computeRiskScore,
    computeDomainScores, computeFatigue, topRiskFeatures, generateSummary, TASK_PROMPTS, TASK_LABELS,
} from '../utils/nlp';
import type { Session, TaskType } from '../types';

const TASKS: TaskType[] = ['story_narration', 'descriptive', 'word_association', 'recall'];

export default function RecordSession() {
    const { sessions, baseline, addSession, age } = useApp();
    const [task, setTask] = useState<TaskType>('story_narration');
    const [recording, setRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [textInput, setTextInput] = useState('');
    const [timer, setTimer] = useState('00:00');
    const [status, setStatus] = useState('Click to start recording');
    const [speechOk, setSpeechOk] = useState(true);

    const recRef = useRef<any>(null);
    const startRef = useRef<number>(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) setSpeechOk(false);
    }, []);

    const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length
        + textInput.trim().split(/\s+/).filter(Boolean).length;

    const stopRecording = useCallback(() => {
        setRecording(false);
        if (recRef.current) { recRef.current.onend = null; recRef.current.stop(); recRef.current = null; }
        if (timerRef.current) clearInterval(timerRef.current);
        setStatus('Recording stopped. Click Analyse to process.');
    }, []);

    const startRecording = useCallback(() => {
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) return;
        setTranscript(''); setTextInput('');
        startRef.current = Date.now();
        setRecording(true);
        setStatus('● Recording…');
        timerRef.current = setInterval(() => {
            const s = Math.floor((Date.now() - startRef.current) / 1000);
            setTimer(`${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`);
        }, 1000);
        const rec = new SR();
        rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US';
        let final = '';
        rec.onresult = (e: any) => {
            let interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const t = e.results[i][0].transcript;
                e.results[i].isFinal ? (final += t + ' ') : (interim += t);
            }
            setTranscript(final + interim);
        };
        rec.onerror = () => stopRecording();
        rec.onend = () => { if (recRef.current) rec.start(); };
        rec.start(); recRef.current = rec;
    }, [stopRecording]);

    const toggleRecording = () => recording ? stopRecording() : startRecording();

    const clearAll = () => {
        stopRecording(); setTranscript(''); setTextInput(''); setTimer('00:00');
        setStatus('Click to start recording');
    };

    const analyse = () => {
        // Block analysis if age not set
        if (!age) {
            alert('Please enter and save your age in the Dashboard → User Information section before running analysis.');
            return;
        }
        const text = transcript || textInput;
        if (!text.trim() || text.trim().split(/\s+/).length < 30) {
            alert('Provide at least 30 words for meaningful analysis.'); return;
        }
        const durationSec = startRef.current > 0 ? (Date.now() - startRef.current) / 1000 : text.trim().split(/\s+/).length / 2.3;
        const features = extractFeatures(text, durationSec);
        const sessionNum = sessions.length + 1;
        const bl = buildBaseline([...sessions, { features } as any]);
        const z = computeZScores(features, bl);
        const rs = computeRiskScore(z, age);          // age-calibrated
        const doms = computeDomainScores(z, age);     // age-calibrated
        const fat = computeFatigue(features, baseline, age); // age-calibrated
        const top = topRiskFeatures(z);
        const summary = generateSummary(sessionNum, rs, features, doms, z, baseline);

        const session: Session = {
            id: Date.now(), sessionNumber: sessionNum, timestamp: Date.now(),
            taskType: task, transcript: text, duration: Math.round(durationSec),
            features, zScores: z, riskScore: rs, cognitiveDomains: doms,
            fatigueScore: fat, topFeatures: top, summary,
            age,   // store age used for this session
        };
        stopRecording();
        addSession(session);
        clearAll();
    };

    const displayText = transcript || textInput;

    return (
        <div className="view active">
            <div className="view-header">
                <h1>Record Session</h1>
                <p>Speak or type your response. Your linguistic patterns will be extracted and analysed.</p>
            </div>
            <div className="record-layout">

                {/* Task Selector */}
                <div className="glass-card task-card">
                    <div className="card-label">Select Task Type</div>
                    <div className="task-pills">
                        {TASKS.map(t => (
                            <button key={t} className={`tpill${task === t ? ' active' : ''}`} onClick={() => setTask(t)}>
                                {t === 'story_narration' ? '📖' : t === 'descriptive' ? '🏠' : t === 'word_association' ? '🔤' : '🧠'} {TASK_LABELS[t]}
                            </button>
                        ))}
                    </div>
                    <div className="prompt-box">
                        <div className="prompt-lbl">Task Prompt</div>
                        <div className="prompt-text">{TASK_PROMPTS[task]}</div>
                    </div>
                </div>

                {/* Recording Controls */}
                <div className="glass-card rec-card">
                    <div className="card-label">Voice Recording</div>
                    <div className="rec-center">
                        <div className="rec-timer">{timer}</div>
                        <button className={`rec-btn${recording ? ' recording' : ''}`} onClick={toggleRecording} disabled={!speechOk}>
                            <span>{recording ? '⏹' : '🎙'}</span>
                        </button>
                        <div className="rec-status">{!speechOk ? 'Voice not available — use Chrome/Edge or type below' : status}</div>
                    </div>
                    <div className="or-sep"><span>or type below</span></div>
                    <textarea
                        value={textInput}
                        onChange={e => setTextInput(e.target.value)}
                        placeholder="Type your response here…"
                        rows={5}
                    />
                    <div className="rec-actions">
                        <button className="btn btn-glass" onClick={clearAll}>✕ Clear</button>
                        <button className="btn btn-primary" onClick={analyse}>Analyse Session →</button>
                    </div>
                </div>

                {/* Transcript */}
                <div className="glass-card transcript-card">
                    <div className="card-label">
                        Live Transcript
                        <span className="word-badge">{wordCount} words</span>
                    </div>
                    <div className="transcript-area">
                        {displayText
                            ? <span>{displayText}</span>
                            : <span className="transcript-ph">Your speech transcription will appear here in real time…</span>}
                    </div>
                </div>

            </div>
        </div>
    );
}
