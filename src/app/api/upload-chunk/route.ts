import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { diarizeAudio } from '@/ai/flows/speaker-diarization';
import { config } from '@/lib/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for processing

interface ChunkMetadata {
  uploadId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  totalChunks: number;
  chunks: Set<number>;
  tmpDir: string;
}

// In-memory store for upload sessions
// Note: Sessions are lost on server restart. For production with multiple instances,
// consider using Redis or a database for session storage.
const uploadSessions = new Map<string, ChunkMetadata>();

// Cleanup old sessions periodically (every 30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const sessionTimestamps = new Map<string, number>();

setInterval(() => {
  const now = Date.now();
  for (const [uploadId, timestamp] of sessionTimestamps.entries()) {
    if (now - timestamp > SESSION_TIMEOUT) {
      const session = uploadSessions.get(uploadId);
      if (session) {
        console.log(`Cleaning up expired session: ${uploadId}`);
        cleanupSession(session).catch(console.error);
      }
      sessionTimestamps.delete(uploadId);
    }
  }
}, 10 * 60 * 1000); // Check every 10 minutes

/**
 * Initialize a chunked upload session
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'init') {
      return await handleInit(req);
    } else if (action === 'upload') {
      return await handleChunkUpload(req);
    } else if (action === 'complete') {
      return await handleComplete(req);
    } else if (action === 'abort') {
      return await handleAbort(req);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Chunk upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error?.toString() },
      { status: 500 }
    );
  }
}

/**
 * Process video/audio file - direct approach:
 * Send video/audio directly to AI without extraction
 */
