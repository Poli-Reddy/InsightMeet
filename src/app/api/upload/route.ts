import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { diarizeAudio } from '@/ai/flows/speaker-diarization';
import ffmpeg from 'fluent-ffmpeg';
// @ts-ignore
import ffmpegStatic from 'ffmpeg-static';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

// List and fetch saved analyses
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    if (id) {
      const p = path.join(dataDir, `${id}.json`);
      const buf = await fs.readFile(p, 'utf-8');
      return NextResponse.json(JSON.parse(buf));
    }
    const files = await fs.readdir(dataDir);
    const list = [] as Array<{ id: string; createdAt: string; fileName?: string; hidden?: boolean; mode?: string }>
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const buf = await fs.readFile(path.join(dataDir, f), 'utf-8');
      const j = JSON.parse(buf);
      list.push({ id: j.id, createdAt: j.createdAt, fileName: j.fileName, hidden: !!j.hidden, mode: j.mode });
    }
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json({ items: list });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to list analyses' }, { status: 500 });
  }
}

// Update analysis with full analysis data
export async function PATCH(req: NextRequest) {
  try {
    const { id, fullAnalysis } = await req.json();
    if (!id || !fullAnalysis) {
      return NextResponse.json({ error: 'Missing id or fullAnalysis' }, { status: 400 });
    }
    
    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, `${id}.json`);
    
    // Read existing data
    const existing = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    
    // Add full analysis
    existing.fullAnalysis = fullAnalysis;
    
    // Save back
    await fs.writeFile(filePath, JSON.stringify(existing, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update analysis:', error);
    return NextResponse.json({ error: 'Failed to update analysis' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const MAX_SIZE = 100 * 1024 * 1024; // Increased to 100MB
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.startsWith('multipart/form-data')) {
      console.error('Invalid content type:', contentType);
      return NextResponse.json({ error: 'Invalid content type', details: contentType }, { status: 400 });
    }

    // Read the multipart form data
    const formData = await req.formData();
    const file = formData.get('file');
    const mode = (formData.get('mode') as string) || 'ai'; // Get mode from form data
    
    if (!file || typeof file === 'string') {
      console.error('No file uploaded');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      console.error('File too large:', file.size);
      return NextResponse.json({ error: 'File too large', details: file.size }, { status: 413 });
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || 'audio/wav';
    
    console.log(`Processing ${mimeType} file directly (${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB) in ${mode} mode`);
    
    // Process based on mode
    let diarizationResult;
    
    if (mode === 'free') {
      console.log('🆓 Using 100% free processing (Whisper + Resemblyzer)');
      
      try {
        // Import free audio processing
        const { processAudioFileFree } = await import('@/lib/free-analysis/audio-processing');
        
        // Process with free methods
        const freeResult = await processAudioFileFree(fileBuffer, file.name);
        
        // Convert to expected format
        diarizationResult = {
          utterances: freeResult.utterances,
          durationSec: freeResult.duration,
        };
        
        console.log('✅ Free processing complete');
        
      } catch (freeError) {
        console.error('❌ Free processing failed:', freeError);
        console.log('🔄 Falling back to AI processing...');
        
        // Fallback to AI processing
        const base64 = fileBuffer.toString('base64');
        const audioDataUri = `data:${mimeType};base64,${base64}`;
        
        try {
          diarizationResult = await diarizeAudio({ audioDataUri });
        } catch (err: any) {
          console.error('Diarization failed:', err);
          return NextResponse.json({ error: err?.message || 'Diarization failed', details: err?.toString() }, { status: 500 });
        }
      }
    } else {
      console.log('🤖 Using AI processing (AssemblyAI/Deepgram)');
      
      // Convert to base64 data URI - send video/audio directly to AI
      const base64 = fileBuffer.toString('base64');
      const audioDataUri = `data:${mimeType};base64,${base64}`;

      // Call diarizeAudio server-side to avoid sending large payloads to client
      try {
        diarizationResult = await diarizeAudio({ audioDataUri });
      } catch (err: any) {
        console.error('Diarization failed:', err);
        return NextResponse.json({ error: err?.message || 'Diarization failed', details: err?.toString() }, { status: 500 });
      }
    }

    // If this is a video, attempt to extract frames around utterance timestamps
    // and call an external vision service to identify speaker characteristics.
    let speakerCharacteristics: Record<number, { description: string; confidence: number }> = {};
    if (mimeType.startsWith('video/') && Array.isArray(diarizationResult?.utterances) && diarizationResult.utterances.length > 0) {
      try {
        if (ffmpegStatic) {
          // @ts-ignore
          ffmpeg.setFfmpegPath(ffmpegStatic);
        }

        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'insightmeet-'));
        const tmpVideoPath = path.join(tmpDir, `${crypto.randomUUID()}.input`);
        await fs.writeFile(tmpVideoPath, Buffer.from(arrayBuffer));

        // Collect up to 2 representative timestamps per speaker
        const utterances = diarizationResult.utterances as Array<{ speaker: number; startSec?: number; endSec?: number; text: string }>;
        const perSpeakerTimestamps = new Map<number, number[]>();
        for (const u of utterances) {
          if (typeof u.startSec === 'number' || typeof u.endSec === 'number') {
            const start = typeof u.startSec === 'number' ? u.startSec : 0;
            const end = typeof u.endSec === 'number' ? u.endSec : Math.max(start + 0.6, start + Math.min(0.6, (u.text?.length || 5) / 10));
            const mid = start + Math.max(0.1, (end - start) / 2);
            const list = perSpeakerTimestamps.get(u.speaker) || [];
            if (list.length < 2) {
              list.push(mid);
              perSpeakerTimestamps.set(u.speaker, list);
            }
          }
        }

        // Fallback if no timestamps: take 0.5s and 1.5s
        if (perSpeakerTimestamps.size === 0) {
          const speakers = Array.from(new Set(utterances.map(u => u.speaker)));
          speakers.forEach(s => perSpeakerTimestamps.set(s, [0.5, 1.5]));
        }

        // Extract frames for each timestamp
        const frameInfos: Array<{ speaker: number; timestamp: number; filePath: string }> = [];
        for (const [speakerIdx, tsList] of perSpeakerTimestamps.entries()) {
          for (const ts of tsList) {
            const safeTs = Math.max(0, ts);
            const outPath = path.join(tmpDir, `speaker-${speakerIdx}-${safeTs.toFixed(2)}.png`);
            await new Promise<void>((resolve, reject) => {
              ffmpeg(tmpVideoPath)
                .frames(1)
                .outputOptions(['-ss', safeTs.toFixed(2)])
                .output(outPath)
                .on('end', () => resolve())
                .on('error', (err: unknown) => reject(err))
                .run();
            });
            frameInfos.push({ speaker: speakerIdx, timestamp: safeTs, filePath: outPath });
          }
        }

        // Call external vision service for each frame
        const visionUrl = process.env.VISION_SERVICE_URL || 'http://localhost:8000/analyze';
        const resultsBySpeaker: Map<number, Array<{ description: string; confidence: number }>> = new Map();
        for (const frame of frameInfos) {
          try {
            const imageBuffer = await fs.readFile(frame.filePath);
            const imageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
            const res = await fetch(visionUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageBase64 }),
            });
            if (!res.ok) continue;
            const json = await res.json();
            // Expecting { attributes: [{ label: string, confidence: number }, ...] }
            const attributes: Array<{ label?: string; confidence?: number }> = Array.isArray(json?.attributes) ? json.attributes : [];
            const confident = attributes
              .filter(a => typeof a.confidence === 'number' && (a.confidence as number) >= 0.8 && typeof a.label === 'string')
              .sort((a, b) => (b.confidence as number) - (a.confidence as number))
              .slice(0, 2);
            if (confident.length > 0) {
              const description = confident.map(a => a.label).join(', ');
              const confidence = confident[0].confidence as number;
              const list = resultsBySpeaker.get(frame.speaker) || [];
              list.push({ description, confidence });
              resultsBySpeaker.set(frame.speaker, list);
            }
          } catch {}
        }

        // Aggregate per speaker: pick highest confidence description
        for (const [speakerIdx, list] of resultsBySpeaker.entries()) {
          const best = list.sort((a, b) => b.confidence - a.confidence)[0];
          if (best && best.confidence >= 0.8) {
            speakerCharacteristics[speakerIdx] = { description: best.description, confidence: best.confidence };
          }
        }

        // Cleanup tmp files (best-effort)
        try {
          await Promise.all(frameInfos.map(f => fs.unlink(f.filePath).catch(() => {})));
          await fs.unlink(tmpVideoPath).catch(() => {});
          await fs.rmdir(tmpDir).catch(() => {});
        } catch {}
      } catch (visionErr) {
        // If anything fails, proceed with diarization only
        console.error('Vision pipeline failed:', visionErr);
      }
    }

    // Persist analysis to disk (id + saved JSON)
    try {
      const saveDir = path.join(process.cwd(), 'data');
      await fs.mkdir(saveDir, { recursive: true });
      const analysisId = crypto.randomUUID();
      // Get file name from uploaded file object
      const fileName = (typeof file.name === 'string') ? file.name : undefined;
      const saved = {
        id: analysisId,
        mode,
        createdAt: new Date().toISOString(),
        mimeType,
        fileName,
        diarizationResult,
        speakerCharacteristics,
      };
      await fs.writeFile(path.join(saveDir, `${analysisId}.json`), JSON.stringify(saved, null, 2), 'utf-8');
      return NextResponse.json({ id: analysisId, diarizationResult, speakerCharacteristics });
    } catch (persistErr) {
      console.error('Persist failed:', persistErr);
      // Still return the result to the user even if saving fails
      return NextResponse.json({ diarizationResult, speakerCharacteristics });
    }
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: 'Upload failed', details: error?.toString() }, { status: 500 });
  }
}
