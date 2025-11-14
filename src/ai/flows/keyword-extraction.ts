'use server';

/**
 * @fileOverview An AI agent for extracting keywords and entities from a meeting transcript.
 *
 * - extractKeywords - A function that handles the extraction of keywords and entities.
 * - KeywordExtractionInput - The input type for the extractKeywords function.
 * - KeywordExtractionOutput - The return type for the extractKeywords function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const KeywordExtractionInputSchema = z.object({
  transcript: z
    .string()
    .describe('The speaker-tagged transcript of the meeting.'),
});
export type KeywordExtractionInput = z.infer<
  typeof KeywordExtractionInputSchema
>;

const KeywordExtractionOutputSchema = z.object({
  keywords: z
    .array(z.string())
    .describe('A list of keywords and entities identified from the transcript.'),
});
export type KeywordExtractionOutput = z.infer<
  typeof KeywordExtractionOutputSchema
>;

export async function extractKeywords(
  input: KeywordExtractionInput
): Promise<KeywordExtractionOutput> {
  const { callGroqWithFallback } = await import('@/ai/groq-client');
  
  return await callGroqWithFallback(input, {
    systemPrompt: 'You are an expert at extracting key subjects, names, products, and important entities from meeting transcripts. Return JSON with a "keywords" array of strings.',
    userPrompt: `Extract the most important keywords and entities from this transcript:\n\n${input.transcript}`,
    outputSchema: KeywordExtractionOutputSchema,
  });
}

const prompt = ai.definePrompt({
  name: 'keywordExtractionPrompt',
  input: {schema: KeywordExtractionInputSchema},
  output: {schema: KeywordExtractionOutputSchema},
  prompt: `You are an expert at extracting key subjects, names, products, and other important entities from a meeting transcript. Analyze the following transcript and provide a list of the most important keywords and entities.

Transcript:
{{transcript}}

Keywords and Entities:`,
});

const keywordExtractionFlow = ai.defineFlow(
  {
    name: 'keywordExtractionFlow',
    inputSchema: KeywordExtractionInputSchema,
    outputSchema: KeywordExtractionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
