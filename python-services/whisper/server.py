#!/usr/bin/env python3
"""
Whisper.cpp Transcription Service
Provides local, free speech-to-text transcription using faster-whisper
"""

import os
import tempfile
import threading
from pathlib import Path
from typing import List, Dict, Any

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

try:
    from faster_whisper import WhisperModel
except ImportError:
    print("Installing faster-whisper...")
    os.system("pip install faster-whisper")
    from faster_whisper import WhisperModel

from job_manager import job_manager, JobStatus

app = FastAPI(title="Whisper Transcription Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Whisper model (lazy loading)
whisper_model = None

def get_whisper():
    global whisper_model
    if whisper_model is None:
        print("Loading Whisper model (medium.en)...")
        # Use CPU with int8 for efficiency
        whisper_model = WhisperModel("medium.en", device="cpu", compute_type="int8")
        print("Whisper model loaded successfully")
    return whisper_model

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "whisper-transcription"}

def process_transcription_job(job_id: str, tmp_file_path: str, filename: str):
    """Background task to process transcription"""
    try:
        job_manager.start_job(job_id)
        
        file_size_mb = os.path.getsize(tmp_file_path) / (1024 * 1024)
        print(f"🎤 Processing job {job_id}: {filename} ({file_size_mb:.2f} MB)")
        
        # Get Whisper instance
        model = get_whisper()
        
        # Transcribe with timestamps
        segments, info = model.transcribe(tmp_file_path, beam_size=5)
        
        # Format response
        full_text = []
        segment_list = []
        
        total_segments = 0
        for i, segment in enumerate(segments):
            full_text.append(segment.text)
            segment_list.append({
                "start": segment.start,
                "end": segment.end,
                "text": segment.text.strip()
            })
            total_segments = i + 1
            
            # Update progress every 10 segments
            if i % 10 == 0:
                # Estimate progress based on time
                progress = min(0.95, segment.end / (info.duration if info.duration > 0 else 1))
                job_manager.update_progress(job_id, progress)
        
        result = {
            "text": " ".join(full_text).strip(),
            "segments": segment_list,
            "language": info.language,
            "duration": info.duration
        }
        
        job_manager.complete_job(job_id, result)
        print(f"✅ Job {job_id} complete: {len(result['text'])} characters, {total_segments} segments")
        
    except Exception as e:
        print(f"❌ Job {job_id} failed: {str(e)}")
        job_manager.fail_job(job_id, str(e))
    
    finally:
        # Clean up temp file
        if os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe audio file using Whisper (synchronous)
    Returns: { "text": "transcribed text", "segments": [...] }
    
    Note: This is a long-running operation. Use /transcribe/async for large files.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    tmp_file_path = None
    try:
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        file_size_mb = len(content) / (1024 * 1024)
        print(f"Transcribing file: {file.filename} ({file_size_mb:.2f} MB)")
        
        # Get Whisper instance
        model = get_whisper()
        
        # Transcribe with timestamps
        segments, info = model.transcribe(tmp_file_path, beam_size=5)
        
        # Format response
        full_text = []
        segment_list = []
        
        for segment in segments:
            full_text.append(segment.text)
            segment_list.append({
                "start": segment.start,
                "end": segment.end,
                "text": segment.text.strip()
            })
        
        # Clean up temp file
        os.unlink(tmp_file_path)
        
        response = {
            "text": " ".join(full_text).strip(),
            "segments": segment_list,
            "language": info.language,
            "duration": info.duration
        }
        
        print(f"✅ Transcription complete: {len(response['text'])} characters, {len(segment_list)} segments")
        return response
        
    except Exception as e:
        # Clean up temp file on error
        if tmp_file_path and os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)
        
        print(f"❌ Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@app.post("/transcribe/async")
async def transcribe_audio_async(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    """
    Transcribe audio file asynchronously
    Returns: { "job_id": "uuid" }
    
    Use GET /jobs/{job_id} to check status and get results
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    try:
        # Save uploaded file to temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        # Create job
        job_id = job_manager.create_job()
        
        # Start background processing
        thread = threading.Thread(
            target=process_transcription_job,
            args=(job_id, tmp_file_path, file.filename)
        )
        thread.daemon = True
        thread.start()
        
        return {"job_id": job_id, "status": "pending"}
        
    except Exception as e:
        print(f"❌ Failed to start async transcription: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start transcription: {str(e)}")

@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """
    Get job status and result
    Returns: { "id": "uuid", "status": "pending|processing|completed|failed", "progress": 0.5, "result": {...} }
    """
    job = job_manager.get_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job

if __name__ == "__main__":
    print("Starting Whisper Transcription Service...")
    print("Service will be available at http://localhost:8001")
    uvicorn.run(app, host="0.0.0.0", port=8001)
