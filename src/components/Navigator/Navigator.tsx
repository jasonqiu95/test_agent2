import React, { useState, useCallback, KeyboardEvent, MouseEvent, DragEvent } from 'react';
import { Chapter } from '../../types/chapter';
import { Element } from '../../types/element';
import { Book } from '../../types/book';
import { BookStyle } from '../../types/style';
import { DragTypes } from '../../constants/dragTypes';
import type { TreeItemDragData } from '../../types/drag';
import { TreeNode } from './TreeNode';
import { validateDrop, validateDropPosition } from './dragValidation';
import './Navigator.css';

export type NavigatorView = 'contents' | 'styles';
export type SectionType = 'frontMatter' | 'chapters' | 'backMatter';

export interface NavigatorItem {
  id: string;
  type: 'chapter' | 'element' | 'style';
  title: string;
  data: Chapter | Element | BookStyle;
  section?: SectionType;
}

export interface ReorderParams {
  itemId: string;
  itemType: 'frontMatter' | 'chapter' | 'backMatter';
  fromIndex: number;
  toIndex: number;
  section: SectionType;
}

export interface NavigatorProps {
  book?: Book;
  view?: NavigatorView;
  onViewChange?: (view: NavigatorView) => void;
  selectedIds?: string[];
  onSelect?: (ids: string[] | string, type?: string) => void;
  multiSelect?: boolean;
  className?: string;
  onReorder?: (params: ReorderParams) => void;
  disabled?: boolean;
}

