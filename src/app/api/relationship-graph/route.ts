import { NextRequest, NextResponse } from 'next/server';
import { buildRelationshipGraph } from '@/lib/free-analysis';
import type { TranscriptEntry } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';



export async function POST(req: NextRequest) {
  try {
    const { transcript, mode } = await req.json();
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid transcript' }, { status: 400 });
    }
    
    console.log(`Building relationship graph in ${mode || 'ai'} mode (always rule-based)`);
    
    // Parse transcript to TranscriptEntry[]
    const entries = parseTranscriptToEntries(transcript);
    
    // ALWAYS build graph using rule-based method (both AI and Free modes)
    const { graphData } = buildRelationshipGraph(entries);
    
    console.log(`Relationship graph built: ${graphData.nodes.length} nodes, ${graphData.links.length} links`);
    
    return NextResponse.json({ graphData, method: mode || 'ai' });
  } catch (error) {
    console.error('Relationship graph generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate relationship graph', 
      details: error?.toString() 
    }, { status: 500 });
  }
}

/**
 * Parse transcript string to TranscriptEntry array
 */
function parseTranscriptToEntries(transcript: string): TranscriptEntry[] {
  const lines = transcript.split('\n').filter(line => line.trim());
  const entries: TranscriptEntry[] = [];
  
  lines.forEach((line, index) => {
    // Parse format: "Speaker A (00:01:23): text" or "Speaker A: text"
    const match = line.match(/^(.+?)(?:\s*\((\d{2}:\d{2}:\d{2})\))?:\s*(.+)$/);
    if (match) {
      const label = match[1].trim();
      const timestamp = match[2] || '00:00:00';
      const text = match[3].trim();
      
      entries.push({
        id: index,
        speaker: label,
        label,
        characteristic: { color: '', description: '' },
        text,
        sentiment: 'Neutral', // Will be analyzed separately
        emotion: 'Neutral',
        timestamp,
      });
    }
  });
  
  return entries;
}
