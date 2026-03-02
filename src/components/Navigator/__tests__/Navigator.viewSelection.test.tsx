/**
 * Navigator View Switching and Selection Tests
 *
 * Tests:
 * - Toggle between Contents and Styles views
 * - View persists correct content after switch
 * - Selecting element highlights it
 * - Selection state updates Redux/context
 * - Clicking element fires onSelect callback
 * - Multi-select if supported (Shift/Cmd+click)
 * - Deselect by clicking blank area
 * - Active element styling applied correctly
 * - Selection persists across view switches
 * - Verify both keyboard and mouse selection
 */

import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Navigator } from '../Navigator';
import { renderWithProviders } from '../../../__tests__/utils/renderWithProviders';
import { simpleBook, complexBook } from '../../../test/fixtures/bookData';
import { Book } from '../../../types/book';
import { BookStyle } from '../../../types/style';

// Helper to render Navigator with a book
const renderNavigatorWithBook = (book: Book | null, props: any = {}) => {
  return renderWithProviders(<Navigator {...props} />, {
    preloadedState: {
      book: { currentBook: book, books: [], loading: false, error: null },
    },
  });
};

// Helper to create a book with styles
const createBookWithStyles = (baseBook: Book): Book => {
  const styles: BookStyle[] = [
    {
      id: 'style-1',
      name: 'Classic Serif',
      description: 'Traditional serif style',
      category: 'serif',
      fonts: {
        body: 'Georgia',
        heading: 'Garamond',
        fallback: 'serif',
      },
      headings: {
        h1: { fontSize: '2.5rem', fontWeight: 'bold', lineHeight: '1.2' },
        h2: { fontSize: '2rem', fontWeight: 'bold', lineHeight: '1.3' },
        h3: { fontSize: '1.5rem', fontWeight: 'bold', lineHeight: '1.4' },
      },
      body: {
        fontSize: '1rem',
        lineHeight: '1.6',
        textAlign: 'justify',
      },
      dropCap: {
        enabled: true,
        lines: 3,
      },
      ornamentalBreak: {
        enabled: true,
        symbol: '***',
      },
      firstParagraph: {
        enabled: false,
      },
      spacing: {
        paragraphSpacing: '1rem',
        lineHeight: '1.6',
        sectionSpacing: '2rem',
        chapterSpacing: '3rem',
      },
      colors: {
        text: '#000000',
        heading: '#333333',
      },
    },
    {
      id: 'style-2',
      name: 'Modern Sans',
      description: 'Clean sans-serif style',
      category: 'sans-serif',
      fonts: {
        body: 'Arial',
        heading: 'Helvetica',
        fallback: 'sans-serif',
      },
      headings: {
        h1: { fontSize: '2.5rem', fontWeight: 'bold', lineHeight: '1.2' },
        h2: { fontSize: '2rem', fontWeight: 'bold', lineHeight: '1.3' },
        h3: { fontSize: '1.5rem', fontWeight: 'bold', lineHeight: '1.4' },
      },
      body: {
        fontSize: '1rem',
        lineHeight: '1.5',
        textAlign: 'left',
      },
      dropCap: {
        enabled: false,
        lines: 0,
      },
      ornamentalBreak: {
        enabled: false,
        symbol: '',
      },
      firstParagraph: {
        enabled: false,
      },
      spacing: {
        paragraphSpacing: '1rem',
        lineHeight: '1.5',
        sectionSpacing: '1.5rem',
        chapterSpacing: '2rem',
      },
      colors: {
        text: '#333333',
        heading: '#000000',
      },
    },
  ];

  return { ...baseBook, styles };
};

