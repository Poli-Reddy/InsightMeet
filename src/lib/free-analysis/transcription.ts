/**
 * Free Transcription Service using Whisper (faster-whisper)
 * Calls local Python microservice for 100% free transcription
 */

export interface TranscriptionResult {
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
 * Transcribe audio using local Whisper service
 */
export async function transcribeAudioFree(
  audioBuffer: Buffer,
  filename: string
): Promise<TranscriptionResult> {
  const whisperServiceUrl = process.env.WHISPER_SERVICE_URL || 'http://localhost:8001';
  
  try {
    console.log('🎤 Using free transcription (Whisper)');
    
    // Create form data
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)]);
    formData.append('file', blob, filename);
    
    // Call Whisper service
    const response = await fetch(`${whisperServiceUrl}/transcribe`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Whisper service error: ${response.status} - ${error}`);
    }
    
    const result = await response.json();
    
    console.log(`✅ Free transcription complete: ${result.text.length} characters`);
    
    return {
      text: result.text,
      segments: result.segments || [],
      language: result.language || 'en',
      duration: result.duration || 0,
    };
    
  } catch (error) {
    console.error('❌ Free transcription failed:', error);
    throw new Error(`Free transcription failed: ${error}`);
  }
}

/**
 * Check if Whisper service is available
 * Uses longer timeout and retry logic for busy services
 */
export async function isWhisperServiceAvailable(): Promise<boolean> {
  const whisperServiceUrl = process.env.WHISPER_SERVICE_URL || 'http://localhost:8001';
  
  // Try multiple times with increasing timeouts
  const attempts = [5000, 10000, 20000]; // 5s, 10s, 20s
  
  for (let i = 0; i < attempts.length; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), attempts[i]);
      
      console.log(`🔍 Checking Whisper service (attempt ${i + 1}/${attempts.length}, timeout: ${attempts[i]}ms)...`);
      
      const response = await fetch(`${whisperServiceUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ Whisper service is available');
        return true;
      }
    } catch (error: any) {
      console.warn(`⚠️ Whisper service check attempt ${i + 1} failed:`, error.message);
      
      // If it's the last attempt, return false
      if (i === attempts.length - 1) {
        console.error('❌ Whisper service not available after all attempts');
        return false;
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return false;
}
