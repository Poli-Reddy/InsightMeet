import { extractKeywords } from '@/lib/free-analysis/keywords';

describe('Free Analysis - Keywords Extraction', () => {
  const sampleText = `
    The project deadline is next Friday. We need to complete the implementation
    of the authentication system and deploy to production. John will handle
    the database migration while Sarah focuses on the frontend components.
    The client expects a demo by Thursday.
  `;

  test('should extract keywords from text', () => {
    const result = extractKeywords(sampleText);
    
    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
  });

  test('should return non-empty keywords array', () => {
    const result = extractKeywords(sampleText);
    
    expect(result.keywords.length).toBeGreaterThan(0);
  });

  test('should extract relevant keywords', () => {
    const result = extractKeywords(sampleText);
    const keywords = result.keywords.map(k => k.toLowerCase());
    
    // Should contain project-related terms
    const hasRelevantKeywords = keywords.some(k => 
      k.includes('project') || 
      k.includes('deadline') || 
      k.includes('authentication') ||
      k.includes('production')
    );
    
    expect(hasRelevantKeywords).toBe(true);
  });

  test('should handle empty text', () => {
    const result = extractKeywords('');
    
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
  });

  test('should handle short text', () => {
    const result = extractKeywords('Hello world');
    
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);
  });
});
