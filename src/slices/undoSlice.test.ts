/**
 * Unit tests for undoSlice
 *
 * Tests for the undo/redo functionality including:
 * - addToHistory action
 * - undo/redo actions
 * - clearHistory action
 * - history size limits (50 actions)
 * - selectors
 * - edge cases
 */

import { configureStore } from '@reduxjs/toolkit';
import undoReducer, {
  addToHistory,
  undo,
  redo,
  clearHistory,
  clearFuture,
  setMaxHistorySize,
  selectCanUndo,
  selectCanRedo,
  selectUndoCount,
  selectRedoCount,
  selectLastAction,
  selectNextAction,
  type HistoryEntry,
  type UndoState,
} from './undoSlice';
import type { RootState } from '../store';

// Helper function to create a test store
const createTestStore = (initialState?: Partial<UndoState>) => {
  const store = configureStore({
    reducer: {
      undo: undoReducer,
    },
    preloadedState: initialState ? { undo: { ...initialState } as UndoState } : undefined,
  });
  return store;
};

// Helper function to create a mock history entry
const createHistoryEntry = (id: number): HistoryEntry => ({
  action: { type: `TEST_ACTION_${id}` },
  stateBefore: { value: id - 1 },
  stateAfter: { value: id },
  timestamp: Date.now() + id,
});

