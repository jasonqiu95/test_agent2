import { configureStore } from '@reduxjs/toolkit';
import bookReducer from './bookSlice';
import selectionReducer from './selectionSlice';

export const store = configureStore({
  reducer: {
    book: bookReducer,
    selection: selectionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['book/setBook', 'book/addChapter', 'book/addFrontMatter', 'book/addBackMatter'],
        ignoredPaths: ['book.book.createdAt', 'book.book.updatedAt', 'book.book.metadata.publicationDate'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