describe('Navigator - View Switching and Selection', () => {
  describe('View Switching', () => {
    it('should render with Contents view active by default', () => {
      renderNavigatorWithBook(simpleBook);

      const contentsButton = screen.getByTestId('view-button-contents');
      const stylesButton = screen.getByTestId('view-button-styles');

      expect(contentsButton).toHaveClass('active');
      expect(stylesButton).not.toHaveClass('active');
    });

    it('should toggle between Contents and Styles views', async () => {
      const user = userEvent.setup();
      const bookWithStyles = createBookWithStyles(simpleBook);
      renderNavigatorWithBook(bookWithStyles);

      const contentsButton = screen.getByTestId('view-button-contents');
      const stylesButton = screen.getByTestId('view-button-styles');

      // Initial state: Contents view
      expect(contentsButton).toHaveClass('active');
      expect(stylesButton).not.toHaveClass('active');

      // Switch to Styles view
      await user.click(stylesButton);
      expect(stylesButton).toHaveClass('active');
      expect(contentsButton).not.toHaveClass('active');

      // Switch back to Contents view
      await user.click(contentsButton);
      expect(contentsButton).toHaveClass('active');
      expect(stylesButton).not.toHaveClass('active');
    });

    it('should call onViewChange callback when view is switched', async () => {
      const user = userEvent.setup();
      const onViewChange = jest.fn();
      const bookWithStyles = createBookWithStyles(simpleBook);
      renderNavigatorWithBook(bookWithStyles, { view: 'contents', onViewChange });

      const stylesButton = screen.getByTestId('view-button-styles');
      await user.click(stylesButton);

      expect(onViewChange).toHaveBeenCalledTimes(1);
      expect(onViewChange).toHaveBeenCalledWith('styles');
    });

    it('should display correct content in Contents view', () => {
      renderNavigatorWithBook(complexBook);

      // Should show chapters and elements
      expect(screen.getByText('Title Page')).toBeInTheDocument();
      expect(screen.getByText('The Beginning')).toBeInTheDocument();
      expect(screen.getByText('Epilogue')).toBeInTheDocument();
    });

    it('should display correct content in Styles view', async () => {
      const user = userEvent.setup();
      const bookWithStyles = createBookWithStyles(simpleBook);
      renderNavigatorWithBook(bookWithStyles);

      const stylesButton = screen.getByTestId('view-button-styles');
      await user.click(stylesButton);

      // Should show style names
      expect(screen.getByText('Classic Serif')).toBeInTheDocument();
      expect(screen.getByText('Modern Sans')).toBeInTheDocument();
    });

    it('should show empty message when no content is available in Contents view', () => {
      const emptyBook: Book = {
        ...simpleBook,
        chapters: [],
        frontMatter: [],
        backMatter: [],
      };
      renderNavigatorWithBook(emptyBook);

      expect(screen.getByText('No content available')).toBeInTheDocument();
    });

    it('should show empty message when no styles are available in Styles view', async () => {
      const user = userEvent.setup();
      renderNavigatorWithBook(simpleBook);

      const stylesButton = screen.getByTestId('view-button-styles');
      await user.click(stylesButton);

      expect(screen.getByText('No styles available')).toBeInTheDocument();
    });
  });

  describe('Mouse Selection', () => {
    it('should highlight selected element when clicked', async () => {
      const user = userEvent.setup();
      renderNavigatorWithBook(simpleBook);

      const firstChapter = screen.getByTestId('navigator-item-chapter-1');
      await user.click(firstChapter);

      expect(firstChapter).toHaveClass('selected');
    });

    it('should fire onSelect callback when element is clicked', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      renderNavigatorWithBook(simpleBook, { onSelect });

      const firstChapter = screen.getByTestId('navigator-item-chapter-1');
      await user.click(firstChapter);

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(['chapter-1']);
    });

    it('should support single selection by default', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      renderNavigatorWithBook(simpleBook, { onSelect });

      const firstChapter = screen.getByTestId('navigator-item-chapter-1');
      const secondChapter = screen.getByTestId('navigator-item-chapter-2');

      await user.click(firstChapter);
      expect(firstChapter).toHaveClass('selected');

      await user.click(secondChapter);
      expect(secondChapter).toHaveClass('selected');
      expect(firstChapter).not.toHaveClass('selected');
    });

    it('should support Cmd+click for multi-select on Mac', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      renderNavigatorWithBook(simpleBook, { onSelect, multiSelect: true });

      const firstChapter = screen.getByTestId('navigator-item-chapter-1');
      const secondChapter = screen.getByTestId('navigator-item-chapter-2');

      await user.click(firstChapter);
      await user.click(secondChapter, { metaKey: true });

      expect(firstChapter).toHaveClass('selected');
      expect(secondChapter).toHaveClass('selected');
      expect(onSelect).toHaveBeenLastCalledWith(['chapter-1', 'chapter-2']);
    });

    it('should support Ctrl+click for multi-select on Windows/Linux', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      renderNavigatorWithBook(simpleBook, { onSelect, multiSelect: true });

      const firstChapter = screen.getByTestId('navigator-item-chapter-1');
      const secondChapter = screen.getByTestId('navigator-item-chapter-2');

      await user.click(firstChapter);
      await user.click(secondChapter, { ctrlKey: true });

      expect(firstChapter).toHaveClass('selected');
      expect(secondChapter).toHaveClass('selected');
      expect(onSelect).toHaveBeenLastCalledWith(['chapter-1', 'chapter-2']);
    });

    it('should deselect item with Cmd+click when already selected', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      renderNavigatorWithBook(simpleBook, { onSelect, multiSelect: true });

      const firstChapter = screen.getByTestId('navigator-item-chapter-1');

      // Select
      await user.click(firstChapter);
      expect(firstChapter).toHaveClass('selected');

      // Deselect with Cmd+click
      await user.click(firstChapter, { metaKey: true });
      expect(firstChapter).not.toHaveClass('selected');
      expect(onSelect).toHaveBeenLastCalledWith([]);
    });

    it('should support Shift+click for range selection', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      renderNavigatorWithBook(simpleBook, { onSelect, multiSelect: true });

      const firstChapter = screen.getByTestId('navigator-item-chapter-1');
      const thirdChapter = screen.getByTestId('navigator-item-chapter-3');

      await user.click(firstChapter);
      await user.click(thirdChapter, { shiftKey: true });

      // All three chapters should be selected
      expect(firstChapter).toHaveClass('selected');
      expect(screen.getByTestId('navigator-item-chapter-2')).toHaveClass('selected');
      expect(thirdChapter).toHaveClass('selected');
      expect(onSelect).toHaveBeenLastCalledWith(['chapter-1', 'chapter-2', 'chapter-3']);
    });

    it('should clear selection when clicking blank area', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      renderNavigatorWithBook(simpleBook, { onSelect });

      const firstChapter = screen.getByTestId('navigator-item-chapter-1');
      await user.click(firstChapter);
      expect(firstChapter).toHaveClass('selected');

      // Click on blank area
      const content = document.querySelector('.navigator-content');
      await user.click(content!);

      expect(firstChapter).not.toHaveClass('selected');
      expect(onSelect).toHaveBeenLastCalledWith([]);
    });

    it('should disable multi-select when multiSelect prop is false', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      renderNavigatorWithBook(simpleBook, { onSelect, multiSelect: false });

      const firstChapter = screen.getByTestId('navigator-item-chapter-1');
      const secondChapter = screen.getByTestId('navigator-item-chapter-2');

      await user.click(firstChapter);
      await user.click(secondChapter, { metaKey: true });

      // Only second chapter should be selected (Cmd+click ignored)
      expect(firstChapter).not.toHaveClass('selected');
      expect(secondChapter).toHaveClass('selected');
      expect(onSelect).toHaveBeenLastCalledWith(['chapter-2']);
    });
  });

  describe('Keyboard Selection', () => {
    it('should select next item with ArrowDown key', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      renderNavigatorWithBook(simpleBook, { onSelect });

      const navigator = document.querySelector('.navigator') as HTMLElement;
      navigator.focus();

      // Select first item
      const firstChapter = screen.getByTestId('navigator-item-chapter-1');
      await user.click(firstChapter);

      // Press ArrowDown
      await user.keyboard('{ArrowDown}');

      const secondChapter = screen.getByTestId('navigator-item-chapter-2');
      expect(secondChapter).toHaveClass('selected');
      expect(firstChapter).not.toHaveClass('selected');
      expect(onSelect).toHaveBeenLastCalledWith(['chapter-2']);
    });

    it('should select previous item with ArrowUp key', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      renderNavigatorWithBook(simpleBook, { onSelect });

      const navigator = document.querySelector('.navigator') as HTMLElement;
      navigator.focus();

      // Select second item
      const secondChapter = screen.getByTestId('navigator-item-chapter-2');
      await user.click(secondChapter);

      // Press ArrowUp
      await user.keyboard('{ArrowUp}');

      const firstChapter = screen.getByTestId('navigator-item-chapter-1');
      expect(firstChapter).toHaveClass('selected');
      expect(secondChapter).not.toHaveClass('selected');
      expect(onSelect).toHaveBeenLastCalledWith(['chapter-1']);
    });

    it('should support Shift+ArrowDown for multi-select', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      renderNavigatorWithBook(simpleBook, { onSelect, multiSelect: true });

      const navigator = document.querySelector('.navigator') as HTMLElement;
      navigator.focus();

      // Select first item
      const firstChapter = screen.getByTestId('navigator-item-chapter-1');
      await user.click(firstChapter);

      // Press Shift+ArrowDown
      await user.keyboard('{Shift>}{ArrowDown}{/Shift}');

      const secondChapter = screen.getByTestId('navigator-item-chapter-2');
      expect(firstChapter).toHaveClass('selected');
      expect(secondChapter).toHaveClass('selected');
    });

    it('should support Shift+ArrowUp for multi-select', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      renderNavigatorWithBook(simpleBook, { onSelect, multiSelect: true });

      const navigator = document.querySelector('.navigator') as HTMLElement;
      navigator.focus();

      // Select second item
      const secondChapter = screen.getByTestId('navigator-item-chapter-2');
      await user.click(secondChapter);

      // Press Shift+ArrowUp
      await user.keyboard('{Shift>}{ArrowUp}{/Shift}');

      const firstChapter = screen.getByTestId('navigator-item-chapter-1');
      expect(firstChapter).toHaveClass('selected');
      expect(secondChapter).toHaveClass('selected');
    });

    it('should not go beyond first item when pressing ArrowUp', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      renderNavigatorWithBook(simpleBook, { onSelect });

      const navigator = document.querySelector('.navigator') as HTMLElement;
      navigator.focus();

      // Select first item
      const firstChapter = screen.getByTestId('navigator-item-chapter-1');
      await user.click(firstChapter);

      // Try to go up
      await user.keyboard('{ArrowUp}');

      // Should still be on first item
      expect(firstChapter).toHaveClass('selected');
      expect(onSelect).toHaveBeenLastCalledWith(['chapter-1']);
    });

    it('should not go beyond last item when pressing ArrowDown', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      renderNavigatorWithBook(simpleBook, { onSelect });

      const navigator = document.querySelector('.navigator') as HTMLElement;
      navigator.focus();

      // Select last item
      const thirdChapter = screen.getByTestId('navigator-item-chapter-3');
      await user.click(thirdChapter);

      // Try to go down
      await user.keyboard('{ArrowDown}');

      // Should still be on last item
      expect(thirdChapter).toHaveClass('selected');
      expect(onSelect).toHaveBeenLastCalledWith(['chapter-3']);
    });
  });

  describe('Active Element Styling', () => {
    it('should apply "selected" class to active element', async () => {
      const user = userEvent.setup();
      renderNavigatorWithBook(simpleBook);

      const firstChapter = screen.getByTestId('navigator-item-chapter-1');
      await user.click(firstChapter);

      expect(firstChapter).toHaveClass('selected');
    });

    it('should apply type-specific class to elements', () => {
      renderNavigatorWithBook(complexBook);

      const chapter = screen.getByTestId('navigator-item-chapter-1');
      const element = screen.getByTestId('navigator-item-element-title-page');

      expect(chapter).toHaveClass('chapter');
      expect(element).toHaveClass('element');
    });

    it('should apply "style" class to style items', async () => {
      const user = userEvent.setup();
      const bookWithStyles = createBookWithStyles(simpleBook);
      renderNavigatorWithBook(bookWithStyles);

      const stylesButton = screen.getByTestId('view-button-styles');
      await user.click(stylesButton);

      const styleItem = screen.getByTestId('navigator-item-style-1');
      expect(styleItem).toHaveClass('style');
    });
  });

  describe('Selection Persistence Across View Switches', () => {
    it('should maintain selection when switching between views', async () => {
      const user = userEvent.setup();
      const bookWithStyles = createBookWithStyles(simpleBook);
      renderNavigatorWithBook(bookWithStyles);

      // Select a chapter in Contents view
      const firstChapter = screen.getByTestId('navigator-item-chapter-1');
      await user.click(firstChapter);
      expect(firstChapter).toHaveClass('selected');

      // Switch to Styles view
      const stylesButton = screen.getByTestId('view-button-styles');
      await user.click(stylesButton);

      // Switch back to Contents view
      const contentsButton = screen.getByTestId('view-button-contents');
      await user.click(contentsButton);

      // Selection should still be maintained
      const firstChapterAfterSwitch = screen.getByTestId('navigator-item-chapter-1');
      expect(firstChapterAfterSwitch).toHaveClass('selected');
    });

    it('should maintain multi-selection when switching views', async () => {
      const user = userEvent.setup();
      const bookWithStyles = createBookWithStyles(simpleBook);
      renderNavigatorWithBook(bookWithStyles, { multiSelect: true });

      // Select multiple chapters
      const firstChapter = screen.getByTestId('navigator-item-chapter-1');
      const secondChapter = screen.getByTestId('navigator-item-chapter-2');

      await user.click(firstChapter);
      await user.click(secondChapter, { metaKey: true });

      expect(firstChapter).toHaveClass('selected');
      expect(secondChapter).toHaveClass('selected');

      // Switch to Styles view
      const stylesButton = screen.getByTestId('view-button-styles');
      await user.click(stylesButton);

      // Switch back to Contents view
      const contentsButton = screen.getByTestId('view-button-contents');
      await user.click(contentsButton);

      // Both selections should still be maintained
      const firstChapterAfterSwitch = screen.getByTestId('navigator-item-chapter-1');
      const secondChapterAfterSwitch = screen.getByTestId('navigator-item-chapter-2');

      expect(firstChapterAfterSwitch).toHaveClass('selected');
      expect(secondChapterAfterSwitch).toHaveClass('selected');
    });

    it('should allow independent selections in different views', async () => {
      const user = userEvent.setup();
      const bookWithStyles = createBookWithStyles(simpleBook);
      renderNavigatorWithBook(bookWithStyles);

      // Select a chapter in Contents view
      const firstChapter = screen.getByTestId('navigator-item-chapter-1');
      await user.click(firstChapter);

      // Switch to Styles view
      const stylesButton = screen.getByTestId('view-button-styles');
      await user.click(stylesButton);

      // Select a style
      const firstStyle = screen.getByTestId('navigator-item-style-1');
      await user.click(firstStyle);
      expect(firstStyle).toHaveClass('selected');

      // Switch back to Contents view
      const contentsButton = screen.getByTestId('view-button-contents');
      await user.click(contentsButton);

      // Chapter selection should be maintained
      const firstChapterAfterSwitch = screen.getByTestId('navigator-item-chapter-1');
      expect(firstChapterAfterSwitch).toHaveClass('selected');
    });
  });

  describe('Controlled Component Behavior', () => {
    it('should work as a controlled component with selectedIds prop', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      renderNavigatorWithBook(simpleBook, { selectedIds: ['chapter-1'], onSelect });

      const firstChapter = screen.getByTestId('navigator-item-chapter-1');
      expect(firstChapter).toHaveClass('selected');

      // Click should call onSelect but not change selection (controlled)
      const secondChapter = screen.getByTestId('navigator-item-chapter-2');
      await user.click(secondChapter);

      expect(onSelect).toHaveBeenCalledWith(['chapter-2']);
      // Selection should still be chapter-1 (controlled by prop)
      expect(firstChapter).toHaveClass('selected');
    });

    it('should work as a controlled component with view prop', async () => {
      const user = userEvent.setup();
      const onViewChange = jest.fn();
      const bookWithStyles = createBookWithStyles(simpleBook);
      renderNavigatorWithBook(bookWithStyles, { view: 'contents', onViewChange });

      const stylesButton = screen.getByTestId('view-button-styles');
      await user.click(stylesButton);

      // Should call onViewChange but not change view (controlled)
      expect(onViewChange).toHaveBeenCalledWith('styles');

      // Contents should still be visible (controlled by prop)
      expect(screen.getByText('Chapter One')).toBeInTheDocument();
    });
  });

  describe('Complex Book Structure', () => {
    it('should render front matter, chapters, and back matter in correct order', () => {
      renderNavigatorWithBook(complexBook);

      const items = screen.getAllByRole('listitem');
      const itemTitles = items.map((item) => item.textContent);

      // Front matter should come first
      expect(itemTitles[0]).toBe('Title Page');
      expect(itemTitles[1]).toBe('Copyright');

      // Chapters in the middle
      const chapterIndex = itemTitles.indexOf('The Beginning');
      expect(chapterIndex).toBeGreaterThan(0);

      // Back matter at the end
      const lastFewItems = itemTitles.slice(-5);
      expect(lastFewItems).toContain('Epilogue');
      expect(lastFewItems).toContain('About the Authors');
    });

    it('should handle selection across different content types', async () => {
      const user = userEvent.setup();
      const onSelect = jest.fn();
      renderNavigatorWithBook(complexBook, { onSelect, multiSelect: true });

      // Select a front matter element
      const titlePage = screen.getByTestId('navigator-item-element-title-page');
      await user.click(titlePage);

      // Select a chapter
      const chapter = screen.getByTestId('navigator-item-chapter-1');
      await user.click(chapter, { metaKey: true });

      // Select a back matter element
      const epilogue = screen.getByTestId('navigator-item-element-epilogue');
      await user.click(epilogue, { metaKey: true });

      // Query elements again after all clicks to get fresh DOM references
      expect(screen.getByTestId('navigator-item-element-title-page')).toHaveClass('selected');
      expect(screen.getByTestId('navigator-item-chapter-1')).toHaveClass('selected');
      expect(screen.getByTestId('navigator-item-element-epilogue')).toHaveClass('selected');
    });
  });
});
