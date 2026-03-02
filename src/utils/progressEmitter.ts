import {
  ProgressEvent,
  ProgressEventHandler,
  ProgressMetadata,
  ProgressEmitterState,
} from '../types/progress';

/**
 * ProgressEmitter class for type-safe progress event emission and subscription
 *
 * @example
 * const emitter = new ProgressEmitter();
 *
 * // Subscribe to progress updates
 * const unsubscribe = emitter.subscribe((event) => {
 *   console.log(`Progress: ${event.progress}%`);
 *   if (event.metadata?.statusMessage) {
 *     console.log(`Status: ${event.metadata.statusMessage}`);
 *   }
 * });
 *
 * // Emit progress
 * emitter.emit(50, { statusMessage: 'Processing...' });
 *
 * // Clean up
 * unsubscribe();
 */
export class ProgressEmitter {
  private handlers: Set<ProgressEventHandler> = new Set();
  private currentProgress: number = 0;
  private currentMetadata?: ProgressMetadata;
  private isComplete: boolean = false;

  /**
   * Subscribe to progress events
   * @param handler - Function to handle progress events
   * @returns Unsubscribe function
   */
  subscribe(handler: ProgressEventHandler): () => void {
    if (typeof handler !== 'function') {
      throw new TypeError('Handler must be a function');
    }

    this.handlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.unsubscribe(handler);
    };
  }

  /**
   * Unsubscribe a handler from progress events
   * @param handler - Handler to remove
   * @returns True if handler was removed, false if it wasn't subscribed
   */
  unsubscribe(handler: ProgressEventHandler): boolean {
    return this.handlers.delete(handler);
  }

  /**
   * Emit a progress event
   * @param progress - Progress percentage (0-100)
   * @param metadata - Optional metadata about the progress
   * @throws Error if progress is not between 0 and 100
   */
  emit(progress: number, metadata?: ProgressMetadata): void {
    // Validate progress range
    if (typeof progress !== 'number' || isNaN(progress)) {
      throw new TypeError('Progress must be a valid number');
    }

    if (progress < 0 || progress > 100) {
      throw new RangeError('Progress must be between 0 and 100');
    }

    // Update internal state
    this.currentProgress = progress;
    this.currentMetadata = metadata;
    this.isComplete = progress === 100;

    // Create event object
    const event: ProgressEvent = {
      progress,
      metadata,
      timestamp: Date.now(),
    };

    // Notify all handlers
    this.handlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        // Log error but don't stop other handlers
        console.error('Error in progress handler:', error);
      }
    });
  }

  /**
   * Get the current progress state
   * @returns Current progress state
   */
  getState(): ProgressEmitterState {
    return {
      currentProgress: this.currentProgress,
      currentMetadata: this.currentMetadata,
      isComplete: this.isComplete,
    };
  }

  /**
   * Reset the progress to 0
   */
  reset(): void {
    this.currentProgress = 0;
    this.currentMetadata = undefined;
    this.isComplete = false;
  }

  /**
   * Remove all subscribers
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * Get the number of active subscribers
   * @returns Number of subscribed handlers
   */
  getSubscriberCount(): number {
    return this.handlers.size;
  }

  /**
   * Check if progress is complete (100%)
   * @returns True if progress is at 100%
   */
  isProgressComplete(): boolean {
    return this.isComplete;
  }

  /**
   * Emit progress with automatic calculation based on item index
   * @param currentIndex - Current item index (0-based)
   * @param total - Total number of items
   * @param metadata - Optional additional metadata
   */
  emitProgress(currentIndex: number, total: number, metadata?: ProgressMetadata): void {
    if (total <= 0) {
      throw new RangeError('Total must be greater than 0');
    }

    const progress = Math.min(100, Math.round(((currentIndex + 1) / total) * 100));

    const combinedMetadata: ProgressMetadata = {
      ...metadata,
      currentItemIndex: currentIndex,
      totalItems: total,
    };

    this.emit(progress, combinedMetadata);
  }
}
