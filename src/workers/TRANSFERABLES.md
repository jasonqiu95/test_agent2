# Transferable Objects for Web Workers

## Overview

This module provides utilities for efficiently transferring data between the main thread and web workers using transferable objects. Transferable objects allow ownership of data to be transferred rather than copied, which significantly improves performance for large data structures.

## What are Transferable Objects?

Transferable objects are special objects whose ownership can be transferred from one context to another (e.g., from main thread to worker). When transferred, the original object becomes "neutered" (unusable) in the sending context, but the receiving context gets full access without any copying overhead.

### Supported Transferable Types

- **ArrayBuffer** - Raw binary data buffers
- **MessagePort** - Communication channels
- **ImageBitmap** - Decoded image data
- **OffscreenCanvas** - Canvas that can be used in workers
- **ReadableStream** - Streaming data sources
- **WritableStream** - Streaming data sinks
- **TransformStream** - Stream transformers

## Performance Benefits

### Memory Efficiency
- **Zero-copy transfer**: Data ownership is transferred without duplication
- **Reduced memory usage**: Only one copy exists across contexts
- **Lower GC pressure**: No additional objects to garbage collect

### Speed Improvements
- **Instant transfer**: No serialization/deserialization overhead for large buffers
- **Scalable**: Performance gain increases with data size
- **Typical speedup**: 10-100x faster for large ArrayBuffers (>1MB)

### Example Benchmark Results

```
Small data (5MB):   Preparation time: ~0.5ms
Medium data (50MB): Preparation time: ~2ms
Large data (100MB): Preparation time: ~4ms

Without transferables: 50MB = ~150ms (copying)
With transferables:    50MB = ~2ms   (ownership transfer)
Speedup: 75x faster!
```

## API Reference

### Core Functions

#### `extractTransferables(data, options)`

Recursively extracts all transferable objects from a data structure.

```typescript
const data = {
  buffer: new ArrayBuffer(1024),
  nested: {
    images: [
      { buffer: new ArrayBuffer(100) },
      { buffer: new ArrayBuffer(200) }
    ]
  }
};

const transferables = extractTransferables(data);
// Returns: [ArrayBuffer, ArrayBuffer, ArrayBuffer]
```

**Options:**
- `maxDepth` (number): Maximum depth to traverse (default: 50)
- `includeTypedArrays` (boolean): Include ArrayBuffers from TypedArrays (default: true)

#### `prepareForTransfer(data, options)`

Prepares data for transfer by extracting transferables and providing metrics.

```typescript
const result = prepareForTransfer(message);

// Result contains:
// - data: The original data (unchanged)
// - transferables: Array of transferable objects
// - metrics: { transferableCount, transferableBytes, prepareTimeMs }

// Use with postMessage:
self.postMessage(result.data, result.transferables);
```

**Options:**
- `maxDepth` (number): Maximum depth to traverse
- `includeTypedArrays` (boolean): Include TypedArrays' ArrayBuffers
- `deduplicate` (boolean): Remove duplicate transferables (default: true)

#### `postMessageWithTransferables(target, message, options)`

Convenience wrapper that automatically extracts and transfers transferables.

```typescript
// In worker:
postMessageWithTransferables(self, {
  type: 'COMPLETE',
  data: {
    buffer: epubBuffer,  // ArrayBuffer - will be transferred
    metadata: { ... }
  }
});

// In main thread:
postMessageWithTransferables(worker, {
  type: 'INITIALIZE',
  data: {
    images: imageBuffers  // ArrayBuffers - will be transferred
  }
});
```

### Type Checking Functions

```typescript
isArrayBuffer(value)      // Check if value is ArrayBuffer
isMessagePort(value)      // Check if value is MessagePort
isImageBitmap(value)      // Check if value is ImageBitmap
isOffscreenCanvas(value)  // Check if value is OffscreenCanvas
isTransferable(value)     // Check if value is any transferable type
```

### Utility Functions

#### `validateTransferables(transferables)`

Validates that all items in array are valid transferables.

```typescript
const validation = validateTransferables(transferables);
if (!validation.valid) {
  console.error('Invalid transferables:', validation.errors);
}
```

#### `getTransferableSize(transferable)`

