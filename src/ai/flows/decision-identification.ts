'use server';

/**
 * @fileOverview An AI agent for identifying decisions from a meeting transcript.
 *
 * - identifyDecisions - A function that handles the identification of decisions.
 * - DecisionIdentificationInput - The input type for the identifyDecisions function.
 * - DecisionIdentificationOutput - The return type for the identifyDecisions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DecisionIdentificationInputSchema = z.object({
  transcript: z
    .string()
    .describe('The speaker-tagged transcript of the meeting.'),
});
export type DecisionIdentificationInput = z.infer<
  typeof DecisionIdentificationInputSchema
>;

const DecisionIdentificationOutputSchema = z.object({
  decisions: z
    .array(z.string())
    .describe('A list of decisions identified from the transcript.'),
});
export type DecisionIdentificationOutput = z.infer<
  typeof DecisionIdentificationOutputSchema
>;

export async function identifyDecisions(
  input: DecisionIdentificationInput
): Promise<DecisionIdentificationOutput> {
  const { callGroqWithFallback } = await import('@/ai/groq-client');
  
  return await callGroqWithFallback(input, {
    systemPrompt: 'You are an expert at identifying final decisions made during meetings. Extract all key decisions as clear, concise statements. Return JSON with a "decisions" array of strings.',
    userPrompt: `Analyze this transcript and extract all decisions:\n\n${input.transcript}`,
    outputSchema: DecisionIdentificationOutputSchema,
  });
}

const prompt = ai.definePrompt({
  name: 'decisionIdentificationPrompt',
  input: {schema: DecisionIdentificationInputSchema},
  output: {schema: DecisionIdentificationOutputSchema},
  prompt: `You are an expert at identifying final decisions made during a meeting from a transcript. Analyze the following transcript and extract all key decisions. Each decision should be a clear, concise statement of what was agreed upon.

Transcript:
{{transcript}}

Decisions:`,
});

const decisionIdentificationFlow = ai.defineFlow(
  {
    name: 'decisionIdentificationFlow',
    inputSchema: DecisionIdentificationInputSchema,
    outputSchema: DecisionIdentificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
