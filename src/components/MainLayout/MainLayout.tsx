import React, { useState } from 'react';
import { ResizablePanel } from '../ResizablePanel';
import './MainLayout.css';

export interface MainLayoutProps {
  navigator?: React.ReactNode;
  editor: React.ReactNode;
  preview?: React.ReactNode;
  showNavigator?: boolean;
  showPreview?: boolean;
  onToggleNavigator?: () => void;
  onTogglePreview?: () => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  navigator,
  editor,
  preview,
  showNavigator: controlledShowNavigator,
  showPreview: controlledShowPreview,
  onToggleNavigator,
  onTogglePreview,
}) => {
  const [internalShowNavigator, setInternalShowNavigator] = useState(true);
  const [internalShowPreview, setInternalShowPreview] = useState(true);

  const showNavigator = controlledShowNavigator !== undefined
    ? controlledShowNavigator
    : internalShowNavigator;

  const showPreview = controlledShowPreview !== undefined
    ? controlledShowPreview
    : internalShowPreview;

  const handleToggleNavigator = () => {
    if (onToggleNavigator) {
      onToggleNavigator();
    } else {
      setInternalShowNavigator(!internalShowNavigator);
    }
  };

  const handleTogglePreview = () => {
    if (onTogglePreview) {
      onTogglePreview();
    } else {
      setInternalShowPreview(!internalShowPreview);
    }
  };

  return (
    <div className="main-layout">
      <div className="main-layout-toolbar">
        <div className="main-layout-toolbar-left">
          <button
            className={`main-layout-toggle-btn ${showNavigator ? 'active' : ''}`}
            onClick={handleToggleNavigator}
            aria-label="Toggle Navigator"
            title="Toggle Navigator (Cmd+B)"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 2h4v12H2V2zm6 0h6v12H8V2z" />
            </svg>
            <span className="main-layout-toggle-label">Navigator</span>
          </button>
        </div>
        <div className="main-layout-toolbar-center">
          <h1 className="main-layout-title">Vellum</h1>
        </div>
        <div className="main-layout-toolbar-right">
          <button
            className={`main-layout-toggle-btn ${showPreview ? 'active' : ''}`}
            onClick={handleTogglePreview}
            aria-label="Toggle Preview"
            title="Toggle Preview (Cmd+Shift+P)"
          >
            <span className="main-layout-toggle-label">Preview</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 4C4 4 1 8 1 8s3 4 7 4 7-4 7-4-3-4-7-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="main-layout-container">
        {showNavigator && navigator && (
          <ResizablePanel
            position="left"
            minWidth={250}
            maxWidth={500}
            defaultWidth={300}
            isVisible={showNavigator}
            className="main-layout-navigator"
          >
            {navigator}
          </ResizablePanel>
        )}

        <div className="main-layout-editor">
          <div className="main-layout-editor-content">
            {editor}
          </div>
        </div>

        {showPreview && preview && (
          <ResizablePanel
            position="right"
            minWidth={400}
            maxWidth={800}
            defaultWidth={500}
            isVisible={showPreview}
            className="main-layout-preview"
          >
            {preview}
          </ResizablePanel>
        )}
      </div>
    </div>
  );
};
