import React from 'react';
import './LoadingState.css';

interface LoadingStateProps {
  /** Loading message to display */
  message?: string;
  /** Show skeleton UI instead of spinner (default: true) */
  showSkeleton?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * LoadingState component displays a loading indicator while preview is rendering
 *
 * Features:
 * - Animated spinner
 * - Skeleton UI for better perceived performance
 * - Customizable loading message
 * - Accessible loading announcements
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading preview...',
  showSkeleton = true,
  className = '',
}) => {
  if (showSkeleton) {
    return (
      <div className={`loading-state loading-state--skeleton ${className}`} role="status" aria-live="polite">
        <div className="loading-skeleton">
          <div className="skeleton-header">
            <div className="skeleton-line skeleton-line--title" />
            <div className="skeleton-line skeleton-line--subtitle" />
          </div>
          <div className="skeleton-content">
            <div className="skeleton-line skeleton-line--long" />
            <div className="skeleton-line skeleton-line--medium" />
            <div className="skeleton-line skeleton-line--long" />
            <div className="skeleton-line skeleton-line--short" />
            <div className="skeleton-line skeleton-line--medium" />
            <div className="skeleton-line skeleton-line--long" />
          </div>
        </div>
        <span className="loading-state__message" aria-label={message}>
          {message}
        </span>
      </div>
    );
  }

  return (
    <div className={`loading-state ${className}`} role="status" aria-live="polite">
      <div className="loading-state__spinner-container">
        <svg
          className="loading-state__spinner"
          viewBox="0 0 50 50"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="loading-state__spinner-circle"
            cx="25"
            cy="25"
            r="20"
            fill="none"
            strokeWidth="4"
          />
        </svg>
      </div>
      <p className="loading-state__message">{message}</p>
    </div>
  );
};

export default LoadingState;
