'use server';

/**
 * @fileOverview Deepgram implementation for speaker diarization
 * Fast, accurate transcription with speaker identification
 */

import { createClient } from '@deepgram/sdk';

export interface DiarizeAudioInput {
  audioDataUri: string;
}

export interface Utterance {
  speaker: number;
  text: string;
  startSec?: number;
  endSec?: number;
}

export interface DiarizeAudioOutput {
  utterances: Utterance[];
}

/**
 * Transcribe and diarize audio using Deepgram
 */
export async function diarizeAudioWithDeepgram(
  input: DiarizeAudioInput
): Promise<DiarizeAudioOutput> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  
  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY not found in environment variables');
  }

  try {
    const deepgram = createClient(apiKey);

    // Extract base64 data from data URI (avoid regex for large strings)
    if (!input.audioDataUri.startsWith('data:')) {
      throw new Error('Invalid audio data URI format');
    }

    const dataUriParts = input.audioDataUri.split(',');
    if (dataUriParts.length !== 2) {
      throw new Error('Invalid audio data URI format');
    }

    const header = dataUriParts[0]; // "data:audio/mpeg;base64"
    const base64Data = dataUriParts[1];
    
    // Extract mime type from header
    const mimeType = header.split(':')[1]?.split(';')[0] || 'audio/mpeg';
    
    const audioBuffer = Buffer.from(base64Data, 'base64');
    const fileSizeMB = audioBuffer.length / 1024 / 1024;

    console.log(`Sending ${fileSizeMB.toFixed(2)}MB (${mimeType}) to Deepgram...`);

    // Check file size - Deepgram has limits
    if (fileSizeMB > 500) {
      throw new Error(`File too large for Deepgram (${fileSizeMB.toFixed(2)}MB). Maximum is 500MB.`);
    }

    // Send video/audio directly to Deepgram without extraction
    console.log('Sending file directly to Deepgram (no extraction)...');

    // Call Deepgram API with diarization enabled
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      {
        model: 'nova-2',
        smart_format: true,
        diarize: true,
        punctuate: true,
        utterances: true,
        language: 'en',
      }
    );

    if (error) {
      throw new Error(`Deepgram API error: ${error.message}`);
    }

    if (!result?.results?.utterances || result.results.utterances.length === 0) {
      console.warn('No utterances returned from Deepgram');
      return { utterances: [] };
    }

    // Convert Deepgram utterances to our format
    const utterances: Utterance[] = result.results.utterances.map((utterance) => ({
      speaker: utterance.speaker || 0,
      text: utterance.transcript || '',
      startSec: utterance.start,
      endSec: utterance.end,
    }));

    console.log(`Deepgram transcription complete: ${utterances.length} utterances`);

    return { utterances };
  } catch (error) {
    console.error('Deepgram transcription failed:', error);
    throw new Error(
      `Deepgram transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
