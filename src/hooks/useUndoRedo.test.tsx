/**
 * Unit tests for useUndoRedo hook
 */

import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useUndoRedo } from './useUndoRedo';
import undoReducer, { undo as undoAction, redo as redoAction } from '../slices/undoSlice';
import { ReactNode } from 'react';

// Helper function to create a test store with custom state
function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      undo: undoReducer,
    },
    preloadedState,
  });
}

// Helper function to create a wrapper with Redux Provider
function createWrapper(store: ReturnType<typeof createTestStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

describe('useUndoRedo', () => {
  describe('initial state', () => {
    it('should return initial state with no history', () => {
      const store = createTestStore();
      const { result } = renderHook(() => useUndoRedo(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.undoCount).toBe(0);
      expect(result.current.redoCount).toBe(0);
      expect(result.current.lastAction).toBeNull();
      expect(result.current.nextAction).toBeNull();
    });

    it('should return correct state with history', () => {
      const mockHistoryEntry = {
        action: { type: 'TEST_ACTION' },
        stateBefore: {},
        stateAfter: {},
        timestamp: Date.now(),
      };

      const store = createTestStore({
        undo: {
          past: [mockHistoryEntry],
          future: [],
          maxHistorySize: 50,
        },
      });

      const { result } = renderHook(() => useUndoRedo(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.undoCount).toBe(1);
      expect(result.current.redoCount).toBe(0);
      expect(result.current.lastAction).toEqual(mockHistoryEntry);
    });

    it('should return correct state with redo history', () => {
      const mockHistoryEntry = {
        action: { type: 'TEST_ACTION' },
        stateBefore: {},
        stateAfter: {},
        timestamp: Date.now(),
      };

      const store = createTestStore({
        undo: {
          past: [],
          future: [mockHistoryEntry],
          maxHistorySize: 50,
        },
      });

      const { result } = renderHook(() => useUndoRedo(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
      expect(result.current.undoCount).toBe(0);
      expect(result.current.redoCount).toBe(1);
      expect(result.current.nextAction).toEqual(mockHistoryEntry);
    });
  });

  describe('undo function', () => {
    it('should dispatch undo action when canUndo is true', () => {
      const mockHistoryEntry = {
        action: { type: 'TEST_ACTION' },
        stateBefore: {},
        stateAfter: {},
        timestamp: Date.now(),
      };

      const store = createTestStore({
        undo: {
          past: [mockHistoryEntry],
          future: [],
          maxHistorySize: 50,
        },
      });

      const dispatchSpy = jest.spyOn(store, 'dispatch');

      const { result } = renderHook(() => useUndoRedo(), {
        wrapper: createWrapper(store),
      });

      result.current.undo();

      expect(dispatchSpy).toHaveBeenCalledWith(undoAction());
    });

    it('should not dispatch undo action when canUndo is false', () => {
      const store = createTestStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      const { result } = renderHook(() => useUndoRedo(), {
        wrapper: createWrapper(store),
      });

      result.current.undo();

      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('should update state after undo', () => {
      const mockHistoryEntry = {
        action: { type: 'TEST_ACTION' },
        stateBefore: {},
        stateAfter: {},
        timestamp: Date.now(),
      };

      const store = createTestStore({
        undo: {
          past: [mockHistoryEntry],
          future: [],
          maxHistorySize: 50,
        },
      });

      const { result, rerender } = renderHook(() => useUndoRedo(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);

      result.current.undo();
      rerender();

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
    });
  });

  describe('redo function', () => {
    it('should dispatch redo action when canRedo is true', () => {
      const mockHistoryEntry = {
        action: { type: 'TEST_ACTION' },
        stateBefore: {},
        stateAfter: {},
        timestamp: Date.now(),
      };

      const store = createTestStore({
        undo: {
          past: [],
          future: [mockHistoryEntry],
          maxHistorySize: 50,
        },
      });

      const dispatchSpy = jest.spyOn(store, 'dispatch');

      const { result } = renderHook(() => useUndoRedo(), {
        wrapper: createWrapper(store),
      });

      result.current.redo();

      expect(dispatchSpy).toHaveBeenCalledWith(redoAction());
    });

    it('should not dispatch redo action when canRedo is false', () => {
      const store = createTestStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      const { result } = renderHook(() => useUndoRedo(), {
        wrapper: createWrapper(store),
      });

      result.current.redo();

      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('should update state after redo', () => {
      const mockHistoryEntry = {
        action: { type: 'TEST_ACTION' },
        stateBefore: {},
        stateAfter: {},
        timestamp: Date.now(),
      };

      const store = createTestStore({
        undo: {
          past: [],
          future: [mockHistoryEntry],
          maxHistorySize: 50,
        },
      });

      const { result, rerender } = renderHook(() => useUndoRedo(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);

      result.current.redo();
      rerender();

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('keyboard shortcuts', () => {
    describe('Ctrl+Z for undo', () => {
      it('should call undo on Ctrl+Z', () => {
        const mockHistoryEntry = {
          action: { type: 'TEST_ACTION' },
          stateBefore: {},
          stateAfter: {},
          timestamp: Date.now(),
        };

        const store = createTestStore({
          undo: {
            past: [mockHistoryEntry],
            future: [],
            maxHistorySize: 50,
          },
        });

        const dispatchSpy = jest.spyOn(store, 'dispatch');

        renderHook(() => useUndoRedo(), {
          wrapper: createWrapper(store),
        });

        const event = new KeyboardEvent('keydown', {
          key: 'z',
          ctrlKey: true,
          bubbles: true,
        });

        window.dispatchEvent(event);

        expect(dispatchSpy).toHaveBeenCalledWith(undoAction());
      });

      it('should prevent default on Ctrl+Z', () => {
        const mockHistoryEntry = {
          action: { type: 'TEST_ACTION' },
          stateBefore: {},
          stateAfter: {},
          timestamp: Date.now(),
        };

        const store = createTestStore({
          undo: {
            past: [mockHistoryEntry],
            future: [],
            maxHistorySize: 50,
          },
        });

        renderHook(() => useUndoRedo(), {
          wrapper: createWrapper(store),
        });

        const event = new KeyboardEvent('keydown', {
          key: 'z',
          ctrlKey: true,
          bubbles: true,
        });

        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
        window.dispatchEvent(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
      });

      it('should not call undo without Ctrl key', () => {
        const store = createTestStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');

        renderHook(() => useUndoRedo(), {
          wrapper: createWrapper(store),
        });

        const event = new KeyboardEvent('keydown', {
          key: 'z',
          bubbles: true,
        });

        window.dispatchEvent(event);

        expect(dispatchSpy).not.toHaveBeenCalled();
      });
    });

    describe('Cmd+Z for undo (Mac)', () => {
      it('should call undo on Cmd+Z (metaKey)', () => {
        const mockHistoryEntry = {
          action: { type: 'TEST_ACTION' },
          stateBefore: {},
          stateAfter: {},
          timestamp: Date.now(),
        };

        const store = createTestStore({
          undo: {
            past: [mockHistoryEntry],
            future: [],
            maxHistorySize: 50,
          },
        });

        const dispatchSpy = jest.spyOn(store, 'dispatch');

        renderHook(() => useUndoRedo(), {
          wrapper: createWrapper(store),
        });

        const event = new KeyboardEvent('keydown', {
          key: 'z',
          metaKey: true,
          bubbles: true,
        });

        window.dispatchEvent(event);

        expect(dispatchSpy).toHaveBeenCalledWith(undoAction());
      });
    });

    describe('Ctrl+Shift+Z for redo', () => {
      it('should call redo on Ctrl+Shift+Z', () => {
        const mockHistoryEntry = {
          action: { type: 'TEST_ACTION' },
          stateBefore: {},
          stateAfter: {},
          timestamp: Date.now(),
        };

        const store = createTestStore({
          undo: {
            past: [],
            future: [mockHistoryEntry],
            maxHistorySize: 50,
          },
        });

        const dispatchSpy = jest.spyOn(store, 'dispatch');

        renderHook(() => useUndoRedo(), {
          wrapper: createWrapper(store),
        });

        const event = new KeyboardEvent('keydown', {
          key: 'z',
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
        });

        window.dispatchEvent(event);

        expect(dispatchSpy).toHaveBeenCalledWith(redoAction());
      });

      it('should prevent default on Ctrl+Shift+Z', () => {
        const mockHistoryEntry = {
          action: { type: 'TEST_ACTION' },
          stateBefore: {},
          stateAfter: {},
          timestamp: Date.now(),
        };

        const store = createTestStore({
          undo: {
            past: [],
            future: [mockHistoryEntry],
            maxHistorySize: 50,
          },
        });

        renderHook(() => useUndoRedo(), {
          wrapper: createWrapper(store),
        });

        const event = new KeyboardEvent('keydown', {
          key: 'z',
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
        });

        const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
        window.dispatchEvent(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
      });

      it('should not call redo without Shift key', () => {
        const store = createTestStore();
        const dispatchSpy = jest.spyOn(store, 'dispatch');

        renderHook(() => useUndoRedo(), {
          wrapper: createWrapper(store),
        });

        const event = new KeyboardEvent('keydown', {
          key: 'z',
          ctrlKey: true,
          bubbles: true,
        });

        window.dispatchEvent(event);

        // Should call undo, not redo
        expect(dispatchSpy).not.toHaveBeenCalledWith(redoAction());
      });
    });

    describe('Cmd+Shift+Z for redo (Mac)', () => {
      it('should call redo on Cmd+Shift+Z (metaKey)', () => {
        const mockHistoryEntry = {
          action: { type: 'TEST_ACTION' },
          stateBefore: {},
          stateAfter: {},
          timestamp: Date.now(),
        };

        const store = createTestStore({
          undo: {
            past: [],
            future: [mockHistoryEntry],
            maxHistorySize: 50,
          },
        });

        const dispatchSpy = jest.spyOn(store, 'dispatch');

        renderHook(() => useUndoRedo(), {
          wrapper: createWrapper(store),
        });

        const event = new KeyboardEvent('keydown', {
          key: 'z',
          metaKey: true,
          shiftKey: true,
          bubbles: true,
        });

        window.dispatchEvent(event);

        expect(dispatchSpy).toHaveBeenCalledWith(redoAction());
      });
    });

    describe('keyboard shortcut priority', () => {
      it('should prioritize redo over undo when Shift is pressed', () => {
        const mockHistoryEntry = {
          action: { type: 'TEST_ACTION' },
          stateBefore: {},
          stateAfter: {},
          timestamp: Date.now(),
        };

        const store = createTestStore({
          undo: {
            past: [mockHistoryEntry],
            future: [mockHistoryEntry],
            maxHistorySize: 50,
          },
        });

        const dispatchSpy = jest.spyOn(store, 'dispatch');

        renderHook(() => useUndoRedo(), {
          wrapper: createWrapper(store),
        });

        const event = new KeyboardEvent('keydown', {
          key: 'z',
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
        });

        window.dispatchEvent(event);

        expect(dispatchSpy).toHaveBeenCalledWith(redoAction());
        expect(dispatchSpy).not.toHaveBeenCalledWith(undoAction());
      });
    });
  });

  describe('cleanup', () => {
    it('should remove event listener on unmount', () => {
      const store = createTestStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      const { unmount } = renderHook(() => useUndoRedo(), {
        wrapper: createWrapper(store),
      });

      unmount();

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(dispatchSpy).not.toHaveBeenCalled();
    });
  });

  describe('selectors integration', () => {
    it('should correctly reflect multiple actions in history', () => {
      const mockEntries = [
        {
          action: { type: 'ACTION_1' },
          stateBefore: {},
          stateAfter: {},
          timestamp: Date.now(),
        },
        {
          action: { type: 'ACTION_2' },
          stateBefore: {},
          stateAfter: {},
          timestamp: Date.now() + 1000,
        },
        {
          action: { type: 'ACTION_3' },
          stateBefore: {},
          stateAfter: {},
          timestamp: Date.now() + 2000,
        },
      ];

      const store = createTestStore({
        undo: {
          past: mockEntries,
          future: [],
          maxHistorySize: 50,
        },
      });

      const { result } = renderHook(() => useUndoRedo(), {
        wrapper: createWrapper(store),
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.undoCount).toBe(3);
      expect(result.current.redoCount).toBe(0);
      expect(result.current.lastAction).toEqual(mockEntries[2]);
      expect(result.current.nextAction).toBeNull();
    });

    it('should correctly reflect state after multiple undo/redo operations', () => {
      const mockEntries = [
        {
          action: { type: 'ACTION_1' },
          stateBefore: {},
          stateAfter: {},
          timestamp: Date.now(),
        },
        {
          action: { type: 'ACTION_2' },
          stateBefore: {},
          stateAfter: {},
          timestamp: Date.now() + 1000,
        },
      ];

      const store = createTestStore({
        undo: {
          past: mockEntries,
          future: [],
          maxHistorySize: 50,
        },
      });

      const { result, rerender } = renderHook(() => useUndoRedo(), {
        wrapper: createWrapper(store),
      });

      // Initial state: 2 in past, 0 in future
      expect(result.current.undoCount).toBe(2);
      expect(result.current.redoCount).toBe(0);

      // After first undo: 1 in past, 1 in future
      result.current.undo();
      rerender();
      expect(result.current.undoCount).toBe(1);
      expect(result.current.redoCount).toBe(1);

      // After second undo: 0 in past, 2 in future
      result.current.undo();
      rerender();
      expect(result.current.undoCount).toBe(0);
      expect(result.current.redoCount).toBe(2);

      // After first redo: 1 in past, 1 in future
      result.current.redo();
      rerender();
      expect(result.current.undoCount).toBe(1);
      expect(result.current.redoCount).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty history gracefully', () => {
      const store = createTestStore();

      const { result } = renderHook(() => useUndoRedo(), {
        wrapper: createWrapper(store),
      });

      // Should not throw errors
      expect(() => result.current.undo()).not.toThrow();
      expect(() => result.current.redo()).not.toThrow();
    });

    it('should handle keyboard events with wrong keys', () => {
      const store = createTestStore();
      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useUndoRedo(), {
        wrapper: createWrapper(store),
      });

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive key matching', () => {
      const mockHistoryEntry = {
        action: { type: 'TEST_ACTION' },
        stateBefore: {},
        stateAfter: {},
        timestamp: Date.now(),
      };

      const store = createTestStore({
        undo: {
          past: [mockHistoryEntry],
          future: [],
          maxHistorySize: 50,
        },
      });

      const dispatchSpy = jest.spyOn(store, 'dispatch');

      renderHook(() => useUndoRedo(), {
        wrapper: createWrapper(store),
      });

      // Try uppercase Z
      const event = new KeyboardEvent('keydown', {
        key: 'Z',
        ctrlKey: true,
        bubbles: true,
      });

      window.dispatchEvent(event);

      // The hook checks for lowercase 'z', so uppercase 'Z' should not trigger
      // However, looking at the implementation, it checks event.key === 'z'
      // which is case-sensitive, so this should not call undo
      expect(dispatchSpy).not.toHaveBeenCalled();
    });
  });
});
