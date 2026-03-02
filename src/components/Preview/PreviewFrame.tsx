import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectZoomLevel } from '../../store/previewSlice';
import './PreviewContent.css';

export type DeviceType = 'ipad' | 'kindle' | 'iphone' | 'print-spread' | 'desktop';

interface PreviewFrameProps {
  /** HTML content to render */
  content: string;
  /** CSS styles to apply */
  styles?: string;
  /** Device mode for styling */
  deviceMode?: DeviceType;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Callback when content updates */
  onContentUpdate?: (data: any) => void;
  /** Custom class name */
  className?: string;
}

/**
 * PreviewFrame component that renders HTML content in an iframe
 *
 * Features:
 * - Iframe-based rendering for style isolation
 * - Zoom control integration
 * - Device-specific dimensions
 * - Dynamic height adjustment
 * - Message passing API for content updates
 * - Loading and error states
 */
export const PreviewFrame: React.FC<PreviewFrameProps> = ({
  content = '',
  styles = '',
  deviceMode = 'desktop',
  isLoading = false,
  error = null,
  onContentUpdate,
  className = '',
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const zoomLevel = useAppSelector(selectZoomLevel);
  const [isFrameLoaded, setIsFrameLoaded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  // Device dimensions configuration
  const deviceDimensions: Record<DeviceType, { width: string; maxWidth: string; minHeight: string }> = {
    ipad: {
      width: '768px',
      maxWidth: '768px',
      minHeight: '1024px',
    },
    kindle: {
      width: '600px',
      maxWidth: '600px',
      minHeight: '800px',
    },
    iphone: {
      width: '375px',
      maxWidth: '375px',
      minHeight: '667px',
    },
    'print-spread': {
      width: '100%',
      maxWidth: '1400px',
      minHeight: '900px',
    },
    desktop: {
      width: '100%',
      maxWidth: '1200px',
      minHeight: '800px',
    },
  };

  const currentDimensions = deviceDimensions[deviceMode] || deviceDimensions.desktop;

  /**
   * Update iframe content with HTML and styles
   */
  const updateIframeContent = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      // Build the complete HTML document
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            /* Reset styles for consistent rendering */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            html, body {
              width: 100%;
              height: 100%;
              overflow-x: hidden;
              overflow-y: auto;
            }

            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              line-height: 1.6;
              color: #333;
              padding: 20px;
              background: white;
            }

            /* Custom user styles */
            ${styles}
          </style>
          <script>
            // Message passing API for content updates
            window.addEventListener('message', function(event) {
              if (event.data.type === 'updateContent') {
                document.body.innerHTML = event.data.content;

                // Notify parent of height change
                const height = document.documentElement.scrollHeight;
                window.parent.postMessage({
                  type: 'contentHeightChanged',
                  height: height
                }, '*');
              }

              if (event.data.type === 'updateStyles') {
                const styleElement = document.getElementById('custom-styles');
                if (styleElement) {
                  styleElement.textContent = event.data.styles;
                }
              }
            });

            // Send height updates on content changes
            const resizeObserver = new ResizeObserver(function() {
              const height = document.documentElement.scrollHeight;
              window.parent.postMessage({
                type: 'contentHeightChanged',
                height: height
              }, '*');
            });

            window.addEventListener('load', function() {
              resizeObserver.observe(document.body);

              // Initial height report
              const height = document.documentElement.scrollHeight;
              window.parent.postMessage({
                type: 'contentHeightChanged',
                height: height
              }, '*');
            });
          </script>
        </head>
        <body>
          ${content}
        </body>
        </html>
      `;

      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      setIsFrameLoaded(true);
    } catch (err) {
      console.error('Error updating iframe content:', err);
    }
  }, [content, styles]);

  /**
   * Handle messages from iframe
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'contentHeightChanged') {
        setContentHeight(event.data.height);
      }

      // Call custom update handler if provided
      onContentUpdate?.(event.data);
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onContentUpdate]);

  /**
   * Update iframe content when content or styles change
   */
  useEffect(() => {
    if (iframeRef.current && !isLoading) {
      updateIframeContent();
    }
  }, [content, styles, isLoading, updateIframeContent]);

  /**
   * Initialize iframe on mount
   */
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        setIsFrameLoaded(true);
      };
      iframe.addEventListener('load', handleLoad);
      return () => {
        iframe.removeEventListener('load', handleLoad);
      };
    }
  }, []);

  // Show error state
  if (error) {
    return (
      <div className={`preview-content ${className}`}>
        <div className="preview-content-error">
          <div className="preview-content-error-icon">⚠️</div>
          <h3 className="preview-content-error-title">Preview Error</h3>
          <p className="preview-content-error-message">{error}</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!content && !isLoading) {
    return (
      <div className={`preview-content ${className}`}>
        <div className="preview-content-empty">
          <div className="preview-content-empty-icon">📄</div>
          <p className="preview-content-empty-title">No content to preview</p>
          <p className="preview-content-empty-subtitle">
            Select a chapter or element to preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`preview-content ${className}`}>
      <div
        className={`preview-content-container device-${deviceMode}`}
        style={{
          width: currentDimensions.width,
          maxWidth: currentDimensions.maxWidth,
          minHeight: currentDimensions.minHeight,
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'top center',
        }}
      >
        <iframe
          ref={iframeRef}
          className="preview-content-iframe"
          title="Content Preview"
          sandbox="allow-same-origin allow-scripts"
          style={{
            width: '100%',
            minHeight: currentDimensions.minHeight,
            height: contentHeight > 0 ? `${contentHeight}px` : '100%',
            border: 'none',
            display: 'block',
            background: 'white',
          }}
        />
        {isLoading && !isFrameLoaded && (
          <div className="preview-content-loading">
            <div className="preview-content-spinner" />
            <p>Loading preview...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewFrame;
