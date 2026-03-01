/**
 * Redux slice for book data management
 * Handles CRUD operations for books, chapters, and elements
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Book, Chapter, Element } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface BookState {
  currentBook: Book | null;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
}

const initialState: BookState = {
  currentBook: null,
  isLoading: false,
  error: null,
  isDirty: false,
};

const bookSlice = createSlice({
  name: 'book',
  initialState,
  reducers: {
    // Book-level operations
    setBook: (state, action: PayloadAction<Book>) => {
      state.currentBook = action.payload;
      state.isDirty = false;
      state.error = null;
    },
    clearBook: (state) => {
      state.currentBook = null;
      state.isDirty = false;
      state.error = null;
    },
    updateBookMetadata: (state, action: PayloadAction<Partial<Book>>) => {
      if (state.currentBook) {
        state.currentBook = { ...state.currentBook, ...action.payload };
        state.isDirty = true;
      }
    },

    // Chapter CRUD operations
    addChapter: (state, action: PayloadAction<Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>>) => {
      if (state.currentBook) {
        const newChapter: Chapter = {
          ...action.payload,
          id: uuidv4(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.currentBook.chapters.push(newChapter);
        state.isDirty = true;
      }
    },
    updateChapter: (state, action: PayloadAction<{ id: string; updates: Partial<Chapter> }>) => {
      if (state.currentBook) {
        const index = state.currentBook.chapters.findIndex((ch) => ch.id === action.payload.id);
        if (index !== -1) {
          state.currentBook.chapters[index] = {
            ...state.currentBook.chapters[index],
            ...action.payload.updates,
            updatedAt: new Date(),
          };
          state.isDirty = true;
        }
      }
    },
    deleteChapter: (state, action: PayloadAction<string>) => {
      if (state.currentBook) {
        state.currentBook.chapters = state.currentBook.chapters.filter(
          (ch) => ch.id !== action.payload
        );
        state.isDirty = true;
      }
    },
    reorderChapters: (state, action: PayloadAction<string[]>) => {
      if (state.currentBook) {
        const chapterMap = new Map(state.currentBook.chapters.map((ch) => [ch.id, ch]));
        state.currentBook.chapters = action.payload
          .map((id) => chapterMap.get(id))
          .filter((ch): ch is Chapter => ch !== undefined);
        state.isDirty = true;
      }
    },

    // Element CRUD operations (for front/back matter)
    addElement: (
      state,
      action: PayloadAction<{
        matter: 'front' | 'back';
        element: Omit<Element, 'id' | 'createdAt' | 'updatedAt'>;
      }>
    ) => {
      if (state.currentBook) {
        const newElement: Element = {
          ...action.payload.element,
          id: uuidv4(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        if (action.payload.matter === 'front') {
          state.currentBook.frontMatter.push(newElement);
        } else {
          state.currentBook.backMatter.push(newElement);
        }
        state.isDirty = true;
      }
    },
    updateElement: (
      state,
      action: PayloadAction<{
        matter: 'front' | 'back';
        id: string;
        updates: Partial<Element>;
      }>
    ) => {
      if (state.currentBook) {
        const matterArray =
          action.payload.matter === 'front'
            ? state.currentBook.frontMatter
            : state.currentBook.backMatter;
        const index = matterArray.findIndex((el) => el.id === action.payload.id);
        if (index !== -1) {
          matterArray[index] = {
            ...matterArray[index],
            ...action.payload.updates,
            updatedAt: new Date(),
          };
          state.isDirty = true;
        }
      }
    },
    deleteElement: (state, action: PayloadAction<{ matter: 'front' | 'back'; id: string }>) => {
      if (state.currentBook) {
        if (action.payload.matter === 'front') {
          state.currentBook.frontMatter = state.currentBook.frontMatter.filter(
            (el) => el.id !== action.payload.id
          );
        } else {
          state.currentBook.backMatter = state.currentBook.backMatter.filter(
            (el) => el.id !== action.payload.id
          );
        }
        state.isDirty = true;
      }
    },
    reorderElements: (
      state,
      action: PayloadAction<{ matter: 'front' | 'back'; elementIds: string[] }>
    ) => {
      if (state.currentBook) {
        const matterArray =
          action.payload.matter === 'front'
            ? state.currentBook.frontMatter
            : state.currentBook.backMatter;
        const elementMap = new Map(matterArray.map((el) => [el.id, el]));
        const reordered = action.payload.elementIds
          .map((id) => elementMap.get(id))
          .filter((el): el is Element => el !== undefined);
        if (action.payload.matter === 'front') {
          state.currentBook.frontMatter = reordered;
        } else {
          state.currentBook.backMatter = reordered;
        }
        state.isDirty = true;
      }
    },

    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setDirty: (state, action: PayloadAction<boolean>) => {
      state.isDirty = action.payload;
    },
  },
});

export const {
  setBook,
  clearBook,
  updateBookMetadata,
  addChapter,
  updateChapter,
  deleteChapter,
  reorderChapters,
  addElement,
  updateElement,
  deleteElement,
  reorderElements,
  setLoading,
  setError,
  setDirty,
} = bookSlice.actions;

export default bookSlice.reducer;
