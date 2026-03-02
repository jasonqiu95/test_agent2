/**
 * Book Slice
 *
 * Manages book state with undoable actions for structural changes.
 * All actions here are tracked by the undo middleware.
 * Handles CRUD operations for books, chapters, and elements.
 */

import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { Book, Author } from '../types/book';
import { Chapter } from '../types/chapter';
import { Element } from '../types/element';
import { Style } from '../types/style';
import { v4 as uuidv4 } from 'uuid';

export interface BookState {
  currentBook: Book | null;
  books: Book[];
  loading: boolean;
  error: string | null;
  isDirty: boolean;
}

const initialState: BookState = {
  currentBook: null,
  books: [],
  loading: false,
  error: null,
  isDirty: false,
};

export const bookSlice = createSlice({
  name: 'book',
  initialState,
  reducers: {
    /**
     * Set the current book
     */
    setCurrentBook: (state, action: PayloadAction<Book | null>) => {
      state.currentBook = action.payload;
      state.isDirty = false;
    },

    /**
     * Set book (alias for setCurrentBook)
     */
    setBook: (state, action: PayloadAction<Book>) => {
      state.currentBook = action.payload;
      state.isDirty = false;
      state.error = null;
    },

    /**
     * Clear the current book
     */
    clearBook: (state) => {
      state.currentBook = null;
      state.isDirty = false;
      state.error = null;
    },

    /**
     * Update book metadata
     */
    updateMetadata: (state, action: PayloadAction<Partial<Book>>) => {
      if (state.currentBook) {
        state.currentBook = {
          ...state.currentBook,
          ...action.payload,
        };
        state.isDirty = true;
      }
    },

    /**
     * Update book metadata (alias)
     */
    updateBookMetadata: (state, action: PayloadAction<Partial<Book>>) => {
      if (state.currentBook) {
        state.currentBook = { ...state.currentBook, ...action.payload };
        state.isDirty = true;
      }
    },

    /**
     * Add a new chapter to the current book
     */
    addChapter: (state, action: PayloadAction<Chapter>) => {
      if (state.currentBook) {
        state.currentBook.chapters.push(action.payload);
        state.isDirty = true;
      }
    },

    /**
     * Delete a chapter by ID
     */
    deleteChapter: (state, action: PayloadAction<string>) => {
      if (state.currentBook) {
        state.currentBook.chapters = state.currentBook.chapters.filter(
          (chapter) => chapter.id !== action.payload
        );
        state.isDirty = true;
      }
    },

    /**
     * Update a chapter
     */
    updateChapter: (state, action: PayloadAction<{ id: string; updates: Partial<Chapter> }>) => {
      if (state.currentBook) {
        const index = state.currentBook.chapters.findIndex(
          (chapter) => chapter.id === action.payload.id
        );
        if (index !== -1) {
          state.currentBook.chapters[index] = {
            ...state.currentBook.chapters[index],
            ...action.payload.updates,
          };
          state.isDirty = true;
        }
      }
    },

    /**
     * Reorder chapters (by index)
     */
    reorderChapters: (state, action: PayloadAction<{ fromIndex: number; toIndex: number } | string[]>) => {
      if (state.currentBook) {
        // Support both array of IDs and fromIndex/toIndex
        if (Array.isArray(action.payload)) {
          const chapterMap = new Map(state.currentBook.chapters.map((ch) => [ch.id, ch]));
          state.currentBook.chapters = action.payload
            .map((id) => chapterMap.get(id))
            .filter((ch): ch is Chapter => ch !== undefined);
        } else {
          const { fromIndex, toIndex } = action.payload;
          const [removed] = state.currentBook.chapters.splice(fromIndex, 1);
          state.currentBook.chapters.splice(toIndex, 0, removed);
        }
        state.isDirty = true;
      }
    },

    /**
     * Merge two chapters together
     */
    mergeChapters: (
      state,
      action: PayloadAction<{ firstChapterId: string; secondChapterId: string }>
    ) => {
      if (state.currentBook) {
        const firstChapterIndex = state.currentBook.chapters.findIndex(
          (ch) => ch.id === action.payload.firstChapterId
        );
        const secondChapterIndex = state.currentBook.chapters.findIndex(
          (ch) => ch.id === action.payload.secondChapterId
        );

        if (firstChapterIndex !== -1 && secondChapterIndex !== -1) {
          const firstChapter = state.currentBook.chapters[firstChapterIndex];
          const secondChapter = state.currentBook.chapters[secondChapterIndex];

          // Keep first chapter's metadata, concatenate content
          const mergedChapter: Chapter = {
            ...firstChapter,
            content: [...firstChapter.content, ...secondChapter.content],
            updatedAt: new Date(),
          };

          // Replace first chapter with merged chapter and remove second chapter
          state.currentBook.chapters[firstChapterIndex] = mergedChapter;
          state.currentBook.chapters.splice(secondChapterIndex, 1);
          state.isDirty = true;
        }
      }
    },

    /**
     * Split a chapter into two chapters
     */
    splitChapter: (
      state,
      action: PayloadAction<{ chapterId: string; splitIndex: number }>
    ) => {
      if (state.currentBook) {
        const chapterIndex = state.currentBook.chapters.findIndex(
          (ch) => ch.id === action.payload.chapterId
        );

        if (chapterIndex !== -1) {
          const originalChapter = state.currentBook.chapters[chapterIndex];
          const splitIndex = action.payload.splitIndex;

          // Validate split index
          if (splitIndex > 0 && splitIndex < originalChapter.content.length) {
            // Keep original chapter with first part of content
            const firstPart: Chapter = {
              ...originalChapter,
              content: originalChapter.content.slice(0, splitIndex),
              updatedAt: new Date(),
            };

            // Create new chapter with second part of content
            const secondPart: Chapter = {
              ...originalChapter,
              id: uuidv4(),
              title: `${originalChapter.title} (continued)`,
              content: originalChapter.content.slice(splitIndex),
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            // Replace original chapter and insert new chapter after it
            state.currentBook.chapters[chapterIndex] = firstPart;
            state.currentBook.chapters.splice(chapterIndex + 1, 0, secondPart);
            state.isDirty = true;
          }
        }
      }
    },

    /**
     * Add a new element (front or back matter)
     */
    addElement: (state, action: PayloadAction<{ element: Element; matter: 'front' | 'back' }>) => {
      if (state.currentBook) {
        const { element, matter } = action.payload;
        if (matter === 'front') {
          state.currentBook.frontMatter.push(element);
        } else {
          state.currentBook.backMatter.push(element);
        }
        state.isDirty = true;
      }
    },

    /**
     * Delete an element by ID
     */
    deleteElement: (state, action: PayloadAction<{ id: string; matter: 'front' | 'back' }>) => {
      if (state.currentBook) {
        const { id, matter } = action.payload;
        if (matter === 'front') {
          state.currentBook.frontMatter = state.currentBook.frontMatter.filter(
            (el) => el.id !== id
          );
        } else {
          state.currentBook.backMatter = state.currentBook.backMatter.filter(
            (el) => el.id !== id
          );
        }
        state.isDirty = true;
      }
    },

    /**
     * Update an element
     */
    updateElement: (
      state,
      action: PayloadAction<{ id: string; matter: 'front' | 'back'; updates: Partial<Element> }>
    ) => {
      if (state.currentBook) {
        const { id, matter, updates } = action.payload;
        const elements = matter === 'front' ? state.currentBook.frontMatter : state.currentBook.backMatter;
        const index = elements.findIndex((el) => el.id === id);
        if (index !== -1) {
          elements[index] = { ...elements[index], ...updates };
          state.isDirty = true;
        }
      }
    },

    /**
     * Reorder elements
     */
    reorderElements: (
      state,
      action: PayloadAction<{ matter: 'front' | 'back'; fromIndex: number; toIndex: number } | { matter: 'front' | 'back'; elementIds: string[] }>
    ) => {
      if (state.currentBook) {
        const { matter } = action.payload;
        const elements = matter === 'front' ? state.currentBook.frontMatter : state.currentBook.backMatter;

        // Support both array of IDs and fromIndex/toIndex
        if ('elementIds' in action.payload) {
          const elementMap = new Map(elements.map((el) => [el.id, el]));
          const reordered = action.payload.elementIds
            .map((id) => elementMap.get(id))
            .filter((el): el is Element => el !== undefined);
          if (matter === 'front') {
            state.currentBook.frontMatter = reordered;
          } else {
            state.currentBook.backMatter = reordered;
          }
        } else {
          const { fromIndex, toIndex } = action.payload;
          const [removed] = elements.splice(fromIndex, 1);
          elements.splice(toIndex, 0, removed);
        }
        state.isDirty = true;
      }
    },

    /**
     * Add an author
     */
    addAuthor: (state, action: PayloadAction<Author>) => {
      if (state.currentBook) {
        state.currentBook.authors.push(action.payload);
        state.isDirty = true;
      }
    },

    /**
     * Delete an author by ID
     */
    deleteAuthor: (state, action: PayloadAction<string>) => {
      if (state.currentBook) {
        state.currentBook.authors = state.currentBook.authors.filter(
          (author) => author.id !== action.payload
        );
        state.isDirty = true;
      }
    },

    /**
     * Update an author
     */
    updateAuthor: (state, action: PayloadAction<{ id: string; updates: Partial<Author> }>) => {
      if (state.currentBook) {
        const index = state.currentBook.authors.findIndex(
          (author) => author.id === action.payload.id
        );
        if (index !== -1) {
          state.currentBook.authors[index] = {
            ...state.currentBook.authors[index],
            ...action.payload.updates,
          };
          state.isDirty = true;
        }
      }
    },

    /**
     * Add a new style
     */
    addStyle: (state, action: PayloadAction<Style>) => {
      if (state.currentBook) {
        state.currentBook.styles.push(action.payload);
        state.isDirty = true;
      }
    },

    /**
     * Delete a style by ID
     */
    deleteStyle: (state, action: PayloadAction<string>) => {
      if (state.currentBook) {
        state.currentBook.styles = state.currentBook.styles.filter(
          (style) => style.id !== action.payload
        );
        state.isDirty = true;
      }
    },

    /**
     * Update a style
     */
    updateStyle: (state, action: PayloadAction<{ id: string; updates: Partial<Style> }>) => {
      if (state.currentBook) {
        const index = state.currentBook.styles.findIndex(
          (style) => style.id === action.payload.id
        );
        if (index !== -1) {
          state.currentBook.styles[index] = {
            ...state.currentBook.styles[index],
            ...action.payload.updates,
          };
          state.isDirty = true;
        }
      }
    },

    /**
     * Set the book styles array
     */
    setBookStyle: (state, action: PayloadAction<Style[]>) => {
      if (state.currentBook) {
        state.currentBook.styles = action.payload;
        state.isDirty = true;
      }
    },

    /**
     * Reorder styles
     */
    reorderStyles: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
      if (state.currentBook) {
        const { fromIndex, toIndex } = action.payload;
        const [removed] = state.currentBook.styles.splice(fromIndex, 1);
        state.currentBook.styles.splice(toIndex, 0, removed);
        state.isDirty = true;
      }
    },

    /**
     * Set loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    /**
     * Set error state
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    /**
     * Set dirty flag
     */
    setDirty: (state, action: PayloadAction<boolean>) => {
      state.isDirty = action.payload;
    },
  },
});

