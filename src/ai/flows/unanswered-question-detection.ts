'use server';

/**
 * @fileOverview An AI agent for detecting unanswered questions in a meeting transcript.
 *
 * - extractUnansweredQuestions - A function that handles the extraction of unanswered questions.
 * - UnansweredQuestionExtractionInput - The input type for the extractUnansweredQuestions function.
 * - UnansweredQuestionExtractionOutput - The return type for the extractUnansweredQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UnansweredQuestionExtractionInputSchema = z.object({
  transcript: z
    .string()
    .describe('The speaker-tagged transcript of the meeting.'),
});
export type UnansweredQuestionExtractionInput = z.infer<
  typeof UnansweredQuestionExtractionInputSchema
>;

const unansweredQuestionSchema = z.object({
  question: z.string().describe('The question that was asked but not answered.'),
  speaker: z.string().describe('The speaker who asked the question.'),
  timestamp: z.string().describe('The timestamp of when the question was asked.'),
});

const UnansweredQuestionExtractionOutputSchema = z.object({
  unansweredQuestions: z.array(unansweredQuestionSchema),
});
export type UnansweredQuestionExtractionOutput = z.infer<
  typeof UnansweredQuestionExtractionOutputSchema
>;

export async function extractUnansweredQuestions(
  input: UnansweredQuestionExtractionInput
): Promise<UnansweredQuestionExtractionOutput> {
  const { callGroqWithFallback } = await import('@/ai/groq-client');
  
  return await callGroqWithFallback(input, {
    systemPrompt: 'You are an expert at identifying unanswered questions in meeting transcripts. Return JSON with "unansweredQuestions" array containing objects with "question", "speaker", and "timestamp" fields.',
    userPrompt: `Identify questions that were asked but not answered in this transcript:\n\n${input.transcript}`,
    outputSchema: UnansweredQuestionExtractionOutputSchema,
  });
}

const prompt = ai.definePrompt({
  name: 'unansweredQuestionExtractionPrompt',
  input: {schema: UnansweredQuestionExtractionInputSchema},
  output: {schema: UnansweredQuestionExtractionOutputSchema},
  prompt: `Analyze the following meeting transcript and identify any questions that were asked but went unanswered.
Focus on direct questions that were posed but did not receive a direct answer or acknowledgement from other participants.
For each unanswered question, provide the question, the speaker who asked it, and the timestamp.

Transcript:
{{transcript}}

Unanswered Questions:`,
});

const unansweredQuestionExtractionFlow = ai.defineFlow(
  {
    name: 'unansweredQuestionExtractionFlow',
    inputSchema: UnansweredQuestionExtractionInputSchema,
    outputSchema: UnansweredQuestionExtractionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
