/**
 * Transferable Object Utilities for Web Worker Communication
 *
 * Provides utilities for efficiently transferring data between the main thread
 * and web workers using transferable objects, which transfer ownership rather
 * than copying data.
 */

/**
 * Types that can be transferred (ownership transferred, not copied)
 */
export type TransferableType =
  | ArrayBuffer
  | MessagePort
  | ImageBitmap
  | OffscreenCanvas
  | ReadableStream
  | WritableStream
  | TransformStream;

/**
 * Result of preparing an object for transfer
 */
export interface PrepareForTransferResult<T = any> {
  /** The data to send (may be modified to use transferables) */
  data: T;
  /** Array of transferable objects to pass to postMessage */
  transferables: Transferable[];
  /** Performance metrics */
  metrics: {
    /** Number of transferable objects found */
    transferableCount: number;
    /** Total bytes in transferable objects */
    transferableBytes: number;
    /** Time taken to prepare (milliseconds) */
    prepareTimeMs: number;
  };
}

/**
 * Check if a value is an ArrayBuffer
 */
export function isArrayBuffer(value: any): value is ArrayBuffer {
  return value instanceof ArrayBuffer;
}

/**
 * Check if a value is a MessagePort
 */
export function isMessagePort(value: any): value is MessagePort {
  return typeof MessagePort !== 'undefined' && value instanceof MessagePort;
}

/**
 * Check if a value is an ImageBitmap
 */
export function isImageBitmap(value: any): value is ImageBitmap {
  return typeof ImageBitmap !== 'undefined' && value instanceof ImageBitmap;
}

/**
 * Check if a value is an OffscreenCanvas
 */
export function isOffscreenCanvas(value: any): value is OffscreenCanvas {
  return typeof OffscreenCanvas !== 'undefined' && value instanceof OffscreenCanvas;
}

/**
 * Check if a value is a ReadableStream
 */
export function isReadableStream(value: any): value is ReadableStream {
  return typeof ReadableStream !== 'undefined' && value instanceof ReadableStream;
}

/**
 * Check if a value is a WritableStream
 */
export function isWritableStream(value: any): value is WritableStream {
  return typeof WritableStream !== 'undefined' && value instanceof WritableStream;
}

/**
 * Check if a value is a TransformStream
 */
export function isTransformStream(value: any): value is TransformStream {
  return typeof TransformStream !== 'undefined' && value instanceof TransformStream;
}

/**
 * Check if a value is any type of transferable object
 */
export function isTransferable(value: any): value is Transferable {
  return (
    isArrayBuffer(value) ||
    isMessagePort(value) ||
    isImageBitmap(value) ||
    isOffscreenCanvas(value) ||
    isReadableStream(value) ||
    isWritableStream(value) ||
    isTransformStream(value)
  );
}

/**
 * Get the byte size of a transferable object
 */
export function getTransferableSize(value: Transferable): number {
  if (isArrayBuffer(value)) {
    return value.byteLength;
  }

  // For other transferable types, we can't easily determine size
  // Return 0 to indicate unknown/not applicable
  return 0;
}

/**
 * Extract all transferable objects from a data structure
 *
 * Recursively walks through objects and arrays to find all transferable objects.
 * Handles circular references and tracks visited objects.
 *
 * @param data - The data structure to extract transferables from
 * @param options - Configuration options
 * @returns Array of transferable objects found
 */
export function extractTransferables(
  data: any,
  options: {
    /** Maximum depth to traverse (prevents infinite recursion) */
    maxDepth?: number;
    /** Whether to include nested ArrayBuffers in typed arrays */
    includeTypedArrays?: boolean;
  } = {}
): Transferable[] {
  const { maxDepth = 50, includeTypedArrays = true } = options;
  const transferables: Transferable[] = [];
  const visited = new WeakSet<object>();

  function extract(value: any, depth: number): void {
    // Handle null/undefined
    if (value == null) {
      return;
    }

    // Handle primitives
    if (typeof value !== 'object') {
      return;
    }

    // Check depth limit
    // Allow processing at maxDepth but not beyond
    if (depth > maxDepth) {
      return;
    }

    // Check for circular references
    if (visited.has(value)) {
      return;
    }
    visited.add(value);

    // Check if the value itself is transferable
    if (isTransferable(value)) {
      transferables.push(value);
      return;
    }

    // Handle typed arrays (they contain an ArrayBuffer)
    if (ArrayBuffer.isView(value)) {
      const typedArray = value as ArrayBufferView;
      if (includeTypedArrays && typedArray.buffer && !visited.has(typedArray.buffer)) {
        transferables.push(typedArray.buffer);
        visited.add(typedArray.buffer);
      }
      return;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      for (const item of value) {
        extract(item, depth + 1);
      }
      return;
    }

    // Handle plain objects
    if (value.constructor === Object || value.constructor == null) {
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          extract(value[key], depth + 1);
        }
      }
      return;
    }

    // Handle objects with specific properties we care about
    // Check for common property names that might contain transferables
    const commonTransferableProps = ['buffer', 'data', 'arrayBuffer', 'stream'];
    for (const prop of commonTransferableProps) {
      if (prop in value) {
        extract(value[prop], depth + 1);
      }
    }
  }

  extract(data, 0);
  return transferables;
}

/**
 * Prepare an object for transfer by extracting transferables
 *
 * This function:
 * 1. Extracts all transferable objects from the data
 * 2. Returns both the data and the transferables array
 * 3. Provides performance metrics
 *
 * Usage:
 * ```typescript
 * const result = prepareForTransfer(message.data);
 * self.postMessage(message, result.transferables);
 * ```
 *
 * @param data - The data to prepare for transfer
 * @param options - Configuration options
 * @returns Prepared data with transferables and metrics
 */
