/**
 * NavigatorPanel Component Tests
 * Demonstrates usage of test fixtures and utilities
 */

import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NavigatorPanel } from '../NavigatorPanel';
import {
  renderNavigatorPanel,
  renderNavigatorWithContent,
  renderNavigatorWithFooter,
  createMockHandlers,
  setupTestMocks,
  cleanupTestMocks,
} from '../../../test/utils/testHelpers';
import {
  simpleBook,
  complexBook,
  emptyBook,
  bookWithParts,
  bookWithOnlyFrontMatter,
} from '../../../test/fixtures/bookData';
import { mockBookApi, setupMockFetch, resetMockFetch } from '../../../test/utils/mockHandlers';

describe('NavigatorPanel', () => {
  beforeEach(() => {
    setupTestMocks();
    setupMockFetch();
  });

  afterEach(() => {
    cleanupTestMocks();
    resetMockFetch();
  });

  describe('Basic Rendering', () => {
    it('should render with default title', () => {
      renderNavigatorPanel();
      expect(screen.getByText('Navigator')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      renderNavigatorPanel({ title: 'Book Structure' });
      expect(screen.getByText('Book Structure')).toBeInTheDocument();
    });

    it('should render children content', () => {
      renderNavigatorWithContent(<div>Test Content</div>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render footer when provided', () => {
      renderNavigatorWithFooter(
        <div>Main Content</div>,
        <div>Footer Content</div>
      );
      expect(screen.getByText('Main Content')).toBeInTheDocument();
      expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = renderNavigatorPanel({ className: 'custom-class' });
      const panel = container.querySelector('.navigator-panel');
      expect(panel).toHaveClass('custom-class');
    });
  });

  describe('Close Functionality', () => {
    it('should render close button when onClose is provided', () => {
      const handlers = createMockHandlers();
      renderNavigatorPanel({ onClose: handlers.onClose });
      expect(screen.getByLabelText('Close navigator panel')).toBeInTheDocument();
    });

    it('should not render close button when onClose is not provided', () => {
      renderNavigatorPanel();
      expect(screen.queryByLabelText('Close navigator panel')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const handlers = createMockHandlers();
      renderNavigatorPanel({ onClose: handlers.onClose });

      const closeButton = screen.getByLabelText('Close navigator panel');
      await user.click(closeButton);

      expect(handlers.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Book Data Integration', () => {
    it('should work with simple book fixture', async () => {
      const response = await mockBookApi.getBookById(simpleBook.id);
      expect(response.status).toBe(200);
      expect(response.data?.id).toBe(simpleBook.id);
      expect(response.data?.chapters).toHaveLength(3);
    });

    it('should work with complex book fixture', async () => {
      const response = await mockBookApi.getBookById(complexBook.id);
      expect(response.status).toBe(200);
      expect(response.data?.id).toBe(complexBook.id);
      expect(response.data?.frontMatter).toHaveLength(8);
      expect(response.data?.chapters).toHaveLength(6);
      expect(response.data?.backMatter).toHaveLength(5);
    });

    it('should work with empty book fixture', async () => {
      const response = await mockBookApi.getBookById(emptyBook.id);
      expect(response.status).toBe(200);
      expect(response.data?.id).toBe(emptyBook.id);
      expect(response.data?.chapters).toHaveLength(0);
      expect(response.data?.frontMatter).toHaveLength(0);
      expect(response.data?.backMatter).toHaveLength(0);
    });

    it('should work with book with parts fixture', async () => {
      const response = await mockBookApi.getBookById(bookWithParts.id);
      expect(response.status).toBe(200);
      expect(response.data?.chapters).toHaveLength(9);

      const chapters = response.data?.chapters || [];
      const part1Chapters = chapters.filter(c => c.partNumber === 1);
      const part2Chapters = chapters.filter(c => c.partNumber === 2);
      const part3Chapters = chapters.filter(c => c.partNumber === 3);

      expect(part1Chapters).toHaveLength(3);
      expect(part2Chapters).toHaveLength(3);
      expect(part3Chapters).toHaveLength(3);
    });

    it('should work with book with only front matter fixture', async () => {
      const response = await mockBookApi.getBookById(bookWithOnlyFrontMatter.id);
      expect(response.status).toBe(200);
      expect(response.data?.frontMatter).toHaveLength(3);
      expect(response.data?.chapters).toHaveLength(0);
    });
  });

  describe('API Mock Handlers', () => {
    it('should fetch all books', async () => {
      const response = await mockBookApi.getAllBooks();
      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
      expect(response.data!.length).toBeGreaterThan(0);
    });

    it('should fetch chapters for a book', async () => {
      const response = await mockBookApi.getChapters(simpleBook.id);
      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(3);
    });

    it('should fetch front matter for a book', async () => {
      const response = await mockBookApi.getFrontMatter(complexBook.id);
      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(8);
    });

    it('should fetch back matter for a book', async () => {
      const response = await mockBookApi.getBackMatter(complexBook.id);
      expect(response.status).toBe(200);
      expect(response.data).toHaveLength(5);
    });

    it('should return 404 for non-existent book', async () => {
      const response = await mockBookApi.getBookById('non-existent-id');
      expect(response.status).toBe(404);
      expect(response.error).toBe('Book not found');
    });

    it('should handle API failures', async () => {
      mockBookApi.setShouldFail(true);
      const response = await mockBookApi.getBookById(simpleBook.id);
      expect(response.status).toBe(500);
      expect(response.error).toBeDefined();
      mockBookApi.setShouldFail(false);
    });

    it('should support custom delay configuration', async () => {
      mockBookApi.setDelay(10);
      const startTime = Date.now();
      await mockBookApi.getBookById(simpleBook.id);
      const duration = Date.now() - startTime;
      expect(duration).toBeGreaterThanOrEqual(10);
      mockBookApi.setDelay(100);
    });
  });

  describe('Front Matter Elements', () => {
    it('should have title page in complex book', async () => {
      const response = await mockBookApi.getFrontMatter(complexBook.id);
      const titlePage = response.data?.find(e => e.type === 'title-page');
      expect(titlePage).toBeDefined();
      expect(titlePage?.title).toBe('Title Page');
    });

    it('should have copyright in complex book', async () => {
      const response = await mockBookApi.getFrontMatter(complexBook.id);
      const copyright = response.data?.find(e => e.type === 'copyright');
      expect(copyright).toBeDefined();
      expect(copyright?.title).toBe('Copyright');
    });

    it('should have dedication in complex book', async () => {
      const response = await mockBookApi.getFrontMatter(complexBook.id);
      const dedication = response.data?.find(e => e.type === 'dedication');
      expect(dedication).toBeDefined();
    });

    it('should have prologue in complex book', async () => {
      const response = await mockBookApi.getFrontMatter(complexBook.id);
      const prologue = response.data?.find(e => e.type === 'prologue');
      expect(prologue).toBeDefined();
    });
  });

  describe('Back Matter Elements', () => {
    it('should have epilogue in complex book', async () => {
      const response = await mockBookApi.getBackMatter(complexBook.id);
      const epilogue = response.data?.find(e => e.type === 'epilogue');
      expect(epilogue).toBeDefined();
    });

    it('should have acknowledgments in complex book', async () => {
      const response = await mockBookApi.getBackMatter(complexBook.id);
      const acknowledgments = response.data?.find(e => e.type === 'acknowledgments');
      expect(acknowledgments).toBeDefined();
    });

    it('should have about author in complex book', async () => {
      const response = await mockBookApi.getBackMatter(complexBook.id);
      const aboutAuthor = response.data?.find(e => e.type === 'about-author');
      expect(aboutAuthor).toBeDefined();
    });

    it('should have also by in complex book', async () => {
      const response = await mockBookApi.getBackMatter(complexBook.id);
      const alsoBy = response.data?.find(e => e.type === 'also-by');
      expect(alsoBy).toBeDefined();
    });
  });
});