async function processAudioFile(videoPath: string, mimeType: string) {
  console.log('Starting file processing...');
  
  try {
    // Read the file directly
    const fileBuffer = await fs.readFile(videoPath);
    const fileSizeMB = fileBuffer.length / (1024 * 1024);
    console.log(`Processing ${mimeType} file: ${fileSizeMB.toFixed(2)}MB`);
    
    // Send directly to AI for transcription (no audio extraction)
    console.log('Sending file to AI for transcription...');
    const base64 = fileBuffer.toString('base64');
    const audioDataUri = `data:${mimeType};base64,${base64}`;
    
    const diarizationResult = await diarizeAudio({ audioDataUri });
    
    console.log(`Transcription complete: ${diarizationResult.utterances?.length || 0} utterances`);
    
    return diarizationResult;
  } catch (error) {
    console.error('File processing failed:', error);
    throw new Error(
      'File processing failed. The file may be corrupted or in an unsupported format. ' +
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Initialize upload session
 */
async function handleInit(req: NextRequest) {
  const { fileName, fileSize, mimeType, totalChunks } = await req.json();

  if (!fileName || !fileSize || !mimeType || !totalChunks) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Check file size
  if (fileSize > config.upload.maxSize) {
    return NextResponse.json(
      { error: 'File too large', maxSize: config.upload.maxSize },
      { status: 413 }
    );
  }

  const uploadId = crypto.randomUUID();
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `upload-${uploadId}-`));

  uploadSessions.set(uploadId, {
    uploadId,
    fileName,
    fileSize,
    mimeType,
    totalChunks,
    chunks: new Set(),
    tmpDir,
  });
  
  // Track session creation time
  sessionTimestamps.set(uploadId, Date.now());

  return NextResponse.json({
    uploadId,
    message: 'Upload session initialized',
  });
}

/**
 * Handle individual chunk upload
 */
async function handleChunkUpload(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uploadId = searchParams.get('uploadId');
  const chunkIndex = parseInt(searchParams.get('chunkIndex') || '0');

  if (!uploadId) {
    return NextResponse.json({ error: 'Missing uploadId' }, { status: 400 });
  }

  const session = uploadSessions.get(uploadId);
  if (!session) {
    return NextResponse.json({ error: 'Invalid upload session' }, { status: 404 });
  }

  // Read chunk data
  const formData = await req.formData();
  const chunk = formData.get('chunk');

  if (!chunk || typeof chunk === 'string') {
    return NextResponse.json({ error: 'No chunk data' }, { status: 400 });
  }

  // Save chunk to temp file
  const chunkPath = path.join(session.tmpDir, `chunk-${chunkIndex}`);
  const arrayBuffer = await chunk.arrayBuffer();
  await fs.writeFile(chunkPath, Buffer.from(arrayBuffer));

  session.chunks.add(chunkIndex);

  const progress = Math.round((session.chunks.size / session.totalChunks) * 100);

  return NextResponse.json({
    uploadId,
    chunkIndex,
    received: session.chunks.size,
    total: session.totalChunks,
    progress,
  });
}



/**
 * Cleanup upload session and temp files
 */
async function cleanupSession(session: ChunkMetadata) {
  try {
    await fs.rm(session.tmpDir, { recursive: true, force: true });
    uploadSessions.delete(session.uploadId);
    sessionTimestamps.delete(session.uploadId);
  } catch (error) {
    console.error('Failed to cleanup session:', error);
  }
}

/**
 * Complete upload and merge chunks
 */
async function handleComplete(req: NextRequest) {
  const { uploadId, mode = 'ai' } = await req.json();

  if (!uploadId) {
    return NextResponse.json({ error: 'Missing uploadId' }, { status: 400 });
  }

  const session = uploadSessions.get(uploadId);
  if (!session) {
    return NextResponse.json({ error: 'Invalid upload session' }, { status: 404 });
  }

  // Verify all chunks received
  if (session.chunks.size !== session.totalChunks) {
    return NextResponse.json(
      {
        error: 'Incomplete upload',
        received: session.chunks.size,
        expected: session.totalChunks,
      },
      { status: 400 }
    );
  }

  let mergedPath: string | null = null;
  let tempVideoPath: string | null = null;

  try {
    // Merge chunks
    mergedPath = path.join(session.tmpDir, 'merged');
    const writeStream = require('fs').createWriteStream(mergedPath);

    for (let i = 0; i < session.totalChunks; i++) {
      const chunkPath = path.join(session.tmpDir, `chunk-${i}`);
      try {
        const chunkData = await fs.readFile(chunkPath);
        writeStream.write(chunkData);
        await fs.unlink(chunkPath); // Delete chunk after merging
      } catch (chunkError) {
        writeStream.destroy();
        throw new Error(`Failed to read chunk ${i}: ${chunkError}`);
      }
    }

    await new Promise((resolve, reject) => {
      writeStream.end((err: any) => (err ? reject(err) : resolve(null)));
    });

    // Move merged file to temporary location for processing
    tempVideoPath = path.join(session.tmpDir, 'merged-video');
    await fs.rename(mergedPath, tempVideoPath);
    mergedPath = null;
    
    console.log('Processing file:', session.fileName);
    
    let diarizationResult;
    
    if (mode === 'free') {
      console.log('🆓 Using 100% free processing (Whisper + Resemblyzer)');
      
      try {
        // Import free audio processing
        const { processAudioFileFree } = await import('@/lib/free-analysis/audio-processing');
        
        // Read audio file as buffer
        const audioBuffer = await fs.readFile(tempVideoPath);
        
        // Process with free methods
        const freeResult = await processAudioFileFree(audioBuffer, session.fileName);
        
        // Convert to expected format
        diarizationResult = {
          ...freeResult,
          utterances: freeResult.utterances,
          durationSec: freeResult.duration,
        };
        
        console.log('✅ Free processing complete');
        
      } catch (freeError) {
        console.error('❌ Free processing failed:', freeError);
        console.log('🔄 Falling back to AI processing...');
        
        // Fallback to AI processing
        diarizationResult = await processAudioFile(tempVideoPath, session.mimeType);
      }
    } else {
      console.log('🤖 Using AI processing (AssemblyAI/Deepgram)');
      
      // Use AI processing
      diarizationResult = await processAudioFile(tempVideoPath, session.mimeType);
    }

    // Delete the temporary file after processing
    try {
      await fs.unlink(tempVideoPath);
      console.log('Temporary file deleted after processing');
    } catch {}

    // Save results
    const saveDir = path.join(process.cwd(), config.storage.dataDir);
    await fs.mkdir(saveDir, { recursive: true });
    const analysisId = crypto.randomUUID();

    const saved = {
      id: analysisId,
      mode,
      createdAt: new Date().toISOString(),
      originalMimeType: session.mimeType,
      fileName: session.fileName,
      fileSize: session.fileSize,
      diarizationResult,
      speakerCharacteristics: {},
    };

    await fs.writeFile(
      path.join(saveDir, `${analysisId}.json`),
      JSON.stringify(saved, null, 2),
      'utf-8'
    );

    console.log('Analysis saved (no files stored, only metadata and results)');

    // Cleanup temp files
    await cleanupSession(session);

    return NextResponse.json({
      success: true,
      analysisId,
      diarizationResult,
      speakerCharacteristics: {},
      message: 'Upload and processing complete',
    });
  } catch (error) {
    console.error('Processing failed:', error);
    
    // Comprehensive cleanup on error
    const cleanupTasks = [];
    
    // Remove merged file if it exists
    if (mergedPath) {
      cleanupTasks.push(
        fs.unlink(mergedPath).catch(() => {})
      );
    }
    
    // Remove temp video file if it was created
    if (tempVideoPath) {
      cleanupTasks.push(
        fs.unlink(tempVideoPath).catch(() => {})
      );
    }
    
    // Cleanup session
    cleanupTasks.push(cleanupSession(session));
    
    await Promise.all(cleanupTasks);

    // Provide user-friendly error message
    let errorMessage = 'Failed to process upload';
    if (error instanceof Error) {
      if (error.message.includes('ENOSPC')) {
        errorMessage = 'Not enough disk space to process the video';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Processing timed out. Please try a shorter video';
      } else if (error.message.includes('503')) {
        errorMessage = 'AI service is temporarily overloaded. Please try again in a few minutes';
      } else {
        errorMessage = `Processing failed: ${error.message}`;
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Abort upload and cleanup
 */
async function handleAbort(req: NextRequest) {
  const { uploadId } = await req.json();

  if (!uploadId) {
    return NextResponse.json({ error: 'Missing uploadId' }, { status: 400 });
  }

  const session = uploadSessions.get(uploadId);
  if (session) {
    await cleanupSession(session);
  }

  return NextResponse.json({ success: true, message: 'Upload aborted' });
}
