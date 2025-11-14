import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

// Try to set ffmpeg and ffprobe paths
try {
  // @ts-ignore
  const ffmpegStatic = require('ffmpeg-static');
  if (ffmpegStatic) {
    // @ts-ignore
    ffmpeg.setFfmpegPath(ffmpegStatic);
    console.log('ffmpeg path set:', ffmpegStatic);
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
    console.log('ffprobe path set:', ffprobeStatic.path);
  }
} catch (e) {
  console.warn('ffprobe-static not available, using system ffprobe');
}

export interface VideoSegment {
  index: number;
  path: string;
  startTime: number; // seconds
  duration: number; // seconds
  size: number; // bytes
}

import { config } from './config';

export interface SegmentationOptions {
  segmentDuration?: number; // seconds, default from config
  overlap?: number; // seconds, default from config
  maxSegments?: number; // limit for very long videos
}

/**
 * Split video into segments for parallel processing
 */
export async function segmentVideo(
  inputPath: string,
  options: SegmentationOptions = {}
): Promise<{ segments: VideoSegment[]; tmpDir: string }> {
  const {
    segmentDuration = config.processing.segmentDuration,
    overlap = config.processing.segmentOverlap,
    maxSegments = config.processing.maxSegments,
  } = options;

  // Create temp directory for segments
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-segments-'));

  try {
    // Get video duration
    const duration = await getVideoDuration(inputPath);
    console.log(`Video duration: ${duration}s`);

    // Calculate number of segments
    const effectiveSegmentDuration = segmentDuration - overlap;
    const numSegments = Math.min(
      Math.ceil(duration / effectiveSegmentDuration),
      maxSegments
    );

    console.log(`Creating ${numSegments} segments...`);

    const segments: VideoSegment[] = [];

    // Create segments with overlap
    for (let i = 0; i < numSegments; i++) {
      const startTime = Math.max(0, i * effectiveSegmentDuration - (i > 0 ? overlap : 0));
      const segmentPath = path.join(tmpDir, `segment_${String(i).padStart(3, '0')}.mp4`);

      await extractSegment(inputPath, segmentPath, startTime, segmentDuration);

      const stats = await fs.stat(segmentPath);

      segments.push({
        index: i,
        path: segmentPath,
        startTime,
        duration: Math.min(segmentDuration, duration - startTime),
        size: stats.size,
      });

      console.log(`Segment ${i + 1}/${numSegments} created: ${startTime}s-${startTime + segmentDuration}s`);
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
 * Get video duration in seconds
 */
function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
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
 * Extract a segment from video
 */
function extractSegment(
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
      .outputOptions([
        '-c:v', 'copy', // Copy video codec (fast)
        '-c:a', 'copy', // Copy audio codec (fast)
      ])
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * Cleanup segment files
 */
export async function cleanupSegments(tmpDir: string): Promise<void> {
  try {
    await fs.rm(tmpDir, { recursive: true, force: true });
    console.log('Segments cleaned up');
  } catch (error) {
    console.error('Failed to cleanup segments:', error);
  }
}
