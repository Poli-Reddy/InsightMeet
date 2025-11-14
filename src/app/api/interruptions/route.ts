import { NextRequest, NextResponse } from 'next/server';
import { detectInterruptions as detectInterruptionsFree } from '@/lib/free-analysis';
import { detectInterruptions as detectInterruptionsAI } from '@/ai/flows/interruption-detection';
import type { TranscriptEntry } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { transcript, mode = 'ai' } = await req.json();
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid transcript' }, { status: 400 });
    }

    if (mode === 'free') {
      // Use free method (timestamp analysis)
      console.log('Using free interruption detection (timestamp analysis)');
      
      // Parse transcript to extract utterances with timing info
      const lines = transcript.split('\n').filter(line => line.trim());
      const utterances: any[] = [];
      
      lines.forEach(line => {
        // Parse format: "Speaker A (00:01:23): text"
        const match = line.match(/^(.+?)\s*\((\d{2}:\d{2}:\d{2})\):\s*(.+)$/);
        if (match) {
          utterances.push({
            label: match[1].trim(),
            speaker: match[1].trim(),
            timestamp: match[2],
            text: match[3].trim(),
          });
        }
      });
      
      const result = detectInterruptionsFree(utterances);
      return NextResponse.json({ interruptions: result.interruptions, method: 'free' });
    } else {
      // Use AI method
      console.log('Using AI interruption detection (Gemini)');
      const result = await detectInterruptionsAI({ transcript });
      return NextResponse.json({ interruptions: result.interruptions, method: 'ai' });
    }
  } catch (error) {
    console.error('Interruption detection error:', error);
    return NextResponse.json({ error: 'Failed to detect interruptions', details: error?.toString() }, { status: 500 });
  }
}
