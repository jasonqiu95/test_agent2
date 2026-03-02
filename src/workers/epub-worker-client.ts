/**
 * EPUB Worker Client
 *
 * Provides a convenient interface for interacting with the EPUB generator worker
 * from the main thread.
 */

import {
  WorkerMessageType,
  WorkerToMainMessage,
  InitializeMessage,
  CancelMessage,
  createWorkerMessage,
  isReadyMessage,
  isProgressMessage,
  isErrorMessage,
  isCompleteMessage,
} from './types';
import type { Book } from '../types/book';
import type { BookStyle } from '../types/style';
import type { ImageData } from './types';

/**
 * Event handlers for worker events
 */
export interface EPUBWorkerHandlers {
  onReady?: (workerId: string) => void;
  onProgress?: (data: {
    percentage: number;
    currentChapter?: number;
    currentChapterTitle?: string;
    currentPage?: number;
    totalPages?: number;
    status: string;
    details?: string;
  }) => void;
  onComplete?: (data: {
    buffer: ArrayBuffer;
    fileName: string;
    fileSize: number;
    mimeType: string;
    metadata?: {
      pageCount?: number;
      wordCount?: number;
      processingTimeMs?: number;
      warnings?: string[];
    };
  }) => void;
  onError?: (error: {
    code: string;
    message: string;
    details?: string;
    stack?: string;
    recoverable?: boolean;
  }) => void;
}

/**
 * EPUB Worker Client class
 */
export class EPUBWorkerClient {
  private worker: Worker | null = null;
  private handlers: EPUBWorkerHandlers = {};
  private isReady = false;

  /**
   * Initialize the worker
   */
  async initialize(handlers: EPUBWorkerHandlers): Promise<void> {
    this.handlers = handlers;

    // Create the worker (Vite will handle the ?worker suffix)
    this.worker = new Worker(
      new URL('./epub-generator.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Set up message handler
    this.worker.addEventListener('message', this.handleMessage.bind(this));

    // Set up error handler
    this.worker.addEventListener('error', (event: ErrorEvent) => {
      this.handlers.onError?.({
        code: 'WORKER_INITIALIZATION_ERROR',
        message: event.message,
        details: `${event.filename}:${event.lineno}:${event.colno}`,
      });
    });

    // Wait for worker to be ready
    await new Promise<void>((resolve) => {
      const originalOnReady = this.handlers.onReady;
      this.handlers.onReady = (workerId: string) => {
        this.isReady = true;
        originalOnReady?.(workerId);
        resolve();
      };
    });
  }

  /**
   * Handle messages from the worker
   */
  private handleMessage(event: MessageEvent<WorkerToMainMessage>): void {
    const message = event.data;

    if (isReadyMessage(message)) {
      this.handlers.onReady?.(message.data.workerId);
    } else if (isProgressMessage(message)) {
      this.handlers.onProgress?.(message.data);
    } else if (isCompleteMessage(message)) {
      this.handlers.onComplete?.(message.data);
    } else if (isErrorMessage(message)) {
      this.handlers.onError?.(message.data);
    }
  }

  /**
   * Start EPUB generation
   */
  async generateEPUB(
    book: Book,
    styles: BookStyle[],
    images: ImageData[],
    options?: InitializeMessage['data']['options']
  ): Promise<void> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    if (!this.isReady) {
      throw new Error('Worker not ready');
    }

    const message = createWorkerMessage<InitializeMessage>(
      WorkerMessageType.INITIALIZE,
      {
        book,
        styles,
        images,
        options,
      }
    );

    this.worker.postMessage(message);
  }

  /**
   * Cancel ongoing generation
   */
  cancel(reason?: string): void {
    if (!this.worker) {
      return;
    }

    const message = createWorkerMessage<CancelMessage>(
      WorkerMessageType.CANCEL,
      { reason }
    );

    this.worker.postMessage(message);
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
    }
  }
}

/**
 * Example usage:
 *
 * const workerClient = new EPUBWorkerClient();
 *
 * await workerClient.initialize({
 *   onReady: (workerId) => {
 *     console.log('Worker ready:', workerId);
 *   },
 *   onProgress: (data) => {
 *     console.log(`Progress: ${data.percentage}% - ${data.status}`);
 *   },
 *   onComplete: (data) => {
 *     console.log('Generation complete!', data);
 *     // Save the buffer to file
 *   },
 *   onError: (error) => {
 *     console.error('Error:', error.message);
 *   }
 * });
 *
 * await workerClient.generateEPUB(book, styles, images);
 */
