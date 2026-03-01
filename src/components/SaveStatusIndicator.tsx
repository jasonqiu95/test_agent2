import React from 'react';
import { SaveStatus } from '../services/persistence';

export interface SaveStatusIndicatorProps {
  /**
   * Current save status
   */
  status: SaveStatus;

  /**
   * Last error message (if status is 'error')
   */
  lastError?: string;

  /**
   * Callback when user clicks reload for conflict resolution
   */
  onReload?: () => void;

  /**
   * Custom className for styling
   */
  className?: string;
}

/**
 * Visual indicator for save status
 *
 * @example
 * ```tsx
 * const { saveStatus, lastError, reloadFile } = useAutoSave(book);
 *
 * <SaveStatusIndicator
 *   status={saveStatus}
 *   lastError={lastError}
 *   onReload={reloadFile}
 * />
 * ```
 */
export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  lastError,
  onReload,
  className = '',
}) => {
  const getStatusDisplay = () => {
    switch (status) {
      case 'idle':
        return null; // Don't show anything when idle

      case 'saving':
        return (
          <div className={`save-status saving ${className}`}>
            <span className="spinner">⏳</span>
            <span>Saving...</span>
          </div>
        );

      case 'saved':
        return (
          <div className={`save-status saved ${className}`}>
            <span className="checkmark">✓</span>
            <span>All changes saved</span>
          </div>
        );

      case 'error':
        return (
          <div className={`save-status error ${className}`}>
            <span className="error-icon">⚠️</span>
            <span>Save failed: {lastError || 'Unknown error'}</span>
          </div>
        );

      case 'conflict':
        return (
          <div className={`save-status conflict ${className}`}>
            <span className="conflict-icon">⚠️</span>
            <span>File modified externally</span>
            {onReload && (
              <button onClick={onReload} className="reload-button">
                Reload
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return <>{getStatusDisplay()}</>;
};

/**
 * Compact version of save status indicator (icon only)
 *
 * @example
 * ```tsx
 * <SaveStatusIndicatorCompact status={saveStatus} />
 * ```
 */
export const SaveStatusIndicatorCompact: React.FC<{
  status: SaveStatus;
  title?: string;
}> = ({ status, title }) => {
  const getIcon = () => {
    switch (status) {
      case 'saving':
        return <span title={title || 'Saving...'}>⏳</span>;
      case 'saved':
        return <span title={title || 'All changes saved'}>✓</span>;
      case 'error':
        return <span title={title || 'Save failed'}>⚠️</span>;
      case 'conflict':
        return <span title={title || 'File conflict'}>⚠️</span>;
      default:
        return null;
    }
  };

  return <span className="save-status-compact">{getIcon()}</span>;
};
