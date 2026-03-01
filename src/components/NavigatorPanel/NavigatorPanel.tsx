import React from 'react';
import './NavigatorPanel.css';

export interface NavigatorPanelProps {
  title?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const NavigatorPanel: React.FC<NavigatorPanelProps> = ({
  title = 'Navigator',
  children,
  footer,
  onClose,
  className = '',
}) => {
  return (
    <div className={`navigator-panel ${className}`}>
      <div className="navigator-panel-header">
        <h2 className="navigator-panel-title">{title}</h2>
        {onClose && (
          <button
            className="navigator-panel-close"
            onClick={onClose}
            aria-label="Close navigator panel"
          >
            ×
          </button>
        )}
      </div>

      <div className="navigator-panel-content">
        {children}
      </div>

      {footer && (
        <div className="navigator-panel-footer">
          {footer}
        </div>
      )}
    </div>
  );
};
