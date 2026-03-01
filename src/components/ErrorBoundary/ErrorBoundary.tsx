/**
 * React Error Boundary Component
 * Catches errors in child components and displays a fallback UI
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { getErrorHandler, AppError } from '../../utils/errorHandler';
import { ErrorDisplay } from './ErrorDisplay';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError) => void;
  preserveState?: () => unknown;
  level?: 'app' | 'layout' | 'component';
}

interface State {
  hasError: boolean;
  error: AppError | null;
}

export class ErrorBoundary extends Component<Props, State> {
  private errorHandler = getErrorHandler();

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(): State {
    return {
      hasError: true,
      error: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, preserveState } = this.props;

    // Create app error with context
    const appError = this.errorHandler.handleError(error, {
      componentStack: errorInfo.componentStack || undefined,
      userAction: 'Component rendering',
      additionalInfo: {
        level: this.props.level || 'component',
      },
    });

    // Update state with the error
    this.setState({ error: appError });

    // Log to file
    this.errorHandler.logErrorToFile(appError);

    // Try to preserve unsaved changes if handler is provided
    if (preserveState && (this.props.level === 'app' || this.props.level === 'layout')) {
      const stateData = preserveState();
      this.errorHandler.preserveUnsavedChanges(stateData);
    }

    // Call custom error handler if provided
    if (onError) {
      onError(appError);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, level = 'component' } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <ErrorDisplay
          error={error}
          onReset={this.handleReset}
          onReload={this.handleReload}
          level={level}
        />
      );
    }

    return children;
  }
}

export default ErrorBoundary;
