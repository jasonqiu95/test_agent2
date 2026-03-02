import { useMemo } from 'react';
import { Book } from '../types/book';
import { Chapter } from '../types/chapter';
import { Element } from '../types/element';
import { ElementTypeFilter } from '../components/NavigatorPanel/SearchBar';

export interface FilteredItem {
  item: Element | Chapter;
  matches: Array<{ start: number; end: number; field: 'title' | 'type' }>;
  visible: boolean;
}

export interface FilteredSection {
  id: string;
  title: string;
  type: 'frontMatter' | 'chapters' | 'backMatter';
  items: FilteredItem[];
  visible: boolean;
  matchCount: number;
}

export interface UseTreeFilterOptions {
  searchQuery: string;
  typeFilter: ElementTypeFilter;
}

export interface UseTreeFilterResult {
  filteredSections: FilteredSection[];
  totalMatches: number;
  hasActiveFilter: boolean;
}

/**
 * Hook to filter tree nodes based on search query and type filter
 */
export function useTreeFilter(
  book: Book,
  options: UseTreeFilterOptions
): UseTreeFilterResult {
  const { searchQuery, typeFilter } = options;

  return useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const hasSearch = query.length > 0;
    const hasTypeFilter = typeFilter !== 'all';
    const hasActiveFilter = hasSearch || hasTypeFilter;

    const sections: FilteredSection[] = [
      {
        id: 'frontMatter',
        title: 'Front Matter',
        type: 'frontMatter',
        items: book.frontMatter || [],
        visible: true,
        matchCount: 0,
      },
      {
        id: 'chapters',
        title: 'Chapters',
        type: 'chapters',
        items: book.chapters || [],
        visible: true,
        matchCount: 0,
      },
      {
        id: 'backMatter',
        title: 'Back Matter',
        type: 'backMatter',
        items: book.backMatter || [],
        visible: true,
        matchCount: 0,
      },
    ];

    let totalMatches = 0;

    const filteredSections = sections.map((section) => {
      // Apply type filter
      const typeMatches =
        !hasTypeFilter ||
        typeFilter === 'all' ||
        (typeFilter === 'chapters' && section.type === 'chapters') ||
        (typeFilter === 'frontMatter' && section.type === 'frontMatter') ||
        (typeFilter === 'backMatter' && section.type === 'backMatter');

      if (!typeMatches) {
        return {
          ...section,
          items: section.items.map((item) => ({
            item,
            matches: [],
            visible: false,
          })),
          visible: false,
          matchCount: 0,
        };
      }

      // Filter items based on search query
      const filteredItems: FilteredItem[] = section.items.map((item) => {
        const matches: Array<{ start: number; end: number; field: 'title' | 'type' }> = [];
        let visible = true;

        if (hasSearch) {
          const itemTitle = getItemTitle(item, section.type).toLowerCase();
          const itemType = getItemType(item, section.type).toLowerCase();

          // Search in title
          let titleIndex = itemTitle.indexOf(query);
          if (titleIndex !== -1) {
            matches.push({
              start: titleIndex,
              end: titleIndex + query.length,
              field: 'title',
            });
          }

          // Search in type
          let typeIndex = itemType.indexOf(query);
          if (typeIndex !== -1) {
            matches.push({
              start: typeIndex,
              end: typeIndex + query.length,
              field: 'type',
            });
          }

          visible = matches.length > 0;
        }

        if (visible) {
          totalMatches++;
        }

        return {
          item,
          matches,
          visible,
        };
      });

      const visibleItems = filteredItems.filter((fi) => fi.visible);
      const sectionVisible = visibleItems.length > 0 || !hasActiveFilter;

      return {
        ...section,
        items: filteredItems,
        visible: sectionVisible,
        matchCount: visibleItems.length,
      };
    });

    return {
      filteredSections,
      totalMatches,
      hasActiveFilter,
    };
  }, [book, searchQuery, typeFilter]);
}

/**
 * Get the title of an item
 */
function getItemTitle(item: Element | Chapter, type: string): string {
  if (type === 'chapters') {
    const chapter = item as Chapter;
    const prefix = chapter.number !== undefined ? `Chapter ${chapter.number}` : 'Chapter';
    return chapter.title ? `${prefix}: ${chapter.title}` : prefix;
  }
  return item.title || '';
}

/**
 * Get the type of an item as a readable string
 */
function getItemType(item: Element | Chapter, sectionType: string): string {
  if (sectionType === 'chapters') {
    return 'chapter';
  }
  const element = item as Element;
  return element.type || '';
}
