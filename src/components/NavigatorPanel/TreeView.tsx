import React, { useState, useRef, useEffect } from 'react';
import { Book } from '../../types/book';
import { Chapter } from '../../types/chapter';
import { Element } from '../../types/element';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSelectedElement } from '../../store/selectionSlice';
import { deleteFrontMatter, deleteChapter, deleteBackMatter } from '../../store/bookSlice';
import { ConfirmationDialog } from './ConfirmationDialog';
import { useTreeFilter, UseTreeFilterOptions } from '../../hooks/useTreeFilter';
import './TreeView.css';

export interface TreeViewProps {
  book: Book;
  selectedId?: string;
  onSelect?: (id: string, type: 'frontMatter' | 'chapter' | 'backMatter') => void;
  filterOptions?: UseTreeFilterOptions;
}

interface TreeSection {
  id: string;
  title: string;
  type: 'frontMatter' | 'chapters' | 'backMatter';
  items: (Element | Chapter)[];
}

export const TreeView: React.FC<TreeViewProps> = ({
  book,
  selectedId,
  onSelect,
  filterOptions = { searchQuery: '', typeFilter: 'all' }
}) => {
  const dispatch = useAppDispatch();
  const selectedElementId = useAppSelector((state) => state.selection.selectedElementId);
  const treeViewRef = useRef<HTMLDivElement>(null);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['frontMatter', 'chapters', 'backMatter'])
  );
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    itemId: string;
    itemTitle: string;
    itemType: 'frontMatter' | 'chapter' | 'backMatter';
  }>({
    isOpen: false,
    itemId: '',
    itemTitle: '',
    itemType: 'frontMatter',
  });

  // Use Redux state if available, otherwise fall back to prop
  const activeSelectedId = selectedElementId || selectedId;

  const { filteredSections, hasActiveFilter } = useTreeFilter(book, filterOptions);

  // Auto-expand sections when filtering
  useEffect(() => {
    if (hasActiveFilter) {
      const visibleSections = filteredSections
        .filter(section => section.visible)
        .map(section => section.id);
      setExpandedSections(new Set(visibleSections));
    }
  }, [hasActiveFilter, filteredSections]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleItemClick = (
    id: string,
    type: 'frontMatter' | 'chapters' | 'backMatter'
  ) => {
    // Update Redux state
    dispatch(setSelectedElement(id));

    // Call optional callback for backward compatibility
    if (onSelect) {
      const itemType =
        type === 'chapters' ? 'chapter' : type === 'frontMatter' ? 'frontMatter' : 'backMatter';
      onSelect(id, itemType);
    }
  };

  const getItemTitle = (item: Element | Chapter, type: string): string => {
    if (type === 'chapters') {
      const chapter = item as Chapter;
      const prefix = chapter.number !== undefined ? `Chapter ${chapter.number}` : 'Chapter';
      return chapter.title ? `${prefix}: ${chapter.title}` : prefix;
    }
    return item.title;
  };

  const handleDeleteClick = (
    e: React.MouseEvent,
    item: Element | Chapter,
    type: 'frontMatter' | 'chapters' | 'backMatter'
  ) => {
    e.stopPropagation();
    const itemType =
      type === 'chapters' ? 'chapter' : type === 'frontMatter' ? 'frontMatter' : 'backMatter';
    setDeleteDialog({
      isOpen: true,
      itemId: item.id,
      itemTitle: getItemTitle(item, type),
      itemType,
    });
  };

  const handleDeleteConfirm = () => {
    const { itemId, itemType } = deleteDialog;

    if (itemType === 'frontMatter') {
      dispatch(deleteFrontMatter(itemId));
    } else if (itemType === 'chapter') {
      dispatch(deleteChapter(itemId));
    } else if (itemType === 'backMatter') {
      dispatch(deleteBackMatter(itemId));
    }

    setDeleteDialog({
      isOpen: false,
      itemId: '',
      itemTitle: '',
      itemType: 'frontMatter',
    });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({
      isOpen: false,
      itemId: '',
      itemTitle: '',
      itemType: 'frontMatter',
    });
  };

  const highlightText = (text: string, matches: Array<{ start: number; end: number; field: 'title' | 'type' }>): React.ReactNode => {
    if (!matches || matches.length === 0) {
      return text;
    }

    const titleMatches = matches.filter(m => m.field === 'title');
    if (titleMatches.length === 0) {
      return text;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    titleMatches.forEach((match, index) => {
      if (match.start > lastIndex) {
        parts.push(text.substring(lastIndex, match.start));
      }
      parts.push(
        <mark key={index} className="search-highlight">
          {text.substring(match.start, match.end)}
        </mark>
      );
      lastIndex = match.end;
    });

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  // Get all visible items for keyboard navigation
  const getAllVisibleItems = () => {
    const items: Array<{ id: string; type: 'frontMatter' | 'chapters' | 'backMatter' }> = [];
    filteredSections.forEach((section) => {
      if (section.visible && expandedSections.has(section.id)) {
        const visibleItems = section.items.filter(fi => fi.visible);
        visibleItems.forEach((filteredItem) => {
          items.push({ id: filteredItem.item.id, type: section.type });
        });
      }
    });
    return items;
  };

  // Keyboard navigation for arrow keys and Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const visibleItems = getAllVisibleItems();
      if (visibleItems.length === 0) return;

      const currentIndex = activeSelectedId
        ? visibleItems.findIndex((item) => item.id === activeSelectedId)
        : -1;

      let newIndex = currentIndex;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        newIndex = currentIndex < visibleItems.length - 1 ? currentIndex + 1 : currentIndex;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
      } else if (e.key === 'Enter' && currentIndex !== -1) {
        e.preventDefault();
        const item = visibleItems[currentIndex];
        handleItemClick(item.id, item.type);
        return;
      } else {
        return;
      }

      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < visibleItems.length) {
        const newItem = visibleItems[newIndex];
        dispatch(setSelectedElement(newItem.id));
      }
    };

    const treeElement = treeViewRef.current;
    if (treeElement) {
      treeElement.addEventListener('keydown', handleKeyDown);
      return () => {
        treeElement.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [activeSelectedId, expandedSections, dispatch, filteredSections]);

  // Keyboard handler for Delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && activeSelectedId && !deleteDialog.isOpen) {
        const allItems = [
          ...book.frontMatter.map((item) => ({ ...item, sectionType: 'frontMatter' as const })),
          ...book.chapters.map((item) => ({ ...item, sectionType: 'chapters' as const })),
          ...book.backMatter.map((item) => ({ ...item, sectionType: 'backMatter' as const })),
        ];

        const selectedItem = allItems.find((item) => item.id === activeSelectedId);
        if (selectedItem) {
          const itemType =
            selectedItem.sectionType === 'chapters'
              ? 'chapter'
              : selectedItem.sectionType === 'frontMatter'
              ? 'frontMatter'
              : 'backMatter';

          setDeleteDialog({
            isOpen: true,
            itemId: selectedItem.id,
            itemTitle: getItemTitle(selectedItem, selectedItem.sectionType),
            itemType,
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeSelectedId, book, deleteDialog.isOpen]);

  return (
    <>
      <div className="tree-view" ref={treeViewRef} tabIndex={0} role="tree" aria-label="Book structure">
        {filteredSections.map((section) => {
          if (!section.visible) {
            return null;
          }

          const isExpanded = expandedSections.has(section.id);
          const visibleItems = section.items.filter(fi => fi.visible);
          const hasVisibleItems = visibleItems.length > 0;

          return (
            <div key={section.id} className="tree-section">
              <div
                className="tree-section-header"
                onClick={() => toggleSection(section.id)}
                role="treeitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSection(section.id);
                  }
                }}
                aria-expanded={isExpanded}
                aria-label={`${section.title} section`}
              >
                <span className={`tree-section-icon ${isExpanded ? 'expanded' : 'collapsed'}`}>
                  {isExpanded ? '▼' : '▶'}
                </span>
                <span className="tree-section-title">{section.title}</span>
                {hasVisibleItems && (
                  <span className="tree-section-count">
                    ({hasActiveFilter ? `${visibleItems.length}/${section.items.length}` : section.items.length})
                  </span>
                )}
              </div>

              {isExpanded && (
                <div className="tree-section-items" role="group">
                  {hasVisibleItems ? (
                    visibleItems.map((filteredItem) => {
                      const item = filteredItem.item;
                      const itemTitle = getItemTitle(item, section.type);

                      return (
                        <div
                          key={item.id}
                          className={`tree-item ${activeSelectedId === item.id ? 'selected' : ''}`}
                          onClick={() => handleItemClick(item.id, section.type)}
                          role="treeitem"
                          tabIndex={-1}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleItemClick(item.id, section.type);
                            }
                          }}
                          aria-selected={activeSelectedId === item.id}
                          aria-label={itemTitle}
                        >
                          <span className="tree-item-title">
                            {highlightText(itemTitle, filteredItem.matches)}
                          </span>
                          <button
                            className="tree-item-delete"
                            onClick={(e) => handleDeleteClick(e, item, section.type)}
                            aria-label={`Delete ${itemTitle}`}
                            title="Delete"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M6 2V3H3V4H4V13C4 13.5304 4.21071 14.0391 4.58579 14.4142C4.96086 14.7893 5.46957 15 6 15H10C10.5304 15 11.0391 14.7893 11.4142 14.4142C11.7893 14.0391 12 13.5304 12 13V4H13V3H10V2H6ZM5 4H11V13C11 13.2652 10.8946 13.5196 10.7071 13.7071C10.5196 13.8946 10.2652 14 10 14H6C5.73478 14 5.48043 13.8946 5.29289 13.7071C5.10536 13.5196 5 13.2652 5 13V4Z"
                                fill="currentColor"
                              />
                            </svg>
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="tree-empty-message">
                      {hasActiveFilter ? 'No matching items' : 'No items'}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <ConfirmationDialog
        isOpen={deleteDialog.isOpen}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteDialog.itemTitle}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};
