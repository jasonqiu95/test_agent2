import { renderHook } from '@testing-library/react';
import { useTreeItemHeights, TreeSection } from '../useTreeItemHeights';
import { Element } from '../../../types/element';
import { Chapter } from '../../../types/chapter';

describe('useTreeItemHeights', () => {
  const mockElement: Element = {
    id: 'element-1',
    title: 'Test Element',
    type: 'dedication',
    order: 0,
    content: '',
  };

  const mockChapter: Chapter = {
    id: 'chapter-1',
    title: 'Test Chapter',
    number: 1,
    order: 0,
    scenes: [],
  };

  const mockSections: TreeSection[] = [
    {
      id: 'frontMatter',
      title: 'Front Matter',
      type: 'frontMatter',
      items: [
        { item: mockElement, visible: true },
      ],
      visible: true,
    },
    {
      id: 'chapters',
      title: 'Chapters',
      type: 'chapters',
      items: [
        { item: mockChapter, visible: true },
      ],
      visible: true,
    },
    {
      id: 'backMatter',
      title: 'Back Matter',
      type: 'backMatter',
      items: [],
      visible: true,
    },
  ];

  describe('flatItems', () => {
    it('should flatten visible sections and items when expanded', () => {
      const expandedSections = new Set(['frontMatter', 'chapters', 'backMatter']);
      const { result } = renderHook(() =>
        useTreeItemHeights(mockSections, expandedSections)
      );

      const { flatItems } = result.current;

      // Should have: 3 section headers + 2 items (element + chapter) + 1 empty message
      expect(flatItems).toHaveLength(6);

      // First item should be front matter section header
      expect(flatItems[0]).toMatchObject({
        type: 'section-header',
        sectionId: 'frontMatter',
        isExpanded: true,
      });

      // Second item should be the front matter element
      expect(flatItems[1]).toMatchObject({
        type: 'tree-item',
        itemId: 'element-1',
        itemType: 'frontMatter',
      });

      // Third item should be chapters section header
      expect(flatItems[2]).toMatchObject({
        type: 'section-header',
        sectionId: 'chapters',
        isExpanded: true,
      });

      // Fourth item should be the chapter
      expect(flatItems[3]).toMatchObject({
        type: 'tree-item',
        itemId: 'chapter-1',
        itemType: 'chapters',
      });

      // Fifth item should be back matter section header
      expect(flatItems[4]).toMatchObject({
        type: 'section-header',
        sectionId: 'backMatter',
        isExpanded: true,
      });

      // Sixth item should be empty message for back matter
      expect(flatItems[5]).toMatchObject({
        type: 'empty-message',
        sectionId: 'backMatter',
      });
    });

    it('should only show section headers when collapsed', () => {
      const expandedSections = new Set<string>(); // All collapsed
      const { result } = renderHook(() =>
        useTreeItemHeights(mockSections, expandedSections)
      );

      const { flatItems } = result.current;

      // Should only have 3 section headers
      expect(flatItems).toHaveLength(3);

      flatItems.forEach((item) => {
        expect(item.type).toBe('section-header');
        expect(item.isExpanded).toBe(false);
      });
    });

    it('should handle partially expanded sections', () => {
      const expandedSections = new Set(['frontMatter']); // Only front matter expanded
      const { result } = renderHook(() =>
        useTreeItemHeights(mockSections, expandedSections)
      );

      const { flatItems } = result.current;

      // Should have: 3 section headers + 1 item (only front matter element)
      expect(flatItems).toHaveLength(4);

      expect(flatItems[0].isExpanded).toBe(true);
      expect(flatItems[1]).toMatchObject({
        type: 'tree-item',
        itemId: 'element-1',
      });
      expect(flatItems[2].isExpanded).toBe(false);
      expect(flatItems[3].isExpanded).toBe(false);
    });

    it('should filter out invisible sections', () => {
      const sectionsWithHidden: TreeSection[] = [
        {
          ...mockSections[0],
          visible: false, // Hidden section
        },
        mockSections[1],
      ];

      const expandedSections = new Set(['frontMatter', 'chapters']);
      const { result } = renderHook(() =>
        useTreeItemHeights(sectionsWithHidden, expandedSections)
      );

      const { flatItems } = result.current;

      // Should not include hidden front matter section
      expect(flatItems.some((item) => item.sectionId === 'frontMatter')).toBe(false);
      expect(flatItems.some((item) => item.sectionId === 'chapters')).toBe(true);
    });

    it('should filter out invisible items within sections', () => {
      const sectionsWithHiddenItems: TreeSection[] = [
        {
          id: 'frontMatter',
          title: 'Front Matter',
          type: 'frontMatter',
          items: [
            { item: mockElement, visible: false }, // Hidden item
            { item: { ...mockElement, id: 'element-2' }, visible: true },
          ],
          visible: true,
        },
      ];

      const expandedSections = new Set(['frontMatter']);
      const { result } = renderHook(() =>
        useTreeItemHeights(sectionsWithHiddenItems, expandedSections)
      );

      const { flatItems } = result.current;

      // Should have section header + 1 visible item
      expect(flatItems).toHaveLength(2);
      expect(flatItems[1]).toMatchObject({
        type: 'tree-item',
        itemId: 'element-2',
      });
    });
  });

  describe('getItemHeight', () => {
    it('should return correct height for section headers', () => {
      const expandedSections = new Set(['frontMatter']);
      const { result } = renderHook(() =>
        useTreeItemHeights(mockSections, expandedSections)
      );

      const { getItemHeight, dimensions } = result.current;

      // First section header (not last, so includes margin)
      const firstHeaderHeight = getItemHeight(0);
      expect(firstHeaderHeight).toBe(
        dimensions.SECTION_HEADER_HEIGHT + dimensions.SECTION_MARGIN
      );
    });

    it('should return correct height for tree items', () => {
      const expandedSections = new Set(['frontMatter']);
      const { result } = renderHook(() =>
        useTreeItemHeights(mockSections, expandedSections)
      );

      const { getItemHeight, dimensions, flatItems } = result.current;

      // Find a tree item index
      const treeItemIndex = flatItems.findIndex((item) => item.type === 'tree-item');
      const itemHeight = getItemHeight(treeItemIndex);

      expect(itemHeight).toBe(dimensions.TREE_ITEM_HEIGHT);
    });

    it('should return correct height for empty messages', () => {
      const expandedSections = new Set(['backMatter']);
      const { result } = renderHook(() =>
        useTreeItemHeights(mockSections, expandedSections)
      );

      const { getItemHeight, dimensions, flatItems } = result.current;

      // Find empty message index
      const emptyMsgIndex = flatItems.findIndex((item) => item.type === 'empty-message');
      const emptyHeight = getItemHeight(emptyMsgIndex);

      expect(emptyHeight).toBe(dimensions.EMPTY_MESSAGE_HEIGHT);
    });

    it('should use custom heights when set', () => {
      const expandedSections = new Set(['frontMatter']);
      const { result } = renderHook(() =>
        useTreeItemHeights(mockSections, expandedSections)
      );

      const { getItemHeight, setItemHeight, flatItems } = result.current;

      const customHeight = 100;
      const itemId = flatItems[1].id;

      // Set custom height
      setItemHeight(itemId, customHeight);

      // Should return custom height
      expect(getItemHeight(1)).toBe(customHeight);
    });
  });

  describe('getTotalHeight', () => {
    it('should calculate correct total height for all items', () => {
      const expandedSections = new Set(['frontMatter', 'chapters']);
      const { result } = renderHook(() =>
        useTreeItemHeights(mockSections, expandedSections)
      );

      const { getTotalHeight, getItemHeight, flatItems } = result.current;

      const total = getTotalHeight();
      const expected = flatItems.reduce((sum, _, index) => sum + getItemHeight(index), 0);

      expect(total).toBe(expected);
    });

    it('should update total height when sections expand/collapse', () => {
      let expandedSections = new Set<string>(); // All collapsed
      const { result, rerender } = renderHook(
        ({ sections, expanded }) => useTreeItemHeights(sections, expanded),
        {
          initialProps: {
            sections: mockSections,
            expanded: expandedSections,
          },
        }
      );

      const collapsedHeight = result.current.getTotalHeight();

      // Expand all sections
      expandedSections = new Set(['frontMatter', 'chapters', 'backMatter']);
      rerender({ sections: mockSections, expanded: expandedSections });

      const expandedHeight = result.current.getTotalHeight();

      // Expanded height should be greater than collapsed height
      expect(expandedHeight).toBeGreaterThan(collapsedHeight);
    });
  });

  describe('getItemIndex', () => {
    it('should return correct index for an item by ID', () => {
      const expandedSections = new Set(['frontMatter', 'chapters']);
      const { result } = renderHook(() =>
        useTreeItemHeights(mockSections, expandedSections)
      );

      const { getItemIndex } = result.current;

      const index = getItemIndex('element-1');
      expect(index).toBe(1); // After frontMatter section header

      const chapterIndex = getItemIndex('chapter-1');
      expect(chapterIndex).toBe(3); // After chapters section header
    });

    it('should return -1 for non-existent item', () => {
      const expandedSections = new Set(['frontMatter']);
      const { result } = renderHook(() =>
        useTreeItemHeights(mockSections, expandedSections)
      );

      const { getItemIndex } = result.current;

      const index = getItemIndex('non-existent-id');
      expect(index).toBe(-1);
    });
  });

  describe('getSectionIndex', () => {
    it('should return correct index for a section by ID', () => {
      const expandedSections = new Set(['frontMatter', 'chapters', 'backMatter']);
      const { result } = renderHook(() =>
        useTreeItemHeights(mockSections, expandedSections)
      );

      const { getSectionIndex } = result.current;

      expect(getSectionIndex('frontMatter')).toBe(0);
      expect(getSectionIndex('chapters')).toBe(2); // After frontMatter header + item
      expect(getSectionIndex('backMatter')).toBe(4); // After chapters header + item
    });

    it('should return -1 for non-existent section', () => {
      const expandedSections = new Set(['frontMatter']);
      const { result } = renderHook(() =>
        useTreeItemHeights(mockSections, expandedSections)
      );

      const { getSectionIndex } = result.current;

      const index = getSectionIndex('non-existent-section');
      expect(index).toBe(-1);
    });
  });

  describe('clearCustomHeights', () => {
    it('should clear all custom heights', () => {
      const expandedSections = new Set(['frontMatter']);
      const { result } = renderHook(() =>
        useTreeItemHeights(mockSections, expandedSections)
      );

      const { getItemHeight, setItemHeight, clearCustomHeights, flatItems, dimensions } = result.current;

      const itemId = flatItems[1].id;
      const customHeight = 150;

      // Set custom height
      setItemHeight(itemId, customHeight);
      expect(getItemHeight(1)).toBe(customHeight);

      // Clear custom heights
      clearCustomHeights();

      // Should return default height
      expect(getItemHeight(1)).toBe(dimensions.TREE_ITEM_HEIGHT);
    });
  });

  describe('reactivity', () => {
    it('should recalculate when expandedSections changes', () => {
      let expandedSections = new Set<string>(['frontMatter']);
      const { result, rerender } = renderHook(
        ({ sections, expanded }) => useTreeItemHeights(sections, expanded),
        {
          initialProps: {
            sections: mockSections,
            expanded: expandedSections,
          },
        }
      );

      const initialItemCount = result.current.flatItems.length;

      // Expand more sections
      expandedSections = new Set(['frontMatter', 'chapters', 'backMatter']);
      rerender({ sections: mockSections, expanded: expandedSections });

      const newItemCount = result.current.flatItems.length;

      // Should have more items when expanded
      expect(newItemCount).toBeGreaterThan(initialItemCount);
    });

    it('should recalculate when sections data changes', () => {
      const expandedSections = new Set(['frontMatter']);
      const { result, rerender } = renderHook(
        ({ sections, expanded }) => useTreeItemHeights(sections, expanded),
        {
          initialProps: {
            sections: mockSections,
            expanded: expandedSections,
          },
        }
      );

      const initialItemCount = result.current.flatItems.length;

      // Add more items to a section
      const newSections: TreeSection[] = [
        {
          ...mockSections[0],
          items: [
            ...mockSections[0].items,
            { item: { ...mockElement, id: 'element-2' }, visible: true },
            { item: { ...mockElement, id: 'element-3' }, visible: true },
          ],
        },
        ...mockSections.slice(1),
      ];

      rerender({ sections: newSections, expanded: expandedSections });

      const newItemCount = result.current.flatItems.length;

      // Should have more items with additional elements
      expect(newItemCount).toBeGreaterThan(initialItemCount);
    });
  });
});
