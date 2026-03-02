import React, { useState, useCallback, KeyboardEvent, MouseEvent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentBook } from '../../slices/bookSlice';
import { Chapter } from '../../types/chapter';
import { Element } from '../../types/element';
import { BookStyle } from '../../types/style';
import './Navigator.css';

export type NavigatorView = 'contents' | 'styles';

export interface NavigatorItem {
  id: string;
  type: 'chapter' | 'element' | 'style';
  title: string;
  data: Chapter | Element | BookStyle;
}

export interface NavigatorProps {
  view?: NavigatorView;
  onViewChange?: (view: NavigatorView) => void;
  selectedIds?: string[];
  onSelect?: (ids: string[]) => void;
  multiSelect?: boolean;
  className?: string;
}

export const Navigator: React.FC<NavigatorProps> = ({
  view: controlledView,
  onViewChange,
  selectedIds: controlledSelectedIds,
  onSelect,
  multiSelect = true,
  className = '',
}) => {
  const [internalView, setInternalView] = useState<NavigatorView>(controlledView || 'contents');
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const book = useSelector(selectCurrentBook);

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
        });
      });

      // Add chapters
      book.chapters?.forEach((chapter) => {
        items.push({
          id: chapter.id,
          type: 'chapter',
          title: chapter.title,
          data: chapter,
        });
      });

      // Add back matter
      book.backMatter?.forEach((element) => {
        items.push({
          id: element.id,
          type: 'element',
          title: element.title,
          data: element,
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
        {items.length === 0 ? (
          <div className="navigator-empty">
            No {currentView === 'contents' ? 'content' : 'styles'} available
          </div>
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
      </div>
    </div>
  );
};
