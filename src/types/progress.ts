/**
 * Progress metadata containing additional context information
 */
export interface ProgressMetadata {
  /** Current item being processed (e.g., "Chapter 3") */
  currentItem?: string;
  /** Total number of items to process */
  totalItems?: number;
  /** Current item index (0-based) */
  currentItemIndex?: number;
  /** Status message describing the current operation */
  statusMessage?: string;
  /** Optional additional data */
  [key: string]: unknown;
}

/**
 * Progress event containing percentage and optional metadata
 */
export interface ProgressEvent {
  /** Progress percentage (0-100) */
  progress: number;
  /** Optional metadata about the progress */
  metadata?: ProgressMetadata;
  /** Timestamp when the event was created */
  timestamp: number;
}

/**
 * Progress event handler function type
 */
export type ProgressEventHandler = (event: ProgressEvent) => void;

/**
 * Progress emitter state
 */
export interface ProgressEmitterState {
  /** Current progress percentage */
  currentProgress: number;
  /** Current metadata */
  currentMetadata?: ProgressMetadata;
  /** Whether the progress is complete */
  isComplete: boolean;
}
