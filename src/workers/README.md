# PDF Generator Worker

This directory contains the Web Worker implementation for PDF generation, which runs in a separate thread to avoid blocking the UI during PDF processing.

## Files

- **pdf-generator.worker.ts** - The main worker implementation with message handling and error boundaries
- **types.ts** - TypeScript definitions for worker message protocol
- **index.ts** - Worker manager and utilities for easy integration

## Architecture

### Worker Structure

The worker implements a message-based protocol with the following components:

1. **Message Event Listener** - Entry point for all messages from the main thread
2. **Message Router** - Routes messages to appropriate handlers based on type
3. **Error Boundary** - Global error handlers for uncaught errors and unhandled rejections
4. **State Management** - Tracks worker state (initialized, processing, cancelled)

### Message Types

- `INITIALIZE` - Start PDF generation with book data
- `CANCEL` - Cancel the current operation
- `READY` - Worker is initialized (sent to main thread)
- `PROGRESS` - Progress update (sent to main thread)
- `ERROR` - Error occurred (sent to main thread)
- `COMPLETE` - Generation complete with PDF buffer (sent to main thread)

## Usage

### Basic Example

```typescript
import { createPDFWorker } from './workers';
import { Book } from './types/book';
import { BookStyle } from './types/style';

// Create worker with event handlers
const pdfWorker = createPDFWorker({
  onReady: (data) => {
    console.log('Worker ready:', data.workerId);
  },
  onProgress: (data) => {
    console.log(`Progress: ${data.percentage}%`, data.status);
  },
  onError: (data) => {
    console.error('Error:', data.message);
  },
  onComplete: (data) => {
    console.log('PDF generated:', data.fileName);
    // Download or save the PDF buffer
    const blob = new Blob([data.buffer], { type: data.mimeType });
    // ... handle the blob
  }
});

// Wait for worker to be ready
await pdfWorker.waitForReady();

// Generate PDF
const book: Book = { /* book data */ };
const styles: BookStyle[] = [ /* styles */ ];

await pdfWorker.generatePDF(book, styles, [], {
  format: 'pdf',
  quality: 'standard',
  includeMetadata: true,
  includeToc: true
});

// Cancel if needed
// pdfWorker.cancel('User cancelled');

// Clean up when done
// pdfWorker.terminate();
```

### Advanced Usage with React

```typescript
import { useEffect, useRef, useState } from 'react';
import { createPDFWorker, PDFWorkerManager } from './workers';

function PDFGenerator() {
  const workerRef = useRef<PDFWorkerManager | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Initialize worker
    workerRef.current = createPDFWorker({
      onProgress: (data) => {
        setProgress(data.percentage);
        setStatus(data.status);
      },
      onError: (data) => {
        console.error('PDF generation error:', data);
      },
      onComplete: (data) => {
        console.log('PDF complete:', data);
        // Handle completion
      }
    });

    // Cleanup on unmount
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleGenerate = async () => {
    if (workerRef.current) {
      await workerRef.current.generatePDF(book, styles);
    }
  };

  const handleCancel = () => {
    workerRef.current?.cancel('User cancelled');
  };

  return (
    <div>
      <button onClick={handleGenerate}>Generate PDF</button>
      <button onClick={handleCancel}>Cancel</button>
      <div>Progress: {progress}%</div>
      <div>Status: {status}</div>
    </div>
  );
}
```

## Configuration

### Vite Configuration

The `vite.config.ts` includes worker support:

```typescript
{
  worker: {
    format: 'es',
    plugins: () => []
  }
}
```

### TypeScript Configuration

The worker uses standard TypeScript configuration from `tsconfig.json` with:
- Target: ES2020
- Module: ESNext
- Lib: ES2020, DOM, DOM.Iterable

## Error Handling

The worker includes comprehensive error handling:

1. **Global Error Handler** (`self.onerror`) - Catches uncaught errors
2. **Unhandled Rejection Handler** (`self.onunhandledrejection`) - Catches promise rejections
3. **Message Handler Try-Catch** - Wraps all message processing
4. **Typed Error Messages** - All errors include code, message, and optional details

### Error Codes

- `WORKER_BUSY` - Worker is already processing a task
- `GENERATION_CANCELLED` - Operation was cancelled by user
- `GENERATION_ERROR` - Error during PDF generation
- `INVALID_MESSAGE` - Invalid message format or type
- `MESSAGE_HANDLER_ERROR` - Error in message handler
- `WORKER_ERROR` - Uncaught error in worker
- `WORKER_UNHANDLED_REJECTION` - Unhandled promise rejection
- `MESSAGE_ERROR` - Error processing message
- `INITIALIZATION_ERROR` - Error initializing worker

## Future Enhancements

The current implementation is a skeleton. Future additions should include:

1. **PDF Generation Logic** - Integration with PDF libraries (pdfmake, jsPDF, etc.)
2. **Chapter Processing** - Iterate through chapters and generate pages
3. **Image Handling** - Process and embed images in PDF
4. **Style Application** - Apply book styles to PDF output
5. **Table of Contents** - Generate TOC from chapter structure
6. **Metadata** - Embed book metadata in PDF
7. **Progress Tracking** - More granular progress updates
8. **Memory Management** - Handle large books efficiently
9. **Caching** - Cache intermediate results for better performance

## Testing

To test the worker:

1. Install dependencies: `npm install`
2. Run type check: `npm run type-check`
3. Add unit tests for worker message handling
4. Add integration tests for PDF generation

## Notes

- Workers run in a separate thread and cannot access the DOM
- All data passed between main thread and worker must be serializable
- Use `ArrayBuffer` or `Transferable` objects for large data to avoid copying
- Worker termination should be handled properly to avoid memory leaks
