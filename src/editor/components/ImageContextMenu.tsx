/**
 * ImageContextMenu Component
 * Floating toolbar for image alignment options
 *
 * Features:
 * - Appears when image is selected
 * - Buttons for inline, block, float-left, float-right alignment
 * - Visual feedback for current alignment
 * - Updates image node attributes via ProseMirror transaction
 */

import React from 'react';
import { EditorView } from 'prosemirror-view';
import { Node as PMNode } from 'prosemirror-model';
import './ImageContextMenu.css';

export interface ImageContextMenuProps {
  view: EditorView;
  node: PMNode;
  getPos: () => number;
  position?: { top: number; left: number };
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
 * ImageContextMenu component
 */
export const ImageContextMenu: React.FC<ImageContextMenuProps> = ({
  view,
  node,
  getPos,
  position,
}) => {
  const currentAlignment = (node.attrs.alignment as ImageAlignment) || 'inline';

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

  // Calculate position for the menu
  const menuStyle: React.CSSProperties = position
    ? {
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
      }
    : {};

  return (
    <div className="image-context-menu" style={menuStyle}>
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
  );
};

export default ImageContextMenu;
