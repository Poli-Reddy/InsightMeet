/**
 * Async Transcription with Job Polling
 * Handles long-running transcription jobs
 */

export interface AsyncTranscriptionResult {
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  language: string;
  duration: number;
}

/**
 * Submit transcription job and poll for completion
 */
export async function transcribeAudioAsync(
  audioBuffer: Buffer,
  filename: string,
  whisperServiceUrl: string = process.env.WHISPER_SERVICE_URL || 'http://localhost:8001'
): Promise<AsyncTranscriptionResult> {
  try {
    console.log('🚀 Submitting async transcription job...');
    
    // Create form data
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)]);
    formData.append('file', blob, filename);
    
    // Submit job
    const submitResponse = await fetch(`${whisperServiceUrl}/transcribe/async`, {
      method: 'POST',
      body: formData,
    });
    
    if (!submitResponse.ok) {
      const error = await submitResponse.text();
      throw new Error(`Failed to submit job: ${submitResponse.status} - ${error}`);
    }
    
    const { job_id } = await submitResponse.json();
    console.log(`✅ Job submitted: ${job_id}`);
    
    // Poll for completion
    return await pollJobStatus(job_id, whisperServiceUrl);
    
  } catch (error) {
    console.error('❌ Async transcription failed:', error);
    throw new Error(`Async transcription failed: ${error}`);
  }
}

/**
 * Poll job status until completion
 */
async function pollJobStatus(
  jobId: string,
  whisperServiceUrl: string,
  pollIntervalMs: number = 5000,
  maxWaitTimeMs: number = 1800000 // 30 minutes
): Promise<AsyncTranscriptionResult> {
  const startTime = Date.now();
  let lastProgress = 0;
  
  while (true) {
    // Check timeout
    if (Date.now() - startTime > maxWaitTimeMs) {
      throw new Error('Transcription timeout: exceeded 30 minutes');
    }
    
    try {
      const response = await fetch(`${whisperServiceUrl}/jobs/${jobId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get job status: ${response.status}`);
      }
      
      const job = await response.json();
      
      // Log progress if changed
      if (job.progress > lastProgress) {
        console.log(`⏳ Transcription progress: ${(job.progress * 100).toFixed(1)}%`);
        lastProgress = job.progress;
      }
      
      // Check status
      if (job.status === 'completed') {
        console.log('✅ Transcription completed!');
        return job.result;
      }
      
      if (job.status === 'failed') {
        throw new Error(`Transcription failed: ${job.error}`);
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      
    } catch (error) {
      console.error('❌ Error polling job status:', error);
      throw error;
    }
  }
}

/**
 * Process multiple chunks in parallel with async jobs
 */
export async function transcribeChunksAsync(
  chunks: Array<{ index: number; buffer: Buffer; startTime: number }>,
  filename: string,
  whisperServiceUrl: string = process.env.WHISPER_SERVICE_URL || 'http://localhost:8001',
  maxParallel: number = 4
): Promise<Array<{
  index: number;
  startTime: number;
  result: AsyncTranscriptionResult;
}>> {
  console.log(`🔄 Processing ${chunks.length} chunks (max ${maxParallel} parallel)...`);
  
  const results: Array<{
    index: number;
    startTime: number;
    result: AsyncTranscriptionResult;
  }> = [];
  
  // Process in batches
  for (let i = 0; i < chunks.length; i += maxParallel) {
    const batch = chunks.slice(i, i + maxParallel);
    console.log(`📦 Processing batch ${Math.floor(i / maxParallel) + 1}/${Math.ceil(chunks.length / maxParallel)} (${batch.length} chunks)`);
    
    const batchResults = await Promise.all(
      batch.map(async (chunk) => {
        const chunkFilename = `${filename}-chunk-${chunk.index}.wav`;
        const result = await transcribeAudioAsync(chunk.buffer, chunkFilename, whisperServiceUrl);
        return {
          index: chunk.index,
          startTime: chunk.startTime,
          result
        };
      })
    );
    
    results.push(...batchResults);
  }
  
  return results;
}
