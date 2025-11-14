// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.WHISPER_SERVICE_URL = 'http://localhost:8001'
process.env.DIARIZATION_SERVICE_URL = 'http://localhost:8002'
process.env.GEMINI_API_KEY = 'test-gemini-key'
process.env.ASSEMBLYAI_API_KEY = 'test-assemblyai-key'
process.env.DEEPGRAM_API_KEY = 'test-deepgram-key'
