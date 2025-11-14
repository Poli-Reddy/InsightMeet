import { NextRequest } from 'next/server';

describe('Free Mode API Integration', () => {
  const testTranscript = `
    Speaker A (00:00:05): Good morning everyone.
    Speaker B (00:00:10): Good morning! Let's discuss the project.
    Speaker A (00:00:15): We decided to extend the deadline.
  `;

  describe('Keywords API - Free Mode', () => {
    test('should accept mode parameter', async () => {
      const { POST } = await import('@/app/api/keywords/route');
      
      const request = new NextRequest('http://localhost:3000/api/keywords', {
        method: 'POST',
        body: JSON.stringify({
          transcript: testTranscript,
          mode: 'free'
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.keywords).toBeDefined();
      expect(data.method).toBe('free');
    });
  });

  describe('Summary API - Free Mode', () => {
    test('should generate summary in free mode', async () => {
      const { POST } = await import('@/app/api/summary-report/route');
      
      const request = new NextRequest('http://localhost:3000/api/summary-report', {
        method: 'POST',
        body: JSON.stringify({
          transcript: testTranscript,
          mode: 'free'
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.summaryReport).toBeDefined();
      expect(data.method).toBe('free');
    });
  });

  describe('Action Items API - Free Mode', () => {
    test('should extract action items in free mode', async () => {
      const { POST } = await import('@/app/api/action-items/route');
      
      const request = new NextRequest('http://localhost:3000/api/action-items', {
        method: 'POST',
        body: JSON.stringify({
          transcript: testTranscript,
          mode: 'free'
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.actionItems).toBeDefined();
      expect(data.method).toBe('free');
    });
  });

  describe('Decisions API - Free Mode', () => {
    test('should identify decisions in free mode', async () => {
      const { POST } = await import('@/app/api/decisions/route');
      
      const request = new NextRequest('http://localhost:3000/api/decisions', {
        method: 'POST',
        body: JSON.stringify({
          transcript: testTranscript,
          mode: 'free'
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.decisions).toBeDefined();
      expect(data.method).toBe('free');
    });
  });

  describe('Emotions API - Free Mode', () => {
    test('should analyze sentiment in free mode', async () => {
      const { POST } = await import('@/app/api/emotions/route');
      
      const request = new NextRequest('http://localhost:3000/api/emotions', {
        method: 'POST',
        body: JSON.stringify({
          text: 'I am very happy today!',
          mode: 'free'
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.emotion).toBeDefined();
      expect(data.method).toBe('free');
    });
  });
});
