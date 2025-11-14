import { generateSummary } from '@/lib/free-analysis/summary';

describe('Free Analysis - Summary Generation', () => {
  const sampleText = `
    The meeting started with a discussion about the project timeline.
    John expressed concerns about meeting the Friday deadline.
    Sarah suggested extending the deadline by one week.
    The team agreed to the extension.
    Mike will update the project plan accordingly.
    The next meeting is scheduled for next Monday.
  `;

  test('should generate summary from text', () => {
    const result = generateSummary(sampleText, 3);
    
    expect(result).toBeDefined();
    expect(result.summaryReport).toBeDefined();
    expect(typeof result.summaryReport).toBe('string');
  });

  test('should return non-empty summary', () => {
    const result = generateSummary(sampleText, 3);
    
    expect(result.summaryReport.length).toBeGreaterThan(0);
  });

  test('should respect sentence count parameter', () => {
    const result = generateSummary(sampleText, 2);
    const sentences = result.summaryReport.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    expect(sentences.length).toBeLessThanOrEqual(2);
  });

  test('should handle empty text', () => {
    const result = generateSummary('', 3);
    
    expect(result.summaryReport).toBeDefined();
  });

  test('should handle single sentence', () => {
    const result = generateSummary('This is a single sentence.', 3);
    
    expect(result.summaryReport).toBeDefined();
    expect(result.summaryReport.length).toBeGreaterThan(0);
  });
});
