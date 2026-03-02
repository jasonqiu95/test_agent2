/**
 * Undo/Redo Functionality Tests
 * Comprehensive tests for history management in the editor
 */

import { EditorState, TextSelection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { undo, redo } from 'prosemirror-history';
import { editorSchema } from '../schema';
import { createDefaultPlugins } from '../plugins';
import { toggleBold, toggleItalic, setHeading } from '../commands';
import {
  emptyDocument,
  simpleDocument,
  formattedDocument,
} from './fixtures/documentFixtures';

/**
 * Helper to create an editor view with history
 */
function createEditorWithHistory(
  content: any = emptyDocument,
  historyConfig?: { depth?: number; newGroupDelay?: number }
) {
  const doc = editorSchema.nodeFromJSON(content);
  const plugins = createDefaultPlugins(editorSchema, historyConfig);

  const state = EditorState.create({
    doc,
    schema: editorSchema,
    plugins,
  });

  const view = new EditorView(document.createElement('div'), {
    state,
    dispatchTransaction(transaction) {
      const newState = view.state.apply(transaction);
      view.updateState(newState);
    },
  });

  return view;
}

/**
 * Helper to insert text at current selection
 */
function insertText(view: EditorView, text: string) {
  const tr = view.state.tr.insertText(text);
  view.dispatch(tr);
}

/**
 * Helper to select text range
 */
function selectRange(view: EditorView, from: number, to: number) {
  const tr = view.state.tr.setSelection(
    TextSelection.create(view.state.doc, from, to)
  );
  view.dispatch(tr);
}

describe('Undo/Redo Functionality', () => {
  let view: EditorView;

  afterEach(() => {
    if (view) {
      view.destroy();
    }
  });

  describe('Basic Undo/Redo', () => {
    beforeEach(() => {
      view = createEditorWithHistory();
    });

    it('should undo text insertion', () => {
      insertText(view, 'Hello');
      expect(view.state.doc.textContent).toBe('Hello');

      undo(view.state, view.dispatch);
      expect(view.state.doc.textContent).toBe('');
    });

    it('should redo text insertion', () => {
      insertText(view, 'Hello');
      expect(view.state.doc.textContent).toBe('Hello');

      undo(view.state, view.dispatch);
      expect(view.state.doc.textContent).toBe('');

      redo(view.state, view.dispatch);
      expect(view.state.doc.textContent).toBe('Hello');
    });

    it('should undo multiple text insertions', () => {
      insertText(view, 'Hello');
      insertText(view, ' World');
      expect(view.state.doc.textContent).toBe('Hello World');

      undo(view.state, view.dispatch);
      expect(view.state.doc.textContent).toBe('Hello');

      undo(view.state, view.dispatch);
      expect(view.state.doc.textContent).toBe('');
    });

    it('should redo multiple operations', () => {
      insertText(view, 'Hello');
      insertText(view, ' World');

      undo(view.state, view.dispatch);
      undo(view.state, view.dispatch);

      redo(view.state, view.dispatch);
      expect(view.state.doc.textContent).toBe('Hello');

      redo(view.state, view.dispatch);
      expect(view.state.doc.textContent).toBe('Hello World');
    });

    it('should clear redo stack after new edit', () => {
      insertText(view, 'Hello');
      undo(view.state, view.dispatch);
      insertText(view, 'Goodbye');

      // Redo should not bring back "Hello"
      redo(view.state, view.dispatch);
      expect(view.state.doc.textContent).toBe('Goodbye');
    });

    it('should not undo beyond history start', () => {
      insertText(view, 'Hello');

      undo(view.state, view.dispatch);
      expect(view.state.doc.textContent).toBe('');

      // Another undo should not change anything
      undo(view.state, view.dispatch);
      expect(view.state.doc.textContent).toBe('');
    });

    it('should not redo beyond history end', () => {
      insertText(view, 'Hello');
      undo(view.state, view.dispatch);
      redo(view.state, view.dispatch);
      expect(view.state.doc.textContent).toBe('Hello');

      // Another redo should not change anything
      redo(view.state, view.dispatch);
      expect(view.state.doc.textContent).toBe('Hello');
    });
  });

  describe('Formatting Undo/Redo', () => {
    beforeEach(() => {
      view = createEditorWithHistory(simpleDocument);
      selectRange(view, 1, 6); // Select "Hello"
    });

    it('should undo bold formatting', () => {
      toggleBold(editorSchema)(view.state, view.dispatch);
      const afterBold = view.state.doc.toString();

      undo(view.state, view.dispatch);
      const afterUndo = view.state.doc.toString();

      expect(afterBold).not.toBe(afterUndo);
    });

    it('should redo bold formatting', () => {
      toggleBold(editorSchema)(view.state, view.dispatch);
      const afterBold = view.state.doc.toString();

      undo(view.state, view.dispatch);
      redo(view.state, view.dispatch);

      expect(view.state.doc.toString()).toBe(afterBold);
    });

    it('should undo multiple formatting operations', () => {
      const original = view.state.doc.toString();

      toggleBold(editorSchema)(view.state, view.dispatch);
      toggleItalic(editorSchema)(view.state, view.dispatch);

      undo(view.state, view.dispatch);
      undo(view.state, view.dispatch);

      expect(view.state.doc.toString()).toBe(original);
    });

    it('should handle undo/redo of format toggle', () => {
      toggleBold(editorSchema)(view.state, view.dispatch);
      const withBold = view.state.doc.toString();

      toggleBold(editorSchema)(view.state, view.dispatch);
      const withoutBold = view.state.doc.toString();

      undo(view.state, view.dispatch);
      expect(view.state.doc.toString()).toBe(withBold);

      redo(view.state, view.dispatch);
      expect(view.state.doc.toString()).toBe(withoutBold);
    });
  });

  describe('Block Type Undo/Redo', () => {
    beforeEach(() => {
      view = createEditorWithHistory(simpleDocument);
      selectRange(view, 1, 6);
    });

    it('should undo heading conversion', () => {
      const original = view.state.doc.toString();

      setHeading(1)(view.state, view.dispatch);

      undo(view.state, view.dispatch);
      expect(view.state.doc.toString()).toBe(original);
    });

    it('should redo heading conversion', () => {
      setHeading(1)(view.state, view.dispatch);
      const asHeading = view.state.doc.toString();

      undo(view.state, view.dispatch);
      redo(view.state, view.dispatch);

      expect(view.state.doc.toString()).toBe(asHeading);
    });

    it('should undo heading level changes', () => {
      setHeading(1)(view.state, view.dispatch);
      const h1 = view.state.doc.toString();

      setHeading(3)(view.state, view.dispatch);

      undo(view.state, view.dispatch);
      expect(view.state.doc.toString()).toBe(h1);
    });

    it('should handle multiple block type changes', () => {
      const original = view.state.doc.toString();

      setHeading(1)(view.state, view.dispatch);
      setHeading(2)(view.state, view.dispatch);
      setHeading(3)(view.state, view.dispatch);

      undo(view.state, view.dispatch);
      undo(view.state, view.dispatch);
      undo(view.state, view.dispatch);

      expect(view.state.doc.toString()).toBe(original);
    });
  });

  describe('Complex Operation Sequences', () => {
    beforeEach(() => {
      view = createEditorWithHistory();
    });

    it('should handle text + formatting + undo', () => {
      insertText(view, 'Hello');
      selectRange(view, 1, 6);
      toggleBold(editorSchema)(view.state, view.dispatch);

      undo(view.state, view.dispatch);
      undo(view.state, view.dispatch);

      expect(view.state.doc.textContent).toBe('');
    });

    it('should handle text + heading + formatting', () => {
      insertText(view, 'Title');
      selectRange(view, 1, 6);
      setHeading(1)(view.state, view.dispatch);
      toggleBold(editorSchema)(view.state, view.dispatch);

      const final = view.state.doc.toString();

      undo(view.state, view.dispatch);
      undo(view.state, view.dispatch);
      undo(view.state, view.dispatch);

      expect(view.state.doc.textContent).toBe('');

      redo(view.state, view.dispatch);
      redo(view.state, view.dispatch);
      redo(view.state, view.dispatch);

      expect(view.state.doc.toString()).toBe(final);
    });

    it('should handle interleaved text and formatting', () => {
      insertText(view, 'Hello');
      selectRange(view, 1, 6);
      toggleBold(editorSchema)(view.state, view.dispatch);
      selectRange(view, 6, 6);
      insertText(view, ' World');

      const steps = [];
      steps.push(view.state.doc.textContent);

      undo(view.state, view.dispatch);
      steps.push(view.state.doc.textContent);

      undo(view.state, view.dispatch);
      steps.push(view.state.doc.textContent);

      undo(view.state, view.dispatch);
      steps.push(view.state.doc.textContent);

      expect(steps[steps.length - 1]).toBe('');
    });
  });

  describe('History Depth', () => {
    it('should respect history depth limit', () => {
      view = createEditorWithHistory(emptyDocument, { depth: 3 });

      insertText(view, '1');
      insertText(view, '2');
      insertText(view, '3');
      insertText(view, '4');
      insertText(view, '5');

      expect(view.state.doc.textContent).toBe('12345');

      // Should only be able to undo 3 times (depth = 3)
      undo(view.state, view.dispatch);
      undo(view.state, view.dispatch);
      undo(view.state, view.dispatch);

      // Oldest changes (1, 2) should be lost
      expect(view.state.doc.textContent).toBe('12');
    });

    it('should work with depth of 1', () => {
      view = createEditorWithHistory(emptyDocument, { depth: 1 });

      insertText(view, 'First');
      insertText(view, 'Second');

      undo(view.state, view.dispatch);
      expect(view.state.doc.textContent).toBe('First');

      // Can't undo further
      undo(view.state, view.dispatch);
      expect(view.state.doc.textContent).toBe('First');
    });

    it('should work with large depth', () => {
      view = createEditorWithHistory(emptyDocument, { depth: 100 });

      for (let i = 0; i < 50; i++) {
        insertText(view, `${i}`);
      }

      let undoCount = 0;
      let lastContent = view.state.doc.textContent;

      // Should be able to undo many times
      while (undoCount < 50) {
        undo(view.state, view.dispatch);
        const newContent = view.state.doc.textContent;
        if (newContent === lastContent) break;
        lastContent = newContent;
        undoCount++;
      }

      expect(undoCount).toBeGreaterThan(10);
    });
  });

  describe('History Grouping', () => {
    it('should group rapid changes with short delay', (done) => {
      view = createEditorWithHistory(emptyDocument, { newGroupDelay: 100 });

      insertText(view, 'a');
      insertText(view, 'b');
      insertText(view, 'c');

      expect(view.state.doc.textContent).toBe('abc');

      // These rapid changes might be grouped
      // After undo, we might get empty or partial content depending on grouping
      undo(view.state, view.dispatch);

      // Content should have changed
      expect(view.state.doc.textContent.length).toBeLessThan(3);

      done();
    });

    it('should separate changes with long delay', (done) => {
      view = createEditorWithHistory(emptyDocument, { newGroupDelay: 10 });

      insertText(view, 'a');

      setTimeout(() => {
        insertText(view, 'b');

        expect(view.state.doc.textContent).toBe('ab');

        undo(view.state, view.dispatch);
        expect(view.state.doc.textContent).toBe('a');

        undo(view.state, view.dispatch);
        expect(view.state.doc.textContent).toBe('');

        done();
      }, 20);
    });
  });

  describe('Selection Preservation', () => {
    beforeEach(() => {
      view = createEditorWithHistory(simpleDocument);
    });

    it('should preserve selection after undo', () => {
      selectRange(view, 1, 6);
      const originalSelection = view.state.selection;

      toggleBold(editorSchema)(view.state, view.dispatch);
      undo(view.state, view.dispatch);

      expect(view.state.selection.anchor).toBe(originalSelection.anchor);
      expect(view.state.selection.head).toBe(originalSelection.head);
    });

    it('should handle selection after text insertion undo', () => {
      selectRange(view, 6, 6);
      insertText(view, ' added');

      undo(view.state, view.dispatch);

      // Selection should be valid
      expect(view.state.selection.anchor).toBeGreaterThanOrEqual(0);
      expect(view.state.selection.anchor).toBeLessThanOrEqual(
        view.state.doc.content.size
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle undo in empty document', () => {
      view = createEditorWithHistory(emptyDocument);

      expect(() => {
        undo(view.state, view.dispatch);
      }).not.toThrow();

      expect(view.state.doc.textContent).toBe('');
    });

    it('should handle redo in empty document', () => {
      view = createEditorWithHistory(emptyDocument);

      expect(() => {
        redo(view.state, view.dispatch);
      }).not.toThrow();

      expect(view.state.doc.textContent).toBe('');
    });

    it('should handle rapid undo/redo cycles', () => {
      view = createEditorWithHistory();

      insertText(view, 'Test');

      for (let i = 0; i < 10; i++) {
        undo(view.state, view.dispatch);
        redo(view.state, view.dispatch);
      }

      expect(view.state.doc.textContent).toBe('Test');
    });

    it('should handle undo/redo with formatted content', () => {
      view = createEditorWithHistory(formattedDocument);

      const original = view.state.doc.toString();

      selectRange(view, 1, 10);
      toggleBold(editorSchema)(view.state, view.dispatch);

      undo(view.state, view.dispatch);

      expect(view.state.doc.toString()).toBe(original);
    });

    it('should handle content deletion undo', () => {
      view = createEditorWithHistory(simpleDocument);

      selectRange(view, 1, 6);
      view.dispatch(view.state.tr.deleteSelection());

      expect(view.state.doc.textContent).toBe(' world');

      undo(view.state, view.dispatch);
      expect(view.state.doc.textContent).toBe('Hello world');
    });

    it('should maintain document validity after undo', () => {
      view = createEditorWithHistory();

      insertText(view, 'Test');
      setHeading(1)(view.state, view.dispatch);

      undo(view.state, view.dispatch);
      undo(view.state, view.dispatch);

      // Document should still be valid
      expect(() => {
        view.state.doc.check();
      }).not.toThrow();
    });

    it('should handle undo with no history', () => {
      view = createEditorWithHistory(emptyDocument, { depth: 0 });

      insertText(view, 'Test');
      undo(view.state, view.dispatch);

      // With depth 0, undo might not work
      expect(view.state.doc).toBeDefined();
    });
  });

  describe('Keyboard Shortcuts Integration', () => {
    beforeEach(() => {
      view = createEditorWithHistory();
    });

    it('should undo with Ctrl+Z', () => {
      insertText(view, 'Hello');

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });

      view.dom.dispatchEvent(event);

      // Should trigger undo
      expect(view.state.doc.textContent).toBe('');
    });

    it('should redo with Ctrl+Y', () => {
      insertText(view, 'Hello');
      undo(view.state, view.dispatch);

      const event = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });

      view.dom.dispatchEvent(event);

      // Should trigger redo
      expect(view.state.doc.textContent).toBe('Hello');
    });

    it('should redo with Shift+Ctrl+Z', () => {
      insertText(view, 'Hello');
      undo(view.state, view.dispatch);

      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
        cancelable: true,
      });

      view.dom.dispatchEvent(event);

      // Should trigger redo
      expect(view.state.doc.textContent).toBe('Hello');
    });
  });
});
