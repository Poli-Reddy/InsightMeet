/**
 * Free Sentiment Analysis using VADER
 * No AI, 100x faster, 0.96 correlation with human judgment
 */

import vader from 'vader-sentiment';

export interface SentimentAnalysisResult {
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  score: number; // -1 to 1
}

/**
 * Analyze sentiment using VADER (Valence Aware Dictionary and sEntiment Reasoner)
 * Optimized for social media and conversational text
 */
export function analyzeSentiment(text: string): SentimentAnalysisResult {
  // VADER returns: { neg, neu, pos, compound }
  // compound score: -1 (most negative) to +1 (most positive)
  const result = vader.SentimentIntensityAnalyzer.polarity_scores(text);

  const compound = result.compound;

  // Classify based on compound score
  // VADER thresholds: >= 0.05 positive, <= -0.05 negative, else neutral
  let sentiment: 'Positive' | 'Negative' | 'Neutral';

  if (compound >= 0.05) {
    sentiment = 'Positive';
  } else if (compound <= -0.05) {
    sentiment = 'Negative';
  } else {
    sentiment = 'Neutral';
  }

  return {
    sentiment,
    score: compound,
  };
}

/**
 * Analyze sentiment for multiple texts and return average
 */
export function analyzeBatchSentiment(texts: string[]): SentimentAnalysisResult {
  if (texts.length === 0) {
    return { sentiment: 'Neutral', score: 0 };
  }

  const scores = texts.map(text => analyzeSentiment(text).score);
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  let sentiment: 'Positive' | 'Negative' | 'Neutral';
  if (avgScore >= 0.05) {
    sentiment = 'Positive';
  } else if (avgScore <= -0.05) {
    sentiment = 'Negative';
  } else {
    sentiment = 'Neutral';
  }

  return {
    sentiment,
    score: avgScore,
  };
}
