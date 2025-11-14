/**
 * Process items in parallel with concurrency control
 */
import { config } from './config';

/**
 * Process items in parallel with concurrency control
 */
export async function processInParallel<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  options: {
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
    retries?: number;
  } = {}
): Promise<R[]> {
  const { concurrency = config.processing.concurrency, onProgress, retries = config.processing.retries } = options;

  const results: R[] = new Array(items.length);
  const queue = items.map((item, index) => ({ item, index }));
  let completed = 0;

  // Process with retry logic
  async function processWithRetry(item: T, index: number): Promise<R> {
    let lastError;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await processor(item, index);
        return result;
      } catch (error: any) {
        lastError = error;
        const is503 = error?.message?.includes('503') || error?.message?.includes('overloaded');
        
        if (is503 && attempt < retries) {
          const waitTime = (attempt + 1) * 3000; // 3s, 6s, 9s
          console.log(`Segment ${index} failed (503), retrying in ${waitTime/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (attempt === retries) {
          throw new Error(`Segment ${index} failed after ${retries + 1} attempts: ${error.message}`);
        } else {
          throw error;
        }
      }
    }
    
    throw lastError;
  }

  // Worker function
  async function worker() {
    while (queue.length > 0) {
      const task = queue.shift();
      if (!task) break;

      try {
        const result = await processWithRetry(task.item, task.index);
        results[task.index] = result;
        completed++;
        
        if (onProgress) {
          onProgress(completed, items.length);
        }
      } catch (error) {
        console.error(`Failed to process item ${task.index}:`, error);
        throw error;
      }
    }
  }

  // Start workers
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());

  await Promise.all(workers);

  return results;
}

/**
 * Batch items into groups
 */
export function batchItems<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}
