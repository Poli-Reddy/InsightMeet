'use server';

/**
 * @fileOverview Generates a graph visualizing the relationships between meeting participants.
 *
 * - generateRelationshipGraph - A function that generates the relationship graph.
 * - RelationshipGraphInput - The input type for the generateRelationshipGraph function.
 * - RelationshipGraphOutput - The return type for the generateRelationshipGraph function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RelationshipGraphInputSchema = z.object({
  transcript: z
    .string()
    .describe('The transcript of the meeting with speaker tags and sentiment.'),
});
export type RelationshipGraphInput = z.infer<typeof RelationshipGraphInputSchema>;

const RelationshipGraphOutputSchema = z.object({
  graphData: z.string().describe('JSON string representing the relationship graph data.'),
});
export type RelationshipGraphOutput = z.infer<typeof RelationshipGraphOutputSchema>;

export async function generateRelationshipGraph(input: RelationshipGraphInput): Promise<RelationshipGraphOutput> {
  const { callGroqWithFallback } = await import('@/ai/groq-client');
  
  return await callGroqWithFallback(input, {
    systemPrompt: 'You are an AI that analyzes meeting transcripts and generates relationship graphs. Return ONLY valid JSON with "graphData" field. Keep response concise - limit timestamps to 3 max and topics to 2 max per link.',
    userPrompt: `Analyze this transcript and generate a relationship graph. Format:
{
  "nodes": [{"id": "Speaker A", "label": "Speaker A", "group": 1}],
  "links": [{"source": "Speaker A", "target": "Speaker B", "type": "support|conflict|neutral", "value": 1-10, "avgSentiment": -1 to 1, "initiator": "Speaker A", "timestamps": ["00:05"], "topics": ["topic1"]}]
}

Rules:
- type: support (avgSentiment > 0.3), conflict (< -0.3), neutral (else)
- timestamps: max 3 per link
- topics: max 2 per link
- Only include actual interactions

Transcript:\n${input.transcript}`,
    outputSchema: RelationshipGraphOutputSchema,
  });
}

const prompt = ai.definePrompt({
  name: 'relationshipGraphPrompt',
  input: {schema: RelationshipGraphInputSchema},
  output: {schema: RelationshipGraphOutputSchema},
  prompt: `You are an AI assistant that analyzes meeting transcripts and generates detailed relationship graphs showing how participants interact.

  Analyze the following meeting transcript to identify relationships between participants based on their interactions.

  RELATIONSHIP TYPES:
  - "support": Agreeing, building on ideas, encouraging, collaborative language (e.g., "I agree", "great point", "yes, and...")
  - "conflict": Disagreeing, challenging, interrupting, contradicting (e.g., "I disagree", "that won't work", "but...")
  - "neutral": Informational exchanges, questions, clarifications without strong sentiment

  ANALYSIS RULES:
  1. Create ONE directional link per pair of speakers who interact (source → target shows primary direction)
  2. "value" = number of interactions between the pair (1-10 scale)
  3. "avgSentiment" = average sentiment of their exchanges (-1.0 to 1.0, where -1 is very negative, 0 is neutral, 1 is very positive)
  4. "type" is determined by the dominant tone: avgSentiment > 0.3 = "support", < -0.3 = "conflict", else "neutral"
  5. "initiator" = ID of the speaker who initiated more conversations (source or target)
  6. "timestamps" = array of timestamps when key interactions occurred (up to 5)
  7. "topics" = array of main topics discussed in this relationship (up to 3)
  8. Only include links where speakers actually interact (not just speak in the same meeting)
  9. Each speaker gets a unique "group" number (1, 2, 3, etc.) for visual distinction

  OUTPUT FORMAT (valid JSON only):
  {
    "nodes": [
      {"id": "A", "group": 1, "label": "Speaker A"},
      {"id": "B", "group": 2, "label": "Speaker B"}
    ],
    "links": [
      {
        "source": "A", 
        "target": "B", 
        "value": 5, 
        "type": "support", 
        "avgSentiment": 0.6,
        "initiator": "A",
        "timestamps": ["00:05", "00:12", "00:23"],
        "topics": ["project timeline", "budget"]
      },
      {
        "source": "B", 
        "target": "C", 
        "value": 3, 
        "type": "conflict", 
        "avgSentiment": -0.5,
        "initiator": "C",
        "timestamps": ["00:15", "00:30"],
        "topics": ["resource allocation"]
      }
    ]
  }

  IMPORTANT: 
  - Return ONLY valid JSON, no markdown or explanations
  - Ensure all link source/target IDs match existing node IDs
  - Include timestamps, topics, and initiator for richer analysis
  - If no clear interactions exist, return empty arrays: {"nodes": [], "links": []}

  Transcript:
  {{{transcript}}}
  `,
});

const relationshipGraphFlow = ai.defineFlow(
  {
    name: 'relationshipGraphFlow',
    inputSchema: RelationshipGraphInputSchema,
    outputSchema: RelationshipGraphOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
