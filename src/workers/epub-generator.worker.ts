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
} from './types';

/**
 * Worker state
 */
interface WorkerState {
  isProcessing: boolean;
  isCancelled: boolean;
  workerId: string;
}

// Initialize worker state
const state: WorkerState = {
  isProcessing: false,
  isCancelled: false,
  workerId: crypto.randomUUID(),
};

/**
 * Post a message to the main thread
 */
function postMessageToMain(message: WorkerToMainMessage): void {
  self.postMessage(message);
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

  try {
    // Send initial progress
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 0,
        status: 'Initializing EPUB generation...',
      })
    );

    // TODO: Implement actual EPUB generation logic
    // For now, this is a skeleton that demonstrates the message flow

    // Simulate some work with progress updates
    for (let i = 0; i <= 100; i += 10) {
      if (state.isCancelled) {
        throw new Error('Generation cancelled by user');
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100));

      postMessageToMain(
        createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
          percentage: i,
          status: i < 100 ? `Processing... ${i}%` : 'Finalizing...',
        })
      );
    }

    // For now, return a dummy buffer
    // TODO: Replace with actual EPUB buffer
    const dummyBuffer = new ArrayBuffer(0);

    postMessageToMain(
      createWorkerMessage<CompleteMessage>(WorkerMessageType.COMPLETE, {
        buffer: dummyBuffer,
        fileName: 'output.epub',
        fileSize: dummyBuffer.byteLength,
        mimeType: 'application/epub+zip',
        metadata: {
          processingTimeMs: Date.now() - message.timestamp,
        },
      })
    );
  } catch (error) {
    const err = error as Error;
    postMessageToMain(
      createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
        code: 'GENERATION_ERROR',
        message: err.message || 'Unknown error occurred',
        details: err.stack,
        recoverable: false,
      })
    );
  } finally {
    state.isProcessing = false;
    state.isCancelled = false;
  }
}

/**
 * Handle cancellation message
 */
function handleCancel(message: Extract<MainToWorkerMessage, { type: WorkerMessageType.CANCEL }>): void {
  if (!state.isProcessing) {
    return;
  }

  state.isCancelled = true;

  postMessageToMain(
    createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
      code: 'CANCELLED',
      message: message.data.reason || 'Generation cancelled',
      recoverable: true,
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
