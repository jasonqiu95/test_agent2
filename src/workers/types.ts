/**
 * Worker message protocol for communication between main thread and workers
 */

import { Book } from '../types/book';
import { BookStyle, Style } from '../types/style';
import {
  TrimSize,
  CustomTrimSize,
  PdfMargins,
  BleedSettings,
  HeaderConfig,
  PageNumberConfig,
} from '../types/pdf';

/**
 * Message types for worker communication
 */
export enum WorkerMessageType {
  // Main thread to worker messages
  INITIALIZE = 'INITIALIZE',
  CANCEL = 'CANCEL',

  // Worker to main thread messages
  PROGRESS = 'PROGRESS',
  ERROR = 'ERROR',
  COMPLETE = 'COMPLETE',
  READY = 'READY',
  CANCELLED = 'CANCELLED',
}

/**
 * Base message interface
 */
export interface BaseWorkerMessage {
  type: WorkerMessageType;
  timestamp: number;
}

/**
 * Image data for initialization
 */
export interface ImageData {
  id: string;
  url: string;
  buffer?: ArrayBuffer;
  mimeType?: string;
  width?: number;
  height?: number;
}

/**
 * PDF generation options for worker
 */
export interface PdfOptions {
  trimSize: TrimSize;
  customTrimSize?: CustomTrimSize;
  margins: PdfMargins;
  bleed?: BleedSettings;
  includeHeaders: boolean;
  headerConfig?: HeaderConfig;
  includePageNumbers: boolean;
  pageNumberConfig?: PageNumberConfig;
  embedFonts?: boolean;
  compress?: boolean;
}

/**
 * Initialization message from main thread to worker
 * Contains all data needed to start processing
 */
export interface InitializeMessage extends BaseWorkerMessage {
  type: WorkerMessageType.INITIALIZE;
  data: {
    book: Book;
    styles: BookStyle[];
    images: ImageData[];
    options?: {
      format?: 'epub' | 'pdf' | 'docx';
      quality?: 'draft' | 'standard' | 'high';
      includeMetadata?: boolean;
      includeToc?: boolean;
      pageSize?: string;
      margin?: string;
      pdf?: PdfOptions;
    };
  };
}

/**
 * Progress update from worker to main thread
 */
export interface ProgressMessage extends BaseWorkerMessage {
  type: WorkerMessageType.PROGRESS;
  data: {
    percentage: number; // 0-100
    currentChapter?: number;
    currentChapterTitle?: string;
    currentPage?: number;
    totalPages?: number;
    currentItem?: string; // Current item being processed (chapter/front matter/back matter title)
    processedItems?: number; // Number of items processed so far
    totalItems?: number; // Total number of items to process
    status: string;
    details?: string;
    eta?: number | null; // Estimated time remaining in milliseconds
    currentStep?: string; // Current step name (e.g., "Validating", "Rendering chapters", etc.)
  };
}

/**
 * Error message from worker to main thread
 */
export interface ErrorMessage extends BaseWorkerMessage {
  type: WorkerMessageType.ERROR;
  data: {
    code: string;
    message: string;
    details?: string;
    stack?: string;
    recoverable?: boolean;
    chapterNumber?: number;
    elementId?: string;
  };
}

/**
 * Completion message from worker to main thread
 * Contains the generated file buffer
 */
export interface CompleteMessage extends BaseWorkerMessage {
  type: WorkerMessageType.COMPLETE;
  data: {
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
  };
}

/**
 * Cancellation message from main thread to worker
 */
export interface CancelMessage extends BaseWorkerMessage {
  type: WorkerMessageType.CANCEL;
  data: {
    reason?: string;
  };
}

/**
 * Ready message from worker to main thread
 * Indicates worker is initialized and ready to receive tasks
 */
export interface ReadyMessage extends BaseWorkerMessage {
  type: WorkerMessageType.READY;
  data: {
    workerId: string;
    capabilities?: string[];
  };
}

/**
 * Cancelled message from worker to main thread
 * Indicates the task was successfully cancelled
 */
export interface CancelledMessage extends BaseWorkerMessage {
  type: WorkerMessageType.CANCELLED;
  data: {
    reason?: string;
    partialProgress?: number;
    cleanedUp: boolean;
    resourcesReleased: string[];
  };
}

/**
 * Union type of all messages from main thread to worker
 */
export type MainToWorkerMessage = InitializeMessage | CancelMessage;

/**
 * Union type of all messages from worker to main thread
 */
export type WorkerToMainMessage =
  | ReadyMessage
  | ProgressMessage
  | ErrorMessage
  | CompleteMessage
  | CancelledMessage;

/**
 * Union type of all worker messages
 */
export type WorkerMessage = MainToWorkerMessage | WorkerToMainMessage;

/**
 * Type guard for message types
 */
export function isInitializeMessage(
  message: WorkerMessage
): message is InitializeMessage {
  return message.type === WorkerMessageType.INITIALIZE;
}

export function isProgressMessage(
  message: WorkerMessage
): message is ProgressMessage {
  return message.type === WorkerMessageType.PROGRESS;
}

export function isErrorMessage(message: WorkerMessage): message is ErrorMessage {
  return message.type === WorkerMessageType.ERROR;
}

export function isCompleteMessage(
  message: WorkerMessage
): message is CompleteMessage {
  return message.type === WorkerMessageType.COMPLETE;
}

export function isCancelMessage(
  message: WorkerMessage
): message is CancelMessage {
  return message.type === WorkerMessageType.CANCEL;
}

export function isReadyMessage(message: WorkerMessage): message is ReadyMessage {
  return message.type === WorkerMessageType.READY;
}

export function isCancelledMessage(
  message: WorkerMessage
): message is CancelledMessage {
  return message.type === WorkerMessageType.CANCELLED;
}

/**
 * Helper function to create a typed worker message
 */
export function createWorkerMessage<T extends WorkerMessage>(
  type: T['type'],
  data: T['data']
): T {
  return {
    type,
    data,
    timestamp: Date.now(),
  } as T;
}
