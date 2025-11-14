/**
 * Free Summary Generation using LexRank (Extractive Summarization)
 * LexRank is better than TextRank - uses TF-IDF for similarity
 * No AI, 100x faster, deterministic, no hallucination
 */

export interface SummaryGenerationResult {
  summaryReport: string;
  keyPoints: string[];
}

/**
 * Generate summary using LexRank algorithm
 * LexRank is an improvement over TextRank that uses TF-IDF for sentence similarity
 */
export function generateSummary(
  transcript: string,
  maxSentences: number = 5
): SummaryGenerationResult {
  // Split into sentences
  const sentences = splitIntoSentences(transcript);

  if (sentences.length === 0) {
    return {
      summaryReport: 'No content to summarize.',
      keyPoints: [],
    };
  }

  // If transcript is short, return all sentences
  if (sentences.length <= maxSentences) {
    return {
      summaryReport: sentences.join(' '),
      keyPoints: sentences,
    };
  }

  // Calculate sentence scores using LexRank (TF-IDF based)
  const scores = calculateLexRankScores(sentences);

  // Get top N sentences
  const rankedSentences = sentences
    .map((sentence, index) => ({
      sentence,
      score: scores[index],
      originalIndex: index,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences);

  // Sort by original order to maintain flow
  rankedSentences.sort((a, b) => a.originalIndex - b.originalIndex);

  const keyPoints = rankedSentences.map(item => item.sentence);
  const summaryReport = keyPoints.join(' ');

  return {
    summaryReport,
    keyPoints,
  };
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): string[] {
  // Split on sentence boundaries
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10); // Filter out very short fragments

  return sentences;
}

/**
 * Calculate LexRank scores for sentences
 * LexRank uses TF-IDF weighted cosine similarity (better than simple word overlap)
 */
function calculateLexRankScores(sentences: string[]): number[] {
  const n = sentences.length;

  // Calculate TF-IDF vectors for all sentences
  const tfidfVectors = calculateTFIDF(sentences);

  // Build similarity matrix using cosine similarity
  const similarity: number[][] = [];
  for (let i = 0; i < n; i++) {
    similarity[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        similarity[i][j] = 0;
      } else {
        similarity[i][j] = cosineSimilarity(tfidfVectors[i], tfidfVectors[j]);
      }
    }
  }

  // Apply threshold to create binary adjacency matrix (LexRank improvement)
  const threshold = 0.1;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (similarity[i][j] < threshold) {
        similarity[i][j] = 0;
      }
    }
  }

  // Initialize scores
  const scores = new Array(n).fill(1.0);
  const dampingFactor = 0.85;
  const iterations = 30;
  const convergenceThreshold = 0.0001;

  // PageRank algorithm with convergence check
  for (let iter = 0; iter < iterations; iter++) {
    const newScores = new Array(n).fill(0);
    let maxChange = 0;

    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const totalSimilarity = similarity[j].reduce((a, b) => a + b, 0);
          if (totalSimilarity > 0) {
            sum += (similarity[j][i] / totalSimilarity) * scores[j];
          }
        }
      }
      newScores[i] = (1 - dampingFactor) + dampingFactor * sum;
      maxChange = Math.max(maxChange, Math.abs(newScores[i] - scores[i]));
    }

    // Update scores
    for (let i = 0; i < n; i++) {
      scores[i] = newScores[i];
    }

    // Check convergence
    if (maxChange < convergenceThreshold) {
      break;
    }
  }

  return scores;
}

/**
 * Calculate TF-IDF vectors for sentences
 */
function calculateTFIDF(sentences: string[]): Map<string, number>[] {
  const n = sentences.length;
  const vectors: Map<string, number>[] = [];

  // Tokenize all sentences
  const tokenizedSentences = sentences.map(s => tokenize(s));

  // Calculate document frequency (DF) for each word
  const df = new Map<string, number>();
  tokenizedSentences.forEach(words => {
    const uniqueWords = new Set(words);
    uniqueWords.forEach(word => {
      df.set(word, (df.get(word) || 0) + 1);
    });
  });

  // Calculate TF-IDF for each sentence
  tokenizedSentences.forEach(words => {
    const vector = new Map<string, number>();
    const wordCount = new Map<string, number>();

    // Calculate term frequency (TF)
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Calculate TF-IDF
    wordCount.forEach((count, word) => {
      const tf = count / words.length;
      const idf = Math.log(n / (df.get(word) || 1));
      vector.set(word, tf * idf);
    });

    vectors.push(vector);
  });

  return vectors;
}

/**
 * Calculate cosine similarity between two TF-IDF vectors
 */
function cosineSimilarity(v1: Map<string, number>, v2: Map<string, number>): number {
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  // Get all unique words
  const allWords = new Set([...v1.keys(), ...v2.keys()]);

  allWords.forEach(word => {
    const val1 = v1.get(word) || 0;
    const val2 = v2.get(word) || 0;

    dotProduct += val1 * val2;
    magnitude1 += val1 * val1;
    magnitude2 += val2 * val2;
  });

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
}

/**
 * Tokenize sentence into words (lowercase, remove punctuation)
 */
function tokenize(sentence: string): string[] {
  return sentence
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2); // Filter out very short words
}
