import React, { useEffect, useRef } from 'react';
import { usePreviewUpdate, UpdateType } from '../../hooks/usePreviewUpdate';
import './PreviewPanel.css';

interface PreviewPanelProps {
  /** Editor content to preview */
  content: string;
  /** Type of update (text-edit or navigation) */
  updateType?: UpdateType;
  /** Current chapter ID */
  chapterId?: string;
  /** Custom debounce delay in milliseconds */
  debounceDelay?: number;
  /** Custom class name */
  className?: string;
  /** Callback when preview updates */
  onPreviewUpdate?: (content: string) => void;
}

/**
 * PreviewPanel component with debounced updates
 *
 * Features:
 * - 300-500ms debounce for text edits
 * - Immediate updates for navigation events
 * - Visual loading indicator
 * - Automatic cancellation on chapter switch
 * - Uses requestIdleCallback for better performance
 */
export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  content,
  updateType = 'text-edit',
  chapterId,
  debounceDelay = 400,
  className = '',
  onPreviewUpdate,
}) => {
  const previousChapterIdRef = useRef<string | undefined>(chapterId);

  const {
    previewContent,
    isUpdating,
    triggerUpdate,
    cancelPendingUpdates,
  } = usePreviewUpdate({
    debounceDelay,
    useIdleCallback: true,
    onUpdateStart: () => {
      // Optional: Additional logic when update starts
    },
    onUpdateEnd: () => {
      // Optional: Additional logic when update ends
      if (onPreviewUpdate) {
        onPreviewUpdate(previewContent);
      }
    },
  });

  // Cancel pending updates when chapter changes
  useEffect(() => {
    if (chapterId !== undefined && chapterId !== previousChapterIdRef.current) {
      cancelPendingUpdates();
      previousChapterIdRef.current = chapterId;
    }
  }, [chapterId, cancelPendingUpdates]);

  // Trigger preview update when content changes
  useEffect(() => {
    triggerUpdate(content, updateType);
  }, [content, updateType, triggerUpdate]);

  return (
    <div className={`preview-panel ${className}`}>
      <div className="preview-panel__header">
        <h2 className="preview-panel__title">Preview</h2>
        {isUpdating && (
          <div className="preview-panel__loading-indicator" title="Updating preview...">
            <svg
              className="preview-panel__spinner"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="preview-panel__spinner-circle"
                cx="12"
                cy="12"
                r="10"
                fill="none"
                strokeWidth="2"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="preview-panel__content">
        {previewContent ? (
          <div
            className="preview-panel__text"
            dangerouslySetInnerHTML={{ __html: previewContent }}
          />
        ) : (
          <div className="preview-panel__placeholder">
            No content to preview
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;
