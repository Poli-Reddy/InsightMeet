import { NextRequest, NextResponse } from 'next/server';
import { generateSummary as generateSummaryFree } from '@/lib/free-analysis';
import { generateSummaryReport as generateSummaryReportAI } from '@/ai/flows/summary-report-generation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { transcript, overallSentiment, relationshipSummary, mode = 'ai' } = await req.json();
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid transcript' }, { status: 400 });
    }

    if (mode === 'free') {
      // Use free method (LexRank extractive summarization)
      console.log('Using free summary generation (LexRank)');
      const result = generateSummaryFree(transcript, 5); // 5 key sentences
      
      // Add context about sentiment and relationships
      let enhancedSummary = result.summaryReport;
      if (overallSentiment) {
        enhancedSummary += ` The overall sentiment of the meeting was ${overallSentiment.toLowerCase()}.`;
      }
      if (relationshipSummary) {
        enhancedSummary += ` ${relationshipSummary}`;
      }
      
      return NextResponse.json({ 
        summaryReport: enhancedSummary,
        relationshipSummary: relationshipSummary || '',
        method: 'free' 
      });
    } else {
      // Use AI method
      console.log('Using AI summary generation (Gemini)');
      const result = await generateSummaryReportAI({ transcript, overallSentiment, relationshipSummary });
      return NextResponse.json({ 
        summaryReport: result.summaryReport,
        relationshipSummary: relationshipSummary || '',
        method: 'ai' 
      });
    }
  } catch (error) {
    console.error('Summary generation error:', error);
    return NextResponse.json({ error: 'Failed to generate summary report', details: error?.toString() }, { status: 500 });
  }
}