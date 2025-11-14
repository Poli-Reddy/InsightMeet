import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json();

    // Generate text-based meeting minutes
    let minutes = `MEETING MINUTES\n`;
    minutes += `${'='.repeat(80)}\n\n`;
    minutes += `Title: ${data.summary.title}\n`;
    minutes += `Date: ${new Date().toLocaleDateString()}\n`;
    minutes += `Overall Sentiment: ${data.summary.overallSentiment}\n\n`;

    minutes += `SUMMARY\n${'-'.repeat(80)}\n`;
    minutes += `${data.summary.summaryReport || data.summary.points.join('\n')}\n\n`;

    if (data.actionItems && data.actionItems.length > 0) {
      minutes += `ACTION ITEMS\n${'-'.repeat(80)}\n`;
      data.actionItems.forEach((item: string, idx: number) => {
        minutes += `${idx + 1}. ${item}\n`;
      });
      minutes += '\n';
    }

    if (data.decisions && data.decisions.length > 0) {
      minutes += `DECISIONS MADE\n${'-'.repeat(80)}\n`;
      data.decisions.forEach((decision: string, idx: number) => {
        minutes += `${idx + 1}. ${decision}\n`;
      });
      minutes += '\n';
    }

    if (data.participation && data.participation.length > 0) {
      minutes += `PARTICIPATION METRICS\n${'-'.repeat(80)}\n`;
      data.participation.forEach((p: any) => {
        minutes += `${p.label || p.speaker}:\n`;
        minutes += `  - Speaking Time: ${p.speakingTime}\n`;
        minutes += `  - Word Count: ${p.wordCount || 0}\n`;
        minutes += `  - Sentiment: ${p.sentiment || 'N/A'}\n`;
        if (p.engagement) minutes += `  - Engagement: ${p.engagement.toFixed(1)}%\n`;
        minutes += '\n';
      });
    }

    if (data.keywords && data.keywords.length > 0) {
      minutes += `KEY TOPICS & KEYWORDS\n${'-'.repeat(80)}\n`;
      minutes += data.keywords.join(', ') + '\n\n';
    }

    if (data.unansweredQuestions && data.unansweredQuestions.length > 0) {
      minutes += `UNANSWERED QUESTIONS\n${'-'.repeat(80)}\n`;
      data.unansweredQuestions.forEach((q: any, idx: number) => {
        minutes += `${idx + 1}. ${q.question} (${q.speaker} at ${q.timestamp})\n`;
      });
      minutes += '\n';
    }

    minutes += `FULL TRANSCRIPT\n${'-'.repeat(80)}\n`;
    data.transcript.forEach((entry: any) => {
      minutes += `[${entry.timestamp}] ${entry.label} (${entry.speaker}):\n`;
      minutes += `${entry.text}\n`;
      minutes += `Sentiment: ${entry.sentiment} | Emotion: ${entry.emotion}\n\n`;
    });

    // Return as downloadable text file (PDF generation would require @react-pdf/renderer server-side)
    return new NextResponse(minutes, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="meeting-minutes-${Date.now()}.txt"`,
      },
    });
  } catch (error) {
    console.error('Error generating minutes:', error);
    return NextResponse.json(
      { error: 'Failed to generate meeting minutes', details: error?.toString() },
      { status: 500 }
    );
  }
}