describe('undoSlice', () => {
  describe('initial state', () => {
    it('should have empty past and future arrays', () => {
      const store = createTestStore();
      const state = store.getState().undo;

      expect(state.past).toEqual([]);
      expect(state.future).toEqual([]);
      expect(state.maxHistorySize).toBe(50);
    });
  });

  describe('addToHistory action', () => {
    it('should add a history entry to past', () => {
      const store = createTestStore();
      const entry = createHistoryEntry(1);

      store.dispatch(addToHistory(entry));

      const state = store.getState().undo;
      expect(state.past).toHaveLength(1);
      expect(state.past[0]).toEqual(entry);
    });

    it('should add multiple history entries in order', () => {
      const store = createTestStore();
      const entry1 = createHistoryEntry(1);
      const entry2 = createHistoryEntry(2);
      const entry3 = createHistoryEntry(3);

      store.dispatch(addToHistory(entry1));
      store.dispatch(addToHistory(entry2));
      store.dispatch(addToHistory(entry3));

      const state = store.getState().undo;
      expect(state.past).toHaveLength(3);
      expect(state.past[0]).toEqual(entry1);
      expect(state.past[1]).toEqual(entry2);
      expect(state.past[2]).toEqual(entry3);
    });

    it('should not affect future array', () => {
      const store = createTestStore();
      const entry = createHistoryEntry(1);

      store.dispatch(addToHistory(entry));

      const state = store.getState().undo;
      expect(state.future).toEqual([]);
    });

    it('should enforce max history size limit of 50', () => {
      const store = createTestStore();

      // Add 55 entries (5 more than the limit)
      for (let i = 0; i < 55; i++) {
        store.dispatch(addToHistory(createHistoryEntry(i)));
      }

      const state = store.getState().undo;
      expect(state.past).toHaveLength(50);

      // First 5 entries should be removed (oldest ones)
      expect(state.past[0].action.type).toBe('TEST_ACTION_5');
      expect(state.past[49].action.type).toBe('TEST_ACTION_54');
    });

    it('should remove oldest entry when exceeding max history size by 1', () => {
      const store = createTestStore();

      // Add exactly 51 entries (1 more than the limit)
      for (let i = 0; i < 51; i++) {
        store.dispatch(addToHistory(createHistoryEntry(i)));
      }

      const state = store.getState().undo;
      expect(state.past).toHaveLength(50);

      // First entry (TEST_ACTION_0) should be removed
      expect(state.past[0].action.type).toBe('TEST_ACTION_1');
      expect(state.past[49].action.type).toBe('TEST_ACTION_50');
    });
  });

  describe('undo action', () => {
    it('should move last entry from past to future', () => {
      const entry1 = createHistoryEntry(1);
      const entry2 = createHistoryEntry(2);
      const store = createTestStore({
        past: [entry1, entry2],
        future: [],
        maxHistorySize: 50,
      });

      store.dispatch(undo());

      const state = store.getState().undo;
      expect(state.past).toHaveLength(1);
      expect(state.past[0]).toEqual(entry1);
      expect(state.future).toHaveLength(1);
      expect(state.future[0]).toEqual(entry2);
    });

    it('should handle multiple undo operations', () => {
      const entry1 = createHistoryEntry(1);
      const entry2 = createHistoryEntry(2);
      const entry3 = createHistoryEntry(3);
      const store = createTestStore({
        past: [entry1, entry2, entry3],
        future: [],
        maxHistorySize: 50,
      });

      store.dispatch(undo());
      store.dispatch(undo());

      const state = store.getState().undo;
      expect(state.past).toHaveLength(1);
      expect(state.past[0]).toEqual(entry1);
      expect(state.future).toHaveLength(2);
      expect(state.future[0]).toEqual(entry3);
      expect(state.future[1]).toEqual(entry2);
    });

    it('should not affect state when past is empty', () => {
      const store = createTestStore({
        past: [],
        future: [],
        maxHistorySize: 50,
      });

      store.dispatch(undo());

      const state = store.getState().undo;
      expect(state.past).toHaveLength(0);
      expect(state.future).toHaveLength(0);
    });

    it('should preserve existing future entries when undoing', () => {
      const entry1 = createHistoryEntry(1);
      const entry2 = createHistoryEntry(2);
      const futureEntry = createHistoryEntry(99);
      const store = createTestStore({
        past: [entry1, entry2],
        future: [futureEntry],
        maxHistorySize: 50,
      });

      store.dispatch(undo());

      const state = store.getState().undo;
      expect(state.past).toHaveLength(1);
      expect(state.future).toHaveLength(2);
      expect(state.future[0]).toEqual(futureEntry);
      expect(state.future[1]).toEqual(entry2);
    });
  });

  describe('redo action', () => {
    it('should move last entry from future to past', () => {
      const entry1 = createHistoryEntry(1);
      const futureEntry = createHistoryEntry(2);
      const store = createTestStore({
        past: [entry1],
        future: [futureEntry],
        maxHistorySize: 50,
      });

      store.dispatch(redo());

      const state = store.getState().undo;
      expect(state.past).toHaveLength(2);
      expect(state.past[1]).toEqual(futureEntry);
      expect(state.future).toHaveLength(0);
    });

    it('should handle multiple redo operations', () => {
      const entry1 = createHistoryEntry(1);
      const futureEntry1 = createHistoryEntry(2);
      const futureEntry2 = createHistoryEntry(3);
      const store = createTestStore({
        past: [entry1],
        future: [futureEntry2, futureEntry1],
        maxHistorySize: 50,
      });

      store.dispatch(redo());
      store.dispatch(redo());

      const state = store.getState().undo;
      expect(state.past).toHaveLength(3);
      expect(state.past[1]).toEqual(futureEntry1);
      expect(state.past[2]).toEqual(futureEntry2);
      expect(state.future).toHaveLength(0);
    });

    it('should not affect state when future is empty', () => {
      const entry1 = createHistoryEntry(1);
      const store = createTestStore({
        past: [entry1],
        future: [],
        maxHistorySize: 50,
      });

      store.dispatch(redo());

      const state = store.getState().undo;
      expect(state.past).toHaveLength(1);
      expect(state.past[0]).toEqual(entry1);
      expect(state.future).toHaveLength(0);
    });
  });

  describe('clearHistory action', () => {
    it('should clear both past and future arrays', () => {
      const entry1 = createHistoryEntry(1);
      const entry2 = createHistoryEntry(2);
      const futureEntry = createHistoryEntry(3);
      const store = createTestStore({
        past: [entry1, entry2],
        future: [futureEntry],
        maxHistorySize: 50,
      });

      store.dispatch(clearHistory());

      const state = store.getState().undo;
      expect(state.past).toEqual([]);
      expect(state.future).toEqual([]);
    });

    it('should work on already empty history', () => {
      const store = createTestStore({
        past: [],
        future: [],
        maxHistorySize: 50,
      });

      store.dispatch(clearHistory());

      const state = store.getState().undo;
      expect(state.past).toEqual([]);
      expect(state.future).toEqual([]);
    });

    it('should not affect maxHistorySize', () => {
      const store = createTestStore({
        past: [createHistoryEntry(1)],
        future: [createHistoryEntry(2)],
        maxHistorySize: 50,
      });

      store.dispatch(clearHistory());

      const state = store.getState().undo;
      expect(state.maxHistorySize).toBe(50);
    });
  });

  describe('clearFuture action', () => {
    it('should clear future array only', () => {
      const entry1 = createHistoryEntry(1);
      const entry2 = createHistoryEntry(2);
      const futureEntry1 = createHistoryEntry(3);
      const futureEntry2 = createHistoryEntry(4);
      const store = createTestStore({
        past: [entry1, entry2],
        future: [futureEntry1, futureEntry2],
        maxHistorySize: 50,
      });

      store.dispatch(clearFuture());

      const state = store.getState().undo;
      expect(state.past).toHaveLength(2);
      expect(state.past[0]).toEqual(entry1);
      expect(state.past[1]).toEqual(entry2);
      expect(state.future).toEqual([]);
    });

    it('should work when future is already empty', () => {
      const entry1 = createHistoryEntry(1);
      const store = createTestStore({
        past: [entry1],
        future: [],
        maxHistorySize: 50,
      });

      store.dispatch(clearFuture());

      const state = store.getState().undo;
      expect(state.past).toHaveLength(1);
      expect(state.future).toEqual([]);
    });
  });

  describe('setMaxHistorySize action', () => {
    it('should update maxHistorySize', () => {
      const store = createTestStore();

      store.dispatch(setMaxHistorySize(30));

      const state = store.getState().undo;
      expect(state.maxHistorySize).toBe(30);
    });

    it('should trim past when new size is smaller than current history', () => {
      const entries = Array.from({ length: 40 }, (_, i) => createHistoryEntry(i));
      const store = createTestStore({
        past: entries,
        future: [],
        maxHistorySize: 50,
      });

      store.dispatch(setMaxHistorySize(20));

      const state = store.getState().undo;
      expect(state.maxHistorySize).toBe(20);
      expect(state.past).toHaveLength(20);

      // Should keep the most recent 20 entries
      expect(state.past[0].action.type).toBe('TEST_ACTION_20');
      expect(state.past[19].action.type).toBe('TEST_ACTION_39');
    });

    it('should not trim past when new size is larger than current history', () => {
      const entries = Array.from({ length: 10 }, (_, i) => createHistoryEntry(i));
      const store = createTestStore({
        past: entries,
        future: [],
        maxHistorySize: 50,
      });

      store.dispatch(setMaxHistorySize(100));

      const state = store.getState().undo;
      expect(state.maxHistorySize).toBe(100);
      expect(state.past).toHaveLength(10);
    });

    it('should not affect future array', () => {
      const entries = Array.from({ length: 40 }, (_, i) => createHistoryEntry(i));
      const futureEntry = createHistoryEntry(99);
      const store = createTestStore({
        past: entries,
        future: [futureEntry],
        maxHistorySize: 50,
      });

      store.dispatch(setMaxHistorySize(20));

      const state = store.getState().undo;
      expect(state.future).toHaveLength(1);
      expect(state.future[0]).toEqual(futureEntry);
    });
  });

  describe('selectors', () => {
    describe('selectCanUndo', () => {
      it('should return true when past has entries', () => {
        const state = {
          undo: {
            past: [createHistoryEntry(1)],
            future: [],
            maxHistorySize: 50,
          },
        } as RootState;

        expect(selectCanUndo(state)).toBe(true);
      });

      it('should return false when past is empty', () => {
        const state = {
          undo: {
            past: [],
            future: [],
            maxHistorySize: 50,
          },
        } as RootState;

        expect(selectCanUndo(state)).toBe(false);
      });
    });

    describe('selectCanRedo', () => {
      it('should return true when future has entries', () => {
        const state = {
          undo: {
            past: [],
            future: [createHistoryEntry(1)],
            maxHistorySize: 50,
          },
        } as RootState;

        expect(selectCanRedo(state)).toBe(true);
      });

      it('should return false when future is empty', () => {
        const state = {
          undo: {
            past: [createHistoryEntry(1)],
            future: [],
            maxHistorySize: 50,
          },
        } as RootState;

        expect(selectCanRedo(state)).toBe(false);
      });
    });

    describe('selectUndoCount', () => {
      it('should return the number of entries in past', () => {
        const state = {
          undo: {
            past: [createHistoryEntry(1), createHistoryEntry(2), createHistoryEntry(3)],
            future: [],
            maxHistorySize: 50,
          },
        } as RootState;

        expect(selectUndoCount(state)).toBe(3);
      });

      it('should return 0 when past is empty', () => {
        const state = {
          undo: {
            past: [],
            future: [],
            maxHistorySize: 50,
          },
        } as RootState;

        expect(selectUndoCount(state)).toBe(0);
      });
    });

    describe('selectRedoCount', () => {
      it('should return the number of entries in future', () => {
        const state = {
          undo: {
            past: [],
            future: [createHistoryEntry(1), createHistoryEntry(2)],
            maxHistorySize: 50,
          },
        } as RootState;

        expect(selectRedoCount(state)).toBe(2);
      });

      it('should return 0 when future is empty', () => {
        const state = {
          undo: {
            past: [createHistoryEntry(1)],
            future: [],
            maxHistorySize: 50,
          },
        } as RootState;

        expect(selectRedoCount(state)).toBe(0);
      });
    });

    describe('selectLastAction', () => {
      it('should return the last entry in past', () => {
        const entry1 = createHistoryEntry(1);
        const entry2 = createHistoryEntry(2);
        const state = {
          undo: {
            past: [entry1, entry2],
            future: [],
            maxHistorySize: 50,
          },
        } as RootState;

        expect(selectLastAction(state)).toEqual(entry2);
      });

      it('should return null when past is empty', () => {
        const state = {
          undo: {
            past: [],
            future: [],
            maxHistorySize: 50,
          },
        } as RootState;

        expect(selectLastAction(state)).toBeNull();
      });
    });

    describe('selectNextAction', () => {
      it('should return the last entry in future', () => {
        const entry1 = createHistoryEntry(1);
        const entry2 = createHistoryEntry(2);
        const state = {
          undo: {
            past: [],
            future: [entry1, entry2],
            maxHistorySize: 50,
          },
        } as RootState;

        expect(selectNextAction(state)).toEqual(entry2);
      });

      it('should return null when future is empty', () => {
        const state = {
          undo: {
            past: [createHistoryEntry(1)],
            future: [],
            maxHistorySize: 50,
          },
        } as RootState;

        expect(selectNextAction(state)).toBeNull();
      });
    });
  });

  describe('edge cases', () => {
    it('should handle undo operation with only one entry in past', () => {
      const entry = createHistoryEntry(1);
      const store = createTestStore({
        past: [entry],
        future: [],
        maxHistorySize: 50,
      });

      store.dispatch(undo());

      const state = store.getState().undo;
      expect(state.past).toHaveLength(0);
      expect(state.future).toHaveLength(1);
      expect(state.future[0]).toEqual(entry);
    });

    it('should handle redo operation with only one entry in future', () => {
      const entry = createHistoryEntry(1);
      const store = createTestStore({
        past: [],
        future: [entry],
        maxHistorySize: 50,
      });

      store.dispatch(redo());

      const state = store.getState().undo;
      expect(state.past).toHaveLength(1);
      expect(state.past[0]).toEqual(entry);
      expect(state.future).toHaveLength(0);
    });

    it('should handle rapid undo/redo operations', () => {
      const entries = Array.from({ length: 5 }, (_, i) => createHistoryEntry(i));
      const store = createTestStore({
        past: entries,
        future: [],
        maxHistorySize: 50,
      });

      // Undo 3 times
      store.dispatch(undo());
      store.dispatch(undo());
      store.dispatch(undo());

      let state = store.getState().undo;
      expect(state.past).toHaveLength(2);
      expect(state.future).toHaveLength(3);

      // Redo 2 times
      store.dispatch(redo());
      store.dispatch(redo());

      state = store.getState().undo;
      expect(state.past).toHaveLength(4);
      expect(state.future).toHaveLength(1);
    });

    it('should handle adding entry after undo (clearing future)', () => {
      const entry1 = createHistoryEntry(1);
      const entry2 = createHistoryEntry(2);
      const entry3 = createHistoryEntry(3);
      const store = createTestStore({
        past: [entry1, entry2],
        future: [],
        maxHistorySize: 50,
      });

      // Undo to create future entries
      store.dispatch(undo());

      let state = store.getState().undo;
      expect(state.future).toHaveLength(1);

      // Note: In real usage, clearFuture would be called before adding to history
      // This test demonstrates the slice behavior in isolation
      store.dispatch(clearFuture());
      store.dispatch(addToHistory(entry3));

      state = store.getState().undo;
      expect(state.past).toHaveLength(2);
      expect(state.future).toHaveLength(0);
    });

    it('should handle setting max history size to 1', () => {
      const entries = Array.from({ length: 10 }, (_, i) => createHistoryEntry(i));
      const store = createTestStore({
        past: entries,
        future: [],
        maxHistorySize: 50,
      });

      store.dispatch(setMaxHistorySize(1));

      const state = store.getState().undo;
      expect(state.maxHistorySize).toBe(1);
      expect(state.past).toHaveLength(1);
      // Should keep only the most recent entry
      expect(state.past[0].action.type).toBe('TEST_ACTION_9');
    });

    it('should maintain history integrity after clearing and adding new entries', () => {
      const store = createTestStore();

      // Add entries
      store.dispatch(addToHistory(createHistoryEntry(1)));
      store.dispatch(addToHistory(createHistoryEntry(2)));

      // Clear history
      store.dispatch(clearHistory());

      let state = store.getState().undo;
      expect(state.past).toEqual([]);
      expect(state.future).toEqual([]);

      // Add new entries
      store.dispatch(addToHistory(createHistoryEntry(10)));
      store.dispatch(addToHistory(createHistoryEntry(11)));

      state = store.getState().undo;
      expect(state.past).toHaveLength(2);
      expect(state.past[0].action.type).toBe('TEST_ACTION_10');
      expect(state.past[1].action.type).toBe('TEST_ACTION_11');
    });

    it('should handle exactly 50 entries (at the limit)', () => {
      const store = createTestStore();

      // Add exactly 50 entries
      for (let i = 0; i < 50; i++) {
        store.dispatch(addToHistory(createHistoryEntry(i)));
      }

      const state = store.getState().undo;
      expect(state.past).toHaveLength(50);
      expect(state.past[0].action.type).toBe('TEST_ACTION_0');
      expect(state.past[49].action.type).toBe('TEST_ACTION_49');
    });

    it('should handle undo all the way to empty past', () => {
      const entries = Array.from({ length: 3 }, (_, i) => createHistoryEntry(i));
      const store = createTestStore({
        past: entries,
        future: [],
        maxHistorySize: 50,
      });

      // Undo all entries
      store.dispatch(undo());
      store.dispatch(undo());
      store.dispatch(undo());

      const state = store.getState().undo;
      expect(state.past).toHaveLength(0);
      expect(state.future).toHaveLength(3);

      // Additional undo should have no effect
      store.dispatch(undo());

      const state2 = store.getState().undo;
      expect(state2.past).toHaveLength(0);
      expect(state2.future).toHaveLength(3);
    });

    it('should handle redo all the way until future is empty', () => {
      const entries = Array.from({ length: 3 }, (_, i) => createHistoryEntry(i));
      const store = createTestStore({
        past: [],
        future: entries,
        maxHistorySize: 50,
      });

      // Redo all entries
      store.dispatch(redo());
      store.dispatch(redo());
      store.dispatch(redo());

      const state = store.getState().undo;
      expect(state.past).toHaveLength(3);
      expect(state.future).toHaveLength(0);

      // Additional redo should have no effect
      store.dispatch(redo());

      const state2 = store.getState().undo;
      expect(state2.past).toHaveLength(3);
      expect(state2.future).toHaveLength(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle a complete undo/redo workflow', () => {
      const store = createTestStore();

      // User performs 5 actions
      for (let i = 1; i <= 5; i++) {
        store.dispatch(addToHistory(createHistoryEntry(i)));
      }

      let fullState = store.getState() as RootState;
      expect(selectUndoCount(fullState)).toBe(5);
      expect(selectCanUndo(fullState)).toBe(true);
      expect(selectCanRedo(fullState)).toBe(false);

      // User undoes 2 actions
      store.dispatch(undo());
      store.dispatch(undo());

      fullState = store.getState() as RootState;
      expect(selectUndoCount(fullState)).toBe(3);
      expect(selectRedoCount(fullState)).toBe(2);
      expect(selectCanUndo(fullState)).toBe(true);
      expect(selectCanRedo(fullState)).toBe(true);

      // User redoes 1 action
      store.dispatch(redo());

      fullState = store.getState() as RootState;
      expect(selectUndoCount(fullState)).toBe(4);
      expect(selectRedoCount(fullState)).toBe(1);

      // User performs a new action (should clear future)
      store.dispatch(clearFuture());
      store.dispatch(addToHistory(createHistoryEntry(100)));

      fullState = store.getState() as RootState;
      expect(selectUndoCount(fullState)).toBe(5);
      expect(selectRedoCount(fullState)).toBe(0);
      expect(selectCanRedo(fullState)).toBe(false);
    });

    it('should maintain correct state through complex operations', () => {
      const store = createTestStore();

      // Add 3 entries
      store.dispatch(addToHistory(createHistoryEntry(1)));
      store.dispatch(addToHistory(createHistoryEntry(2)));
      store.dispatch(addToHistory(createHistoryEntry(3)));

      // Undo twice
      store.dispatch(undo());
      store.dispatch(undo());

      let state = store.getState().undo;
      expect(state.past).toHaveLength(1);
      expect(state.future).toHaveLength(2);

      // Clear history
      store.dispatch(clearHistory());

      state = store.getState().undo;
      expect(state.past).toHaveLength(0);
      expect(state.future).toHaveLength(0);

      // Add new entries and verify they work independently
      store.dispatch(addToHistory(createHistoryEntry(10)));
      store.dispatch(addToHistory(createHistoryEntry(11)));
      store.dispatch(undo());

      state = store.getState().undo;
      expect(state.past).toHaveLength(1);
      expect(state.future).toHaveLength(1);
      expect(state.past[0].action.type).toBe('TEST_ACTION_10');
      expect(state.future[0].action.type).toBe('TEST_ACTION_11');
    });
  });
});
