import { NextRequest, NextResponse } from 'next/server';
import { analyzeSentiment as analyzeSentimentFree } from '@/lib/free-analysis';
import { classifyEmotion as classifyEmotionAI } from '@/ai/flows/advanced-emotion-classification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { text, mode = 'ai' } = await req.json();
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid text' }, { status: 400 });
    }

    if (mode === 'free') {
      // Use free method (VADER sentiment)
      console.log('Using free sentiment analysis (VADER)');
      const result = analyzeSentimentFree(text);
      
      // Map sentiment to emotion for compatibility
      let emotion = 'Neutral';
      if (result.sentiment === 'Positive') {
        emotion = result.score > 0.5 ? 'Joy' : 'Neutral';
      } else if (result.sentiment === 'Negative') {
        emotion = result.score < -0.5 ? 'Sadness' : 'Neutral';
      }
      
      return NextResponse.json({ 
        emotion, 
        sentiment: result.sentiment,
        score: result.score,
        method: 'free' 
      });
    } else {
      // Use AI method
      console.log('Using AI emotion classification (Gemini)');
      const result = await classifyEmotionAI({ text });
      return NextResponse.json({ emotion: result.emotion, method: 'ai' });
    }
  } catch (error) {
    console.error('Emotion classification error:', error);
    return NextResponse.json({ error: 'Failed to classify emotion', details: error?.toString() }, { status: 500 });
  }
}