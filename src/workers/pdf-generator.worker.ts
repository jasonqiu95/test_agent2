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
  operationTimeoutId?: number;
}

// Initialize worker state
const state: WorkerState = {
  isInitialized: false,
  isProcessing: false,
  isCancelled: false,
  workerId: `pdf-worker-${Date.now()}`,
  operationTimeoutId: undefined,
};

/**
 * Configuration constants
 */
const OPERATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
const MIN_BOOK_TITLE_LENGTH = 1;
const MAX_BOOK_TITLE_LENGTH = 500;
const MAX_CHAPTERS = 10000;

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
    return { isValid: false, error: `Book title exceeds maximum length of ${MAX_BOOK_TITLE_LENGTH}` };
  }

  if (!Array.isArray(book.authors)) {
    return { isValid: false, error: 'Book authors must be an array' };
  }

  if (book.authors.length === 0) {
    return { isValid: false, error: 'Book must have at least one author' };
  }

  for (let i = 0; i < book.authors.length; i++) {
    const author = book.authors[i];
    if (!author || typeof author !== 'object') {
      return { isValid: false, error: `Author at index ${i} is invalid` };
    }
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

  if (book.chapters.length > MAX_CHAPTERS) {
    return { isValid: false, error: `Book has too many chapters (max: ${MAX_CHAPTERS})` };
  }

  for (let i = 0; i < book.chapters.length; i++) {
    const chapter = book.chapters[i];
    if (!chapter || typeof chapter !== 'object') {
      return { isValid: false, error: `Chapter at index ${i} is invalid`, chapterNumber: i };
    }
    if (!chapter.title || typeof chapter.title !== 'string') {
      return { isValid: false, error: `Chapter at index ${i} must have a title`, chapterNumber: i };
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

    if (image.buffer) {
      if (!(image.buffer instanceof ArrayBuffer)) {
        return {
          isValid: false,
          error: `Image "${image.id}" buffer must be an ArrayBuffer`,
          imageId: image.id
        };
      }

      if (image.buffer.byteLength === 0) {
        return {
          isValid: false,
          error: `Image "${image.id}" has empty buffer`,
          imageId: image.id
        };
      }

      if (image.buffer.byteLength > MAX_IMAGE_SIZE) {
        return {
          isValid: false,
          error: `Image "${image.id}" exceeds maximum size of ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
          imageId: image.id
        };
      }
    }

    if (image.url && typeof image.url !== 'string') {
      return {
        isValid: false,
        error: `Image "${image.id}" has invalid URL`,
        imageId: image.id
      };
    }

    if (image.mimeType && typeof image.mimeType !== 'string') {
      return {
        isValid: false,
        error: `Image "${image.id}" has invalid mimeType`,
        imageId: image.id
      };
    }

    // Validate dimensions if provided
    if (image.width !== undefined && (typeof image.width !== 'number' || image.width <= 0)) {
      return {
        isValid: false,
        error: `Image "${image.id}" has invalid width`,
        imageId: image.id
      };
    }

    if (image.height !== undefined && (typeof image.height !== 'number' || image.height <= 0)) {
      return {
        isValid: false,
        error: `Image "${image.id}" has invalid height`,
        imageId: image.id
      };
    }
  }

  return { isValid: true };
}

/**
 * Validate styles data
 */
function validateStyles(styles: any[]): { isValid: boolean; error?: string } {
  if (!Array.isArray(styles)) {
    return { isValid: false, error: 'Styles must be an array' };
  }

  for (let i = 0; i < styles.length; i++) {
    const style = styles[i];
    if (!style || typeof style !== 'object') {
      return { isValid: false, error: `Style at index ${i} is invalid` };
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

  if (options.pageSize && typeof options.pageSize !== 'string') {
    return { isValid: false, error: 'pageSize must be a string' };
  }

  if (options.margin && typeof options.margin !== 'string') {
    return { isValid: false, error: 'margin must be a string' };
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
      sendError(
        'OPERATION_TIMEOUT',
        `PDF generation timed out after ${OPERATION_TIMEOUT_MS / 1000} seconds`,
        { recoverable: false }
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
    throw new Error('PDF generation was cancelled');
  }
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

    // Set operation timeout
    setOperationTimeout();

    sendProgress(0, 'Initializing PDF generation...');

    // Validate message structure
    if (!message.data || typeof message.data !== 'object') {
      throw new Error('Invalid initialization data: missing or invalid data object');
    }

    const { book, styles, images, options } = message.data;

    // Validate book data
    sendProgress(5, 'Validating book data...');

    const bookValidation = validateBookData(book);
    if (!bookValidation.isValid) {
      const error: any = new Error(`Invalid book data: ${bookValidation.error}`);
      error.chapterNumber = (bookValidation as any).chapterNumber;
      throw error;
    }

    checkCancellation();

    // Validate styles
    sendProgress(8, 'Validating styles...');

    const stylesValidation = validateStyles(styles || []);
    if (!stylesValidation.isValid) {
      throw new Error(`Invalid styles: ${stylesValidation.error}`);
    }

    checkCancellation();

    // Validate images
    sendProgress(10, 'Validating images...');

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

    // Check for missing referenced images
    sendProgress(15, 'Checking image references...');

    const imageIds = new Set((images || []).map(img => img.id));
    const warnings: string[] = [];

    // Check chapters for image references
    for (let i = 0; i < book.chapters.length; i++) {
      const chapter = book.chapters[i];
      if (chapter.content) {
        const imageReferences = chapter.content.match(/!\[.*?\]\((.*?)\)/g) || [];
        for (const ref of imageReferences) {
          const imageId = ref.match(/!\[.*?\]\((.*?)\)/)?.[1];
          if (imageId && !imageIds.has(imageId)) {
            warnings.push(`Chapter ${i + 1} "${chapter.title}" references missing image: ${imageId}`);
          }
        }
      }
    }

    checkCancellation();

    // Check cover image if specified
    if (book.coverImage && !imageIds.has(book.coverImage)) {
      warnings.push(`Book references missing cover image: ${book.coverImage}`);
    }

    checkCancellation();

    // TODO: Implement actual PDF generation logic
    // This is a placeholder for the actual implementation

    sendProgress(20, 'Parsing book data...');
    await new Promise((resolve) => setTimeout(resolve, 100));
    checkCancellation();

    sendProgress(30, 'Processing chapters...', {
      currentChapter: 0,
      totalPages: book.chapters.length,
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    checkCancellation();

    sendProgress(50, 'Generating PDF...', {
      currentChapter: Math.floor(book.chapters.length / 2),
      totalPages: book.chapters.length,
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    checkCancellation();

    sendProgress(70, 'Embedding images...');
    await new Promise((resolve) => setTimeout(resolve, 100));
    checkCancellation();

    sendProgress(85, 'Applying styles...');
    await new Promise((resolve) => setTimeout(resolve, 100));
    checkCancellation();

    sendProgress(95, 'Finalizing PDF...');
    await new Promise((resolve) => setTimeout(resolve, 100));
    checkCancellation();

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
          processingTimeMs: Date.now() - startTime,
          warnings: warnings.length > 0 ? warnings : undefined,
        },
      })
    );
  } catch (error) {
    const serialized = serializeError(error);
    const errorCode = state.isCancelled ? 'GENERATION_CANCELLED' :
                     (error as any).chapterNumber !== undefined ? 'CHAPTER_ERROR' :
                     (error as any).imageId ? 'IMAGE_ERROR' :
                     serialized.name === 'TypeError' ? 'INVALID_DATA' :
                     serialized.name === 'RangeError' ? 'RESOURCE_LIMIT' :
                     serialized.name === 'ReferenceError' ? 'LIBRARY_ERROR' :
                     'GENERATION_ERROR';

    sendError(
      errorCode,
      `PDF generation failed: ${serialized.message}`,
      {
        details: serialized.stack,
        stack: serialized.stack,
        recoverable: state.isCancelled,
        chapterNumber: (error as any).chapterNumber,
        elementId: (error as any).imageId,
      }
    );
  } finally {
    clearOperationTimeout();
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
      sendError('INVALID_MESSAGE', `Unknown message type: ${message.type}`, {
        recoverable: false,
      });
    }
  } catch (error) {
    const serialized = serializeError(error);

    sendError('MESSAGE_HANDLER_ERROR', `Failed to handle message: ${serialized.message}`, {
      details: serialized.stack,
      stack: serialized.stack,
      recoverable: false,
    });
  }
}

/**
 * Global error handler for uncaught errors
 */
self.onerror = (event: ErrorEvent) => {
  const serialized = serializeError(event.error || event.message);
  const location = event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : 'unknown location';

  sendError('WORKER_ERROR', `Uncaught error in worker: ${serialized.message}`, {
    details: `Error at ${location}`,
    stack: serialized.stack,
    recoverable: false,
  });

  // Clear any ongoing operation
  clearOperationTimeout();
  state.isProcessing = false;
  state.isCancelled = false;

  // Prevent default error handling
  event.preventDefault();
  return true;
};

/**
 * Global handler for unhandled promise rejections
 */
self.onunhandledrejection = (event: PromiseRejectionEvent) => {
  const serialized = serializeError(event.reason);

  sendError('WORKER_UNHANDLED_REJECTION', `Unhandled promise rejection: ${serialized.message}`, {
    details: 'A promise was rejected but no error handler was attached',
    stack: serialized.stack,
    recoverable: false,
  });

  // Clear any ongoing operation
  clearOperationTimeout();
  state.isProcessing = false;
  state.isCancelled = false;

  // Prevent default error handling
  event.preventDefault();
};

/**
 * Message event listener - entry point for all messages from main thread
 */
self.onmessage = async (event: MessageEvent<MainToWorkerMessage>) => {
  try {
    const message = event.data;

    // Validate message structure
    if (!message || typeof message !== 'object' || !message.type) {
      sendError('INVALID_MESSAGE', 'Invalid message format: message must be an object with a type field', {
        recoverable: false,
      });
      return;
    }

    await routeMessage(message);
  } catch (error) {
    const serialized = serializeError(error);

    sendError('MESSAGE_ERROR', `Error processing message: ${serialized.message}`, {
      details: serialized.stack,
      stack: serialized.stack,
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
        capabilities: ['pdf-generation', 'progress-tracking', 'cancellation', 'validation'],
      })
    );
  } catch (error) {
    const serialized = serializeError(error);
    sendError('INITIALIZATION_ERROR', `Failed to initialize worker: ${serialized.message}`, {
      details: serialized.stack,
      stack: serialized.stack,
      recoverable: false,
    });
  }
}

// Initialize the worker on startup
initialize();
