import { NextRequest } from 'next/server';

describe('Mode Comparison Tests', () => {
  const testTranscript = `
    Speaker A (00:00:05): We need to complete the project by Friday.
    Speaker B (00:00:10): I agree. John will handle the backend.
    Speaker A (00:00:15): Sarah should focus on the frontend.
    Speaker B (00:00:20): We decided to use TypeScript.
  `;

  describe('Keywords Extraction Comparison', () => {
    test('both modes should return keywords', async () => {
      const { POST } = await import('@/app/api/keywords/route');
      
      // Test Free Mode
      const freeRequest = new NextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify({ transcript: testTranscript, mode: 'free' }),
      });
      const freeResponse = await POST(freeRequest);
      const freeData = await freeResponse.json();
      
      // Test AI Mode
      const aiRequest = new NextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify({ transcript: testTranscript, mode: 'ai' }),
      });
      const aiResponse = await POST(aiRequest);
      const aiData = await aiResponse.json();
      
      expect(freeData.keywords).toBeDefined();
      expect(aiData.keywords).toBeDefined();
      expect(Array.isArray(freeData.keywords)).toBe(true);
      expect(Array.isArray(aiData.keywords)).toBe(true);
    });
  });

  describe('Summary Generation Comparison', () => {
    test('both modes should return summaries', async () => {
      const { POST } = await import('@/app/api/summary-report/route');
      
      // Test Free Mode
      const freeRequest = new NextRequest('http://localhost:3000/api/summary-report', {
        method: 'POST',
        body: JSON.stringify({ transcript: testTranscript, mode: 'free' }),
      });
      const freeResponse = await POST(freeRequest);
      const freeData = await freeResponse.json();
      
      // Test AI Mode
      const aiRequest = new NextRequest('http://localhost:3000/api/summary-report', {
        method: 'POST',
        body: JSON.stringify({ transcript: testTranscript, mode: 'ai' }),
      });
      const aiResponse = await POST(aiRequest);
      const aiData = await aiResponse.json();
      
      expect(freeData.summaryReport).toBeDefined();
      expect(aiData.summaryReport).toBeDefined();
      expect(typeof freeData.summaryReport).toBe('string');
      expect(typeof aiData.summaryReport).toBe('string');
    });
  });

  describe('Action Items Extraction Comparison', () => {
    test('both modes should find action items', async () => {
      const { POST } = await import('@/app/api/action-items/route');
      
      // Test Free Mode
      const freeRequest = new NextRequest('http://localhost:3000/api/action-items', {
        method: 'POST',
        body: JSON.stringify({ transcript: testTranscript, mode: 'free' }),
      });
      const freeResponse = await POST(freeRequest);
      const freeData = await freeResponse.json();
      
      // Test AI Mode
      const aiRequest = new NextRequest('http://localhost:3000/api/action-items', {
        method: 'POST',
        body: JSON.stringify({ transcript: testTranscript, mode: 'ai' }),
      });
      const aiResponse = await POST(aiRequest);
      const aiData = await aiResponse.json();
      
      expect(freeData.actionItems).toBeDefined();
      expect(aiData.actionItems).toBeDefined();
      expect(Array.isArray(freeData.actionItems)).toBe(true);
      expect(Array.isArray(aiData.actionItems)).toBe(true);
    });
  });

  describe('Response Format Consistency', () => {
    test('both modes should return consistent response structure', async () => {
      const { POST } = await import('@/app/api/keywords/route');
      
      const freeRequest = new NextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify({ transcript: testTranscript, mode: 'free' }),
      });
      const freeResponse = await POST(freeRequest);
      const freeData = await freeResponse.json();
      
      const aiRequest = new NextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify({ transcript: testTranscript, mode: 'ai' }),
      });
      const aiResponse = await POST(aiRequest);
      const aiData = await aiResponse.json();
      
      // Both should have same structure
      expect(Object.keys(freeData).sort()).toEqual(Object.keys(aiData).sort());
    });
  });
});
