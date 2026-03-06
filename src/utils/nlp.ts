// ─── NLP Feature Extraction Utilities ───────────────────
import type { LinguisticFeatures, FeatCfgItem, DomainCfgItem, BaselineStats, ZScores, CognitiveDomains, FatigueScore, TopFeature } from '../types';

// ── Constants ────────────────────────────────────────────
export const TASK_PROMPTS: Record<string, string> = {
    story_narration: 'Please narrate a story or describe a memorable event from your life in as much detail as you can.',
    descriptive: 'Describe your home, workplace, or a familiar location in as much detail as possible. Include spatial relationships, objects, and atmosphere.',
    word_association: 'Starting with the word "nature", say the first word each one makes you think of and explain the connection. Keep going for at least two minutes.',
    recall: 'Describe your entire yesterday from waking up to sleep — activities, conversations, and how you felt at each point.',
};

export const TASK_LABELS: Record<string, string> = {
    story_narration: 'Story Narration', descriptive: 'Descriptive',
    word_association: 'Word Association', recall: 'Cognitive Recall',
};

export const FEAT_CFG: Record<string, FeatCfgItem> = {
    ttr: { label: 'Type-Token Ratio', direction: 'higher', weight: 2.5 },
    vocabularyRichness: { label: 'Vocabulary Richness', direction: 'higher', weight: 2.0 },
    repetitionRate: { label: 'Repetition Rate', direction: 'lower', weight: 1.5 },
    avgSentenceLength: { label: 'Avg Sentence Length', direction: 'higher', weight: 1.2 },
    complexityScore: { label: 'Syntactic Complexity', direction: 'higher', weight: 2.0 },
    clauseRatio: { label: 'Clause Ratio', direction: 'higher', weight: 1.0 },
    coherenceScore: { label: 'Semantic Coherence', direction: 'higher', weight: 2.5 },
    topicDriftIndex: { label: 'Topic Drift Index', direction: 'lower', weight: 1.5 },
    speechRate: { label: 'Speech Rate (WPM)', direction: 'higher', weight: 1.5 },
    transitionRatio: { label: 'Transition Word Ratio', direction: 'higher', weight: 1.0 },
    redundancyIndex: { label: 'Redundancy Index', direction: 'lower', weight: 1.0 },
};

export const DOMAIN_CFG: Record<string, DomainCfgItem> = {
    attention: { label: 'Attention', icon: '👁', feats: ['speechRate', 'repetitionRate'] },
    workingMemory: { label: 'Working Memory', icon: '💾', feats: ['topicDriftIndex', 'redundancyIndex'] },
    executiveControl: { label: 'Executive Control', icon: '⚙', feats: ['complexityScore', 'clauseRatio'] },
    semanticRetrieval: { label: 'Semantic Retrieval', icon: '🔍', feats: ['ttr', 'vocabularyRichness'] },
};

const STOPWORDS = new Set('a an the and or but in on at to for of with by from up about into through during is are was were be been being have has had do does did will would could should may might must shall can i me my we our you your it its they them this that these those he him she her so if as then than not no nor yet both either neither each every all any few more most other some such same own just very too also'.split(' '));
const CLAUSE_WORDS = new Set('which that who whom when where while although because since unless if though whereas after before until whether whatever whoever whichever'.split(' '));
const TRANSITION_WORDS = new Set('however therefore furthermore moreover consequently meanwhile subsequently additionally although nevertheless thus hence first second third finally next also besides indeed whereas conversely alternatively specifically particularly accordingly'.split(' '));

