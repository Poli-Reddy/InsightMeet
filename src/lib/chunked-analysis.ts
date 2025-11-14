/**
 * Chunked Analysis System for Large Transcripts
 * Provides 100% coverage by processing entire transcript in chunks
 */

import type { TranscriptEntry, RelationshipGraphData, Topic, UnansweredQuestion, Interruption } from '@/lib/types';
import { config } from './config';

const CHUNK_SIZE = 500; // Increased from 300 - only chunk very large transcripts
const CHUNK_OVERLAP = 20; // Reduced from 50 - less overlap = fewer tokens

interface AnalysisChunk {
  transcript: TranscriptEntry[];
  startIndex: number;
  endIndex: number;
}

/**
 * Split transcript into overlapping chunks
 */
export function chunkTranscript(transcript: TranscriptEntry[]): AnalysisChunk[] {
  if (transcript.length <= CHUNK_SIZE) {
    return [{
      transcript,
      startIndex: 0,
      endIndex: transcript.length
    }];
  }

  const chunks: AnalysisChunk[] = [];
  let startIndex = 0;

  while (startIndex < transcript.length) {
    const endIndex = Math.min(startIndex + CHUNK_SIZE, transcript.length);
    
    chunks.push({
      transcript: transcript.slice(startIndex, endIndex),
      startIndex,
      endIndex
    });

    // Move to next chunk with overlap
    startIndex = endIndex - CHUNK_OVERLAP;
    if (startIndex >= transcript.length) break;
  }

  return chunks;
}

/**
 * Process all chunks for a specific analysis type
 */
export async function processChunks<T>(
  chunks: AnalysisChunk[],
  processor: (transcriptText: string) => Promise<T>,
  merger: (results: T[]) => T
): Promise<T> {
  console.log(`Processing ${chunks.length} chunks...`);

  // Process chunks sequentially to avoid rate limits
  const results: T[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    try {
      const transcriptText = chunks[i].transcript
        .map((t) => `${t.label}: ${t.text}`)
        .join('\n');
      
      console.log(`Processing chunk ${i + 1}/${chunks.length}...`);
      const result = await processor(transcriptText);
      results.push(result);
      
      // Small delay to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error(`Chunk ${i + 1} failed:`, error);
      // Continue with other chunks
    }
  }

  return merger(results);
}

/**
 * Merge action items from multiple chunks
 */
export function mergeActionItems(results: string[][]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const chunkItems of results) {
    for (const item of chunkItems) {
      const normalized = item.trim().toLowerCase();
      if (!seen.has(normalized) && item.trim().length > 10) {
        seen.add(normalized);
        merged.push(item.trim());
      }
    }
  }

  return merged;
}

/**
 * Merge decisions from multiple chunks
 */
export function mergeDecisions(results: string[][]): string[] {
  return mergeActionItems(results); // Same logic
}

/**
 * Merge keywords from multiple chunks
 */
export function mergeKeywords(results: string[][]): string[] {
  const keywordCounts = new Map<string, number>();

  for (const chunkKeywords of results) {
    for (const keyword of chunkKeywords) {
      const normalized = keyword.trim().toLowerCase();
      keywordCounts.set(normalized, (keywordCounts.get(normalized) || 0) + 1);
    }
  }

  // Sort by frequency and return top keywords
  return Array.from(keywordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([keyword]) => keyword);
}

/**
 * Merge topics from multiple chunks
 */
export function mergeTopics(results: Topic[][]): Topic[] {
  const topicMap = new Map<string, Topic>();

  for (const chunkTopics of results) {
    for (const topic of chunkTopics) {
      const key = topic.topic.toLowerCase();
      if (!topicMap.has(key)) {
        topicMap.set(key, topic);
      } else {
        // Merge summaries
        const existing = topicMap.get(key)!;
        existing.summary += ' ' + topic.summary;
      }
    }
  }

  return Array.from(topicMap.values()).slice(0, 10);
}

/**
 * Merge unanswered questions from multiple chunks
 */
export function mergeUnansweredQuestions(results: UnansweredQuestion[][]): UnansweredQuestion[] {
  const seen = new Set<string>();
  const merged: UnansweredQuestion[] = [];

  for (const chunkQuestions of results) {
    for (const question of chunkQuestions) {
      const key = `${question.speaker}-${question.question.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(question);
      }
    }
  }

  return merged.slice(0, 20);
}

/**
 * Merge interruptions from multiple chunks
 */
export function mergeInterruptions(results: Interruption[][]): Interruption[] {
  const merged: Interruption[] = [];

  for (const chunkInterruptions of results) {
    merged.push(...chunkInterruptions);
  }

  // Remove duplicates based on timestamp
  const seen = new Set<string>();
  return merged.filter(interruption => {
    const key = `${interruption.timestamp}-${interruption.interrupter}-${interruption.interrupted}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 50);
}

/**
 * Merge relationship graphs from multiple chunks
 */
export function mergeRelationshipGraphs(results: RelationshipGraphData[]): RelationshipGraphData {
  const allNodes = new Map<string, any>();
  const allLinks = new Map<string, any>();

  for (const graph of results) {
    // Merge nodes
    for (const node of graph.nodes) {
      if (!allNodes.has(node.id)) {
        allNodes.set(node.id, node);
      }
    }

    // Merge links
    for (const link of graph.links) {
      const key = `${link.source}-${link.target}`;
      if (!allLinks.has(key)) {
        allLinks.set(key, { ...link });
      } else {
        // Combine link values
        const existing = allLinks.get(key)!;
        existing.value += link.value;
        if (link.avgSentiment !== undefined && existing.avgSentiment !== undefined) {
          existing.avgSentiment = (existing.avgSentiment + link.avgSentiment) / 2;
        }
        if (link.timestamps) {
          existing.timestamps = [...(existing.timestamps || []), ...link.timestamps];
        }
        if (link.topics) {
          existing.topics = [...new Set([...(existing.topics || []), ...link.topics])];
        }
      }
    }
  }

  return {
    nodes: Array.from(allNodes.values()),
    links: Array.from(allLinks.values())
  };
}

/**
 * Merge summary reports from multiple chunks
 */
export function mergeSummaryReports(results: Array<{ summaryReport: string; relationshipSummary: string }>): { summaryReport: string; relationshipSummary: string } {
  const summaries = results.map(r => r.summaryReport).filter(s => s.length > 0);
  const relationships = results.map(r => r.relationshipSummary).filter(s => s.length > 0);

  return {
    summaryReport: summaries.join(' '),
    relationshipSummary: relationships.join(' ')
  };
}
