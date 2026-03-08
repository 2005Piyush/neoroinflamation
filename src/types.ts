// ─── TypeScript Types for NeurOlingo AI ───────────────────

export interface LinguisticFeatures {
    wordCount: number;
    sentenceCount: number;
    ttr: number;
    vocabularyRichness: number;
    repetitionRate: number;
    avgSentenceLength: number;
    complexityScore: number;
    clauseRatio: number;
    coherenceScore: number;
    topicDriftIndex: number;
    speechRate: number;
    transitionRatio: number;
    redundancyIndex: number;
}

export interface ZScores {
    [key: string]: number;
}

export interface CognitiveDomains {
    attention: number;
    workingMemory: number;
    executiveControl: number;
    semanticRetrieval: number;
}

export interface FatigueScore {
    overall: number;
    hesitation: number;
    slowdown: number;
    complexityDrop: number;
}

export interface TopFeature {
    key: string;
    label: string;
    riskZ: number;
    z: number;
    direction: 'higher' | 'lower';
}

export interface Session {
    id: number;
    sessionNumber: number;
    timestamp: number;
    taskType: string;
    transcript: string;
    duration: number;
    features: LinguisticFeatures;
    zScores: ZScores | null;
    riskScore: number | null;
    cognitiveDomains: CognitiveDomains;
    fatigueScore: FatigueScore;
    topFeatures: TopFeature[];
    summary: string;
    age?: number | null;   // age used for this session's calibration
}

export interface BaselineStats {
    means: Record<string, number>;
    stds: Record<string, number>;
    count: number;
    established: boolean;
}

export type ViewName = 'dashboard' | 'record' | 'analysis' | 'history' | 'report';
export type TaskType = 'story_narration' | 'descriptive' | 'word_association' | 'recall';

export interface FeatCfgItem {
    label: string;
    direction: 'higher' | 'lower';
    weight: number;
}

export interface DomainCfgItem {
    label: string;
    icon: string;
    feats: string[];
}
