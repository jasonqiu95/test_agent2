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

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  // Check if node is selected
  const pos = getPos();
  const selected = view.state.selection.from === pos && view.state.selection.to === pos + node.nodeSize;

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
  const handleResizeStart = (e: React.MouseEvent, direction: 'se' | 'sw' | 'ne' | 'nw') => {
    e.preventDefault();
    e.stopPropagation();

    const img = imageRef.current;
    if (!img) return;

    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: dimensions.width || img.naturalWidth,
      height: dimensions.height || img.naturalHeight,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeStartRef.current) return;

      const deltaX = moveEvent.clientX - resizeStartRef.current.x;
      const deltaY = moveEvent.clientY - resizeStartRef.current.y;

      let newWidth = resizeStartRef.current.width;
      let newHeight = resizeStartRef.current.height;

      // Calculate new dimensions based on resize direction
      if (direction === 'se' || direction === 'ne') {
        newWidth = Math.max(50, resizeStartRef.current.width + deltaX);
      } else if (direction === 'sw' || direction === 'nw') {
        newWidth = Math.max(50, resizeStartRef.current.width - deltaX);
      }

      if (direction === 'se' || direction === 'sw') {
        newHeight = Math.max(50, resizeStartRef.current.height + deltaY);
      } else if (direction === 'ne' || direction === 'nw') {
        newHeight = Math.max(50, resizeStartRef.current.height - deltaY);
      }

      // Maintain aspect ratio if shift key is held
      if (moveEvent.shiftKey && img.naturalWidth && img.naturalHeight) {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        newHeight = newWidth / aspectRatio;
      }

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
              title="Resize from bottom-right corner (hold Shift to maintain aspect ratio)"
            />
          </div>
        )}

        {selected && dimensions.width && dimensions.height && (
          <div className="image-node-dimensions">
            {dimensions.width} × {dimensions.height}
          </div>
        )}
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
