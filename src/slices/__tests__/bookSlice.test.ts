/**
 * Redux bookSlice Tests
 * Tests for mergeChapters and splitChapter operations
 */

import bookReducer, { mergeChapters, splitChapter } from '../bookSlice';
import { Book, Chapter } from '../../types';

// Helper function to create a test chapter
const createTestChapter = (id: string, title: string, content: string[]): Chapter => ({
  id,
  title,
  content: content.map((text, index) => ({
    id: `text-block-${id}-${index}`,
    content: text,
    blockType: 'paragraph' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  })),
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

// Helper function to create a test book with chapters
const createTestBook = (chapters: Chapter[]): Book => ({
  id: 'test-book-1',
  title: 'Test Book',
  authors: [{ id: 'author-1', name: 'Test Author' }],
  chapters,
  frontMatter: [],
  backMatter: [],
  styles: [],
  metadata: {
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

describe('bookSlice', () => {
  describe('mergeChapters', () => {
    it('should merge two adjacent chapters and keep first chapter metadata', () => {
      const chapter1 = createTestChapter('chapter-1', 'Chapter 1', ['First paragraph', 'Second paragraph']);
      const chapter2 = createTestChapter('chapter-2', 'Chapter 2', ['Third paragraph', 'Fourth paragraph']);
      const chapter3 = createTestChapter('chapter-3', 'Chapter 3', ['Fifth paragraph']);

      const initialState = {
        currentBook: createTestBook([chapter1, chapter2, chapter3]),
        isLoading: false,
        error: null,
        isDirty: false,
      };

      const action = mergeChapters({
        firstChapterId: 'chapter-1',
        secondChapterId: 'chapter-2',
      });

      const newState = bookReducer(initialState, action);

      // Should have 2 chapters after merge
      expect(newState.currentBook?.chapters).toHaveLength(2);

      // First chapter should keep its ID
      expect(newState.currentBook?.chapters[0].id).toBe('chapter-1');

      // First chapter should keep its metadata
      expect(newState.currentBook?.chapters[0].title).toBe('Chapter 1');
      expect(newState.currentBook?.chapters[0].createdAt).toEqual(chapter1.createdAt);

      // Content should be concatenated (4 paragraphs total)
      expect(newState.currentBook?.chapters[0].content).toHaveLength(4);

      // Second chapter should be removed, third chapter should still exist
      expect(newState.currentBook?.chapters[1].id).toBe('chapter-3');

      // State should be marked as dirty
      expect(newState.isDirty).toBe(true);
    });

    it('should handle merging when chapters are in different order', () => {
      const chapter1 = createTestChapter('chapter-1', 'Chapter 1', ['Content 1']);
      const chapter2 = createTestChapter('chapter-2', 'Chapter 2', ['Content 2']);
      const chapter3 = createTestChapter('chapter-3', 'Chapter 3', ['Content 3']);

      const initialState = {
        currentBook: createTestBook([chapter1, chapter2, chapter3]),
        isLoading: false,
        error: null,
        isDirty: false,
      };

      const action = mergeChapters({
        firstChapterId: 'chapter-2',
        secondChapterId: 'chapter-3',
      });

      const newState = bookReducer(initialState, action);

      expect(newState.currentBook?.chapters).toHaveLength(2);
      expect(newState.currentBook?.chapters[0].id).toBe('chapter-1');
      expect(newState.currentBook?.chapters[1].id).toBe('chapter-2');
      expect(newState.currentBook?.chapters[1].content).toHaveLength(2);
    });

    it('should not merge if first chapter does not exist', () => {
      const chapter1 = createTestChapter('chapter-1', 'Chapter 1', ['Content 1']);
      const chapter2 = createTestChapter('chapter-2', 'Chapter 2', ['Content 2']);

      const initialState = {
        currentBook: createTestBook([chapter1, chapter2]),
        isLoading: false,
        error: null,
        isDirty: false,
      };

      const action = mergeChapters({
        firstChapterId: 'non-existent',
        secondChapterId: 'chapter-2',
      });

      const newState = bookReducer(initialState, action);

      // State should remain unchanged
      expect(newState.currentBook?.chapters).toHaveLength(2);
      expect(newState.isDirty).toBe(false);
    });

    it('should not merge if second chapter does not exist', () => {
      const chapter1 = createTestChapter('chapter-1', 'Chapter 1', ['Content 1']);
      const chapter2 = createTestChapter('chapter-2', 'Chapter 2', ['Content 2']);

      const initialState = {
        currentBook: createTestBook([chapter1, chapter2]),
        isLoading: false,
        error: null,
        isDirty: false,
      };

      const action = mergeChapters({
        firstChapterId: 'chapter-1',
        secondChapterId: 'non-existent',
      });

      const newState = bookReducer(initialState, action);

      // State should remain unchanged
      expect(newState.currentBook?.chapters).toHaveLength(2);
      expect(newState.isDirty).toBe(false);
    });

    it('should not merge if no current book exists', () => {
      const initialState = {
        currentBook: null,
        isLoading: false,
        error: null,
        isDirty: false,
      };

      const action = mergeChapters({
        firstChapterId: 'chapter-1',
        secondChapterId: 'chapter-2',
      });

      const newState = bookReducer(initialState, action);

      expect(newState.currentBook).toBeNull();
      expect(newState.isDirty).toBe(false);
    });
  });

  describe('splitChapter', () => {
    it('should split chapter at specified index and create new chapter', () => {
      const chapter1 = createTestChapter('chapter-1', 'Chapter 1', [
        'First paragraph',
        'Second paragraph',
        'Third paragraph',
        'Fourth paragraph',
      ]);

      const initialState = {
        currentBook: createTestBook([chapter1]),
        isLoading: false,
        error: null,
        isDirty: false,
      };

      const action = splitChapter({
        chapterId: 'chapter-1',
        splitIndex: 2, // Split after second paragraph
      });

      const newState = bookReducer(initialState, action);

      // Should have 2 chapters after split
      expect(newState.currentBook?.chapters).toHaveLength(2);

      // First chapter should keep original ID
      expect(newState.currentBook?.chapters[0].id).toBe('chapter-1');

      // First chapter should have first 2 paragraphs
      expect(newState.currentBook?.chapters[0].content).toHaveLength(2);

      // Second chapter should have new ID
      expect(newState.currentBook?.chapters[1].id).not.toBe('chapter-1');

      // Second chapter should have remaining 2 paragraphs
      expect(newState.currentBook?.chapters[1].content).toHaveLength(2);

      // Second chapter title should indicate continuation
      expect(newState.currentBook?.chapters[1].title).toBe('Chapter 1 (continued)');

      // State should be marked as dirty
      expect(newState.isDirty).toBe(true);
    });

    it('should preserve formatting in both split chapters', () => {
      const chapter1 = createTestChapter('chapter-1', 'Chapter 1', [
        'Para 1',
        'Para 2',
        'Para 3',
      ]);

      const initialState = {
        currentBook: createTestBook([chapter1]),
        isLoading: false,
        error: null,
        isDirty: false,
      };

      const action = splitChapter({
        chapterId: 'chapter-1',
        splitIndex: 1,
      });

      const newState = bookReducer(initialState, action);

      // Both chapters should preserve the content structure
      expect(newState.currentBook?.chapters[0].content[0].blockType).toBe('paragraph');
      expect(newState.currentBook?.chapters[1].content[0].blockType).toBe('paragraph');
    });

    it('should insert new chapter immediately after original', () => {
      const chapter1 = createTestChapter('chapter-1', 'Chapter 1', ['Content 1']);
      const chapter2 = createTestChapter('chapter-2', 'Chapter 2', ['Content 2', 'Content 3']);
      const chapter3 = createTestChapter('chapter-3', 'Chapter 3', ['Content 4']);

      const initialState = {
        currentBook: createTestBook([chapter1, chapter2, chapter3]),
        isLoading: false,
        error: null,
        isDirty: false,
      };

      const action = splitChapter({
        chapterId: 'chapter-2',
        splitIndex: 1,
      });

      const newState = bookReducer(initialState, action);

      // Should have 4 chapters after split
      expect(newState.currentBook?.chapters).toHaveLength(4);

      // Order should be: chapter-1, chapter-2, new-chapter, chapter-3
      expect(newState.currentBook?.chapters[0].id).toBe('chapter-1');
      expect(newState.currentBook?.chapters[1].id).toBe('chapter-2');
      expect(newState.currentBook?.chapters[2].title).toBe('Chapter 2 (continued)');
      expect(newState.currentBook?.chapters[3].id).toBe('chapter-3');
    });

    it('should not split if split index is invalid (0)', () => {
      const chapter1 = createTestChapter('chapter-1', 'Chapter 1', ['Para 1', 'Para 2']);

      const initialState = {
        currentBook: createTestBook([chapter1]),
        isLoading: false,
        error: null,
        isDirty: false,
      };

      const action = splitChapter({
        chapterId: 'chapter-1',
        splitIndex: 0,
      });

      const newState = bookReducer(initialState, action);

      // Should remain unchanged
      expect(newState.currentBook?.chapters).toHaveLength(1);
      expect(newState.isDirty).toBe(false);
    });

    it('should not split if split index equals or exceeds content length', () => {
      const chapter1 = createTestChapter('chapter-1', 'Chapter 1', ['Para 1', 'Para 2']);

      const initialState = {
        currentBook: createTestBook([chapter1]),
        isLoading: false,
        error: null,
        isDirty: false,
      };

      const action = splitChapter({
        chapterId: 'chapter-1',
        splitIndex: 2, // Equals content length
      });

      const newState = bookReducer(initialState, action);

      // Should remain unchanged
      expect(newState.currentBook?.chapters).toHaveLength(1);
      expect(newState.isDirty).toBe(false);
    });

    it('should not split if chapter does not exist', () => {
      const chapter1 = createTestChapter('chapter-1', 'Chapter 1', ['Content 1']);

      const initialState = {
        currentBook: createTestBook([chapter1]),
        isLoading: false,
        error: null,
        isDirty: false,
      };

      const action = splitChapter({
        chapterId: 'non-existent',
        splitIndex: 1,
      });

      const newState = bookReducer(initialState, action);

      // Should remain unchanged
      expect(newState.currentBook?.chapters).toHaveLength(1);
      expect(newState.isDirty).toBe(false);
    });

    it('should not split if no current book exists', () => {
      const initialState = {
        currentBook: null,
        isLoading: false,
        error: null,
        isDirty: false,
      };

      const action = splitChapter({
        chapterId: 'chapter-1',
        splitIndex: 1,
      });

      const newState = bookReducer(initialState, action);

      expect(newState.currentBook).toBeNull();
      expect(newState.isDirty).toBe(false);
    });
  });
});
