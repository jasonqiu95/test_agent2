/**
 * Redux Store Configuration
 *
 * Configures the Redux store with all slices and middleware,
 * including the undo/redo middleware for tracking actions.
 */

import { configureStore } from '@reduxjs/toolkit';
import bookReducer from '../slices/bookSlice';
import undoReducer from '../slices/undoSlice';
import undoMiddleware from './middleware/undoMiddleware';

export const store = configureStore({
  reducer: {
    book: bookReducer,
    undo: undoReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: ['undo/addToHistory'],
        // Ignore these paths in the state
        ignoredActionPaths: ['payload.stateBefore', 'payload.stateAfter', 'payload.action'],
        ignoredPaths: ['undo.past', 'undo.future'],
      },
    }).concat(undoMiddleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
