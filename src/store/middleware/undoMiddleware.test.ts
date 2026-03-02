/**
 * Integration Tests for undoMiddleware
 *
 * Tests the undo/redo middleware with a real Redux store to verify:
 * - Tracking of all undoable actions (chapters, elements, authors, reordering, styles)
 * - Undo operation restores previous state correctly
 * - Redo operation restores next state correctly
 * - Non-tracked actions are ignored
 * - History limit enforcement works
 * - clearFuture on new action
 */

import { configureStore } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import undoMiddleware from './undoMiddleware';
import bookReducer, {
  setCurrentBook,
  addChapter,
  deleteChapter,
  updateChapter,
  reorderChapters,
  addElement,
  deleteElement,
  updateElement,
  reorderElements,
  updateMetadata,
  addAuthor,
  deleteAuthor,
  updateAuthor,
  addStyle,
  deleteStyle,
  updateStyle,
  setBookStyle,
  reorderStyles,
  setLoading,
  setError,
} from '../../slices/bookSlice';
import undoReducer, {
  undo,
  redo,
  clearHistory,
  setMaxHistorySize,
  selectCanUndo,
  selectCanRedo,
  selectUndoCount,
  selectRedoCount,
} from '../../slices/undoSlice';
import type { Book, Author } from '../../types/book';
import type { Chapter } from '../../types/chapter';
import type { Element } from '../../types/element';
import type { Style } from '../../types/style';
import type { RootState } from '../index';

// Helper function to create a test store with undoMiddleware
const createTestStore = () => {
  return configureStore({
    reducer: {
      book: bookReducer,
      undo: undoReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [
            'book/setBook',
            'book/setCurrentBook',
            'book/updateBookMetadata',
            'book/updateMetadata',
            'book/updateChapter',
            'book/updateElement',
            'book/addChapter',
            'book/addElement',
            'book/addAuthor',
            'book/addStyle',
            'undo/addToHistory',
          ],
          ignoredActionPaths: [
            'payload.stateBefore',
            'payload.stateAfter',
            'payload.action',
            'payload.createdAt',
            'payload.updatedAt',
            'payload.metadata.createdAt',
            'payload.metadata.updatedAt',
            'payload.chapter.createdAt',
            'payload.chapter.updatedAt',
            'payload.element.createdAt',
            'payload.element.updatedAt',
            'payload.style.createdAt',
            'payload.style.updatedAt',
          ],
          ignoredPaths: [
            'book.currentBook.createdAt',
            'book.currentBook.updatedAt',
            'book.currentBook.metadata.createdAt',
            'book.currentBook.metadata.updatedAt',
            'book.currentBook.chapters',
            'book.currentBook.authors',
            'book.currentBook.styles',
            'book.currentBook.frontMatter',
            'book.currentBook.backMatter',
            'undo.past',
            'undo.future',
          ],
        },
      }).concat(undoMiddleware),
  });
};

