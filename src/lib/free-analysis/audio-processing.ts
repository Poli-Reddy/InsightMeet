/**
 * Free Audio Processing Pipeline
 * Combines Whisper transcription + Resemblyzer diarization
 * Uses chunking + async processing for large files
 */

import { transcribeAudioFree, isWhisperServiceAvailable } from './transcription';
import { diarizeAudioFree, isDiarizationServiceAvailable } from './diarization';
import { chunkAudioBuffer, mergeTranscriptionChunks } from './audio-chunker';
import { transcribeChunksAsync } from './async-transcription';
import type { TranscriptionResult } from './transcription';
import type { DiarizationResult } from './diarization';

export interface FreeAudioProcessingResult {
  utterances: Array<{
    speaker: number;
    text: string;
    startSec: number;
    endSec: number;
  }>;
  numSpeakers: number;
  duration: number;
  transcriptionMethod: 'whisper';
  diarizationMethod: 'resemblyzer-agglomerative' | 'resemblyzer-dbscan';
}

/**
 * Process audio file using 100% free methods
 * 1. Transcribe with Whisper
 * 2. Diarize with Resemblyzer
 * 3. Combine results into utterances
 */
export async function processAudioFileFree(
  audioBuffer: Buffer,
  filename: string,
  clusteringMethod: 'agglomerative' | 'dbscan' = 'agglomerative'
): Promise<FreeAudioProcessingResult> {
  console.log('🔄 Starting free audio processing pipeline...');
  
  // Check service availability (with retry logic for busy services)
  console.log('🔍 Checking service availability...');
  const [whisperAvailable, diarizationAvailable] = await Promise.all([
    isWhisperServiceAvailable(),
    isDiarizationServiceAvailable(),
  ]);
  
  if (!whisperAvailable) {
    console.error('❌ Whisper service not responding after multiple attempts');
    console.error('💡 The service might be busy processing another file');
    console.error('💡 Try again in a few minutes or restart: docker-compose restart whisper');
    throw new Error('Whisper service not available. It may be busy processing another file. Try again in a few minutes or restart with: docker-compose restart whisper');
  }
  
  if (!diarizationAvailable) {
    console.error('❌ Diarization service not responding after multiple attempts');
    console.error('💡 The service might be busy processing another file');
    console.error('💡 Try again in a few minutes or restart: docker-compose restart diarization');
    throw new Error('Diarization service not available. It may be busy processing another file. Try again in a few minutes or restart with: docker-compose restart diarization');
  }
  
  console.log('✅ Both services are available and ready');
  
  try {
    const fileSizeMB = audioBuffer.length / (1024 * 1024);
    const CHUNK_THRESHOLD_MB = 30; // Chunk files larger than 30MB
    
    let transcription: TranscriptionResult;
    
    // Step 1: Transcribe audio (with chunking for large files)
    if (fileSizeMB > CHUNK_THRESHOLD_MB) {
      console.log(`📝 Step 1: Large file detected (${fileSizeMB.toFixed(2)}MB), using chunked async processing...`);
      
      // Split into chunks
      const chunks = await chunkAudioBuffer(audioBuffer, filename, 300); // 5-minute chunks
      console.log(`📦 Split into ${chunks.length} chunks`);
      
      // Process chunks in parallel with async jobs
      const chunkResults = await transcribeChunksAsync(
        chunks.map(c => ({ index: c.index, buffer: c.buffer, startTime: c.startTime })),
        filename,
        process.env.WHISPER_SERVICE_URL || 'http://localhost:8001',
        4 // Max 4 parallel jobs
      );
      
      // Merge results
      console.log('🔗 Merging chunk results...');
      transcription = mergeTranscriptionChunks(chunkResults);
      console.log(`✅ Merged transcription: ${transcription.text.length} characters, ${transcription.segments.length} segments`);
      
    } else {
      console.log(`📝 Step 1: Small file (${fileSizeMB.toFixed(2)}MB), using direct transcription...`);
      transcription = await transcribeAudioFree(audioBuffer, filename);
    }
    
    // Step 2: Diarize audio (identify speakers)
    console.log('👥 Step 2: Diarizing audio with Resemblyzer...');
    const diarization = await diarizeAudioFree(audioBuffer, filename, undefined, clusteringMethod);
    
    // Step 3: Combine transcription and diarization
    console.log('🔗 Step 3: Combining transcription and diarization...');
    const utterances = combineTranscriptionAndDiarization(transcription, diarization);
    
    console.log(`✅ Free audio processing complete: ${utterances.length} utterances from ${diarization.numSpeakers} speakers`);
    
    return {
      utterances,
      numSpeakers: diarization.numSpeakers,
      duration: Math.max(transcription.duration, diarization.duration),
      transcriptionMethod: 'whisper',
      diarizationMethod: `resemblyzer-${clusteringMethod}` as 'resemblyzer-agglomerative' | 'resemblyzer-dbscan',
    };
    
  } catch (error) {
    console.error('❌ Free audio processing failed:', error);
    throw error;
  }
}

/**
 * Combine transcription segments with speaker diarization
 */
function combineTranscriptionAndDiarization(
  transcription: TranscriptionResult,
  diarization: DiarizationResult
): Array<{
  speaker: number;
  text: string;
  startSec: number;
  endSec: number;
}> {
  const utterances: Array<{
    speaker: number;
    text: string;
    startSec: number;
    endSec: number;
  }> = [];
  
  // For each transcription segment, find the overlapping speaker
  for (const textSegment of transcription.segments) {
    const segmentMidpoint = (textSegment.start + textSegment.end) / 2;
    
    // Find speaker segment that contains this text segment
    let assignedSpeaker = 0;
    
    for (const speakerSegment of diarization.segments) {
      if (
        segmentMidpoint >= speakerSegment.start &&
        segmentMidpoint <= speakerSegment.end
      ) {
        assignedSpeaker = speakerSegment.speaker;
        break;
      }
    }
    
    const cleanText = textSegment.text.trim();
    if (cleanText.length > 0) {
      utterances.push({
        speaker: assignedSpeaker,
        text: cleanText,
        startSec: textSegment.start,
        endSec: textSegment.end,
      });
    }
  }
  
  // Sort by start time
  utterances.sort((a, b) => a.startSec - b.startSec);
  
  // Merge consecutive utterances from same speaker
  return mergeConsecutiveUtterances(utterances);
}

/**
 * Merge consecutive utterances from the same speaker
 */
function mergeConsecutiveUtterances(
  utterances: Array<{
    speaker: number;
    text: string;
    startSec: number;
    endSec: number;
  }>
): Array<{
  speaker: number;
  text: string;
  startSec: number;
  endSec: number;
}> {
  if (utterances.length === 0) return [];
  
  const merged = [];
  let current = { ...utterances[0] };
  
  for (let i = 1; i < utterances.length; i++) {
    const next = utterances[i];
    
    // Merge if same speaker and gap is less than 2 seconds
    if (
      next.speaker === current.speaker &&
      next.startSec - current.endSec < 2.0
    ) {
      current.text += ' ' + next.text;
      current.endSec = next.endSec;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  
  merged.push(current);
  return merged;
}
