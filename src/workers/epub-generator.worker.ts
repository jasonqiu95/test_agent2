/**
 * EPUB Generator Web Worker
 *
 * Handles EPUB generation in a separate thread to avoid blocking the UI.
 * Communicates with the main thread using a defined message protocol.
 */

import {
  WorkerMessageType,
  MainToWorkerMessage,
  WorkerToMainMessage,
  isInitializeMessage,
  isCancelMessage,
  createWorkerMessage,
  ReadyMessage,
  ProgressMessage,
  ErrorMessage,
  CompleteMessage,
  CancelledMessage,
} from './types';

/**
 * Worker state
 */
interface WorkerState {
  isProcessing: boolean;
  isCancelled: boolean;
  workerId: string;
  activeResources: Set<string>;
  partialFiles: string[];
  currentProgress: number;
}

// Initialize worker state
const state: WorkerState = {
  isProcessing: false,
  isCancelled: false,
  workerId: crypto.randomUUID(),
  activeResources: new Set(),
  partialFiles: [],
  currentProgress: 0,
};

/**
 * Post a message to the main thread
 */
function postMessageToMain(message: WorkerToMainMessage): void {
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
      // This could include closing file handles, releasing memory buffers, etc.
      cleanedResources.push(resourceId);
    } catch (error) {
      console.error(`Failed to cleanup resource ${resourceId}:`, error);
    }
  }

  // Clean up partial files
  for (const filePath of state.partialFiles) {
    try {
      // TODO: Implement actual file cleanup
      // In a real implementation, this would delete temporary files
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
 * Handle initialization message
 */
async function handleInitialize(message: Extract<MainToWorkerMessage, { type: WorkerMessageType.INITIALIZE }>): Promise<void> {
  if (state.isProcessing) {
    postMessageToMain(
      createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
        code: 'WORKER_BUSY',
        message: 'Worker is already processing a task',
        recoverable: false,
      })
    );
    return;
  }

  state.isProcessing = true;
  state.isCancelled = false;
  state.currentProgress = 0;

  const startTime = Date.now();

  try {
    // Send initial progress
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 0,
        status: 'Initializing EPUB generation...',
      })
    );

    // Register initial resources
    registerResource('epub-builder');
    registerResource('content-processor');

    // Check cancellation before starting
    checkCancellation();

    // TODO: Implement actual EPUB generation logic
    // For now, this is a skeleton that demonstrates the message flow

    // Simulate some work with progress updates and frequent cancellation checks
    for (let i = 0; i <= 100; i += 10) {
      // Check for cancellation at the start of each iteration
      checkCancellation();

      state.currentProgress = i;

      // Simulate processing time with periodic cancellation checks
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check again after async operation
      checkCancellation();

      postMessageToMain(
        createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
          percentage: i,
          status: i < 100 ? `Processing... ${i}%` : 'Finalizing...',
        })
      );

      // For demonstration: simulate creating temporary files at certain points
      if (i === 30) {
        const tempFile = `temp-chapter-${i}.tmp`;
        state.partialFiles.push(tempFile);
        registerResource(tempFile);
      }
      if (i === 60) {
        const tempFile = `temp-images-${i}.tmp`;
        state.partialFiles.push(tempFile);
        registerResource(tempFile);
      }
    }

    // Final cancellation check before completing
    checkCancellation();

    // For now, return a dummy buffer
    // TODO: Replace with actual EPUB buffer
    const dummyBuffer = new ArrayBuffer(0);

    // Clean up resources on successful completion
    await cleanupResources();

    postMessageToMain(
      createWorkerMessage<CompleteMessage>(WorkerMessageType.COMPLETE, {
        buffer: dummyBuffer,
        fileName: 'output.epub',
        fileSize: dummyBuffer.byteLength,
        mimeType: 'application/epub+zip',
        metadata: {
          processingTimeMs: Date.now() - startTime,
        },
      })
    );
  } catch (error) {
    const err = error as Error;

    // Check if this is a cancellation
    if (err.message === 'CANCELLATION_REQUESTED') {
      // Clean up resources
      const cleanedResources = await cleanupResources();

      postMessageToMain(
        createWorkerMessage<CancelledMessage>(WorkerMessageType.CANCELLED, {
          reason: 'Generation cancelled by user',
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

      postMessageToMain(
        createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
          code: 'GENERATION_ERROR',
          message: err.message || 'Unknown error occurred',
          details: err.stack,
          recoverable: false,
        })
      );
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
function handleCancel(message: Extract<MainToWorkerMessage, { type: WorkerMessageType.CANCEL }>): void {
  if (!state.isProcessing) {
    // Not processing, nothing to cancel
    return;
  }

  // Set the cancellation flag
  state.isCancelled = true;

  // Send progress update to inform user that cancellation is in progress
  postMessageToMain(
    createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
      percentage: state.currentProgress,
      status: 'Cancelling generation and cleaning up...',
      details: message.data.reason,
    })
  );
}

/**
 * Route incoming messages to appropriate handlers
 */
async function routeMessage(event: MessageEvent<MainToWorkerMessage>): Promise<void> {
  const message = event.data;

  try {
    if (isInitializeMessage(message)) {
      await handleInitialize(message);
    } else if (isCancelMessage(message)) {
      handleCancel(message);
    } else {
      // Unknown message type
      postMessageToMain(
        createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
          code: 'UNKNOWN_MESSAGE_TYPE',
          message: `Unknown message type: ${(message as any).type}`,
          recoverable: false,
        })
      );
    }
  } catch (error) {
    // Catch any unhandled errors in message routing
    const err = error as Error;
    postMessageToMain(
      createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
        code: 'ROUTING_ERROR',
        message: 'Error processing message',
        details: err.message,
        stack: err.stack,
        recoverable: false,
      })
    );
  }
}

/**
 * Global error boundary for the worker
 */
self.onerror = (event: ErrorEvent): void => {
  postMessageToMain(
    createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
      code: 'WORKER_ERROR',
      message: event.message || 'Worker error',
      details: `${event.filename}:${event.lineno}:${event.colno}`,
      stack: event.error?.stack,
      recoverable: false,
    })
  );
};

/**
 * Global unhandled promise rejection handler
 */
self.onunhandledrejection = (event: PromiseRejectionEvent): void => {
  const error = event.reason as Error;
  postMessageToMain(
    createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
      code: 'UNHANDLED_REJECTION',
      message: error?.message || 'Unhandled promise rejection',
      details: error?.stack,
      recoverable: false,
    })
  );
};

/**
 * Main message event listener
 */
self.addEventListener('message', (event: MessageEvent<MainToWorkerMessage>) => {
  routeMessage(event);
});

/**
 * Send ready message when worker is initialized
 */
postMessageToMain(
  createWorkerMessage<ReadyMessage>(WorkerMessageType.READY, {
    workerId: state.workerId,
    capabilities: ['epub'],
  })
);

// Export empty object to make this a module
export {};
