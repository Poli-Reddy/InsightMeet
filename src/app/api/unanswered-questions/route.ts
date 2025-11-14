import { NextRequest, NextResponse } from 'next/server';
import { detectUnansweredQuestions as detectUnansweredQuestionsFree } from '@/lib/free-analysis';
import { extractUnansweredQuestions as extractUnansweredQuestionsAI } from '@/ai/flows/unanswered-question-detection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { transcript, mode = 'ai' } = await req.json();
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid transcript' }, { status: 400 });
    }

    if (mode === 'free') {
      // Use free method (adjacency logic)
      console.log('Using free unanswered question detection (adjacency logic)');
      
      // Parse transcript to extract utterances
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
      
      const result = detectUnansweredQuestionsFree(utterances);
      return NextResponse.json({ unansweredQuestions: result.unansweredQuestions, method: 'free' });
    } else {
      // Use AI method
      console.log('Using AI unanswered question detection (Gemini)');
      const result = await extractUnansweredQuestionsAI({ transcript });
      return NextResponse.json({ unansweredQuestions: result.unansweredQuestions, method: 'ai' });
    }
  } catch (error) {
    console.error('Unanswered question detection error:', error);
    return NextResponse.json({ error: 'Failed to extract unanswered questions', details: error?.toString() }, { status: 500 });
  }
}
