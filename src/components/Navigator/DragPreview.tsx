import React from 'react';
import './DragPreview.css';

export interface DragPreviewProps {
  title: string;
  type: 'chapter' | 'element' | 'style';
  isDragging: boolean;
}

export const DragPreview: React.FC<DragPreviewProps> = ({
  title,
  type,
  isDragging,
}) => {
  if (!isDragging) return null;

  return (
    <div className={`drag-preview drag-preview-${type}`}>
      <div className="drag-preview-icon">
        {type === 'chapter' ? '📖' : type === 'style' ? '🎨' : '📄'}
      </div>
      <div className="drag-preview-content">
        <span className="drag-preview-title">{title}</span>
        <span className="drag-preview-badge">{type}</span>
      </div>
    </div>
  );
};

// Custom drag preview for native HTML5 drag-and-drop
export const createCustomDragImage = (
  title: string,
  type: 'chapter' | 'element' | 'style'
): HTMLElement => {
  const container = document.createElement('div');
  container.className = `drag-preview drag-preview-${type} drag-preview-custom`;

  const icon = document.createElement('div');
  icon.className = 'drag-preview-icon';
  icon.textContent = type === 'chapter' ? '📖' : type === 'style' ? '🎨' : '📄';

  const content = document.createElement('div');
  content.className = 'drag-preview-content';

  const titleEl = document.createElement('span');
  titleEl.className = 'drag-preview-title';
  titleEl.textContent = title;

  const badge = document.createElement('span');
  badge.className = 'drag-preview-badge';
  badge.textContent = type;

  content.appendChild(titleEl);
  content.appendChild(badge);
  container.appendChild(icon);
  container.appendChild(content);

  // Add to DOM temporarily for rendering
  container.style.position = 'absolute';
  container.style.top = '-1000px';
  container.style.left = '-1000px';
  document.body.appendChild(container);

  return container;
};

export const cleanupDragImage = (element: HTMLElement) => {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
};
