'use server';

/**
 * @fileOverview An AI agent for extracting action items from a meeting transcript.
 *
 * - extractActionItems - A function that handles the extraction of action items.
 * - ActionItemExtractionInput - The input type for the extractActionItems function.
 * - ActionItemExtractionOutput - The return type for the extractActionItems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ActionItemExtractionInputSchema = z.object({
  transcript: z
    .string()
    .describe('The speaker-tagged transcript of the meeting.'),
});
export type ActionItemExtractionInput = z.infer<
  typeof ActionItemExtractionInputSchema
>;

const ActionItemExtractionOutputSchema = z.object({
  actionItems: z
    .array(z.string())
    .describe('A list of action items identified from the transcript.'),
});
export type ActionItemExtractionOutput = z.infer<
  typeof ActionItemExtractionOutputSchema
>;

export async function extractActionItems(
  input: ActionItemExtractionInput
): Promise<ActionItemExtractionOutput> {
  const { callGroqWithFallback } = await import('@/ai/groq-client');
  
  return await callGroqWithFallback(input, {
    systemPrompt: 'You are an expert at identifying tasks, assignments, and responsibilities from meeting transcripts. Extract all action items as clear, concise statements. Return JSON with an "actionItems" array of strings.',
    userPrompt: `Analyze this transcript and extract all action items:\n\n${input.transcript}`,
    outputSchema: ActionItemExtractionOutputSchema,
  });
}

// Keep Gemini flow as backup (used by callGroqWithFallback)
const prompt = ai.definePrompt({
  name: 'actionItemExtractionPrompt',
  input: {schema: ActionItemExtractionInputSchema},
  output: {schema: ActionItemExtractionOutputSchema},
  prompt: `You are an expert at identifying tasks, assignments, and responsibilities from a meeting transcript. Analyze the following transcript and extract all action items. Each action item should be a clear, concise statement.

Transcript:
{{transcript}}

Action Items:`,
});

const actionItemExtractionFlow = ai.defineFlow(
  {
    name: 'actionItemExtractionFlow',
    inputSchema: ActionItemExtractionInputSchema,
    outputSchema: ActionItemExtractionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