// Export actions
export const {
  setCurrentBook,
  setBook,
  clearBook,
  addChapter,
  deleteChapter,
  updateChapter,
  reorderChapters,
  mergeChapters,
  splitChapter,
  addElement,
  deleteElement,
  updateElement,
  reorderElements,
  updateMetadata,
  updateBookMetadata,
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
  setDirty,
} = bookSlice.actions;

// Basic Selectors
export const selectCurrentBook = (state: RootState) => state.book.currentBook;
export const selectBooks = (state: RootState) => state.book.books;
export const selectLoading = (state: RootState) => state.book.loading;
export const selectError = (state: RootState) => state.book.error;
export const selectIsDirty = (state: RootState) => state.book.isDirty;

// Derived selectors for book content
export const selectBookChapters = (state: RootState) => state.book.currentBook?.chapters || [];
export const selectBookStyles = (state: RootState) => state.book.currentBook?.styles || [];
export const selectBookFrontMatter = (state: RootState) => state.book.currentBook?.frontMatter || [];
export const selectBookBackMatter = (state: RootState) => state.book.currentBook?.backMatter || [];

// Memoized selector to get current active chapter based on editor's active chapter ID
export const selectActiveChapter = createSelector(
  [selectBookChapters, (state: RootState) => state.editor.activeChapterId],
  (chapters, activeChapterId) => {
    if (!activeChapterId) return null;
    return chapters.find(chapter => chapter.id === activeChapterId) || null;
  }
);

// Memoized selector to get current selected element based on selection state
export const selectSelectedElement = createSelector(
  [selectBookFrontMatter, selectBookBackMatter, (state: RootState) => state.selection.elementId],
  (frontMatter, backMatter, selectedElementId) => {
    if (!selectedElementId) return null;
    const allElements = [...frontMatter, ...backMatter];
    return allElements.find(element => element.id === selectedElementId) || null;
  }
);

// Memoized selector to get the first book style (default/current style)
export const selectCurrentBookStyle = createSelector(
  [selectBookStyles],
  (styles) => styles[0] || null
);

export default bookSlice.reducer;
