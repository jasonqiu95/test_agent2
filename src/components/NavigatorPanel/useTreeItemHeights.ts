import { useRef, useCallback, useMemo } from 'react';
import { Element } from '../../types/element';
import { Chapter } from '../../types/chapter';

/**
 * Constants for tree item dimensions based on CSS
 */
const DIMENSIONS = {
  // Section header: 8px padding top + 8px padding bottom + ~16px content height
  SECTION_HEADER_HEIGHT: 32,

  // Tree item: 8px padding top + 8px padding bottom + ~18px content height + 2px border + 2px margin
  TREE_ITEM_HEIGHT: 36,

  // Empty message: 12px padding top + 12px padding bottom + ~13px content height
  EMPTY_MESSAGE_HEIGHT: 37,

  // Section bottom margin
  SECTION_MARGIN: 4,

  // Items container top margin
  ITEMS_CONTAINER_MARGIN: 4,
} as const;

/**
 * Represents a flattened tree item for virtualization
 */
export interface FlatTreeItem {
  id: string;
  type: 'section-header' | 'tree-item' | 'empty-message';
  sectionId?: string;
  itemId?: string;
  itemType?: 'frontMatter' | 'chapters' | 'backMatter';
  item?: Element | Chapter;
  isExpanded?: boolean;
  hasItems?: boolean;
}

/**
 * Section data structure
 */
export interface TreeSection {
  id: string;
  title: string;
  type: 'frontMatter' | 'chapters' | 'backMatter';
  items: Array<{
    item: Element | Chapter;
    visible: boolean;
    matches?: Array<{ start: number; end: number; field: 'title' | 'type' }>;
  }>;
  visible: boolean;
}

/**
 * Hook for calculating dynamic heights of tree items in a virtualized list
 *
 * This hook handles:
 * - Collapsed sections (header only)
 * - Expanded sections (header + all visible items)
 * - Individual tree item heights
 * - Padding, borders, and nested indentation
 *
 * @param sections - Array of tree sections to calculate heights for
 * @param expandedSections - Set of expanded section IDs
 * @returns Object with flattened items and height calculation function
 *
 * @example
 * ```tsx
 * const { flatItems, getItemHeight } = useTreeItemHeights(sections, expandedSections);
 *
 * <VirtualizedList
 *   items={flatItems}
 *   itemHeight={getItemHeight}
 *   renderItem={(item, index, style) => (
 *     <div style={style}>
 *       {item.type === 'section-header' ? (
 *         <SectionHeader {...item} />
 *       ) : (
 *         <TreeItem {...item} />
 *       )}
 *     </div>
 *   )}
 * />
 * ```
 */
export const useTreeItemHeights = (
  sections: TreeSection[],
  expandedSections: Set<string>
) => {
  // Store custom heights for items that may have dynamic content
  const customHeightsRef = useRef<Map<string, number>>(new Map());

  /**
   * Flatten the tree structure into a single array of items
   * This is required for react-window's VariableSizeList
   */
  const flatItems = useMemo<FlatTreeItem[]>(() => {
    const items: FlatTreeItem[] = [];

    sections.forEach((section) => {
      if (!section.visible) {
        return;
      }

      const isExpanded = expandedSections.has(section.id);
      const visibleItems = section.items.filter(fi => fi.visible);
      const hasVisibleItems = visibleItems.length > 0;

      // Add section header
      items.push({
        id: `section-${section.id}`,
        type: 'section-header',
        sectionId: section.id,
        isExpanded,
        hasItems: hasVisibleItems,
      });

      // Add items if section is expanded
      if (isExpanded) {
        if (hasVisibleItems) {
          visibleItems.forEach((filteredItem) => {
            items.push({
              id: `item-${filteredItem.item.id}`,
              type: 'tree-item',
              sectionId: section.id,
              itemId: filteredItem.item.id,
              itemType: section.type,
              item: filteredItem.item,
            });
          });
        } else {
          // Add empty message
          items.push({
            id: `empty-${section.id}`,
            type: 'empty-message',
            sectionId: section.id,
          });
        }
      }
    });

    return items;
  }, [sections, expandedSections]);

  /**
   * Calculate the height of an item by index
   * This function is passed to react-window's itemSize prop
   */
  const getItemHeight = useCallback(
    (index: number): number => {
      const item = flatItems[index];
      if (!item) {
        return DIMENSIONS.TREE_ITEM_HEIGHT;
      }

      // Check for custom height first
      const customHeight = customHeightsRef.current.get(item.id);
      if (customHeight !== undefined) {
        return customHeight;
      }

      // Calculate default height based on item type
      switch (item.type) {
        case 'section-header':
          // Section header height + margin if not the last item
          return index < flatItems.length - 1
            ? DIMENSIONS.SECTION_HEADER_HEIGHT + DIMENSIONS.SECTION_MARGIN
            : DIMENSIONS.SECTION_HEADER_HEIGHT;

        case 'tree-item':
          // Tree item height includes padding, border, margin
          return DIMENSIONS.TREE_ITEM_HEIGHT;

        case 'empty-message':
          // Empty message height
          return DIMENSIONS.EMPTY_MESSAGE_HEIGHT;

        default:
          return DIMENSIONS.TREE_ITEM_HEIGHT;
      }
    },
    [flatItems]
  );

  /**
   * Set a custom height for a specific item
   * Useful for items with dynamic content (e.g., multi-line text)
   */
  const setItemHeight = useCallback((itemId: string, height: number) => {
    customHeightsRef.current.set(itemId, height);
  }, []);

  /**
   * Clear all custom heights
   * Useful when resetting or recalculating all heights
   */
  const clearCustomHeights = useCallback(() => {
    customHeightsRef.current.clear();
  }, []);

  /**
   * Get the total height of all items
   * Useful for calculating container sizes
   */
  const getTotalHeight = useCallback((): number => {
    let total = 0;
    for (let i = 0; i < flatItems.length; i++) {
      total += getItemHeight(i);
    }
    return total;
  }, [flatItems, getItemHeight]);

  /**
   * Get the index of a specific item by its ID
   * Useful for scrolling to a specific item
   */
  const getItemIndex = useCallback(
    (itemId: string): number => {
      return flatItems.findIndex((item) => item.itemId === itemId);
    },
    [flatItems]
  );

  /**
   * Get the index of a section header by section ID
   */
  const getSectionIndex = useCallback(
    (sectionId: string): number => {
      return flatItems.findIndex(
        (item) => item.type === 'section-header' && item.sectionId === sectionId
      );
    },
    [flatItems]
  );

  return {
    flatItems,
    getItemHeight,
    setItemHeight,
    clearCustomHeights,
    getTotalHeight,
    getItemIndex,
    getSectionIndex,
    // Expose dimensions for external use
    dimensions: DIMENSIONS,
  };
};

/**
 * Type for the return value of useTreeItemHeights
 */
export type UseTreeItemHeightsReturn = ReturnType<typeof useTreeItemHeights>;
