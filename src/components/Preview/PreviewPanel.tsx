import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import {
  selectActiveChapter,
  selectSelectedElement,
  selectCurrentBookStyle,
} from '../../slices/bookSlice';
import { selectEditorContent } from '../../store/editorSlice';
import { selectDeviceMode } from '../../store/previewSlice';
import { renderPreview, DeviceType } from '../../utils/previewRenderer';
import { Element, Chapter, BookStyle } from '../../types';
import { usePreviewUpdate } from '../../hooks/usePreviewUpdate';
import { DeviceSelector } from './DeviceSelector';
import { ZoomControls } from './ZoomControls';
import { PageNavigator } from './PageNavigator';
import { PreviewFrame } from './PreviewFrame';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { DeviceChrome } from './DeviceChrome';
import './PreviewPanel.css';

interface PreviewPanelProps {
  /** Custom class name */
  className?: string;
  /** Callback when preview updates */
  onPreviewUpdate?: (html: string) => void;
}

/**
 * PreviewPanel component - Complete preview UI with all sub-components
 *
 * Features:
 * - DeviceSelector: Toggle between iPad, Kindle, iPhone, Print Spread
 * - ZoomControls: Zoom in/out, reset zoom
 * - PageNavigator: Navigate between pages, page counter
 * - PreviewFrame: Iframe-based content rendering
 * - LoadingState: Skeleton UI while rendering
 * - ErrorState: Graceful error handling
 * - DeviceChrome: Device bezels and styling
 * - Integration with usePreviewUpdate hook for debounced updates
 * - Responsive layout
 */
export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  className = '',
  onPreviewUpdate,
}) => {
  // Redux state selectors
  const activeChapter = useAppSelector(selectActiveChapter);
  const selectedElement = useAppSelector(selectSelectedElement);
  const bookStyle = useAppSelector(selectCurrentBookStyle);
  const editorContent = useAppSelector(selectEditorContent);
  const deviceMode = useAppSelector(selectDeviceMode);

  // Local state for preview
  const [previewHTML, setPreviewHTML] = useState<string>('');
  const [previewCSS, setPreviewCSS] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Use preview update hook for debounced updates
  const {
    previewContent,
    isUpdating,
    triggerUpdate,
    cancelPendingUpdates,
  } = usePreviewUpdate({
    debounceDelay: 400,
    useIdleCallback: true,
    onUpdateStart: () => setIsGenerating(true),
    onUpdateEnd: () => setIsGenerating(false),
  });

  // Determine which content to preview
  const contentToPreview = useMemo(() => {
    return activeChapter || selectedElement;
  }, [activeChapter, selectedElement]);

  // Map Redux device mode to DeviceType
  const deviceType: DeviceType = useMemo(() => {
    const deviceModeMap: Record<string, DeviceType> = {
      'iPad': 'ipad',
      'Kindle': 'kindle',
      'iPhone': 'iphone',
      'PrintSpread': 'print-spread',
    };
    return deviceModeMap[deviceMode] || 'ipad';
  }, [deviceMode]);

  // Generate preview HTML
  const generatePreviewHTML = useCallback(
    async (content: Element | Chapter | null, style: BookStyle | null, device: DeviceType) => {
      if (!content || !style) {
        setPreviewHTML('');
        setPreviewCSS('');
        setError(null);
        cancelPendingUpdates();
        return;
      }

      setError(null);

      try {
        // Convert Chapter to Element if needed
        const elementData: Element = 'content' in content && 'type' in content
          ? content as Element
          : {
              id: content.id,
              type: 'other' as const,
              matter: 'body' as const,
              title: 'title' in content ? content.title : 'Untitled',
              content: content.content,
              createdAt: content.createdAt,
              updatedAt: content.updatedAt,
            };

        // Render preview
        const result = renderPreview(elementData, style, device, {
          includePageBreaks: true,
          printOptimized: device === 'print-spread',
          useDetailedPagination: false,
        });

        const fullHTML = `
          <style>${result.css}</style>
          ${result.html}
        `;

        // Trigger debounced update
        triggerUpdate(fullHTML, 'text-edit');

        setPreviewHTML(result.html);
        setPreviewCSS(result.css);
        onPreviewUpdate?.(fullHTML);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate preview';
        setError(errorMessage);
        setIsGenerating(false);
      }
    },
    [triggerUpdate, cancelPendingUpdates, onPreviewUpdate]
  );

  // Regenerate preview when dependencies change
  useEffect(() => {
    generatePreviewHTML(contentToPreview, bookStyle, deviceType);
  }, [contentToPreview, bookStyle, deviceType, editorContent, generatePreviewHTML]);

  // Handle retry on error
  const handleRetry = useCallback(() => {
    setError(null);
    generatePreviewHTML(contentToPreview, bookStyle, deviceType);
  }, [contentToPreview, bookStyle, deviceType, generatePreviewHTML]);

  return (
    <div className={`preview-panel ${className}`}>
      {/* Toolbar with controls */}
      <div className="preview-panel__toolbar">
        <div className="preview-panel__toolbar-left">
          <h2 className="preview-panel__title">Preview</h2>
        </div>

        <div className="preview-panel__toolbar-center">
          <DeviceSelector />
        </div>

        <div className="preview-panel__toolbar-right">
          <ZoomControls />
        </div>
      </div>

      {/* Main preview area */}
      <div className="preview-panel__main">
        {error ? (
          <ErrorState
            error={error}
            title="Preview Generation Error"
            onRetry={handleRetry}
            onDismiss={() => setError(null)}
          />
        ) : isGenerating && !previewHTML ? (
          <LoadingState message="Generating preview..." showSkeleton={true} />
        ) : previewContent || previewHTML ? (
          <div className="preview-panel__preview-wrapper">
            <DeviceChrome deviceMode={deviceType}>
              <PreviewFrame
                content={previewContent || previewHTML}
                styles={previewCSS}
                deviceMode={deviceType}
                isLoading={isGenerating || isUpdating}
                error={error}
              />
            </DeviceChrome>
          </div>
        ) : (
          <div className="preview-panel__empty">
            <div className="preview-panel__empty-icon">📄</div>
            <h3 className="preview-panel__empty-title">No Content to Preview</h3>
            <p className="preview-panel__empty-subtitle">
              {!contentToPreview
                ? 'Select a chapter or element to preview'
                : !bookStyle
                ? 'No book style available'
                : 'No content available'}
            </p>
          </div>
        )}
      </div>

      {/* Footer with page navigation */}
      <div className="preview-panel__footer">
        <PageNavigator />
      </div>
    </div>
  );
};

export default PreviewPanel;
