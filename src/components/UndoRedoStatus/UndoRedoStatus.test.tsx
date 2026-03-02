/**
 * UndoRedoStatus Component Test Suite
 *
 * Comprehensive tests for undo/redo status display including:
 * - Button disabled states based on canUndo/canRedo
 * - Click handlers dispatch undo/redo actions
 * - Action counts display correctly
 * - Keyboard hints show correct modifier key (Cmd vs Ctrl)
 * - Accessibility attributes are correct
 */

import React from 'react';
import { screen } from '@testing-library/react';
import {
  renderWithProviders,
  userEvent,
} from '../../__tests__/testUtils';
import UndoRedoStatus from './UndoRedoStatus';
import { undo, redo } from '../../slices/undoSlice';

// Mock CSS imports
jest.mock('./UndoRedoStatus.css', () => ({}));

describe('UndoRedoStatus Component', () => {
  // Setup and teardown
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Rendering', () => {
    it('should render undo and redo buttons', () => {
      renderWithProviders(<UndoRedoStatus />);

      expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument();
    });

    it('should render keyboard hints container', () => {
      renderWithProviders(<UndoRedoStatus />);

      const keyboardHint = screen.getByText(/to undo/i).closest('.keyboard-hint');
      expect(keyboardHint).toBeInTheDocument();
      expect(keyboardHint).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Button Disabled States', () => {
    it('should disable undo button when canUndo is false', () => {
      renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [],
            future: [],
            maxHistorySize: 50,
          },
        },
      });

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).toBeDisabled();
    });

    it('should enable undo button when canUndo is true', () => {
      renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [
              {
                action: { type: 'test/action' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
            ],
            future: [],
            maxHistorySize: 50,
          },
        },
      });

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).not.toBeDisabled();
    });

    it('should disable redo button when canRedo is false', () => {
      renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [],
            future: [],
            maxHistorySize: 50,
          },
        },
      });

      const redoButton = screen.getByRole('button', { name: /redo/i });
      expect(redoButton).toBeDisabled();
    });

    it('should enable redo button when canRedo is true', () => {
      renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [],
            future: [
              {
                action: { type: 'test/action' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
            ],
            maxHistorySize: 50,
          },
        },
      });

      const redoButton = screen.getByRole('button', { name: /redo/i });
      expect(redoButton).not.toBeDisabled();
    });

    it('should enable both buttons when both past and future have actions', () => {
      renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [
              {
                action: { type: 'test/action1' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
            ],
            future: [
              {
                action: { type: 'test/action2' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
            ],
            maxHistorySize: 50,
          },
        },
      });

      const undoButton = screen.getByRole('button', { name: /undo/i });
      const redoButton = screen.getByRole('button', { name: /redo/i });

      expect(undoButton).not.toBeDisabled();
      expect(redoButton).not.toBeDisabled();
    });
  });

  describe('Click Handlers', () => {
    it('should dispatch undo action when undo button is clicked', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [
              {
                action: { type: 'test/action' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
            ],
            future: [],
            maxHistorySize: 50,
          },
        },
      });

      const undoButton = screen.getByRole('button', { name: /undo/i });
      await user.click(undoButton);

      // Verify undo action was dispatched and moved entry from past to future
      expect(store.getState().undo.past.length).toBe(0);
      expect(store.getState().undo.future.length).toBe(1);
    });

    it('should dispatch redo action when redo button is clicked', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [],
            future: [
              {
                action: { type: 'test/action' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
            ],
            maxHistorySize: 50,
          },
        },
      });

      const redoButton = screen.getByRole('button', { name: /redo/i });
      await user.click(redoButton);

      // Verify redo action was dispatched and moved entry from future to past
      expect(store.getState().undo.past.length).toBe(1);
      expect(store.getState().undo.future.length).toBe(0);
    });

    it('should not dispatch undo when button is disabled', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [],
            future: [],
            maxHistorySize: 50,
          },
        },
      });

      const undoButton = screen.getByRole('button', { name: /undo/i });

      // Attempt to click disabled button (should not do anything)
      await user.click(undoButton).catch(() => {
        // Click on disabled element may throw
      });

      // Verify state didn't change
      expect(store.getState().undo.past.length).toBe(0);
      expect(store.getState().undo.future.length).toBe(0);
    });

    it('should not dispatch redo when button is disabled', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [],
            future: [],
            maxHistorySize: 50,
          },
        },
      });

      const redoButton = screen.getByRole('button', { name: /redo/i });

      // Attempt to click disabled button (should not do anything)
      await user.click(redoButton).catch(() => {
        // Click on disabled element may throw
      });

      // Verify state didn't change
      expect(store.getState().undo.past.length).toBe(0);
      expect(store.getState().undo.future.length).toBe(0);
    });

    it('should handle multiple consecutive undo actions', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [
              {
                action: { type: 'test/action1' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
              {
                action: { type: 'test/action2' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
              {
                action: { type: 'test/action3' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
            ],
            future: [],
            maxHistorySize: 50,
          },
        },
      });

      const undoButton = screen.getByRole('button', { name: /undo/i });

      // First undo
      await user.click(undoButton);
      expect(store.getState().undo.past.length).toBe(2);
      expect(store.getState().undo.future.length).toBe(1);

      // Second undo
      await user.click(undoButton);
      expect(store.getState().undo.past.length).toBe(1);
      expect(store.getState().undo.future.length).toBe(2);

      // Third undo
      await user.click(undoButton);
      expect(store.getState().undo.past.length).toBe(0);
      expect(store.getState().undo.future.length).toBe(3);
    });

    it('should handle multiple consecutive redo actions', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [],
            future: [
              {
                action: { type: 'test/action1' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
              {
                action: { type: 'test/action2' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
              {
                action: { type: 'test/action3' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
            ],
            maxHistorySize: 50,
          },
        },
      });

      const redoButton = screen.getByRole('button', { name: /redo/i });

      // First redo
      await user.click(redoButton);
      expect(store.getState().undo.past.length).toBe(1);
      expect(store.getState().undo.future.length).toBe(2);

      // Second redo
      await user.click(redoButton);
      expect(store.getState().undo.past.length).toBe(2);
      expect(store.getState().undo.future.length).toBe(1);

      // Third redo
      await user.click(redoButton);
      expect(store.getState().undo.past.length).toBe(3);
      expect(store.getState().undo.future.length).toBe(0);
    });
  });

  describe('Action Count Display', () => {
    it('should display undo count when greater than 0', () => {
      renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [
              {
                action: { type: 'test/action1' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
              {
                action: { type: 'test/action2' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
              {
                action: { type: 'test/action3' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
            ],
            future: [],
            maxHistorySize: 50,
          },
        },
      });

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).toHaveTextContent('3');
    });

    it('should display redo count when greater than 0', () => {
      renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [],
            future: [
              {
                action: { type: 'test/action1' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
              {
                action: { type: 'test/action2' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
            ],
            maxHistorySize: 50,
          },
        },
      });

      const redoButton = screen.getByRole('button', { name: /redo/i });
      expect(redoButton).toHaveTextContent('2');
    });

    it('should not display count when undo count is 0', () => {
      renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [],
            future: [],
            maxHistorySize: 50,
          },
        },
      });

      const undoButton = screen.getByRole('button', { name: /undo/i });
      const actionCountSpan = undoButton.querySelector('.action-count');
      expect(actionCountSpan).not.toBeInTheDocument();
    });

    it('should not display count when redo count is 0', () => {
      renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [],
            future: [],
            maxHistorySize: 50,
          },
        },
      });

      const redoButton = screen.getByRole('button', { name: /redo/i });
      const actionCountSpan = redoButton.querySelector('.action-count');
      expect(actionCountSpan).not.toBeInTheDocument();
    });

    it('should update count display after undo action', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [
              {
                action: { type: 'test/action1' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
              {
                action: { type: 'test/action2' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
            ],
            future: [],
            maxHistorySize: 50,
          },
        },
      });

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).toHaveTextContent('2');

      await user.click(undoButton);

      // After undo, count should be 1
      expect(undoButton).toHaveTextContent('1');

      // Redo button should now show count of 1
      const redoButton = screen.getByRole('button', { name: /redo/i });
      expect(redoButton).toHaveTextContent('1');
    });

    it('should display large counts correctly', () => {
      const pastActions = Array.from({ length: 25 }, (_, i) => ({
        action: { type: `test/action${i}` },
        stateBefore: {},
        stateAfter: {},
        timestamp: Date.now(),
      }));

      renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: pastActions,
            future: [],
            maxHistorySize: 50,
          },
        },
      });

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).toHaveTextContent('25');
    });
  });

  describe('Keyboard Hints - Modifier Key Detection', () => {
    const originalNavigator = global.navigator;

    afterEach(() => {
      // Restore original navigator
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
    });

    it('should display Cmd modifier key on Mac platform', () => {
      // Mock Mac platform
      Object.defineProperty(global, 'navigator', {
        value: {
          platform: 'MacIntel',
        },
        writable: true,
        configurable: true,
      });

      renderWithProviders(<UndoRedoStatus />);

      expect(screen.getByText(/Cmd\+Z to undo/i)).toBeInTheDocument();
      expect(screen.getByText(/Cmd\+Shift\+Z to redo/i)).toBeInTheDocument();
    });

    it('should display Ctrl modifier key on Windows platform', () => {
      // Mock Windows platform
      Object.defineProperty(global, 'navigator', {
        value: {
          platform: 'Win32',
        },
        writable: true,
        configurable: true,
      });

      renderWithProviders(<UndoRedoStatus />);

      expect(screen.getByText(/Ctrl\+Z to undo/i)).toBeInTheDocument();
      expect(screen.getByText(/Ctrl\+Shift\+Z to redo/i)).toBeInTheDocument();
    });

    it('should display Ctrl modifier key on Linux platform', () => {
      // Mock Linux platform
      Object.defineProperty(global, 'navigator', {
        value: {
          platform: 'Linux x86_64',
        },
        writable: true,
        configurable: true,
      });

      renderWithProviders(<UndoRedoStatus />);

      expect(screen.getByText(/Ctrl\+Z to undo/i)).toBeInTheDocument();
      expect(screen.getByText(/Ctrl\+Shift\+Z to redo/i)).toBeInTheDocument();
    });

    it('should handle undefined navigator gracefully', () => {
      // Mock undefined navigator
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      renderWithProviders(<UndoRedoStatus />);

      // Should default to Ctrl when navigator is undefined
      expect(screen.getByText(/Ctrl\+Z to undo/i)).toBeInTheDocument();
      expect(screen.getByText(/Ctrl\+Shift\+Z to redo/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-label for undo button', () => {
      renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [
              {
                action: { type: 'test/action' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
              {
                action: { type: 'test/action2' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
            ],
            future: [],
            maxHistorySize: 50,
          },
        },
      });

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).toHaveAttribute('aria-label', 'Undo. 2 actions available');
    });

    it('should have correct aria-label for redo button', () => {
      renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [],
            future: [
              {
                action: { type: 'test/action' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
              {
                action: { type: 'test/action2' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
              {
                action: { type: 'test/action3' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
            ],
            maxHistorySize: 50,
          },
        },
      });

      const redoButton = screen.getByRole('button', { name: /redo/i });
      expect(redoButton).toHaveAttribute('aria-label', 'Redo. 3 actions available');
    });

    it('should have correct aria-label for action count span', () => {
      renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [
              {
                action: { type: 'test/action' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
            ],
            future: [
              {
                action: { type: 'test/action2' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
              {
                action: { type: 'test/action3' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
            ],
            maxHistorySize: 50,
          },
        },
      });

      const undoButton = screen.getByRole('button', { name: /undo/i });
      const undoCountSpan = undoButton.querySelector('.action-count');
      expect(undoCountSpan).toHaveAttribute('aria-label', '1 actions');

      const redoButton = screen.getByRole('button', { name: /redo/i });
      const redoCountSpan = redoButton.querySelector('.action-count');
      expect(redoCountSpan).toHaveAttribute('aria-label', '2 actions');
    });

    it('should have correct title attribute on undo button with Mac modifier', () => {
      // Mock Mac platform
      Object.defineProperty(global, 'navigator', {
        value: {
          platform: 'MacIntel',
        },
        writable: true,
        configurable: true,
      });

      renderWithProviders(<UndoRedoStatus />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).toHaveAttribute('title', 'Undo (Cmd+Z)');
    });

    it('should have correct title attribute on redo button with Mac modifier', () => {
      // Mock Mac platform
      Object.defineProperty(global, 'navigator', {
        value: {
          platform: 'MacIntel',
        },
        writable: true,
        configurable: true,
      });

      renderWithProviders(<UndoRedoStatus />);

      const redoButton = screen.getByRole('button', { name: /redo/i });
      expect(redoButton).toHaveAttribute('title', 'Redo (Cmd+Shift+Z)');
    });

    it('should have correct title attribute on undo button with Ctrl modifier', () => {
      // Mock Windows platform
      Object.defineProperty(global, 'navigator', {
        value: {
          platform: 'Win32',
        },
        writable: true,
        configurable: true,
      });

      renderWithProviders(<UndoRedoStatus />);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).toHaveAttribute('title', 'Undo (Ctrl+Z)');
    });

    it('should have correct title attribute on redo button with Ctrl modifier', () => {
      // Mock Windows platform
      Object.defineProperty(global, 'navigator', {
        value: {
          platform: 'Win32',
        },
        writable: true,
        configurable: true,
      });

      renderWithProviders(<UndoRedoStatus />);

      const redoButton = screen.getByRole('button', { name: /redo/i });
      expect(redoButton).toHaveAttribute('title', 'Redo (Ctrl+Shift+Z)');
    });

    it('should mark keyboard hint as aria-hidden', () => {
      renderWithProviders(<UndoRedoStatus />);

      const keyboardHint = screen.getByText(/to undo/i).closest('.keyboard-hint');
      expect(keyboardHint).toHaveAttribute('aria-hidden', 'true');
    });

    it('should update aria-label when action counts change', async () => {
      const user = userEvent.setup();
      renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [
              {
                action: { type: 'test/action' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
            ],
            future: [],
            maxHistorySize: 50,
          },
        },
      });

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).toHaveAttribute('aria-label', 'Undo. 1 actions available');

      await user.click(undoButton);

      // After undo, should have 0 actions available
      expect(undoButton).toHaveAttribute('aria-label', 'Undo. 0 actions available');

      const redoButton = screen.getByRole('button', { name: /redo/i });
      expect(redoButton).toHaveAttribute('aria-label', 'Redo. 1 actions available');
    });
  });

  describe('Edge Cases', () => {
    it('should handle state with only one action in past', () => {
      renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [
              {
                action: { type: 'test/action' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
            ],
            future: [],
            maxHistorySize: 50,
          },
        },
      });

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).not.toBeDisabled();
      expect(undoButton).toHaveTextContent('1');
    });

    it('should handle state with only one action in future', () => {
      renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [],
            future: [
              {
                action: { type: 'test/action' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
            ],
            maxHistorySize: 50,
          },
        },
      });

      const redoButton = screen.getByRole('button', { name: /redo/i });
      expect(redoButton).not.toBeDisabled();
      expect(redoButton).toHaveTextContent('1');
    });

    it('should handle rapid alternating undo/redo clicks', async () => {
      const user = userEvent.setup();
      const { store } = renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [
              {
                action: { type: 'test/action' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
            ],
            future: [],
            maxHistorySize: 50,
          },
        },
      });

      const undoButton = screen.getByRole('button', { name: /undo/i });
      const redoButton = screen.getByRole('button', { name: /redo/i });

      // Undo
      await user.click(undoButton);
      expect(store.getState().undo.past.length).toBe(0);
      expect(store.getState().undo.future.length).toBe(1);

      // Redo
      await user.click(redoButton);
      expect(store.getState().undo.past.length).toBe(1);
      expect(store.getState().undo.future.length).toBe(0);

      // Undo again
      await user.click(undoButton);
      expect(store.getState().undo.past.length).toBe(0);
      expect(store.getState().undo.future.length).toBe(1);

      // Redo again
      await user.click(redoButton);
      expect(store.getState().undo.past.length).toBe(1);
      expect(store.getState().undo.future.length).toBe(0);
    });

    it('should maintain component stability with re-renders', () => {
      const { rerender } = renderWithProviders(<UndoRedoStatus />, {
        preloadedState: {
          undo: {
            past: [
              {
                action: { type: 'test/action' },
                stateBefore: {},
                stateAfter: {},
                timestamp: Date.now(),
              },
            ],
            future: [],
            maxHistorySize: 50,
          },
        },
      });

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).not.toBeDisabled();
      expect(undoButton).toHaveTextContent('1');

      // Re-render
      rerender(<UndoRedoStatus />);

      const undoButtonAfterRerender = screen.getByRole('button', { name: /undo/i });
      expect(undoButtonAfterRerender).not.toBeDisabled();
      expect(undoButtonAfterRerender).toHaveTextContent('1');
    });
  });
});
