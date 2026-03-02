/**
 * ImageContextMenu Component
 * Context menu that appears when an image is selected, providing quick access to alt text editing
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
  position?: { x: number; y: number };
  /** Callback when menu is closed */
  onClose?: () => void;
}

/**
 * Context menu for image nodes
 * Features:
 * - Alt text editor
 * - Accessibility indicator showing if alt text is missing
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

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Calculate menu position
  const menuStyle: React.CSSProperties = position
    ? {
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
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

      {/* Context menu */}
      {isOpen && (
        <div className="image-context-menu" style={menuStyle}>
          <div className="context-menu-content">
            <div className="context-menu-header">
              <h3 className="context-menu-title">Image Accessibility</h3>
              <button
                className="context-menu-close"
                onClick={handleClose}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <div className="context-menu-body">
              <ImageAltTextEditor
                value={attrs.alt || ''}
                onUpdate={handleUpdateAltText}
                onClose={handleClose}
                autoFocus={true}
              />
            </div>
          </div>
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
    </div>
  );
};
