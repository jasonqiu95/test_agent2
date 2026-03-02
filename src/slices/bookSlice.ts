/**
 * Book Slice
 *
 * Manages book state with undoable actions for structural changes.
 * All actions here are tracked by the undo middleware.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { Book, Author } from '../types/book';
import { Chapter } from '../types/chapter';
import { Element } from '../types/element';
import { Style } from '../types/style';

export interface BookState {
  currentBook: Book | null;
  books: Book[];
  loading: boolean;
  error: string | null;
}

const initialState: BookState = {
  currentBook: null,
  books: [],
  loading: false,
  error: null,
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
    },

    /**
     * Add a new chapter to the current book
     */
    addChapter: (state, action: PayloadAction<Chapter>) => {
      if (state.currentBook) {
        state.currentBook.chapters.push(action.payload);
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
        }
      }
    },

    /**
     * Reorder chapters
     */
    reorderChapters: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
      if (state.currentBook) {
        const { fromIndex, toIndex } = action.payload;
        const [removed] = state.currentBook.chapters.splice(fromIndex, 1);
        state.currentBook.chapters.splice(toIndex, 0, removed);
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
        }
      }
    },

    /**
     * Reorder elements
     */
    reorderElements: (
      state,
      action: PayloadAction<{ matter: 'front' | 'back'; fromIndex: number; toIndex: number }>
    ) => {
      if (state.currentBook) {
        const { matter, fromIndex, toIndex } = action.payload;
        const elements = matter === 'front' ? state.currentBook.frontMatter : state.currentBook.backMatter;
        const [removed] = elements.splice(fromIndex, 1);
        elements.splice(toIndex, 0, removed);
      }
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
      }
    },

    /**
     * Add an author
     */
    addAuthor: (state, action: PayloadAction<Author>) => {
      if (state.currentBook) {
        state.currentBook.authors.push(action.payload);
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
        }
      }
    },

    /**
     * Add a new style
     */
    addStyle: (state, action: PayloadAction<Style>) => {
      if (state.currentBook) {
        state.currentBook.styles.push(action.payload);
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
        }
      }
    },

    /**
     * Set the book styles array
     */
    setBookStyle: (state, action: PayloadAction<Style[]>) => {
      if (state.currentBook) {
        state.currentBook.styles = action.payload;
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
  },
});

// Export actions
export const {
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
} = bookSlice.actions;

// Selectors
export const selectCurrentBook = (state: RootState) => state.book.currentBook;
export const selectBooks = (state: RootState) => state.book.books;
export const selectLoading = (state: RootState) => state.book.loading;
export const selectError = (state: RootState) => state.book.error;

export default bookSlice.reducer;
