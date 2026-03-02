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
  InitializeMessage,
} from './types';

/**
 * Worker state
 */
interface WorkerState {
  isProcessing: boolean;
  isCancelled: boolean;
  workerId: string;
  operationTimeoutId?: number;
}

// Initialize worker state
const state: WorkerState = {
  isProcessing: false,
  isCancelled: false,
  workerId: crypto.randomUUID(),
  operationTimeoutId: undefined,
};

/**
 * Configuration constants
 */
const OPERATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
const MIN_BOOK_TITLE_LENGTH = 1;
const MAX_BOOK_TITLE_LENGTH = 500;

/**
 * Post a message to the main thread
 */
function postMessageToMain(message: WorkerToMainMessage): void {
  self.postMessage(message);
}

/**
 * Serialize error information safely
 */
function serializeError(error: unknown): { message: string; stack?: string; name?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  if (error && typeof error === 'object') {
    return {
      message: String((error as any).message || error),
      stack: (error as any).stack,
      name: (error as any).name,
    };
  }

  return { message: 'Unknown error' };
}

/**
 * Validate book data structure
 */
function validateBookData(book: any): { isValid: boolean; error?: string } {
  if (!book || typeof book !== 'object') {
    return { isValid: false, error: 'Book data is missing or invalid' };
  }

  if (!book.title || typeof book.title !== 'string') {
    return { isValid: false, error: 'Book title is required and must be a string' };
  }

  if (book.title.length < MIN_BOOK_TITLE_LENGTH) {
    return { isValid: false, error: 'Book title is too short' };
  }

  if (book.title.length > MAX_BOOK_TITLE_LENGTH) {
    return { isValid: false, error: 'Book title is too long' };
  }

  if (!Array.isArray(book.authors)) {
    return { isValid: false, error: 'Book authors must be an array' };
  }

  if (book.authors.length === 0) {
    return { isValid: false, error: 'Book must have at least one author' };
  }

  for (let i = 0; i < book.authors.length; i++) {
    const author = book.authors[i];
    if (!author.name || typeof author.name !== 'string') {
      return { isValid: false, error: `Author at index ${i} must have a name` };
    }
  }

  if (!Array.isArray(book.chapters)) {
    return { isValid: false, error: 'Book chapters must be an array' };
  }

  if (book.chapters.length === 0) {
    return { isValid: false, error: 'Book must have at least one chapter' };
  }

  for (let i = 0; i < book.chapters.length; i++) {
    const chapter = book.chapters[i];
    if (!chapter || typeof chapter !== 'object') {
      return { isValid: false, error: `Chapter at index ${i} is invalid` };
    }
    if (!chapter.title || typeof chapter.title !== 'string') {
      return { isValid: false, error: `Chapter at index ${i} must have a title` };
    }
  }

  return { isValid: true };
}

/**
 * Validate image data
 */
