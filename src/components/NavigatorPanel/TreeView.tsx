import React, { useState, useRef, useEffect } from 'react';
import { Book } from '../../types/book';
import { Chapter } from '../../types/chapter';
import { Element } from '../../types/element';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSelectedElement } from '../../store/selectionSlice';
import './TreeView.css';

export interface TreeViewProps {
  book: Book;
  selectedId?: string;
  onSelect?: (id: string, type: 'frontMatter' | 'chapter' | 'backMatter') => void;
}

interface TreeSection {
  id: string;
  title: string;
  type: 'frontMatter' | 'chapters' | 'backMatter';
  items: (Element | Chapter)[];
}

export const TreeView: React.FC<TreeViewProps> = ({ book, selectedId, onSelect }) => {
  const dispatch = useAppDispatch();
  const selectedElementId = useAppSelector((state) => state.selection.selectedElementId);
  const treeViewRef = useRef<HTMLDivElement>(null);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['frontMatter', 'chapters', 'backMatter'])
  );

  // Use Redux state if available, otherwise fall back to prop
  const activeSelectedId = selectedElementId || selectedId;

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

  // Get all visible items for keyboard navigation
  const getAllVisibleItems = () => {
    const items: Array<{ id: string; type: 'frontMatter' | 'chapters' | 'backMatter' }> = [];
    sections.forEach((section) => {
      if (expandedSections.has(section.id) && section.items && section.items.length > 0) {
        section.items.forEach((item) => {
          items.push({ id: item.id, type: section.type });
        });
      }
    });
    return items;
  };

  // Keyboard navigation
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
  }, [activeSelectedId, expandedSections, dispatch]);

  return (
    <div className="tree-view" ref={treeViewRef} tabIndex={0}>
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        const hasItems = section.items && section.items.length > 0;

        return (
          <div key={section.id} className="tree-section">
            <div
              className="tree-section-header"
              onClick={() => toggleSection(section.id)}
              role="button"
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
              {hasItems && (
                <span className="tree-section-count">({section.items.length})</span>
              )}
            </div>

            {isExpanded && (
              <div className="tree-section-items">
                {hasItems ? (
                  section.items.map((item) => (
                    <div
                      key={item.id}
                      className={`tree-item ${activeSelectedId === item.id ? 'selected' : ''}`}
                      onClick={() => handleItemClick(item.id, section.type)}
                      role="button"
                      tabIndex={-1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleItemClick(item.id, section.type);
                        }
                      }}
                      aria-selected={activeSelectedId === item.id}
                      aria-label={getItemTitle(item, section.type)}
                    >
                      <span className="tree-item-title">
                        {getItemTitle(item, section.type)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="tree-empty-message">No items</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
