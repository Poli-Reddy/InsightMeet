'use server';

/**
 * @fileOverview An AI agent for advanced emotion classification of text.
 *
 * - classifyEmotion - A function that handles the emotion classification.
 * - EmotionClassificationInput - The input type for the classifyEmotion function.
 * - EmotionClassificationOutput - The return type for the classifyEmotion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EmotionClassificationInputSchema = z.object({
  text: z.string().describe('The text to classify.'),
});
export type EmotionClassificationInput = z.infer<
  typeof EmotionClassificationInputSchema
>;

const EmotionClassificationOutputSchema = z.object({
  emotion: z
    .string()
    .describe('The classified emotion (e.g., Joy, Anger, Fear, Sadness, Surprise, Neutral).'),
});
export type EmotionClassificationOutput = z.infer<
  typeof EmotionClassificationOutputSchema
>;

export async function classifyEmotion(
  input: EmotionClassificationInput
): Promise<EmotionClassificationOutput> {
  return emotionClassificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'emotionClassificationPrompt',
  input: {schema: EmotionClassificationInputSchema},
  output: {schema: EmotionClassificationOutputSchema},
  prompt: `You are an expert in classifying the emotion of a piece of text. Analyze the following text and classify its primary emotion. The possible emotions are Joy, Anger, Fear, Sadness, Surprise, and Neutral.

Text:
{{text}}

Emotion:`,
});

const emotionClassificationFlow = ai.defineFlow(
  {
    name: 'emotionClassificationFlow',
    inputSchema: EmotionClassificationInputSchema,
    outputSchema: EmotionClassificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
