/**
 * Audio Chunking Utility for Large Files
 * Splits audio into manageable chunks for parallel processing
 */

export interface AudioChunk {
  index: number;
  buffer: Buffer;
  startTime: number;
  endTime: number;
  duration: number;
}

/**
 * Split audio buffer into chunks
 * Uses FFmpeg to split without re-encoding
 */
export async function chunkAudioBuffer(
  audioBuffer: Buffer,
  filename: string,
  chunkDurationSeconds: number = 300 // 5 minutes per chunk
): Promise<AudioChunk[]> {
  const ffmpeg = require('fluent-ffmpeg');
  const ffmpegStatic = require('ffmpeg-static');
  const ffprobeStatic = require('ffprobe-static');
  const fs = require('fs').promises;
  const path = require('path');
  const os = require('os');
  const crypto = require('crypto');

  if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
  }
  if (ffprobeStatic?.path) {
    ffmpeg.setFfprobePath(ffprobeStatic.path);
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'audio-chunk-'));
  const inputPath = path.join(tmpDir, `input-${crypto.randomUUID()}${path.extname(filename)}`);
  
  try {
    // Write input file
    await fs.writeFile(inputPath, audioBuffer);
    
    // Get audio duration
    const duration = await new Promise<number>((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err: any, metadata: any) => {
        if (err) reject(err);
        else resolve(metadata.format.duration || 0);
      });
    });
    
    console.log(`📊 Audio duration: ${duration.toFixed(2)}s`);
    
    // Calculate number of chunks
    const numChunks = Math.ceil(duration / chunkDurationSeconds);
    
    if (numChunks === 1) {
      console.log('📦 File is small enough, no chunking needed');
      await fs.unlink(inputPath);
      await fs.rmdir(tmpDir);
      return [{
        index: 0,
        buffer: audioBuffer,
        startTime: 0,
        endTime: duration,
        duration: duration
      }];
    }
    
    console.log(`📦 Splitting into ${numChunks} chunks of ~${chunkDurationSeconds}s each`);
    
    const chunks: AudioChunk[] = [];
    
    // Create chunks
    for (let i = 0; i < numChunks; i++) {
      const startTime = i * chunkDurationSeconds;
      const endTime = Math.min((i + 1) * chunkDurationSeconds, duration);
      const chunkDuration = endTime - startTime;
      
      const outputPath = path.join(tmpDir, `chunk-${i}.wav`);
      
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .setStartTime(startTime)
          .setDuration(chunkDuration)
          .output(outputPath)
          .audioCodec('pcm_s16le') // WAV format for compatibility
          .audioFrequency(16000) // 16kHz for Whisper
          .audioChannels(1) // Mono
          .on('end', () => resolve())
          .on('error', (err: any) => reject(err))
          .run();
      });
      
      const chunkBuffer = await fs.readFile(outputPath);
      
      chunks.push({
        index: i,
        buffer: chunkBuffer,
        startTime,
        endTime,
        duration: chunkDuration
      });
      
      console.log(`✅ Chunk ${i + 1}/${numChunks}: ${startTime.toFixed(1)}s - ${endTime.toFixed(1)}s (${(chunkBuffer.length / 1024 / 1024).toFixed(2)}MB)`);
      
      // Clean up chunk file
      await fs.unlink(outputPath);
    }
    
    // Clean up
    await fs.unlink(inputPath);
    await fs.rmdir(tmpDir);
    
    return chunks;
    
  } catch (error) {
    // Clean up on error
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
    
    throw error;
  }
}

/**
 * Merge transcription results from multiple chunks
 */
export function mergeTranscriptionChunks(
  chunks: Array<{
    index: number;
    startTime: number;
    result: {
      text: string;
      segments: Array<{ start: number; end: number; text: string }>;
      language: string;
      duration: number;
    };
  }>
): {
  text: string;
  segments: Array<{ start: number; end: number; text: string }>;
  language: string;
  duration: number;
} {
  // Sort by index
  chunks.sort((a, b) => a.index - b.index);
  
  const allText: string[] = [];
  const allSegments: Array<{ start: number; end: number; text: string }> = [];
  let totalDuration = 0;
  const language = chunks[0]?.result.language || 'en';
  
  for (const chunk of chunks) {
    allText.push(chunk.result.text);
    
    // Adjust segment timestamps based on chunk start time
    for (const segment of chunk.result.segments) {
      allSegments.push({
        start: segment.start + chunk.startTime,
        end: segment.end + chunk.startTime,
        text: segment.text
      });
    }
    
    totalDuration = Math.max(totalDuration, chunk.startTime + chunk.result.duration);
  }
  
  return {
    text: allText.join(' ').trim(),
    segments: allSegments,
    language,
    duration: totalDuration
  };
}
