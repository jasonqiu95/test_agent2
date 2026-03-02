/**
 * PDF Generator Web Worker
 * Handles PDF generation in a separate thread to avoid blocking the UI
 */

import {
  WorkerMessageType,
  MainToWorkerMessage,
  WorkerToMainMessage,
  InitializeMessage,
  CancelMessage,
  CancelledMessage,
  createWorkerMessage,
  isInitializeMessage,
  isCancelMessage,
} from './types';

/**
 * Worker state
 */
interface WorkerState {
  isInitialized: boolean;
  isProcessing: boolean;
  isCancelled: boolean;
  workerId: string;
  activeResources: Set<string>;
  partialFiles: string[];
  currentProgress: number;
}

// Initialize worker state
const state: WorkerState = {
  isInitialized: false,
  isProcessing: false,
  isCancelled: false,
  workerId: `pdf-worker-${Date.now()}`,
  activeResources: new Set(),
  partialFiles: [],
  currentProgress: 0,
};

/**
 * Post message to main thread with type safety
 */
function postMessage(message: WorkerToMainMessage): void {
  self.postMessage(message);
}

/**
 * Register a resource that needs cleanup
 */
function registerResource(resourceId: string): void {
  state.activeResources.add(resourceId);
}

/**
 * Unregister a resource after cleanup
 */
function unregisterResource(resourceId: string): void {
  state.activeResources.delete(resourceId);
}

/**
 * Clean up all active resources and partial files
 */
async function cleanupResources(): Promise<string[]> {
  const cleanedResources: string[] = [];

  // Clean up active resources
  for (const resourceId of state.activeResources) {
    try {
      // TODO: Implement actual resource cleanup based on resource type
      // This could include releasing PDF document objects, closing streams, etc.
      cleanedResources.push(resourceId);
    } catch (error) {
      console.error(`Failed to cleanup resource ${resourceId}:`, error);
    }
  }

  // Clean up partial files
  for (const filePath of state.partialFiles) {
    try {
      // TODO: Implement actual file cleanup
      // In a real implementation, this would delete temporary PDF fragments
      cleanedResources.push(filePath);
    } catch (error) {
      console.error(`Failed to cleanup partial file ${filePath}:`, error);
    }
  }

  state.activeResources.clear();
  state.partialFiles = [];

  return cleanedResources;
}

/**
 * Check if cancellation has been requested and throw if so
 * This should be called periodically during long operations
 */
function checkCancellation(): void {
  if (state.isCancelled) {
    throw new Error('CANCELLATION_REQUESTED');
  }
}

/**
 * Send progress update to main thread
 */
function sendProgress(
  percentage: number,
  status: string,
  details?: {
    currentChapter?: number;
    currentChapterTitle?: string;
    currentPage?: number;
    totalPages?: number;
    details?: string;
  }
): void {
  state.currentProgress = percentage;
  postMessage(
    createWorkerMessage(WorkerMessageType.PROGRESS, {
      percentage,
      status,
      ...details,
    })
  );
}

/**
 * Send error to main thread
 */
function sendError(
  code: string,
  message: string,
  details?: {
    details?: string;
    stack?: string;
    recoverable?: boolean;
    chapterNumber?: number;
    elementId?: string;
  }
): void {
  postMessage(
    createWorkerMessage(WorkerMessageType.ERROR, {
      code,
      message,
      ...details,
    })
  );
}

/**
 * Handle initialization message
 */
