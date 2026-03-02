/**
 * Undo/Redo Stack Manager
 * Maintains separate undo/redo stacks per chapter
 */

import { TextBlock } from '../../types/textBlock';

export interface HistoryEntry {
  content: TextBlock[];
  timestamp: number;
}

export interface UndoRedoState {
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
}

export class UndoRedoManager {
  private undoStacks: Map<string, HistoryEntry[]>;
  private redoStacks: Map<string, HistoryEntry[]>;
  private maxHistorySize: number;

  constructor(maxHistorySize: number = 50) {
    this.undoStacks = new Map();
    this.redoStacks = new Map();
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Initialize stack for a chapter
   */
  initializeChapter(chapterId: string, initialContent: TextBlock[]): void {
    if (!this.undoStacks.has(chapterId)) {
      this.undoStacks.set(chapterId, []);
      this.redoStacks.set(chapterId, []);
    }
  }

  /**
   * Push a new state to the undo stack
   * Clears redo stack as new changes invalidate redo history
   */
  pushState(chapterId: string, content: TextBlock[]): void {
    let undoStack = this.undoStacks.get(chapterId);
    if (!undoStack) {
      undoStack = [];
      this.undoStacks.set(chapterId, undoStack);
    }

    // Add to undo stack
    undoStack.push({
      content: this.cloneContent(content),
      timestamp: Date.now(),
    });

    // Limit stack size
    if (undoStack.length > this.maxHistorySize) {
      undoStack.shift();
    }

    // Clear redo stack
    this.redoStacks.set(chapterId, []);
  }

  /**
   * Undo the last change
   */
  undo(chapterId: string, currentContent: TextBlock[]): TextBlock[] | null {
    const undoStack = this.undoStacks.get(chapterId);
    const redoStack = this.redoStacks.get(chapterId) || [];

    if (!undoStack || undoStack.length === 0) {
      return null;
    }

    // Save current state to redo stack
    redoStack.push({
      content: this.cloneContent(currentContent),
      timestamp: Date.now(),
    });
    this.redoStacks.set(chapterId, redoStack);

    // Pop from undo stack
    const previousState = undoStack.pop();
    return previousState ? this.cloneContent(previousState.content) : null;
  }

  /**
   * Redo the last undone change
   */
  redo(chapterId: string, currentContent: TextBlock[]): TextBlock[] | null {
    const undoStack = this.undoStacks.get(chapterId) || [];
    const redoStack = this.redoStacks.get(chapterId);

    if (!redoStack || redoStack.length === 0) {
      return null;
    }

    // Save current state to undo stack
    undoStack.push({
      content: this.cloneContent(currentContent),
      timestamp: Date.now(),
    });
    this.undoStacks.set(chapterId, undoStack);

    // Pop from redo stack
    const nextState = redoStack.pop();
    return nextState ? this.cloneContent(nextState.content) : null;
  }

  /**
   * Check if undo is available for a chapter
   */
  canUndo(chapterId: string): boolean {
    const stack = this.undoStacks.get(chapterId);
    return stack ? stack.length > 0 : false;
  }

  /**
   * Check if redo is available for a chapter
   */
  canRedo(chapterId: string): boolean {
    const stack = this.redoStacks.get(chapterId);
    return stack ? stack.length > 0 : false;
  }

  /**
   * Get undo/redo state for a chapter
   */
  getState(chapterId: string): UndoRedoState {
    const undoStack = this.undoStacks.get(chapterId);
    const redoStack = this.redoStacks.get(chapterId);

    return {
      canUndo: undoStack ? undoStack.length > 0 : false,
      canRedo: redoStack ? redoStack.length > 0 : false,
      undoCount: undoStack ? undoStack.length : 0,
      redoCount: redoStack ? redoStack.length : 0,
    };
  }

  /**
   * Clear history for a chapter
   */
  clearHistory(chapterId: string): void {
    this.undoStacks.set(chapterId, []);
    this.redoStacks.set(chapterId, []);
  }

  /**
   * Clear all history
   */
  clearAllHistory(): void {
    this.undoStacks.clear();
    this.redoStacks.clear();
  }

  /**
   * Remove a chapter's history (when unloading)
   */
  removeChapter(chapterId: string): void {
    this.undoStacks.delete(chapterId);
    this.redoStacks.delete(chapterId);
  }

  /**
   * Get history statistics
   */
  getStats() {
    return {
      chapters: Array.from(this.undoStacks.keys()),
      totalUndoStates: Array.from(this.undoStacks.values()).reduce(
        (sum, stack) => sum + stack.length,
        0
      ),
      totalRedoStates: Array.from(this.redoStacks.values()).reduce(
        (sum, stack) => sum + stack.length,
        0
      ),
    };
  }

  /**
   * Deep clone content array
   */
  private cloneContent(content: TextBlock[]): TextBlock[] {
    return JSON.parse(JSON.stringify(content));
  }
}
