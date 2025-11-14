/**
 * Comprehensive Analysis with Full Coverage
 * Processes entire transcript in chunks for 100% accuracy
 */

import type { TranscriptEntry, RelationshipGraphData, Topic, UnansweredQuestion, Interruption } from '@/lib/types';
import {
  chunkTranscript,
  processChunks,
  mergeActionItems,
  mergeDecisions,
  mergeKeywords,
  mergeTopics,
  mergeUnansweredQuestions,
  mergeInterruptions,
  mergeRelationshipGraphs,
  mergeSummaryReports,
} from './chunked-analysis';

export interface ComprehensiveAnalysisResult {
  relationshipGraph: RelationshipGraphData;
  summaryReport: string;
  relationshipSummary: string;
  keyPoints: string[];
  actionItems: string[];
  decisions: string[];
  keywords: string[];
  topics: Topic[];
  unansweredQuestions: UnansweredQuestion[];
  interruptions: Interruption[];
}

/**
 * Generate comprehensive analysis with full transcript coverage
 */
export async function generateComprehensiveAnalysis(
  transcript: TranscriptEntry[],
  overallSentiment: string,
  mode: 'ai' | 'free' = 'ai'
): Promise<ComprehensiveAnalysisResult> {
  console.log(`Starting comprehensive analysis for ${transcript.length} utterances...`);

  // Split transcript into chunks
  const chunks = chunkTranscript(transcript);
  console.log(`Created ${chunks.length} analysis chunks`);

  // Process all analysis types in parallel for faster results
  console.log('Processing analyses in parallel...');
  
  const [
    relationshipGraph,
    summaryData,
    actionItems,
    decisions,
    keywords,
    topics,
    unansweredQuestions,
    interruptions
  ] = await Promise.all([
    // 1. Relationship Graph
    (async () => {
      console.log('1/8 Processing relationship graph...');
      return await processChunks(
        chunks,
        async (transcriptText) => {
          const res = await fetch('/api/relationship-graph', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: transcriptText, mode }),
          });
          if (!res.ok) return { nodes: [], links: [] };
          const json = await res.json();
          return json.graphData || { nodes: [], links: [] };
        },
        mergeRelationshipGraphs
      );
    })(),
    
    // 2. Summary Report
    (async () => {
      console.log('2/8 Processing summary report...');
      return await processChunks(
        chunks,
        async (transcriptText) => {
          const res = await fetch('/api/summary-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transcript: transcriptText,
              overallSentiment,
              relationshipSummary: '',
              mode,
            }),
          });
          if (!res.ok) return { summaryReport: '', relationshipSummary: '' };
          const json = await res.json();
          return {
            summaryReport: json.summaryReport || '',
            relationshipSummary: json.relationshipSummary || '',
          };
        },
        mergeSummaryReports
      );
    })(),
    
    // 3. Action Items
    (async () => {
      console.log('3/8 Processing action items...');
      return await processChunks(
        chunks,
        async (transcriptText) => {
          const res = await fetch('/api/action-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: transcriptText, mode }),
          });
          if (!res.ok) return [];
          const json = await res.json();
          return json.actionItems || [];
        },
        mergeActionItems
      );
    })(),
    
    // 4. Decisions
    (async () => {
      console.log('4/8 Processing decisions...');
      return await processChunks(
        chunks,
        async (transcriptText) => {
          const res = await fetch('/api/decisions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: transcriptText, mode }),
          });
          if (!res.ok) return [];
          const json = await res.json();
          return json.decisions || [];
        },
        mergeDecisions
      );
    })(),
    
    // 5. Keywords
    (async () => {
      console.log('5/8 Processing keywords...');
      return await processChunks(
        chunks,
        async (transcriptText) => {
          const res = await fetch('/api/keywords', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: transcriptText, mode }),
          });
          if (!res.ok) return [];
          const json = await res.json();
          return json.keywords || [];
        },
        mergeKeywords
      );
    })(),
    
    // 6. Topics
    (async () => {
      console.log('6/8 Processing topics...');
      return await processChunks(
        chunks,
        async (transcriptText) => {
          const res = await fetch('/api/topics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: transcriptText, mode }),
          });
          if (!res.ok) return [];
          const json = await res.json();
          return json.topics || [];
        },
        mergeTopics
      );
    })(),
    
    // 7. Unanswered Questions
    (async () => {
      console.log('7/8 Processing unanswered questions...');
      const results = [];
      for (const chunk of chunks) {
        try {
          const transcriptText = chunk.transcript
            .map((t) => `${t.label}: ${t.text}`)
            .join('\n');
            
          const res = await fetch('/api/unanswered-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: transcriptText, mode }),
          });
          if (res.ok) {
            const json = await res.json();
            results.push(json.unansweredQuestions || []);
          }
        } catch (error) {
          console.error('Unanswered questions chunk failed:', error);
        }
      }
      return mergeUnansweredQuestions(results);
    })(),
    
    // 8. Interruptions
    (async () => {
      console.log('8/8 Processing interruptions...');
      const results = [];
      for (const chunk of chunks) {
        try {
          const transcriptText = chunk.transcript
            .map((t) => `${t.label}: ${t.text}`)
            .join('\n');
            
          const res = await fetch('/api/interruptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript: transcriptText, mode }),
          });
          if (res.ok) {
            const json = await res.json();
            results.push(json.interruptions || []);
          }
        } catch (error) {
          console.error('Interruptions chunk failed:', error);
        }
      }
      return mergeInterruptions(results);
    })()
  ]);

  const keyPoints = summaryData.summaryReport
    ? summaryData.summaryReport.split(/\n|\./).map((p: string) => p.trim()).filter((p: string) => p.length > 0)
    : [];

  console.log('Comprehensive analysis complete!');
  console.log(`- Relationship graph: ${relationshipGraph.nodes.length} nodes, ${relationshipGraph.links.length} links`);
  console.log(`- Action items: ${actionItems.length}`);
  console.log(`- Decisions: ${decisions.length}`);
  console.log(`- Keywords: ${keywords.length}`);
  console.log(`- Topics: ${topics.length}`);

  return {
    relationshipGraph,
    summaryReport: summaryData.summaryReport,
    relationshipSummary: summaryData.relationshipSummary,
    keyPoints,
    actionItems,
    decisions,
    keywords,
    topics,
    unansweredQuestions,
    interruptions,
  };
}
