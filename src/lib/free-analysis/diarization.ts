/**
 * Free Speaker Diarization using Resemblyzer + Agglomerative/DBSCAN
 * Calls local Python microservice for 100% free speaker separation
 */

export interface DiarizationResult {
  numSpeakers: number;
  speakers: string[];
  segments: Array<{
    start: number;
    end: number;
    speaker: number;
  }>;
  duration: number;
}

/**
 * Perform speaker diarization using local Resemblyzer service
 */
export async function diarizeAudioFree(
  audioBuffer: Buffer,
  filename: string,
  numSpeakers?: number,
  clusteringMethod: 'agglomerative' | 'dbscan' = 'agglomerative'
): Promise<DiarizationResult> {
  const diarizationServiceUrl = process.env.DIARIZATION_SERVICE_URL || 'http://localhost:8002';
  
  try {
    console.log(`👥 Using free diarization (Resemblyzer + ${clusteringMethod})`);
    
    // Create form data
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)]);
    formData.append('file', blob, filename);
    
    // Build URL with parameters
    const url = new URL(`${diarizationServiceUrl}/diarize`);
    if (numSpeakers) {
      url.searchParams.set('num_speakers', numSpeakers.toString());
    }
    url.searchParams.set('clustering_method', clusteringMethod);
    
    // Call Resemblyzer service
    const response = await fetch(url.toString(), {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Diarization service error: ${response.status} - ${error}`);
    }
    
    const result = await response.json();
    
    console.log(`✅ Free diarization complete: ${result.num_speakers} speakers, ${result.segments.length} segments`);
    
    return {
      numSpeakers: result.num_speakers,
      speakers: result.speakers,
      segments: result.segments,
      duration: result.duration,
    };
    
  } catch (error) {
    console.error('❌ Free diarization failed:', error);
    throw new Error(`Free diarization failed: ${error}`);
  }
}

/**
 * Check if diarization service is available
 * Uses longer timeout and retry logic for busy services
 */
export async function isDiarizationServiceAvailable(): Promise<boolean> {
  const diarizationServiceUrl = process.env.DIARIZATION_SERVICE_URL || 'http://localhost:8002';
  
  // Try multiple times with increasing timeouts
  const attempts = [5000, 10000, 20000]; // 5s, 10s, 20s
  
  for (let i = 0; i < attempts.length; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), attempts[i]);
      
      console.log(`🔍 Checking Diarization service (attempt ${i + 1}/${attempts.length}, timeout: ${attempts[i]}ms)...`);
      
      const response = await fetch(`${diarizationServiceUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('✅ Diarization service is available');
        return true;
      }
    } catch (error: any) {
      console.warn(`⚠️ Diarization service check attempt ${i + 1} failed:`, error.message);
      
      // If it's the last attempt, return false
      if (i === attempts.length - 1) {
        console.error('❌ Diarization service not available after all attempts');
        return false;
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return false;
}
