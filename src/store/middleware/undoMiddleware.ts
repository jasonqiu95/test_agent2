/**
 * Undo/Redo Middleware for Redux
 *
 * This middleware tracks actions that should be undoable and maintains
 * a history stack with a configurable limit.
 */

import { Middleware, AnyAction } from '@reduxjs/toolkit';
import { addToHistory, clearFuture } from '../../slices/undoSlice';
import { setCurrentBook } from '../../slices/bookSlice';

// Actions that should be tracked for undo/redo
const UNDOABLE_ACTION_PREFIXES = [
  'book/addChapter',
  'book/deleteChapter',
  'book/reorderChapters',
  'book/updateChapter',
  'book/addElement',
  'book/deleteElement',
  'book/reorderElements',
  'book/updateElement',
  'book/updateMetadata',
  'book/addAuthor',
  'book/deleteAuthor',
  'book/updateAuthor',
  'book/addStyle',
  'book/deleteStyle',
  'book/updateStyle',
  'book/setBookStyle',
  'book/reorderStyles',
];

// Actions that should not be tracked
const SKIP_ACTIONS = [
  'undo/addToHistory',
  'undo/undo',
  'undo/redo',
  'undo/clearHistory',
  'undo/clearFuture',
  'book/setCurrentBook',
  'book/setLoading',
  'book/setError',
];

/**
 * Check if an action should be tracked for undo/redo
 */
function isUndoableAction(action: AnyAction): boolean {
  const actionType = action.type as string;

  // Skip internal undo actions
  if (SKIP_ACTIONS.some(skip => actionType.startsWith(skip))) {
    return false;
  }

  // Check if action matches any undoable prefix
  return UNDOABLE_ACTION_PREFIXES.some(prefix => actionType.startsWith(prefix));
}

/**
 * Undo middleware that tracks undoable actions and handles state restoration
 */
export const undoMiddleware: Middleware = (store) => (next) => (action) => {
  const actionType = (action as AnyAction).type;

  // Handle undo action
  if (actionType === 'undo/undo') {
    const state = store.getState();
    const past = state.undo.past;

    if (past.length > 0) {
      const lastEntry = past[past.length - 1];

      // First update the undo state
      const result = next(action);

      // Then restore the book state
      if (lastEntry.stateBefore.book) {
        store.dispatch(setCurrentBook(lastEntry.stateBefore.book.currentBook));
      }

      return result;
    }
    return next(action);
  }

  // Handle redo action
  if (actionType === 'undo/redo') {
    const state = store.getState();
    const future = state.undo.future;

    if (future.length > 0) {
      const nextEntry = future[future.length - 1];

      // First update the undo state
      const result = next(action);

      // Then restore the book state
      if (nextEntry.stateAfter.book) {
        store.dispatch(setCurrentBook(nextEntry.stateAfter.book.currentBook));
      }

      return result;
    }
    return next(action);
  }

  // Get state before action
  const stateBefore = store.getState();

  // Execute action
  const result = next(action);

  // Get state after action
  const stateAfter = store.getState();

  // If action is undoable, add to history
  if (isUndoableAction(action as AnyAction)) {
    store.dispatch(addToHistory({
      action: action as AnyAction,
      stateBefore: stateBefore,
      stateAfter: stateAfter,
      timestamp: Date.now(),
    }));

    // Clear future when a new action is performed
    store.dispatch(clearFuture());
  }

  return result;
};

export default undoMiddleware;
