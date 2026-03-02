import React, { useState, useCallback, useRef } from 'react';
import { Book } from '../../types/book';
import { Chapter } from '../../types/chapter';
import { Element } from '../../types/element';
import './Navigator.css';

export interface NavigatorProps {
  book: Book;
  selectedId?: string;
  onSelect?: (id: string, type: 'frontMatter' | 'chapter' | 'backMatter') => void;
  onReorder?: (params: ReorderParams) => void;
  disabled?: boolean;
}

export interface ReorderParams {
  itemId: string;
  itemType: 'frontMatter' | 'chapter' | 'backMatter';
  fromIndex: number;
  toIndex: number;
  section: 'frontMatter' | 'chapters' | 'backMatter';
}

interface DragState {
  draggedItemId: string | null;
  draggedItemType: 'frontMatter' | 'chapter' | 'backMatter' | null;
  draggedFromSection: 'frontMatter' | 'chapters' | 'backMatter' | null;
  draggedFromIndex: number | null;
  dropTargetId: string | null;
  dropPosition: 'before' | 'after' | null;
}

interface TreeSection {
  id: string;
  title: string;
  type: 'frontMatter' | 'chapters' | 'backMatter';
  items: (Element | Chapter)[];
}

export const Navigator: React.FC<NavigatorProps> = ({
  book,
  selectedId,
  onSelect,
  onReorder,
  disabled = false,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['frontMatter', 'chapters', 'backMatter'])
  );

  const [dragState, setDragState] = useState<DragState>({
    draggedItemId: null,
    draggedItemType: null,
    draggedFromSection: null,
    draggedFromIndex: null,
    dropTargetId: null,
    dropPosition: null,
  });

  const dragOverlayRef = useRef<HTMLDivElement>(null);

  const sections: TreeSection[] = [
    {
      id: 'frontMatter',
      title: 'Front Matter',
      type: 'frontMatter',
      items: book.frontMatter || [],
    },
    {
      id: 'chapters',
      title: 'Chapters',
      type: 'chapters',
      items: book.chapters || [],
    },
    {
      id: 'backMatter',
      title: 'Back Matter',
      type: 'backMatter',
      items: book.backMatter || [],
    },
  ];

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const handleItemClick = useCallback(
    (id: string, type: 'frontMatter' | 'chapters' | 'backMatter') => {
      if (onSelect) {
        const itemType =
          type === 'chapters' ? 'chapter' : type === 'frontMatter' ? 'frontMatter' : 'backMatter';
        onSelect(id, itemType);
      }
    },
    [onSelect]
  );

  const getItemTitle = (item: Element | Chapter, type: string): string => {
    if (type === 'chapters') {
      const chapter = item as Chapter;
      const prefix = chapter.number !== undefined ? `Chapter ${chapter.number}` : 'Chapter';
      return chapter.title ? `${prefix}: ${chapter.title}` : prefix;
    }
    return item.title;
  };

  const canDrop = (
    draggedType: 'frontMatter' | 'chapter' | 'backMatter',
    targetSection: 'frontMatter' | 'chapters' | 'backMatter'
  ): boolean => {
    // Front matter can only be dropped in front matter section
    if (draggedType === 'frontMatter' && targetSection !== 'frontMatter') {
      return false;
    }
    // Back matter can only be dropped in back matter section
    if (draggedType === 'backMatter' && targetSection !== 'backMatter') {
      return false;
    }
    // Chapters can only be dropped in chapters section
    if (draggedType === 'chapter' && targetSection !== 'chapters') {
      return false;
    }
    return true;
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    item: Element | Chapter,
    sectionType: 'frontMatter' | 'chapters' | 'backMatter',
    index: number
  ) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    const itemType =
      sectionType === 'chapters' ? 'chapter' : sectionType === 'frontMatter' ? 'frontMatter' : 'backMatter';

    setDragState({
      draggedItemId: item.id,
      draggedItemType: itemType,
      draggedFromSection: sectionType,
      draggedFromIndex: index,
      dropTargetId: null,
      dropPosition: null,
    });

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);

    // Set drag image
    if (e.currentTarget) {
      const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-9999px';
      dragImage.setAttribute('data-drag-image', 'true');
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      requestAnimationFrame(() => {
        if (dragImage.parentNode) {
          dragImage.parentNode.removeChild(dragImage);
        }
      });
    }
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    targetItem: Element | Chapter,
    sectionType: 'frontMatter' | 'chapters' | 'backMatter'
  ) => {
    if (disabled || !dragState.draggedItemType) {
      return;
    }

    if (!canDrop(dragState.draggedItemType, sectionType)) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? 'before' : 'after';

    setDragState((prev) => ({
      ...prev,
      dropTargetId: targetItem.id,
      dropPosition: position,
    }));
  };

  const handleDragEnd = () => {
    setDragState({
      draggedItemId: null,
      draggedItemType: null,
      draggedFromSection: null,
      draggedFromIndex: null,
      dropTargetId: null,
      dropPosition: null,
    });
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetItem: Element | Chapter,
    sectionType: 'frontMatter' | 'chapters' | 'backMatter',
    targetIndex: number
  ) => {
    e.preventDefault();

    if (disabled || !dragState.draggedItemId || !dragState.draggedItemType || !dragState.draggedFromSection) {
      return;
    }

    if (!canDrop(dragState.draggedItemType, sectionType)) {
      handleDragEnd();
      return;
    }

    const section = sections.find((s) => s.type === sectionType);
    if (!section) {
      handleDragEnd();
      return;
    }

    let finalIndex = targetIndex;

    // Adjust index based on drop position
    if (dragState.dropPosition === 'after') {
      finalIndex = targetIndex + 1;
    }

    // Adjust index if moving within same section
    if (dragState.draggedFromSection === sectionType && dragState.draggedFromIndex !== null) {
      // If dragging from before the target, the indices shift when we remove the item
      if (dragState.draggedFromIndex < targetIndex) {
        finalIndex -= 1;
      }
    }

    // Don't trigger reorder if dropping in the same position
    if (
      dragState.draggedFromSection === sectionType &&
      dragState.draggedFromIndex === finalIndex
    ) {
      handleDragEnd();
      return;
    }

    if (onReorder) {
      onReorder({
        itemId: dragState.draggedItemId,
        itemType: dragState.draggedItemType,
        fromIndex: dragState.draggedFromIndex!,
        toIndex: finalIndex,
        section: sectionType,
      });
    }

    handleDragEnd();
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    action: () => void
  ) => {
    if (e.key === 'Escape') {
      handleDragEnd();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className={`navigator ${disabled ? 'navigator-disabled' : ''}`}>
      {dragState.draggedItemId && (
        <div
          ref={dragOverlayRef}
          className="drag-overlay"
          data-testid="drag-overlay"
        >
          Dragging...
        </div>
      )}

      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        const hasItems = section.items && section.items.length > 0;

        return (
          <div key={section.id} className="navigator-section">
            <div
              className="navigator-section-header"
              onClick={() => toggleSection(section.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, () => toggleSection(section.id))}
              aria-expanded={isExpanded}
              aria-label={`${section.title} section`}
            >
              <span className={`navigator-section-icon ${isExpanded ? 'expanded' : 'collapsed'}`}>
                {isExpanded ? '▼' : '▶'}
              </span>
              <span className="navigator-section-title">{section.title}</span>
              {hasItems && (
                <span className="navigator-section-count">({section.items.length})</span>
              )}
            </div>

            {isExpanded && (
              <div
                className={`navigator-section-items ${dragState.draggedItemType ? 'has-drag-active' : ''}`}
                data-section={section.type}
              >
                {hasItems ? (
                  section.items.map((item, index) => {
                    const isDragging = dragState.draggedItemId === item.id;
                    const isDropTarget = dragState.dropTargetId === item.id;
                    const showDropBefore = isDropTarget && dragState.dropPosition === 'before';
                    const showDropAfter = isDropTarget && dragState.dropPosition === 'after';
                    const isValidDropTarget = dragState.draggedItemType
                      ? canDrop(dragState.draggedItemType, section.type)
                      : false;

                    return (
                      <div key={item.id}>
                        {showDropBefore && (
                          <div className="drop-zone drop-zone-before" data-testid={`drop-zone-before-${item.id}`} />
                        )}
                        <div
                          className={`navigator-item ${selectedId === item.id ? 'selected' : ''} ${
                            isDragging ? 'dragging' : ''
                          } ${isDropTarget ? 'drop-target' : ''} ${
                            !isValidDropTarget && dragState.draggedItemType ? 'invalid-drop-target' : ''
                          }`}
                          draggable={!disabled}
                          onDragStart={(e) => handleDragStart(e, item, section.type, index)}
                          onDragOver={(e) => handleDragOver(e, item, section.type)}
                          onDrop={(e) => handleDrop(e, item, section.type, index)}
                          onDragEnd={handleDragEnd}
                          onClick={() => handleItemClick(item.id, section.type)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => handleKeyDown(e, () => handleItemClick(item.id, section.type))}
                          aria-selected={selectedId === item.id}
                          aria-label={getItemTitle(item, section.type)}
                          data-item-id={item.id}
                          data-item-type={section.type === 'chapters' ? 'chapter' : section.type}
                        >
                          <span className="navigator-item-title">
                            {getItemTitle(item, section.type)}
                          </span>
                        </div>
                        {showDropAfter && (
                          <div className="drop-zone drop-zone-after" data-testid={`drop-zone-after-${item.id}`} />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="navigator-empty-message">No items</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
