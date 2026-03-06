'use strict';
// ═══════════════════════════════════════════════════════
//  NeurOlingo AI — Full Application Engine
//  NLP Feature Extraction · Baseline Learning · Risk Scoring
// ═══════════════════════════════════════════════════════

// ── Constants ──────────────────────────────────────────
const TASK_PROMPTS = {
  story_narration:  'Please narrate a story or describe a memorable event from your life in as much detail as you can.',
  descriptive:      'Describe your home, workplace, or a familiar location in as much detail as possible. Include spatial relationships, objects, and atmosphere.',
  word_association: 'Starting with the word "nature", say the first word each one makes you think of and explain the connection. Keep going for at least two minutes.',
  recall:           'Describe your entire yesterday from waking up to going to sleep — activities, conversations, how you felt at each stage.'
};

const TASK_LABELS = { story_narration:'Story Narration', descriptive:'Descriptive', word_association:'Word Association', recall:'Cognitive Recall' };

const STOPWORDS = new Set('a an the and or but in on at to for of with by from up about into through during is are was were be been being have has had do does did will would could should may might must shall can i me my we our you your it its they them this that these those he him she her so if as then than not no nor yet both either neither each every all any few more most other some such same own just very too also'.split(' '));

const CLAUSE_WORDS = new Set('which that who whom when where while although because since unless if though whereas after before until whether whatever whoever whichever'.split(' '));
const TRANSITION_WORDS = new Set('however therefore furthermore moreover consequently meanwhile subsequently additionally although nevertheless thus hence first second third finally next also besides indeed whereas conversely alternatively specifically particularly accordingly'.split(' '));

// Feature weights: direction = which direction is better, weight = risk contribution
const FEAT_CFG = {
  ttr:               { label:'Type-Token Ratio',        direction:'higher', weight:2.5 },
  vocabularyRichness:{ label:'Vocabulary Richness',     direction:'higher', weight:2.0 },
  repetitionRate:    { label:'Repetition Rate',         direction:'lower',  weight:1.5 },
  avgSentenceLength: { label:'Avg Sentence Length',     direction:'higher', weight:1.2 },
  complexityScore:   { label:'Syntactic Complexity',    direction:'higher', weight:2.0 },
  clauseRatio:       { label:'Clause Ratio',            direction:'higher', weight:1.0 },
  coherenceScore:    { label:'Semantic Coherence',      direction:'higher', weight:2.5 },
  topicDriftIndex:   { label:'Topic Drift Index',       direction:'lower',  weight:1.5 },
  speechRate:        { label:'Speech Rate (WPM)',        direction:'higher', weight:1.5 },
  transitionRatio:   { label:'Transition Word Ratio',   direction:'higher', weight:1.0 },
  redundancyIndex:   { label:'Redundancy Index',        direction:'lower',  weight:1.0 },
};

const DOMAIN_CFG = {
  attention:         { label:'Attention',         icon:'👁',  feats:['speechRate','repetitionRate'] },
  workingMemory:     { label:'Working Memory',    icon:'💾',  feats:['topicDriftIndex','redundancyIndex'] },
  executiveControl:  { label:'Executive Control', icon:'⚙',   feats:['complexityScore','clauseRatio'] },
  semanticRetrieval: { label:'Semantic Retrieval',icon:'🔍',  feats:['ttr','vocabularyRichness'] },
};

