import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './PreviewContent.css';

/**
 * PreviewContent component that renders book content using iframe for style isolation.
 * Provides a sandboxed environment for rendering HTML content with custom CSS styles.
 */
export const PreviewContent = ({
  content = '',
  styles = '',
  deviceMode = 'desktop',
  onContentUpdate = null,
  className = '',
}) => {
  const iframeRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  // Device dimensions configuration
  const deviceDimensions = {
    desktop: {
      width: '100%',
      maxWidth: '1200px',
      minHeight: '800px',
    },
    tablet: {
      width: '768px',
      maxWidth: '768px',
      minHeight: '1024px',
    },
    mobile: {
      width: '375px',
      maxWidth: '375px',
      minHeight: '667px',
    },
  };

  const currentDimensions = deviceDimensions[deviceMode] || deviceDimensions.desktop;

  /**
   * Update iframe content with HTML and styles
   */
  const updateIframeContent = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

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

      setIsLoaded(true);
    } catch (error) {
      console.error('Error updating iframe content:', error);
    }
  };

  /**
   * Handle messages from iframe
   */
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'contentHeightChanged') {
        setContentHeight(event.data.height);
      }

      // Call custom update handler if provided
      if (onContentUpdate) {
        onContentUpdate(event.data);
      }
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
    if (iframeRef.current) {
      updateIframeContent();
    }
  }, [content, styles]);

  /**
   * Initialize iframe on mount
   */
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', () => {
        setIsLoaded(true);
      });
    }
  }, []);

  /**
   * Public API for updating content via message passing
   */
  useEffect(() => {
    if (iframeRef.current && isLoaded) {
      const iframe = iframeRef.current;
      const iframeWindow = iframe.contentWindow;

      // Expose API for external updates
      iframeRef.current.updateContent = (newContent) => {
        if (iframeWindow) {
          iframeWindow.postMessage(
            { type: 'updateContent', content: newContent },
            '*'
          );
        }
      };

      iframeRef.current.updateStyles = (newStyles) => {
        if (iframeWindow) {
          iframeWindow.postMessage(
            { type: 'updateStyles', styles: newStyles },
            '*'
          );
        }
      };
    }
  }, [isLoaded]);

  return (
    <div className={`preview-content ${className}`}>
      <div
        className={`preview-content-container device-${deviceMode}`}
        style={{
          width: currentDimensions.width,
          maxWidth: currentDimensions.maxWidth,
          minHeight: currentDimensions.minHeight,
        }}
      >
        {!content ? (
          <div className="preview-content-empty">
            <div className="preview-content-empty-icon">📄</div>
            <p className="preview-content-empty-title">No content to preview</p>
            <p className="preview-content-empty-subtitle">
              Add content to see it rendered here
            </p>
          </div>
        ) : (
          <>
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
              }}
            />
            {!isLoaded && (
              <div className="preview-content-loading">
                <div className="preview-content-spinner" />
                <p>Loading preview...</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

PreviewContent.propTypes = {
  content: PropTypes.string,
  styles: PropTypes.string,
  deviceMode: PropTypes.oneOf(['desktop', 'tablet', 'mobile']),
  onContentUpdate: PropTypes.func,
  className: PropTypes.string,
};

export default PreviewContent;
