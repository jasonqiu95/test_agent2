import React, { useState } from 'react';
import './FileSelectionDialog.css';

export interface FileSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelected: (filePath: string) => void;
  title?: string;
}

interface SelectDocxFileResult {
  canceled: boolean;
  filePath?: string;
  error?: string;
}

export const FileSelectionDialog: React.FC<FileSelectionDialogProps> = ({
  isOpen,
  onClose,
  onFileSelected,
  title = 'Select DOCX File',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose();
    }
  };

  const handleBrowseFile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await window.electron.invoke('fileDialog:selectDocx') as SelectDocxFileResult;

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (!result.canceled && result.filePath) {
        setSelectedFile(result.filePath);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      onFileSelected(selectedFile);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      setSelectedFile(null);
      setError(null);
      onClose();
    }
  };

  const getFileName = (path: string) => {
    return path.split(/[\\/]/).pop() || path;
  };

  return (
    <div
      className="file-selection-dialog-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-selection-dialog-title"
    >
      <div className="file-selection-dialog">
        <div className="file-selection-dialog-header">
          <h2 id="file-selection-dialog-title">{title}</h2>
          <button
            className="file-selection-dialog-close"
            onClick={handleCancel}
            aria-label="Close dialog"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        <div className="file-selection-dialog-content">
          <div className="file-selection-info">
            <p>Select a Word document (.docx) to import into your project.</p>
          </div>

          <div className="file-selection-area">
            <button
              className="file-selection-browse-btn"
              onClick={handleBrowseFile}
              disabled={isLoading}
            >
              {isLoading ? 'Selecting...' : 'Browse Files'}
            </button>

            {selectedFile && (
              <div className="file-selection-selected">
                <div className="file-selection-icon">📄</div>
                <div className="file-selection-details">
                  <div className="file-selection-name">{getFileName(selectedFile)}</div>
                  <div className="file-selection-path">{selectedFile}</div>
                </div>
              </div>
            )}

            {error && (
              <div className="file-selection-error">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
        </div>

        <div className="file-selection-dialog-footer">
          <button
            className="file-selection-btn-secondary"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="file-selection-btn-primary"
            onClick={handleImport}
            disabled={!selectedFile || isLoading}
          >
            {isLoading ? 'Loading...' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};
