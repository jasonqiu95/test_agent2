/**
 * Example: Using the Undo/Redo System
 *
 * This file demonstrates how to use the comprehensive undo/redo system
 * for managing book state with full history tracking.
 */

import React from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useUndoRedo } from '../hooks/useUndoRedo';
import {
  addChapter,
  deleteChapter,
  updateChapter,
  reorderChapters,
  selectCurrentBook,
} from '../slices/bookSlice';
import { v4 as uuidv4 } from 'uuid';
import { Chapter } from '../types/chapter';

/**
 * Example component demonstrating undo/redo functionality
 */
export function UndoRedoExample() {
  const dispatch = useAppDispatch();
  const currentBook = useAppSelector(selectCurrentBook);
  const { undo, redo, canUndo, canRedo, undoCount, redoCount } = useUndoRedo();

  // Example: Add a new chapter (undoable)
  const handleAddChapter = () => {
    const newChapter: Chapter = {
      id: uuidv4(),
      title: `Chapter ${(currentBook?.chapters.length || 0) + 1}`,
      content: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch(addChapter(newChapter));
    console.log('Added chapter:', newChapter.title);
  };

  // Example: Delete a chapter (undoable)
  const handleDeleteChapter = (chapterId: string) => {
    dispatch(deleteChapter(chapterId));
    console.log('Deleted chapter:', chapterId);
  };

  // Example: Update chapter title (undoable)
  const handleUpdateChapter = (chapterId: string, newTitle: string) => {
    dispatch(
      updateChapter({
        id: chapterId,
        updates: { title: newTitle },
      })
    );
    console.log('Updated chapter:', chapterId, 'to', newTitle);
  };

  // Example: Reorder chapters (undoable)
  const handleReorderChapters = (fromIndex: number, toIndex: number) => {
    dispatch(reorderChapters({ fromIndex, toIndex }));
    console.log(`Moved chapter from index ${fromIndex} to ${toIndex}`);
  };

  // Example: Undo last action
  const handleUndo = () => {
    if (canUndo) {
      undo();
      console.log(`Undone! ${undoCount - 1} actions remaining`);
    }
  };

  // Example: Redo next action
  const handleRedo = () => {
    if (canRedo) {
      redo();
      console.log(`Redone! ${redoCount - 1} actions available`);
    }
  };

  return (
    <div className="undo-redo-example">
      <h2>Undo/Redo System Example</h2>

      {/* Undo/Redo Controls */}
      <div className="controls">
        <button onClick={handleUndo} disabled={!canUndo}>
          Undo ({undoCount})
        </button>
        <button onClick={handleRedo} disabled={!canRedo}>
          Redo ({redoCount})
        </button>
      </div>

      {/* Chapter Management */}
      <div className="chapter-management">
        <h3>Chapter Management</h3>
        <button onClick={handleAddChapter}>Add Chapter</button>

        {currentBook?.chapters.map((chapter, index) => (
          <div key={chapter.id} className="chapter-item">
            <span>{chapter.title}</span>
            <button onClick={() => handleUpdateChapter(chapter.id, `Updated: ${chapter.title}`)}>
              Update Title
            </button>
            <button onClick={() => handleDeleteChapter(chapter.id)}>Delete</button>
            {index > 0 && (
              <button onClick={() => handleReorderChapters(index, index - 1)}>Move Up</button>
            )}
            {index < (currentBook?.chapters.length || 0) - 1 && (
              <button onClick={() => handleReorderChapters(index, index + 1)}>Move Down</button>
            )}
          </div>
        ))}
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="shortcuts-info">
        <h3>Keyboard Shortcuts</h3>
        <p>
          <kbd>Ctrl+Z</kbd> (or <kbd>Cmd+Z</kbd> on Mac) - Undo
        </p>
        <p>
          <kbd>Ctrl+Shift+Z</kbd> (or <kbd>Cmd+Shift+Z</kbd> on Mac) - Redo
        </p>
      </div>

      {/* State Display */}
      <div className="state-display">
        <h3>Current State</h3>
        <pre>{JSON.stringify(currentBook, null, 2)}</pre>
      </div>
    </div>
  );
}

/**
 * Example: Programmatic undo/redo without hooks
 */
export function programmaticUndoRedoExample() {
  // You can also dispatch undo/redo actions directly
  import { store } from '../store';
  import { undo, redo } from '../slices/undoSlice';

  // Undo
  store.dispatch(undo());

  // Redo
  store.dispatch(redo());

  // Check if undo/redo is available
  const state = store.getState();
  const canUndo = state.undo.past.length > 0;
  const canRedo = state.undo.future.length > 0;

  console.log('Can undo:', canUndo);
  console.log('Can redo:', canRedo);
}

/**
 * Example: Customizing history limit
 */
export function customizeHistoryLimitExample() {
  import { store } from '../store';
  import { setMaxHistorySize } from '../slices/undoSlice';

  // Set history limit to 100 actions
  store.dispatch(setMaxHistorySize(100));

  // Or set it to 25 for memory-constrained environments
  store.dispatch(setMaxHistorySize(25));
}

/**
 * Example: Clear history
 */
export function clearHistoryExample() {
  import { store } from '../store';
  import { clearHistory } from '../slices/undoSlice';

  // Clear all undo/redo history
  store.dispatch(clearHistory());

  console.log('History cleared');
}
