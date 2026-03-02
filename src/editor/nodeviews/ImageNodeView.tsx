/**
 * ImageNodeView Component
 * Custom NodeView for rendering image nodes in ProseMirror editor
 *
 * Features:
 * - Image rendering with proper styling
 * - Loading states
 * - Error states for broken images
 * - Width/height styling
 * - Alignment modes (inline, block, float left/right)
 * - Selection border and resize handles when selected
 */

import React, { useState, useRef, useEffect } from 'react';
import { Node as PMNode } from 'prosemirror-model';
import { EditorView, NodeView, Decoration } from 'prosemirror-view';
import { ImageAttrs } from '../types';
import { ImageContextMenu } from '../components/ImageContextMenu';
import './ImageNodeView.css';

interface ImageNodeViewProps {
  node: PMNode;
  view: EditorView;
  getPos: () => number;
  decorations: Decoration[];
}

/**
 * React component for rendering image nodes
 */
const ImageNodeComponent: React.FC<ImageNodeViewProps> = ({
  node,
  view,
  getPos,
}) => {
  const attrs = node.attrs as ImageAttrs;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: attrs.width || null,
    height: attrs.height || null,
  });
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  // Check if node is selected
  const pos = getPos();
  const selected = view.state.selection.from === pos && view.state.selection.to === pos + node.nodeSize;

  // Update menu position when selection changes
  useEffect(() => {
    if (selected && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const editorRect = view.dom.getBoundingClientRect();

      // Position menu above the image
      setMenuPosition({
        top: rect.top - editorRect.top - 60, // 60px above the image
        left: rect.left - editorRect.left + rect.width / 2 - 100, // Center horizontally (assuming 200px menu width)
      });
    } else {
      setMenuPosition(null);
    }
  }, [selected, view]);

  // Handle image load
  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
  };

  // Handle image error
  const handleImageError = () => {
    setLoading(false);
    setError(true);
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, direction: 'n' | 's' | 'e' | 'w' | 'se' | 'sw' | 'ne' | 'nw') => {
    e.preventDefault();
    e.stopPropagation();

    const img = imageRef.current;
    if (!img) return;

    // Get editor width for max constraint
    const editorElement = view.dom.closest('.ProseMirror') as HTMLElement;
    const maxWidth = editorElement ? editorElement.offsetWidth - 40 : 9999; // 40px for padding

    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: dimensions.width || img.naturalWidth,
      height: dimensions.height || img.naturalHeight,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeStartRef.current || !img.naturalWidth || !img.naturalHeight) return;

      const deltaX = moveEvent.clientX - resizeStartRef.current.x;
      const deltaY = moveEvent.clientY - resizeStartRef.current.y;

      let newWidth = resizeStartRef.current.width;
      let newHeight = resizeStartRef.current.height;
      const aspectRatio = img.naturalWidth / img.naturalHeight;

      // Calculate new dimensions based on resize direction
      if (direction === 'e') {
        // East: only width changes
        newWidth = resizeStartRef.current.width + deltaX;
      } else if (direction === 'w') {
        // West: only width changes
        newWidth = resizeStartRef.current.width - deltaX;
      } else if (direction === 'n') {
        // North: only height changes
        newHeight = resizeStartRef.current.height - deltaY;
      } else if (direction === 's') {
        // South: only height changes
        newHeight = resizeStartRef.current.height + deltaY;
      } else if (direction === 'se' || direction === 'ne') {
        // Southeast or Northeast corners
        newWidth = resizeStartRef.current.width + deltaX;
      } else if (direction === 'sw' || direction === 'nw') {
        // Southwest or Northwest corners
        newWidth = resizeStartRef.current.width - deltaX;
      }

      // Apply constraints
      newWidth = Math.max(50, Math.min(maxWidth, newWidth));

      // Maintain aspect ratio by default, unless Shift key is held to override
      if (!moveEvent.shiftKey) {
        // Maintain aspect ratio (default behavior)
        newHeight = newWidth / aspectRatio;
      } else {
        // Shift key pressed: allow independent width/height changes
        if (direction === 'se' || direction === 'sw') {
          newHeight = resizeStartRef.current.height + deltaY;
        } else if (direction === 'ne' || direction === 'nw') {
          newHeight = resizeStartRef.current.height - deltaY;
        } else if (direction === 'n' || direction === 's') {
          // For edge handles, keep the height calculation as is
          // (already set above)
        } else {
          // For east/west edge handles, maintain height when Shift is pressed
          newHeight = resizeStartRef.current.height;
        }
      }

      // Apply minimum height constraint
      newHeight = Math.max(50, newHeight);

      setDimensions({
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;

      // Update the node attributes in ProseMirror
      const transaction = view.state.tr.setNodeMarkup(pos, undefined, {
        ...attrs,
        width: dimensions.width,
        height: dimensions.height,
      });
      view.dispatch(transaction);

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Get alignment class
  const getAlignmentClass = () => {
    const alignment = attrs.alignment || 'inline';
    return `image-node-${alignment}`;
  };

  // Build image style
  const imageStyle: React.CSSProperties = {};
  if (dimensions.width) imageStyle.width = `${dimensions.width}px`;
  if (dimensions.height) imageStyle.height = `${dimensions.height}px`;

  // Build container class
  const containerClasses = [
    'image-node-container',
    getAlignmentClass(),
    selected ? 'image-node-selected' : '',
    isResizing ? 'image-node-resizing' : '',
    loading ? 'image-node-loading' : '',
    error ? 'image-node-error' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      data-alignment={attrs.alignment}
      contentEditable={false}
    >
      <div className="image-node-wrapper">
        {loading && !error && (
          <div className="image-node-loading-indicator">
            <div className="loading-spinner"></div>
            <span>Loading image...</span>
          </div>
        )}

        {error ? (
          <div className="image-node-error-display">
            <div className="error-icon">⚠</div>
            <div className="error-message">
              <strong>Failed to load image</strong>
              <span className="error-src">{attrs.src}</span>
            </div>
          </div>
        ) : (
          <img
            ref={imageRef}
            src={attrs.src}
            alt={attrs.alt || ''}
            title={attrs.title || ''}
            style={imageStyle}
            onLoad={handleImageLoad}
            onError={handleImageError}
            draggable={false}
            className="image-node-img"
          />
        )}

        {selected && !error && !loading && (
          <div className="image-node-resize-handles">
            {/* Corner handles */}
            <div
              className="resize-handle resize-handle-nw"
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
              title="Resize from top-left corner"
            />
            <div
              className="resize-handle resize-handle-ne"
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
              title="Resize from top-right corner"
            />
            <div
              className="resize-handle resize-handle-sw"
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
              title="Resize from bottom-left corner"
            />
            <div
              className="resize-handle resize-handle-se"
              onMouseDown={(e) => handleResizeStart(e, 'se')}
              title="Resize from bottom-right corner"
            />
            {/* Edge handles */}
            <div
              className="resize-handle resize-handle-n"
              onMouseDown={(e) => handleResizeStart(e, 'n')}
              title="Resize from top edge (hold Shift to change height independently)"
            />
            <div
              className="resize-handle resize-handle-s"
              onMouseDown={(e) => handleResizeStart(e, 's')}
              title="Resize from bottom edge (hold Shift to change height independently)"
            />
            <div
              className="resize-handle resize-handle-e"
              onMouseDown={(e) => handleResizeStart(e, 'e')}
              title="Resize from right edge (hold Shift to change width independently)"
            />
            <div
              className="resize-handle resize-handle-w"
              onMouseDown={(e) => handleResizeStart(e, 'w')}
              title="Resize from left edge (hold Shift to change width independently)"
            />
          </div>
        )}

        {(selected || isResizing) && dimensions.width && dimensions.height && (
          <div className="image-node-dimensions">
            {dimensions.width} × {dimensions.height}
          </div>
        )}

        {/* Alt text editor context menu - show always to display accessibility indicator */}
        <ImageContextMenu
          node={node}
          view={view}
          getPos={getPos}
          position={selected && menuPosition ? menuPosition : undefined}
        />
      </div>
    </div>
  );
};

/**
 * ProseMirror NodeView class for image nodes
 */
export class ImageNodeView implements NodeView {
  dom: HTMLElement;
  contentDOM?: HTMLElement | null;
  node: PMNode;
  view: EditorView;
  getPos: () => number;

  constructor(
    node: PMNode,
    view: EditorView,
    getPos: () => number,
    decorations: Decoration[]
  ) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    // Create the DOM element
    this.dom = document.createElement('div');
    this.dom.className = 'prosemirror-image-node';

    // Render the React component
    this.renderComponent(decorations);
  }

  /**
   * Render the React component into the DOM
   */
  renderComponent(decorations: Decoration[]) {
    const root = (window as any).createRoot?.(this.dom) || {
      render: (element: React.ReactElement) => {
        // Fallback for older React versions
        const ReactDOM = require('react-dom');
        ReactDOM.render(element, this.dom);
      },
    };

    root.render(
      <ImageNodeComponent
        node={this.node}
        view={this.view}
        getPos={this.getPos}
        decorations={decorations}
      />
    );
  }

  /**
   * Update the node view when the node changes
   */
  update(node: PMNode, decorations: Decoration[]): boolean {
    if (node.type !== this.node.type) {
      return false;
    }

    this.node = node;
    this.renderComponent(decorations);
    return true;
  }

  /**
   * Handle node selection
   */
  selectNode() {
    this.dom.classList.add('ProseMirror-selectednode');
  }

  /**
   * Handle node deselection
   */
  deselectNode() {
    this.dom.classList.remove('ProseMirror-selectednode');
  }

  /**
   * Clean up when the node view is destroyed
   */
  destroy() {
    // Unmount React component
    const ReactDOM = require('react-dom');
    if (ReactDOM.unmountComponentAtNode) {
      ReactDOM.unmountComponentAtNode(this.dom);
    }
  }

  /**
   * Make the node view non-editable
   */
  stopEvent(event: Event): boolean {
    // Allow mousedown events for selection and resizing
    if (event.type === 'mousedown') {
      const target = event.target as HTMLElement;
      if (target.classList.contains('resize-handle')) {
        return true;
      }
    }
    return false;
  }

  /**
   * Ignore mutations to the DOM
   */
  ignoreMutation(
    mutation: MutationRecord | { type: 'selection'; target: Element }
  ): boolean {
    // Ignore all mutations since we handle updates through React
    return true;
  }
}

/**
 * Factory function to create ImageNodeView instances
 */
export function createImageNodeView(
  node: PMNode,
  view: EditorView,
  getPos: () => number,
  decorations: Decoration[]
): ImageNodeView {
  return new ImageNodeView(node, view, getPos, decorations);
}
