/**
 * Navigator Drag-and-Drop Tests
 * Tests for drag-and-drop reordering functionality in the Navigator component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navigator, ReorderParams } from '../Navigator';
import { Book } from '../../../types/book';
import { Chapter } from '../../../types/chapter';
import { Element } from '../../../types/element';

// Helper to create test chapters
const createTestChapter = (id: string, number: number, title: string): Chapter => ({
  id,
  number,
  title,
  content: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  includeInToc: true,
});

// Helper to create test elements
const createTestElement = (
  id: string,
  type: Element['type'],
  matter: 'front' | 'back',
  title: string
): Element => ({
  id,
  type,
  matter,
  title,
  content: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  includeInToc: true,
});

// Helper to create test book
const createTestBook = (): Book => ({
  id: 'test-book',
  title: 'Test Book',
  authors: [],
  frontMatter: [
    createTestElement('fm-1', 'title-page', 'front', 'Title Page'),
    createTestElement('fm-2', 'copyright', 'front', 'Copyright'),
    createTestElement('fm-3', 'dedication', 'front', 'Dedication'),
  ],
  chapters: [
    createTestChapter('ch-1', 1, 'First Chapter'),
    createTestChapter('ch-2', 2, 'Second Chapter'),
    createTestChapter('ch-3', 3, 'Third Chapter'),
  ],
  backMatter: [
    createTestElement('bm-1', 'epilogue', 'back', 'Epilogue'),
    createTestElement('bm-2', 'acknowledgments', 'back', 'Acknowledgments'),
  ],
  styles: [],
  metadata: {
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
});

// Helper to get element by data-item-id
const getItemById = (container: HTMLElement, itemId: string): HTMLElement => {
  const element = container.querySelector(`[data-item-id="${itemId}"]`);
  if (!element) {
    throw new Error(`Element with data-item-id="${itemId}" not found`);
  }
  return element as HTMLElement;
};

// Helper to create drag event
const createDragEvent = (type: string, dataTransfer?: Partial<DataTransfer>) => {
  const event = new Event(type, { bubbles: true, cancelable: true }) as any;
  event.dataTransfer = {
    effectAllowed: 'all',
    dropEffect: 'none',
    files: [],
    items: [],
    types: [],
    clearData: jest.fn(),
    getData: jest.fn(() => ''),
    setData: jest.fn(),
    setDragImage: jest.fn(),
    ...dataTransfer,
  };
  return event;
};

// Helper to simulate drag and drop
const simulateDragAndDrop = (
  draggedElement: HTMLElement,
  targetElement: HTMLElement,
  position: 'before' | 'after' = 'after'
) => {
  // Mock getBoundingClientRect for target element
  const mockRect = {
    top: 100,
    bottom: 150,
    left: 0,
    right: 100,
    width: 100,
    height: 50,
    x: 0,
    y: 100,
    toJSON: () => {},
  };

  targetElement.getBoundingClientRect = jest.fn(() => mockRect);

  // Start dragging
  const dragStartEvent = createDragEvent('dragstart');
  fireEvent(draggedElement, dragStartEvent);

  // Drag over target
  const clientY = position === 'before' ? mockRect.top + 1 : mockRect.bottom - 1;

  const dragOverEvent = createDragEvent('dragover', {
    effectAllowed: 'move',
    dropEffect: 'move',
  });
  Object.defineProperty(dragOverEvent, 'clientY', { value: clientY });
  fireEvent(targetElement, dragOverEvent);

  // Drop
  const dropEvent = createDragEvent('drop');
  fireEvent(targetElement, dropEvent);

  // End drag
  const dragEndEvent = createDragEvent('dragend');
  fireEvent(draggedElement, dragEndEvent);
};

describe('Navigator Drag-and-Drop', () => {
  let book: Book;
  let mockOnReorder: jest.Mock;

  beforeEach(() => {
    book = createTestBook();
    mockOnReorder = jest.fn();
    // Clean up any leftover drag images
    document.querySelectorAll('[data-drag-image="true"]').forEach(el => el.remove());
  });

  afterEach(() => {
    // Clean up any leftover drag images
    document.querySelectorAll('[data-drag-image="true"]').forEach(el => el.remove());
  });

  describe('Basic Drag-and-Drop Setup', () => {
    it('should render draggable items', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const chapterItems = container.querySelectorAll('[data-item-type="chapter"]');

      chapterItems.forEach((item) => {
        expect(item).toHaveAttribute('draggable', 'true');
      });
    });

    it('should not be draggable when disabled', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} disabled />);

      const chapterItems = container.querySelectorAll('[data-item-type="chapter"]');

      chapterItems.forEach((item) => {
        expect(item).toHaveAttribute('draggable', 'false');
      });
    });

    it('should show drag overlay when dragging starts', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const firstChapter = getItemById(container, 'ch-1');
      const dragStartEvent = createDragEvent('dragstart');
      fireEvent(firstChapter, dragStartEvent);

      expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();
    });

    it('should hide drag overlay when dragging ends', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const firstChapter = getItemById(container, 'ch-1');

      // Start drag
      const dragStartEvent = createDragEvent('dragstart');
      fireEvent(firstChapter, dragStartEvent);
      expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();

      // End drag
      const dragEndEvent = createDragEvent('dragend');
      fireEvent(firstChapter, dragEndEvent);
      expect(screen.queryByTestId('drag-overlay')).not.toBeInTheDocument();
    });
  });

  describe('Chapter Reordering', () => {
    it('should reorder chapter to new position when dropped', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const firstChapter = getItemById(container, 'ch-1');
      const thirdChapter = getItemById(container, 'ch-3');

      simulateDragAndDrop(firstChapter, thirdChapter, 'after');

      expect(mockOnReorder).toHaveBeenCalledWith({
        itemId: 'ch-1',
        itemType: 'chapter',
        fromIndex: 0,
        toIndex: 2,
        section: 'chapters',
      });
    });

    it('should update order when dragging chapter between other chapters', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const secondChapter = getItemById(container, 'ch-2');
      const firstChapter = getItemById(container, 'ch-1');

      simulateDragAndDrop(secondChapter, firstChapter, 'before');

      expect(mockOnReorder).toHaveBeenCalledWith({
        itemId: 'ch-2',
        itemType: 'chapter',
        fromIndex: 1,
        toIndex: 0,
        section: 'chapters',
      });
    });

    it('should handle dragging chapter to last position', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const firstChapter = getItemById(container, 'ch-1');
      const lastChapter = getItemById(container, 'ch-3');

      simulateDragAndDrop(firstChapter, lastChapter, 'after');

      expect(mockOnReorder).toHaveBeenCalledWith({
        itemId: 'ch-1',
        itemType: 'chapter',
        fromIndex: 0,
        toIndex: 2,
        section: 'chapters',
      });
    });

    it('should not call onReorder when dropping in same position', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const firstChapter = getItemById(container, 'ch-1');

      simulateDragAndDrop(firstChapter, firstChapter, 'before');

      expect(mockOnReorder).not.toHaveBeenCalled();
    });
  });

  describe('Front Matter Reordering', () => {
    it('should reorder front matter elements correctly', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const titlePage = getItemById(container, 'fm-1');
      const dedication = getItemById(container, 'fm-3');

      simulateDragAndDrop(titlePage, dedication, 'after');

      expect(mockOnReorder).toHaveBeenCalledWith({
        itemId: 'fm-1',
        itemType: 'frontMatter',
        fromIndex: 0,
        toIndex: 2,
        section: 'frontMatter',
      });
    });

    it('should handle reordering first front matter element', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const copyright = getItemById(container, 'fm-2');
      const titlePage = getItemById(container, 'fm-1');

      simulateDragAndDrop(copyright, titlePage, 'before');

      expect(mockOnReorder).toHaveBeenCalledWith({
        itemId: 'fm-2',
        itemType: 'frontMatter',
        fromIndex: 1,
        toIndex: 0,
        section: 'frontMatter',
      });
    });

    it('should handle reordering last front matter element', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const titlePage = getItemById(container, 'fm-1');
      const dedication = getItemById(container, 'fm-3');

      simulateDragAndDrop(titlePage, dedication, 'after');

      expect(mockOnReorder).toHaveBeenCalledWith({
        itemId: 'fm-1',
        itemType: 'frontMatter',
        fromIndex: 0,
        toIndex: 2,
        section: 'frontMatter',
      });
    });
  });

  describe('Back Matter Reordering', () => {
    it('should reorder back matter elements correctly', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const acknowledgments = getItemById(container, 'bm-2');
      const epilogue = getItemById(container, 'bm-1');

      simulateDragAndDrop(acknowledgments, epilogue, 'before');

      expect(mockOnReorder).toHaveBeenCalledWith({
        itemId: 'bm-2',
        itemType: 'backMatter',
        fromIndex: 1,
        toIndex: 0,
        section: 'backMatter',
      });
    });

    it('should handle reordering between back matter elements', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const epilogue = getItemById(container, 'bm-1');
      const acknowledgments = getItemById(container, 'bm-2');

      simulateDragAndDrop(epilogue, acknowledgments, 'after');

      expect(mockOnReorder).toHaveBeenCalledWith({
        itemId: 'bm-1',
        itemType: 'backMatter',
        fromIndex: 0,
        toIndex: 1,
        section: 'backMatter',
      });
    });
  });

  describe('Invalid Drop Positions (Validation)', () => {
    it('should not allow front matter to be dropped in chapters section', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const titlePage = getItemById(container, 'fm-1');
      const firstChapter = getItemById(container, 'ch-1');

      simulateDragAndDrop(titlePage, firstChapter);

      expect(mockOnReorder).not.toHaveBeenCalled();
    });

    it('should not allow front matter to be dropped in back matter section', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const titlePage = getItemById(container, 'fm-1');
      const epilogue = getItemById(container, 'bm-1');

      simulateDragAndDrop(titlePage, epilogue);

      expect(mockOnReorder).not.toHaveBeenCalled();
    });

    it('should not allow chapters to be dropped in front matter section', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const firstChapter = getItemById(container, 'ch-1');
      const titlePage = getItemById(container, 'fm-1');

      simulateDragAndDrop(firstChapter, titlePage);

      expect(mockOnReorder).not.toHaveBeenCalled();
    });

    it('should not allow chapters to be dropped in back matter section', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const firstChapter = getItemById(container, 'ch-1');
      const epilogue = getItemById(container, 'bm-1');

      simulateDragAndDrop(firstChapter, epilogue);

      expect(mockOnReorder).not.toHaveBeenCalled();
    });

    it('should not allow back matter to be dropped in chapters section', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const epilogue = getItemById(container, 'bm-1');
      const firstChapter = getItemById(container, 'ch-1');

      simulateDragAndDrop(epilogue, firstChapter);

      expect(mockOnReorder).not.toHaveBeenCalled();
    });

    it('should not allow back matter to be dropped in front matter section', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const epilogue = getItemById(container, 'bm-1');
      const titlePage = getItemById(container, 'fm-1');

      simulateDragAndDrop(epilogue, titlePage);

      expect(mockOnReorder).not.toHaveBeenCalled();
    });
  });

  describe('Visual Feedback During Drag', () => {
    it('should show drop zone indicator before target when dragging over top half', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const firstChapter = getItemById(container, 'ch-1');
      const secondChapter = getItemById(container, 'ch-2');

      // Mock getBoundingClientRect for target element
      const mockRect = {
        top: 100,
        bottom: 150,
        left: 0,
        right: 100,
        width: 100,
        height: 50,
        x: 0,
        y: 100,
        toJSON: () => {},
      };
      secondChapter.getBoundingClientRect = jest.fn(() => mockRect);

      // Start dragging
      const dragStartEvent = createDragEvent('dragstart');
      fireEvent(firstChapter, dragStartEvent);

      // Drag over top half of target
      const dragOverEvent = createDragEvent('dragover', {
        effectAllowed: 'move',
        dropEffect: 'move',
      });
      Object.defineProperty(dragOverEvent, 'clientY', { value: mockRect.top + 1 });
      fireEvent(secondChapter, dragOverEvent);

      // Check for drop zone indicator
      expect(screen.getByTestId('drop-zone-before-ch-2')).toBeInTheDocument();
    });

    it('should show drop zone indicator after target when dragging over bottom half', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const firstChapter = getItemById(container, 'ch-1');
      const secondChapter = getItemById(container, 'ch-2');

      // Mock getBoundingClientRect for target element
      const mockRect = {
        top: 100,
        bottom: 150,
        left: 0,
        right: 100,
        width: 100,
        height: 50,
        x: 0,
        y: 100,
        toJSON: () => {},
      };
      secondChapter.getBoundingClientRect = jest.fn(() => mockRect);

      // Start dragging
      const dragStartEvent = createDragEvent('dragstart');
      fireEvent(firstChapter, dragStartEvent);

      // Drag over bottom half of target
      const dragOverEvent = createDragEvent('dragover', {
        effectAllowed: 'move',
        dropEffect: 'move',
      });
      Object.defineProperty(dragOverEvent, 'clientY', { value: mockRect.bottom - 1 });
      fireEvent(secondChapter, dragOverEvent);

      // Check for drop zone indicator
      expect(screen.getByTestId('drop-zone-after-ch-2')).toBeInTheDocument();
    });

    it('should add dragging class to dragged item', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const firstChapter = getItemById(container, 'ch-1');

      const dragStartEvent = createDragEvent('dragstart');
      fireEvent(firstChapter, dragStartEvent);

      expect(firstChapter).toHaveClass('dragging');
    });

    it('should add drop-target class to target item during drag over', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const firstChapter = getItemById(container, 'ch-1');
      const secondChapter = getItemById(container, 'ch-2');

      // Start dragging
      const dragStartEvent = createDragEvent('dragstart');
      fireEvent(firstChapter, dragStartEvent);

      // Drag over target
      const dragOverEvent = createDragEvent('dragover', {
        effectAllowed: 'move',
        dropEffect: 'move',
      });
      fireEvent(secondChapter, dragOverEvent);

      expect(secondChapter).toHaveClass('drop-target');
    });

    it('should remove visual feedback after drag ends', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const firstChapter = getItemById(container, 'ch-1');
      const secondChapter = getItemById(container, 'ch-2');

      // Start drag and drag over
      const dragStartEvent = createDragEvent('dragstart');
      fireEvent(firstChapter, dragStartEvent);

      const dragOverEvent = createDragEvent('dragover', {
        effectAllowed: 'move',
        dropEffect: 'move',
      });
      fireEvent(secondChapter, dragOverEvent);

      // End drag
      const dragEndEvent = createDragEvent('dragend');
      fireEvent(firstChapter, dragEndEvent);

      expect(firstChapter).not.toHaveClass('dragging');
      expect(secondChapter).not.toHaveClass('drop-target');
    });
  });

  describe('Drag Cancellation', () => {
    it('should cancel drag on ESC key press', async () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const firstChapter = getItemById(container, 'ch-1');

      // Start dragging
      const dragStartEvent = createDragEvent('dragstart');
      fireEvent(firstChapter, dragStartEvent);
      expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();

      // Press ESC
      fireEvent.keyDown(firstChapter, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByTestId('drag-overlay')).not.toBeInTheDocument();
      });
      expect(firstChapter).not.toHaveClass('dragging');
    });

    it('should not trigger reorder when drag is cancelled', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const firstChapter = getItemById(container, 'ch-1');
      const secondChapter = getItemById(container, 'ch-2');

      // Start dragging
      const dragStartEvent = createDragEvent('dragstart');
      fireEvent(firstChapter, dragStartEvent);

      // Drag over target
      const dragOverEvent = createDragEvent('dragover', {
        effectAllowed: 'move',
        dropEffect: 'move',
      });
      fireEvent(secondChapter, dragOverEvent);

      // Press ESC to cancel
      fireEvent.keyDown(firstChapter, { key: 'Escape' });

      expect(mockOnReorder).not.toHaveBeenCalled();
    });

    it('should reset drag state when dragging outside valid drop zone', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const firstChapter = getItemById(container, 'ch-1');

      // Start dragging
      const dragStartEvent = createDragEvent('dragstart');
      fireEvent(firstChapter, dragStartEvent);
      expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();

      // End drag without dropping on valid target
      const dragEndEvent = createDragEvent('dragend');
      fireEvent(firstChapter, dragEndEvent);

      expect(screen.queryByTestId('drag-overlay')).not.toBeInTheDocument();
      expect(firstChapter).not.toHaveClass('dragging');
    });
  });

  describe('onReorder Callback Parameters', () => {
    it('should fire onReorder with correct parameters for chapter move forward', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const firstChapter = getItemById(container, 'ch-1');
      const thirdChapter = getItemById(container, 'ch-3');

      simulateDragAndDrop(firstChapter, thirdChapter, 'after');

      expect(mockOnReorder).toHaveBeenCalledTimes(1);
      expect(mockOnReorder).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: 'ch-1',
          itemType: 'chapter',
          fromIndex: 0,
          toIndex: 2,
          section: 'chapters',
        })
      );
    });

    it('should fire onReorder with correct parameters for chapter move backward', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const thirdChapter = getItemById(container, 'ch-3');
      const firstChapter = getItemById(container, 'ch-1');

      simulateDragAndDrop(thirdChapter, firstChapter, 'before');

      expect(mockOnReorder).toHaveBeenCalledTimes(1);
      expect(mockOnReorder).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: 'ch-3',
          itemType: 'chapter',
          fromIndex: 2,
          toIndex: 0,
          section: 'chapters',
        })
      );
    });

    it('should fire onReorder with correct parameters for front matter reorder', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const dedication = getItemById(container, 'fm-3');
      const titlePage = getItemById(container, 'fm-1');

      simulateDragAndDrop(dedication, titlePage, 'before');

      expect(mockOnReorder).toHaveBeenCalledTimes(1);
      expect(mockOnReorder).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: 'fm-3',
          itemType: 'frontMatter',
          fromIndex: 2,
          toIndex: 0,
          section: 'frontMatter',
        })
      );
    });

    it('should fire onReorder with correct parameters for back matter reorder', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const acknowledgments = getItemById(container, 'bm-2');
      const epilogue = getItemById(container, 'bm-1');

      simulateDragAndDrop(acknowledgments, epilogue, 'before');

      expect(mockOnReorder).toHaveBeenCalledTimes(1);
      expect(mockOnReorder).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: 'bm-2',
          itemType: 'backMatter',
          fromIndex: 1,
          toIndex: 0,
          section: 'backMatter',
        })
      );
    });

    it('should not call onReorder when disabled', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} disabled />);

      const firstChapter = getItemById(container, 'ch-1');
      const secondChapter = getItemById(container, 'ch-2');

      simulateDragAndDrop(firstChapter, secondChapter);

      expect(mockOnReorder).not.toHaveBeenCalled();
    });

    it('should work without onReorder callback', () => {
      const { container } = render(<Navigator book={book} />);

      const firstChapter = getItemById(container, 'ch-1');
      const secondChapter = getItemById(container, 'ch-2');

      expect(() => {
        simulateDragAndDrop(firstChapter, secondChapter);
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle book with single chapter', () => {
      const singleChapterBook: Book = {
        ...book,
        chapters: [createTestChapter('ch-1', 1, 'Only Chapter')],
      };

      const { container } = render(<Navigator book={singleChapterBook} onReorder={mockOnReorder} />);

      const chapter = getItemById(container, 'ch-1');
      simulateDragAndDrop(chapter, chapter, 'before');

      // Dropping on the same item (before position) should not trigger reorder
      expect(mockOnReorder).not.toHaveBeenCalled();
    });

    it('should handle book with empty sections', () => {
      const emptyBook: Book = {
        ...book,
        frontMatter: [],
        chapters: [],
        backMatter: [],
      };

      render(<Navigator book={emptyBook} onReorder={mockOnReorder} />);

      expect(screen.getAllByText('No items')).toHaveLength(3);
    });

    it('should handle dragging when sections are collapsed', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      // Collapse chapters section
      const chaptersHeader = screen.getByLabelText('Chapters section');
      fireEvent.click(chaptersHeader);

      // Chapters should not be in the DOM when collapsed
      const chaptersSection = container.querySelector('[data-section="chapters"]');
      expect(chaptersSection).not.toBeInTheDocument();

      // Expand again
      fireEvent.click(chaptersHeader);

      // Now should be able to drag
      const firstChapter = getItemById(container, 'ch-1');
      const secondChapter = getItemById(container, 'ch-2');

      simulateDragAndDrop(firstChapter, secondChapter);

      expect(mockOnReorder).toHaveBeenCalled();
    });

    it('should handle rapid successive drags', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const firstChapter = getItemById(container, 'ch-1');
      const secondChapter = getItemById(container, 'ch-2');
      const thirdChapter = getItemById(container, 'ch-3');

      // First drag
      simulateDragAndDrop(firstChapter, secondChapter);
      // Second drag
      simulateDragAndDrop(secondChapter, thirdChapter);

      expect(mockOnReorder).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on draggable items', () => {
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} />);

      const firstChapter = getItemById(container, 'ch-1');

      expect(firstChapter).toHaveAttribute('role', 'button');
      expect(firstChapter).toHaveAttribute('tabIndex', '0');
      expect(firstChapter).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation with Enter key', () => {
      const mockOnSelect = jest.fn();
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} onSelect={mockOnSelect} />);

      const firstChapter = getItemById(container, 'ch-1');

      fireEvent.keyDown(firstChapter, { key: 'Enter' });

      expect(mockOnSelect).toHaveBeenCalledWith('ch-1', 'chapter');
    });

    it('should support keyboard navigation with Space key', () => {
      const mockOnSelect = jest.fn();
      const { container } = render(<Navigator book={book} onReorder={mockOnReorder} onSelect={mockOnSelect} />);

      const firstChapter = getItemById(container, 'ch-1');

      fireEvent.keyDown(firstChapter, { key: ' ' });

      expect(mockOnSelect).toHaveBeenCalledWith('ch-1', 'chapter');
    });
  });
});
