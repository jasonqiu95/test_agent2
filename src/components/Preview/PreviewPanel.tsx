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
import './PreviewPanel.css';

interface PreviewPanelProps {
  /** Custom class name */
  className?: string;
  /** Callback when preview updates */
  onPreviewUpdate?: (html: string) => void;
}

/**
 * PreviewPanel component connected to Redux store
 *
 * Features:
 * - Connects to Redux store to read book state, selected chapter/element, current style
 * - Regenerates preview HTML when book content or style changes
 * - Device mode selector (iPad, Kindle, iPhone, PrintSpread)
 * - Live preview updates on every edit
 * - Uses memoization to avoid unnecessary re-renders
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

  // Local state for preview HTML
  const [previewHTML, setPreviewHTML] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Determine which content to preview (active chapter or selected element)
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

  // Generate preview HTML with memoization
  const generatePreviewHTML = useCallback(
    async (content: Element | Chapter | null, style: BookStyle | null, device: DeviceType) => {
      if (!content || !style) {
        setPreviewHTML('');
        setError(null);
        return;
      }

      setIsGenerating(true);
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

        // Use requestIdleCallback for non-blocking rendering
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => {
            try {
              const result = renderPreview(elementData, style, device, {
                includePageBreaks: true,
                printOptimized: device === 'print-spread',
                useDetailedPagination: false, // Faster rendering for live preview
              });

              const fullHTML = `
                <style>${result.css}</style>
                ${result.html}
              `;

              setPreviewHTML(fullHTML);
              setIsGenerating(false);
              onPreviewUpdate?.(fullHTML);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to generate preview');
              setIsGenerating(false);
            }
          }, { timeout: 1000 });
        } else {
          // Fallback for environments without requestIdleCallback
          const result = renderPreview(elementData, style, device, {
            includePageBreaks: true,
            printOptimized: device === 'print-spread',
            useDetailedPagination: false,
          });

          const fullHTML = `
            <style>${result.css}</style>
            ${result.html}
          `;

          setPreviewHTML(fullHTML);
          setIsGenerating(false);
          onPreviewUpdate?.(fullHTML);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate preview');
        setIsGenerating(false);
      }
    },
    [onPreviewUpdate]
  );

  // Regenerate preview when dependencies change
  useEffect(() => {
    generatePreviewHTML(contentToPreview, bookStyle, deviceType);
  }, [contentToPreview, bookStyle, deviceType, editorContent, generatePreviewHTML]);

  return (
    <div className={`preview-panel ${className}`}>
      <div className="preview-panel__header">
        <h2 className="preview-panel__title">Preview</h2>
        <div className="preview-panel__device-mode">{deviceMode}</div>
        {isGenerating && (
          <div className="preview-panel__loading-indicator" title="Generating preview...">
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
        {error ? (
          <div className="preview-panel__error">
            Error: {error}
          </div>
        ) : previewHTML ? (
          <div
            className="preview-panel__preview"
            dangerouslySetInnerHTML={{ __html: previewHTML }}
          />
        ) : (
          <div className="preview-panel__placeholder">
            {!contentToPreview
              ? 'Select a chapter or element to preview'
              : !bookStyle
              ? 'No book style available'
              : 'No content to preview'}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;
