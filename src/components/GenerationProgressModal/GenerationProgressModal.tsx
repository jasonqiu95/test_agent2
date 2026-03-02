import React from 'react';
import './GenerationProgressModal.css';

export type GenerationType = 'EPUB' | 'PDF';

export interface GenerationProgressModalProps {
  isOpen: boolean;
  onCancel: () => void;
  progress: number;
  status: string;
  generationType: GenerationType;
  title?: string;
  eta?: number | null; // Estimated time remaining in milliseconds
  currentStep?: string; // Current step name (e.g., "Validating", "Rendering chapters", etc.)
  details?: string; // Additional details about the current operation
}

/**
 * Format milliseconds to human-readable time string
 */
function formatETA(ms: number | null): string {
  if (ms === null) {
    return 'Calculating...';
  }

  if (ms < 1000) {
    return 'Less than 1s';
  }

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${seconds}s`;
}

export const GenerationProgressModal: React.FC<GenerationProgressModalProps> = ({
  isOpen,
  onCancel,
  progress,
  status,
  generationType,
  title,
  eta,
  currentStep,
  details,
}) => {
  if (!isOpen) return null;

  const displayTitle = title || `Generating ${generationType}`;
  const progressPercent = Math.min(100, Math.max(0, progress));
  const etaText = formatETA(eta ?? null);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      className="generation-progress-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="generation-progress-title"
    >
      <div className="generation-progress-modal">
        <div className="generation-progress-header">
          <h2 id="generation-progress-title">{displayTitle}</h2>
          <button
            className="generation-progress-close"
            onClick={onCancel}
            aria-label="Cancel generation"
          >
            ×
          </button>
        </div>

        <div className="generation-progress-content">
          {currentStep && (
            <div className="generation-progress-step">
              <span className="generation-progress-step-label">Current step:</span>
              <span className="generation-progress-step-value">{currentStep}</span>
            </div>
          )}

          <div className="generation-progress-info">
            <div className="generation-progress-status">{status}</div>
            <div className="generation-progress-percentage">
              {progressPercent.toFixed(0)}%
            </div>
          </div>

          <div className="generation-progress-bar-container">
            <div
              className="generation-progress-bar"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          {details && (
            <div className="generation-progress-details">{details}</div>
          )}

          {eta !== undefined && eta !== null && progressPercent < 100 && (
            <div className="generation-progress-eta">
              <span className="generation-progress-eta-label">Estimated time remaining:</span>
              <span className="generation-progress-eta-value">{etaText}</span>
            </div>
          )}
        </div>

        <div className="generation-progress-footer">
          <button
            className="generation-progress-btn-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
