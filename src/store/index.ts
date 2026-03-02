/**
 * Redux Store Configuration
 *
 * Configures the Redux store with all slices and middleware,
 * including the undo/redo middleware for tracking actions.
 */

import { configureStore } from '@reduxjs/toolkit';
import bookReducer from '../slices/bookSlice';
import selectionReducer from './selectionSlice';
import undoReducer from '../slices/undoSlice';
import previewReducer from './previewSlice';
import editorReducer from './editorSlice';
import undoMiddleware from './middleware/undoMiddleware';

export const store = configureStore({
  reducer: {
    book: bookReducer,
    selection: selectionReducer,
    undo: undoReducer,
    preview: previewReducer,
    editor: editorReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: [
          'book/setBook',
          'book/addChapter',
          'book/addFrontMatter',
          'book/addBackMatter',
          'undo/addToHistory',
          'editor/setEditorContent',
          'editor/updateEditorContent',
          'editor/loadChapterContent',
        ],
        // Ignore these paths in the state
        ignoredActionPaths: ['payload.stateBefore', 'payload.stateAfter', 'payload.action', 'payload.content'],
        ignoredPaths: [
          'book.book.createdAt',
          'book.book.updatedAt',
          'book.book.metadata.publicationDate',
          'undo.past',
          'undo.future',
          'editor.content',
        ],
      },
    }).concat(undoMiddleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
