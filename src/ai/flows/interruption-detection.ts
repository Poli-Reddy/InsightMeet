'use server';

/**
 * @fileOverview An AI agent for detecting interruptions in a meeting transcript.
 *
 * - detectInterruptions - A function that handles the detection of interruptions.
 * - InterruptionDetectionInput - The input type for the detectInterruptions function.
 * - InterruptionDetectionOutput - The return type for the detectInterruptions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InterruptionDetectionInputSchema = z.object({
  transcript: z
    .string()
    .describe('The speaker-tagged transcript of the meeting.'),
});
export type InterruptionDetectionInput = z.infer<
  typeof InterruptionDetectionInputSchema
>;

const interruptionSchema = z.object({
  interrupter: z.string().describe('The speaker who interrupted.'),
  interrupted: z.string().describe('The speaker who was interrupted.'),
  timestamp: z.string().describe('The timestamp of the interruption.'),
  text: z.string().describe('The text of the interruption.'),
});

const InterruptionDetectionOutputSchema = z.object({
  interruptions: z.array(interruptionSchema),
});
export type InterruptionDetectionOutput = z.infer<
  typeof InterruptionDetectionOutputSchema
>;

export async function detectInterruptions(
  input: InterruptionDetectionInput
): Promise<InterruptionDetectionOutput> {
  const { callGroqWithFallback } = await import('@/ai/groq-client');
  
  return await callGroqWithFallback(input, {
    systemPrompt: 'You are an expert at detecting interruptions in meeting transcripts. Return JSON with "interruptions" array containing objects with "interrupter", "interrupted", "timestamp", and "text" fields.',
    userPrompt: `Identify all interruptions (when a speaker begins talking before the previous speaker finished) in this transcript:\n\n${input.transcript}`,
    outputSchema: InterruptionDetectionOutputSchema,
  });
}

const prompt = ai.definePrompt({
  name: 'interruptionDetectionPrompt',
  input: {schema: InterruptionDetectionInputSchema},
  output: {schema: InterruptionDetectionOutputSchema},
  prompt: `Analyze the following meeting transcript and identify any interruptions.
An interruption is when a speaker begins talking before the previous speaker has finished their sentence.
For each interruption, provide the speaker who interrupted, the speaker who was interrupted, the timestamp of the interruption, and the text of the interruption.

Transcript:
{{transcript}}

Interruptions:`,
});

const interruptionDetectionFlow = ai.defineFlow(
  {
    name: 'interruptionDetectionFlow',
    inputSchema: InterruptionDetectionInputSchema,
    outputSchema: InterruptionDetectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
