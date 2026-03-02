/**
 * EPUB Generation Service
 *
 * Main-thread service for managing EPUB generation through web workers.
 * Provides a high-level API for initiating EPUB generation, tracking progress,
 * and handling the generated file.
 */

import { EPUBWorkerClient, EPUBWorkerHandlers } from '../workers/epub-worker-client';
import type { Book } from '../types/book';
import type { BookStyle } from '../types/style';
import type { ImageData } from '../workers/types';
import type { InitializeMessage } from '../workers/types';

/**
 * Progress information for EPUB generation
 */
export interface EpubGenerationProgress {
  percentage: number;
  status: string;
  currentChapter?: number;
  currentChapterTitle?: string;
  details?: string;
}

/**
 * Error information for EPUB generation
 */
export interface EpubGenerationError {
  code: string;
  message: string;
  details?: string;
  stack?: string;
  recoverable?: boolean;
}

/**
 * Completion information for EPUB generation
 */
export interface EpubGenerationComplete {
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
}

/**
 * Callbacks for EPUB generation events
 */
export interface EpubGenerationCallbacks {
  onProgress?: (progress: EpubGenerationProgress) => void;
  onComplete?: (result: EpubGenerationComplete) => void;
  onError?: (error: EpubGenerationError) => void;
}

/**
 * EPUB Generation Service
 * Manages worker lifecycle and provides simplified API for EPUB generation
 */
export class EpubGenerationService {
  private workerClient: EPUBWorkerClient | null = null;
  private isInitialized = false;
  private isGenerating = false;

  /**
   * Initialize the service and worker
   */
  async initialize(callbacks: EpubGenerationCallbacks): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Service already initialized');
    }

    this.workerClient = new EPUBWorkerClient();

    const handlers: EPUBWorkerHandlers = {
      onReady: (workerId) => {
        console.log('EPUB Worker ready:', workerId);
      },
      onProgress: (data) => {
        callbacks.onProgress?.({
          percentage: data.percentage,
          status: data.status,
          currentChapter: data.currentChapter,
          currentChapterTitle: data.currentChapterTitle,
          details: data.details,
        });
      },
      onComplete: (data) => {
        this.isGenerating = false;
        callbacks.onComplete?.(data);
      },
      onError: (error) => {
        this.isGenerating = false;
        callbacks.onError?.(error);
      },
    };

    await this.workerClient.initialize(handlers);
    this.isInitialized = true;
  }

  /**
   * Generate EPUB file
   */
  async generate(
    book: Book,
    styles: BookStyle[],
    images: ImageData[] = [],
    options?: InitializeMessage['data']['options']
  ): Promise<void> {
    if (!this.isInitialized || !this.workerClient) {
      throw new Error('Service not initialized');
    }

    if (this.isGenerating) {
      throw new Error('Generation already in progress');
    }

    this.isGenerating = true;

    try {
      await this.workerClient.generateEPUB(book, styles, images, options);
    } catch (error) {
      this.isGenerating = false;
      throw error;
    }
  }

  /**
   * Cancel ongoing generation
   */
  cancel(reason?: string): void {
    if (!this.workerClient) {
      return;
    }

    this.workerClient.cancel(reason);
    this.isGenerating = false;
  }

  /**
   * Terminate the worker and clean up
   */
  terminate(): void {
    if (this.workerClient) {
      this.workerClient.terminate();
      this.workerClient = null;
      this.isInitialized = false;
      this.isGenerating = false;
    }
  }

  /**
   * Check if generation is in progress
   */
  isInProgress(): boolean {
    return this.isGenerating;
  }

  /**
   * Check if service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

/**
 * Save generated EPUB file to disk
 */
export async function saveEpubFile(
  buffer: ArrayBuffer,
  fileName: string
): Promise<void> {
  try {
    // Create a Blob from the ArrayBuffer
    const blob = new Blob([buffer], { type: 'application/epub+zip' });

    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to save EPUB file:', error);
    throw new Error('Failed to save EPUB file');
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
