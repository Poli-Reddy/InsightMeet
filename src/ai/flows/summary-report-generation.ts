'use server';

/**
 * @fileOverview A meeting summary report generation AI agent.
 *
 * - generateSummaryReport - A function that handles the generation of the meeting summary report.
 * - GenerateSummaryReportInput - The input type for the generateSummaryReport function.
 * - GenerateSummaryReportOutput - The return type for the generateSummaryReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSummaryReportInputSchema = z.object({
  transcript: z
    .string()
    .describe('The speaker-tagged transcript of the meeting.'),
  overallSentiment: z.string().describe('The overall sentiment of the meeting.'),
  relationshipSummary: z
    .string()
    .describe('A summary of the relationships between participants.'),
});
export type GenerateSummaryReportInput = z.infer<
  typeof GenerateSummaryReportInputSchema
>;

const GenerateSummaryReportOutputSchema = z.object({
  summaryReport: z.string().describe('The generated meeting summary report.'),
});
export type GenerateSummaryReportOutput = z.infer<
  typeof GenerateSummaryReportOutputSchema
>;

export async function generateSummaryReport(
  input: GenerateSummaryReportInput
): Promise<GenerateSummaryReportOutput> {
  const { callGroqWithFallback } = await import('@/ai/groq-client');
  
  return await callGroqWithFallback(input, {
    systemPrompt: 'You are an expert meeting summarizer. Generate a concise summary report. Return JSON with a "summaryReport" string field.',
    userPrompt: `Generate a meeting summary from this transcript:\n\nTranscript: ${input.transcript}\n\nOverall Sentiment: ${input.overallSentiment}\n\nRelationship Summary: ${input.relationshipSummary}`,
    outputSchema: GenerateSummaryReportOutputSchema,
  });
}

const prompt = ai.definePrompt({
  name: 'generateSummaryReportPrompt',
  input: {schema: GenerateSummaryReportInputSchema},
  output: {schema: GenerateSummaryReportOutputSchema},
  prompt: `You are an expert meeting summarizer. Generate a concise summary report of the meeting based on the provided transcript, overall sentiment, and relationship summary.

Transcript:
{{transcript}}

Overall Sentiment:
{{overallSentiment}}

Relationship Summary:
{{relationshipSummary}}

Summary Report:`, // Keep it simple; the model should be able to generate a decent report from this info.
});

const generateSummaryReportFlow = ai.defineFlow(
  {
    name: 'generateSummaryReportFlow',
    inputSchema: GenerateSummaryReportInputSchema,
    outputSchema: GenerateSummaryReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