// ── NLP Utilities ──────────────────────────────────────
function tokenize(text) {
  return (text.toLowerCase().match(/\b[a-z']+\b/g) || []).filter(w => w.length > 1);
}
function splitSentences(text) {
  return text.split(/(?<=[.!?])\s+|[.!?]\s*$/).map(s => s.trim()).filter(s => s.length > 4);
}
function bagOfWords(tokens) {
  const bag = {};
  tokens.forEach(t => bag[t] = (bag[t] || 0) + 1);
  return bag;
}
function cosine(a, b) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0, mA = 0, mB = 0;
  for (const k of keys) { const va = a[k]||0, vb = b[k]||0; dot+=va*vb; mA+=va*va; mB+=vb*vb; }
  return (mA>0&&mB>0) ? dot/(Math.sqrt(mA)*Math.sqrt(mB)) : 0;
}

// ── Feature Extraction ────────────────────────────────
function extractFeatures(transcript, durationSec) {
  const tokens    = tokenize(transcript);
  const sentences = splitSentences(transcript);
  const content   = tokens.filter(w => !STOPWORDS.has(w));
  const types     = new Set(tokens);
  const ctypes    = new Set(content);

  // Lexical
  const ttr               = tokens.length > 0 ? types.size / tokens.length : 0;
  const vocabularyRichness= tokens.length > 0 ? ctypes.size / Math.sqrt(tokens.length) : 0;
  const repetitionRate    = content.length > 0 ? Math.max(0, 1 - ctypes.size/content.length) : 0;

  // Syntactic
  const avgSentenceLength = sentences.length > 0 ? tokens.length / sentences.length : tokens.length;
  const clauseCount       = tokens.filter(w => CLAUSE_WORDS.has(w)).length;
  const clauseRatio       = sentences.length > 0 ? clauseCount / sentences.length : 0;
  const complexityScore   = Math.min(1, (Math.min(avgSentenceLength,25)/25)*0.6 + Math.min(clauseRatio/3,1)*0.4);

  // Semantic — pairwise cosine similarity of adjacent sentences
  let coherenceScore = 1, topicDriftIndex = 0;
  if (sentences.length >= 2) {
    const vecs = sentences.map(s => bagOfWords(tokenize(s).filter(w => !STOPWORDS.has(w))));
    let sim = 0;
    for (let i = 0; i < vecs.length-1; i++) sim += cosine(vecs[i], vecs[i+1]);
    coherenceScore   = sim / (vecs.length-1);
    topicDriftIndex  = 1 - coherenceScore;
  }

  // Temporal
  const speechRate = durationSec > 0 ? (tokens.length / durationSec) * 60 : 0;

  // Discourse
  const transTotal   = tokens.filter(w => TRANSITION_WORDS.has(w)).length;
  const transitionRatio = tokens.length > 0 ? transTotal / tokens.length : 0;
  const bigrams = [];
  for (let i = 0; i < content.length-1; i++) bigrams.push(content[i]+'_'+content[i+1]);
  const bigramTypes  = new Set(bigrams);
  const redundancyIndex = bigrams.length > 0 ? (bigrams.length-bigramTypes.size)/bigrams.length : 0;

  return {
    wordCount: tokens.length, sentenceCount: sentences.length,
    ttr: +ttr.toFixed(4), vocabularyRichness: +vocabularyRichness.toFixed(3), repetitionRate: +repetitionRate.toFixed(4),
    avgSentenceLength: +avgSentenceLength.toFixed(2), complexityScore: +complexityScore.toFixed(4), clauseRatio: +clauseRatio.toFixed(4),
    coherenceScore: +coherenceScore.toFixed(4), topicDriftIndex: +topicDriftIndex.toFixed(4),
    speechRate: +speechRate.toFixed(1), transitionRatio: +transitionRatio.toFixed(4), redundancyIndex: +redundancyIndex.toFixed(4),
  };
}

// ── Baseline Engine ───────────────────────────────────
function buildBaseline(sessions) {
  const keys = Object.keys(FEAT_CFG);
  const means = {}, stds = {};
  for (const k of keys) {
    const vals = sessions.map(s => s.features[k]).filter(v => !isNaN(v));
    if (!vals.length) { means[k]=0; stds[k]=0.0001; continue; }
    const m = vals.reduce((a,b)=>a+b,0)/vals.length;
    const v = vals.reduce((a,b)=>a+(b-m)**2,0)/vals.length;
    means[k]=m; stds[k]=Math.max(Math.sqrt(v),0.0001);
  }
  return { means, stds, count:sessions.length, established:sessions.length>=3 };
}

function zScores(features, baseline) {
  if (!baseline?.established) return null;
  const z = {};
  for (const k of Object.keys(FEAT_CFG)) z[k] = (features[k]-baseline.means[k])/baseline.stds[k];
  return z;
}

// ── Risk Scoring ──────────────────────────────────────
function riskScore(z) {
  if (!z) return null;
  let numerator = 0, denom = 0;
  for (const [k, cfg] of Object.entries(FEAT_CFG)) {
    if (z[k]==null) continue;
    const riskZ = cfg.direction==='higher' ? -z[k] : z[k];
    numerator += Math.max(0, riskZ) * cfg.weight;
    denom += cfg.weight;
  }
  return Math.round(Math.min(100, Math.max(0, (numerator/denom)*40)));
}

function domainScores(z) {
  if (!z) return { attention:0, workingMemory:0, executiveControl:0, semanticRetrieval:0 };
  const out = {};
  for (const [dk, cfg] of Object.entries(DOMAIN_CFG)) {
    let s=0,c=0;
    for (const fk of cfg.feats) {
      if (z[fk]==null) continue;
      const rz = FEAT_CFG[fk].direction==='higher' ? -z[fk] : z[fk];
      s+=Math.max(0,rz); c++;
    }
    out[dk] = c>0 ? Math.min(100,Math.round((s/c)*40)) : 0;
  }
  return out;
}

function fatigueScore(features, baseline) {
  const bsl = baseline?.established ? baseline.means : null;
  const bslWPM = bsl?.speechRate || 130;
  const bslCpx = bsl?.complexityScore || 0.5;
  const hesitation    = Math.min(100, Math.round(Math.max(0, (bslWPM - features.speechRate) / bslWPM * 100)));
  const slowdown      = Math.min(100, Math.round(Math.max(0, (bslWPM - features.speechRate) / bslWPM * 80)));
  const complexityDrop= Math.min(100, Math.round(Math.max(0, (bslCpx - features.complexityScore) / bslCpx * 100)));
  const overall       = Math.round((hesitation+slowdown+complexityDrop)/3);
  return { overall:Math.min(100,overall), hesitation, slowdown, complexityDrop };
}

function degradationVelocity(sessions) {
  const scored = sessions.filter(s => s.riskScore!=null);
  if (scored.length < 2) return { velocity:null, acceleration:null, trend:'awaiting' };
  const deltas = [];
  for (let i=1;i<scored.length;i++) deltas.push(scored[i].riskScore - scored[i-1].riskScore);
  const vel = deltas.reduce((a,b)=>a+b,0)/deltas.length;
  let accel = null;
  if (deltas.length >= 2) {
    const ad = []; for (let i=1;i<deltas.length;i++) ad.push(deltas[i]-deltas[i-1]);
    accel = ad.reduce((a,b)=>a+b,0)/ad.length;
  }
  const trend = vel>1?'declining':vel<-1?'improving':'stable';
  return { velocity:+vel.toFixed(2), acceleration:accel!=null?+accel.toFixed(2):null, trend };
}

function topRiskFeatures(z, n=3) {
  if (!z) return [];
  return Object.entries(FEAT_CFG)
    .map(([k,cfg]) => ({ key:k, label:cfg.label, riskZ: cfg.direction==='higher' ? -(z[k]||0) : (z[k]||0), z:z[k]||0, direction:cfg.direction }))
    .sort((a,b)=>b.riskZ-a.riskZ).slice(0,n);
}

function generateSummary(session, baseline) {
  const { riskScore:rs, features, cognitiveDomains:doms, zScores:z } = session;
  if (rs==null) {
    const remaining = 3-session.sessionNumber;
    return `Session ${session.sessionNumber} recorded (${features.wordCount} words, ${features.speechRate.toFixed(0)} WPM). <strong>${remaining>0?remaining+' more session(s)':'Baseline established'}</strong> needed before risk scoring begins.`;
  }
  const band = rs<25?'<strong style="color:var(--teal)">low</strong>':rs<50?'<strong style="color:var(--warn)">moderate</strong>':rs<75?'<strong style="color:#ff8232">elevated</strong>':'<strong style="color:var(--danger)">high</strong>';
  const topDom = Object.entries(doms).sort((a,b)=>b[1]-a[1])[0];
  const topDomLabel = DOMAIN_CFG[topDom[0]]?.label||topDom[0];
  const ttrNote = (z?.ttr||0)<-0.5?'reduced vocabulary diversity' : 'vocabulary diversity within normal range';
  const cohNote = (z?.coherenceScore||0)<-0.5?'some reduction in narrative coherence' : 'narrative coherence maintained';
  const bslWPM  = baseline?.means?.speechRate?.toFixed(0)||'—';
  return `Risk score: <strong>${rs}/100</strong> (${band}). Most impacted domain: <strong>${topDomLabel}</strong>. Analysis shows ${ttrNote} and ${cohNote}. Current speech rate: <strong>${features.speechRate.toFixed(0)} WPM</strong> (your baseline: ${bslWPM} WPM).`;
}

function riskBand(score) {
  if (score==null) return { label:'No Baseline', cls:'' };
  if (score<25)  return { label:'Low Risk',       cls:'low'  };
  if (score<50)  return { label:'Moderate Risk',  cls:'mod'  };
  if (score<75)  return { label:'Elevated Risk',  cls:'elev' };
  return             { label:'High Risk',          cls:'high' };
}
function riskColor(score) {
  if (score==null) return '#5a6a9a';
  if (score<25)  return '#00d4aa';
  if (score<50)  return '#fbbf24';
  if (score<75)  return '#ff8232';
  return '#ff4757';
}

// ── Chart Helpers ─────────────────────────────────────
const CHART_DEFAULTS = {
  color: '#dde4f5',
  plugins:{ legend:{ display:false }, tooltip:{ backgroundColor:'rgba(10,16,40,.95)', titleColor:'#4f8bff', bodyColor:'#dde4f5', borderColor:'rgba(79,139,255,.2)', borderWidth:1 } },
  scales: {
    x:{ grid:{ color:'rgba(255,255,255,.04)' }, ticks:{ color:'#5a6a9a', font:{size:10} } },
    y:{ grid:{ color:'rgba(255,255,255,.04)' }, ticks:{ color:'#5a6a9a', font:{size:10} } }
  }
};

// ── App Object ────────────────────────────────────────
const App = {
  state: {
    sessions: [], baseline: null,
    currentTask: 'story_narration', recording: false,
    recognition: null, transcript: '', startTime: null,
    timerInterval: null, currentFeatTab: 'ttr',
    charts: {}
  },

  init() {
    this.load();
    this.bindNav();
    this.bindRecord();
    this.bindFeatureTabs();
    this.updateNavCount();
    this.renderDashboard();
    this.checkSpeechSupport();
  },

  save() {
    try { localStorage.setItem('neurolingo_v3', JSON.stringify({ sessions:this.state.sessions, baseline:this.state.baseline })); }
    catch(e) { console.warn('Save failed:', e); }
  },
  load() {
    try {
      const d = JSON.parse(localStorage.getItem('neurolingo_v3')||'null');
      if (d) { this.state.sessions = d.sessions||[]; this.state.baseline = d.baseline||null; }
    } catch(e) {}
  },

  // ── Navigation ──────────────────────────────────────
  bindNav() {
    document.getElementById('nav-tabs').addEventListener('click', e => {
      const tab = e.target.closest('.nav-tab');
      if (tab) this.goTo(tab.dataset.view);
    });
  },
  goTo(view) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.view===view));
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id===`view-${view}`));
    if (view==='dashboard') this.renderDashboard();
    if (view==='analysis')  this.renderAnalysis();
    if (view==='history')   this.renderHistory();
    if (view==='report')    this.renderReport();
  },
  updateNavCount() {
    const n = this.state.sessions.length;
    document.getElementById('nav-session-count').textContent = `${n} session${n!==1?'s':''}`;
    const dot = document.getElementById('live-dot');
    dot.classList.toggle('on', n>0);
  },

  // ── Recording ───────────────────────────────────────
  checkSpeechSupport() {
    const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
    if (!SR) {
      const btn = document.getElementById('rec-btn');
      btn.disabled = true; btn.title = 'Speech recognition not supported';
      document.getElementById('rec-status').textContent = 'Voice not available in this browser — use Chrome or Edge. Type your response below.';
    }
  },
  bindRecord() {
    document.getElementById('task-pills').addEventListener('click', e => {
      const pill = e.target.closest('.tpill');
      if (!pill) return;
      document.querySelectorAll('.tpill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      this.state.currentTask = pill.dataset.task;
      document.getElementById('prompt-text').textContent = TASK_PROMPTS[this.state.currentTask];
    });
    document.getElementById('text-input').addEventListener('input', () => {
      const v = document.getElementById('text-input').value;
      if (v && !this.state.recording) {
        this.updateTranscript(v);
      }
    });
  },
  toggleRecording() {
    this.state.recording ? this.stopRecording() : this.startRecording();
  },
  startRecording() {
    const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
    if (!SR) return;
    this.state.transcript = '';
    this.state.startTime  = Date.now();
    this.state.recording  = true;
    const btn = document.getElementById('rec-btn');
    btn.classList.add('recording');
    document.getElementById('rec-btn-icon').textContent = '⏹';
    document.getElementById('rec-status').textContent   = '● Recording…';
    this.state.timerInterval = setInterval(() => this.updateTimer(), 1000);

    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang='en-US';
    let finalText = '';
    rec.onresult = e => {
      let interim='';
      for (let i=e.resultIndex;i<e.results.length;i++) {
        const t=e.results[i][0].transcript;
        e.results[i].isFinal?finalText+=t+' ':interim+=t;
      }
      this.state.transcript = finalText+interim;
      this.updateTranscript(this.state.transcript);
    };
    rec.onerror = err => { console.warn('SR error:', err); this.stopRecording(); };
    rec.onend = () => { if(this.state.recording) rec.start(); };
    rec.start();
    this.state.recognition = rec;
  },
  stopRecording() {
    this.state.recording = false;
    if (this.state.recognition) { this.state.recognition.onend=null; this.state.recognition.stop(); }
    clearInterval(this.state.timerInterval);
    const btn = document.getElementById('rec-btn');
    btn.classList.remove('recording');
    document.getElementById('rec-btn-icon').textContent = '🎙';
    document.getElementById('rec-status').textContent   = 'Recording stopped. Click Analyse to process.';
  },
  updateTimer() {
    const secs = Math.floor((Date.now()-this.state.startTime)/1000);
    const m=String(Math.floor(secs/60)).padStart(2,'0'), s=String(secs%60).padStart(2,'0');
    document.getElementById('rec-timer').textContent = `${m}:${s}`;
  },
  updateTranscript(text) {
    const area = document.getElementById('transcript-area');
    area.innerHTML = text ? `<span>${text}</span>` : `<span class="transcript-ph">Your speech transcription will appear here in real time…</span>`;
    const words = tokenize(text).length;
    document.getElementById('word-badge').textContent = `${words} words`;
  },
  clearSession() {
    this.state.transcript = '';
    this.state.recording && this.stopRecording();
    document.getElementById('text-input').value = '';
    document.getElementById('transcript-area').innerHTML = `<span class="transcript-ph">Your speech transcription will appear here in real time…</span>`;
    document.getElementById('word-badge').textContent = '0 words';
    document.getElementById('rec-timer').textContent   = '00:00';
  },

  // ── Session Analysis ────────────────────────────────
  analyseSession() {
    const text = this.state.transcript || document.getElementById('text-input').value;
    if (!text.trim() || tokenize(text).length < 30) {
      alert('Please provide a longer response (at least 30 words) for meaningful analysis.'); return;
    }
    const durationSec = this.state.startTime ? (Date.now()-this.state.startTime)/1000 : tokenize(text).length/2.3;
    const features    = extractFeatures(text, durationSec);
    const sessionNum  = this.state.sessions.length+1;

    // Update baseline using first 3 sessions (or all)
    const prevSessions = this.state.sessions;
    const baseSessions = prevSessions.length<3 ? [...prevSessions,{features}] : prevSessions.slice(-6).concat([{features}]);
    const baseline     = buildBaseline(baseSessions);
    this.state.baseline = baseline;

    const z     = zScores(features, baseline);
    const rs    = riskScore(z);
    const doms  = domainScores(z);
    const fat   = fatigueScore(features, baseline);
    const top   = topRiskFeatures(z);
    const summary = generateSummary({ sessionNumber:sessionNum, riskScore:rs, features, cognitiveDomains:doms, zScores:z }, baseline);

    const session = {
      id: Date.now(), sessionNumber:sessionNum,
      timestamp: Date.now(), taskType: this.state.currentTask,
      transcript: text, duration: Math.round(durationSec),
      features, zScores:z, riskScore:rs, cognitiveDomains:doms,
      fatigueScore:fat, topFeatures:top, summary
    };
    this.state.sessions.push(session);
    this.save();
    this.updateNavCount();
    this.clearSession();
    this.showModal(session);
  },

  showModal(session) {
    document.getElementById('modal-content').innerHTML = `
      <p>${session.summary}</p>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:12px;flex-wrap:wrap">
        <div style="text-align:center"><div style="font-family:var(--font-head);font-size:1.6rem;font-weight:700;color:var(--accent)">${session.features.wordCount}</div><div style="font-size:.72rem;color:var(--muted)">Words</div></div>
        <div style="text-align:center"><div style="font-family:var(--font-head);font-size:1.6rem;font-weight:700;color:var(--teal)">${session.riskScore!=null?session.riskScore:'—'}</div><div style="font-size:.72rem;color:var(--muted)">Risk Score</div></div>
        <div style="text-align:center"><div style="font-family:var(--font-head);font-size:1.6rem;font-weight:700;color:var(--accent)">${session.features.speechRate.toFixed(0)}</div><div style="font-size:.72rem;color:var(--muted)">WPM</div></div>
      </div>`;
    document.getElementById('modal-bg').classList.add('show');
  },
  closeModal() { document.getElementById('modal-bg').classList.remove('show'); },

  // ── Dashboard ───────────────────────────────────────
  renderDashboard() {
    const sessions = this.state.sessions;
    const last     = sessions[sessions.length-1];
    const baseline = this.state.baseline;

    // Risk gauge
    const rs = last?.riskScore??null;
    const band = riskBand(rs);
    document.getElementById('gauge-num').textContent = rs!=null?rs:'—';
    document.getElementById('gauge-band').textContent = band.label;
    document.getElementById('gauge-num').style.color = riskColor(rs);
    this.drawGauge(rs);

    // Radar
    this.drawRadar(last?.cognitiveDomains||null);
    if (last?.cognitiveDomains) {
      for (const [dk,cfg] of Object.entries(DOMAIN_CFG)) {
        const el = document.getElementById(`dp-${dk}`);
        if(el) el.innerHTML = `${cfg.icon} ${cfg.label} <b>${last.cognitiveDomains[dk]}</b>`;
      }
    }

    // Baseline ring
    const n = Math.min(sessions.length, 3);
    const circ = 2*Math.PI*34; // circumference ≈213
    const frac = n/3;
    document.getElementById('ring-n').textContent = sessions.length;
    document.getElementById('ring-fill').style.strokeDasharray = `${frac*circ} ${circ}`;
    document.getElementById('baseline-info').innerHTML =
      baseline?.established
        ? `<p>Baseline <strong style="color:var(--teal)">established</strong> from ${baseline.count} sessions. Risk scoring is active.</p>`
        : `<p>Complete <strong>${3-sessions.length} more session(s)</strong> to establish your personal linguistic baseline.</p>`;

    if (baseline?.established && baseline.means) {
      const keys = ['ttr','speechRate','coherenceScore','complexityScore'];
      document.getElementById('baseline-mini').innerHTML = keys.map(k=>
        `<div class="bmini-row"><span>${FEAT_CFG[k]?.label||k}</span><b>${formatVal(k,baseline.means[k])}</b></div>`
      ).join('');
    }

    // Last session block
    if (last) {
      document.getElementById('last-session-body').innerHTML = `
        <div class="last-sess-grid">
          <div class="lsg-item"><div class="lsg-val">${last.riskScore!=null?last.riskScore:'—'}</div><div class="lsg-lbl">Risk Score</div></div>
          <div class="lsg-item"><div class="lsg-val">${last.features.wordCount}</div><div class="lsg-lbl">Words</div></div>
          <div class="lsg-item"><div class="lsg-val">${last.features.speechRate.toFixed(0)}</div><div class="lsg-lbl">WPM</div></div>
          <div class="lsg-item"><div class="lsg-val">${(last.features.ttr*100).toFixed(0)}%</div><div class="lsg-lbl">TTR</div></div>
        </div>
        <div class="lsg-meta">
          <span class="lsg-tag">${TASK_LABELS[last.taskType]}</span>
          <span class="lsg-tag">${new Date(last.timestamp).toLocaleDateString()}</span>
          <span class="lsg-tag">${last.duration}s</span>
        </div>`;
    }

    // Fatigue
    const fat = last?.fatigueScore;
    if (fat) {
      document.getElementById('fatigue-score').textContent = fat.overall;
      document.getElementById('fb-hesitation').style.width = fat.hesitation+'%';
      document.getElementById('fb-slowdown').style.width   = fat.slowdown+'%';
      document.getElementById('fb-complexity').style.width = fat.complexityDrop+'%';
    }

    // Velocity
    const deg = degradationVelocity(sessions);
    document.getElementById('vel-val').textContent   = deg.velocity!=null?`${deg.velocity>0?'+':''}${deg.velocity}`:'—';
    document.getElementById('accel-val').textContent = deg.acceleration!=null?`${deg.acceleration>0?'+':''}${deg.acceleration}`:'—';
    document.getElementById('vel-val').style.color   = deg.velocity>1?'var(--danger)':deg.velocity<-1?'var(--teal)':'var(--warn)';
    const chip = document.getElementById('trend-chip');
    chip.textContent = deg.trend==='awaiting'?'Awaiting data':deg.trend.charAt(0).toUpperCase()+deg.trend.slice(1);
    chip.className = 'trend-chip '+deg.trend;

    // Subtitle
    document.getElementById('dash-subtitle').textContent =
      baseline?.established
        ? `Baseline established · ${sessions.length} sessions recorded · Risk scoring active`
        : `${sessions.length}/3 sessions · Complete ${3-sessions.length} more to activate risk scoring`;
  },

  drawGauge(score) {
    const canvas = document.getElementById('risk-gauge');
    const ctx    = canvas.getContext('2d');
    const cx=100, cy=110, r=82, startA=-Math.PI*1.1, endA=Math.PI*0.1;
    ctx.clearRect(0,0,200,220);
    // Track
    ctx.beginPath(); ctx.arc(cx,cy,r,startA,endA);
    ctx.strokeStyle='rgba(255,255,255,.06)'; ctx.lineWidth=14; ctx.lineCap='round'; ctx.stroke();
    // Fill
    if (score!=null) {
      const pct    = score/100;
      const fillA  = startA + pct*(endA-startA+Math.PI*2.2-Math.PI*2.2+Math.PI*2.2);
      // correct: arc spans 2.2π total
      const span   = (Math.PI*2.2);
      const fillEnd= startA + pct*span;
      const grad   = ctx.createLinearGradient(20,0,180,0);
      grad.addColorStop(0,'#00d4aa'); grad.addColorStop(0.5,'#fbbf24'); grad.addColorStop(1,'#ff4757');
      ctx.beginPath(); ctx.arc(cx,cy,r,startA,fillEnd);
      ctx.strokeStyle=grad; ctx.lineWidth=14; ctx.lineCap='round'; ctx.stroke();
    }
  },

  drawRadar(domains) {
    const ctx = document.getElementById('radar-chart').getContext('2d');
    const labels = Object.values(DOMAIN_CFG).map(d=>d.label);
    const data   = domains ? Object.keys(DOMAIN_CFG).map(k=>domains[k]||0) : [0,0,0,0];
    if (this.state.charts.radar) { this.state.charts.radar.destroy(); }
    this.state.charts.radar = new Chart(ctx, {
      type:'radar',
      data:{ labels, datasets:[{ data, backgroundColor:'rgba(79,139,255,.15)', borderColor:'rgba(79,139,255,.7)', pointBackgroundColor:'#4f8bff', pointRadius:4 }] },
      options:{ animation:{duration:600}, plugins:{ legend:{display:false} }, scales:{ r:{ min:0,max:100, grid:{color:'rgba(255,255,255,.06)'}, angleLines:{color:'rgba(255,255,255,.06)'}, ticks:{color:'#5a6a9a',backdropColor:'transparent',font:{size:9}}, pointLabels:{color:'#dde4f5',font:{size:11}} } } }
    });
  },

  // ── Analysis ────────────────────────────────────────
  renderAnalysis() {
    const last = this.state.sessions[this.state.sessions.length-1];
    const empty = document.getElementById('analysis-empty');
    const body  = document.getElementById('analysis-body');
    if (!last) { empty.style.display='block'; body.style.display='none'; return; }
    empty.style.display='none'; body.style.display='block';
    document.getElementById('analysis-info').textContent = `Session ${last.sessionNumber} · ${TASK_LABELS[last.taskType]} · ${new Date(last.timestamp).toLocaleDateString()} · ${last.features.wordCount} words`;

    const f  = last.features;
    const z  = last.zScores;
    const bl = this.state.baseline;

    const groups = {
      lexical:   [['ttr','TTR',(f.ttr*100).toFixed(1)+'%'],['vocabularyRichness','Vocab Richness',f.vocabularyRichness.toFixed(2)],['repetitionRate','Repetition Rate',(f.repetitionRate*100).toFixed(1)+'%']],
      syntactic: [['avgSentenceLength','Avg Sentence Len',f.avgSentenceLength.toFixed(1)+' wds'],['complexityScore','Complexity Score',(f.complexityScore*100).toFixed(1)+'%'],['clauseRatio','Clause Ratio',f.clauseRatio.toFixed(2)]],
      semantic:  [['coherenceScore','Coherence Score',(f.coherenceScore*100).toFixed(1)+'%'],['topicDriftIndex','Topic Drift',(f.topicDriftIndex*100).toFixed(1)+'%']],
      temporal:  [['speechRate','Speech Rate',f.speechRate.toFixed(0)+' WPM'],['wordCount','Word Count',f.wordCount],['sentenceCount','Sentences',f.sentenceCount]],
      discourse: [['transitionRatio','Transition Ratio',(f.transitionRatio*100).toFixed(1)+'%'],['redundancyIndex','Redundancy',(f.redundancyIndex*100).toFixed(1)+'%']],
    };

    for (const [group, rows] of Object.entries(groups)) {
      let html='';
      for (const [key,label,displayVal] of rows) {
        const zv    = z?.[key];
        const norm  = featureNorm(key, f[key]);
        const devHtml = zv!=null&&bl?.established ? `<span class="metric-dev ${FEAT_CFG[key]?.direction==='higher'?zv<-0.5?'pos':'neg':zv>0.5?'pos':'neg'}">${zv>0?'▲':'▼'}${Math.abs(zv).toFixed(2)}σ</span>` : '';
        html += `<div class="metric-row"><div class="metric-top"><span class="metric-key">${label}</span><span class="metric-val">${displayVal} ${devHtml}</span></div><div class="mbar"><div class="mfill" style="width:${norm}%"></div></div></div>`;
      }
      document.getElementById(`fm-${group}`).innerHTML = html;
      const score = groupScore(group,f,z);
      const badge = document.getElementById(`lb-${group}`);
      badge.textContent = score; badge.className = 'feat-badge '+scoreBadgeCls(score);
    }

    // Top features
    const top = last.topFeatures||[];
    document.getElementById('top-features').innerHTML = top.map((tf,i)=>
      `<div class="tf-row"><div class="tf-rank">${i+1}</div><div class="tf-lbl">${tf.label}</div><div class="tf-delta">${tf.riskZ>0?'▲':''} ${tf.riskZ.toFixed(2)}σ</div></div>`
    ).join('');
    document.getElementById('ai-summary').innerHTML = last.summary;
  },

  // ── History ─────────────────────────────────────────
  bindFeatureTabs() {
    document.addEventListener('click', e => {
      const ft = e.target.closest('.ft');
      if (!ft) return;
      document.querySelectorAll('.ft').forEach(b=>b.classList.remove('active'));
      ft.classList.add('active');
      this.state.currentFeatTab = ft.dataset.f;
      this.drawFeatureTrend(this.state.currentFeatTab);
    });
  },
  renderHistory() {
    const s = this.state.sessions;
    document.getElementById('history-empty').style.display = s.length?'none':'block';
    document.getElementById('history-body').style.display  = s.length?'block':'none';
    if (!s.length) return;
    this.drawRiskTrend();
    this.drawFeatureTrend(this.state.currentFeatTab);
    // Table
    document.getElementById('sess-tbody').innerHTML = s.map(sess=>{
      const rb = riskBand(sess.riskScore);
      return `<tr>
        <td>${sess.sessionNumber}</td>
        <td>${new Date(sess.timestamp).toLocaleDateString()}</td>
        <td>${TASK_LABELS[sess.taskType]}</td>
        <td>${sess.features.wordCount}</td>
        <td>${sess.features.speechRate.toFixed(0)}</td>
        <td>${(sess.features.ttr*100).toFixed(1)}%</td>
        <td>${(sess.features.coherenceScore*100).toFixed(1)}%</td>
        <td><span class="risk-pill ${rb.cls}">${sess.riskScore!=null?sess.riskScore:'—'}</span></td>
      </tr>`;
    }).join('');
  },
  drawRiskTrend() {
    const s   = this.state.sessions;
    const ctx = document.getElementById('risk-trend-chart').getContext('2d');
    const labels = s.map(ss=>`S${ss.sessionNumber}`);
    const data   = s.map(ss=>ss.riskScore);
    if (this.state.charts.riskTrend) this.state.charts.riskTrend.destroy();
    const grad = ctx.createLinearGradient(0,0,0,200);
    grad.addColorStop(0,'rgba(255,71,87,.3)'); grad.addColorStop(1,'rgba(255,71,87,0)');
    this.state.charts.riskTrend = new Chart(ctx, {
      type:'line',
      data:{ labels, datasets:[{ label:'Risk Score', data, borderColor:'#ff4757', backgroundColor:grad, tension:.4, pointBackgroundColor:'#ff4757', pointRadius:5, fill:true }] },
      options:{ ...CHART_DEFAULTS, animation:{duration:600}, scales:{ x:{...CHART_DEFAULTS.scales.x}, y:{...CHART_DEFAULTS.scales.y,min:0,max:100} } }
    });
  },
  drawFeatureTrend(featureKey) {
    const s   = this.state.sessions;
    const ctx = document.getElementById('feat-trend-chart').getContext('2d');
    const labels = s.map(ss=>`S${ss.sessionNumber}`);
    const data   = s.map(ss=>ss.features[featureKey]);
    const grad   = ctx.createLinearGradient(0,0,0,200);
    grad.addColorStop(0,'rgba(79,139,255,.3)'); grad.addColorStop(1,'rgba(79,139,255,0)');
    if (this.state.charts.featTrend) this.state.charts.featTrend.destroy();
    this.state.charts.featTrend = new Chart(ctx, {
      type:'line',
      data:{ labels, datasets:[{ label:FEAT_CFG[featureKey]?.label||featureKey, data, borderColor:'#4f8bff', backgroundColor:grad, tension:.4, pointBackgroundColor:'#4f8bff', pointRadius:5, fill:true }] },
      options:{ ...CHART_DEFAULTS, animation:{duration:400} }
    });
  },

  // ── Report ──────────────────────────────────────────
  renderReport() {
    const s  = this.state.sessions;
    const bl = this.state.baseline;
    document.getElementById('report-empty').style.display = (s.length>=3&&bl?.established)?'none':'block';
    document.getElementById('report-body').style.display  = (s.length>=3&&bl?.established)?'block':'none';
    if (s.length<3||!bl?.established) return;

    const last = s[s.length-1];
    document.getElementById('rpt-date').textContent     = new Date().toLocaleString();
    document.getElementById('rpt-sessions').textContent = s.length;
    document.getElementById('rpt-baseline').textContent = `Established (${bl.count} sessions)`;
    document.getElementById('rpt-user').textContent     = 'Local User';

    // Summary (from last session)
    const degVel = degradationVelocity(s);
    const rsBand = riskBand(last.riskScore);
    document.getElementById('rpt-summary').innerHTML = `
      ${last.summary}<br/><br/>
      Longitudinal trend: <strong>${degVel.trend}</strong> (velocity ${degVel.velocity!=null?(degVel.velocity>0?'+':'')+degVel.velocity:'N/A'} risk points/session).
      ${s.length} total sessions recorded spanning ${Math.round((last.timestamp-s[0].timestamp)/(86400000))} days.`;

    // Risk bar
    const rs = last.riskScore??0;
    document.getElementById('rpt-risk-num').textContent = last.riskScore!=null?last.riskScore:'—';
    document.getElementById('rpt-risk-num').style.color = riskColor(last.riskScore);
    document.getElementById('rpt-risk-fill').style.width = rs+'%';

    // Degradation table
    const featKeys = Object.keys(FEAT_CFG);
    document.getElementById('rpt-deg-body').innerHTML = featKeys.map(k=>{
      const bv = bl.means[k], lv = last.features[k], zv = last.zScores?.[k];
      const changed = zv!=null?zv.toFixed(2):'—';
      const status  = zv==null?'—':Math.abs(zv)<0.5?'Normal':zv>0.5&&FEAT_CFG[k].direction==='lower'?'⚠ Elevated':zv<-0.5&&FEAT_CFG[k].direction==='higher'?'⚠ Declined':'Normal';
      return `<tr><td>${FEAT_CFG[k].label}</td><td style="font-family:var(--font-mono)">${formatVal(k,bv)}</td><td style="font-family:var(--font-mono)">${formatVal(k,lv)}</td><td style="font-family:var(--font-mono);color:${parseFloat(changed)>0.5?'var(--danger)':parseFloat(changed)<-0.5?'var(--teal)':'var(--muted)'}">${changed}σ</td><td style="font-size:.8rem">${status}</td></tr>`;
    }).join('');

    // Domain report
    document.getElementById('domain-report').innerHTML = Object.entries(DOMAIN_CFG).map(([dk,cfg])=>{
      const score = last.cognitiveDomains?.[dk]??0;
      const cls   = score<25?'low':score<50?'mod':'high';
      return `<div class="dom-report-card"><div class="dom-report-head"><span>${cfg.icon} ${cfg.label}</span><span style="color:${riskColor(score)};font-family:var(--font-head)">${score}</span></div><div class="dom-score-bar"><div class="dom-score-fill ${cls}" style="width:${score}%"></div></div></div>`;
    }).join('');

    // Explanation
    const top3 = last.topFeatures||[];
    document.getElementById('rpt-explain').innerHTML = `
      <p>${last.summary}</p>
      ${top3.length?`<p style="margin-top:10px">The <strong>top contributing indicators</strong> to the risk score are: ${top3.map((t,i)=>`<strong>${t.label}</strong> (${t.riskZ>0?'▲':'▼'}${Math.abs(t.riskZ).toFixed(2)}σ)`).join(', ')}.</p>`:''}
      <p style="margin-top:10px;font-size:.78rem;color:var(--muted)">All comparisons are relative to your personal linguistic baseline, not a population average. σ = standard deviations from your baseline mean.</p>`;
  },

  exportJSON() {
    const data = { userId:'local-user', exportedAt:new Date().toISOString(), sessions:this.state.sessions, baseline:this.state.baseline };
    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='neurolingo_report.json'; a.click();
  },
  clearAllData() {
    if (!confirm('Clear all session data? This cannot be undone.')) return;
    this.state.sessions=[]; this.state.baseline=null;
    this.save(); location.reload();
  },
};

