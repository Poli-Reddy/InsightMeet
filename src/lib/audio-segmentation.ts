import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Try to set ffmpeg and ffprobe paths
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

try {
  // @ts-ignore
  const ffprobeStatic = require('ffprobe-static');
  if (ffprobeStatic?.path) {
    // @ts-ignore
    ffmpeg.setFfprobePath(ffprobeStatic.path);
  }
} catch (e) {
  console.warn('ffprobe-static not available, using system ffprobe');
}

export interface AudioSegment {
  index: number;
  path: string;
  startTime: number; // seconds
  duration: number; // seconds
  size: number; // bytes
}

export interface AudioSegmentationOptions {
  segmentDuration?: number; // seconds, default 60
  overlap?: number; // seconds, default 5
  maxSegments?: number; // limit for very long audio
}

/**
 * Split audio into segments for parallel processing
 * This is more efficient than video segmentation since audio files are much smaller
 */
export async function segmentAudio(
  inputPath: string,
  options: AudioSegmentationOptions = {}
): Promise<{ segments: AudioSegment[]; tmpDir: string }> {
  const {
    segmentDuration = 60, // 60 seconds per segment
    overlap = 5, // 5 seconds overlap
    maxSegments = 50, // max 50 segments (50 minutes of audio)
  } = options;

  // Create temp directory for segments
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'audio-segments-'));

  try {
    // Get audio duration
    const duration = await getAudioDuration(inputPath);
    console.log(`Audio duration: ${duration.toFixed(2)}s`);

    // Calculate number of segments
    const effectiveSegmentDuration = segmentDuration - overlap;
    const numSegments = Math.min(
      Math.ceil(duration / effectiveSegmentDuration),
      maxSegments
    );

    console.log(`Creating ${numSegments} audio segments (${segmentDuration}s each with ${overlap}s overlap)...`);

    const segments: AudioSegment[] = [];

    // Create segments with overlap
    for (let i = 0; i < numSegments; i++) {
      const startTime = Math.max(0, i * effectiveSegmentDuration - (i > 0 ? overlap : 0));
      const segmentPath = path.join(tmpDir, `segment_${String(i).padStart(3, '0')}.mp3`);

      await extractAudioSegment(inputPath, segmentPath, startTime, segmentDuration);

      const stats = await fs.stat(segmentPath);

      segments.push({
        index: i,
        path: segmentPath,
        startTime,
        duration: Math.min(segmentDuration, duration - startTime),
        size: stats.size,
      });

      console.log(
        `Audio segment ${i + 1}/${numSegments} created: ${startTime.toFixed(1)}s-${(startTime + segmentDuration).toFixed(1)}s (${(stats.size / 1024).toFixed(1)}KB)`
      );
    }

    return { segments, tmpDir };
  } catch (error) {
    // Cleanup on error
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
    throw error;
  }
}

/**
 * Get audio duration in seconds
 */
function getAudioDuration(audioPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const duration = metadata.format.duration || 0;
        resolve(duration);
      }
    });
  });
}

/**
 * Extract a segment from audio file
 */
function extractAudioSegment(
  inputPath: string,
  outputPath: string,
  startTime: number,
  duration: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startTime)
      .setDuration(duration)
      .output(outputPath)
      .audioCodec('libmp3lame')
      .audioBitrate('320k') // Maximum MP3 bitrate for best quality
      .audioChannels(2) // Stereo (preserve original quality)
      .audioFrequency(48000) // 48kHz (professional audio quality)
      .audioQuality(0) // Highest quality (0 = best, 9 = worst)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * Cleanup segment files
 */
export async function cleanupAudioSegments(tmpDir: string): Promise<void> {
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
    console.log('Audio segments cleaned up');
  } catch (error) {
    console.error('Failed to cleanup audio segments:', error);
  }
}
