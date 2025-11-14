import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Try to set ffmpeg path
try {
  // @ts-ignore
  const ffmpegStatic = require('ffmpeg-static');
  if (ffmpegStatic) {
    // @ts-ignore
    ffmpeg.setFfmpegPath(ffmpegStatic);
  }
} catch (e) {
  console.warn('ffmpeg-static not available, using system ffmpeg');
}

export interface AudioExtractionResult {
  audioBuffer: Buffer;
  mimeType: string;
  originalSize: number;
  audioSize: number;
  compressionRatio: number;
}

/**
 * Extract audio from video file and compress it
 * Returns audio-only buffer that's much smaller than original video
 */
export async function extractAudioFromVideo(
  videoBuffer: Buffer,
  originalMimeType: string
): Promise<AudioExtractionResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'audio-extract-'));
  
  try {
    const inputPath = path.join(tmpDir, `input${getExtension(originalMimeType)}`);
    const outputPath = path.join(tmpDir, 'output.mp3');
    
    // Write video to temp file
    await fs.writeFile(inputPath, videoBuffer);
    
    // Extract audio with highest quality settings
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo() // Remove video stream
        .audioCodec('libmp3lame') // MP3 codec
        .audioBitrate('320k') // Maximum MP3 bitrate for best quality
        .audioChannels(2) // Stereo (preserve original quality)
        .audioFrequency(48000) // 48kHz (professional audio quality)
        .audioQuality(0) // Highest quality (0 = best, 9 = worst)
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
    
    // Read extracted audio
    const audioBuffer = await fs.readFile(outputPath);
    
    const result: AudioExtractionResult = {
      audioBuffer,
      mimeType: 'audio/mpeg',
      originalSize: videoBuffer.length,
      audioSize: audioBuffer.length,
      compressionRatio: videoBuffer.length / audioBuffer.length,
    };
    
    console.log(`Audio extraction: ${(result.originalSize / 1024 / 1024).toFixed(2)}MB → ${(result.audioSize / 1024 / 1024).toFixed(2)}MB (${result.compressionRatio.toFixed(1)}x smaller)`);
    
    return result;
  } finally {
    // Cleanup temp files
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

/**
 * Check if file is a video (not audio-only)
 */
export function isVideoFile(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

/**
 * Get file extension from MIME type
 */
function getExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'video/mp4': '.mp4',
    'video/x-msvideo': '.avi',
    'video/x-matroska': '.mkv',
    'video/quicktime': '.mov',
    'video/webm': '.webm',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
  };
  return extensions[mimeType] || '.mp4';
}
