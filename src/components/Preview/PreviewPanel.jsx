import React, { useState } from 'react';
import './PreviewPanel.css';

export const PreviewPanel = ({
  content = null,
  onClose = () => {},
}) => {
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [deviceMode, setDeviceMode] = useState('desktop'); // desktop, tablet, mobile

  const totalPages = 1; // Placeholder - will be calculated from actual content

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50));
  };

  const handleZoomReset = () => {
    setZoom(100);
  };

  const handleDeviceChange = (device) => {
    setDeviceMode(device);
  };

  const handlePageNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePagePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handlePageInput = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= totalPages) {
      setCurrentPage(value);
    }
  };

  return (
    <div className="preview-panel">
      {/* Header with controls */}
      <div className="preview-panel-header">
        <div className="preview-panel-header-left">
          <h2 className="preview-panel-title">Preview</h2>
        </div>

        <div className="preview-panel-header-center">
          {/* Device Switcher */}
          <div className="preview-device-switcher">
            <button
              className={`preview-device-btn ${deviceMode === 'desktop' ? 'active' : ''}`}
              onClick={() => handleDeviceChange('desktop')}
              title="Desktop view"
              aria-label="Desktop view"
            >
              🖥️
            </button>
            <button
              className={`preview-device-btn ${deviceMode === 'tablet' ? 'active' : ''}`}
              onClick={() => handleDeviceChange('tablet')}
              title="Tablet view"
              aria-label="Tablet view"
            >
              📱
            </button>
            <button
              className={`preview-device-btn ${deviceMode === 'mobile' ? 'active' : ''}`}
              onClick={() => handleDeviceChange('mobile')}
              title="Mobile view"
              aria-label="Mobile view"
            >
              📱
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="preview-zoom-controls">
            <button
              className="preview-zoom-btn"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              title="Zoom out"
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="preview-zoom-display">{zoom}%</span>
            <button
              className="preview-zoom-btn"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              title="Zoom in"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              className="preview-zoom-btn"
              onClick={handleZoomReset}
              title="Reset zoom"
              aria-label="Reset zoom"
            >
              ⟲
            </button>
          </div>
        </div>

        <div className="preview-panel-header-right">
          <button
            className="preview-panel-close"
            onClick={onClose}
            aria-label="Close preview"
          >
            ×
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="preview-panel-content">
        <div
          className={`preview-content-wrapper device-${deviceMode}`}
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <div className="preview-content-area">
            {content ? (
              <div className="preview-content-display">
                {/* Placeholder for actual content rendering */}
                {content}
              </div>
            ) : (
              <div className="preview-content-empty">
                <p>No content to preview</p>
                <p className="preview-content-empty-hint">
                  Import a document to see the preview here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer with page navigation */}
      <div className="preview-panel-footer">
        <div className="preview-page-navigation">
          <button
            className="preview-page-btn"
            onClick={handlePagePrev}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            ‹
          </button>

          <div className="preview-page-input-group">
            <input
              type="number"
              className="preview-page-input"
              value={currentPage}
              onChange={handlePageInput}
              min="1"
              max={totalPages}
              aria-label="Current page"
            />
            <span className="preview-page-separator">/</span>
            <span className="preview-page-total">{totalPages}</span>
          </div>

          <button
            className="preview-page-btn"
            onClick={handlePageNext}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            ›
          </button>
        </div>

        <div className="preview-footer-info">
          <span className="preview-device-indicator">
            Device: <strong>{deviceMode}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