// ── Helpers ───────────────────────────────────────────
function formatVal(key, val) {
  if (val==null||isNaN(val)) return '—';
  if (['ttr','repetitionRate','complexityScore','coherenceScore','topicDriftIndex','transitionRatio','redundancyIndex'].includes(key))
    return (val*100).toFixed(1)+'%';
  if (key==='speechRate') return val.toFixed(0)+' WPM';
  if (key==='avgSentenceLength') return val.toFixed(1)+' wds';
  return val.toFixed?val.toFixed(2):val;
}

function featureNorm(key, val) {
  const ranges = { ttr:[0,1], vocabularyRichness:[0,20], repetitionRate:[0,0.6], avgSentenceLength:[0,40], complexityScore:[0,1], clauseRatio:[0,3], coherenceScore:[0,1], topicDriftIndex:[0,1], speechRate:[0,220], transitionRatio:[0,0.2], redundancyIndex:[0,0.5] };
  const r = ranges[key]||[0,1];
  return Math.min(100, Math.max(0, ((val-r[0])/(r[1]-r[0]))*100));
}

function groupScore(group, f, z) {
  if (!z) return 'No baseline';
  const featMap = { lexical:['ttr','vocabularyRichness','repetitionRate'], syntactic:['avgSentenceLength','complexityScore','clauseRatio'], semantic:['coherenceScore','topicDriftIndex'], temporal:['speechRate'], discourse:['transitionRatio','redundancyIndex'] };
  const keys = featMap[group]||[];
  let risk=0,cnt=0;
  for (const k of keys) { if(z[k]==null) continue; const rz=FEAT_CFG[k].direction==='higher'?-z[k]:z[k]; risk+=Math.max(0,rz); cnt++; }
  if(!cnt) return 'No baseline';
  const r=Math.min(100,Math.round((risk/cnt)*40));
  return r<25?'Healthy':r<50?'Moderate':r<75?'Elevated':'Impaired';
}
function scoreBadgeCls(s) { return {Healthy:'good',Moderate:'warn',Elevated:'bad',Impaired:'bad'}[s]||'neutral'; }

// ── Boot ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());
