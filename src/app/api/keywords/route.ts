import { NextRequest, NextResponse } from 'next/server';
import { extractKeywords as extractKeywordsFree } from '@/lib/free-analysis';
import { extractKeywords as extractKeywordsAI } from '@/ai/flows/keyword-extraction';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { transcript, mode = 'ai' } = await req.json();
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid transcript' }, { status: 400 });
    }

    if (mode === 'free') {
      // Use free method (TF-IDF + NER)
      console.log('Using free keyword extraction (TF-IDF + NER)');
      const result = extractKeywordsFree(transcript);
      return NextResponse.json({ keywords: result.keywords, method: 'free' });
    } else {
      // Use AI method
      console.log('Using AI keyword extraction (Gemini)');
      const result = await extractKeywordsAI({ transcript });
      return NextResponse.json({ keywords: result.keywords, method: 'ai' });
    }
  } catch (error) {
    console.error('Keyword extraction error:', error);
    return NextResponse.json({ error: 'Failed to extract keywords', details: error?.toString() }, { status: 500 });
  }
}