/**
 * Cancellation Token Utility
 *
 * Provides a reusable cancellation token pattern for managing async operations.
 * Inspired by .NET's CancellationToken pattern.
 */

/**
 * Callback function type for cancellation listeners
 */
export type CancellationCallback = () => void;

/**
 * Interface for cancellation token
 */
export interface ICancellationToken {
  /**
   * Returns true if cancellation has been requested
   */
  readonly isCancellationRequested: boolean;

  /**
   * Throws an error if cancellation has been requested
   */
  throwIfCancellationRequested(): void;

  /**
   * Registers a callback to be invoked when cancellation is requested
   * @returns A function to unregister the callback
   */
  onCancellationRequested(callback: CancellationCallback): () => void;
}

/**
 * A token that allows checking for cancellation and registering callbacks
 */
export class CancellationToken implements ICancellationToken {
  private _isCancellationRequested = false;
  private _callbacks: Set<CancellationCallback> = new Set();

  /**
   * Returns true if cancellation has been requested
   */
  get isCancellationRequested(): boolean {
    return this._isCancellationRequested;
  }

  /**
   * Throws an error if cancellation has been requested
   */
  throwIfCancellationRequested(): void {
    if (this._isCancellationRequested) {
      throw new CancellationError('Operation was cancelled');
    }
  }

  /**
   * Registers a callback to be invoked when cancellation is requested
   * @param callback - The function to call when cancellation is requested
   * @returns A function to unregister the callback
   */
  onCancellationRequested(callback: CancellationCallback): () => void {
    if (this._isCancellationRequested) {
      // If already cancelled, invoke immediately
      callback();
      return () => {}; // No-op unregister function
    }

    this._callbacks.add(callback);

    // Return unregister function
    return () => {
      this._callbacks.delete(callback);
    };
  }

  /**
   * Internal method to trigger cancellation (used by CancellationTokenSource)
   * @internal
   */
  _cancel(): void {
    if (this._isCancellationRequested) {
      return; // Already cancelled
    }

    this._isCancellationRequested = true;

    // Invoke all registered callbacks
    this._callbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in cancellation callback:', error);
      }
    });

    // Clear callbacks after invocation
    this._callbacks.clear();
  }
}

/**
 * Custom error class for cancellation
 */
export class CancellationError extends Error {
  constructor(message = 'Operation was cancelled') {
    super(message);
    this.name = 'CancellationError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CancellationError);
    }
  }
}

/**
 * Interface for cancellation token source
 */
export interface ICancellationTokenSource {
  /**
   * The cancellation token associated with this source
   */
  readonly token: CancellationToken;

  /**
   * Requests cancellation
   */
  cancel(): void;

  /**
   * Disposes the cancellation token source
   */
  dispose(): void;
}

/**
 * Creates and manages a CancellationToken
 */
export class CancellationTokenSource implements ICancellationTokenSource {
  private _token: CancellationToken;
  private _disposed = false;
  private _cancelTimeoutId?: NodeJS.Timeout | number;

  constructor() {
    this._token = new CancellationToken();
  }

  /**
   * Gets the cancellation token associated with this source
   */
  get token(): CancellationToken {
    return this._token;
  }

  /**
   * Requests cancellation
   */
  cancel(): void {
    if (this._disposed) {
      throw new Error('CancellationTokenSource has been disposed');
    }

    this._token._cancel();
  }

  /**
   * Schedules a cancellation operation after the specified delay
   * @param delay - Delay in milliseconds
   */
  cancelAfter(delay: number): void {
    if (this._disposed) {
      throw new Error('CancellationTokenSource has been disposed');
    }

    if (delay < 0) {
      throw new Error('Delay must be non-negative');
    }

    // Clear any existing timeout
    if (this._cancelTimeoutId !== undefined) {
      clearTimeout(this._cancelTimeoutId as NodeJS.Timeout);
    }

    if (delay === 0) {
      this.cancel();
    } else {
      this._cancelTimeoutId = setTimeout(() => {
        this.cancel();
      }, delay);
    }
  }

  /**
   * Disposes the cancellation token source and clears any pending timeouts
   */
  dispose(): void {
    if (this._disposed) {
      return;
    }

    this._disposed = true;

    // Clear any pending timeout
    if (this._cancelTimeoutId !== undefined) {
      clearTimeout(this._cancelTimeoutId as NodeJS.Timeout);
      this._cancelTimeoutId = undefined;
    }
  }
}

/**
 * A static cancellation token that is never cancelled
 */
export const NeverCancelledToken: ICancellationToken = {
  isCancellationRequested: false,
  throwIfCancellationRequested: () => {},
  onCancellationRequested: () => () => {},
};

/**
 * Factory function to create a new CancellationTokenSource
 */
export function createCancellationTokenSource(): CancellationTokenSource {
  return new CancellationTokenSource();
}

/**
 * Utility function to create a cancellation token that cancels after a delay
 * @param delay - Delay in milliseconds
 * @returns A CancellationTokenSource configured to cancel after the delay
 */
export function createTimeoutToken(delay: number): CancellationTokenSource {
  const source = new CancellationTokenSource();
  source.cancelAfter(delay);
  return source;
}

/**
 * Creates a linked cancellation token that cancels when any of the provided tokens cancel
 * @param tokens - Array of cancellation tokens to link
 * @returns A new CancellationTokenSource that cancels when any input token cancels
 */
export function createLinkedTokenSource(...tokens: CancellationToken[]): CancellationTokenSource {
  const linkedSource = new CancellationTokenSource();

  // If any token is already cancelled, cancel the linked source immediately
  if (tokens.some(token => token.isCancellationRequested)) {
    linkedSource.cancel();
    return linkedSource;
  }

  // Register callbacks on all tokens
  const unregisterCallbacks = tokens.map(token =>
    token.onCancellationRequested(() => {
      linkedSource.cancel();
    })
  );

  // Override dispose to clean up all callbacks
  const originalDispose = linkedSource.dispose.bind(linkedSource);
  linkedSource.dispose = () => {
    unregisterCallbacks.forEach(unregister => unregister());
    originalDispose();
  };

  return linkedSource;
}

/**
 * Helper function to check if an error is a CancellationError
 */
export function isCancellationError(error: unknown): error is CancellationError {
  return error instanceof CancellationError;
}

/**
 * Wraps an async operation with cancellation support
 * @param operation - The async operation to wrap
 * @param token - The cancellation token
 * @returns A promise that rejects if cancelled
 */
export async function withCancellation<T>(
  operation: (token: CancellationToken) => Promise<T>,
  token: CancellationToken
): Promise<T> {
  return new Promise((resolve, reject) => {
    // Check if already cancelled
    if (token.isCancellationRequested) {
      reject(new CancellationError());
      return;
    }

    // Register cancellation callback
    const unregister = token.onCancellationRequested(() => {
      reject(new CancellationError());
    });

    // Execute the operation
    operation(token)
      .then(result => {
        unregister();
        resolve(result);
      })
      .catch(error => {
        unregister();
        reject(error);
      });
  });
}
