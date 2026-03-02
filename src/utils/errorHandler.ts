/**
 * Centralized error handling utility
 * Provides error logging, user-friendly messages, and error categorization
 */

export enum ErrorType {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PARSE_ERROR = 'PARSE_ERROR',
  EXPORT_ERROR = 'EXPORT_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ErrorContext {
  componentStack?: string;
  userAction?: string;
  filePath?: string;
  additionalInfo?: Record<string, unknown>;
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  context?: ErrorContext;
  timestamp: Date;
  userMessage: string;
  recoverable: boolean;
}

export interface ErrorLogEntry {
  error: AppError;
  logged: Date;
}

class ErrorHandler {
  private errorLog: ErrorLogEntry[] = [];
  private maxLogSize = 100;
  private errorListeners: Set<(error: AppError) => void> = new Set();

  /**
   * Categorize an error based on its properties
   */
  categorizeError(error: Error | unknown): ErrorType {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (message.includes('enoent') || message.includes('file not found')) {
        return ErrorType.FILE_NOT_FOUND;
      }
      if (
        message.includes('parse') ||
        message.includes('json') ||
        message.includes('syntax')
      ) {
        return ErrorType.PARSE_ERROR;
      }
      if (message.includes('export') || message.includes('save')) {
        return ErrorType.EXPORT_ERROR;
      }
      if (message.includes('network') || message.includes('fetch')) {
        return ErrorType.NETWORK_ERROR;
      }
      if (message.includes('permission') || message.includes('eacces')) {
        return ErrorType.PERMISSION_ERROR;
      }
      if (message.includes('validation') || message.includes('invalid')) {
        return ErrorType.VALIDATION_ERROR;
      }
    }

    return ErrorType.UNKNOWN_ERROR;
  }

  /**
   * Get user-friendly error message based on error type
   */
  getUserMessage(type: ErrorType, context?: ErrorContext): string {
    const filePath = context?.filePath ? ` (${context.filePath})` : '';

    switch (type) {
      case ErrorType.FILE_NOT_FOUND:
        return `The file could not be found${filePath}. It may have been moved or deleted.`;
      case ErrorType.PARSE_ERROR:
        return `Failed to read the file${filePath}. The file may be corrupted or in an unsupported format.`;
      case ErrorType.EXPORT_ERROR:
        return `Failed to save the file${filePath}. Please check that you have write permissions and sufficient disk space.`;
      case ErrorType.NETWORK_ERROR:
        return 'A network error occurred. Please check your internet connection and try again.';
      case ErrorType.PERMISSION_ERROR:
        return `You don't have permission to access this file${filePath}.`;
      case ErrorType.VALIDATION_ERROR:
        return 'The data provided is invalid. Please check your input and try again.';
      case ErrorType.RUNTIME_ERROR:
        return 'An unexpected error occurred in the application.';
      case ErrorType.UNKNOWN_ERROR:
      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  }

  /**
   * Check if an error type is recoverable
   */
  isRecoverable(type: ErrorType): boolean {
    switch (type) {
      case ErrorType.FILE_NOT_FOUND:
      case ErrorType.PARSE_ERROR:
      case ErrorType.EXPORT_ERROR:
      case ErrorType.NETWORK_ERROR:
      case ErrorType.VALIDATION_ERROR:
        return true;
      case ErrorType.PERMISSION_ERROR:
      case ErrorType.RUNTIME_ERROR:
      case ErrorType.UNKNOWN_ERROR:
      default:
        return false;
    }
  }

  /**
   * Handle an error with full context
   */
  handleError(
    error: Error | unknown,
    context?: ErrorContext,
    customType?: ErrorType
  ): AppError {
    const errorType = customType || this.categorizeError(error);
    const originalError = error instanceof Error ? error : undefined;

    const appError: AppError = {
      type: errorType,
      message: originalError?.message || String(error),
      originalError,
      context,
      timestamp: new Date(),
      userMessage: this.getUserMessage(errorType, context),
      recoverable: this.isRecoverable(errorType),
    };

    this.logError(appError);
    this.notifyListeners(appError);

    return appError;
  }

  /**
   * Log error to console and internal log
   */
  private logError(error: AppError): void {
    const logEntry: ErrorLogEntry = {
      error,
      logged: new Date(),
    };

    // Add to internal log
    this.errorLog.push(logEntry);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console
    console.error('[ErrorHandler]', {
      type: error.type,
      message: error.message,
      timestamp: error.timestamp.toISOString(),
      context: error.context,
    });

    if (error.originalError) {
      console.error('[ErrorHandler] Original error:', error.originalError);
    }

    if (error.context?.componentStack) {
      console.error(
        '[ErrorHandler] Component stack:',
        error.context.componentStack
      );
    }
  }

  /**
   * Log error to file (if electron IPC is available)
   */
  async logErrorToFile(error: AppError): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.electron) {
        await window.electron.invoke('error:log', {
          type: error.type,
          message: error.message,
          timestamp: error.timestamp.toISOString(),
          context: error.context,
          stack: error.originalError?.stack,
        });
      }
    } catch (e) {
      console.error('Failed to log error to file:', e);
    }
  }

  /**
   * Get error log
   */
  getErrorLog(): ErrorLogEntry[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Register an error listener
   */
  onError(listener: (error: AppError) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  /**
   * Notify all error listeners
   */
  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach((listener) => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error listener failed:', e);
      }
    });
  }

  /**
   * Try to preserve unsaved changes before app crash
   */
  async preserveUnsavedChanges(data: unknown): Promise<boolean> {
    try {
      const key = `emergency-save-${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(data));

      // Also try to save via electron if available
      if (typeof window !== 'undefined' && window.electron) {
        await window.electron.invoke('emergency:save', {
          key,
          data,
          timestamp: new Date().toISOString(),
        });
      }

      console.log(`[ErrorHandler] Preserved unsaved changes: ${key}`);
      return true;
    } catch (e) {
      console.error('Failed to preserve unsaved changes:', e);
      return false;
    }
  }

  /**
   * Get preserved emergency saves
   */
  getEmergencySaves(): Array<{ key: string; data: unknown; timestamp: string }> {
    const saves: Array<{ key: string; data: unknown; timestamp: string }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('emergency-save-')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          const timestamp = key.replace('emergency-save-', '');
          saves.push({ key, data, timestamp });
        } catch (e) {
          console.error('Failed to parse emergency save:', e);
        }
      }
    }

    return saves.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /**
   * Clear emergency save
   */
  clearEmergencySave(key: string): void {
    localStorage.removeItem(key);
  }
}

// Singleton instance
let errorHandlerInstance: ErrorHandler | null = null;

export function getErrorHandler(): ErrorHandler {
  if (!errorHandlerInstance) {
    errorHandlerInstance = new ErrorHandler();
  }
  return errorHandlerInstance;
}

export default ErrorHandler;
