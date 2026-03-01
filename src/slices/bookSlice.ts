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
    mergeChapters: (
      state,
      action: PayloadAction<{ chapterIds: string[]; title?: string }>
    ) => {
      if (state.currentBook && action.payload.chapterIds.length >= 2) {
        const chapterIds = action.payload.chapterIds;
        const chaptersToMerge = chapterIds
          .map((id) => state.currentBook!.chapters.find((ch) => ch.id === id))
          .filter((ch): ch is Chapter => ch !== undefined);

        if (chaptersToMerge.length >= 2) {
          // Create merged chapter from the first chapter
          const mergedChapter: Chapter = {
            ...chaptersToMerge[0],
            id: uuidv4(),
            title: action.payload.title || chaptersToMerge[0].title,
            content: chaptersToMerge.flatMap((ch) => ch.content),
            updatedAt: new Date(),
          };

          // Find the index of the first chapter to merge
          const firstChapterIndex = state.currentBook.chapters.findIndex(
            (ch) => ch.id === chapterIds[0]
          );

          // Remove all chapters to be merged and insert the merged chapter at the first position
          state.currentBook.chapters = state.currentBook.chapters.filter(
            (ch) => !chapterIds.includes(ch.id)
          );
          state.currentBook.chapters.splice(firstChapterIndex, 0, mergedChapter);
          state.isDirty = true;
        }
      }
    },
    splitChapter: (
      state,
      action: PayloadAction<{ chapterId: string; splitPoints: number[] }>
    ) => {
      if (state.currentBook && action.payload.splitPoints.length > 0) {
        const chapterIndex = state.currentBook.chapters.findIndex(
          (ch) => ch.id === action.payload.chapterId
        );

        if (chapterIndex !== -1) {
          const originalChapter = state.currentBook.chapters[chapterIndex];
          const sortedSplitPoints = [...action.payload.splitPoints].sort((a, b) => a - b);

          // Create new chapters by splitting at the specified points
          const newChapters: Chapter[] = [];
          let previousPoint = 0;

          sortedSplitPoints.forEach((splitPoint, index) => {
            if (splitPoint > previousPoint && splitPoint <= originalChapter.content.length) {
              const chapterContent = originalChapter.content.slice(previousPoint, splitPoint);
              if (chapterContent.length > 0) {
                newChapters.push({
                  ...originalChapter,
                  id: uuidv4(),
                  title: `${originalChapter.title} - Part ${index + 1}`,
                  content: chapterContent,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
              }
              previousPoint = splitPoint;
            }
          });

          // Add the remaining content as the last chapter
          if (previousPoint < originalChapter.content.length) {
            const remainingContent = originalChapter.content.slice(previousPoint);
            if (remainingContent.length > 0) {
              newChapters.push({
                ...originalChapter,
                id: uuidv4(),
                title: `${originalChapter.title} - Part ${newChapters.length + 1}`,
                content: remainingContent,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          }

          // Replace the original chapter with the new chapters
          if (newChapters.length > 0) {
            state.currentBook.chapters.splice(chapterIndex, 1, ...newChapters);
            state.isDirty = true;
          }
        }
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
  mergeChapters,
  splitChapter,
  addElement,
  updateElement,
  deleteElement,
  reorderElements,
  setLoading,
  setError,
  setDirty,
} = bookSlice.actions;

export default bookSlice.reducer;
