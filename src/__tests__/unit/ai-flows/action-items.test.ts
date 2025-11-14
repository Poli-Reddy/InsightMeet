import { extractActionItems } from '@/ai/flows/action-item-extraction';

// Mock the AI client
jest.mock('@/ai/groq-client', () => ({
  callGroqWithFallback: jest.fn().mockResolvedValue({
    actionItems: ['John will send report', 'Sarah will schedule meeting']
  })
}));

describe('Action Items Extraction', () => {
  test('should extract action items from transcript', async () => {
    const input = {
      transcript: 'John: I will send the report by Friday. Sarah: I will schedule the follow-up meeting.'
    };

    const result = await extractActionItems(input);

    expect(result.actionItems).toBeDefined();
    expect(result.actionItems.length).toBeGreaterThan(0);
    expect(result.actionItems).toContain('John will send report');
  });

  test('should return empty array for transcript with no action items', async () => {
    const { callGroqWithFallback } = require('@/ai/groq-client');
    callGroqWithFallback.mockResolvedValueOnce({ actionItems: [] });

    const input = { transcript: 'Just casual conversation.' };
    const result = await extractActionItems(input);

    expect(result.actionItems).toEqual([]);
  });
});
