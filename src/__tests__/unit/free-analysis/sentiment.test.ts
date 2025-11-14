import { analyzeSentiment } from '@/lib/free-analysis/sentiment';

describe('Free Analysis - Sentiment Analysis', () => {
  test('should analyze positive sentiment', () => {
    const text = 'I am very happy and excited about this amazing project!';
    const result = analyzeSentiment(text);
    
    expect(result).toBeDefined();
    expect(result.sentiment).toBe('Positive');
    expect(result.score).toBeGreaterThan(0);
  });

  test('should analyze negative sentiment', () => {
    const text = 'This is terrible and disappointing. I am very upset.';
    const result = analyzeSentiment(text);
    
    expect(result).toBeDefined();
    expect(result.sentiment).toBe('Negative');
    expect(result.score).toBeLessThan(0);
  });

  test('should analyze neutral sentiment', () => {
    const text = 'The meeting is scheduled for tomorrow at 3 PM.';
    const result = analyzeSentiment(text);
    
    expect(result).toBeDefined();
    expect(result.sentiment).toBe('Neutral');
  });

  test('should return score between -1 and 1', () => {
    const text = 'This is a test sentence.';
    const result = analyzeSentiment(text);
    
    expect(result.score).toBeGreaterThanOrEqual(-1);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  test('should handle empty text', () => {
    const result = analyzeSentiment('');
    
    expect(result).toBeDefined();
    expect(result.sentiment).toBeDefined();
  });
});
