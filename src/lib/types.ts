import { z } from 'zod';

// Analysis mode type
export type AnalysisMode = 'ai' | 'free';

export const transcriptSchema = z.object({
  transcript: z.array(
    z.object({
      id: z.number(),
      speaker: z.string(),
      label: z.string(),
      characteristic: z.object({
        color: z.string(),
        description: z.string(),
      }),
      text: z.string(),
      sentiment: z.enum(['Positive', 'Negative', 'Neutral']),
      emotion: z.string(),
      timestamp: z.string(),
    })
  ),
});

export interface TranscriptEntry {
  id: number;
  speaker: string;
  label: string;
  characteristic: {
    color: string;
    description: string; // now empty; we no longer display accessories
  };
  text: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  emotion: string;
  timestamp: string;
}

export interface SpeakerCharacteristicDetection {
  description: string;
  confidence: number; // 0..1
}

export type SpeakerIndexToDetection = Record<number, SpeakerCharacteristicDetection>;

export interface ParticipationMetric {
  speaker: string;
  label: string;
  characteristic: {
    color: string;
    description: string;
  };
  speakingTime: number; // in seconds
  wordCount?: number;
  conflict?: number;
  sentiment?: 'Positive' | 'Negative' | 'Neutral';
  dominance?: number;
  engagement?: number;
}

export interface EmotionTimelinePoint {
  time: string;
  [key: string]: number | string; // Speaker ID -> sentiment score
}

export interface GraphNode {
  id: string;
  label: string;
  group: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'support' | 'conflict' | 'neutral';
  value: number;
  avgSentiment?: number; // Average sentiment score for this relationship (-1 to 1)
  timestamps?: string[]; // When interactions occurred
  topics?: string[]; // Topics discussed in this relationship
  initiator?: string; // Who initiated more (source or target)
}

export interface RelationshipGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface SummaryData {
  title: string;
  overallSentiment: string;
  points: string[];
  relationshipSummary: string;
  summaryReport: string;
}

export interface Topic {
  topic: string;
  summary: string;
}

export const unansweredQuestionSchema = z.object({
  question: z.string(),
  speaker: z.string(),
  timestamp: z.string(),
});

export type UnansweredQuestion = z.infer<typeof unansweredQuestionSchema>;

export const interruptionSchema = z.object({
  interrupter: z.string(),
  interrupted: z.string(),
  timestamp: z.string(),
  text: z.string(),
});

export type Interruption = z.infer<typeof interruptionSchema>;

export interface GroupCohesionAnalysis {
  agreementScore?: number;
  conflictScore?: number;
  cohesionSummary?: string;
}

export interface InfluenceNode {
  id: string;
  label: string;
}

export interface InfluenceLink {
  source: string;
  target: string;
  influenceScore: number;
  emotionShift?: string;
}

export interface SpeakerInfluenceGraph {
  nodes: InfluenceNode[];
  links: InfluenceLink[];
}

export interface AnalysisData {
  summary: SummaryData;
  transcript: TranscriptEntry[];
  participation: ParticipationMetric[];
  emotionTimeline: EmotionTimelinePoint[];
  relationshipGraph: RelationshipGraphData;
  actionItems: string[];
  decisions: string[];
  keywords: string[];
  topics: Topic[];
  unansweredQuestions: UnansweredQuestion[];
  interruptions: Interruption[];
  groupCohesion: GroupCohesionAnalysis;
  speakerInfluenceGraph: SpeakerInfluenceGraph;
}
