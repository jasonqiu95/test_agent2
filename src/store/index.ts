/**
 * Redux store configuration with Redux DevTools integration
 */

import { configureStore } from '@reduxjs/toolkit';
import {
  bookReducer,
  selectionReducer,
  uiReducer,
  styleReducer,
  previewReducer,
} from '../slices';

export const store = configureStore({
  reducer: {
    book: bookReducer,
    selection: selectionReducer,
    ui: uiReducer,
    style: styleReducer,
    preview: previewReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore Date objects in actions and state
        ignoredActions: [
          'book/setBook',
          'book/updateBookMetadata',
          'book/updateChapter',
          'book/updateElement',
          'style/updateStyle',
          'preview/refreshPreview',
        ],
        ignoredActionPaths: [
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
          'preview.lastUpdated',
        ],
      },
    }),
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
