import React, { useState, useRef, DragEvent, MouseEvent } from 'react';
import { NavigatorItem } from './Navigator';
import { Element } from '../../types/element';
import { Chapter } from '../../types/chapter';

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

    // Set isDragging state for visual feedback
    setIsDragging(true);

    // Notify parent component
    onDragStart?.(item.id, index, section);
  };

  const handleDragEnd = (event: DragEvent<HTMLLIElement>) => {
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