function validateImageData(images: any[]): { isValid: boolean; error?: string; imageId?: string } {
  if (!Array.isArray(images)) {
    return { isValid: false, error: 'Images must be an array' };
  }

  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    if (!image || typeof image !== 'object') {
      return { isValid: false, error: `Image at index ${i} is invalid` };
    }

    if (!image.id || typeof image.id !== 'string') {
      return { isValid: false, error: `Image at index ${i} must have a valid ID`, imageId: image.id };
    }

    if (!image.url && !image.buffer) {
      return {
        isValid: false,
        error: `Image "${image.id}" must have either a URL or buffer`,
        imageId: image.id
      };
    }

    if (image.buffer && image.buffer.byteLength > MAX_IMAGE_SIZE) {
      return {
        isValid: false,
        error: `Image "${image.id}" exceeds maximum size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
        imageId: image.id
      };
    }

    if (image.url && typeof image.url !== 'string') {
      return {
        isValid: false,
        error: `Image "${image.id}" has invalid URL`,
        imageId: image.id
      };
    }
  }

  return { isValid: true };
}

/**
 * Validate initialization options
 */
function validateOptions(options: any): { isValid: boolean; error?: string } {
  if (!options) {
    return { isValid: true }; // Options are optional
  }

  if (typeof options !== 'object') {
    return { isValid: false, error: 'Options must be an object' };
  }

  if (options.format && !['epub', 'pdf', 'docx'].includes(options.format)) {
    return { isValid: false, error: `Invalid format: ${options.format}` };
  }

  if (options.quality && !['draft', 'standard', 'high'].includes(options.quality)) {
    return { isValid: false, error: `Invalid quality: ${options.quality}` };
  }

  return { isValid: true };
}

/**
 * Set operation timeout
 */
function setOperationTimeout(): void {
  clearOperationTimeout();

  state.operationTimeoutId = self.setTimeout(() => {
    if (state.isProcessing) {
      state.isCancelled = true;
      postMessageToMain(
        createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
          code: 'OPERATION_TIMEOUT',
          message: `EPUB generation timed out after ${OPERATION_TIMEOUT_MS / 1000} seconds`,
          recoverable: false,
        })
      );
      state.isProcessing = false;
    }
  }, OPERATION_TIMEOUT_MS);
}

/**
 * Clear operation timeout
 */
function clearOperationTimeout(): void {
  if (state.operationTimeoutId !== undefined) {
    self.clearTimeout(state.operationTimeoutId);
    state.operationTimeoutId = undefined;
  }
}

/**
 * Check if operation was cancelled
 */
function checkCancellation(): void {
  if (state.isCancelled) {
    throw new Error('Generation cancelled by user');
  }
}

/**
 * Handle initialization message
 */
async function handleInitialize(message: InitializeMessage): Promise<void> {
  const startTime = Date.now();

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
    // Set operation timeout
    setOperationTimeout();

    // Send initial progress
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 0,
        status: 'Initializing EPUB generation...',
      })
    );

    // Validate message structure
    if (!message.data || typeof message.data !== 'object') {
      throw new Error('Invalid initialization data: missing or invalid data object');
    }

    const { book, styles, images, options } = message.data;

    // Validate book data
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 5,
        status: 'Validating book data...',
      })
    );

    const bookValidation = validateBookData(book);
    if (!bookValidation.isValid) {
      throw new Error(`Invalid book data: ${bookValidation.error}`);
    }

    checkCancellation();

    // Validate images
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 10,
        status: 'Validating images...',
      })
    );

    const imageValidation = validateImageData(images || []);
    if (!imageValidation.isValid) {
      const error: any = new Error(`Invalid image data: ${imageValidation.error}`);
      error.imageId = imageValidation.imageId;
      throw error;
    }

    checkCancellation();

    // Validate options
    const optionsValidation = validateOptions(options);
    if (!optionsValidation.isValid) {
      throw new Error(`Invalid options: ${optionsValidation.error}`);
    }

    checkCancellation();

    // Validate styles
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 15,
        status: 'Validating styles...',
      })
    );

    if (styles && !Array.isArray(styles)) {
      throw new Error('Invalid styles: must be an array');
    }

    checkCancellation();

    // Check for missing referenced images
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 20,
        status: 'Checking image references...',
      })
    );

    const imageIds = new Set((images || []).map(img => img.id));
    const warnings: string[] = [];

    // Check chapters for image references
    for (const chapter of book.chapters) {
      if (chapter.content) {
        const imageReferences = chapter.content.match(/!\[.*?\]\((.*?)\)/g) || [];
        for (const ref of imageReferences) {
          const imageId = ref.match(/!\[.*?\]\((.*?)\)/)?.[1];
          if (imageId && !imageIds.has(imageId)) {
            warnings.push(`Chapter "${chapter.title}" references missing image: ${imageId}`);
          }
        }
      }
    }

    checkCancellation();

    // TODO: Implement actual EPUB generation logic
    // For now, this is a skeleton that demonstrates the message flow

    // Simulate some work with progress updates
    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 30,
        status: 'Generating EPUB structure...',
      })
    );

    await new Promise(resolve => setTimeout(resolve, 100));
    checkCancellation();

    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 50,
        status: 'Processing chapters...',
      })
    );

    await new Promise(resolve => setTimeout(resolve, 100));
    checkCancellation();

    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 70,
        status: 'Embedding images...',
      })
    );

    await new Promise(resolve => setTimeout(resolve, 100));
    checkCancellation();

    postMessageToMain(
      createWorkerMessage<ProgressMessage>(WorkerMessageType.PROGRESS, {
        percentage: 90,
        status: 'Finalizing EPUB...',
      })
    );

    await new Promise(resolve => setTimeout(resolve, 100));
    checkCancellation();

    // For now, return a dummy buffer
    // TODO: Replace with actual EPUB buffer
    const dummyBuffer = new ArrayBuffer(0);

    postMessageToMain(
      createWorkerMessage<CompleteMessage>(WorkerMessageType.COMPLETE, {
        buffer: dummyBuffer,
        fileName: `${book.title || 'output'}.epub`,
        fileSize: dummyBuffer.byteLength,
        mimeType: 'application/epub+zip',
        metadata: {
          processingTimeMs: Date.now() - startTime,
          warnings: warnings.length > 0 ? warnings : undefined,
        },
      })
    );
  } catch (error) {
    const serialized = serializeError(error);
    const errorCode = state.isCancelled ? 'GENERATION_CANCELLED' :
                     (error as any).imageId ? 'IMAGE_ERROR' :
                     serialized.name === 'TypeError' ? 'INVALID_DATA' :
                     serialized.name === 'RangeError' ? 'RESOURCE_LIMIT' :
                     'GENERATION_ERROR';

    postMessageToMain(
      createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
        code: errorCode,
        message: serialized.message,
        details: serialized.stack,
        stack: serialized.stack,
        recoverable: state.isCancelled,
        elementId: (error as any).imageId,
      })
    );
  } finally {
    clearOperationTimeout();
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
    // Validate message structure
    if (!message || typeof message !== 'object') {
      throw new Error('Invalid message: message must be an object');
    }

    if (!message.type) {
      throw new Error('Invalid message: missing type field');
    }

    if (typeof message.timestamp !== 'number') {
      throw new Error('Invalid message: missing or invalid timestamp');
    }

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
    const serialized = serializeError(error);
    postMessageToMain(
      createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
        code: 'ROUTING_ERROR',
        message: 'Error processing message',
        details: serialized.message,
        stack: serialized.stack,
        recoverable: false,
      })
    );
  }
}

/**
 * Global error boundary for the worker
 */
self.onerror = (event: ErrorEvent): void => {
  const serialized = serializeError(event.error || event.message);
  const location = event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : 'unknown location';

  postMessageToMain(
    createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
      code: 'WORKER_ERROR',
      message: serialized.message || 'Uncaught worker error',
      details: `Error at ${location}`,
      stack: serialized.stack,
      recoverable: false,
    })
  );

  // Clear any ongoing operation
  clearOperationTimeout();
  state.isProcessing = false;
  state.isCancelled = false;

  // Prevent default error handling
  event.preventDefault();
};

/**
 * Global unhandled promise rejection handler
 */
self.onunhandledrejection = (event: PromiseRejectionEvent): void => {
  const serialized = serializeError(event.reason);

  postMessageToMain(
    createWorkerMessage<ErrorMessage>(WorkerMessageType.ERROR, {
      code: 'UNHANDLED_REJECTION',
      message: serialized.message || 'Unhandled promise rejection',
      details: 'A promise was rejected but no error handler was attached',
      stack: serialized.stack,
      recoverable: false,
    })
  );

  // Clear any ongoing operation
  clearOperationTimeout();
  state.isProcessing = false;
  state.isCancelled = false;

  // Prevent default error handling
  event.preventDefault();
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
