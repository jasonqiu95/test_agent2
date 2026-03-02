/**
 * ImageAltTextEditor Component
 * Provides an input field for editing image alt text with character count and accessibility features
 */

import React, { useState, useEffect, useRef } from 'react';
import './ImageAltTextEditor.css';

export interface ImageAltTextEditorProps {
  /** Current alt text value */
  value: string;
  /** Callback when alt text is updated */
  onUpdate: (altText: string) => void;
  /** Callback when editor is closed */
  onClose?: () => void;
  /** Maximum character count (optional) */
  maxLength?: number;
  /** Auto-focus the input when mounted */
  autoFocus?: boolean;
}

/**
 * Alt text editor component for images
 * Features:
 * - Input field for editing alt text
 * - Character count display
 * - Placeholder text for guidance
 * - Keyboard shortcuts (Enter to save, Escape to close)
 */
export const ImageAltTextEditor: React.FC<ImageAltTextEditorProps> = ({
  value,
  onUpdate,
  onClose,
  maxLength = 250,
  autoFocus = true,
}) => {
  const [altText, setAltText] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Update parent when alt text changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setAltText(newValue);
    onUpdate(newValue);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose?.();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onClose?.();
    }
  };

  // Handle blur to save changes
  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const characterCount = altText.length;
  const isOverLimit = maxLength && characterCount > maxLength;
  const characterCountClass = isOverLimit ? 'character-count-over' : '';

  return (
    <div className={`image-alt-text-editor ${isFocused ? 'focused' : ''}`}>
      <div className="alt-text-editor-header">
        <label htmlFor="alt-text-input" className="alt-text-label">
          Alt Text
        </label>
        <span className={`character-count ${characterCountClass}`}>
          {characterCount}{maxLength ? ` / ${maxLength}` : ''}
        </span>
      </div>

      <textarea
        ref={inputRef}
        id="alt-text-input"
        className="alt-text-input"
        value={altText}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Describe this image for accessibility"
        maxLength={maxLength}
        rows={3}
        aria-label="Image alt text"
      />

      <div className="alt-text-editor-footer">
        <span className="alt-text-hint">
          Tip: Describe the image for screen readers
        </span>
        {onClose && (
          <span className="keyboard-hint">
            Press Esc to close, ⌘+Enter to save
          </span>
        )}
      </div>
    </div>
  );
};
