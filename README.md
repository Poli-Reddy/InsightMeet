# InsightMeet - AI-Powered Meeting Intelligence Platform

Transform your meetings with AI-powered insights, sentiment analysis, and relationship mapping.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue)](https://www.python.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

##  Features

### Dual-Mode Architecture
- **AI Mode**: High-accuracy analysis using commercial APIs (AssemblyAI, Deepgram, Gemini)
- **Free Mode**: 100% local processing using open-source models (Whisper, Resemblyzer)

### Comprehensive Analysis
-  **Automatic Transcription** with speaker diarization
-  **Sentiment Analysis** for each utterance
-  **Relationship Graphs** showing speaker interactions
-  **Action Items** extraction
-  **Decision Detection**
-  **Keyword Extraction**
-  **Topic Segmentation**
-  **Unanswered Questions** tracking
-  **Interruption Detection**
-  **Participation Metrics**
-  **Emotion Timeline**

### Advanced Features
- Support for large files (up to 500MB)
- Chunked processing with async job queue
- Real-time progress tracking
- Interactive visualizations
- PDF report export
- Analysis history

##  Quick Start

### Prerequisites
- Node.js 20+ and npm
- Docker Desktop
- 8GB RAM minimum (16GB recommended)
- 15GB free disk space

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Poli-Reddy/InsightMeet.git
cd InsightMeet/studio
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys (optional for AI mode)
```

4. **Start Python microservices (for Free Mode)**
```bash
docker-compose up -d
```

5. **Start the development server**
```bash
npm run dev
```

6. **Open your browser**
```
http://localhost:3000
```

##  Usage

### Free Mode (No API Keys Required)
1. Select "Free Mode" on the homepage
2. Upload your meeting video/audio file
3. Wait for processing (uses local Whisper + Resemblyzer)
4. View comprehensive analysis dashboard
5. Export results as PDF

### AI Mode (Requires API Keys)
1. Add API keys to `.env` file
2. Select "AI Mode" on the homepage
3. Upload your meeting file
4. Faster processing with higher accuracy
5. Automatic fallback between providers

##  Architecture

```
┌─────────────────────────────────────────┐
│     Next.js 15 Frontend + Backend       │
└─────────────────────────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │   Mode Selection    │
    └─────────────────────┘
         │           │
         ▼           ▼
    ┌────────┐  ┌──────────┐
    │AI Mode │  │Free Mode │
    └────────┘  └──────────┘
         │           │
         ▼           ▼
    Cloud APIs   Docker Services
    (AssemblyAI) (Whisper + Resemblyzer)
```

### Technology Stack

**Frontend:**
- Next.js 15.5 with React 18
- TypeScript 5
- Tailwind CSS + Framer Motion
- Recharts + D3.js

**Backend:**
- Next.js API Routes
- FastAPI (Python microservices)
- FFmpeg (audio/video processing)

**AI/ML:**
- Whisper (transcription)
- Resemblyzer (speaker diarization)
- VADER (sentiment analysis)
- Natural + Compromise (NLP)

**Infrastructure:**
- Docker + Docker Compose
- Node.js 20+
- Python 3.11+

##  Performance

| File Size | Free Mode | AI Mode |
|-----------|-----------|---------|
| 10 MB     | 2-3 min   | 1-2 min |
| 50 MB     | 8-10 min  | 3-5 min |
| 100 MB    | 15-20 min | 5-8 min |
| 500 MB    | 60-90 min | 20-30 min |

**Free Mode Accuracy:**
- Transcription: 90-95%
- Diarization: 85-90%
- Sentiment: 96% correlation with human judgment

**AI Mode Accuracy:**
- Transcription: 95-98%
- Diarization: 92-95%
- Sentiment: 98% correlation

##  Configuration

### Chunk Processing (Free Mode)
Edit `src/lib/free-analysis/audio-processing.ts`:
```typescript
const CHUNK_THRESHOLD_MB = 30;  // Files > 30MB use chunking
const CHUNK_DURATION_SEC = 300; // 5-minute chunks
const maxParallel = 4;          // Process 4 chunks simultaneously
```

### Timeout Settings
Edit `src/lib/free-analysis/async-transcription.ts`:
```typescript
const pollIntervalMs = 5000;      // Check every 5 seconds
const maxWaitTimeMs = 1800000;    // Timeout after 30 minutes
```

##  Docker Services

### Whisper Service (Port 8001)
- Transcription using faster-whisper
- Model: medium.en (1.5GB)
- Async job queue support

### Diarization Service (Port 8002)
- Speaker identification using Resemblyzer
- Agglomerative or DBSCAN clustering
- Auto-detection of speaker count

### Commands
```bash
# Start services
docker-compose up -d

# View logs
docker logs -f studio-whisper-1
docker logs -f studio-diarization-1

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Rebuild after changes
docker-compose build
docker-compose up -d
```

##  Testing

```bash
# Run all tests
npm test

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

##  API Documentation

### Upload Endpoint
```
POST /api/upload
Content-Type: multipart/form-data

Body:
- file: audio/video file
- mode: "ai" | "free"

Response:
{
  "id": "uuid",
  "diarizationResult": {...},
  "speakerCharacteristics": {...}
}
```

### Analysis Endpoints
- `POST /api/summary-report` - Generate meeting summary
- `POST /api/relationship-graph` - Build relationship network
- `POST /api/action-items` - Extract action items
- `POST /api/decisions` - Identify decisions
- `POST /api/keywords` - Extract keywords
- `POST /api/topics` - Segment topics
- `POST /api/interruptions` - Detect interruptions
- `POST /api/unanswered-questions` - Find unanswered questions

##  Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


##  Acknowledgments

- [OpenAI Whisper](https://github.com/openai/whisper) - Speech recognition
- [Resemblyzer](https://github.com/resemble-ai/Resemblyzer) - Speaker embeddings
- [VADER Sentiment](https://github.com/cjhutto/vaderSentiment) - Sentiment analysis
- [AssemblyAI](https://www.assemblyai.com/) - AI transcription API
- [Deepgram](https://deepgram.com/) - Speech-to-text API

##  Contact

**Project Maintainer:** Poli Reddy

**GitHub:** [@Poli-Reddy](https://github.com/Poli-Reddy)

**Repository:** [InsightMeet](https://github.com/Poli-Reddy/InsightMeet)

##  Roadmap

### Short-term (6 months)
- [ ] Multilingual support (Spanish, French, German)
- [ ] Real-time streaming analysis
- [ ] Mobile app (iOS, Android)
- [ ] Browser extension for web meetings

### Long-term (1-2 years)
- [ ] Video analysis (facial expressions, body language)
- [ ] Predictive analytics (meeting outcome prediction)
- [ ] Integration with Zoom, Teams, Google Meet
- [ ] Distributed processing with Kubernetes

##  Documentation

- [Large File Processing](FREE_MODE_LARGE_FILES.md) - Handling 50-500MB files
- [Presentation](InsightMeet_Presentation.md) - Research presentation

##  Troubleshooting

### Whisper service not responding
```bash
docker-compose restart whisper
```

### Out of memory errors
Reduce chunk size in `audio-processing.ts`:
```typescript
const CHUNK_DURATION_SEC = 180; // 3 minutes instead of 5
```

### API timeout errors
Increase timeout in `transcription.ts`:
```typescript
const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds
```

### Docker build fails
```bash
docker system prune -a
docker-compose build --no-cache
```

##  Tips

- Use Free Mode for sensitive meetings (100% local processing)
- Use AI Mode for faster processing and higher accuracy
- Files > 30MB are automatically chunked for better performance
- Check Docker logs if processing seems stuck
- Restart services if health checks fail

---

**Made with Love(^_^) for better meetings**
