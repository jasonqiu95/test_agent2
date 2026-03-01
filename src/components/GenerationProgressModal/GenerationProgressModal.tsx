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
}

export const GenerationProgressModal: React.FC<GenerationProgressModalProps> = ({
  isOpen,
  onCancel,
  progress,
  status,
  generationType,
  title,
}) => {
  if (!isOpen) return null;

  const displayTitle = title || `Generating ${generationType}`;
  const progressPercent = Math.min(100, Math.max(0, progress));

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
