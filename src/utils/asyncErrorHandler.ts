/**
 * Utility for handling async operations with automatic error handling
 */

import { getErrorHandler, ErrorType, ErrorContext } from './errorHandler';

export interface AsyncOperationOptions {
  errorType?: ErrorType;
  context?: ErrorContext;
  onError?: (error: Error) => void;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Wrap an async operation with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options: AsyncOperationOptions = {}
): Promise<T> {
  const errorHandler = getErrorHandler();
  const { errorType, context, onError, retryAttempts = 0, retryDelay = 1000 } = options;

  let lastError: Error | null = null;
  let attempts = 0;

  while (attempts <= retryAttempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempts++;

      if (attempts <= retryAttempts) {
        console.log(`Retry attempt ${attempts}/${retryAttempts}`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }

      // All retries failed, handle the error
      const appError = errorHandler.handleError(lastError, context, errorType);

      if (onError) {
        onError(lastError);
      }

      throw appError;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Unknown error');
}

/**
 * Create a wrapped version of an async function with automatic error handling
 */
export function createErrorHandledFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: AsyncOperationOptions = {}
): T {
  return (async (...args: any[]) => {
    return withErrorHandling(() => fn(...args), options);
  }) as T;
}

/**
 * Utility to safely execute a function and catch errors
 */
export function tryCatch<T>(
  fn: () => T,
  fallback: T | ((error: Error) => T),
  errorType?: ErrorType
): T {
  try {
    return fn();
  } catch (error) {
    const errorHandler = getErrorHandler();
    errorHandler.handleError(error, undefined, errorType);

    if (typeof fallback === 'function') {
      return (fallback as (error: Error) => T)(error instanceof Error ? error : new Error(String(error)));
    }
    return fallback;
  }
}

/**
 * Debounced error handler to prevent error spam
 */
export class DebouncedErrorHandler {
  private timeouts = new Map<string, NodeJS.Timeout>();
  private errorCounts = new Map<string, number>();

  handle(
    key: string,
    error: Error,
    delay: number = 1000,
    maxCount: number = 3
  ): void {
    const count = (this.errorCounts.get(key) || 0) + 1;
    this.errorCounts.set(key, count);

    if (count > maxCount) {
      console.warn(`Error "${key}" occurred too many times (${count}), suppressing further notifications`);
      return;
    }

    const existingTimeout = this.timeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      const errorHandler = getErrorHandler();
      errorHandler.handleError(error, {
        userAction: key,
        additionalInfo: { occurrenceCount: count },
      });

      this.timeouts.delete(key);
      this.errorCounts.delete(key);
    }, delay);

    this.timeouts.set(key, timeout);
  }

  clear(key?: string): void {
    if (key) {
      const timeout = this.timeouts.get(key);
      if (timeout) {
        clearTimeout(timeout);
        this.timeouts.delete(key);
        this.errorCounts.delete(key);
      }
    } else {
      this.timeouts.forEach(timeout => clearTimeout(timeout));
      this.timeouts.clear();
      this.errorCounts.clear();
    }
  }
}
