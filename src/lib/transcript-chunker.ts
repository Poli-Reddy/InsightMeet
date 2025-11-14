/**
 * Chunk large transcripts for AI processing
 * Gemini has token limits, so we need to split large transcripts
 */

export interface TranscriptChunk {
  text: string;
  startIndex: number;
  endIndex: number;
}

import { config } from './config';

/**
 * Split transcript into manageable chunks
 * @param transcript Full transcript text
 * @param maxChars Maximum characters per chunk (default from config)
 * @param overlap Number of characters to overlap between chunks (default from config)
 */
export function chunkTranscript(
  transcript: string,
  maxChars: number = config.analysis.transcriptChunkSize,
  overlap: number = config.analysis.transcriptOverlap
): TranscriptChunk[] {
  if (transcript.length <= maxChars) {
    return [{
      text: transcript,
      startIndex: 0,
      endIndex: transcript.length
    }];
  }

  const chunks: TranscriptChunk[] = [];
  let startIndex = 0;

  while (startIndex < transcript.length) {
    let endIndex = Math.min(startIndex + maxChars, transcript.length);

    // Try to break at a sentence boundary
    if (endIndex < transcript.length) {
      const lastPeriod = transcript.lastIndexOf('.', endIndex);
      const lastNewline = transcript.lastIndexOf('\n', endIndex);
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > startIndex + maxChars / 2) {
        endIndex = breakPoint + 1;
      }
    }

    chunks.push({
      text: transcript.substring(startIndex, endIndex),
      startIndex,
      endIndex
    });

    // Move start index with overlap
    startIndex = endIndex - overlap;
    if (startIndex >= transcript.length) break;
  }

  return chunks;
}

/**
 * Merge results from chunked processing
 */
export function mergeChunkedResults<T>(
  results: T[],
  merger: (accumulated: T, current: T) => T,
  initial: T
): T {
  return results.reduce(merger, initial);
}

/**
 * Extract unique items from chunked array results
 */
export function deduplicateArrayResults(results: string[][]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const chunk of results) {
    for (const item of chunk) {
      const normalized = item.trim().toLowerCase();
      if (!seen.has(normalized) && item.trim().length > 0) {
        seen.add(normalized);
        unique.push(item.trim());
      }
    }
  }

  return unique;
}