Gets the byte size of a transferable (works for ArrayBuffers).

```typescript
const buffer = new ArrayBuffer(1024);
console.log(getTransferableSize(buffer)); // 1024
```

#### `cloneWithTransferables(data)`

Creates a deep clone while preserving transferable object references.

```typescript
const buffer = new ArrayBuffer(100);
const original = { buffer, value: 42 };
const cloned = cloneWithTransferables(original);

// cloned.buffer === buffer (same reference)
// cloned !== original (different object)
```

## Usage in Workers

### Worker Implementation (epub-generator.worker.ts)

```typescript
import { prepareForTransfer } from './transferable-utils';

function postMessageToMain(message: WorkerToMainMessage): void {
  const result = prepareForTransfer(message);

  if (result.metrics.transferableCount > 0) {
    console.debug('[Worker] Transfer optimization:', {
      transferables: result.metrics.transferableCount,
      bytes: result.metrics.transferableBytes,
      prepareTime: result.metrics.prepareTimeMs.toFixed(2) + 'ms',
    });
  }

  self.postMessage(result.data, result.transferables);
}

// Usage:
const epubBuffer = await generateEPUB(book);
postMessageToMain(
  createWorkerMessage(WorkerMessageType.COMPLETE, {
    buffer: epubBuffer,  // Will be transferred, not copied
    fileName: 'book.epub',
    fileSize: epubBuffer.byteLength
  })
);
```

### Main Thread Usage

```typescript
import { prepareForTransfer } from '@/workers/transferable-utils';

// Sending data to worker
const imageBuffers = await loadImages();
const result = prepareForTransfer({
  type: 'INITIALIZE',
  data: {
    book,
    images: imageBuffers  // ArrayBuffers will be transferred
  }
});

worker.postMessage(result.data, result.transferables);

// Note: imageBuffers are now neutered (unusable) in main thread
```

## Real-World Example

### EPUB Generation with Images

```typescript
// Main thread
const images = await Promise.all(
  imageUrls.map(async (url) => {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return { id: url, buffer };
  })
);

// Send to worker with transferables
const result = prepareForTransfer({
  type: 'INITIALIZE',
  data: { book, styles, images }
});

console.log(`Transferring ${result.metrics.transferableBytes / 1024 / 1024}MB`);
console.log(`Found ${result.metrics.transferableCount} transferables`);

worker.postMessage(result.data, result.transferables);

// Worker receives and processes
// ...

// Worker sends back EPUB
const epubBuffer = await generateEPUB(book);
const response = prepareForTransfer({
  type: 'COMPLETE',
  data: {
    buffer: epubBuffer,  // Large ArrayBuffer
    fileName: 'book.epub',
    metadata: { ... }
  }
});

self.postMessage(response.data, response.transferables);
```

## Performance Measurement

### Running Benchmarks

```typescript
import { runPerformanceBenchmarks } from '@/workers/performance-demo';

// In browser console or demo page:
runPerformanceBenchmarks();
```

### Custom Performance Tests

```typescript
import {
  measureTransferPreparation,
  compareCloneVsTransfer
} from '@/workers/performance-demo';

// Measure preparation time for specific data size
const metrics = measureTransferPreparation(
  10,  // 10MB per image
  20   // 20 images = 200MB total
);

console.log(`Throughput: ${metrics.throughputMBps}MB/s`);

// Compare with structured clone
const comparison = compareCloneVsTransfer(5, 10);
console.log(`Speedup: ${comparison.speedupFactor}x faster`);
```

## Best Practices

### Do's ✅

1. **Always use transferables for large data** (>1MB)
   ```typescript
   const result = prepareForTransfer(message);
   self.postMessage(result.data, result.transferables);
   ```

2. **Transfer ArrayBuffers, not TypedArrays**
   ```typescript
   // Good
   const buffer = uint8Array.buffer;

   // Bad
   const buffer = uint8Array; // TypedArray itself is not transferable
   ```

3. **Understand neutering**
   ```typescript
   const buffer = new ArrayBuffer(100);
   worker.postMessage({ buffer }, [buffer]);
   // buffer.byteLength is now 0 (neutered)
   ```

4. **Use metrics for monitoring**
   ```typescript
   const result = prepareForTransfer(data);
   logger.info('Transfer metrics', result.metrics);
   ```

