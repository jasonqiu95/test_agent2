/**
 * ImageContextMenu Component
 * Combined component for image alignment controls and alt text editing
 *
 * Features:
 * - Alt text editor with accessibility indicators
 * - Image alignment options (inline, block, float left/right)
 * - Visual feedback for current alignment
 * - Updates image node attributes via ProseMirror transaction
 */

import React, { useState, useRef, useEffect } from 'react';
import { Node as PMNode } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { ImageAttrs } from '../types';
import { ImageAltTextEditor } from './ImageAltTextEditor';
import './ImageContextMenu.css';

export interface ImageContextMenuProps {
  /** The image node */
  node: PMNode;
  /** ProseMirror editor view */
  view: EditorView;
  /** Function to get current position of the node */
  getPos: () => number;
  /** Position for the menu (relative to viewport) */
  position?: { x?: number; y?: number; top?: number; left?: number };
  /** Callback when menu is closed */
  onClose?: () => void;
}

/**
 * Alignment option type
 */
export type ImageAlignment = 'inline' | 'block' | 'left' | 'right';

/**
 * Alignment button configuration
 */
interface AlignmentButton {
  type: ImageAlignment;
  label: string;
  icon: string;
  description: string;
}

const alignmentButtons: AlignmentButton[] = [
  {
    type: 'inline',
    label: 'Inline',
    icon: '↔',
    description: 'Inline with text',
  },
  {
    type: 'block',
    label: 'Block',
    icon: '▬',
    description: 'Center block',
  },
  {
    type: 'left',
    label: 'Float Left',
    icon: '◧',
    description: 'Float left with text wrap',
  },
  {
    type: 'right',
    label: 'Float Right',
    icon: '◨',
    description: 'Float right with text wrap',
  },
];

/**
 * Context menu for image nodes
 * Features:
 * - Alt text editor
 * - Accessibility indicator showing if alt text is missing
 * - Image alignment controls
 * - Quick actions for image properties
 */
export const ImageContextMenu: React.FC<ImageContextMenuProps> = ({
  node,
  view,
  getPos,
  position,
  onClose,
}) => {
  const attrs = node.attrs as ImageAttrs;
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentAlignment = (attrs.alignment as ImageAlignment) || 'inline';

  // Check if alt text is missing or empty
  const hasAltText = attrs.alt && attrs.alt.trim().length > 0;

  useEffect(() => {
    // Handle clicks outside the menu to close it
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    // Handle escape key to close menu
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  // Update alt text via ProseMirror transaction
  const handleUpdateAltText = (altText: string) => {
    const pos = getPos();
    const transaction = view.state.tr.setNodeMarkup(pos, undefined, {
      ...attrs,
      alt: altText,
    });
    view.dispatch(transaction);
  };

  /**
   * Handle alignment change
   */
  const handleAlignmentChange = (alignment: ImageAlignment) => {
    const pos = getPos();
    if (pos === undefined || pos < 0) return;

    // Create transaction to update node attributes
    const transaction = view.state.tr.setNodeMarkup(pos, undefined, {
      ...node.attrs,
      alignment,
    });

    // Dispatch the transaction
    view.dispatch(transaction);

    // Focus the editor
    view.focus();
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Calculate menu position - handle both old and new position formats
  const menuStyle: React.CSSProperties = position
    ? {
        position: position.x !== undefined || position.y !== undefined ? 'fixed' : 'absolute',
        ...(position.top !== undefined && { top: `${position.top}px` }),
        ...(position.left !== undefined && { left: `${position.left}px` }),
        ...(position.y !== undefined && { top: `${position.y}px` }),
        ...(position.x !== undefined && { left: `${position.x}px` }),
      }
    : {};

  return (
    <div className="image-context-menu-container" ref={menuRef}>
      {/* Accessibility badge indicator */}
      {!hasAltText && (
        <div
          className="alt-text-missing-badge"
          onClick={toggleMenu}
          title="Alt text missing - click to add"
          role="button"
          tabIndex={0}
          aria-label="Add alt text for accessibility"
        >
          <span className="badge-icon">⚠</span>
          <span className="badge-text">No alt text</span>
        </div>
      )}

      {/* Button to edit alt text when it exists */}
      {hasAltText && (
        <button
          className="edit-alt-text-button"
          onClick={toggleMenu}
          title="Edit alt text"
          aria-label="Edit image alt text"
        >
          <span className="edit-icon">✓</span>
          <span className="edit-text">Alt text</span>
        </button>
      )}

      {/* Context menu */}
      {isOpen && (
        <div className="image-context-menu" style={menuStyle}>
          <div className="context-menu-content">
            <div className="context-menu-header">
              <h3 className="context-menu-title">Image Properties</h3>
              <button
                className="context-menu-close"
                onClick={handleClose}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <div className="context-menu-body">
              {/* Alt text editor section */}
              <ImageAltTextEditor
                value={attrs.alt || ''}
                onUpdate={handleUpdateAltText}
                onClose={handleClose}
                autoFocus={true}
              />

              {/* Alignment controls section */}
              <div className="image-context-menu-content">
                <div className="image-context-menu-title">Image Alignment</div>
                <div className="image-context-menu-buttons">
                  {alignmentButtons.map((button) => (
                    <button
                      key={button.type}
                      className={`image-context-menu-button ${
                        currentAlignment === button.type ? 'active' : ''
                      }`}
                      onClick={() => handleAlignmentChange(button.type)}
                      title={button.description}
                      aria-label={button.label}
                      type="button"
                    >
                      <span className="button-icon">{button.icon}</span>
                      <span className="button-label">{button.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageContextMenu;
