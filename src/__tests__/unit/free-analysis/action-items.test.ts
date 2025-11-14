import { extractActionItems } from '@/lib/free-analysis/action-items';

describe('Free Analysis - Action Items Extraction', () => {
  const sampleText = `
    John will complete the database migration by Friday.
    Sarah needs to review the pull request.
    We should schedule a follow-up meeting next week.
    Mike must update the documentation.
    The team has to deploy to production.
  `;

  test('should extract action items from text', () => {
    const result = extractActionItems(sampleText);
    
    expect(result).toBeDefined();
    expect(result.actionItems).toBeDefined();
    expect(Array.isArray(result.actionItems)).toBe(true);
  });

  test('should find action items with modal verbs', () => {
    const result = extractActionItems(sampleText);
    
    expect(result.actionItems.length).toBeGreaterThan(0);
  });

  test('should extract items with "will"', () => {
    const text = 'John will complete the task.';
    const result = extractActionItems(text);
    
    expect(result.actionItems.length).toBeGreaterThan(0);
  });

  test('should extract items with "should"', () => {
    const text = 'We should review the code.';
    const result = extractActionItems(text);
    
    expect(result.actionItems.length).toBeGreaterThan(0);
  });

  test('should extract items with "must"', () => {
    const text = 'The team must deploy today.';
    const result = extractActionItems(text);
    
    expect(result.actionItems.length).toBeGreaterThan(0);
  });

  test('should handle text without action items', () => {
    const text = 'This is a simple statement.';
    const result = extractActionItems(text);
    
    expect(result.actionItems).toBeDefined();
    expect(Array.isArray(result.actionItems)).toBe(true);
  });
});
