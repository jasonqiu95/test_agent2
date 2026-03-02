import React, { useRef, useCallback, useEffect, useState } from 'react';
import { VariableSizeList as List, ListChildComponentProps } from 'react-window';
import './VirtualizedList.css';

export interface VirtualizedListProps<T = any> {
  /** Array of items to render */
  items: T[];
  /** Height of the list container in pixels */
  height: number;
  /** Width of the list container in pixels or string (e.g., '100%') */
  width?: number | string;
  /** Function to get the height of each item by index */
  itemHeight: (index: number) => number;
  /** Render prop for each list item */
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  /** Number of items to render outside the visible area (default: 3) */
  overscanCount?: number;
  /** Optional className for the list container */
  className?: string;
  /** Optional ref for the list instance */
  listRef?: React.Ref<List>;
  /** Callback when items are rendered (useful for tracking visible range) */
  onItemsRendered?: (params: {
    overscanStartIndex: number;
    overscanStopIndex: number;
    visibleStartIndex: number;
    visibleStopIndex: number;
  }) => void;
  /** Callback to get additional props for each item wrapper */
  getItemProps?: (index: number) => Record<string, any>;
}

/**
 * VirtualizedList - A wrapper around react-window's VariableSizeList
 *
 * This component provides a reusable interface for rendering large lists
 * with virtual scrolling. It handles window sizing, overscan configuration,
 * and provides hooks for dynamic item height calculation.
 *
 * @example
 * ```tsx
 * <VirtualizedList
 *   items={myItems}
 *   height={600}
 *   width="100%"
 *   itemHeight={(index) => myItems[index].expanded ? 100 : 50}
 *   renderItem={(item, index, style) => (
 *     <div style={style}>{item.title}</div>
 *   )}
 * />
 * ```
 */
export const VirtualizedList = <T extends any>({
  items,
  height,
  width = '100%',
  itemHeight,
  renderItem,
  overscanCount = 3,
  className = '',
  listRef,
  onItemsRendered,
  getItemProps = () => ({}),
}: VirtualizedListProps<T>) => {
  const internalListRef = useRef<List>(null);
  const [isReady, setIsReady] = useState(false);

  // Use provided ref or internal ref
  const listReference = (listRef as React.MutableRefObject<List | null>) || internalListRef;

  // Set up list after mount
  useEffect(() => {
    setIsReady(true);
  }, []);

  /**
   * Reset cached item heights when items change
   * This ensures the list recalculates heights for all items
   */
  useEffect(() => {
    if (isReady && listReference.current) {
      listReference.current.resetAfterIndex(0);
    }
  }, [items, itemHeight, isReady, listReference]);

  /**
   * Item renderer that bridges our API with react-window's API
   */
  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => {
      const item = items[index];
      const itemProps = getItemProps(index);

      return (
        <div
          className="virtualized-list-item"
          style={style}
          {...itemProps}
        >
          {renderItem(item, index, style)}
        </div>
      );
    },
    [items, renderItem, getItemProps]
  );

  return (
    <div className={`virtualized-list-container ${className}`}>
      <List
        ref={listReference}
        height={height}
        width={width}
        itemCount={items.length}
        itemSize={itemHeight}
        overscanCount={overscanCount}
        onItemsRendered={onItemsRendered}
      >
        {Row}
      </List>
    </div>
  );
};

/**
 * Hook for managing dynamic item heights
 *
 * @example
 * ```tsx
 * const { getItemHeight, setItemHeight } = useItemHeights(50); // default height
 *
 * <VirtualizedList
 *   items={items}
 *   itemHeight={getItemHeight}
 *   renderItem={(item, index, style) => (
 *     <div
 *       ref={(el) => {
 *         if (el) {
 *           setItemHeight(index, el.getBoundingClientRect().height);
 *         }
 *       }}
 *       style={style}
 *     >
 *       {item.content}
 *     </div>
 *   )}
 * />
 * ```
 */
export const useItemHeights = (defaultHeight: number = 50) => {
  const itemHeightsRef = useRef<Map<number, number>>(new Map());

  const getItemHeight = useCallback(
    (index: number): number => {
      return itemHeightsRef.current.get(index) ?? defaultHeight;
    },
    [defaultHeight]
  );

  const setItemHeight = useCallback((index: number, height: number) => {
    itemHeightsRef.current.set(index, height);
  }, []);

  const resetItemHeights = useCallback(() => {
    itemHeightsRef.current.clear();
  }, []);

  return {
    getItemHeight,
    setItemHeight,
    resetItemHeights,
  };
};