export function prepareForTransfer<T = any>(
  data: T,
  options: {
    /** Maximum depth to traverse */
    maxDepth?: number;
    /** Whether to include typed array buffers */
    includeTypedArrays?: boolean;
    /** Whether to deduplicate transferables */
    deduplicate?: boolean;
  } = {}
): PrepareForTransferResult<T> {
  const startTime = performance.now();
  const { deduplicate = true, ...extractOptions } = options;

  let transferables = extractTransferables(data, extractOptions);

  // Deduplicate transferables if requested
  if (deduplicate && transferables.length > 0) {
    const seen = new Set<Transferable>();
    transferables = transferables.filter((t) => {
      if (seen.has(t)) {
        return false;
      }
      seen.add(t);
      return true;
    });
  }

  // Calculate total bytes
  const transferableBytes = transferables.reduce(
    (sum, t) => sum + getTransferableSize(t as Transferable),
    0
  );

  const prepareTimeMs = performance.now() - startTime;

  return {
    data,
    transferables,
    metrics: {
      transferableCount: transferables.length,
      transferableBytes,
      prepareTimeMs,
    },
  };
}

/**
 * Post a message with automatic transferable extraction
 *
 * Convenience wrapper around postMessage that automatically extracts
 * and transfers all transferable objects.
 *
 * @param target - The target to post to (Worker or self in worker context)
 * @param message - The message to send
 * @param options - Configuration options
 * @returns Performance metrics
 */
export function postMessageWithTransferables<T = any>(
  target: Worker | DedicatedWorkerGlobalScope | MessagePort,
  message: T,
  options?: {
    maxDepth?: number;
    includeTypedArrays?: boolean;
    deduplicate?: boolean;
  }
): PrepareForTransferResult<T>['metrics'] {
  const result = prepareForTransfer(message, options);

  // Post the message with transferables
  target.postMessage(result.data, result.transferables);

  return result.metrics;
}

/**
 * Performance comparison utility
 *
 * Measures the performance difference between copying and transferring data.
 * This is useful for testing and validation.
 *
 * @param data - Data to test
 * @param iterations - Number of iterations for each test
 * @returns Performance comparison results
 */
export function compareTransferPerformance(
  data: any,
  iterations: number = 10
): {
  withTransfer: { avgTimeMs: number; totalTimeMs: number };
  withoutTransfer: { avgTimeMs: number; totalTimeMs: number };
  improvement: number; // Percentage improvement
} {
  // Test with transfer
  const transferTimes: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    prepareForTransfer(data);
    const end = performance.now();
    transferTimes.push(end - start);
  }

  // Test without transfer (just measure extraction time overhead)
  const noTransferTimes: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    // Just access the data without preparing
    JSON.stringify(data);
    const end = performance.now();
    noTransferTimes.push(end - start);
  }

  const avgTransfer = transferTimes.reduce((a, b) => a + b, 0) / transferTimes.length;
  const avgNoTransfer = noTransferTimes.reduce((a, b) => a + b, 0) / noTransferTimes.length;
  const totalTransfer = transferTimes.reduce((a, b) => a + b, 0);
  const totalNoTransfer = noTransferTimes.reduce((a, b) => a + b, 0);

  const improvement = ((avgNoTransfer - avgTransfer) / avgNoTransfer) * 100;

  return {
    withTransfer: {
      avgTimeMs: avgTransfer,
      totalTimeMs: totalTransfer,
    },
    withoutTransfer: {
      avgTimeMs: avgNoTransfer,
      totalTimeMs: totalNoTransfer,
    },
    improvement,
  };
}

/**
 * Validate that transferables can be safely transferred
 *
 * Checks if transferables are in a valid state for transfer.
 * Once transferred, they become "neutered" and cannot be reused.
 *
 * @param transferables - Array of transferables to validate
 * @returns Validation result with any errors found
 */
export function validateTransferables(
  transferables: Transferable[]
): {
  valid: boolean;
  errors: string[];
  neuteredCount: number;
} {
  const errors: string[] = [];
  let neuteredCount = 0;

  for (let i = 0; i < transferables.length; i++) {
    const transferable = transferables[i];

    // Check if ArrayBuffer has been neutered (transferred)
    if (isArrayBuffer(transferable)) {
      if (transferable.byteLength === 0) {
        // This might be a legitimate empty buffer OR a neutered buffer
        // We can't definitively tell, so we'll note it but not error
        neuteredCount++;
      }
    }

    // Check for null/undefined
    if (transferable == null) {
      errors.push(`Transferable at index ${i} is null or undefined`);
    }

    // Check that it's actually transferable
    if (!isTransferable(transferable)) {
      errors.push(
        `Object at index ${i} is not a transferable type: ${typeof transferable}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    neuteredCount,
  };
}

/**
 * Create a deep clone while preserving transferables
 *
 * Creates a structured clone of the data while maintaining references
 * to transferable objects (not cloning them).
 *
 * Note: This is a manual implementation that preserves transferable references.
 * structuredClone() actually clones ArrayBuffers, so we don't use it here.
 *
 * @param data - Data to clone
 * @returns Cloned data
 */
export function cloneWithTransferables<T>(data: T): T {
  // Handle primitives and null/undefined
  if (data == null || typeof data !== 'object') {
    return data;
  }

  // Don't clone transferables - return as-is to preserve reference
  if (isTransferable(data)) {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => cloneWithTransferables(item)) as T;
  }

  // Handle plain objects
  if ((data as any).constructor === Object) {
    const cloned: any = {};
    for (const key in (data as any)) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        cloned[key] = cloneWithTransferables((data as any)[key]);
      }
    }
    return cloned as T;
  }

  // For other object types, return as-is
  return data;
}
