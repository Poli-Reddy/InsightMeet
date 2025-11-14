import { NextRequest, NextResponse } from 'next/server';
import { identifyDecisions as identifyDecisionsFree } from '@/lib/free-analysis';
import { identifyDecisions as identifyDecisionsAI } from '@/ai/flows/decision-identification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { transcript, mode = 'ai' } = await req.json();
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid transcript' }, { status: 400 });
    }

    if (mode === 'free') {
      // Use free method (pattern matching)
      console.log('Using free decision identification (pattern matching)');
      const result = identifyDecisionsFree(transcript);
      return NextResponse.json({ decisions: result.decisions, method: 'free' });
    } else {
      // Use AI method
      console.log('Using AI decision identification (Gemini)');
      const result = await identifyDecisionsAI({ transcript });
      return NextResponse.json({ decisions: result.decisions, method: 'ai' });
    }
  } catch (error) {
    console.error('Decision identification error:', error);
    return NextResponse.json({ error: 'Failed to identify decisions', details: error?.toString() }, { status: 500 });
  }
}