import React, { useState, useEffect } from 'react';
import { Book } from '../../types/book';
import { Chapter } from '../../types/chapter';
import { Element } from '../../types/element';
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['frontMatter', 'chapters', 'backMatter'])
  );

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

  return (
    <div className="tree-view">
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
              {hasVisibleItems && (
                <span className="tree-section-count">
                  ({hasActiveFilter ? `${visibleItems.length}/${section.items.length}` : section.items.length})
                </span>
              )}
            </div>

            {isExpanded && (
              <div className="tree-section-items">
                {hasVisibleItems ? (
                  visibleItems.map((filteredItem) => {
                    const item = filteredItem.item;
                    const itemTitle = getItemTitle(item, section.type);

                    return (
                      <div
                        key={item.id}
                        className={`tree-item ${selectedId === item.id ? 'selected' : ''}`}
                        onClick={() => handleItemClick(item.id, section.type)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleItemClick(item.id, section.type);
                          }
                        }}
                        aria-selected={selectedId === item.id}
                        aria-label={itemTitle}
                      >
                        <span className="tree-item-title">
                          {highlightText(itemTitle, filteredItem.matches)}
                        </span>
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
  );
};
