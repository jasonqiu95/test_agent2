/**
 * Navigator Component Rendering Tests
 * Tests for Navigator component basic rendering, structure display, and styling
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { Navigator } from '../Navigator';
import {
  simpleBook,
  complexBook,
  emptyBook,
  bookWithParts,
  bookWithOnlyFrontMatter,
} from '../../../test/fixtures/bookData';
import { setupTestMocks, cleanupTestMocks } from '../../../test/utils/testHelpers';

describe('Navigator - Basic Rendering', () => {
  beforeEach(() => {
    setupTestMocks();
  });

  afterEach(() => {
    cleanupTestMocks();
  });

  describe('Component Mounting', () => {
    it('should mount without crashing when no book is provided', () => {
      const { container } = render(<Navigator />);
      expect(container).toBeInTheDocument();
    });

    it('should mount without crashing with a book', () => {
      const { container } = render(<Navigator book={simpleBook} />);
      expect(container).toBeInTheDocument();
    });

    it('should mount without crashing with complex book', () => {
      const { container } = render(<Navigator book={complexBook} />);
      expect(container).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <Navigator book={simpleBook} className="custom-navigator" />
      );
      const navigator = container.querySelector('.navigator');
      expect(navigator).toHaveClass('custom-navigator');
    });
  });

  describe('Empty State Rendering', () => {
    it('should render empty state when no book is provided', () => {
      render(<Navigator />);
      expect(screen.getByText('No book loaded')).toBeInTheDocument();
      expect(screen.getByText('Open or create a book to get started')).toBeInTheDocument();
    });

    it('should render empty state when book has no content', () => {
      render(<Navigator book={emptyBook} />);
      expect(screen.getByText('No content yet')).toBeInTheDocument();
      expect(screen.getByText('Add chapters or matter to begin')).toBeInTheDocument();
    });

    it('should apply correct CSS classes for empty state', () => {
      const { container } = render(<Navigator />);
      const navigator = container.querySelector('.navigator');
      expect(navigator).toHaveClass('navigator-empty');

      const emptyState = container.querySelector('.navigator-empty-state');
      expect(emptyState).toBeInTheDocument();
    });

    it('should have correct structure for empty state', () => {
      const { container } = render(<Navigator />);
      const emptyState = container.querySelector('.navigator-empty-state');
      expect(emptyState).toBeInTheDocument();

      const message = emptyState?.querySelector('.navigator-empty-message');
      const hint = emptyState?.querySelector('.navigator-empty-hint');

      expect(message).toBeInTheDocument();
      expect(hint).toBeInTheDocument();
    });
  });

  describe('Book Structure Tree Rendering', () => {
    it('should render tree view for simple book with chapters', () => {
      render(<Navigator book={simpleBook} />);

      const chaptersSection = screen.getByLabelText('Chapters section');
      expect(chaptersSection).toBeInTheDocument();
    });

    it('should render all three main sections', () => {
      render(<Navigator book={complexBook} />);

      expect(screen.getByLabelText('Front Matter section')).toBeInTheDocument();
      expect(screen.getByLabelText('Chapters section')).toBeInTheDocument();
      expect(screen.getByLabelText('Back Matter section')).toBeInTheDocument();
    });

    it('should display section titles correctly', () => {
      render(<Navigator book={complexBook} />);

      expect(screen.getByText('Front Matter')).toBeInTheDocument();
      expect(screen.getByText('Chapters')).toBeInTheDocument();
      expect(screen.getByText('Back Matter')).toBeInTheDocument();
    });

    it('should display item counts for each section', () => {
      render(<Navigator book={complexBook} />);

      // complexBook has 8 front matter, 6 chapters, 5 back matter
      expect(screen.getByText('(8)')).toBeInTheDocument();
      expect(screen.getByText('(6)')).toBeInTheDocument();
      expect(screen.getByText('(5)')).toBeInTheDocument();
    });

    it('should render correct number of chapters', () => {
      render(<Navigator book={simpleBook} />);

      // simpleBook has 3 chapters
      expect(screen.getByText(/Chapter 1: Chapter One/)).toBeInTheDocument();
      expect(screen.getByText(/Chapter 2: Chapter Two/)).toBeInTheDocument();
      expect(screen.getByText(/Chapter 3: Chapter Three/)).toBeInTheDocument();
    });

    it('should render tree view with proper hierarchy', () => {
      const { container } = render(<Navigator book={complexBook} />);

      const treeView = container.querySelector('.tree-view');
      expect(treeView).toBeInTheDocument();

      const sections = container.querySelectorAll('.tree-section');
      expect(sections).toHaveLength(3); // Front Matter, Chapters, Back Matter
    });
  });

  describe('Element Types Display', () => {
    describe('Chapter Elements', () => {
      it('should display chapters with correct numbering and titles', () => {
        render(<Navigator book={complexBook} />);

        expect(screen.getByText('Chapter 1: The Beginning')).toBeInTheDocument();
        expect(screen.getByText('Chapter 2: The Journey')).toBeInTheDocument();
        expect(screen.getByText('Chapter 3: The Discovery')).toBeInTheDocument();
        expect(screen.getByText('Chapter 4: The Revelation')).toBeInTheDocument();
        expect(screen.getByText('Chapter 5: The Confrontation')).toBeInTheDocument();
        expect(screen.getByText('Chapter 6: The Resolution')).toBeInTheDocument();
      });

      it('should render chapters as tree items', () => {
        const { container } = render(<Navigator book={simpleBook} />);

        const chapterItems = container.querySelectorAll('.tree-item');
        expect(chapterItems.length).toBeGreaterThan(0);
      });
    });

    describe('Front Matter Elements', () => {
      it('should display title page', () => {
        render(<Navigator book={complexBook} />);
        expect(screen.getByText('Title Page')).toBeInTheDocument();
      });

      it('should display copyright', () => {
        render(<Navigator book={complexBook} />);
        expect(screen.getByText('Copyright')).toBeInTheDocument();
      });

      it('should display dedication', () => {
        render(<Navigator book={complexBook} />);
        expect(screen.getByText('Dedication')).toBeInTheDocument();
      });

      it('should display epigraph', () => {
        render(<Navigator book={complexBook} />);
        expect(screen.getByText('Epigraph')).toBeInTheDocument();
      });

      it('should display foreword', () => {
        render(<Navigator book={complexBook} />);
        expect(screen.getByText('Foreword')).toBeInTheDocument();
      });

      it('should display preface', () => {
        render(<Navigator book={complexBook} />);
        expect(screen.getByText('Preface')).toBeInTheDocument();
      });

      it('should display acknowledgments in front matter', () => {
        render(<Navigator book={complexBook} />);
        const frontMatterSection = screen.getByLabelText('Front Matter section');
        const acknowledgments = within(frontMatterSection.parentElement!).getByText('Acknowledgments');
        expect(acknowledgments).toBeInTheDocument();
      });

      it('should display prologue', () => {
        render(<Navigator book={complexBook} />);
        expect(screen.getByText('Prologue')).toBeInTheDocument();
      });

      it('should render all 8 front matter elements', () => {
        const { container } = render(<Navigator book={complexBook} />);

        const frontMatterSection = container.querySelector('.tree-section');
        const frontMatterItems = frontMatterSection?.querySelectorAll('.tree-item');
        expect(frontMatterItems).toHaveLength(8);
      });
    });

    describe('Back Matter Elements', () => {
      it('should display epilogue', () => {
        render(<Navigator book={complexBook} />);
        expect(screen.getByText('Epilogue')).toBeInTheDocument();
      });

      it('should display afterword', () => {
        render(<Navigator book={complexBook} />);
        expect(screen.getByText('Afterword')).toBeInTheDocument();
      });

      it('should display about the authors', () => {
        render(<Navigator book={complexBook} />);
        expect(screen.getByText('About the Authors')).toBeInTheDocument();
      });

      it('should display also by the authors', () => {
        render(<Navigator book={complexBook} />);
        expect(screen.getByText('Also By the Authors')).toBeInTheDocument();
      });

      it('should render all back matter elements correctly', () => {
        const { container } = render(<Navigator book={complexBook} />);

        const sections = container.querySelectorAll('.tree-section');
        const backMatterSection = sections[2]; // Third section
        const backMatterItems = backMatterSection?.querySelectorAll('.tree-item');
        expect(backMatterItems).toHaveLength(5);
      });
    });

    describe('Mixed Content', () => {
      it('should render book with only front matter', () => {
        render(<Navigator book={bookWithOnlyFrontMatter} />);

        expect(screen.getByText('Title Page')).toBeInTheDocument();
        expect(screen.getByText('Dedication')).toBeInTheDocument();
        expect(screen.getByText('Preface')).toBeInTheDocument();
      });

      it('should not show empty chapters section message for book with only front matter', () => {
        const { container } = render(<Navigator book={bookWithOnlyFrontMatter} />);

        const sections = container.querySelectorAll('.tree-section');
        const chaptersSection = Array.from(sections).find(section =>
          section.querySelector('.tree-section-title')?.textContent === 'Chapters'
        );

        const emptyMessage = chaptersSection?.querySelector('.tree-empty-message');
        expect(emptyMessage).toBeInTheDocument();
        expect(emptyMessage).toHaveTextContent('No items');
      });
    });
  });

  describe('Element Titles and Metadata', () => {
    it('should display chapter titles with numbers', () => {
      render(<Navigator book={simpleBook} />);

      expect(screen.getByText('Chapter 1: Chapter One')).toBeInTheDocument();
      expect(screen.getByText('Chapter 2: Chapter Two')).toBeInTheDocument();
    });

    it('should display element titles for front matter', () => {
      const { container } = render(<Navigator book={complexBook} />);

      const frontMatterTitles = [
        'Title Page',
        'Copyright',
        'Dedication',
        'Epigraph',
        'Foreword',
        'Preface',
        'Acknowledgments',
        'Prologue',
      ];

      const sections = container.querySelectorAll('.tree-section');
      const frontMatterSection = sections[0]; // First section

      frontMatterTitles.forEach(title => {
        const titleElement = within(frontMatterSection as HTMLElement).getByText(title);
        expect(titleElement).toBeInTheDocument();
      });
    });

    it('should display element titles for back matter', () => {
      render(<Navigator book={complexBook} />);

      const backMatterTitles = [
        'Epilogue',
        'Afterword',
        'About the Authors',
        'Also By the Authors',
      ];

      backMatterTitles.forEach(title => {
        expect(screen.getByText(title)).toBeInTheDocument();
      });
    });

    it('should show item count metadata for sections', () => {
      render(<Navigator book={complexBook} />);

      const chaptersSection = screen.getByLabelText('Chapters section');
      expect(within(chaptersSection).getByText('(6)')).toBeInTheDocument();
    });
  });

  describe('Nested Structure', () => {
    it('should render chapters within chapters section', () => {
      const { container } = render(<Navigator book={simpleBook} />);

      const chaptersSection = container.querySelectorAll('.tree-section')[1]; // Chapters is second
      const chapterItems = chaptersSection.querySelectorAll('.tree-item');

      expect(chapterItems.length).toBe(3);
    });

    it('should render front matter items within front matter section', () => {
      const { container } = render(<Navigator book={complexBook} />);

      const frontMatterSection = container.querySelectorAll('.tree-section')[0]; // First section
      const frontMatterItems = frontMatterSection.querySelectorAll('.tree-item');

      expect(frontMatterItems.length).toBe(8);
    });

    it('should render back matter items within back matter section', () => {
      const { container } = render(<Navigator book={complexBook} />);

      const backMatterSection = container.querySelectorAll('.tree-section')[2]; // Third section
      const backMatterItems = backMatterSection.querySelectorAll('.tree-item');

      expect(backMatterItems.length).toBe(5);
    });

    it('should maintain proper parent-child relationship in DOM', () => {
      const { container } = render(<Navigator book={complexBook} />);

      const treeView = container.querySelector('.tree-view');
      const sections = treeView?.querySelectorAll('.tree-section');

      expect(sections).toHaveLength(3);

      sections?.forEach(section => {
        const header = section.querySelector('.tree-section-header');
        const items = section.querySelector('.tree-section-items');

        expect(header).toBeInTheDocument();
        expect(items).toBeInTheDocument();
      });
    });

    it('should render section headers before section items', () => {
      const { container } = render(<Navigator book={complexBook} />);

      const sections = container.querySelectorAll('.tree-section');

      sections.forEach(section => {
        const children = Array.from(section.children);
        const headerIndex = children.findIndex(child =>
          child.classList.contains('tree-section-header')
        );
        const itemsIndex = children.findIndex(child =>
          child.classList.contains('tree-section-items')
        );

        expect(headerIndex).toBeLessThan(itemsIndex);
      });
    });
  });

  describe('CSS Classes and Styling', () => {
    it('should apply navigator base class', () => {
      const { container } = render(<Navigator book={simpleBook} />);
      expect(container.querySelector('.navigator')).toBeInTheDocument();
    });

    it('should apply tree-view class to tree structure', () => {
      const { container } = render(<Navigator book={simpleBook} />);
      expect(container.querySelector('.tree-view')).toBeInTheDocument();
    });

    it('should apply tree-section class to each section', () => {
      const { container } = render(<Navigator book={complexBook} />);
      const sections = container.querySelectorAll('.tree-section');
      expect(sections.length).toBeGreaterThan(0);
    });

    it('should apply tree-section-header class to section headers', () => {
      const { container } = render(<Navigator book={simpleBook} />);
      const headers = container.querySelectorAll('.tree-section-header');
      expect(headers.length).toBeGreaterThan(0);
    });

    it('should apply tree-section-title class to section titles', () => {
      const { container } = render(<Navigator book={simpleBook} />);
      const titles = container.querySelectorAll('.tree-section-title');
      expect(titles.length).toBeGreaterThan(0);
    });

    it('should apply tree-section-count class to item counts', () => {
      const { container } = render(<Navigator book={complexBook} />);
      const counts = container.querySelectorAll('.tree-section-count');
      expect(counts.length).toBeGreaterThan(0);
    });

    it('should apply tree-section-items class to items container', () => {
      const { container } = render(<Navigator book={simpleBook} />);
      const itemsContainers = container.querySelectorAll('.tree-section-items');
      expect(itemsContainers.length).toBeGreaterThan(0);
    });

    it('should apply tree-item class to each item', () => {
      const { container } = render(<Navigator book={simpleBook} />);
      const items = container.querySelectorAll('.tree-item');
      expect(items.length).toBeGreaterThan(0);
    });

    it('should apply tree-item-title class to item titles', () => {
      const { container } = render(<Navigator book={simpleBook} />);
      const itemTitles = container.querySelectorAll('.tree-item-title');
      expect(itemTitles.length).toBeGreaterThan(0);
    });

    it('should apply tree-section-icon class to expand/collapse icons', () => {
      const { container } = render(<Navigator book={simpleBook} />);
      const icons = container.querySelectorAll('.tree-section-icon');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should apply expanded class to section icons when expanded', () => {
      const { container } = render(<Navigator book={simpleBook} />);
      const icons = container.querySelectorAll('.tree-section-icon');

      // Sections are expanded by default
      icons.forEach(icon => {
        expect(icon).toHaveClass('expanded');
      });
    });

    it('should not apply navigator-empty class when book has content', () => {
      const { container } = render(<Navigator book={simpleBook} />);
      const navigator = container.querySelector('.navigator');
      expect(navigator).not.toHaveClass('navigator-empty');
    });

    it('should apply custom className alongside base classes', () => {
      const { container } = render(
        <Navigator book={simpleBook} className="my-custom-class" />
      );
      const navigator = container.querySelector('.navigator');
      expect(navigator).toHaveClass('navigator');
      expect(navigator).toHaveClass('my-custom-class');
    });
  });

  describe('DOM Structure Validation', () => {
    it('should have correct overall DOM hierarchy', () => {
      const { container } = render(<Navigator book={complexBook} />);

      const navigator = container.querySelector('.navigator');
      expect(navigator).toBeInTheDocument();

      const treeView = navigator?.querySelector('.tree-view');
      expect(treeView).toBeInTheDocument();

      const sections = treeView?.querySelectorAll('.tree-section');
      expect(sections?.length).toBe(3);
    });

    it('should render sections in correct order', () => {
      const { container } = render(<Navigator book={complexBook} />);

      const sections = container.querySelectorAll('.tree-section');
      const sectionTitles = Array.from(sections).map(section =>
        section.querySelector('.tree-section-title')?.textContent
      );

      expect(sectionTitles).toEqual(['Front Matter', 'Chapters', 'Back Matter']);
    });

    it('should have proper section structure', () => {
      const { container } = render(<Navigator book={complexBook} />);

      const sections = container.querySelectorAll('.tree-section');

      sections.forEach(section => {
        const header = section.querySelector('.tree-section-header');
        const icon = section.querySelector('.tree-section-icon');
        const title = section.querySelector('.tree-section-title');
        const count = section.querySelector('.tree-section-count');
        const items = section.querySelector('.tree-section-items');

        expect(header).toBeInTheDocument();
        expect(icon).toBeInTheDocument();
        expect(title).toBeInTheDocument();
        expect(count).toBeInTheDocument();
        expect(items).toBeInTheDocument();
      });
    });

    it('should have proper item structure', () => {
      const { container } = render(<Navigator book={simpleBook} />);

      const items = container.querySelectorAll('.tree-item');

      items.forEach(item => {
        const title = item.querySelector('.tree-item-title');
        expect(title).toBeInTheDocument();
      });
    });

    it('should render empty message when section has no items', () => {
      const { container } = render(<Navigator book={bookWithOnlyFrontMatter} />);

      const sections = container.querySelectorAll('.tree-section');
      const chaptersSection = sections[1]; // Chapters section

      const emptyMessage = chaptersSection.querySelector('.tree-empty-message');
      expect(emptyMessage).toBeInTheDocument();
      expect(emptyMessage).toHaveTextContent('No items');
    });

    it('should maintain consistent structure across different books', () => {
      const books = [simpleBook, complexBook, bookWithParts, bookWithOnlyFrontMatter];

      books.forEach(book => {
        const { container } = render(<Navigator book={book} />);

        const navigator = container.querySelector('.navigator');
        expect(navigator).toBeInTheDocument();

        const treeView = container.querySelector('.tree-view');
        expect(treeView).toBeInTheDocument();

        const sections = container.querySelectorAll('.tree-section');
        expect(sections.length).toBe(3); // Always 3 sections
      });
    });

    it('should render with correct accessibility attributes', () => {
      const { container } = render(<Navigator book={complexBook} />);

      const sections = container.querySelectorAll('.tree-section-header');
      sections.forEach(section => {
        expect(section).toHaveAttribute('role', 'button');
        expect(section).toHaveAttribute('tabIndex', '0');
        expect(section).toHaveAttribute('aria-expanded');
        expect(section).toHaveAttribute('aria-label');
      });

      const items = container.querySelectorAll('.tree-item');
      items.forEach(item => {
        expect(item).toHaveAttribute('role', 'button');
        expect(item).toHaveAttribute('tabIndex', '0');
        expect(item).toHaveAttribute('aria-selected');
        expect(item).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Special Cases', () => {
    it('should handle book with parts structure', () => {
      render(<Navigator book={bookWithParts} />);

      expect(screen.getByText('Chapter 1: The Awakening')).toBeInTheDocument();
      expect(screen.getByText('Chapter 4: The Quest')).toBeInTheDocument();
      expect(screen.getByText('Chapter 7: The Final Battle')).toBeInTheDocument();
    });

    it('should render chapters with part metadata', () => {
      const { container } = render(<Navigator book={bookWithParts} />);

      const chapterItems = container.querySelectorAll('.tree-item');
      expect(chapterItems.length).toBeGreaterThan(0);
    });

    it('should handle undefined book gracefully', () => {
      render(<Navigator book={undefined} />);
      expect(screen.getByText('No book loaded')).toBeInTheDocument();
    });

    it('should handle book with empty arrays', () => {
      const emptyArrayBook = {
        ...emptyBook,
        frontMatter: [],
        chapters: [],
        backMatter: [],
      };

      render(<Navigator book={emptyArrayBook} />);
      expect(screen.getByText('No content yet')).toBeInTheDocument();
    });
  });
});
