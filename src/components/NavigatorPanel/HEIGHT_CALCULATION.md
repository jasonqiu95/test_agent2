# Tree Item Height Calculation System

## Overview

This document describes the dynamic height calculation system for nested tree items in the NavigatorPanel. The system calculates heights for collapsed sections, expanded sections, and individual tree items while accounting for padding, borders, and nested indentation.

## Files

- **useTreeItemHeights.ts** - Hook for calculating dynamic heights
- **TreeView.tsx** - Main tree view component (integrated with the hook)
- **VirtualizedList.tsx** - Wrapper around react-window's VariableSizeList
- **TreeView.virtualized.example.tsx** - Example of using the hook with VirtualizedList
- **__tests__/useTreeItemHeights.test.ts** - Comprehensive test suite

## Architecture

### useTreeItemHeights Hook

The `useTreeItemHeights` hook is the core of the height calculation system. It:

1. **Flattens the tree structure** - Converts nested sections and items into a flat array suitable for react-window
2. **Calculates item heights** - Provides a function that returns the height for each item by index
3. **Handles expand/collapse** - Automatically recalculates when sections expand or collapse
4. **Manages custom heights** - Supports setting custom heights for items with dynamic content

### Height Dimensions

All dimensions are based on the CSS styles in `TreeView.css`:

```typescript
const DIMENSIONS = {
  SECTION_HEADER_HEIGHT: 32,   // 8px padding top + 8px padding bottom + ~16px content
  TREE_ITEM_HEIGHT: 36,         // 8px padding top + 8px padding bottom + ~18px content + 2px border + 2px margin
  EMPTY_MESSAGE_HEIGHT: 37,     // 12px padding top + 12px padding bottom + ~13px content
  SECTION_MARGIN: 4,            // Bottom margin for sections
  ITEMS_CONTAINER_MARGIN: 4,    // Top margin for items container
};
```

### Flat Tree Structure

The hook converts the nested tree structure into a flat array:

```typescript
[
  { type: 'section-header', sectionId: 'frontMatter', isExpanded: true },
  { type: 'tree-item', itemId: 'element-1', itemType: 'frontMatter', item: {...} },
  { type: 'tree-item', itemId: 'element-2', itemType: 'frontMatter', item: {...} },
  { type: 'section-header', sectionId: 'chapters', isExpanded: false },
  { type: 'section-header', sectionId: 'backMatter', isExpanded: true },
  { type: 'empty-message', sectionId: 'backMatter' },
]
```

## Usage

### Basic Usage in TreeView

```typescript
import { useTreeItemHeights } from './useTreeItemHeights';

const { filteredSections, hasActiveFilter } = useTreeFilter(book, filterOptions);

const {
  flatItems,
  getItemHeight,
  getTotalHeight,
  getItemIndex,
  getSectionIndex,
} = useTreeItemHeights(filteredSections, expandedSections);

// flatItems: Flattened array of tree items
// getItemHeight: Function to get height by index
// getTotalHeight: Get total height of all items
// getItemIndex: Find index of item by ID
// getSectionIndex: Find index of section by ID
```

### Integration with VirtualizedList

```typescript
<VirtualizedList
  items={flatItems}
  height={600}
  width="100%"
  itemHeight={getItemHeight}
  renderItem={(item, index, style) => {
    if (item.type === 'section-header') {
      return <SectionHeader {...item} style={style} />;
    }
    if (item.type === 'tree-item') {
      return <TreeItem {...item} style={style} />;
    }
    return <EmptyMessage style={style} />;
  }}
/>
```

### Custom Heights

For items with dynamic content (e.g., multi-line text):

```typescript
const { setItemHeight, clearCustomHeights } = useTreeItemHeights(sections, expandedSections);

// Set custom height for a specific item
useEffect(() => {
  const element = document.getElementById(`item-${itemId}`);
  if (element) {
    const height = element.getBoundingClientRect().height;
    setItemHeight(`item-${itemId}`, height);
  }
}, [itemId, setItemHeight]);

// Clear all custom heights when needed
clearCustomHeights();
```

## Height Calculation Logic

### Section Headers

- **Collapsed**: Header height + section margin
- **Expanded**: Header height + section margin (same as collapsed)
- **Last section**: Header height only (no margin)

### Tree Items

- **Standard item**: 36px (includes padding, border, margin)
- **Custom content**: Can be set dynamically using `setItemHeight()`

### Empty Messages

- **No items in section**: 37px (shows "No items" message)
- **Filtered results**: 37px (shows "No matching items")

## Expand/Collapse Behavior

When a section is toggled:

1. Hook detects change in `expandedSections` (via `useMemo` dependency)
2. `flatItems` array is recalculated:
   - Collapsed: Only section header in array
   - Expanded: Section header + all visible items (or empty message)
3. `getItemHeight` function automatically returns correct heights
4. VirtualizedList (if used) calls `resetAfterIndex(0)` to recalculate

## Performance Optimizations

1. **Memoization**: `flatItems` array is memoized using `useMemo`
2. **Ref-based storage**: Custom heights stored in ref (no re-renders)
3. **Efficient lookups**: Map-based storage for O(1) height lookups
4. **Virtualization-ready**: Designed for react-window's VariableSizeList

## Testing

The hook has comprehensive test coverage (18 tests):

- Flattening logic for expanded/collapsed/partial states
- Height calculations for all item types
- Custom height management
- Helper functions (getItemIndex, getSectionIndex, getTotalHeight)
- Reactivity when sections or data changes
- Filtering (invisible sections/items)

Run tests:
```bash
npm test useTreeItemHeights
```

## Future Enhancements

Potential improvements:

1. **Smooth height transitions** - Animate height changes on expand/collapse
2. **Lazy height calculation** - Only calculate heights for visible items
3. **Height caching** - Persist heights across sessions
4. **Auto-detection** - Automatically measure DOM elements for precise heights
5. **Nested indentation** - Different heights for different nesting levels

## Troubleshooting

### Heights are incorrect

1. Check CSS styles match the DIMENSIONS constants
2. Ensure box-sizing: border-box is set (or adjust calculations)
3. Use browser DevTools to measure actual rendered heights

### Items not visible after expand/collapse

1. Ensure `resetAfterIndex(0)` is called on VirtualizedList ref
2. Check that `expandedSections` state is updating correctly
3. Verify `flatItems` array is recalculating (add console.log)

### Performance issues with large trees

1. Increase `overscanCount` in VirtualizedList (default: 3)
2. Debounce expand/collapse actions
3. Use `clearCustomHeights()` to reset height cache

## Related Documentation

- [VirtualizedList Documentation](./VirtualizedList.tsx)
- [TreeView Documentation](./TreeView.tsx)
- [react-window Documentation](https://react-window.vercel.app/)
