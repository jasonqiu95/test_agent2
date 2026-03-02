import React, { useState, useRef, DragEvent, MouseEvent } from 'react';
import { NavigatorItem } from './Navigator';
import { Element } from '../../types/element';
import { Chapter } from '../../types/chapter';
import { createCustomDragImage, cleanupDragImage } from './DragPreview';

export interface TreeNodeProps {
  item: NavigatorItem;
  index: number;
  section: 'frontMatter' | 'chapters' | 'backMatter';
  isSelected: boolean;
  disabled?: boolean;
  onClick: (itemId: string, index: number, event: MouseEvent) => void;
  onDragStart?: (itemId: string, index: number, section: string) => void;
  onDragEnd?: () => void;
}

export interface DragData {
  itemId: string;
  itemType: 'chapter' | 'frontMatter' | 'backMatter';
  section: 'frontMatter' | 'chapters' | 'backMatter';
  fromIndex: number;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  item,
  index,
  section,
  isSelected,
  disabled = false,
  onClick,
  onDragStart,
  onDragEnd,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const originalPositionRef = useRef<{ index: number; section: string } | null>(null);
  const dragImageRef = useRef<HTMLElement | null>(null);

  const getDragItemType = (): 'chapter' | 'frontMatter' | 'backMatter' => {
    if (item.type === 'chapter') return 'chapter';

    const element = item.data as Element;
    if (element.matter === 'front') return 'frontMatter';
    if (element.matter === 'back') return 'backMatter';

    // Default fallback
    return section === 'chapters' ? 'chapter' : section === 'frontMatter' ? 'frontMatter' : 'backMatter';
  };

  const handleDragStart = (event: DragEvent<HTMLLIElement>) => {
    if (disabled) {
      event.preventDefault();
      return;
    }

    // Store original position for potential cancellation
    originalPositionRef.current = {
      index,
      section,
    };

    // Set drag data payload
    const dragData: DragData = {
      itemId: item.id,
      itemType: getDragItemType(),
      section,
      fromIndex: index,
    };

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    event.dataTransfer.setData('text/plain', item.id);

    // Create custom drag preview image
    try {
      const dragImage = createCustomDragImage(item.title, item.type);
      dragImageRef.current = dragImage;

      // Set the custom drag image with offset
      event.dataTransfer.setDragImage(dragImage, 20, 20);

      // Clean up after a short delay to ensure the image is captured
      setTimeout(() => {
        if (dragImageRef.current) {
          cleanupDragImage(dragImageRef.current);
        }
      }, 0);
    } catch (error) {
      console.warn('Failed to create custom drag preview:', error);
      // Fall back to default browser behavior
    }

    // Set isDragging state for visual feedback
    setIsDragging(true);

    // Notify parent component
    onDragStart?.(item.id, index, section);
  };

  const handleDragEnd = (event: DragEvent<HTMLLIElement>) => {
    // Clean up drag image if it still exists
    if (dragImageRef.current) {
      cleanupDragImage(dragImageRef.current);
      dragImageRef.current = null;
    }

    // Reset dragging state
    setIsDragging(false);
    originalPositionRef.current = null;

    // Notify parent component
    onDragEnd?.();
  };

  const handleClick = (event: MouseEvent<HTMLLIElement>) => {
    event.stopPropagation();
    onClick(item.id, index, event);
  };

  const getAriaLabel = (): string => {
    const position = index + 1;
    const sectionName = section === 'frontMatter'
      ? 'front matter'
      : section === 'backMatter'
        ? 'back matter'
        : 'chapters';

    return `${item.title}, ${sectionName} item ${position}, draggable`;
  };

  return (
    <li
      className={`navigator-item ${isSelected ? 'selected' : ''} ${item.type} ${isDragging ? 'dragging' : ''}`}
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      data-testid={`navigator-item-${item.id}`}
      data-item-id={item.id}
      data-item-type={item.type}
      role="button"
      tabIndex={0}
      aria-label={getAriaLabel()}
    >
      <span className="navigator-item-title">{item.title}</span>
    </li>
  );
};
