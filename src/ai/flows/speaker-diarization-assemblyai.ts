'use server';

/**
 * @fileOverview AssemblyAI implementation for speaker diarization
 * Sends video/audio directly without extraction for best quality
 */

import { AssemblyAI } from 'assemblyai';

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
 * Transcribe and diarize using AssemblyAI
 * Sends video/audio directly without extraction
 */
export async function diarizeAudioWithAssemblyAI(
  input: DiarizeAudioInput
): Promise<DiarizeAudioOutput> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('ASSEMBLYAI_API_KEY not found in environment variables');
  }

  try {
    const client = new AssemblyAI({ apiKey });

    // Extract base64 data from data URI (avoid regex for large strings)
    if (!input.audioDataUri.startsWith('data:')) {
      throw new Error('Invalid audio data URI format');
    }

    const dataUriParts = input.audioDataUri.split(',');
    if (dataUriParts.length !== 2) {
      throw new Error('Invalid audio data URI format');
    }

    const header = dataUriParts[0];
    const base64Data = dataUriParts[1];
    
    // Extract mime type
    const mimeType = header.split(':')[1]?.split(';')[0] || 'audio/mpeg';
    
    const fileBuffer = Buffer.from(base64Data, 'base64');
    const fileSizeMB = fileBuffer.length / 1024 / 1024;

    console.log(`Sending ${fileSizeMB.toFixed(2)}MB (${mimeType}) to AssemblyAI (no extraction)...`);

    // Check file size - AssemblyAI has limits
    if (fileSizeMB > 5000) {
      throw new Error(`File too large for AssemblyAI (${fileSizeMB.toFixed(2)}MB). Maximum is 5GB.`);
    }

    // Upload file directly to AssemblyAI (supports both audio and video)
    console.log('Uploading file to AssemblyAI...');
    const uploadUrl = await client.files.upload(fileBuffer);

    // Start transcription with speaker diarization
    console.log('Starting transcription with speaker diarization...');
    const transcript = await client.transcripts.transcribe({
      audio: uploadUrl,
      speaker_labels: true,
      language_code: 'en',
    });

    if (transcript.status === 'error') {
      throw new Error(`AssemblyAI transcription error: ${transcript.error}`);
    }

    if (!transcript.utterances || transcript.utterances.length === 0) {
      console.warn('No utterances returned from AssemblyAI');
      return { utterances: [] };
    }

    // Convert AssemblyAI utterances to our format
    const utterances: Utterance[] = transcript.utterances.map((utterance) => {
      // Parse speaker label (e.g., "A" -> 0, "B" -> 1)
      const speakerIndex = utterance.speaker ? utterance.speaker.charCodeAt(0) - 65 : 0;
      
      return {
        speaker: speakerIndex,
        text: utterance.text || '',
        startSec: utterance.start ? utterance.start / 1000 : undefined, // Convert ms to seconds
        endSec: utterance.end ? utterance.end / 1000 : undefined,
      };
    });

    console.log(`AssemblyAI transcription complete: ${utterances.length} utterances`);

    return { utterances };
  } catch (error) {
    console.error('AssemblyAI transcription failed:', error);
    throw new Error(
      `AssemblyAI transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
