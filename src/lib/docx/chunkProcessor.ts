/**
 * Chunked Paragraph Processor Utility
 * Processes large arrays of paragraph XML elements in chunks to avoid blocking the event loop
 */

/**
 * Cancellation token interface for stopping processing
 */
export interface CancellationToken {
  isCancelled: boolean;
  cancel(): void;
}

/**
 * Progress information provided during processing
 */
export interface ProcessingProgress {
  processedCount: number;
  totalCount: number;
  currentChunk: number;
  totalChunks: number;
  percentComplete: number;
}

/**
 * Configuration options for chunk processing
 */
export interface ChunkProcessorOptions<T, R> {
  /**
   * Size of each chunk to process (default: 100)
   */
  chunkSize?: number;

  /**
   * Processing function to apply to each element
   */
  processor: (element: T, index: number) => R | Promise<R>;

  /**
   * Optional progress callback invoked after each chunk
   */
  onProgress?: (progress: ProcessingProgress) => void;

  /**
   * Cancellation token to stop processing
   */
  cancellationToken?: CancellationToken;

  /**
   * Whether to use requestIdleCallback when available (default: true)
   * Falls back to setTimeout if not available
   */
  useIdleCallback?: boolean;

  /**
   * Delay in milliseconds between chunks when using setTimeout (default: 0)
   */
  delay?: number;
}

/**
 * Result of chunk processing
 */
export interface ChunkProcessorResult<R> {
  results: R[];
  completed: boolean;
  processedCount: number;
}

/**
 * Creates a new cancellation token
 */
export function createCancellationToken(): CancellationToken {
  let cancelled = false;

  return {
    get isCancelled() {
      return cancelled;
    },
    cancel() {
      cancelled = true;
    }
  };
}

/**
 * Yields to the event loop using requestIdleCallback or setTimeout
 */
function yieldToEventLoop(useIdleCallback: boolean, delay: number): Promise<void> {
  return new Promise((resolve) => {
    if (useIdleCallback && typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => resolve(), { timeout: 50 });
    } else {
      setTimeout(resolve, delay);
    }
  });
}

/**
 * Async generator that processes paragraphs in chunks
 * Yields results after each chunk and allows event loop to run between chunks
 *
 * @example
 * ```typescript
 * const elements = [...]; // Array of XML elements
 * const token = createCancellationToken();
 *
 * for await (const chunk of processChunked(elements, {
 *   chunkSize: 50,
 *   processor: (el) => processElement(el),
 *   onProgress: (progress) => console.log(`${progress.percentComplete}% complete`),
 *   cancellationToken: token
 * })) {
 *   console.log(`Processed ${chunk.length} items`);
 * }
 * ```
 */
export async function* processChunked<T, R>(
  elements: T[],
  options: ChunkProcessorOptions<T, R>
): AsyncGenerator<R[], void, undefined> {
  const {
    chunkSize = 100,
    processor,
    onProgress,
    cancellationToken,
    useIdleCallback = true,
    delay = 0
  } = options;

  const totalCount = elements.length;
  const totalChunks = Math.ceil(totalCount / chunkSize);
  let processedCount = 0;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    // Check for cancellation before processing chunk
    if (cancellationToken?.isCancelled) {
      return;
    }

    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, totalCount);
    const chunk = elements.slice(start, end);

    // Process all elements in the current chunk
    const chunkResults: R[] = [];
    for (let i = 0; i < chunk.length; i++) {
      const globalIndex = start + i;
      const result = await processor(chunk[i], globalIndex);
      chunkResults.push(result);
    }

    processedCount += chunk.length;

    // Report progress
    if (onProgress) {
      const progress: ProcessingProgress = {
        processedCount,
        totalCount,
        currentChunk: chunkIndex + 1,
        totalChunks,
        percentComplete: Math.round((processedCount / totalCount) * 100)
      };
      onProgress(progress);
    }

    // Yield the chunk results
    yield chunkResults;

    // Yield to event loop before next chunk (unless this is the last chunk)
    if (chunkIndex < totalChunks - 1) {
      await yieldToEventLoop(useIdleCallback, delay);
    }
  }
}

/**
 * Processes paragraphs in chunks and collects all results
 * Returns when all chunks are processed or cancellation is requested
 *
 * @example
 * ```typescript
 * const result = await processChunkedComplete(elements, {
 *   chunkSize: 100,
 *   processor: (el) => transformElement(el),
 *   onProgress: (p) => updateProgressBar(p.percentComplete),
 *   cancellationToken: token
 * });
 *
 * if (result.completed) {
 *   console.log(`Processed all ${result.results.length} elements`);
 * } else {
 *   console.log(`Cancelled after processing ${result.processedCount} elements`);
 * }
 * ```
 */
export async function processChunkedComplete<T, R>(
  elements: T[],
  options: ChunkProcessorOptions<T, R>
): Promise<ChunkProcessorResult<R>> {
  const results: R[] = [];
  let processedCount = 0;
  let completed = false;

  try {
    for await (const chunkResults of processChunked(elements, options)) {
      results.push(...chunkResults);
      processedCount += chunkResults.length;

      // Check for cancellation
      if (options.cancellationToken?.isCancelled) {
        break;
      }
    }

    // If we processed everything, we completed successfully
    completed = processedCount === elements.length;
  } catch (error) {
    // On error, return what we have so far
    completed = false;
  }

  return {
    results,
    completed,
    processedCount
  };
}

/**
 * Callback-based chunk processor for compatibility with non-async code
 *
 * @example
 * ```typescript
 * processChunkedCallback(elements, {
 *   chunkSize: 50,
 *   processor: (el) => processElement(el),
 *   onProgress: (p) => console.log(`Progress: ${p.percentComplete}%`),
 *   onChunk: (chunk) => console.log(`Chunk ready: ${chunk.length} items`),
 *   onComplete: (result) => console.log(`Done! Processed ${result.processedCount}`),
 *   onError: (error) => console.error('Processing failed:', error)
 * });
 * ```
 */
export function processChunkedCallback<T, R>(
  elements: T[],
  options: ChunkProcessorOptions<T, R> & {
    onChunk?: (chunk: R[]) => void;
    onComplete?: (result: ChunkProcessorResult<R>) => void;
    onError?: (error: Error) => void;
  }
): void {
  const { onChunk, onComplete, onError, ...processorOptions } = options;

  (async () => {
    try {
      const results: R[] = [];
      let processedCount = 0;

      for await (const chunkResults of processChunked(elements, processorOptions)) {
        results.push(...chunkResults);
        processedCount += chunkResults.length;

        if (onChunk) {
          onChunk(chunkResults);
        }

        if (options.cancellationToken?.isCancelled) {
          break;
        }
      }

      const completed = processedCount === elements.length;

      if (onComplete) {
        onComplete({
          results,
          completed,
          processedCount
        });
      }
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  })();
}
