import { NextRequest } from 'next/server';

describe('AI Mode API Integration', () => {
  const testTranscript = `
    Speaker A (00:00:05): Good morning everyone.
    Speaker B (00:00:10): Good morning! Let's discuss the project.
    Speaker A (00:00:15): We decided to extend the deadline.
  `;

  describe('Keywords API - AI Mode', () => {
    test('should accept mode parameter', async () => {
      const { POST } = await import('@/app/api/keywords/route');
      
      const request = new NextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify({
          transcript: testTranscript,
          mode: 'ai'
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.keywords).toBeDefined();
      expect(data.method).toBe('ai');
    });
  });

  describe('Summary API - AI Mode', () => {
    test('should generate summary in AI mode', async () => {
      const { POST } = await import('@/app/api/summary-report/route');
      
      const request = new NextRequest('http://localhost:3000/api/summary-report', {
        method: 'POST',
        body: JSON.stringify({
          transcript: testTranscript,
          mode: 'ai'
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.summaryReport).toBeDefined();
      expect(data.method).toBe('ai');
    });
  });

  describe('Action Items API - AI Mode', () => {
    test('should extract action items in AI mode', async () => {
      const { POST } = await import('@/app/api/action-items/route');
      
      const request = new NextRequest('http://localhost:3000/api/action-items', {
        method: 'POST',
        body: JSON.stringify({
          transcript: testTranscript,
          mode: 'ai'
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.actionItems).toBeDefined();
      expect(data.method).toBe('ai');
    });
  });

  describe('Mode Routing', () => {
    test('should default to AI mode when mode not specified', async () => {
      const { POST } = await import('@/app/api/keywords/route');
      
      const request = new NextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify({
          transcript: testTranscript
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.method).toBe('ai');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing transcript', async () => {
      const { POST } = await import('@/app/api/keywords/route');
      
      const request = new NextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'ai'
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});
