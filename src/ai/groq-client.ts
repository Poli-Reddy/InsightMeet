'use server';

/**
 * @fileOverview Groq AI client with Gemini fallback
 * Uses Groq for fast, free analysis with automatic fallback to Gemini
 */

import Groq from 'groq-sdk';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

/**
 * Call Groq AI with automatic fallback to Gemini
 */
export async function callGroqWithFallback<TInput, TOutput>(
  input: TInput,
  config: {
    systemPrompt: string;
    userPrompt: string;
    outputSchema: z.ZodType<TOutput>;
    model?: string;
  }
): Promise<TOutput> {
  const { systemPrompt, userPrompt, outputSchema, model = 'llama-3.3-70b-versatile' } = config;

  // Try Gemini first
  console.log('🎯 Trying Gemini...');
  try {
    const prompt = ai.definePrompt({
      name: `gemini-primary-${Date.now()}`,
      input: { schema: z.object({ input: z.any() }) },
      output: { schema: outputSchema },
      prompt: `${systemPrompt}\n\n${userPrompt}`,
    });

    const { output } = await prompt({ input });
    console.log('✅ Gemini succeeded!');
    return output!;
  } catch (error) {
    console.error('❌ Gemini failed:', error);
    console.log('⏭️  Falling back to Groq...');
  }

  // Fallback to Groq
  if (process.env.GROQ_API_KEY) {
    try {
      console.log('🎯 Trying Groq AI...');
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No response from Groq');
      }

      const parsed = JSON.parse(responseText);
      const validated = outputSchema.parse(parsed);
      
      console.log('✅ Groq succeeded!');
      return validated;
    } catch (error) {
      console.error('❌ Groq failed:', error);
      throw new Error('Both Gemini and Groq failed');
    }
  }

  throw new Error('Gemini failed and no Groq API key available');
  
  const prompt = ai.definePrompt({
    name: `groq-fallback-${Date.now()}`,
    input: { schema: z.object({ input: z.any() }) },
    output: { schema: outputSchema },
    prompt: `${systemPrompt}\n\n${userPrompt}`,
  });

  const { output } = await prompt({ input });
  console.log('✅ Gemini succeeded!');
  return output!;
}
