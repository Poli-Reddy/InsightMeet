import { identifyDecisions } from '@/lib/free-analysis/decisions';

describe('Free Analysis - Decision Identification', () => {
  const sampleText = `
    We decided to extend the deadline by one week.
    The team agreed to use TypeScript for the project.
    It was determined that we need more resources.
    We concluded that the current approach is not working.
    The decision was made to hire two more developers.
  `;

  test('should identify decisions from text', () => {
    const result = identifyDecisions(sampleText);
    
    expect(result).toBeDefined();
    expect(result.decisions).toBeDefined();
    expect(Array.isArray(result.decisions)).toBe(true);
  });

  test('should find decisions with decision keywords', () => {
    const result = identifyDecisions(sampleText);
    
    expect(result.decisions.length).toBeGreaterThan(0);
  });

  test('should identify "decided" decisions', () => {
    const text = 'We decided to move forward with the plan.';
    const result = identifyDecisions(text);
    
    expect(result.decisions.length).toBeGreaterThan(0);
  });

  test('should identify "agreed" decisions', () => {
    const text = 'The team agreed to the new timeline.';
    const result = identifyDecisions(text);
    
    expect(result.decisions.length).toBeGreaterThan(0);
  });

  test('should identify "concluded" decisions', () => {
    const text = 'We concluded that we need more testing.';
    const result = identifyDecisions(text);
    
    expect(result.decisions.length).toBeGreaterThan(0);
  });

  test('should handle text without decisions', () => {
    const text = 'This is a regular discussion.';
    const result = identifyDecisions(text);
    
    expect(result.decisions).toBeDefined();
    expect(Array.isArray(result.decisions)).toBe(true);
  });
});
