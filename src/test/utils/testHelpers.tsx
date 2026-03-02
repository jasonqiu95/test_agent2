/**
 * Test Utilities and Helpers
 * Provides helper functions for testing Navigator and other components
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { NavigatorPanel, NavigatorPanelProps } from '../../components/NavigatorPanel/NavigatorPanel';
import { Book } from '../../types/book';
import { Chapter } from '../../types/chapter';
import { Element } from '../../types/element';

/**
 * Navigator Test Configuration
 */
export interface NavigatorTestConfig {
  book?: Book;
  selectedChapter?: string;
  selectedElement?: string;
  onChapterSelect?: (chapterId: string) => void;
  onElementSelect?: (elementId: string) => void;
  showFrontMatter?: boolean;
  showBackMatter?: boolean;
  expandChapters?: boolean;
  searchQuery?: string;
}

/**
 * Extended render options for Navigator tests
 */
export interface NavigatorRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  navigatorProps?: Partial<NavigatorPanelProps>;
}

/**
 * Renders NavigatorPanel with default test configuration
 */
export const renderNavigatorPanel = (
  props?: Partial<NavigatorPanelProps>,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult => {
  const defaultProps: NavigatorPanelProps = {
    title: 'Navigator',
    ...props,
  };

  return render(<NavigatorPanel {...defaultProps} />, options);
};

/**
 * Renders NavigatorPanel with children and common configurations
 */
export const renderNavigatorWithContent = (
  children: ReactElement | string,
  props?: Partial<NavigatorPanelProps>,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult => {
  return renderNavigatorPanel(
    {
      ...props,
      children,
    },
    options
  );
};

/**
 * Renders NavigatorPanel with footer
 */
export const renderNavigatorWithFooter = (
  children: ReactElement | string,
  footer: ReactElement | string,
  props?: Partial<NavigatorPanelProps>,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult => {
  return renderNavigatorPanel(
    {
      ...props,
      children,
      footer,
    },
    options
  );
};

/**
 * Creates a mock navigator tree structure from book data
 */
export interface NavigatorTreeNode {
  id: string;
  type: 'book' | 'front-matter' | 'chapter' | 'back-matter' | 'element';
  title: string;
  children?: NavigatorTreeNode[];
  data?: Chapter | Element;
}

/**
 * Converts a book into a navigator tree structure
 */
export const createNavigatorTree = (book: Book): NavigatorTreeNode => {
  const tree: NavigatorTreeNode = {
    id: book.id,
    type: 'book',
    title: book.title,
    children: [],
  };

  // Add front matter section if it exists
  if (book.frontMatter && book.frontMatter.length > 0) {
    const frontMatterNode: NavigatorTreeNode = {
      id: `${book.id}-front-matter`,
      type: 'front-matter',
      title: 'Front Matter',
      children: book.frontMatter.map(element => ({
        id: element.id,
        type: 'element',
        title: element.title,
        data: element,
      })),
    };
    tree.children!.push(frontMatterNode);
  }

  // Add chapters
  if (book.chapters && book.chapters.length > 0) {
    const chapterNodes: NavigatorTreeNode[] = book.chapters.map(chapter => ({
      id: chapter.id,
      type: 'chapter',
      title: chapter.title,
      data: chapter,
    }));
    tree.children!.push(...chapterNodes);
  }

  // Add back matter section if it exists
  if (book.backMatter && book.backMatter.length > 0) {
    const backMatterNode: NavigatorTreeNode = {
      id: `${book.id}-back-matter`,
      type: 'back-matter',
      title: 'Back Matter',
      children: book.backMatter.map(element => ({
        id: element.id,
        type: 'element',
        title: element.title,
        data: element,
      })),
    };
    tree.children!.push(backMatterNode);
  }

  return tree;
};

/**
 * Flattens a navigator tree into a list of all nodes
 */
export const flattenNavigatorTree = (node: NavigatorTreeNode): NavigatorTreeNode[] => {
  const result: NavigatorTreeNode[] = [node];

  if (node.children) {
    node.children.forEach(child => {
      result.push(...flattenNavigatorTree(child));
    });
  }

  return result;
};

/**
 * Finds a node in the navigator tree by ID
 */
export const findNodeById = (tree: NavigatorTreeNode, id: string): NavigatorTreeNode | undefined => {
  if (tree.id === id) {
    return tree;
  }

  if (tree.children) {
    for (const child of tree.children) {
      const found = findNodeById(child, id);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
};

/**
 * Gets all chapters from a book
 */
export const getAllChapters = (book: Book): Chapter[] => {
  return book.chapters || [];
};

/**
 * Gets all front matter elements from a book
 */
export const getAllFrontMatter = (book: Book): Element[] => {
  return book.frontMatter || [];
};

/**
 * Gets all back matter elements from a book
 */
export const getAllBackMatter = (book: Book): Element[] => {
  return book.backMatter || [];
};

/**
 * Gets total content count (chapters + front matter + back matter)
 */
export const getTotalContentCount = (book: Book): number => {
  return (
    (book.chapters?.length || 0) +
    (book.frontMatter?.length || 0) +
    (book.backMatter?.length || 0)
  );
};

/**
 * Checks if a book has any content
 */
export const hasContent = (book: Book): boolean => {
  return getTotalContentCount(book) > 0;
};

/**
 * Gets chapters organized by parts
 */
export interface ChaptersByPart {
  partNumber: number;
  partTitle: string;
  chapters: Chapter[];
}

export const getChaptersByParts = (book: Book): ChaptersByPart[] => {
  const partMap = new Map<number, ChaptersByPart>();

  book.chapters?.forEach(chapter => {
    if (chapter.partNumber) {
      if (!partMap.has(chapter.partNumber)) {
        partMap.set(chapter.partNumber, {
          partNumber: chapter.partNumber,
          partTitle: chapter.partTitle || `Part ${chapter.partNumber}`,
          chapters: [],
        });
      }
      partMap.get(chapter.partNumber)!.chapters.push(chapter);
    }
  });

  return Array.from(partMap.values()).sort((a, b) => a.partNumber - b.partNumber);
};

/**
 * Mock event handlers for testing
 */
export const createMockHandlers = () => ({
  onClose: jest.fn(),
  onChapterSelect: jest.fn(),
  onElementSelect: jest.fn(),
  onNavigate: jest.fn(),
  onExpand: jest.fn(),
  onCollapse: jest.fn(),
  onSearch: jest.fn(),
});

/**
 * Waits for a condition to be true
 */
export const waitForCondition = (
  condition: () => boolean,
  timeout = 1000,
  interval = 50
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, interval);
      }
    };

    check();
  });
};

/**
 * Simulates a delay (useful for testing loading states)
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Creates a mock IntersectionObserver for testing
 */
export const mockIntersectionObserver = () => {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
  } as any;
};

/**
 * Creates a mock ResizeObserver for testing
 */
export const mockResizeObserver = () => {
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  } as any;
};

/**
 * Setup common mocks for tests
 */
export const setupTestMocks = () => {
  mockIntersectionObserver();
  mockResizeObserver();
};

/**
 * Cleanup test mocks
 */
export const cleanupTestMocks = () => {
  // Reset any global mocks if needed
  jest.clearAllMocks();
};
