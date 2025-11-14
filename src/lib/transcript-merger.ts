interface Utterance {
  speaker: number;
  text: string;
  startSec?: number;
  endSec?: number;
}

interface DiarizationResult {
  utterances: Utterance[];
}

interface SegmentResult {
  segmentIndex: number;
  startTime: number;
  result: DiarizationResult;
}

/**
 * Merge transcripts from multiple segments into a single timeline
 */
export function mergeTranscripts(segmentResults: SegmentResult[]): DiarizationResult {
  // Sort by segment index
  const sorted = [...segmentResults].sort((a, b) => a.segmentIndex - b.segmentIndex);

  // Build speaker mapping across segments
  const speakerMap = buildSpeakerMap(sorted);

  // Merge all utterances with adjusted timestamps and speaker IDs
  const mergedUtterances: Utterance[] = [];

  for (const segment of sorted) {
    const { startTime, result, segmentIndex } = segment;

    for (const utterance of result.utterances) {
      // Adjust timestamps
      const adjustedUtterance: Utterance = {
        ...utterance,
        startSec: typeof utterance.startSec === 'number' 
          ? utterance.startSec + startTime 
          : undefined,
        endSec: typeof utterance.endSec === 'number' 
          ? utterance.endSec + startTime 
          : undefined,
        // Map speaker ID to global ID
        speaker: speakerMap.get(`${segmentIndex}-${utterance.speaker}`) ?? utterance.speaker,
      };

      mergedUtterances.push(adjustedUtterance);
    }
  }

  // Remove duplicate utterances in overlap regions
  const deduplicated = deduplicateOverlaps(mergedUtterances);

  return {
    utterances: deduplicated,
  };
}

/**
 * Build a mapping of segment-local speaker IDs to global speaker IDs
 * Uses simple heuristic: speakers with similar speaking patterns are likely the same
 */
function buildSpeakerMap(segments: SegmentResult[]): Map<string, number> {
  const speakerMap = new Map<string, number>();
  let globalSpeakerId = 0;

  // First segment: all speakers get new global IDs
  if (segments.length > 0) {
    const firstSegment = segments[0];
    const uniqueSpeakers = new Set(firstSegment.result.utterances.map(u => u.speaker));
    
    for (const localId of uniqueSpeakers) {
      speakerMap.set(`0-${localId}`, globalSpeakerId++);
    }
  }

  // Subsequent segments: try to match speakers from previous segment
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    const prevSegment = segments[i - 1];
    
    const currentSpeakers = new Set(segment.result.utterances.map(u => u.speaker));
    const prevSpeakers = new Set(prevSegment.result.utterances.map(u => u.speaker));

    // Simple heuristic: if speaker counts match, assume same speakers
    // In production, you'd use voice fingerprinting or overlap analysis
    if (currentSpeakers.size === prevSpeakers.size) {
      // Map in order
      const currentArray = Array.from(currentSpeakers).sort();
      const prevArray = Array.from(prevSpeakers).sort();
      
      for (let j = 0; j < currentArray.length; j++) {
        const prevKey = `${i - 1}-${prevArray[j]}`;
        const globalId = speakerMap.get(prevKey);
        if (globalId !== undefined) {
          speakerMap.set(`${i}-${currentArray[j]}`, globalId);
        }
      }
    } else {
      // Different number of speakers, assign new IDs
      for (const localId of currentSpeakers) {
        const key = `${i}-${localId}`;
        if (!speakerMap.has(key)) {
          speakerMap.set(key, globalSpeakerId++);
        }
      }
    }
  }

  return speakerMap;
}

/**
 * Remove duplicate utterances in overlap regions
 * Keep the one with more complete text
 */
function deduplicateOverlaps(utterances: Utterance[]): Utterance[] {
  if (utterances.length === 0) return [];

  const result: Utterance[] = [];
  const seen = new Set<string>();

  for (const utterance of utterances) {
    // Create a fingerprint based on speaker, approximate time, and text start
    const timeKey = utterance.startSec ? Math.floor(utterance.startSec / 5) : 0; // 5-second buckets
    const textStart = utterance.text.substring(0, 50).trim().toLowerCase();
    const fingerprint = `${utterance.speaker}-${timeKey}-${textStart}`;

    if (!seen.has(fingerprint)) {
      seen.add(fingerprint);
      result.push(utterance);
    } else {
      // If duplicate, keep the one with longer text
      const existingIndex = result.findIndex(u => {
        const existingTimeKey = u.startSec ? Math.floor(u.startSec / 5) : 0;
        const existingTextStart = u.text.substring(0, 50).trim().toLowerCase();
        return u.speaker === utterance.speaker && 
               existingTimeKey === timeKey && 
               existingTextStart === textStart;
      });

      if (existingIndex >= 0 && utterance.text.length > result[existingIndex].text.length) {
        result[existingIndex] = utterance;
      }
    }
  }

  // Sort by timestamp
  return result.sort((a, b) => {
    const aTime = a.startSec ?? 0;
    const bTime = b.startSec ?? 0;
    return aTime - bTime;
  });
}
