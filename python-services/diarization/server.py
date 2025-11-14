#!/usr/bin/env python3
"""
Resemblyzer Speaker Diarization Service
Provides local, free speaker diarization using voice embeddings
"""

import os
import tempfile
from pathlib import Path
from typing import List, Dict, Any

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np

try:
    from resemblyzer import VoiceEncoder, preprocess_wav
    from sklearn.cluster import AgglomerativeClustering, DBSCAN
    import librosa
    import soundfile as sf
except ImportError as e:
    print(f"Installing required packages: {e}")
    os.system("pip install resemblyzer scikit-learn librosa soundfile")
    from resemblyzer import VoiceEncoder, preprocess_wav
    from sklearn.cluster import AgglomerativeClustering, DBSCAN
    import librosa
    import soundfile as sf

app = FastAPI(title="Resemblyzer Diarization Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize voice encoder (lazy loading)
encoder = None

def get_encoder():
    global encoder
    if encoder is None:
        print("Loading Resemblyzer voice encoder...")
        encoder = VoiceEncoder()
        print("Voice encoder loaded successfully")
    return encoder

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "resemblyzer-diarization"}

@app.post("/diarize")
async def diarize_audio(
    file: UploadFile = File(...),
    num_speakers: int = Query(None, description="Number of speakers (auto-detect if not provided)"),
    min_speakers: int = Query(2, description="Minimum number of speakers"),
    max_speakers: int = Query(10, description="Maximum number of speakers"),
    clustering_method: str = Query("agglomerative", description="Clustering method: agglomerative or dbscan")
):
    """
    Perform speaker diarization using Resemblyzer
    Returns: { "speakers": [...], "segments": [...] }
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    try:
        # Save uploaded file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        print(f"Diarizing file: {file.filename} ({len(content)} bytes)")
        
        # Load and preprocess audio
        wav, sample_rate = librosa.load(tmp_file_path, sr=16000)
        os.unlink(tmp_file_path)
        
        wav = preprocess_wav(wav)
        
        # Get voice encoder
        enc = get_encoder()
        
        # Split audio into segments (1 second windows with 0.5 second overlap)
        segment_duration = 1.0
        overlap = 0.5
        step = segment_duration - overlap
        
        segments = []
        embeddings = []
        
        current_time = 0
        while current_time < len(wav) / sample_rate:
            start_sample = int(current_time * sample_rate)
            end_sample = int((current_time + segment_duration) * sample_rate)
            
            if end_sample > len(wav):
                end_sample = len(wav)
            
            segment_wav = wav[start_sample:end_sample]
            
            # Skip very short segments
            if len(segment_wav) < sample_rate * 0.3:
                break
            
            try:
                embedding = enc.embed_utterance(segment_wav)
                embeddings.append(embedding)
                segments.append({
                    "start": current_time,
                    "end": min(current_time + segment_duration, len(wav) / sample_rate),
                    "embedding_idx": len(embeddings) - 1
                })
            except Exception as e:
                print(f"Warning: Could not process segment at {current_time}s: {e}")
            
            current_time += step
        
        if len(embeddings) == 0:
            raise HTTPException(status_code=400, detail="No valid audio segments found")
        
        print(f"Generated {len(embeddings)} embeddings")
        
        # Cluster embeddings
        embeddings_array = np.array(embeddings)
        
        # Determine number of speakers
        if num_speakers is None:
            num_speakers = estimate_num_speakers(embeddings_array, min_speakers, max_speakers)
        
        num_speakers = max(1, min(num_speakers, len(embeddings)))
        
        print(f"Clustering into {num_speakers} speakers using {clustering_method}")
        
        # Perform clustering
        if clustering_method == "dbscan":
            clustering = DBSCAN(eps=0.3, min_samples=2)
            speaker_labels = clustering.fit_predict(embeddings_array)
            # Reassign noise points (-1) to nearest cluster
            unique_labels = set(speaker_labels)
            if -1 in unique_labels:
                unique_labels.remove(-1)
            num_speakers = len(unique_labels)
        else:
            clustering = AgglomerativeClustering(n_clusters=num_speakers, linkage='ward')
            speaker_labels = clustering.fit_predict(embeddings_array)
        
        # Assign speakers to segments
        speaker_segments = []
        for i, segment in enumerate(segments):
            speaker_segments.append({
                "start": segment["start"],
                "end": segment["end"],
                "speaker": int(speaker_labels[i])
            })
        
        # Merge consecutive segments from same speaker
        merged_segments = merge_consecutive_segments(speaker_segments)
        
        response = {
            "num_speakers": num_speakers,
            "speakers": [f"Speaker {i}" for i in range(num_speakers)],
            "segments": merged_segments,
            "duration": len(wav) / sample_rate
        }
        
        print(f"Diarization complete: {num_speakers} speakers, {len(merged_segments)} segments")
        return response
        
    except Exception as e:
        if 'tmp_file_path' in locals() and os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)
        
        print(f"Diarization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Diarization failed: {str(e)}")

def estimate_num_speakers(embeddings: np.ndarray, min_speakers: int, max_speakers: int) -> int:
    """Estimate optimal number of speakers using silhouette analysis"""
    from sklearn.metrics import silhouette_score
    
    if len(embeddings) < 4:
        return min(2, len(embeddings))
    
    best_score = -1
    best_k = 2
    
    for k in range(min_speakers, min(max_speakers + 1, len(embeddings))):
        try:
            clustering = AgglomerativeClustering(n_clusters=k, linkage='ward')
            labels = clustering.fit_predict(embeddings)
            
            if len(set(labels)) > 1:
                score = silhouette_score(embeddings, labels)
                if score > best_score:
                    best_score = score
                    best_k = k
        except Exception:
            continue
    
    return best_k

def merge_consecutive_segments(segments: List[Dict]) -> List[Dict]:
    """Merge consecutive segments from the same speaker"""
    if not segments:
        return []
    
    merged = []
    current = segments[0].copy()
    
    for segment in segments[1:]:
        if (
            segment["speaker"] == current["speaker"] and 
            abs(segment["start"] - current["end"]) < 0.5
        ):
            current["end"] = segment["end"]
        else:
            merged.append(current)
            current = segment.copy()
    
    merged.append(current)
    return merged

if __name__ == "__main__":
    print("Starting Resemblyzer Diarization Service...")
    print("Service will be available at http://localhost:8002")
    uvicorn.run(app, host="0.0.0.0", port=8002)