export const Navigator: React.FC<NavigatorProps> = ({
  book: bookProp,
  view: controlledView,
  onViewChange,
  selectedIds: controlledSelectedIds,
  onSelect,
  multiSelect = true,
  className = '',
  onReorder,
  disabled = false,
}) => {
  const [internalView, setInternalView] = useState<NavigatorView>(controlledView || 'contents');
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  // Use book prop if provided, otherwise try Redux (for backwards compatibility)
  const book = bookProp;

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedItemData, setDraggedItemData] = useState<TreeItemDragData | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);
  const [isValidDropTarget, setIsValidDropTarget] = useState<boolean>(true);
  const [collapsedSections, setCollapsedSections] = useState<Set<SectionType>>(new Set());

  // Determine if selection is controlled or uncontrolled
  const isControlled = controlledSelectedIds !== undefined;
  const selectedIds = isControlled ? controlledSelectedIds : internalSelectedIds;

  // Determine if view is controlled or uncontrolled
  const isViewControlled = controlledView !== undefined;
  const currentView = isViewControlled ? controlledView : internalView;

  const handleViewChange = useCallback(
    (newView: NavigatorView) => {
      if (isViewControlled) {
        onViewChange?.(newView);
      } else {
        setInternalView(newView);
      }
    },
    [isViewControlled, onViewChange]
  );

  const handleSelectionChange = useCallback(
    (newSelectedIds: string[]) => {
      if (isControlled) {
        onSelect?.(newSelectedIds);
      } else {
        setInternalSelectedIds(newSelectedIds);
        onSelect?.(newSelectedIds);
      }
    },
    [isControlled, onSelect]
  );

  // Get items by section
  const getSectionItems = useCallback((section: SectionType): NavigatorItem[] => {
    if (!book) return [];

    if (section === 'frontMatter') {
      return book.frontMatter?.map((element) => ({
        id: element.id,
        type: 'element' as const,
        title: element.title,
        data: element,
        section: 'frontMatter' as const,
      })) || [];
    } else if (section === 'chapters') {
      return book.chapters?.map((chapter) => ({
        id: chapter.id,
        type: 'chapter' as const,
        title: chapter.title,
        data: chapter,
        section: 'chapters' as const,
      })) || [];
    } else {
      return book.backMatter?.map((element) => ({
        id: element.id,
        type: 'element' as const,
        title: element.title,
        data: element,
        section: 'backMatter' as const,
      })) || [];
    }
  }, [book]);

  // Get items based on current view
  const getItems = useCallback((): NavigatorItem[] => {
    if (!book) return [];

    if (currentView === 'contents') {
      const items: NavigatorItem[] = [];

      // Add front matter
      book.frontMatter?.forEach((element) => {
        items.push({
          id: element.id,
          type: 'element',
          title: element.title,
          data: element,
          section: 'frontMatter',
        });
      });

      // Add chapters
      book.chapters?.forEach((chapter) => {
        items.push({
          id: chapter.id,
          type: 'chapter',
          title: chapter.title,
          data: chapter,
          section: 'chapters',
        });
      });

      // Add back matter
      book.backMatter?.forEach((element) => {
        items.push({
          id: element.id,
          type: 'element',
          title: element.title,
          data: element,
          section: 'backMatter',
        });
      });

      return items;
    } else {
      // Styles view
      return (
        book.styles?.map((style) => ({
          id: style.id,
          type: 'style' as const,
          title: style.name,
          data: style,
        })) || []
      );
    }
  }, [book, currentView]);

  const items = getItems();

  const handleItemClick = useCallback(
    (itemId: string, index: number, event: MouseEvent) => {
      if (!multiSelect) {
        // Single select mode
        handleSelectionChange([itemId]);
        setLastSelectedIndex(index);
        return;
      }

      const isMetaKey = event.metaKey || event.ctrlKey;
      const isShiftKey = event.shiftKey;

      if (isShiftKey && lastSelectedIndex !== null) {
        // Range selection
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const rangeIds = items.slice(start, end + 1).map((item) => item.id);
        const newSelection = [...new Set([...selectedIds, ...rangeIds])];
        handleSelectionChange(newSelection);
      } else if (isMetaKey) {
        // Toggle selection
        const newSelection = selectedIds.includes(itemId)
          ? selectedIds.filter((id) => id !== itemId)
          : [...selectedIds, itemId];
        handleSelectionChange(newSelection);
        setLastSelectedIndex(index);
      } else {
        // Single selection
        handleSelectionChange([itemId]);
        setLastSelectedIndex(index);
      }
    },
    [multiSelect, lastSelectedIndex, selectedIds, items, handleSelectionChange]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (items.length === 0) return;

      const currentIndex = items.findIndex((item) => selectedIds.includes(item.id));

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : currentIndex;
        const nextId = items[nextIndex].id;

        if (event.shiftKey && multiSelect) {
          // Add to selection
          handleSelectionChange([...selectedIds, nextId]);
        } else {
          handleSelectionChange([nextId]);
        }
        setLastSelectedIndex(nextIndex);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        const prevId = items[prevIndex].id;

        if (event.shiftKey && multiSelect) {
          // Add to selection
          handleSelectionChange([...selectedIds, prevId]);
        } else {
          handleSelectionChange([prevId]);
        }
        setLastSelectedIndex(prevIndex);
      }
    },
    [items, selectedIds, multiSelect, handleSelectionChange]
  );

  const handleBlankAreaClick = useCallback(() => {
    handleSelectionChange([]);
    setLastSelectedIndex(null);
  }, [handleSelectionChange]);

  // Drag handlers
  const handleDragStart = useCallback(
    (e: DragEvent<HTMLLIElement>, item: NavigatorItem, index: number) => {
      if (disabled) return;

      console.log('dragstart:', { itemId: item.id, index, section: item.section });

      const dragData: TreeItemDragData = {
        type: item.section === 'frontMatter'
          ? DragTypes.FRONT_MATTER_ITEM
          : item.section === 'chapters'
          ? DragTypes.CHAPTER_ITEM
          : DragTypes.BACK_MATTER_ITEM,
        itemId: item.id,
        payload: {
          index,
          title: item.title,
          ...(item.type === 'chapter' ? { chapterId: item.id } : {}),
        },
      };

      setIsDragging(true);
      setDraggedItemId(item.id);
      setDraggedItemData(dragData);

      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/json', JSON.stringify(dragData));

      // Add dragging class
      (e.currentTarget as HTMLElement).classList.add('dragging');
    },
    [disabled]
  );

  const handleDragEnd = useCallback((e: DragEvent<HTMLLIElement>) => {
    setIsDragging(false);
    setDraggedItemId(null);
    setDraggedItemData(null);
    setDropTargetId(null);
    setDropPosition(null);
    setIsValidDropTarget(true);

    // Remove dragging class
    (e.currentTarget as HTMLElement).classList.remove('dragging');

    // Remove all drop-target and drop-blocked classes
    document.querySelectorAll('.drop-target, .drop-blocked').forEach((el) => {
      el.classList.remove('drop-target');
      el.classList.remove('drop-blocked');
    });
  }, []);

  const calculateDropPosition = useCallback((e: DragEvent<HTMLLIElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const midPoint = rect.top + rect.height / 2;
    return e.clientY < midPoint ? 'before' : 'after';
  }, []);

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLLIElement>, targetItem: NavigatorItem) => {
      if (disabled) return;

      e.preventDefault();
      e.stopPropagation();

      if (!draggedItemId || !draggedItemData) {
        console.log('dragover: no draggedItemId or draggedItemData');
        return;
      }

      console.log('dragover:', { targetItem: targetItem.id, draggedItemId });

      // Validate if this is a valid drop target
      const validation = validateDrop(draggedItemData, targetItem.section!);
      const canDrop = validation.canDrop;

      // Calculate drop position
      const position = calculateDropPosition(e);
      setDropTargetId(targetItem.id);
      setDropPosition(position);
      setIsValidDropTarget(canDrop);

      // Add appropriate class based on validation
      if (canDrop) {
        e.currentTarget.classList.add('drop-target');
        e.currentTarget.classList.remove('drop-blocked');
        e.dataTransfer.dropEffect = 'move';
      } else {
        e.currentTarget.classList.add('drop-blocked');
        e.currentTarget.classList.remove('drop-target');
        e.dataTransfer.dropEffect = 'none';
      }
    },
    [disabled, draggedItemId, draggedItemData, calculateDropPosition]
  );

  const handleDragLeave = useCallback((e: DragEvent<HTMLLIElement>) => {
    e.currentTarget.classList.remove('drop-target');
    e.currentTarget.classList.remove('drop-blocked');
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLLIElement>, targetItem: NavigatorItem, targetIndex: number) => {
      console.log('handleDrop called:', { targetItem: targetItem.id, targetIndex, draggedItemId, disabled, hasOnReorder: !!onReorder });

      e.preventDefault();
      e.stopPropagation();

      if (disabled || !draggedItemId || !onReorder) {
        console.log('handleDrop early return:', { disabled, draggedItemId, hasOnReorder: !!onReorder });
        return;
      }

      try {
        // Try to get drag data from dataTransfer (for real browser) or use state (for tests)
        let dragData: TreeItemDragData | null = null;

        const dragDataStr = e.dataTransfer.getData('application/json');
        console.log('dragDataStr:', dragDataStr);

        if (dragDataStr) {
          dragData = JSON.parse(dragDataStr) as TreeItemDragData;
        } else if (draggedItemData) {
          // Fall back to state data (for test environment)
          dragData = draggedItemData;
        }

        if (!dragData) {
          console.log('No drag data available');
          return;
        }

        console.log('dragData:', dragData);

        // Validate drop using validation function
        const validation = validateDrop(dragData, targetItem.section!);
        if (!validation.canDrop) {
          console.log('Invalid drop:', validation.reason);
          return;
        }

        // Get source section
        const sourceSection =
          dragData.type === DragTypes.FRONT_MATTER_ITEM
            ? 'frontMatter'
            : dragData.type === DragTypes.CHAPTER_ITEM
            ? 'chapters'
            : 'backMatter';

        console.log('sourceSection:', sourceSection, 'targetSection:', targetItem.section);

        // Get source and target indices
        const sectionItems = getSectionItems(sourceSection);
        console.log('sectionItems:', sectionItems.map(i => i.id));
        const sourceIndex = sectionItems.findIndex((item) => item.id === draggedItemId);
        console.log('sourceIndex:', sourceIndex);

        if (sourceIndex === -1) {
          console.log('Source index not found');
          return;
        }

        // Use stored drop position from dragOver event
        // If dropPosition is not set (edge case), calculate it from the event
        const position = dropPosition || calculateDropPosition(e);
        let finalTargetIndex = targetIndex;

        console.log('Drop debug:', {
          draggedItemId,
          targetItemId: targetItem.id,
          sourceIndex,
          targetIndex,
          position,
          sourceSection,
          targetSection: targetItem.section
        });

        // Validate drop position
        const isValidPosition = validateDropPosition(
          draggedItemId,
          targetItem.id,
          sourceIndex,
          finalTargetIndex,
          position
        );

        if (!isValidPosition) {
          console.log('Skipping reorder - invalid position (same position or no change)');
          return;
        }

        const itemType =
          sourceSection === 'frontMatter' ? 'frontMatter' :
          sourceSection === 'chapters' ? 'chapter' :
          'backMatter';

        console.log('Calling onReorder with:', {
          itemId: draggedItemId,
          itemType,
          fromIndex: sourceIndex,
          toIndex: finalTargetIndex,
          section: sourceSection,
        });

        onReorder({
          itemId: draggedItemId,
          itemType,
          fromIndex: sourceIndex,
          toIndex: finalTargetIndex,
          section: sourceSection,
        });
      } catch (error) {
        console.error('Error handling drop:', error);
      } finally {
        // Clean up
        e.currentTarget.classList.remove('drop-target');
        e.currentTarget.classList.remove('drop-blocked');
      }
    },
    [disabled, draggedItemId, draggedItemData, dropPosition, onReorder, getSectionItems, calculateDropPosition]
  );

  const handleSectionToggle = useCallback((section: SectionType) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  const handleKeyDownItem = useCallback(
    (e: KeyboardEvent<HTMLLIElement>, itemId: string, itemType: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect?.(itemId, itemType);
      } else if (e.key === 'Escape' && isDragging) {
        setIsDragging(false);
        setDraggedItemId(null);
        setDropTargetId(null);
        setDropPosition(null);
      }
    },
    [isDragging, onSelect]
  );


  if (!book) {
    return (
      <div className={`navigator ${className}`}>
        <div className="navigator-header">
          <div className="navigator-view-switcher">
            <button
              className={`view-button ${currentView === 'contents' ? 'active' : ''}`}
              onClick={() => handleViewChange('contents')}
              data-testid="view-button-contents"
            >
              Contents
            </button>
            <button
              className={`view-button ${currentView === 'styles' ? 'active' : ''}`}
              onClick={() => handleViewChange('styles')}
              data-testid="view-button-styles"
            >
              Styles
            </button>
          </div>
        </div>
        <div className="navigator-content" onClick={handleBlankAreaClick}>
          <div className="navigator-empty">No book loaded</div>
        </div>
      </div>
    );
  }

  // Render section
  const renderSection = (section: SectionType, title: string) => {
    const sectionItems = getSectionItems(section);
    const isCollapsed = collapsedSections.has(section);

    return (
      <div key={section} className="navigator-section">
        <div
          className="navigator-section-header"
          onClick={() => handleSectionToggle(section)}
          aria-label={`${title} section`}
        >
          <span className={`section-toggle ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
          <span className="section-title">{title}</span>
          <span className="section-count">({sectionItems.length})</span>
        </div>
        {!isCollapsed && (
          <ul className="navigator-section-list" data-section={section}>
            {sectionItems.length === 0 ? (
              <li className="navigator-empty-section">No items</li>
            ) : (
              sectionItems.map((item, index) => {
                const itemType = section === 'chapters' ? 'chapter' : section === 'frontMatter' ? 'element' : 'element';
                const showDropZoneBefore = dropTargetId === item.id && dropPosition === 'before';
                const showDropZoneAfter = dropTargetId === item.id && dropPosition === 'after';
                const dropZoneClass = isValidDropTarget ? 'drop-zone' : 'drop-zone drop-zone-blocked';

                return (
                  <React.Fragment key={item.id}>
                    {showDropZoneBefore && (
                      <div
                        className={`${dropZoneClass} drop-zone-before`}
                        data-testid={`drop-zone-before-${item.id}`}
                      />
                    )}
                    <li
                      className={`navigator-item ${selectedIds.includes(item.id) ? 'selected' : ''} ${
                        itemType
                      } ${draggedItemId === item.id ? 'dragging' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(item.id, index, e);
                      }}
                      onDragStart={(e) => handleDragStart(e, item, index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, item)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, item, index)}
                      onKeyDown={(e) => handleKeyDownItem(e, item.id, itemType)}
                      draggable={!disabled}
                      role="button"
                      tabIndex={0}
                      aria-label={`${item.title} - ${itemType}`}
                      data-testid={`navigator-item-${item.id}`}
                      data-item-id={item.id}
                      data-item-type={itemType}
                    >
                      <span className="navigator-item-title">{item.title}</span>
                    </li>
                    {showDropZoneAfter && (
                      <div
                        className={`${dropZoneClass} drop-zone-after`}
                        data-testid={`drop-zone-after-${item.id}`}
                      />
                    )}
                  </React.Fragment>
                );
              })
            )}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className={`navigator ${className}`} onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="navigator-header">
        <div className="navigator-view-switcher">
          <button
            className={`view-button ${currentView === 'contents' ? 'active' : ''}`}
            onClick={() => handleViewChange('contents')}
            data-testid="view-button-contents"
          >
            Contents
          </button>
          <button
            className={`view-button ${currentView === 'styles' ? 'active' : ''}`}
            onClick={() => handleViewChange('styles')}
            data-testid="view-button-styles"
          >
            Styles
          </button>
        </div>
      </div>

      <div className="navigator-content" onClick={handleBlankAreaClick}>
        {currentView === 'contents' ? (
          <>
            {renderSection('frontMatter', 'Front Matter')}
            {renderSection('chapters', 'Chapters')}
            {renderSection('backMatter', 'Back Matter')}
          </>
        ) : (
          <>
            {items.length === 0 ? (
              <div className="navigator-empty">No styles available</div>
            ) : (
              <ul className="navigator-list">
                {items.map((item, index) => (
                  <li
                    key={item.id}
                    className={`navigator-item ${selectedIds.includes(item.id) ? 'selected' : ''} ${
                      item.type
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemClick(item.id, index, e);
                    }}
                    data-testid={`navigator-item-${item.id}`}
                    data-item-id={item.id}
                    data-item-type={item.type}
                  >
                    <span className="navigator-item-title">{item.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {isDragging && <div className="drag-overlay" data-testid="drag-overlay" />}
    </div>
  );
};
