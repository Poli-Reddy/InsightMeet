/**
 * Application configuration
 * Centralized configuration for easy management
 */

export const config = {
  upload: {
    // Chunk size for large file uploads (5MB)
    chunkSize: parseInt(process.env.NEXT_PUBLIC_CHUNK_SIZE || '5242880'),
    
    // Maximum file size (500MB)
    maxSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '524288000'),
    
    // Threshold for chunked upload (50MB) - files below this use direct upload
    chunkThreshold: parseInt(process.env.NEXT_PUBLIC_CHUNK_THRESHOLD || '52428800'),
    
    // Accepted file types
    acceptedTypes: ['.mp4', '.avi', '.mkv', '.mov', '.webm'],
    acceptedMimeTypes: ['video/mp4', 'video/x-msvideo', 'video/x-matroska', 'video/quicktime', 'video/webm'],
  },
  
  processing: {
    // Video segment duration for parallel processing (2 minutes)
    segmentDuration: parseInt(process.env.SEGMENT_DURATION || '120'),
    
    // Overlap between segments (5 seconds)
    segmentOverlap: parseInt(process.env.SEGMENT_OVERLAP || '5'),
    
    // Maximum number of segments
    maxSegments: parseInt(process.env.MAX_SEGMENTS || '50'),
    
    // Parallel processing concurrency
    concurrency: parseInt(process.env.PROCESSING_CONCURRENCY || '3'),
    
    // Retry attempts for failed segments
    retries: parseInt(process.env.PROCESSING_RETRIES || '2'),
  },
  
  analysis: {
    // Transcript chunk size for AI processing (15000 chars ~= 4000 tokens)
    transcriptChunkSize: parseInt(process.env.TRANSCRIPT_CHUNK_SIZE || '15000'),
    
    // Overlap between transcript chunks
    transcriptOverlap: parseInt(process.env.TRANSCRIPT_OVERLAP || '500'),
    
    // Utterances per analysis chunk
    utterancesPerChunk: parseInt(process.env.UTTERANCES_PER_CHUNK || '300'),
    
    // Overlap between analysis chunks
    analysisChunkOverlap: parseInt(process.env.ANALYSIS_CHUNK_OVERLAP || '50'),
  },
  
  storage: {
    // Local data directory for analysis results (JSON only, no media files)
    dataDir: process.env.DATA_DIR || 'data',
  },
} as const;