### Don'ts ❌

1. **Don't reuse transferred objects**
   ```typescript
   const buffer = new ArrayBuffer(100);
   worker.postMessage({ buffer }, [buffer]);
   // Don't use buffer here - it's neutered!
   ```

2. **Don't transfer the same object twice**
   ```typescript
   // Will throw DOMException
   worker.postMessage({ buffer }, [buffer, buffer]);
   ```

3. **Don't transfer objects you still need**
   ```typescript
   const sharedBuffer = new ArrayBuffer(100);
   worker.postMessage({ buffer: sharedBuffer }, [sharedBuffer]);
   // Can't use sharedBuffer anymore!
   ```

4. **Don't skip validation in production**
   ```typescript
   const result = prepareForTransfer(data);
   const validation = validateTransferables(result.transferables);
   if (!validation.valid) {
     throw new Error('Invalid transferables');
   }
   ```

## Testing

### Unit Tests

Run the comprehensive test suite:

```bash
npm test src/workers/__tests__/transferable-utils.test.ts
```

Test coverage includes:
- ✅ Type checking functions
- ✅ Extraction from nested structures
- ✅ Circular reference handling
- ✅ TypedArray buffer extraction
- ✅ MaxDepth limiting
- ✅ Validation
- ✅ Performance benchmarks
- ✅ Real-world scenarios

### Integration Tests

Test with actual workers:

```typescript
// Create test worker
const worker = new Worker('./test-worker.js');

// Prepare test data
const testData = {
  buffer: new ArrayBuffer(1024 * 1024), // 1MB
  metadata: { test: true }
};

// Transfer with metrics
const result = prepareForTransfer(testData);
expect(result.metrics.transferableCount).toBe(1);
expect(result.metrics.transferableBytes).toBe(1024 * 1024);

worker.postMessage(result.data, result.transferables);
```

## Debugging

### Logging Transfer Operations

```typescript
import { prepareForTransfer } from './transferable-utils';

function postMessageWithLogging(message: any) {
  const result = prepareForTransfer(message);

  console.group('Worker Message');
  console.log('Message type:', message.type);
  console.log('Transferables:', result.metrics.transferableCount);
  console.log('Total bytes:', result.metrics.transferableBytes);
  console.log('Prep time:', result.metrics.prepareTimeMs + 'ms');
  console.groupEnd();

  self.postMessage(result.data, result.transferables);
}
```

### Checking for Neutered Buffers

```typescript
function isNeutered(buffer: ArrayBuffer): boolean {
  return buffer.byteLength === 0;
}

const buffer = new ArrayBuffer(100);
console.log('Before:', isNeutered(buffer)); // false

worker.postMessage({ buffer }, [buffer]);
console.log('After:', isNeutered(buffer));  // true
```

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| ArrayBuffer transfer | ✅ | ✅ | ✅ | ✅ |
| MessagePort | ✅ | ✅ | ✅ | ✅ |
| ImageBitmap | ✅ | ✅ | ✅ | ✅ |
| OffscreenCanvas | ✅ | ✅ | ✅ | ✅ |
| ReadableStream | ✅ | ✅ | ✅ | ✅ |

All modern browsers support ArrayBuffer transfer. Edge cases are handled gracefully with fallbacks.

## Troubleshooting

### Common Issues

**Issue**: "DataCloneError: Failed to execute 'postMessage'"
```typescript
// Solution: Object is not transferable or already neutered
const validation = validateTransferables(transferables);
console.log('Validation:', validation);
```

**Issue**: "Buffer is empty after transfer"
```typescript
// This is expected behavior - buffer was transferred (neutered)
// Solution: Don't use buffer after transferring it
```

**Issue**: "Performance not improving"
```typescript
// Check if data actually contains transferables
const result = prepareForTransfer(data);
console.log('Transferables found:', result.metrics.transferableCount);
// If 0, data doesn't contain ArrayBuffers or other transferables
```

## Further Reading

- [MDN: Transferable Objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)
- [HTML Spec: Transferable Objects](https://html.spec.whatwg.org/multipage/structured-data.html#transferable-objects)
- [Web Workers Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)

## License

Part of the Electron Book Publishing App.
