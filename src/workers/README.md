# Workers Documentation

This directory contains Web Worker implementations for background processing tasks, which run in separate threads to avoid blocking the UI.

## Workers

### PDF Generator Worker

For PDF generation documentation, see the dedicated PDF worker documentation.

### EPUB Generator Worker

This directory contains the Web Worker implementation for EPUB generation, which runs in a separate thread to avoid blocking the UI during book processing.

#### Files

- **`types.ts`**: Message protocol definitions for worker communication
- **`epub-generator.worker.ts`**: The Web Worker implementation with message routing and error handling
- **`epub-worker-client.ts`**: Client-side utility class for easy worker interaction from the main thread

## Architecture

### Worker Features

1. **Message Protocol**: Type-safe message passing between main thread and worker
2. **Message Routing**: Handles INITIALIZE and CANCEL messages
3. **Error Boundaries**: Global error handlers and promise rejection handling
4. **Progress Reporting**: Real-time progress updates during generation
5. **Cancellation Support**: Ability to cancel ongoing generation

### Message Types

- **INITIALIZE**: Start EPUB generation with book data
- **CANCEL**: Cancel ongoing generation
- **PROGRESS**: Progress updates from worker
- **ERROR**: Error notifications
- **COMPLETE**: Generation complete with result buffer
- **READY**: Worker is initialized and ready

## Usage Example

```typescript
import { EPUBWorkerClient } from '@/workers/epub-worker-client';

// Create and initialize the worker
const workerClient = new EPUBWorkerClient();

await workerClient.initialize({
  onReady: (workerId) => {
    console.log('Worker ready:', workerId);
  },
  onProgress: (data) => {
    console.log(`Progress: ${data.percentage}%`);
    console.log(`Status: ${data.status}`);
  },
  onComplete: (data) => {
    console.log('EPUB generated successfully!');
    // Save the buffer to file
    const blob = new Blob([data.buffer], { type: data.mimeType });
    // ... handle file saving
  },
  onError: (error) => {
    console.error('Generation error:', error.message);
  }
});

// Start generation
await workerClient.generateEPUB(book, styles, images, {
  format: 'epub',
  quality: 'standard',
  includeMetadata: true,
  includeToc: true,
});

// To cancel
workerClient.cancel('User requested cancellation');

// Clean up when done
workerClient.terminate();
```

## Configuration

### Vite Configuration

The `vite.config.ts` includes worker-specific configuration:

```typescript
worker: {
  format: 'es',
  plugins: () => [],
  rollupOptions: {
    output: {
      entryFileNames: 'workers/[name].js'
    }
  }
}
```

### TypeScript Configuration

The `tsconfig.json` includes the WebWorker library:

```json
{
  "compilerOptions": {
    "lib": ["ES2020", "DOM", "DOM.Iterable", "WebWorker"]
  }
}
```

## Implementation Status

### ✅ Completed

- Basic worker structure and lifecycle
- Message event listener
- Message routing based on protocol
- Error boundary (global error handlers)
- Worker registration/initialization
- TypeScript/Vite configuration for workers
- Client-side utility class
- Type-safe message protocol

### 🔄 TODO

- Implement actual EPUB generation logic (currently returns dummy buffer)
- Integrate with epub-gen-memory library
- Add support for PDF and DOCX formats
- Implement streaming/chunked processing for large books
- Add worker pool for parallel processing
- Implement resource management and cleanup

## Error Handling

The worker implements multiple layers of error handling:

1. **Try-catch blocks** in message handlers
2. **Global onerror handler** for uncaught errors
3. **onunhandledrejection handler** for promise rejections
4. **Routing errors** for malformed messages

All errors are reported to the main thread with detailed information including error code, message, stack trace, and recoverability status.

## Performance Considerations

- Worker runs in separate thread, keeping UI responsive
- Supports cancellation to prevent wasted computation
- Progress updates don't block processing
- Uses transferable objects (ArrayBuffer) for efficient data transfer
- Unique worker ID for debugging and monitoring
