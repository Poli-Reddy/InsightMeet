import { NextRequest, NextResponse } from 'next/server';
import { extractActionItems as extractActionItemsFree } from '@/lib/free-analysis';
import { extractActionItems as extractActionItemsAI } from '@/ai/flows/action-item-extraction';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { transcript, mode = 'ai' } = await req.json();
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid transcript' }, { status: 400 });
    }

    if (mode === 'free') {
      // Use free method (NLP + patterns)
      console.log('Using free action item extraction (NLP + patterns)');
      const result = extractActionItemsFree(transcript);
      return NextResponse.json({ actionItems: result.actionItems, method: 'free' });
    } else {
      // Use AI method
      console.log('Using AI action item extraction (Gemini)');
      const result = await extractActionItemsAI({ transcript });
      return NextResponse.json({ actionItems: result.actionItems, method: 'ai' });
    }
  } catch (error) {
    console.error('Action item extraction error:', error);
    return NextResponse.json({ error: 'Failed to extract action items', details: error?.toString() }, { status: 500 });
  }
}