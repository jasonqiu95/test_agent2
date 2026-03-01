/**
 * UndoRedoStatus Component
 *
 * Displays the current undo/redo state with visual indicators
 * and buttons to perform undo/redo operations.
 */

import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  undo,
  redo,
  selectCanUndo,
  selectCanRedo,
  selectUndoCount,
  selectRedoCount,
} from '../../slices/undoSlice';
import './UndoRedoStatus.css';

const UndoRedoStatus: React.FC = () => {
  const dispatch = useAppDispatch();
  const canUndo = useAppSelector(selectCanUndo);
  const canRedo = useAppSelector(selectCanRedo);
  const undoCount = useAppSelector(selectUndoCount);
  const redoCount = useAppSelector(selectRedoCount);

  const handleUndo = () => {
    if (canUndo) {
      dispatch(undo());
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      dispatch(redo());
    }
  };

  // Detect if user is on Mac
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
  const modifierKey = isMac ? 'Cmd' : 'Ctrl';

  return (
    <div className="undo-redo-status">
      <div className="undo-redo-controls">
        <button
          className="undo-button"
          onClick={handleUndo}
          disabled={!canUndo}
          title={`Undo (${modifierKey}+Z)`}
          aria-label={`Undo. ${undoCount} actions available`}
        >
          <span className="button-icon">↶</span>
          <span className="button-text">Undo</span>
          {undoCount > 0 && (
            <span className="action-count" aria-label={`${undoCount} actions`}>
              {undoCount}
            </span>
          )}
        </button>

        <button
          className="redo-button"
          onClick={handleRedo}
          disabled={!canRedo}
          title={`Redo (${modifierKey}+Shift+Z)`}
          aria-label={`Redo. ${redoCount} actions available`}
        >
          <span className="button-icon">↷</span>
          <span className="button-text">Redo</span>
          {redoCount > 0 && (
            <span className="action-count" aria-label={`${redoCount} actions`}>
              {redoCount}
            </span>
          )}
        </button>
      </div>

      <div className="keyboard-hint" aria-hidden="true">
        <span>{modifierKey}+Z to undo</span>
        <span className="hint-separator">•</span>
        <span>{modifierKey}+Shift+Z to redo</span>
      </div>
    </div>
  );
};

export default UndoRedoStatus;
