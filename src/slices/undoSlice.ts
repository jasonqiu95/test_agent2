/**
 * Undo/Redo Slice
 *
 * Manages the undo/redo history stack with configurable limits.
 * Tracks past actions and future actions for undo/redo functionality.
 */

import { createSlice, PayloadAction, AnyAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

// Maximum number of actions to keep in history
const MAX_HISTORY_SIZE = 50;

export interface HistoryEntry {
  action: AnyAction;
  stateBefore: any;
  stateAfter: any;
  timestamp: number;
}

export interface UndoState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  maxHistorySize: number;
}

const initialState: UndoState = {
  past: [],
  future: [],
  maxHistorySize: MAX_HISTORY_SIZE,
};

export const undoSlice = createSlice({
  name: 'undo',
  initialState,
  reducers: {
    /**
     * Add an action to the history
     */
    addToHistory: (state, action: PayloadAction<HistoryEntry>) => {
      state.past.push(action.payload);

      // Enforce history size limit
      if (state.past.length > state.maxHistorySize) {
        state.past.shift(); // Remove oldest entry
      }
    },

    /**
     * Perform undo - move current state to future and restore previous state
     */
    undo: (state) => {
      if (state.past.length > 0) {
        const entry = state.past.pop()!;
        state.future.push(entry);
      }
    },

    /**
     * Perform redo - move future state to past and restore next state
     */
    redo: (state) => {
      if (state.future.length > 0) {
        const entry = state.future.pop()!;
        state.past.push(entry);
      }
    },

    /**
     * Clear all history
     */
    clearHistory: (state) => {
      state.past = [];
      state.future = [];
    },

    /**
     * Clear future history (called when new action is performed)
     */
    clearFuture: (state) => {
      state.future = [];
    },

    /**
     * Set maximum history size
     */
    setMaxHistorySize: (state, action: PayloadAction<number>) => {
      state.maxHistorySize = action.payload;

      // Trim history if new size is smaller
      if (state.past.length > state.maxHistorySize) {
        state.past = state.past.slice(-state.maxHistorySize);
      }
    },
  },
});

// Export actions
export const {
  addToHistory,
  undo,
  redo,
  clearHistory,
  clearFuture,
  setMaxHistorySize,
} = undoSlice.actions;

// Selectors
export const selectCanUndo = (state: RootState) => state.undo.past.length > 0;
export const selectCanRedo = (state: RootState) => state.undo.future.length > 0;
export const selectUndoCount = (state: RootState) => state.undo.past.length;
export const selectRedoCount = (state: RootState) => state.undo.future.length;
export const selectLastAction = (state: RootState) =>
  state.undo.past.length > 0 ? state.undo.past[state.undo.past.length - 1] : null;
export const selectNextAction = (state: RootState) =>
  state.undo.future.length > 0 ? state.undo.future[state.undo.future.length - 1] : null;

export default undoSlice.reducer;
