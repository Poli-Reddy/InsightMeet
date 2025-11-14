import { NextRequest, NextResponse } from 'next/server';
import { segmentTopics as segmentTopicsFree } from '@/lib/free-analysis';
import { segmentTopics as segmentTopicsAI } from '@/ai/flows/topic-segmentation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { transcript, mode = 'ai' } = await req.json();
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid transcript' }, { status: 400 });
    }

    if (mode === 'free') {
      // Use free method (embeddings + cosine similarity)
      console.log('Using free topic segmentation (embeddings + cosine similarity)');
      
      // Parse transcript to extract utterances
      const lines = transcript.split('\n').filter(line => line.trim());
      const utterances: any[] = [];
      
      lines.forEach(line => {
        // Parse format: "Speaker A (00:01:23): text" or "Speaker A: text"
        const match = line.match(/^(.+?)(?:\s*\(\d{2}:\d{2}:\d{2}\))?:\s*(.+)$/);
        if (match) {
          utterances.push({
            label: match[1].trim(),
            text: match[2].trim(),
          });
        }
      });
      
      const result = await segmentTopicsFree(utterances);
      return NextResponse.json({ topics: result.topics, method: 'free' });
    } else {
      // Use AI method
      console.log('Using AI topic segmentation (Gemini)');
      const result = await segmentTopicsAI({ transcript });
      return NextResponse.json({ topics: result.topics, method: 'ai' });
    }
  } catch (error) {
    console.error('Topic segmentation error:', error);
    return NextResponse.json({ error: 'Failed to segment topics', details: error?.toString() }, { status: 500 });
  }
}