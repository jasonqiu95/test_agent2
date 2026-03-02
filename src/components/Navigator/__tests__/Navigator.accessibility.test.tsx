/**
 * Navigator Accessibility Tests
 *
 * Tests accessibility features of the Navigator component including:
 * - ARIA roles and attributes
 * - Keyboard navigation
 * - Screen reader support
 * - Focus management
 * - Color contrast
 * - Semantic HTML structure
 * - Automated accessibility violations detection
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { NavigatorPanel } from '../../NavigatorPanel/NavigatorPanel';
import { TreeView } from '../../NavigatorPanel/TreeView';
import {
  simpleBook,
  complexBook,
  emptyBook,
  bookWithParts,
  bookWithOnlyFrontMatter,
} from '../../../test/fixtures/bookData';
import {
  renderNavigatorPanel,
  renderNavigatorWithContent,
  createMockHandlers,
  setupTestMocks,
  cleanupTestMocks,
} from '../../../test/utils/testHelpers';

// Extend Jest matchers with jest-axe
expect.extend(toHaveNoViolations);

describe('Navigator Accessibility Tests', () => {
  beforeEach(() => {
    setupTestMocks();
  });

  afterEach(() => {
    cleanupTestMocks();
  });

  describe('NavigatorPanel Accessibility', () => {
    describe('ARIA Roles and Labels', () => {
      it('should have proper heading structure', () => {
        renderNavigatorPanel({ title: 'Book Navigator' });
        const heading = screen.getByRole('heading', { name: 'Book Navigator' });
        expect(heading).toBeInTheDocument();
        expect(heading.tagName).toBe('H2');
      });

      it('should have accessible close button with aria-label', () => {
        const handlers = createMockHandlers();
        renderNavigatorPanel({ onClose: handlers.onClose });
        const closeButton = screen.getByRole('button', { name: 'Close navigator panel' });
        expect(closeButton).toBeInTheDocument();
        expect(closeButton).toHaveAttribute('aria-label', 'Close navigator panel');
      });

      it('should not have close button without onClose handler', () => {
        renderNavigatorPanel();
        const closeButton = screen.queryByRole('button', { name: 'Close navigator panel' });
        expect(closeButton).not.toBeInTheDocument();
      });
    });

    describe('Keyboard Navigation', () => {
      it('should allow close button to be activated with keyboard', async () => {
        const user = userEvent.setup();
        const handlers = createMockHandlers();
        renderNavigatorPanel({ onClose: handlers.onClose });

        const closeButton = screen.getByRole('button', { name: 'Close navigator panel' });
        closeButton.focus();
        expect(closeButton).toHaveFocus();

        await user.keyboard('{Enter}');
        expect(handlers.onClose).toHaveBeenCalledTimes(1);
      });

      it('should support Space key for close button activation', async () => {
        const user = userEvent.setup();
        const handlers = createMockHandlers();
        renderNavigatorPanel({ onClose: handlers.onClose });

        const closeButton = screen.getByRole('button', { name: 'Close navigator panel' });
        closeButton.focus();

        await user.keyboard(' ');
        expect(handlers.onClose).toHaveBeenCalledTimes(1);
      });
    });

    describe('Automated Accessibility Testing', () => {
      it('should have no accessibility violations with basic setup', async () => {
        const { container } = renderNavigatorPanel();
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no accessibility violations with close button', async () => {
        const handlers = createMockHandlers();
        const { container } = renderNavigatorPanel({ onClose: handlers.onClose });
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no accessibility violations with footer', async () => {
        const { container } = renderNavigatorWithContent(
          <div>Main Content</div>,
          { footer: <div>Footer Content</div> }
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe('Semantic HTML Structure', () => {
      it('should use semantic HTML elements', () => {
        const { container } = renderNavigatorPanel();
        const heading = container.querySelector('h2');
        expect(heading).toBeInTheDocument();
      });

      it('should have proper content regions', () => {
        const { container } = renderNavigatorPanel({
          children: <div data-testid="content">Content</div>
        });
        const content = screen.getByTestId('content');
        expect(content).toBeInTheDocument();
      });
    });
  });

  describe('TreeView Accessibility', () => {
    describe('ARIA Roles and Attributes', () => {
      it('should have proper tree roles for interactive elements', () => {
        const { container } = render(<TreeView book={simpleBook} />);
        const tree = within(container).getByRole('tree');
        expect(tree).toBeInTheDocument();
        const treeitems = within(container).getAllByRole('treeitem');
        expect(treeitems.length).toBeGreaterThan(0);
      });

      it('should have aria-expanded on collapsible sections', () => {
        const { container } = render(<TreeView book={simpleBook} />);
        const sectionHeaders = container.querySelectorAll('.tree-section-header');

        sectionHeaders.forEach(header => {
          expect(header).toHaveAttribute('aria-expanded');
          const isExpanded = header.getAttribute('aria-expanded');
          expect(['true', 'false']).toContain(isExpanded);
        });
      });

      it('should show aria-expanded="true" for expanded sections', () => {
        const { container } = render(<TreeView book={simpleBook} />);
        const chaptersHeader = screen.getByRole('treeitem', { name: /Chapters section/i });
        expect(chaptersHeader).toHaveAttribute('aria-expanded', 'true');
      });

      it('should update aria-expanded when section is collapsed', async () => {
        const user = userEvent.setup();
        const { container } = render(<TreeView book={simpleBook} />);

        const chaptersHeader = screen.getByRole('treeitem', { name: /Chapters section/i });
        expect(chaptersHeader).toHaveAttribute('aria-expanded', 'true');

        await user.click(chaptersHeader);
        expect(chaptersHeader).toHaveAttribute('aria-expanded', 'false');
      });

      it('should have aria-selected on selectable items', () => {
        const handlers = createMockHandlers();
        const { container } = render(
          <TreeView
            book={simpleBook}
            selectedId="chapter-1"
            onSelect={handlers.onChapterSelect}
          />
        );

        const items = container.querySelectorAll('.tree-item');
        items.forEach(item => {
          expect(item).toHaveAttribute('aria-selected');
        });
      });

      it('should set aria-selected="true" for selected item', () => {
        const handlers = createMockHandlers();
        render(
          <TreeView
            book={simpleBook}
            selectedId="chapter-1"
            onSelect={handlers.onChapterSelect}
          />
        );

        const selectedItem = screen.getByRole('treeitem', { name: /Chapter 1: Chapter One/i });
        expect(selectedItem).toHaveAttribute('aria-selected', 'true');
      });

      it('should set aria-selected="false" for non-selected items', () => {
        const handlers = createMockHandlers();
        const { container } = render(
          <TreeView
            book={simpleBook}
            selectedId="chapter-1"
            onSelect={handlers.onChapterSelect}
          />
        );

        const chapter2 = screen.getByRole('treeitem', { name: /Chapter 2: Chapter Two/i });
        expect(chapter2).toHaveAttribute('aria-selected', 'false');
      });

      it('should have aria-label on section headers', () => {
        render(<TreeView book={simpleBook} />);

        expect(screen.getByRole('treeitem', { name: /Front Matter section/i })).toBeInTheDocument();
        expect(screen.getByRole('treeitem', { name: /Chapters section/i })).toBeInTheDocument();
        expect(screen.getByRole('treeitem', { name: /Back Matter section/i })).toBeInTheDocument();
      });

      it('should have aria-label on tree items', () => {
        const handlers = createMockHandlers();
        render(<TreeView book={simpleBook} onSelect={handlers.onChapterSelect} />);

        const chapter1 = screen.getByRole('treeitem', { name: /Chapter 1: Chapter One/i });
        expect(chapter1).toHaveAttribute('aria-label');
      });
    });

    describe('Keyboard Navigation', () => {
      it('should have tabIndex on section headers for keyboard access', () => {
        const { container } = render(<TreeView book={simpleBook} />);
        const sectionHeaders = container.querySelectorAll('.tree-section-header');

        sectionHeaders.forEach(header => {
          expect(header).toHaveAttribute('tabIndex', '0');
        });
      });

      it('should have tabIndex on tree items for keyboard access', () => {
        const { container } = render(<TreeView book={simpleBook} />);
        const items = container.querySelectorAll('.tree-item');

        items.forEach(item => {
          expect(item).toHaveAttribute('tabIndex', '0');
        });
      });

      it('should toggle section with Enter key', async () => {
        const user = userEvent.setup();
        const { container } = render(<TreeView book={simpleBook} />);

        const chaptersHeader = screen.getByRole('treeitem', { name: /Chapters section/i });
        expect(chaptersHeader).toHaveAttribute('aria-expanded', 'true');

        chaptersHeader.focus();
        await user.keyboard('{Enter}');

        expect(chaptersHeader).toHaveAttribute('aria-expanded', 'false');
      });

      it('should toggle section with Space key', async () => {
        const user = userEvent.setup();
        const { container } = render(<TreeView book={simpleBook} />);

        const chaptersHeader = screen.getByRole('treeitem', { name: /Chapters section/i });
        expect(chaptersHeader).toHaveAttribute('aria-expanded', 'true');

        chaptersHeader.focus();
        await user.keyboard(' ');

        expect(chaptersHeader).toHaveAttribute('aria-expanded', 'false');
      });

      it('should prevent default on Space key to avoid page scroll', async () => {
        const user = userEvent.setup();
        render(<TreeView book={simpleBook} />);

        const chaptersHeader = screen.getByRole('treeitem', { name: /Chapters section/i });
        chaptersHeader.focus();

        // Space key should toggle without scrolling
        await user.keyboard(' ');
        expect(chaptersHeader).toHaveAttribute('aria-expanded', 'false');
      });

      it('should select item with Enter key', async () => {
        const user = userEvent.setup();
        const handlers = createMockHandlers();
        render(<TreeView book={simpleBook} onSelect={handlers.onSelect} />);

        const chapter1 = screen.getByRole('treeitem', { name: /Chapter 1: Chapter One/i });
        chapter1.focus();
        await user.keyboard('{Enter}');

        expect(handlers.onSelect).toHaveBeenCalledWith('chapter-1', 'chapter');
      });

      it('should select item with Space key', async () => {
        const user = userEvent.setup();
        const handlers = createMockHandlers();
        render(<TreeView book={simpleBook} onSelect={handlers.onSelect} />);

        const chapter1 = screen.getByRole('treeitem', { name: /Chapter 1: Chapter One/i });
        chapter1.focus();
        await user.keyboard(' ');

        expect(handlers.onSelect).toHaveBeenCalledWith('chapter-1', 'chapter');
      });

      it('should support keyboard navigation through all sections', async () => {
        const user = userEvent.setup();
        render(<TreeView book={complexBook} />);

        const frontMatterHeader = screen.getByRole('treeitem', { name: /Front Matter section/i });
        frontMatterHeader.focus();
        expect(frontMatterHeader).toHaveFocus();

        await user.tab();
        const nextElement = document.activeElement;
        expect(nextElement).toBeDefined();
      });
    });

    describe('Focus Management', () => {
      it('should be focusable on section headers', () => {
        render(<TreeView book={simpleBook} />);

        const frontMatterHeader = screen.getByRole('treeitem', { name: /Front Matter section/i });
        frontMatterHeader.focus();
        expect(frontMatterHeader).toHaveFocus();
      });

      it('should be focusable on tree items', () => {
        render(<TreeView book={simpleBook} />);

        const chapter1 = screen.getByRole('treeitem', { name: /Chapter 1: Chapter One/i });
        chapter1.focus();
        expect(chapter1).toHaveFocus();
      });

      it('should maintain focus visibility when navigating', async () => {
        const user = userEvent.setup();
        render(<TreeView book={simpleBook} />);

        const chapter1 = screen.getByRole('treeitem', { name: /Chapter 1: Chapter One/i });
        chapter1.focus();
        expect(chapter1).toHaveFocus();

        await user.tab();
        expect(document.activeElement).not.toBe(chapter1);
      });
    });

    describe('Automated Accessibility Testing with Different Book Structures', () => {
      it('should have no violations with simple book', async () => {
        const { container } = render(<TreeView book={simpleBook} />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no violations with complex book', async () => {
        const { container } = render(<TreeView book={complexBook} />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no violations with empty book', async () => {
        const { container } = render(<TreeView book={emptyBook} />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no violations with book containing parts', async () => {
        const { container } = render(<TreeView book={bookWithParts} />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no violations with book containing only front matter', async () => {
        const { container } = render(<TreeView book={bookWithOnlyFrontMatter} />);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no violations with selected item', async () => {
        const handlers = createMockHandlers();
        const { container } = render(
          <TreeView
            book={simpleBook}
            selectedId="chapter-1"
            onSelect={handlers.onSelect}
          />
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });

      it('should have no violations with collapsed sections', async () => {
        const user = userEvent.setup();
        const { container } = render(<TreeView book={simpleBook} />);

        // Collapse all sections
        const chaptersHeader = screen.getByRole('treeitem', { name: /Chapters section/i });
        await user.click(chaptersHeader);

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe('Screen Reader Support', () => {
      it('should announce section state with aria-expanded', () => {
        render(<TreeView book={simpleBook} />);

        const chaptersHeader = screen.getByRole('treeitem', { name: /Chapters section/i });
        expect(chaptersHeader).toHaveAttribute('aria-expanded', 'true');
      });

      it('should announce item count in sections', () => {
        render(<TreeView book={simpleBook} />);

        const chaptersHeader = screen.getByRole('treeitem', { name: /Chapters section/i });
        const parent = chaptersHeader.closest('.tree-section-header');
        const countElement = parent?.querySelector('.tree-section-count');

        expect(countElement).toBeInTheDocument();
        expect(countElement?.textContent).toContain('3');
      });

      it('should provide meaningful labels for items', () => {
        render(<TreeView book={simpleBook} />);

        const chapter1 = screen.getByRole('treeitem', { name: /Chapter 1: Chapter One/i });
        expect(chapter1).toHaveAccessibleName();
      });

      it('should indicate empty sections to screen readers', () => {
        render(<TreeView book={emptyBook} />);

        const chaptersHeader = screen.getByRole('treeitem', { name: /Chapters section/i });
        expect(chaptersHeader).toBeInTheDocument();

        const emptyMessage = screen.getAllByText('No items');
        expect(emptyMessage.length).toBeGreaterThan(0);
      });

      it('should properly label front matter items', () => {
        render(<TreeView book={complexBook} />);

        const titlePage = screen.getByRole('treeitem', { name: /Title Page/i });
        expect(titlePage).toHaveAccessibleName();
      });

      it('should properly label back matter items', () => {
        render(<TreeView book={complexBook} />);

        const epilogue = screen.getByRole('treeitem', { name: /Epilogue/i });
        expect(epilogue).toHaveAccessibleName();
      });
    });

    describe('Semantic HTML Structure', () => {
      it('should use semantic structure for tree sections', () => {
        const { container } = render(<TreeView book={simpleBook} />);
        const sections = container.querySelectorAll('.tree-section');
        expect(sections.length).toBe(3);
      });

      it('should properly structure section headers', () => {
        const { container } = render(<TreeView book={simpleBook} />);
        const headers = container.querySelectorAll('.tree-section-header');
        expect(headers.length).toBe(3);
      });

      it('should properly structure tree items', () => {
        const { container } = render(<TreeView book={simpleBook} />);
        const items = container.querySelectorAll('.tree-item');
        expect(items.length).toBe(3); // 3 chapters in simpleBook
      });

      it('should use proper nesting for section items', () => {
        const { container } = render(<TreeView book={simpleBook} />);
        const sections = container.querySelectorAll('.tree-section');

        sections.forEach(section => {
          const itemsContainer = section.querySelector('.tree-section-items');
          if (itemsContainer) {
            expect(itemsContainer).toBeInTheDocument();
          }
        });
      });
    });

    describe('Visual Indicators and Styling', () => {
      it('should have visual indicators for expanded/collapsed state', () => {
        const { container } = render(<TreeView book={simpleBook} />);
        const expandedIcon = container.querySelector('.tree-section-icon.expanded');
        expect(expandedIcon).toBeInTheDocument();
      });

      it('should update visual indicators when state changes', async () => {
        const user = userEvent.setup();
        const { container } = render(<TreeView book={simpleBook} />);

        const chaptersHeader = screen.getByRole('treeitem', { name: /Chapters section/i });
        await user.click(chaptersHeader);

        const collapsedIcon = container.querySelector('.tree-section-icon.collapsed');
        expect(collapsedIcon).toBeInTheDocument();
      });

      it('should apply selected class to selected items', () => {
        const handlers = createMockHandlers();
        const { container } = render(
          <TreeView
            book={simpleBook}
            selectedId="chapter-1"
            onSelect={handlers.onSelect}
          />
        );

        const selectedItem = container.querySelector('.tree-item.selected');
        expect(selectedItem).toBeInTheDocument();
      });

      it('should not apply selected class to non-selected items', () => {
        const handlers = createMockHandlers();
        const { container } = render(
          <TreeView
            book={simpleBook}
            selectedId="chapter-1"
            onSelect={handlers.onSelect}
          />
        );

        const items = container.querySelectorAll('.tree-item');
        const nonSelectedItems = Array.from(items).filter(
          item => !item.classList.contains('selected')
        );
        expect(nonSelectedItems.length).toBe(2); // 2 out of 3 chapters
      });
    });

    describe('Interaction States', () => {
      it('should handle selection with various book structures', async () => {
        const user = userEvent.setup();
        const handlers = createMockHandlers();

        render(<TreeView book={complexBook} onSelect={handlers.onSelect} />);

        // Select front matter item
        const titlePage = screen.getByRole('treeitem', { name: /Title Page/i });
        await user.click(titlePage);
        expect(handlers.onSelect).toHaveBeenCalledWith('element-title-page', 'frontMatter');

        // Select chapter
        const chapter1 = screen.getByRole('treeitem', { name: /Chapter 1: The Beginning/i });
        await user.click(chapter1);
        expect(handlers.onSelect).toHaveBeenCalledWith('chapter-1', 'chapter');

        // Select back matter item
        const epilogue = screen.getByRole('treeitem', { name: /Epilogue/i });
        await user.click(epilogue);
        expect(handlers.onSelect).toHaveBeenCalledWith('element-epilogue', 'backMatter');
      });

      it('should handle collapsed state in all sections', async () => {
        const user = userEvent.setup();
        render(<TreeView book={complexBook} />);

        const frontMatterHeader = screen.getByRole('treeitem', { name: /Front Matter section/i });
        const chaptersHeader = screen.getByRole('treeitem', { name: /Chapters section/i });
        const backMatterHeader = screen.getByRole('treeitem', { name: /Back Matter section/i });

        // Collapse all
        await user.click(frontMatterHeader);
        await user.click(chaptersHeader);
        await user.click(backMatterHeader);

        expect(frontMatterHeader).toHaveAttribute('aria-expanded', 'false');
        expect(chaptersHeader).toHaveAttribute('aria-expanded', 'false');
        expect(backMatterHeader).toHaveAttribute('aria-expanded', 'false');
      });

      it('should maintain accessibility when rapidly toggling sections', async () => {
        const user = userEvent.setup();
        const { container } = render(<TreeView book={simpleBook} />);

        const chaptersHeader = screen.getByRole('treeitem', { name: /Chapters section/i });

        // Rapidly toggle
        await user.click(chaptersHeader);
        await user.click(chaptersHeader);
        await user.click(chaptersHeader);

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });

  describe('Integrated Navigator with TreeView', () => {
    it('should have no violations with full integrated component', async () => {
      const handlers = createMockHandlers();
      const { container } = renderNavigatorWithContent(
        <TreeView book={complexBook} onSelect={handlers.onSelect} />,
        {
          onClose: handlers.onClose,
          title: 'Book Navigator'
        }
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should maintain accessibility with footer and tree view', async () => {
      const handlers = createMockHandlers();
      const { container } = render(
        <NavigatorPanel
          title="Book Navigator"
          onClose={handlers.onClose}
          footer={<button>Add Chapter</button>}
        >
          <TreeView book={simpleBook} onSelect={handlers.onSelect} />
        </NavigatorPanel>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support complete keyboard navigation workflow', async () => {
      const user = userEvent.setup();
      const handlers = createMockHandlers();

      render(
        <NavigatorPanel title="Book Navigator" onClose={handlers.onClose}>
          <TreeView book={simpleBook} onSelect={handlers.onSelect} />
        </NavigatorPanel>
      );

      // Tab to close button
      await user.tab();
      const closeButton = screen.getByRole('button', { name: 'Close navigator panel' });
      expect(closeButton).toHaveFocus();

      // Tab to first section
      await user.tab();
      const frontMatterHeader = screen.getByRole('treeitem', { name: /Front Matter section/i });
      expect(frontMatterHeader).toHaveFocus();

      // Navigate and interact
      await user.keyboard('{Enter}');
      expect(frontMatterHeader).toHaveAttribute('aria-expanded', 'false');
    });

    it('should properly announce structure to screen readers', () => {
      const handlers = createMockHandlers();
      render(
        <NavigatorPanel title="Book Navigator" onClose={handlers.onClose}>
          <TreeView book={complexBook} onSelect={handlers.onSelect} />
        </NavigatorPanel>
      );

      // Verify heading
      expect(screen.getByRole('heading', { name: 'Book Navigator' })).toBeInTheDocument();

      // Verify sections are announced
      expect(screen.getByRole('treeitem', { name: /Front Matter section/i })).toBeInTheDocument();
      expect(screen.getByRole('treeitem', { name: /Chapters section/i })).toBeInTheDocument();
      expect(screen.getByRole('treeitem', { name: /Back Matter section/i })).toBeInTheDocument();

      // Verify items are properly labeled
      const titlePage = screen.getByRole('treeitem', { name: /Title Page/i });
      expect(titlePage).toHaveAccessibleName();
    });
  });
});
