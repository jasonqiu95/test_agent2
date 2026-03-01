/**
 * Loading Overlay Component
 * Displays loading state during chapter transitions
 */

import React from 'react';

export interface LoadingOverlayProps {
  chapterTitle?: string;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  chapterTitle,
  message = 'Loading chapter...',
}) => {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner" />
        <p className="loading-message">{message}</p>
        {chapterTitle && <p className="loading-chapter">{chapterTitle}</p>}
      </div>
    </div>
  );
};
