/**
 * Rule-Based Relationship Graph Construction
 * Used by BOTH AI and Free modes
 * Builds graph structure locally, optionally enhanced by AI labels
 */

import type { RelationshipGraphData, TranscriptEntry } from '@/lib/types';

export interface RelationshipGraphResult {
  graphData: RelationshipGraphData;
}

/**
 * Build relationship graph using rule-based analysis
 * This is the CORE graph builder used by both AI and Free modes
 */
export function buildRelationshipGraph(
  transcript: TranscriptEntry[]
): RelationshipGraphResult {
  // Extract unique speakers
  const speakers = Array.from(new Set(transcript.map(t => t.speaker)));
  
  // Create nodes
  const nodes = speakers.map((speaker, index) => ({
    id: speaker,
    label: transcript.find(t => t.speaker === speaker)?.label || speaker,
    group: index + 1,
  }));

  // Build interaction matrix
  const interactions = new Map<string, {
    count: number;
    sentiments: number[];
    timestamps: string[];
    topics: Set<string>;
  }>();

  // Analyze interactions
  for (let i = 0; i < transcript.length; i++) {
    const current = transcript[i];
    
    // Look at next few utterances for interactions
    for (let j = i + 1; j < Math.min(i + 5, transcript.length); j++) {
      const next = transcript[j];
      
      // Skip same speaker
      if (current.speaker === next.speaker) continue;

      // Create interaction key
      const key = `${current.speaker}->${next.speaker}`;
      
      if (!interactions.has(key)) {
        interactions.set(key, {
          count: 0,
          sentiments: [],
          timestamps: [],
          topics: new Set(),
        });
      }

      const interaction = interactions.get(key)!;
      interaction.count++;
      
      // Add sentiment score
      const sentimentScore = sentimentToScore(next.sentiment);
      interaction.sentiments.push(sentimentScore);
      
      // Add timestamp (limit to 3)
      if (interaction.timestamps.length < 3) {
        interaction.timestamps.push(next.timestamp);
      }
      
      // Extract topics from text (simple keyword extraction)
      const keywords = extractSimpleKeywords(next.text);
      keywords.forEach(kw => interaction.topics.add(kw));
    }
  }

  // Build links
  const links = Array.from(interactions.entries())
    .filter(([_, data]) => data.count >= 2) // Minimum 2 interactions
    .map(([key, data]) => {
      const [source, target] = key.split('->');
      const avgSentiment = data.sentiments.reduce((a, b) => a + b, 0) / data.sentiments.length;
      
      // Determine relationship type based on sentiment
      let type: 'support' | 'conflict' | 'neutral';
      if (avgSentiment > 0.3) {
        type = 'support';
      } else if (avgSentiment < -0.3) {
        type = 'conflict';
      } else {
        type = 'neutral';
      }

      return {
        source,
        target,
        type,
        value: Math.min(data.count, 10), // Cap at 10 for visualization
        avgSentiment,
        initiator: source,
        timestamps: data.timestamps,
        topics: Array.from(data.topics).slice(0, 2), // Top 2 topics
      };
    });

  return {
    graphData: {
      nodes,
      links,
    },
  };
}

/**
 * Convert sentiment string to numeric score
 */
function sentimentToScore(sentiment: string): number {
  switch (sentiment.toLowerCase()) {
    case 'positive':
      return 0.7;
    case 'negative':
      return -0.7;
    default:
      return 0;
  }
}

/**
 * Extract simple keywords from text (for topics)
 */
function extractSimpleKeywords(text: string): string[] {
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 4 && !stopwords.has(word))
    .slice(0, 3); // Top 3 keywords
}