// ── Core NLP Functions ───────────────────────────────────
function tokenize(text: string): string[] {
    return (text.toLowerCase().match(/\b[a-z']+\b/g) || []).filter(w => w.length > 1);
}
function splitSentences(text: string): string[] {
    return text.split(/(?<=[.!?])\s+|[.!?]\s*$/).map(s => s.trim()).filter(s => s.length > 4);
}
function bagOfWords(tokens: string[]): Record<string, number> {
    const bag: Record<string, number> = {};
    tokens.forEach(t => bag[t] = (bag[t] || 0) + 1);
    return bag;
}
function cosine(a: Record<string, number>, b: Record<string, number>): number {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    let dot = 0, mA = 0, mB = 0;
    for (const k of keys) { const va = a[k] || 0, vb = b[k] || 0; dot += va * vb; mA += va * va; mB += vb * vb; }
    return (mA > 0 && mB > 0) ? dot / (Math.sqrt(mA) * Math.sqrt(mB)) : 0;
}

export function extractFeatures(transcript: string, durationSec: number): LinguisticFeatures {
    const tokens = tokenize(transcript);
    const sentences = splitSentences(transcript);
    const content = tokens.filter(w => !STOPWORDS.has(w));
    const types = new Set(tokens);
    const ctypes = new Set(content);

    const ttr = tokens.length > 0 ? types.size / tokens.length : 0;
    const vocabularyRichness = tokens.length > 0 ? ctypes.size / Math.sqrt(tokens.length) : 0;
    const repetitionRate = content.length > 0 ? Math.max(0, 1 - ctypes.size / content.length) : 0;
    const avgSentenceLength = sentences.length > 0 ? tokens.length / sentences.length : tokens.length;
    const clauseCount = tokens.filter(w => CLAUSE_WORDS.has(w)).length;
    const clauseRatio = sentences.length > 0 ? clauseCount / sentences.length : 0;
    const complexityScore = Math.min(1, (Math.min(avgSentenceLength, 25) / 25) * 0.6 + Math.min(clauseRatio / 3, 1) * 0.4);

    let coherenceScore = 1, topicDriftIndex = 0;
    if (sentences.length >= 2) {
        const vecs = sentences.map(s => bagOfWords(tokenize(s).filter(w => !STOPWORDS.has(w))));
        let sim = 0;
        for (let i = 0; i < vecs.length - 1; i++) sim += cosine(vecs[i], vecs[i + 1]);
        coherenceScore = sim / (vecs.length - 1);
        topicDriftIndex = 1 - coherenceScore;
    }

    const speechRate = durationSec > 0 ? (tokens.length / durationSec) * 60 : 0;
    const transTotal = tokens.filter(w => TRANSITION_WORDS.has(w)).length;
    const transitionRatio = tokens.length > 0 ? transTotal / tokens.length : 0;
    const bigrams: string[] = [];
    for (let i = 0; i < content.length - 1; i++) bigrams.push(content[i] + '_' + content[i + 1]);
    const bigramTypes = new Set(bigrams);
    const redundancyIndex = bigrams.length > 0 ? (bigrams.length - bigramTypes.size) / bigrams.length : 0;

    return {
        wordCount: tokens.length, sentenceCount: sentences.length,
        ttr: +ttr.toFixed(4), vocabularyRichness: +vocabularyRichness.toFixed(3),
        repetitionRate: +repetitionRate.toFixed(4), avgSentenceLength: +avgSentenceLength.toFixed(2),
        complexityScore: +complexityScore.toFixed(4), clauseRatio: +clauseRatio.toFixed(4),
        coherenceScore: +coherenceScore.toFixed(4), topicDriftIndex: +topicDriftIndex.toFixed(4),
        speechRate: +speechRate.toFixed(1), transitionRatio: +transitionRatio.toFixed(4),
        redundancyIndex: +redundancyIndex.toFixed(4),
    };
}

// ── Baseline & Scoring ────────────────────────────────────
export function buildBaseline(sessions: { features: LinguisticFeatures }[]): BaselineStats {
    const keys = Object.keys(FEAT_CFG);
    const means: Record<string, number> = {}, stds: Record<string, number> = {};
    for (const k of keys) {
        const vals = sessions.map(s => (s.features as any)[k]).filter((v: any) => !isNaN(v));
        if (!vals.length) { means[k] = 0; stds[k] = 0.0001; continue; }
        const m = vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
        const v = vals.reduce((a: number, b: number) => a + (b - m) ** 2, 0) / vals.length;
        means[k] = m; stds[k] = Math.max(Math.sqrt(v), 0.0001);
    }
    return { means, stds, count: sessions.length, established: sessions.length >= 3 };
}

export function computeZScores(features: LinguisticFeatures, baseline: BaselineStats): ZScores | null {
    if (!baseline?.established) return null;
    const z: ZScores = {};
    for (const k of Object.keys(FEAT_CFG)) z[k] = ((features as any)[k] - baseline.means[k]) / baseline.stds[k];
    return z;
}

export function computeRiskScore(z: ZScores | null): number | null {
    if (!z) return null;
    let num = 0, denom = 0;
    for (const [k, cfg] of Object.entries(FEAT_CFG)) {
        if (z[k] == null) continue;
        const riskZ = cfg.direction === 'higher' ? -z[k] : z[k];
        num += Math.max(0, riskZ) * cfg.weight; denom += cfg.weight;
    }
    return Math.round(Math.min(100, Math.max(0, (num / denom) * 40)));
}

export function computeDomainScores(z: ZScores | null): CognitiveDomains {
    if (!z) return { attention: 0, workingMemory: 0, executiveControl: 0, semanticRetrieval: 0 };
    const out: any = {};
    for (const [dk, cfg] of Object.entries(DOMAIN_CFG)) {
        let s = 0, c = 0;
        for (const fk of cfg.feats) {
            if (z[fk] == null) continue;
            const rz = FEAT_CFG[fk].direction === 'higher' ? -z[fk] : z[fk];
            s += Math.max(0, rz); c++;
        }
        out[dk] = c > 0 ? Math.min(100, Math.round((s / c) * 40)) : 0;
    }
    return out as CognitiveDomains;
}

export function computeFatigue(features: LinguisticFeatures, baseline: BaselineStats | null): FatigueScore {
    const bslWPM = baseline?.established ? baseline.means['speechRate'] : 130;
    const bslCpx = baseline?.established ? baseline.means['complexityScore'] : 0.5;
    const hesitation = Math.min(100, Math.round(Math.max(0, (bslWPM - features.speechRate) / bslWPM * 100)));
    const slowdown = Math.min(100, Math.round(Math.max(0, (bslWPM - features.speechRate) / bslWPM * 80)));
    const complexityDrop = Math.min(100, Math.round(Math.max(0, (bslCpx - features.complexityScore) / Math.max(bslCpx, 0.01) * 100)));
    return { overall: Math.min(100, Math.round((hesitation + slowdown + complexityDrop) / 3)), hesitation, slowdown, complexityDrop };
}

export function computeDegradation(sessions: { riskScore: number | null }[]) {
    const scored = sessions.filter(s => s.riskScore != null) as { riskScore: number }[];
    if (scored.length < 2) return { velocity: null, acceleration: null, trend: 'awaiting' };
    const deltas: number[] = [];
    for (let i = 1; i < scored.length; i++) deltas.push(scored[i].riskScore - scored[i - 1].riskScore);
    const vel = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    let accel: number | null = null;
    if (deltas.length >= 2) {
        const ad = deltas.slice(1).map((d, i) => d - deltas[i]);
        accel = ad.reduce((a, b) => a + b, 0) / ad.length;
    }
    return { velocity: +vel.toFixed(2), acceleration: accel != null ? +accel.toFixed(2) : null, trend: vel > 1 ? 'declining' : vel < -1 ? 'improving' : 'stable' };
}

export function topRiskFeatures(z: ZScores | null, n = 3): TopFeature[] {
    if (!z) return [];
    return Object.entries(FEAT_CFG)
        .map(([k, cfg]) => ({ key: k, label: cfg.label, riskZ: cfg.direction === 'higher' ? -(z[k] || 0) : (z[k] || 0), z: z[k] || 0, direction: cfg.direction }))
        .sort((a, b) => b.riskZ - a.riskZ).slice(0, n);
}

export function generateSummary(sessionNum: number, rs: number | null, features: LinguisticFeatures, doms: CognitiveDomains, z: ZScores | null, baseline: BaselineStats | null): string {
    if (rs == null) {
        return `Session ${sessionNum} recorded (${features.wordCount} words, ${features.speechRate.toFixed(0)} WPM). ${3 - sessionNum > 0 ? (3 - sessionNum) + ' more session(s)' : 'Baseline established'} needed before risk scoring begins.`;
    }
    const band = rs < 25 ? '<strong style="color:#00d4aa">low</strong>' : rs < 50 ? '<strong style="color:#fbbf24">moderate</strong>' : rs < 75 ? '<strong style="color:#ff8232">elevated</strong>' : '<strong style="color:#ff4757">high</strong>';
    const topDom = Object.entries(doms).sort((a, b) => b[1] - a[1])[0];
    const topDomLabel = DOMAIN_CFG[topDom[0]]?.label || topDom[0];
    const ttrNote = (z?.ttr || 0) < -0.5 ? 'reduced vocabulary diversity' : 'vocabulary diversity within normal range';
    const cohNote = (z?.coherenceScore || 0) < -0.5 ? 'some reduction in narrative coherence' : 'narrative coherence maintained';
    const bslWPM = baseline?.means?.speechRate?.toFixed(0) || '—';
    return `Risk score: <strong>${rs}/100</strong> (${band}). Most impacted: <strong>${topDomLabel}</strong>. Analysis shows ${ttrNote} and ${cohNote}. Speech rate: <strong>${features.speechRate.toFixed(0)} WPM</strong> (baseline: ${bslWPM} WPM).`;
}

export function riskColor(score: number | null): string {
    if (score == null) return '#5a6a9a';
    if (score < 25) return '#00d4aa';
    if (score < 50) return '#fbbf24';
    if (score < 75) return '#ff8232';
    return '#ff4757';
}

export function riskBand(score: number | null): { label: string; cls: string } {
    if (score == null) return { label: 'No Baseline', cls: '' };
    if (score < 25) return { label: 'Low Risk', cls: 'low' };
    if (score < 50) return { label: 'Moderate Risk', cls: 'mod' };
    if (score < 75) return { label: 'Elevated Risk', cls: 'elev' };
    return { label: 'High Risk', cls: 'high' };
}

export function formatVal(key: string, val: number | undefined): string {
    if (val == null || isNaN(val)) return '—';
    if (['ttr', 'repetitionRate', 'complexityScore', 'coherenceScore', 'topicDriftIndex', 'transitionRatio', 'redundancyIndex'].includes(key))
        return (val * 100).toFixed(1) + '%';
    if (key === 'speechRate') return val.toFixed(0) + ' WPM';
    if (key === 'avgSentenceLength') return val.toFixed(1) + ' wds';
    return typeof val.toFixed === 'function' ? val.toFixed(2) : String(val);
}

export function featureNorm(key: string, val: number): number {
    const ranges: Record<string, [number, number]> = {
        ttr: [0, 1], vocabularyRichness: [0, 20], repetitionRate: [0, 0.6], avgSentenceLength: [0, 40],
        complexityScore: [0, 1], clauseRatio: [0, 3], coherenceScore: [0, 1], topicDriftIndex: [0, 1],
        speechRate: [0, 220], transitionRatio: [0, 0.2], redundancyIndex: [0, 0.5],
    };
    const r = ranges[key] || [0, 1];
    return Math.min(100, Math.max(0, ((val - r[0]) / (r[1] - r[0])) * 100));
}
