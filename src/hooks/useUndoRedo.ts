/**
 * Undo/Redo Hook
 *
 * Hook for managing undo/redo operations with keyboard shortcuts.
 * Handles Ctrl+Z for undo and Ctrl+Shift+Z for redo (Cmd on Mac).
 */

import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  undo as undoAction,
  redo as redoAction,
  selectCanUndo,
  selectCanRedo,
  selectUndoCount,
  selectRedoCount,
  selectLastAction,
  selectNextAction,
} from '../slices/undoSlice';

export function useUndoRedo() {
  const dispatch = useAppDispatch();
  const canUndo = useAppSelector(selectCanUndo);
  const canRedo = useAppSelector(selectCanRedo);
  const undoCount = useAppSelector(selectUndoCount);
  const redoCount = useAppSelector(selectRedoCount);
  const lastAction = useAppSelector(selectLastAction);
  const nextAction = useAppSelector(selectNextAction);

  const undo = useCallback(() => {
    if (canUndo) {
      // Get the last action before dispatching undo
      const lastEntry = lastAction;
      if (lastEntry) {
        // Restore the state before the action
        // Note: We need to dispatch the inverse action
        dispatch(undoAction());
      }
    }
  }, [canUndo, lastAction, dispatch]);

  const redo = useCallback(() => {
    if (canRedo) {
      // Get the next action before dispatching redo
      const nextEntry = nextAction;
      if (nextEntry) {
        // Restore the state after the action
        dispatch(redoAction());
      }
    }
  }, [canRedo, nextAction, dispatch]);

  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl/Cmd key
      const isModifierKey = event.ctrlKey || event.metaKey;

      if (!isModifierKey) {
        return;
      }

      // Ctrl+Shift+Z or Cmd+Shift+Z for redo
      if (event.shiftKey && event.key === 'z') {
        event.preventDefault();
        redo();
      }
      // Ctrl+Z or Cmd+Z for undo
      else if (event.key === 'z') {
        event.preventDefault();
        undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    lastAction,
    nextAction,
  };
}
