'use server';

/**
 * @fileOverview An AI agent for segmenting a meeting transcript into topics.
 *
 * - segmentTopics - A function that handles the topic segmentation.
 * - TopicSegmentationInput - The input type for the segmentTopics function.
 * - TopicSegmentationOutput - The return type for the segmentTopics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TopicSchema = z.object({
  topic: z.string().describe('The title of the topic segment.'),
  summary: z.string().describe('A brief summary of the discussion within the topic segment.'),
});

const TopicSegmentationInputSchema = z.object({
  transcript: z
    .string()
    .describe('The speaker-tagged transcript of the meeting.'),
});
export type TopicSegmentationInput = z.infer<
  typeof TopicSegmentationInputSchema
>;

const TopicSegmentationOutputSchema = z.object({
  topics: z
    .array(TopicSchema)
    .describe('A list of topic segments identified from the transcript.'),
});
export type TopicSegmentationOutput = z.infer<
  typeof TopicSegmentationOutputSchema
>;

export async function segmentTopics(
  input: TopicSegmentationInput
): Promise<TopicSegmentationOutput> {
  const { callGroqWithFallback } = await import('@/ai/groq-client');
  
  return await callGroqWithFallback(input, {
    systemPrompt: 'You are an expert at breaking meeting transcripts into meaningful discussion blocks. For each topic, provide a title and brief summary. Return JSON with a "topics" array of objects with "topic" and "summary" fields.',
    userPrompt: `Segment this transcript into distinct topics:\n\n${input.transcript}`,
    outputSchema: TopicSegmentationOutputSchema,
  });
}

const prompt = ai.definePrompt({
  name: 'topicSegmentationPrompt',
  input: {schema: TopicSegmentationInputSchema},
  output: {schema: TopicSegmentationOutputSchema},
  prompt: `You are an expert at breaking long meeting transcripts into meaningful discussion blocks. Analyze the following transcript and segment it into distinct topics. For each topic, provide a concise title and a brief summary of the conversation.

Transcript:
{{transcript}}

Topics:`,
});

const topicSegmentationFlow = ai.defineFlow(
  {
    name: 'topicSegmentationFlow',
    inputSchema: TopicSegmentationInputSchema,
    outputSchema: TopicSegmentationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
