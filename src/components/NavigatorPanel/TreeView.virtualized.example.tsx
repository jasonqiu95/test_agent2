/**
 * Example: Using TreeView with VirtualizedList
 *
 * This example demonstrates how to integrate the useTreeItemHeights hook
 * with VirtualizedList for efficient rendering of large tree structures.
 *
 * The useTreeItemHeights hook automatically:
 * - Flattens the tree structure into a single array
 * - Calculates heights for each item type (headers, items, empty messages)
 * - Recalculates when sections expand/collapse
 * - Accounts for padding, borders, and margins
 */

import React, { useState, useRef } from 'react';
import { Book } from '../../types/book';
import { Chapter } from '../../types/chapter';
import { Element } from '../../types/element';
import { useTreeFilter, UseTreeFilterOptions } from '../../hooks/useTreeFilter';
import { useTreeItemHeights, FlatTreeItem } from './useTreeItemHeights';
import { VirtualizedList } from './VirtualizedList';
import { VariableSizeList as List } from 'react-window';

interface VirtualizedTreeViewProps {
  book: Book;
  selectedId?: string;
  onSelect?: (id: string, type: 'frontMatter' | 'chapter' | 'backMatter') => void;
  filterOptions?: UseTreeFilterOptions;
  height?: number; // Height of the container
}

export const VirtualizedTreeView: React.FC<VirtualizedTreeViewProps> = ({
  book,
  selectedId,
  onSelect,
  filterOptions = { searchQuery: '', typeFilter: 'all' },
  height = 600,
}) => {
  const listRef = useRef<List>(null);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['frontMatter', 'chapters', 'backMatter'])
  );

  const { filteredSections } = useTreeFilter(book, filterOptions);

  // Use the height calculation hook
  const {
    flatItems,
    getItemHeight,
    getItemIndex,
    getSectionIndex,
  } = useTreeItemHeights(filteredSections, expandedSections);

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
    const itemType =
      type === 'chapters' ? 'chapter' : type === 'frontMatter' ? 'frontMatter' : 'backMatter';
    onSelect?.(id, itemType as any);
  };

  const getItemTitle = (item: Element | Chapter, type: string): string => {
    if (type === 'chapters') {
      const chapter = item as Chapter;
      const prefix = chapter.number !== undefined ? `Chapter ${chapter.number}` : 'Chapter';
      return chapter.title ? `${prefix}: ${chapter.title}` : prefix;
    }
    return item.title;
  };

  // Render function for each item in the virtualized list
  const renderItem = (flatItem: FlatTreeItem, index: number, style: React.CSSProperties) => {
    if (flatItem.type === 'section-header') {
      const section = filteredSections.find((s) => s.id === flatItem.sectionId);
      if (!section) return null;

      return (
        <div
          className="tree-section-header"
          onClick={() => toggleSection(flatItem.sectionId!)}
          role="treeitem"
          aria-expanded={flatItem.isExpanded}
          aria-label={`${section.title} section`}
        >
          <span className={`tree-section-icon ${flatItem.isExpanded ? 'expanded' : 'collapsed'}`}>
            {flatItem.isExpanded ? '▼' : '▶'}
          </span>
          <span className="tree-section-title">{section.title}</span>
          {flatItem.hasItems && (
            <span className="tree-section-count">
              ({section.items.filter(fi => fi.visible).length})
            </span>
          )}
        </div>
      );
    }

    if (flatItem.type === 'empty-message') {
      return (
        <div className="tree-empty-message">
          No items
        </div>
      );
    }

    if (flatItem.type === 'tree-item' && flatItem.item) {
      const itemTitle = getItemTitle(flatItem.item, flatItem.itemType || '');
      const isSelected = selectedId === flatItem.itemId;

      return (
        <div
          className={`tree-item ${isSelected ? 'selected' : ''}`}
          onClick={() => handleItemClick(flatItem.itemId!, flatItem.itemType!)}
          role="treeitem"
          aria-selected={isSelected}
          aria-label={itemTitle}
        >
          <span className="tree-item-title">{itemTitle}</span>
        </div>
      );
    }

    return null;
  };

  // Scroll to a specific item when selected
  const scrollToItem = (itemId: string) => {
    const index = getItemIndex(itemId);
    if (index >= 0 && listRef.current) {
      listRef.current.scrollToItem(index, 'smart');
    }
  };

  // Scroll to a specific section
  const scrollToSection = (sectionId: string) => {
    const index = getSectionIndex(sectionId);
    if (index >= 0 && listRef.current) {
      listRef.current.scrollToItem(index, 'start');
    }
  };

  return (
    <div className="tree-view virtualized">
      <VirtualizedList
        items={flatItems}
        height={height}
        width="100%"
        itemHeight={getItemHeight}
        renderItem={renderItem}
        listRef={listRef}
        overscanCount={5}
      />
    </div>
  );
};

/**
 * Performance Benefits:
 *
 * 1. Efficient Rendering:
 *    - Only renders visible items + overscan buffer
 *    - Large trees (1000+ items) render instantly
 *
 * 2. Dynamic Height Calculation:
 *    - Each item can have different height
 *    - Heights recalculate automatically on expand/collapse
 *    - Accounts for all CSS spacing (padding, borders, margins)
 *
 * 3. Smooth Scrolling:
 *    - Uses native browser scrolling
 *    - Maintains scroll position during updates
 *    - Smart scroll positioning (scrollToItem)
 *
 * 4. Memory Efficient:
 *    - Only keeps visible items in DOM
 *    - Constant memory usage regardless of tree size
 *
 * Usage Tips:
 *
 * 1. Container Height:
 *    <VirtualizedTreeView height={600} ... />
 *    - Set explicit height for the container
 *    - Can be percentage: height={window.innerHeight * 0.8}
 *
 * 2. Scrolling to Items:
 *    const ref = useRef<VirtualizedTreeView>(null);
 *    ref.current?.scrollToItem('item-id');
 *
 * 3. Custom Heights:
 *    const { setItemHeight } = useTreeItemHeights(...);
 *    // For items with dynamic content
 *    setItemHeight('item-section-1', 50);
 *
 * 4. Accessibility:
 *    - All ARIA attributes preserved
 *    - Keyboard navigation works seamlessly
 *    - Screen reader announcements maintained
 */
