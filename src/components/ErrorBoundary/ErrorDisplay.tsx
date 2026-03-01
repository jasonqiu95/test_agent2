/**
 * Error Display Component
 * Shows user-friendly error messages with recovery options
 */

import React from 'react';
import { AppError } from '../../utils/errorHandler';
import './ErrorDisplay.css';

interface Props {
  error: AppError | null;
  onReset: () => void;
  onReload: () => void;
  level: 'app' | 'layout' | 'component';
}

export const ErrorDisplay: React.FC<Props> = ({
  error,
  onReset,
  onReload,
  level,
}) => {
  if (!error) {
    return null;
  }

  const isAppLevel = level === 'app';
  const showDetails = process.env.NODE_ENV === 'development';

  return (
    <div className={`error-display error-display--${level}`}>
      <div className="error-display__container">
        <div className="error-display__icon">
          <svg
            width="64"
            height="64"
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

        <h2 className="error-display__title">
          {isAppLevel ? 'Application Error' : 'Something went wrong'}
        </h2>

        <p className="error-display__message">{error.userMessage}</p>

        {error.context?.filePath && (
          <p className="error-display__file-path">
            File: {error.context.filePath}
          </p>
        )}

        <div className="error-display__actions">
          {error.recoverable && !isAppLevel && (
            <button
              className="error-display__button error-display__button--primary"
              onClick={onReset}
            >
              Try Again
            </button>
          )}

          <button
            className="error-display__button error-display__button--secondary"
            onClick={onReload}
          >
            {isAppLevel ? 'Restart Application' : 'Reload Page'}
          </button>

          {isAppLevel && (
            <button
              className="error-display__button error-display__button--tertiary"
              onClick={() => {
                const emergencySaves = JSON.parse(
                  localStorage.getItem('emergency-saves') || '[]'
                );
                console.log('Emergency saves:', emergencySaves);
                alert(
                  emergencySaves.length > 0
                    ? `Found ${emergencySaves.length} emergency save(s)`
                    : 'No emergency saves found'
                );
              }}
            >
              Check for Unsaved Changes
            </button>
          )}
        </div>

        {showDetails && (
          <details className="error-display__details">
            <summary>Technical Details</summary>
            <div className="error-display__technical">
              <p>
                <strong>Error Type:</strong> {error.type}
              </p>
              <p>
                <strong>Message:</strong> {error.message}
              </p>
              <p>
                <strong>Time:</strong> {error.timestamp.toLocaleString()}
              </p>
              {error.originalError?.stack && (
                <pre className="error-display__stack">
                  {error.originalError.stack}
                </pre>
              )}
              {error.context?.componentStack && (
                <pre className="error-display__stack">
                  {error.context.componentStack}
                </pre>
              )}
            </div>
          </details>
        )}

        <p className="error-display__help">
          If this problem persists, please contact support with the error
          details above.
        </p>
      </div>
    </div>
  );
};

export default ErrorDisplay;
