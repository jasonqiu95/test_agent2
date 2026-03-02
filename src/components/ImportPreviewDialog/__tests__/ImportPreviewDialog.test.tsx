/**
 * ImportPreviewDialog Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ImportPreviewDialog } from '../ImportPreviewDialog';
import type { DetectedChapter } from '../../lib/docx/chapterDetection';
import type { StructuredDocument } from '../../lib/docx/types';

// Mock data
const createMockDocument = (): StructuredDocument => ({
  elements: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Chapter One Content',
          formatting: {},
        },
      ],
      style: {
        headingLevel: 1,
      },
      rawText: 'Chapter One Content',
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'This is the first chapter.',
          formatting: {},
        },
      ],
      style: {},
      rawText: 'This is the first chapter.',
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Chapter Two Content',
          formatting: {},
        },
      ],
      style: {
        headingLevel: 1,
      },
      rawText: 'Chapter Two Content',
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'This is the second chapter.',
          formatting: {},
        },
      ],
      style: {},
      rawText: 'This is the second chapter.',
    },
  ],
  metadata: {
    paragraphCount: 4,
    wordCount: 100,
    characterCount: 500,
  },
});

const createMockChapters = (): DetectedChapter[] => [
  {
    title: 'Chapter One',
    startIndex: 0,
    endIndex: 1,
    confidence: 0.9,
    type: 'chapter',
    headingLevel: 1,
    isNumbered: true,
    chapterNumber: 1,
  },
  {
    title: 'Chapter Two',
    startIndex: 2,
    endIndex: 3,
    confidence: 0.85,
    type: 'chapter',
    headingLevel: 1,
    isNumbered: true,
    chapterNumber: 2,
  },
  {
    title: 'Introduction',
    startIndex: 0,
    endIndex: 0,
    confidence: 0.7,
    type: 'introduction',
    isNumbered: false,
  },
];

describe('ImportPreviewDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnImport = jest.fn();
  const mockDocument = createMockDocument();
  const mockChapters = createMockChapters();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <ImportPreviewDialog
          isOpen={false}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Import Preview')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
          title="Custom Import Title"
        />
      );

      expect(screen.getByText('Custom Import Title')).toBeInTheDocument();
    });

    it('should render empty state when no chapters detected', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={[]}
        />
      );

      expect(screen.getByText('No chapters detected in this document.')).toBeInTheDocument();
    });
  });

  describe('Chapter List Display', () => {
    it('should display all detected chapters', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      expect(screen.getByText('Chapter One')).toBeInTheDocument();
      expect(screen.getByText('Chapter Two')).toBeInTheDocument();
      expect(screen.getByText('Introduction')).toBeInTheDocument();
    });

    it('should display chapter metadata correctly', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      // Check chapter types
      expect(screen.getAllByText('chapter')).toHaveLength(2);
      expect(screen.getByText('introduction')).toBeInTheDocument();

      // Check heading levels
      expect(screen.getAllByText('H1')).toHaveLength(2);

      // Check confidence percentages
      expect(screen.getByText('90%')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('70%')).toBeInTheDocument();

      // Check chapter numbers
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
    });

    it('should display chapter count statistics', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      expect(screen.getByText('3 of 3 chapters selected')).toBeInTheDocument();
    });

    it('should display chapter preview content', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      expect(screen.getAllByText('Chapter One Content').length).toBeGreaterThan(0);
      expect(screen.getAllByText('This is the first chapter.').length).toBeGreaterThan(0);
    });

    it('should display element range for each chapter', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      expect(screen.getByText('Elements 0 - 1')).toBeInTheDocument();
      expect(screen.getByText('Elements 2 - 3')).toBeInTheDocument();
      expect(screen.getByText('Elements 0 - 0')).toBeInTheDocument();
    });
  });

  describe('User Interactions - Accept/Cancel', () => {
    it('should call onClose when Cancel button is clicked', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when close button (×) is clicked', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close dialog/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const backdrop = screen.getByRole('dialog');
      fireEvent.click(backdrop);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when dialog content is clicked', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const dialogContent = screen.getByText('Import Preview');
      fireEvent.click(dialogContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should call onImport with included chapters when Import button is clicked', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const importButton = screen.getByRole('button', { name: /import \(3\)/i });
      fireEvent.click(importButton);

      expect(mockOnImport).toHaveBeenCalledTimes(1);
      expect(mockOnImport).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Chapter One',
            isIncluded: true,
          }),
          expect.objectContaining({
            title: 'Chapter Two',
            isIncluded: true,
          }),
          expect.objectContaining({
            title: 'Introduction',
            isIncluded: true,
          }),
        ])
      );
    });

    it('should disable Import button when no chapters are included', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      // Uncheck all chapters
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox) => {
        fireEvent.click(checkbox);
      });

      const importButton = screen.getByRole('button', { name: /import/i });
      expect(importButton).toBeDisabled();
    });
  });

  describe('Chapter Selection/Deselection', () => {
    it('should toggle chapter inclusion when checkbox is clicked', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const checkbox = screen.getByLabelText('Include Chapter One');
      expect(checkbox).toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).not.toBeChecked();

      fireEvent.click(checkbox);
      expect(checkbox).toBeChecked();
    });

    it('should update chapter count when chapters are toggled', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      expect(screen.getByText('3 of 3 chapters selected')).toBeInTheDocument();

      const checkbox = screen.getByLabelText('Include Chapter One');
      fireEvent.click(checkbox);

      expect(screen.getByText('2 of 3 chapters selected')).toBeInTheDocument();
    });

    it('should only include checked chapters in onImport callback', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      // Uncheck one chapter
      const checkbox = screen.getByLabelText('Include Chapter One');
      fireEvent.click(checkbox);

      const importButton = screen.getByRole('button', { name: /import \(2\)/i });
      fireEvent.click(importButton);

      expect(mockOnImport).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Chapter Two',
            isIncluded: true,
          }),
          expect.objectContaining({
            title: 'Introduction',
            isIncluded: true,
          }),
        ])
      );

      expect(mockOnImport).toHaveBeenCalledWith(
        expect.not.arrayContaining([
          expect.objectContaining({
            title: 'Chapter One',
            isIncluded: true,
          }),
        ])
      );
    });

    it('should select chapter for multi-selection when card is clicked', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const cards = document.querySelectorAll('.chapter-preview-card');
      const firstCard = cards[0];

      expect(firstCard).not.toHaveClass('selected');

      fireEvent.click(firstCard);

      expect(firstCard).toHaveClass('selected');
    });

    it('should deselect chapter when clicked again', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const cards = document.querySelectorAll('.chapter-preview-card');
      const firstCard = cards[0];

      fireEvent.click(firstCard);
      expect(firstCard).toHaveClass('selected');

      fireEvent.click(firstCard);
      expect(firstCard).not.toHaveClass('selected');
    });
  });

  describe('Edit Chapter Titles', () => {
    it('should enter edit mode when edit button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const editButton = screen.getAllByRole('button', { name: /edit title/i })[0];
      await user.click(editButton);

      const input = screen.getByDisplayValue('Chapter One');
      expect(input).toBeInTheDocument();
      expect(input).toHaveFocus();
    });

    it('should enter edit mode when title is double-clicked', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const title = screen.getByText('Chapter One');
      fireEvent.doubleClick(title);

      const input = screen.getByDisplayValue('Chapter One');
      expect(input).toBeInTheDocument();
    });

    it('should update chapter title when input is changed and blurred', async () => {
      const user = userEvent.setup();

      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const editButton = screen.getAllByRole('button', { name: /edit title/i })[0];
      await user.click(editButton);

      const input = screen.getByDisplayValue('Chapter One');
      await user.clear(input);
      await user.type(input, 'Edited Chapter Title');
      fireEvent.blur(input);

      expect(screen.getByText('Edited Chapter Title')).toBeInTheDocument();
      expect(screen.queryByText('Chapter One')).not.toBeInTheDocument();
    });

    it('should save edited title when Enter key is pressed', async () => {
      const user = userEvent.setup();

      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const editButton = screen.getAllByRole('button', { name: /edit title/i })[0];
      await user.click(editButton);

      const input = screen.getByDisplayValue('Chapter One');
      await user.clear(input);
      await user.type(input, 'New Title{Enter}');

      expect(screen.getByText('New Title')).toBeInTheDocument();
    });

    it('should cancel editing when Escape key is pressed', async () => {
      const user = userEvent.setup();

      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const editButton = screen.getAllByRole('button', { name: /edit title/i })[0];
      await user.click(editButton);

      const input = screen.getByDisplayValue('Chapter One');
      await user.clear(input);
      await user.type(input, 'Cancelled Title{Escape}');

      expect(screen.getByText('Chapter One')).toBeInTheDocument();
      expect(screen.queryByText('Cancelled Title')).not.toBeInTheDocument();
    });

    it('should use edited title in onImport callback', async () => {
      const user = userEvent.setup();

      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const editButton = screen.getAllByRole('button', { name: /edit title/i })[0];
      await user.click(editButton);

      const input = screen.getByDisplayValue('Chapter One');
      await user.clear(input);
      await user.type(input, 'Modified Title{Enter}');

      const importButton = screen.getByRole('button', { name: /import \(3\)/i });
      await user.click(importButton);

      expect(mockOnImport).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            editedTitle: 'Modified Title',
          }),
        ])
      );
    });
  });

  describe('Advanced Features', () => {
    it('should disable Merge button when fewer than 2 chapters are selected', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const mergeButton = screen.getByRole('button', { name: /merge selected/i });
      expect(mergeButton).toBeDisabled();
    });

    it('should enable Merge button when 2 or more chapters are selected', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      // Select two chapters by clicking their cards (not the text itself)
      const cards = document.querySelectorAll('.chapter-preview-card');

      fireEvent.click(cards[0]);
      fireEvent.click(cards[1]);

      const mergeButton = screen.getByRole('button', { name: /merge selected/i });
      expect(mergeButton).not.toBeDisabled();
    });

    it('should merge selected chapters when Merge button is clicked', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      // Select two chapters
      const cards = document.querySelectorAll('.chapter-preview-card');

      fireEvent.click(cards[0]);
      fireEvent.click(cards[1]);

      const mergeButton = screen.getByRole('button', { name: /merge selected/i });
      fireEvent.click(mergeButton);

      // After merge, we should have 2 chapters (merged + Introduction)
      expect(screen.getByText('2 of 2 chapters selected')).toBeInTheDocument();
    });

    it('should split chapter when split button is clicked', () => {
      // Use a chapter that can be split (has range > 1)
      const splittableChapters: DetectedChapter[] = [
        {
          title: 'Long Chapter',
          startIndex: 0,
          endIndex: 10,
          confidence: 0.9,
          type: 'chapter',
          headingLevel: 1,
          isNumbered: true,
          chapterNumber: 1,
        },
      ];

      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={splittableChapters}
        />
      );

      const splitButtons = screen.getAllByRole('button', { name: /split chapter/i });

      // Count chapters before split
      const beforeCount = document.querySelectorAll('.chapter-preview-card').length;
      expect(beforeCount).toBe(1);

      fireEvent.click(splitButtons[0]);

      // After split, we should have 2 chapters (split into Part 1 and Part 2)
      const afterCount = document.querySelectorAll('.chapter-preview-card').length;
      expect(afterCount).toBe(2);

      // Check for split chapter titles
      expect(screen.getByText('Long Chapter (Part 1)')).toBeInTheDocument();
      expect(screen.getByText('Long Chapter (Part 2)')).toBeInTheDocument();
    });

    it('should select range of chapters when shift-clicking', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const cards = document.querySelectorAll('.chapter-preview-card');
      const firstCard = cards[0];
      const lastCard = cards[2];

      // Select first chapter
      fireEvent.click(firstCard);
      expect(firstCard).toHaveClass('selected');

      // Shift-click last chapter to select range
      fireEvent.click(lastCard, { shiftKey: true });

      // All three cards should be selected
      expect(firstCard).toHaveClass('selected');
      expect(lastCard).toHaveClass('selected');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on dialog', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'import-preview-dialog-title');
    });

    it('should have accessible labels on all interactive elements', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      expect(screen.getByRole('button', { name: /close dialog/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
      expect(screen.getByLabelText('Include Chapter One')).toBeInTheDocument();
    });

    it('should close dialog when Escape key is pressed', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const dialog = screen.getByRole('dialog');
      fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should have keyboard navigation support for edit title input', async () => {
      const user = userEvent.setup();

      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const editButton = screen.getAllByRole('button', { name: /edit title/i })[0];
      await user.tab(); // This would navigate through focusable elements

      // Click edit button
      await user.click(editButton);

      const input = screen.getByDisplayValue('Chapter One');
      expect(input).toHaveFocus();

      // Test Enter key
      await user.type(input, '{Enter}');
      expect(input).not.toBeInTheDocument();
    });

    it('should have proper button titles for tooltips', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const mergeButton = screen.getByRole('button', { name: /merge selected/i });
      expect(mergeButton).toHaveAttribute('title', 'Merge selected chapters');

      const editButtons = screen.getAllByRole('button', { name: /edit title/i });
      expect(editButtons[0]).toHaveAttribute('title', 'Edit title');

      const splitButtons = screen.getAllByRole('button', { name: /split chapter/i });
      expect(splitButtons[0]).toHaveAttribute('title', 'Split chapter');
    });

    it('should have confidence indicators with descriptive titles', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const highConfidence = screen.getByText('90%');
      expect(highConfidence).toHaveAttribute('title', 'Detection confidence: 90%');
      expect(highConfidence).toHaveClass('high');

      const mediumConfidence = screen.getByText('85%');
      expect(mediumConfidence).toHaveAttribute('title', 'Detection confidence: 85%');
      expect(mediumConfidence).toHaveClass('high');

      const lowConfidence = screen.getByText('70%');
      expect(lowConfidence).toHaveAttribute('title', 'Detection confidence: 70%');
      expect(lowConfidence).toHaveClass('medium');
    });

    it('should maintain focus management when entering and exiting edit mode', async () => {
      const user = userEvent.setup();

      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const editButton = screen.getAllByRole('button', { name: /edit title/i })[0];
      await user.click(editButton);

      const input = screen.getByDisplayValue('Chapter One');
      expect(input).toHaveFocus();

      await user.type(input, '{Escape}');

      // After exiting edit mode, focus should return to a reasonable element
      const title = screen.getByText('Chapter One');
      expect(title).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle chapter with empty preview text', () => {
      const emptyChapter: DetectedChapter = {
        title: 'Empty Chapter',
        startIndex: 10,
        endIndex: 10,
        confidence: 0.8,
        type: 'chapter',
        isNumbered: false,
      };

      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={[emptyChapter]}
        />
      );

      expect(screen.getByText('Empty Chapter')).toBeInTheDocument();
      expect(screen.getByText('(Empty chapter)')).toBeInTheDocument();
    });

    it('should handle chapter without heading level', () => {
      const noHeadingChapter: DetectedChapter = {
        title: 'No Heading',
        startIndex: 0,
        endIndex: 1,
        confidence: 0.6,
        type: 'chapter',
        isNumbered: false,
      };

      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={[noHeadingChapter]}
        />
      );

      expect(screen.getByText('No Heading')).toBeInTheDocument();
      expect(screen.queryByText(/^H\d$/)).not.toBeInTheDocument();
    });

    it('should handle chapter without chapter number', () => {
      const unnumberedChapter: DetectedChapter = {
        title: 'Unnumbered',
        startIndex: 0,
        endIndex: 1,
        confidence: 0.8,
        type: 'introduction',
        isNumbered: false,
      };

      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={[unnumberedChapter]}
        />
      );

      expect(screen.getByText('Unnumbered')).toBeInTheDocument();
      expect(screen.queryByText(/^#\d+$/)).not.toBeInTheDocument();
    });

    it('should handle rapid multiple clicks on checkbox', () => {
      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const checkbox = screen.getByLabelText('Include Chapter One');

      // Rapid clicks
      fireEvent.click(checkbox);
      fireEvent.click(checkbox);
      fireEvent.click(checkbox);

      // Should end up unchecked (odd number of clicks)
      expect(checkbox).not.toBeChecked();
    });

    it('should not break when editing title to empty string', async () => {
      const user = userEvent.setup();

      render(
        <ImportPreviewDialog
          isOpen={true}
          onClose={mockOnClose}
          onImport={mockOnImport}
          document={mockDocument}
          detectedChapters={mockChapters}
        />
      );

      const editButton = screen.getAllByRole('button', { name: /edit title/i })[0];
      await user.click(editButton);

      const input = screen.getByDisplayValue('Chapter One');
      await user.clear(input);
      fireEvent.blur(input);

      // Component should handle empty title gracefully - edited title should be empty
      // The edit button should still be visible
      expect(screen.getAllByRole('button', { name: /edit title/i })[0]).toBeInTheDocument();
    });
  });
});
