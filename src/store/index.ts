/**
 * Redux store configuration with Redux DevTools integration
 * Configures the Redux store with all slices and middleware,
 * including the undo/redo middleware for tracking actions.
 */

import { configureStore } from '@reduxjs/toolkit';
import {
  bookReducer,
  selectionReducer,
  uiReducer,
  styleReducer,
  previewReducer,
} from '../slices';
import undoReducer from '../slices/undoSlice';
import editorReducer from './editorSlice';
import undoMiddleware from './middleware/undoMiddleware';

export const store = configureStore({
  reducer: {
    book: bookReducer,
    selection: selectionReducer,
    undo: undoReducer,
    preview: previewReducer,
    editor: editorReducer,
    ui: uiReducer,
    style: styleReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore Date objects and other non-serializable values in actions and state
        ignoredActions: [
          'book/setBook',
          'book/updateBookMetadata',
          'book/updateChapter',
          'book/updateElement',
          'book/addChapter',
          'book/addFrontMatter',
          'book/addBackMatter',
          'undo/addToHistory',
          'editor/setEditorContent',
          'editor/updateEditorContent',
          'editor/loadChapterContent',
          'style/updateStyle',
          'preview/refreshPreview',
        ],
        ignoredActionPaths: [
          'payload.stateBefore',
          'payload.stateAfter',
          'payload.action',
          'payload.content',
          'payload.createdAt',
          'payload.updatedAt',
          'payload.chapter.createdAt',
          'payload.chapter.updatedAt',
          'payload.element.createdAt',
          'payload.element.updatedAt',
          'payload.style.createdAt',
          'payload.style.updatedAt',
          'payload.metadata.publicationDate',
        ],
        ignoredPaths: [
          'book.currentBook.createdAt',
          'book.currentBook.updatedAt',
          'book.currentBook.metadata.publicationDate',
          'undo.past',
          'undo.future',
          'editor.content',
          'preview.lastUpdated',
        ],
      },
    }).concat(undoMiddleware),
  devTools: {
    name: 'Book Publishing App',
    trace: true,
    traceLimit: 25,
    features: {
      pause: true,
      lock: true,
      persist: true,
      export: true,
      import: 'custom',
      jump: true,
      skip: true,
      reorder: true,
      dispatch: true,
      test: true,
    },
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
