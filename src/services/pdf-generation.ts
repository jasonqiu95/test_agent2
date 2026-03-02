/**
 * PDF Generation Service
 * Main-thread service for managing PDF worker lifecycle and communication
 */

import {
  WorkerMessageType,
  MainToWorkerMessage,
  WorkerToMainMessage,
  InitializeMessage,
  ProgressMessage,
  ErrorMessage,
  CompleteMessage,
  CancelledMessage,
  createWorkerMessage,
  isProgressMessage,
  isErrorMessage,
  isCompleteMessage,
  isCancelledMessage,
  isReadyMessage,
  ImageData,
  PdfOptions,
} from '../workers/types';
import { Book } from '../types/book';
import { BookStyle } from '../types/style';

export interface PdfGenerationCallbacks {
  onProgress?: (data: ProgressMessage['data']) => void;
  onError?: (data: ErrorMessage['data']) => void;
  onComplete?: (data: CompleteMessage['data']) => void;
  onCancelled?: (data: CancelledMessage['data']) => void;
}

export interface PdfGenerationConfig {
  book: Book;
  styles?: BookStyle[];
  images?: ImageData[];
  options?: {
    format?: 'epub' | 'pdf' | 'docx';
    quality?: 'draft' | 'standard' | 'high';
    includeMetadata?: boolean;
    includeToc?: boolean;
    pageSize?: string;
    margin?: string;
    pdf?: PdfOptions;
  };
}

/**
 * PDF Generation Service
 * Manages worker instantiation, message passing, and cleanup
 */
export class PdfGenerationService {
  private worker: Worker | null = null;
  private isReady = false;
  private callbacks: PdfGenerationCallbacks = {};
  private isProcessing = false;

  /**
   * Initialize the PDF worker
   */
  async initialize(): Promise<void> {
    if (this.worker) {
      console.warn('PDF worker already initialized');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        // Create worker
        this.worker = new Worker(
          new URL('../workers/pdf-generator.worker.ts', import.meta.url),
          { type: 'module' }
        );

        // Set up message handler
        this.worker.onmessage = (event: MessageEvent<WorkerToMainMessage>) => {
          this.handleWorkerMessage(event.data);
        };

        // Set up error handler
        this.worker.onerror = (error: ErrorEvent) => {
          console.error('PDF worker error:', error);
          this.callbacks.onError?.({
            code: 'WORKER_ERROR',
            message: error.message,
            details: `Error at ${error.filename}:${error.lineno}:${error.colno}`,
          });
        };

        // Wait for ready message
        const readyTimeout = setTimeout(() => {
          reject(new Error('PDF worker initialization timeout'));
        }, 10000);

        const originalOnMessage = this.worker.onmessage;
        this.worker.onmessage = (event: MessageEvent<WorkerToMainMessage>) => {
          if (isReadyMessage(event.data)) {
            clearTimeout(readyTimeout);
            this.isReady = true;
            this.worker!.onmessage = originalOnMessage;
            resolve();
          }
          originalOnMessage?.call(this.worker, event);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Start PDF generation
   */
  async generate(
    config: PdfGenerationConfig,
    callbacks: PdfGenerationCallbacks
  ): Promise<void> {
    if (!this.worker || !this.isReady) {
      throw new Error('PDF worker not initialized. Call initialize() first.');
    }

    if (this.isProcessing) {
      throw new Error('PDF generation already in progress');
    }

    this.isProcessing = true;
    this.callbacks = callbacks;

    // Send initialization message to worker
    const message: InitializeMessage = createWorkerMessage(
      WorkerMessageType.INITIALIZE,
      {
        book: config.book,
        styles: config.styles || [],
        images: config.images || [],
        options: config.options,
      }
    );

    this.worker.postMessage(message);
  }

  /**
   * Cancel ongoing PDF generation
   */
  cancel(reason?: string): void {
    if (!this.worker || !this.isProcessing) {
      return;
    }

    const message = createWorkerMessage(WorkerMessageType.CANCEL, {
      reason: reason || 'User cancelled',
    });

    this.worker.postMessage(message);
  }

  /**
   * Terminate the worker and clean up
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      this.isProcessing = false;
      this.callbacks = {};
    }
  }

  /**
   * Check if worker is currently processing
   */
  getIsProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Handle messages from the worker
   */
  private handleWorkerMessage(message: WorkerToMainMessage): void {
    if (isProgressMessage(message)) {
      this.callbacks.onProgress?.(message.data);
    } else if (isErrorMessage(message)) {
      this.isProcessing = false;
      this.callbacks.onError?.(message.data);
    } else if (isCompleteMessage(message)) {
      this.isProcessing = false;
      this.callbacks.onComplete?.(message.data);
    } else if (isCancelledMessage(message)) {
      this.isProcessing = false;
      this.callbacks.onCancelled?.(message.data);
    }
  }

  /**
   * Save generated file to disk
   */
  async saveFile(buffer: ArrayBuffer, fileName: string): Promise<void> {
    // In Electron, we use the IPC to show save dialog and write file
    if (window.electron?.invoke) {
      try {
        const result = await window.electron.invoke('dialog:showSaveDialog', {
          defaultPath: fileName,
          filters: [
            { name: 'PDF Files', extensions: ['pdf'] },
            { name: 'All Files', extensions: ['*'] },
          ],
        });

        if (result && !result.canceled && result.filePath) {
          const uint8Array = new Uint8Array(buffer);
          await window.electron.invoke('fs:writeFile', {
            filePath: result.filePath,
            data: Array.from(uint8Array),
          });
        }
      } catch (error) {
        console.error('Failed to save PDF via Electron:', error);
        // Fallback to browser download
        this.triggerBrowserDownload(buffer, fileName);
      }
    } else {
      // Fallback for web: trigger download
      this.triggerBrowserDownload(buffer, fileName);
    }
  }

  /**
   * Trigger browser download (fallback for non-Electron environments)
   */
  private triggerBrowserDownload(buffer: ArrayBuffer, fileName: string): void {
    const blob = new Blob([buffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Singleton instance
let pdfGenerationService: PdfGenerationService | null = null;

/**
 * Get or create the PDF generation service singleton
 */
export function getPdfGenerationService(): PdfGenerationService {
  if (!pdfGenerationService) {
    pdfGenerationService = new PdfGenerationService();
  }
  return pdfGenerationService;
}
