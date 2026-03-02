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
}

// Initialize worker state
const state: WorkerState = {
  isInitialized: false,
  isProcessing: false,
  isCancelled: false,
  workerId: `pdf-worker-${Date.now()}`,
};

/**
 * Post message to main thread with type safety
 */
function postMessage(message: WorkerToMainMessage): void {
  self.postMessage(message);
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

    sendProgress(0, 'Initializing PDF generation...');

    // TODO: Implement actual PDF generation logic
    // This is a placeholder for the actual implementation
    const { book, styles, images, options } = message.data;

    sendProgress(10, 'Parsing book data...');

    // Placeholder: Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (state.isCancelled) {
      sendError('GENERATION_CANCELLED', 'PDF generation was cancelled', {
        recoverable: true,
      });
      return;
    }

    sendProgress(50, 'Generating PDF...');

    // Placeholder: More processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (state.isCancelled) {
      sendError('GENERATION_CANCELLED', 'PDF generation was cancelled', {
        recoverable: true,
      });
      return;
    }

    sendProgress(90, 'Finalizing PDF...');

    // Placeholder: Create a minimal PDF buffer
    // In real implementation, this would use a PDF library like pdfmake or jsPDF
    const buffer = new ArrayBuffer(0);

    sendProgress(100, 'PDF generation complete');

    postMessage(
      createWorkerMessage(WorkerMessageType.COMPLETE, {
        buffer,
        fileName: `${book.title || 'document'}.pdf`,
        fileSize: buffer.byteLength,
        mimeType: 'application/pdf',
        metadata: {
          processingTimeMs: Date.now() - message.timestamp,
        },
      })
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    sendError('GENERATION_ERROR', `PDF generation failed: ${errorMessage}`, {
      details: errorMessage,
      stack: errorStack,
      recoverable: false,
    });
  } finally {
    state.isProcessing = false;
  }
}

/**
 * Handle cancellation message
 */
function handleCancel(message: CancelMessage): void {
  state.isCancelled = true;
  sendProgress(0, 'Cancelling PDF generation...', {
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
