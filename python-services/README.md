# Python Microservices for Free Analysis

This directory contains Python microservices that provide 100% free, local transcription and speaker diarization.

## Services

### 1. Whisper Service (Port 8001)
- **Technology**: faster-whisper (optimized Whisper implementation)
- **Purpose**: Speech-to-text transcription
- **Model**: medium.en (1.5GB, auto-downloads)
- **Accuracy**: 90-95%

### 2. Diarization Service (Port 8002)
- **Technology**: Resemblyzer + scikit-learn
- **Purpose**: Speaker identification and separation
- **Clustering**: Agglomerative (default) or DBSCAN
- **Accuracy**: 85-90%

## Quick Start

### Using Docker Compose (Recommended)
```bash
cd studio
docker-compose up -d
```

### Manual Setup

#### Whisper Service
```bash
cd whisper
pip install -r requirements.txt
python server.py
```

#### Diarization Service
```bash
cd diarization
pip install -r requirements.txt
python server.py
```

## API Endpoints

### Whisper Service

#### Health Check
```bash
GET http://localhost:8001/health
```

#### Transcribe Audio
```bash
POST http://localhost:8001/transcribe
Content-Type: multipart/form-data

file: <audio_file>
```

**Response:**
```json
{
  "text": "Full transcription text",
  "segments": [
    {
      "start": 0.0,
      "end": 2.5,
      "text": "Hello world"
    }
  ],
  "language": "en",
  "duration": 120.5
}
```

### Diarization Service

#### Health Check
```bash
GET http://localhost:8002/health
```

#### Diarize Audio
```bash
POST http://localhost:8002/diarize?clustering_method=agglomerative
Content-Type: multipart/form-data

file: <audio_file>
num_speakers: 3 (optional)
min_speakers: 2 (optional)
max_speakers: 10 (optional)
clustering_method: agglomerative|dbscan (optional)
```

**Response:**
```json
{
  "num_speakers": 3,
  "speakers": ["Speaker 0", "Speaker 1", "Speaker 2"],
  "segments": [
    {
      "start": 0.0,
      "end": 2.5,
      "speaker": 0
    }
  ],
  "duration": 120.5
}
```

## Clustering Methods

### Agglomerative (Default)
- Hierarchical clustering with Ward linkage
- Requires number of speakers (auto-detected if not provided)
- Best for clear speaker separation
- More stable and predictable

### DBSCAN
- Density-based clustering
- Automatically finds number of speakers
- Handles noise and outliers
- Best for variable speaker counts

## Requirements

### System Requirements
- Python 3.11+
- 4GB+ RAM
- 2+ CPU cores
- 5GB disk space (for models)

### Python Dependencies

**Whisper:**
- faster-whisper
- fastapi
- uvicorn
- numpy

**Diarization:**
- resemblyzer
- scikit-learn
- librosa
- soundfile
- fastapi
- uvicorn

## Troubleshooting

### Model Download Issues
Models are downloaded automatically on first use. If download fails:
```bash
# Clear cache and restart
rm -rf ~/.cache/huggingface
docker-compose restart whisper diarization
```

### Memory Issues
If services crash due to memory:
```python
# In whisper/server.py, use smaller model:
whisper_model = WhisperModel("small.en", device="cpu", compute_type="int8")

# Or in diarization/server.py, reduce segment duration:
segment_duration = 0.5  # Instead of 1.0
```

### Port Conflicts
If ports 8001 or 8002 are in use:
```yaml
# In docker-compose.yml, change ports:
ports:
  - "8003:8001"  # Map to different host port
```

## Performance

### First Run
- Whisper model download: ~5 minutes
- Resemblyzer model download: ~1 minute
- Total setup time: ~10 minutes

### Subsequent Runs
- 10-minute audio: ~2-3 minutes processing
- CPU usage: 80-100% during processing
- Memory usage: ~2GB total

## Development

### Running Tests
```bash
# Test Whisper service
curl -X POST -F "file=@test.wav" http://localhost:8001/transcribe

# Test Diarization service
curl -X POST -F "file=@test.wav" http://localhost:8002/diarize
```

### Viewing Logs
```bash
# Docker logs
docker-compose logs -f whisper
docker-compose logs -f diarization

# Manual logs
# Services print to stdout
```

## License

These services use open-source models and libraries:
- Whisper: MIT License (OpenAI)
- Resemblyzer: MIT License
- faster-whisper: MIT License
- scikit-learn: BSD License
