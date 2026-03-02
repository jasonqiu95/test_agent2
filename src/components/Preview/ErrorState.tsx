import React from 'react';
import './ErrorState.css';

interface ErrorStateProps {
  /** Error message to display */
  error: string | Error;
  /** Optional title (defaults to "Preview Error") */
  title?: string;
  /** Optional retry callback */
  onRetry?: () => void;
  /** Optional dismiss callback */
  onDismiss?: () => void;
  /** Custom class name */
  className?: string;
}

/**
 * ErrorState component displays error messages gracefully
 *
 * Features:
 * - Clear error messaging
 * - Optional retry functionality
 * - Optional dismiss functionality
 * - Accessible error announcements
 * - Stack trace expansion for Error objects
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  title = 'Preview Error',
  onRetry,
  onDismiss,
  className = '',
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  return (
    <div className={`error-state ${className}`} role="alert" aria-live="assertive">
      <div className="error-state__container">
        <div className="error-state__icon">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h3 className="error-state__title">{title}</h3>

        <p className="error-state__message">{errorMessage}</p>

        {errorStack && (
          <div className="error-state__details">
            <button
              className="error-state__details-toggle"
              onClick={() => setShowDetails(!showDetails)}
              aria-expanded={showDetails}
              aria-controls="error-stack-trace"
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </button>

            {showDetails && (
              <pre id="error-stack-trace" className="error-state__stack">
                {errorStack}
              </pre>
            )}
          </div>
        )}

        <div className="error-state__actions">
          {onRetry && (
            <button
              className="error-state__button error-state__button--primary"
              onClick={onRetry}
              aria-label="Retry loading preview"
            >
              Try Again
            </button>
          )}

          {onDismiss && (
            <button
              className="error-state__button error-state__button--secondary"
              onClick={onDismiss}
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
