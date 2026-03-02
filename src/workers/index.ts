/**
 * Worker management and utilities
 * Provides a clean API for interacting with the PDF generator worker
 */

import {
  MainToWorkerMessage,
  WorkerToMainMessage,
  WorkerMessageType,
  InitializeMessage,
  ProgressMessage,
  ErrorMessage,
  CompleteMessage,
  ReadyMessage,
  createWorkerMessage,
} from './types';
import { Book } from '../types/book';
import { BookStyle } from '../types/style';
import { ImageData } from './types';

/**
 * Event handler types for worker events
 */
export interface WorkerEventHandlers {
  onReady?: (data: ReadyMessage['data']) => void;
  onProgress?: (data: ProgressMessage['data']) => void;
  onError?: (data: ErrorMessage['data']) => void;
  onComplete?: (data: CompleteMessage['data']) => void;
}

/**
 * Options for PDF generation
 */
export interface PDFGenerationOptions {
  format?: 'epub' | 'pdf' | 'docx';
  quality?: 'draft' | 'standard' | 'high';
  includeMetadata?: boolean;
  includeToc?: boolean;
  pageSize?: string;
  margin?: string;
}

/**
 * PDF Worker Manager
 * Manages the lifecycle and communication with the PDF generator worker
 */
export class PDFWorkerManager {
  private worker: Worker | null = null;
  private handlers: WorkerEventHandlers = {};
  private isReady = false;
  private readyPromise: Promise<void>;
  private resolveReady!: () => void;

  constructor() {
    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
  }

  /**
   * Initialize the worker
   */
  initialize(handlers?: WorkerEventHandlers): void {
    if (this.worker) {
      console.warn('Worker already initialized');
      return;
    }

    this.handlers = handlers || {};

    // Create worker instance
    // Note: Vite will automatically handle the ?worker import
    this.worker = new Worker(
      new URL('./pdf-generator.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Set up message handler
    this.worker.onmessage = (event: MessageEvent<WorkerToMainMessage>) => {
      this.handleWorkerMessage(event.data);
    };

    // Set up error handler
    this.worker.onerror = (event: ErrorEvent) => {
      console.error('Worker error:', event);
      this.handlers.onError?.({
        code: 'WORKER_ERROR',
        message: event.message,
        stack: event.error?.stack,
        recoverable: false,
      });
    };
  }

  /**
   * Wait for worker to be ready
   */
  async waitForReady(): Promise<void> {
    return this.readyPromise;
  }

  /**
   * Handle messages from worker
   */
  private handleWorkerMessage(message: WorkerToMainMessage): void {
    switch (message.type) {
      case WorkerMessageType.READY:
        this.isReady = true;
        this.resolveReady();
        this.handlers.onReady?.(message.data);
        break;

      case WorkerMessageType.PROGRESS:
        this.handlers.onProgress?.(message.data);
        break;

      case WorkerMessageType.ERROR:
        this.handlers.onError?.(message.data);
        break;

      case WorkerMessageType.COMPLETE:
        this.handlers.onComplete?.(message.data);
        break;

      default:
        console.warn('Unknown message type:', message);
    }
  }

  /**
   * Send a message to the worker
   */
  private postMessage(message: MainToWorkerMessage): void {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }
    this.worker.postMessage(message);
  }

  /**
   * Generate PDF from book data
   */
  async generatePDF(
    book: Book,
    styles: BookStyle[],
    images: ImageData[] = [],
    options?: PDFGenerationOptions
  ): Promise<void> {
    if (!this.isReady) {
      await this.waitForReady();
    }

    const message: InitializeMessage = createWorkerMessage(
      WorkerMessageType.INITIALIZE,
      {
        book,
        styles,
        images,
        options,
      }
    );

    this.postMessage(message);
  }

  /**
   * Cancel the current operation
   */
  cancel(reason?: string): void {
    if (!this.worker) {
      return;
    }

    this.postMessage(
      createWorkerMessage(WorkerMessageType.CANCEL, {
        reason,
      })
    );
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

  /**
   * Check if worker is ready
   */
  get ready(): boolean {
    return this.isReady;
  }
}

/**
 * Create a new PDF worker manager instance
 */
export function createPDFWorker(handlers?: WorkerEventHandlers): PDFWorkerManager {
  const manager = new PDFWorkerManager();
  manager.initialize(handlers);
  return manager;
}
