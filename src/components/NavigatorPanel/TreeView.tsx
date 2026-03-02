import React, { useState } from 'react';
import { Book } from '../../types/book';
import { Chapter } from '../../types/chapter';
import { Element } from '../../types/element';
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['frontMatter', 'chapters', 'backMatter'])
  );

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

  return (
    <div className="tree-view" role="tree" aria-label="Book structure">
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        const hasItems = section.items && section.items.length > 0;

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
              {hasItems && (
                <span className="tree-section-count">({section.items.length})</span>
              )}
            </div>

            {isExpanded && (
              <div className="tree-section-items" role="group">
                {hasItems ? (
                  section.items.map((item) => (
                    <div
                      key={item.id}
                      className={`tree-item ${selectedId === item.id ? 'selected' : ''}`}
                      onClick={() => handleItemClick(item.id, section.type)}
                      role="treeitem"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleItemClick(item.id, section.type);
                        }
                      }}
                      aria-selected={selectedId === item.id}
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
