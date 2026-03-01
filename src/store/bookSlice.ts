import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Book, Chapter, Element } from '../types';

interface BookState {
  book: Book | null;
}

const initialState: BookState = {
  book: null,
};

const bookSlice = createSlice({
  name: 'book',
  initialState,
  reducers: {
    setBook: (state, action: PayloadAction<Book>) => {
      state.book = action.payload;
    },
    clearBook: (state) => {
      state.book = null;
    },
    addFrontMatter: (state, action: PayloadAction<Element>) => {
      if (state.book) {
        state.book.frontMatter.push(action.payload);
      }
    },
    addChapter: (state, action: PayloadAction<Chapter>) => {
      if (state.book) {
        state.book.chapters.push(action.payload);
      }
    },
    addBackMatter: (state, action: PayloadAction<Element>) => {
      if (state.book) {
        state.book.backMatter.push(action.payload);
      }
    },
    deleteFrontMatter: (state, action: PayloadAction<string>) => {
      if (state.book) {
        state.book.frontMatter = state.book.frontMatter.filter(
          (element) => element.id !== action.payload
        );
      }
    },
    deleteChapter: (state, action: PayloadAction<string>) => {
      if (state.book) {
        state.book.chapters = state.book.chapters.filter(
          (chapter) => chapter.id !== action.payload
        );
      }
    },
    deleteBackMatter: (state, action: PayloadAction<string>) => {
      if (state.book) {
        state.book.backMatter = state.book.backMatter.filter(
          (element) => element.id !== action.payload
        );
      }
    },
    reorderFrontMatter: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
      if (state.book) {
        const { fromIndex, toIndex } = action.payload;
        const [element] = state.book.frontMatter.splice(fromIndex, 1);
        state.book.frontMatter.splice(toIndex, 0, element);
      }
    },
    reorderChapters: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
      if (state.book) {
        const { fromIndex, toIndex } = action.payload;
        const [chapter] = state.book.chapters.splice(fromIndex, 1);
        state.book.chapters.splice(toIndex, 0, chapter);
      }
    },
    reorderBackMatter: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
      if (state.book) {
        const { fromIndex, toIndex } = action.payload;
        const [element] = state.book.backMatter.splice(fromIndex, 1);
        state.book.backMatter.splice(toIndex, 0, element);
      }
    },
    updateFrontMatter: (state, action: PayloadAction<Element>) => {
      if (state.book) {
        const index = state.book.frontMatter.findIndex(
          (element) => element.id === action.payload.id
        );
        if (index !== -1) {
          state.book.frontMatter[index] = action.payload;
        }
      }
    },
    updateChapter: (state, action: PayloadAction<Chapter>) => {
      if (state.book) {
        const index = state.book.chapters.findIndex(
          (chapter) => chapter.id === action.payload.id
        );
        if (index !== -1) {
          state.book.chapters[index] = action.payload;
        }
      }
    },
    updateBackMatter: (state, action: PayloadAction<Element>) => {
      if (state.book) {
        const index = state.book.backMatter.findIndex(
          (element) => element.id === action.payload.id
        );
        if (index !== -1) {
          state.book.backMatter[index] = action.payload;
        }
      }
    },
  },
});

export const {
  setBook,
  clearBook,
  addFrontMatter,
  addChapter,
  addBackMatter,
  deleteFrontMatter,
  deleteChapter,
  deleteBackMatter,
  reorderFrontMatter,
  reorderChapters,
  reorderBackMatter,
  updateFrontMatter,
  updateChapter,
  updateBackMatter,
} = bookSlice.actions;

export default bookSlice.reducer;