// Helper function to create a test book
const createTestBook = (): Book => ({
  id: uuidv4(),
  title: 'Test Book',
  authors: [],
  frontMatter: [],
  chapters: [],
  backMatter: [],
  styles: [],
  metadata: {
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

// Helper function to create a test chapter
const createTestChapter = (title: string): Chapter => ({
  id: uuidv4(),
  title,
  content: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

// Helper function to create a test element
const createTestElement = (type: string): Element => ({
  id: uuidv4(),
  type: type as any,
  content: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

// Helper function to create a test author
const createTestAuthor = (name: string): Author => ({
  id: uuidv4(),
  name,
  role: 'author',
});

// Helper function to create a test style
const createTestStyle = (name: string): Style => ({
  id: uuidv4(),
  name,
  fontFamily: 'Arial',
  fontSize: 12,
  lineHeight: 1.5,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

describe('undoMiddleware Integration Tests', () => {
  describe('Tracking Undoable Actions', () => {
    describe('Chapter Actions', () => {
      it('should track addChapter action', () => {
        const store = createTestStore();
        const book = createTestBook();
        const chapter = createTestChapter('Chapter 1');

        store.dispatch(setCurrentBook(book));
        store.dispatch(addChapter(chapter));

        const state = store.getState() as RootState;
        expect(selectUndoCount(state)).toBe(1);
        expect(selectCanUndo(state)).toBe(true);
        expect(state.undo.past[0].action.type).toBe('book/addChapter');
      });

      it('should track deleteChapter action', () => {
        const store = createTestStore();
        const book = createTestBook();
        const chapter = createTestChapter('Chapter 1');
        book.chapters = [chapter];

        store.dispatch(setCurrentBook(book));
        store.dispatch(deleteChapter(chapter.id));

        const state = store.getState() as RootState;
        expect(selectUndoCount(state)).toBe(1);
        expect(state.undo.past[0].action.type).toBe('book/deleteChapter');
      });

      it('should track updateChapter action', () => {
        const store = createTestStore();
        const book = createTestBook();
        const chapter = createTestChapter('Chapter 1');
        book.chapters = [chapter];

        store.dispatch(setCurrentBook(book));
        store.dispatch(updateChapter({ id: chapter.id, updates: { title: 'Updated Title' } }));

        const state = store.getState() as RootState;
        expect(selectUndoCount(state)).toBe(1);
        expect(state.undo.past[0].action.type).toBe('book/updateChapter');
      });

      it('should track reorderChapters action', () => {
        const store = createTestStore();
        const book = createTestBook();
        const chapter1 = createTestChapter('Chapter 1');
        const chapter2 = createTestChapter('Chapter 2');
        book.chapters = [chapter1, chapter2];

        store.dispatch(setCurrentBook(book));
        store.dispatch(reorderChapters({ fromIndex: 0, toIndex: 1 }));

        const state = store.getState() as RootState;
        expect(selectUndoCount(state)).toBe(1);
        expect(state.undo.past[0].action.type).toBe('book/reorderChapters');
      });
    });

    describe('Element Actions', () => {
      it('should track addElement action', () => {
        const store = createTestStore();
        const book = createTestBook();
        const element = createTestElement('dedication');

        store.dispatch(setCurrentBook(book));
        store.dispatch(addElement({ element, matter: 'front' }));

        const state = store.getState() as RootState;
        expect(selectUndoCount(state)).toBe(1);
        expect(state.undo.past[0].action.type).toBe('book/addElement');
      });

      it('should track deleteElement action', () => {
        const store = createTestStore();
        const book = createTestBook();
        const element = createTestElement('dedication');
        book.frontMatter = [element];

        store.dispatch(setCurrentBook(book));
        store.dispatch(deleteElement({ id: element.id, matter: 'front' }));

        const state = store.getState() as RootState;
        expect(selectUndoCount(state)).toBe(1);
        expect(state.undo.past[0].action.type).toBe('book/deleteElement');
      });

      it('should track updateElement action', () => {
        const store = createTestStore();
        const book = createTestBook();
        const element = createTestElement('dedication');
        book.frontMatter = [element];

        store.dispatch(setCurrentBook(book));
        store.dispatch(updateElement({ id: element.id, matter: 'front', updates: { type: 'acknowledgments' as any } }));

        const state = store.getState() as RootState;
        expect(selectUndoCount(state)).toBe(1);
        expect(state.undo.past[0].action.type).toBe('book/updateElement');
      });

      it('should track reorderElements action', () => {
        const store = createTestStore();
        const book = createTestBook();
        const element1 = createTestElement('dedication');
        const element2 = createTestElement('acknowledgments');
        book.frontMatter = [element1, element2];

        store.dispatch(setCurrentBook(book));
        store.dispatch(reorderElements({ matter: 'front', fromIndex: 0, toIndex: 1 }));

        const state = store.getState() as RootState;
        expect(selectUndoCount(state)).toBe(1);
        expect(state.undo.past[0].action.type).toBe('book/reorderElements');
      });
    });

    describe('Author Actions', () => {
      it('should track addAuthor action', () => {
        const store = createTestStore();
        const book = createTestBook();
        const author = createTestAuthor('John Doe');

        store.dispatch(setCurrentBook(book));
        store.dispatch(addAuthor(author));

        const state = store.getState() as RootState;
        expect(selectUndoCount(state)).toBe(1);
        expect(state.undo.past[0].action.type).toBe('book/addAuthor');
      });

      it('should track deleteAuthor action', () => {
        const store = createTestStore();
        const book = createTestBook();
        const author = createTestAuthor('John Doe');
        book.authors = [author];

        store.dispatch(setCurrentBook(book));
        store.dispatch(deleteAuthor(author.id));

        const state = store.getState() as RootState;
        expect(selectUndoCount(state)).toBe(1);
        expect(state.undo.past[0].action.type).toBe('book/deleteAuthor');
      });

      it('should track updateAuthor action', () => {
        const store = createTestStore();
        const book = createTestBook();
        const author = createTestAuthor('John Doe');
        book.authors = [author];

        store.dispatch(setCurrentBook(book));
        store.dispatch(updateAuthor({ id: author.id, updates: { name: 'Jane Doe' } }));

        const state = store.getState() as RootState;
        expect(selectUndoCount(state)).toBe(1);
        expect(state.undo.past[0].action.type).toBe('book/updateAuthor');
      });
    });

    describe('Style Actions', () => {
      it('should track addStyle action', () => {
        const store = createTestStore();
        const book = createTestBook();
        const style = createTestStyle('Custom Style');

        store.dispatch(setCurrentBook(book));
        store.dispatch(addStyle(style));

        const state = store.getState() as RootState;
        expect(selectUndoCount(state)).toBe(1);
        expect(state.undo.past[0].action.type).toBe('book/addStyle');
      });

      it('should track deleteStyle action', () => {
        const store = createTestStore();
        const book = createTestBook();
        const style = createTestStyle('Custom Style');
        book.styles = [style];

        store.dispatch(setCurrentBook(book));
        store.dispatch(deleteStyle(style.id));

        const state = store.getState() as RootState;
        expect(selectUndoCount(state)).toBe(1);
        expect(state.undo.past[0].action.type).toBe('book/deleteStyle');
      });

      it('should track updateStyle action', () => {
        const store = createTestStore();
        const book = createTestBook();
        const style = createTestStyle('Custom Style');
        book.styles = [style];

        store.dispatch(setCurrentBook(book));
        store.dispatch(updateStyle({ id: style.id, updates: { name: 'Updated Style' } }));

        const state = store.getState() as RootState;
        expect(selectUndoCount(state)).toBe(1);
        expect(state.undo.past[0].action.type).toBe('book/updateStyle');
      });

      it('should track setBookStyle action', () => {
        const store = createTestStore();
        const book = createTestBook();
        const styles = [createTestStyle('Style 1'), createTestStyle('Style 2')];

        store.dispatch(setCurrentBook(book));
        store.dispatch(setBookStyle(styles));

        const state = store.getState() as RootState;
        expect(selectUndoCount(state)).toBe(1);
        expect(state.undo.past[0].action.type).toBe('book/setBookStyle');
      });

      it('should track reorderStyles action', () => {
        const store = createTestStore();
        const book = createTestBook();
        const style1 = createTestStyle('Style 1');
        const style2 = createTestStyle('Style 2');
        book.styles = [style1, style2];

        store.dispatch(setCurrentBook(book));
        store.dispatch(reorderStyles({ fromIndex: 0, toIndex: 1 }));

        const state = store.getState() as RootState;
        expect(selectUndoCount(state)).toBe(1);
        expect(state.undo.past[0].action.type).toBe('book/reorderStyles');
      });
    });

    describe('Metadata Actions', () => {
      it('should track updateMetadata action', () => {
        const store = createTestStore();
        const book = createTestBook();

        store.dispatch(setCurrentBook(book));
        store.dispatch(updateMetadata({ title: 'Updated Title' }));

        const state = store.getState() as RootState;
        expect(selectUndoCount(state)).toBe(1);
        expect(state.undo.past[0].action.type).toBe('book/updateMetadata');
      });
    });
  });

  describe('Non-Tracked Actions', () => {
    it('should not track setCurrentBook action', () => {
      const store = createTestStore();
      const book = createTestBook();

      store.dispatch(setCurrentBook(book));

      const state = store.getState() as RootState;
      expect(selectUndoCount(state)).toBe(0);
      expect(selectCanUndo(state)).toBe(false);
    });

    it('should not track setLoading action', () => {
      const store = createTestStore();
      const book = createTestBook();

      store.dispatch(setCurrentBook(book));
      store.dispatch(setLoading(true));

      const state = store.getState() as RootState;
      expect(selectUndoCount(state)).toBe(0);
    });

    it('should not track setError action', () => {
      const store = createTestStore();
      const book = createTestBook();

      store.dispatch(setCurrentBook(book));
      store.dispatch(setError('Some error'));

      const state = store.getState() as RootState;
      expect(selectUndoCount(state)).toBe(0);
    });

    it('should not track undo/redo actions themselves', () => {
      const store = createTestStore();
      const book = createTestBook();
      const chapter = createTestChapter('Chapter 1');

      store.dispatch(setCurrentBook(book));
      store.dispatch(addChapter(chapter));

      let state = store.getState() as RootState;
      expect(selectUndoCount(state)).toBe(1);

      store.dispatch(undo());

      state = store.getState() as RootState;
      // After undo, the history count should be 0 (moved to future)
      expect(selectUndoCount(state)).toBe(0);
      expect(selectRedoCount(state)).toBe(1);
      // No additional entries should be added for the undo action itself
    });
  });

  describe('Undo Operation', () => {
    it('should restore previous state correctly for chapter addition', () => {
      const store = createTestStore();
      const book = createTestBook();
      const chapter = createTestChapter('Chapter 1');

      store.dispatch(setCurrentBook(book));
      expect(store.getState().book.currentBook?.chapters).toHaveLength(0);

      store.dispatch(addChapter(chapter));
      expect(store.getState().book.currentBook?.chapters).toHaveLength(1);

      store.dispatch(undo());
      expect(store.getState().book.currentBook?.chapters).toHaveLength(0);
    });

    it('should restore previous state correctly for chapter deletion', () => {
      const store = createTestStore();
      const book = createTestBook();
      const chapter = createTestChapter('Chapter 1');
      book.chapters = [chapter];

      store.dispatch(setCurrentBook(book));
      expect(store.getState().book.currentBook?.chapters).toHaveLength(1);

      store.dispatch(deleteChapter(chapter.id));
      expect(store.getState().book.currentBook?.chapters).toHaveLength(0);

      store.dispatch(undo());
      expect(store.getState().book.currentBook?.chapters).toHaveLength(1);
      expect(store.getState().book.currentBook?.chapters[0].id).toBe(chapter.id);
    });

    it('should restore previous state correctly for chapter updates', () => {
      const store = createTestStore();
      const book = createTestBook();
      const chapter = createTestChapter('Original Title');
      book.chapters = [chapter];

      store.dispatch(setCurrentBook(book));
      expect(store.getState().book.currentBook?.chapters[0].title).toBe('Original Title');

      store.dispatch(updateChapter({ id: chapter.id, updates: { title: 'Updated Title' } }));
      expect(store.getState().book.currentBook?.chapters[0].title).toBe('Updated Title');

      store.dispatch(undo());
      expect(store.getState().book.currentBook?.chapters[0].title).toBe('Original Title');
    });

    it('should restore previous state correctly for reordering', () => {
      const store = createTestStore();
      const book = createTestBook();
      const chapter1 = createTestChapter('Chapter 1');
      const chapter2 = createTestChapter('Chapter 2');
      book.chapters = [chapter1, chapter2];

      store.dispatch(setCurrentBook(book));
      expect(store.getState().book.currentBook?.chapters[0].id).toBe(chapter1.id);
      expect(store.getState().book.currentBook?.chapters[1].id).toBe(chapter2.id);

      store.dispatch(reorderChapters({ fromIndex: 0, toIndex: 1 }));
      expect(store.getState().book.currentBook?.chapters[0].id).toBe(chapter2.id);
      expect(store.getState().book.currentBook?.chapters[1].id).toBe(chapter1.id);

      store.dispatch(undo());
      expect(store.getState().book.currentBook?.chapters[0].id).toBe(chapter1.id);
      expect(store.getState().book.currentBook?.chapters[1].id).toBe(chapter2.id);
    });

    it('should restore previous state correctly for author operations', () => {
      const store = createTestStore();
      const book = createTestBook();
      const author = createTestAuthor('John Doe');

      store.dispatch(setCurrentBook(book));
      expect(store.getState().book.currentBook?.authors).toHaveLength(0);

      store.dispatch(addAuthor(author));
      expect(store.getState().book.currentBook?.authors).toHaveLength(1);

      store.dispatch(undo());
      expect(store.getState().book.currentBook?.authors).toHaveLength(0);
    });

    it('should restore previous state correctly for element operations', () => {
      const store = createTestStore();
      const book = createTestBook();
      const element = createTestElement('dedication');

      store.dispatch(setCurrentBook(book));
      expect(store.getState().book.currentBook?.frontMatter).toHaveLength(0);

      store.dispatch(addElement({ element, matter: 'front' }));
      expect(store.getState().book.currentBook?.frontMatter).toHaveLength(1);

      store.dispatch(undo());
      expect(store.getState().book.currentBook?.frontMatter).toHaveLength(0);
    });

    it('should restore previous state correctly for style operations', () => {
      const store = createTestStore();
      const book = createTestBook();
      const style = createTestStyle('Custom Style');

      store.dispatch(setCurrentBook(book));
      expect(store.getState().book.currentBook?.styles).toHaveLength(0);

      store.dispatch(addStyle(style));
      expect(store.getState().book.currentBook?.styles).toHaveLength(1);

      store.dispatch(undo());
      expect(store.getState().book.currentBook?.styles).toHaveLength(0);
    });

    it('should handle multiple undo operations in sequence', () => {
      const store = createTestStore();
      const book = createTestBook();
      const chapter1 = createTestChapter('Chapter 1');
      const chapter2 = createTestChapter('Chapter 2');
      const chapter3 = createTestChapter('Chapter 3');

      store.dispatch(setCurrentBook(book));
      store.dispatch(addChapter(chapter1));
      store.dispatch(addChapter(chapter2));
      store.dispatch(addChapter(chapter3));

      expect(store.getState().book.currentBook?.chapters).toHaveLength(3);

      store.dispatch(undo());
      expect(store.getState().book.currentBook?.chapters).toHaveLength(2);

      store.dispatch(undo());
      expect(store.getState().book.currentBook?.chapters).toHaveLength(1);

      store.dispatch(undo());
      expect(store.getState().book.currentBook?.chapters).toHaveLength(0);
    });

    it('should not affect state when past is empty', () => {
      const store = createTestStore();
      const book = createTestBook();

      store.dispatch(setCurrentBook(book));

      const stateBefore = store.getState().book.currentBook;
      store.dispatch(undo());
      const stateAfter = store.getState().book.currentBook;

      expect(stateAfter).toEqual(stateBefore);
    });
  });

  describe('Redo Operation', () => {
    it('should restore next state correctly after undo', () => {
      const store = createTestStore();
      const book = createTestBook();
      const chapter = createTestChapter('Chapter 1');

      store.dispatch(setCurrentBook(book));
      store.dispatch(addChapter(chapter));
      expect(store.getState().book.currentBook?.chapters).toHaveLength(1);

      store.dispatch(undo());
      expect(store.getState().book.currentBook?.chapters).toHaveLength(0);

      store.dispatch(redo());
      expect(store.getState().book.currentBook?.chapters).toHaveLength(1);
      expect(store.getState().book.currentBook?.chapters[0].id).toBe(chapter.id);
    });

    it('should restore correct state through multiple redo operations', () => {
      const store = createTestStore();
      const book = createTestBook();
      const chapter1 = createTestChapter('Chapter 1');
      const chapter2 = createTestChapter('Chapter 2');

      store.dispatch(setCurrentBook(book));
      store.dispatch(addChapter(chapter1));
      store.dispatch(addChapter(chapter2));

      store.dispatch(undo());
      store.dispatch(undo());
      expect(store.getState().book.currentBook?.chapters).toHaveLength(0);

      store.dispatch(redo());
      expect(store.getState().book.currentBook?.chapters).toHaveLength(1);
      expect(store.getState().book.currentBook?.chapters[0].id).toBe(chapter1.id);

      store.dispatch(redo());
      expect(store.getState().book.currentBook?.chapters).toHaveLength(2);
      expect(store.getState().book.currentBook?.chapters[1].id).toBe(chapter2.id);
    });

    it('should not affect state when future is empty', () => {
      const store = createTestStore();
      const book = createTestBook();
      const chapter = createTestChapter('Chapter 1');

      store.dispatch(setCurrentBook(book));
      store.dispatch(addChapter(chapter));

      const stateBefore = store.getState().book.currentBook;
      store.dispatch(redo());
      const stateAfter = store.getState().book.currentBook;

      expect(stateAfter).toEqual(stateBefore);
    });
  });

  describe('History Limit Enforcement', () => {
    it('should enforce history limit and remove oldest entries', () => {
      const store = createTestStore();
      const book = createTestBook();

      // Set a smaller limit for testing
      store.dispatch(setMaxHistorySize(5));
      store.dispatch(setCurrentBook(book));

      // Add more actions than the limit
      for (let i = 0; i < 10; i++) {
        const chapter = createTestChapter(`Chapter ${i}`);
        store.dispatch(addChapter(chapter));
      }

      const state = store.getState() as RootState;
      expect(selectUndoCount(state)).toBe(5);

      // Verify oldest entries were removed
      const oldestEntry = state.undo.past[0];
      expect(oldestEntry.action.type).toBe('book/addChapter');
      // The oldest entry should be the 6th action (index 5)
      expect((oldestEntry.action as any).payload.title).toBe('Chapter 5');
    });

    it('should maintain history limit when adding entries at maximum capacity', () => {
      const store = createTestStore();
      const book = createTestBook();

      store.dispatch(setMaxHistorySize(3));
      store.dispatch(setCurrentBook(book));

      const chapter1 = createTestChapter('Chapter 1');
      const chapter2 = createTestChapter('Chapter 2');
      const chapter3 = createTestChapter('Chapter 3');
      const chapter4 = createTestChapter('Chapter 4');

      store.dispatch(addChapter(chapter1));
      store.dispatch(addChapter(chapter2));
      store.dispatch(addChapter(chapter3));

      let state = store.getState() as RootState;
      expect(selectUndoCount(state)).toBe(3);

      store.dispatch(addChapter(chapter4));

      state = store.getState() as RootState;
      expect(selectUndoCount(state)).toBe(3);

      // First entry should be removed
      const firstEntry = state.undo.past[0];
      expect((firstEntry.action as any).payload.title).toBe('Chapter 2');
    });
  });

  describe('Clear Future on New Action', () => {
    it('should clear future when new action is performed after undo', () => {
      const store = createTestStore();
      const book = createTestBook();
      const chapter1 = createTestChapter('Chapter 1');
      const chapter2 = createTestChapter('Chapter 2');

      store.dispatch(setCurrentBook(book));
      store.dispatch(addChapter(chapter1));
      store.dispatch(addChapter(chapter2));

      store.dispatch(undo());

      let state = store.getState() as RootState;
      expect(selectRedoCount(state)).toBe(1);

      // Perform a new action
      const chapter3 = createTestChapter('Chapter 3');
      store.dispatch(addChapter(chapter3));

      state = store.getState() as RootState;
      expect(selectRedoCount(state)).toBe(0);
      expect(selectCanRedo(state)).toBe(false);
    });

    it('should clear all future entries when new action is performed', () => {
      const store = createTestStore();
      const book = createTestBook();

      store.dispatch(setCurrentBook(book));
      store.dispatch(addChapter(createTestChapter('Chapter 1')));
      store.dispatch(addChapter(createTestChapter('Chapter 2')));
      store.dispatch(addChapter(createTestChapter('Chapter 3')));

      // Undo multiple times
      store.dispatch(undo());
      store.dispatch(undo());

      let state = store.getState() as RootState;
      expect(selectRedoCount(state)).toBe(2);

      // Perform new action
      store.dispatch(addChapter(createTestChapter('New Chapter')));

      state = store.getState() as RootState;
      expect(selectRedoCount(state)).toBe(0);
      expect(selectUndoCount(state)).toBe(2); // Original first action + new action
    });
  });

  describe('Complex Integration Scenarios', () => {
    it('should handle complete workflow: add, undo, redo, add more', () => {
      const store = createTestStore();
      const book = createTestBook();

      store.dispatch(setCurrentBook(book));

      // Add 3 chapters
      store.dispatch(addChapter(createTestChapter('Chapter 1')));
      store.dispatch(addChapter(createTestChapter('Chapter 2')));
      store.dispatch(addChapter(createTestChapter('Chapter 3')));

      expect(store.getState().book.currentBook?.chapters).toHaveLength(3);

      // Undo twice
      store.dispatch(undo());
      store.dispatch(undo());

      expect(store.getState().book.currentBook?.chapters).toHaveLength(1);

      // Redo once
      store.dispatch(redo());

      expect(store.getState().book.currentBook?.chapters).toHaveLength(2);

      // Add a new chapter (should clear future)
      store.dispatch(addChapter(createTestChapter('Chapter 4')));

      expect(store.getState().book.currentBook?.chapters).toHaveLength(3);

      const state = store.getState() as RootState;
      expect(selectRedoCount(state)).toBe(0);
      expect(selectUndoCount(state)).toBe(3);
    });

    it('should handle mixed operations (chapters, authors, styles)', () => {
      const store = createTestStore();
      const book = createTestBook();

      store.dispatch(setCurrentBook(book));

      // Add chapter
      const chapter = createTestChapter('Chapter 1');
      store.dispatch(addChapter(chapter));

      // Add author
      const author = createTestAuthor('John Doe');
      store.dispatch(addAuthor(author));

      // Add style
      const style = createTestStyle('Custom Style');
      store.dispatch(addStyle(style));

      expect(store.getState().book.currentBook?.chapters).toHaveLength(1);
      expect(store.getState().book.currentBook?.authors).toHaveLength(1);
      expect(store.getState().book.currentBook?.styles).toHaveLength(1);

      // Undo all
      store.dispatch(undo());
      expect(store.getState().book.currentBook?.styles).toHaveLength(0);

      store.dispatch(undo());
      expect(store.getState().book.currentBook?.authors).toHaveLength(0);

      store.dispatch(undo());
      expect(store.getState().book.currentBook?.chapters).toHaveLength(0);

      // Redo all
      store.dispatch(redo());
      expect(store.getState().book.currentBook?.chapters).toHaveLength(1);

      store.dispatch(redo());
      expect(store.getState().book.currentBook?.authors).toHaveLength(1);

      store.dispatch(redo());
      expect(store.getState().book.currentBook?.styles).toHaveLength(1);
    });

    it('should preserve state integrity through rapid undo/redo cycles', () => {
      const store = createTestStore();
      const book = createTestBook();
      const chapters = [
        createTestChapter('Chapter 1'),
        createTestChapter('Chapter 2'),
        createTestChapter('Chapter 3'),
      ];

      store.dispatch(setCurrentBook(book));

      chapters.forEach(chapter => store.dispatch(addChapter(chapter)));

      // Rapid undo/redo cycles
      store.dispatch(undo());
      store.dispatch(redo());
      store.dispatch(undo());
      store.dispatch(undo());
      store.dispatch(redo());

      expect(store.getState().book.currentBook?.chapters).toHaveLength(2);

      // Redo remaining
      store.dispatch(redo());

      expect(store.getState().book.currentBook?.chapters).toHaveLength(3);
      expect(store.getState().book.currentBook?.chapters[0].title).toBe('Chapter 1');
      expect(store.getState().book.currentBook?.chapters[1].title).toBe('Chapter 2');
      expect(store.getState().book.currentBook?.chapters[2].title).toBe('Chapter 3');
    });

    it('should handle clearing history and starting fresh', () => {
      const store = createTestStore();
      const book = createTestBook();

      store.dispatch(setCurrentBook(book));
      store.dispatch(addChapter(createTestChapter('Chapter 1')));
      store.dispatch(addChapter(createTestChapter('Chapter 2')));

      let state = store.getState() as RootState;
      expect(selectUndoCount(state)).toBe(2);

      // Clear history
      store.dispatch(clearHistory());

      state = store.getState() as RootState;
      expect(selectUndoCount(state)).toBe(0);
      expect(selectRedoCount(state)).toBe(0);

      // Add new chapters
      store.dispatch(addChapter(createTestChapter('New Chapter 1')));

      state = store.getState() as RootState;
      expect(selectUndoCount(state)).toBe(1);
    });
  });
});
