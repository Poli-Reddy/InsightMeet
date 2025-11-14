/**
 * Free Topic Segmentation using Sentence Embeddings + Cosine Similarity
 * Uses transformers.js (runs in Node.js, no Python needed)
 */

import { pipeline, cos_sim } from '@xenova/transformers';

export interface Topic {
  topic: string;
  summary: string;
}

export interface TopicSegmentationResult {
  topics: Topic[];
}

interface Utterance {
  text: string;
  label: string;
}

// Cache the model to avoid reloading
let embeddingPipeline: any = null;

/**
 * Initialize the embedding model (lazy loading)
 */
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log('Loading sentence embedding model...');
    // Use a small, fast model: all-MiniLM-L6-v2 (22MB)
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('Embedding model loaded');
  }
  return embeddingPipeline;
}

/**
 * Segment topics using sliding window + cosine similarity
 */
export async function segmentTopics(
  utterances: Utterance[]
): Promise<TopicSegmentationResult> {
  if (utterances.length === 0) {
    return { topics: [] };
  }

  // For very short transcripts, return single topic
  if (utterances.length < 10) {
    return {
      topics: [
        {
          topic: 'Main Discussion',
          summary: utterances.map(u => u.text).join(' ').substring(0, 200) + '...',
        },
      ],
    };
  }

  try {
    const extractor = await getEmbeddingPipeline();

    // Create sliding windows of utterances
    const windowSize = 10; // 10 utterances per window
    const windows: string[] = [];
    const windowIndices: number[] = [];

    for (let i = 0; i < utterances.length; i += windowSize) {
      const windowUtterances = utterances.slice(i, Math.min(i + windowSize, utterances.length));
      const windowText = windowUtterances.map(u => u.text).join(' ');
      windows.push(windowText);
      windowIndices.push(i);
    }

    // Get embeddings for all windows
    const embeddings = await Promise.all(
      windows.map(async (text) => {
        const output = await extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data) as number[];
      })
    );

    // Find topic boundaries where similarity drops
    const topics: Topic[] = [];
    let currentTopicStart = 0;
    const similarityThreshold = 0.7; // Adjust for sensitivity

    for (let i = 1; i < embeddings.length; i++) {
      const similarity = cosineSimilarity(embeddings[i - 1], embeddings[i]);

      // Topic boundary detected (low similarity)
      if (similarity < similarityThreshold) {
        // Create topic from previous segments
        const topicWindows = windows.slice(currentTopicStart, i);
        const topicText = topicWindows.join(' ');

        topics.push({
          topic: extractTopicTitle(topicText),
          summary: topicText.substring(0, 200) + (topicText.length > 200 ? '...' : ''),
        });

        currentTopicStart = i;
      }
    }

    // Add final topic
    if (currentTopicStart < windows.length) {
      const topicWindows = windows.slice(currentTopicStart);
      const topicText = topicWindows.join(' ');

      topics.push({
        topic: extractTopicTitle(topicText),
        summary: topicText.substring(0, 200) + (topicText.length > 200 ? '...' : ''),
      });
    }

    // If no topics found (high similarity throughout), create single topic
    if (topics.length === 0) {
      topics.push({
        topic: 'Main Discussion',
        summary: windows.join(' ').substring(0, 200) + '...',
      });
    }

    return {
      topics: topics.slice(0, 10), // Limit to 10 topics
    };
  } catch (error) {
    console.error('Topic segmentation failed:', error);
    // Fallback: return single topic
    return {
      topics: [
        {
          topic: 'Discussion',
          summary: utterances.map(u => u.text).join(' ').substring(0, 200) + '...',
        },
      ],
    };
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magA * magB);
}

/**
 * Extract a topic title from text (first meaningful phrase)
 */
function extractTopicTitle(text: string): string {
  // Take first sentence or first 50 chars
  const firstSentence = text.split(/[.!?]/)[0].trim();
  
  if (firstSentence.length > 50) {
    return firstSentence.substring(0, 47) + '...';
  }
  
  return firstSentence || 'Discussion Topic';
}