async function handleInitialize(message: InitializeMessage): Promise<void> {
  const startTime = Date.now();

  try {
    if (state.isProcessing) {
      sendError(
        'WORKER_BUSY',
        'Worker is already processing a task',
        { recoverable: false }
      );
      return;
    }

    state.isProcessing = true;
    state.isCancelled = false;
    state.currentProgress = 0;

    sendProgress(0, 'Initializing PDF generation...');

    // TODO: Implement actual PDF generation logic
    // This is a placeholder for the actual implementation
    const { book, styles, images, options } = message.data;

    // Register initial resources
    registerResource('pdf-document');
    registerResource('canvas-renderer');

    // Check cancellation before starting
    checkCancellation();

    sendProgress(10, 'Parsing book data...');

    // Placeholder: Simulate processing with cancellation checkpoints
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check for cancellation after async operations
    checkCancellation();

    // Simulate creating temporary resources
    const tempImageCache = 'temp-image-cache.tmp';
    state.partialFiles.push(tempImageCache);
    registerResource(tempImageCache);

    sendProgress(30, 'Processing chapters...');
    await new Promise((resolve) => setTimeout(resolve, 100));
    checkCancellation();

    sendProgress(50, 'Generating PDF...');

    // Simulate creating a partial PDF file
    const partialPdf = 'temp-partial-document.pdf';
    state.partialFiles.push(partialPdf);
    registerResource(partialPdf);

    await new Promise((resolve) => setTimeout(resolve, 100));
    checkCancellation();

    sendProgress(70, 'Rendering pages...');
    await new Promise((resolve) => setTimeout(resolve, 100));
    checkCancellation();

    sendProgress(90, 'Finalizing PDF...');
    await new Promise((resolve) => setTimeout(resolve, 100));
    checkCancellation();

    // Placeholder: Create a minimal PDF buffer
    // In real implementation, this would use a PDF library like pdfmake or jsPDF
    const buffer = new ArrayBuffer(0);

    // Clean up resources on successful completion
    await cleanupResources();

    sendProgress(100, 'PDF generation complete');

    postMessage(
      createWorkerMessage(WorkerMessageType.COMPLETE, {
        buffer,
        fileName: `${book.title || 'document'}.pdf`,
        fileSize: buffer.byteLength,
        mimeType: 'application/pdf',
        metadata: {
          processingTimeMs: Date.now() - startTime,
        },
      })
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Check if this is a cancellation
    if (errorMessage === 'CANCELLATION_REQUESTED') {
      // Clean up resources
      const cleanedResources = await cleanupResources();

      postMessage(
        createWorkerMessage(WorkerMessageType.CANCELLED, {
          reason: 'PDF generation cancelled by user',
          partialProgress: state.currentProgress,
          cleanedUp: true,
          resourcesReleased: cleanedResources,
        })
      );
    } else {
      // This is an actual error, attempt cleanup anyway
      try {
        await cleanupResources();
      } catch (cleanupError) {
        console.error('Failed to cleanup after error:', cleanupError);
      }

      sendError('GENERATION_ERROR', `PDF generation failed: ${errorMessage}`, {
        details: errorMessage,
        stack: errorStack,
        recoverable: false,
      });
    }
  } finally {
    state.isProcessing = false;
    state.isCancelled = false;
    state.currentProgress = 0;
  }
}

/**
 * Handle cancellation message
 */
function handleCancel(message: CancelMessage): void {
  if (!state.isProcessing) {
    // Not processing, nothing to cancel
    return;
  }

  // Set the cancellation flag
  state.isCancelled = true;

  // Send progress update to inform user that cancellation is in progress
  sendProgress(state.currentProgress, 'Cancelling PDF generation and cleaning up...', {
    details: message.data.reason,
  });
}

/**
 * Route incoming messages to appropriate handlers
 */
async function routeMessage(message: MainToWorkerMessage): Promise<void> {
  try {
    if (isInitializeMessage(message)) {
      await handleInitialize(message);
    } else if (isCancelMessage(message)) {
      handleCancel(message);
    } else {
      // Unknown message type
      sendError('INVALID_MESSAGE', `Unknown message type: ${message.type}`, {
        recoverable: false,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    sendError('MESSAGE_HANDLER_ERROR', `Failed to handle message: ${errorMessage}`, {
      details: errorMessage,
      stack: errorStack,
      recoverable: false,
    });
  }
}

/**
 * Global error handler for uncaught errors
 */
self.onerror = (event: ErrorEvent) => {
  sendError('WORKER_ERROR', `Uncaught error in worker: ${event.message}`, {
    details: event.message,
    stack: event.error?.stack,
    recoverable: false,
  });
  return true; // Prevent default error handling
};

/**
 * Global handler for unhandled promise rejections
 */
self.onunhandledrejection = (event: PromiseRejectionEvent) => {
  const errorMessage =
    event.reason instanceof Error ? event.reason.message : String(event.reason);
  const errorStack =
    event.reason instanceof Error ? event.reason.stack : undefined;

  sendError('WORKER_UNHANDLED_REJECTION', `Unhandled promise rejection: ${errorMessage}`, {
    details: errorMessage,
    stack: errorStack,
    recoverable: false,
  });
};

/**
 * Message event listener - entry point for all messages from main thread
 */
self.onmessage = async (event: MessageEvent<MainToWorkerMessage>) => {
  try {
    const message = event.data;

    // Validate message structure
    if (!message || typeof message !== 'object' || !message.type) {
      sendError('INVALID_MESSAGE', 'Invalid message format', {
        recoverable: false,
      });
      return;
    }

    await routeMessage(message);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    sendError('MESSAGE_ERROR', `Error processing message: ${errorMessage}`, {
      details: errorMessage,
      stack: errorStack,
      recoverable: false,
    });
  }
};

/**
 * Initialize worker and notify main thread
 */
function initialize(): void {
  try {
    state.isInitialized = true;

    // Send ready message to main thread
    postMessage(
      createWorkerMessage(WorkerMessageType.READY, {
        workerId: state.workerId,
        capabilities: ['pdf-generation', 'progress-tracking', 'cancellation'],
      })
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    sendError('INITIALIZATION_ERROR', `Failed to initialize worker: ${errorMessage}`, {
      recoverable: false,
    });
  }
}

// Initialize the worker on startup
initialize();
