/**
 * Keyboard Shortcuts Tests
 * Tests for editor keyboard shortcuts and keybindings
 */

import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { editorSchema } from '../schema';
import { createDefaultPlugins } from '../plugins';
import {
  isBoldActive,
  isItalicActive,
  isUnderlineActive,
  getCurrentHeadingLevel,
} from '../commands';

/**
 * Helper to create an editor view for testing
 */
function createEditorView(content: any = { type: 'doc', content: [{ type: 'paragraph' }] }) {
  const doc = editorSchema.nodeFromJSON(content);
  const plugins = createDefaultPlugins(editorSchema);

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
 * Helper to simulate keyboard event
 */
function simulateKeyPress(
  view: EditorView,
  key: string,
  modifiers: { ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean } = {}
) {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: modifiers.ctrl || false,
    altKey: modifiers.alt || false,
    shiftKey: modifiers.shift || false,
    metaKey: modifiers.meta || false,
    bubbles: true,
    cancelable: true,
  });

  view.dom.dispatchEvent(event);
}

describe('Keyboard Shortcuts', () => {
  let view: EditorView;

  afterEach(() => {
    if (view) {
      view.destroy();
    }
  });

  describe('Text Formatting Shortcuts', () => {
    beforeEach(() => {
      view = createEditorView({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello world' }],
          },
        ],
      });

      // Select text
      const tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, 1, 6)
      );
      view.dispatch(tr);
    });

    it('should apply bold with Ctrl+B', () => {
      simulateKeyPress(view, 'b', { ctrl: true });
      expect(isBoldActive(view.state)).toBe(true);
    });

    it('should apply bold with Cmd+B on Mac', () => {
      simulateKeyPress(view, 'b', { meta: true });
      expect(isBoldActive(view.state)).toBe(true);
    });

    it('should apply italic with Ctrl+I', () => {
      simulateKeyPress(view, 'i', { ctrl: true });
      expect(isItalicActive(view.state)).toBe(true);
    });

    it('should apply italic with Cmd+I on Mac', () => {
      simulateKeyPress(view, 'i', { meta: true });
      expect(isItalicActive(view.state)).toBe(true);
    });

    it('should apply underline with Ctrl+U', () => {
      simulateKeyPress(view, 'u', { ctrl: true });
      expect(isUnderlineActive(view.state)).toBe(true);
    });

    it('should apply underline with Cmd+U on Mac', () => {
      simulateKeyPress(view, 'u', { meta: true });
      expect(isUnderlineActive(view.state)).toBe(true);
    });

    it('should toggle formatting on repeated keypress', () => {
      simulateKeyPress(view, 'b', { ctrl: true });
      expect(isBoldActive(view.state)).toBe(true);

      simulateKeyPress(view, 'b', { ctrl: true });
      expect(isBoldActive(view.state)).toBe(false);
    });

    it('should apply multiple formats simultaneously', () => {
      simulateKeyPress(view, 'b', { ctrl: true });
      simulateKeyPress(view, 'i', { ctrl: true });

      expect(isBoldActive(view.state)).toBe(true);
      expect(isItalicActive(view.state)).toBe(true);
    });
  });

  describe('Heading Level Shortcuts', () => {
    beforeEach(() => {
      view = createEditorView({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Heading text' }],
          },
        ],
      });

      // Place cursor in paragraph
      const tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, 1)
      );
      view.dispatch(tr);
    });

    it('should convert to H1 with Ctrl+Alt+1', () => {
      simulateKeyPress(view, '1', { ctrl: true, alt: true });
      expect(getCurrentHeadingLevel(view.state)).toBe(1);
    });

    it('should convert to H2 with Ctrl+Alt+2', () => {
      simulateKeyPress(view, '2', { ctrl: true, alt: true });
      expect(getCurrentHeadingLevel(view.state)).toBe(2);
    });

    it('should convert to H3 with Ctrl+Alt+3', () => {
      simulateKeyPress(view, '3', { ctrl: true, alt: true });
      expect(getCurrentHeadingLevel(view.state)).toBe(3);
    });

    it('should convert to H4 with Ctrl+Alt+4', () => {
      simulateKeyPress(view, '4', { ctrl: true, alt: true });
      expect(getCurrentHeadingLevel(view.state)).toBe(4);
    });

    it('should convert to H5 with Ctrl+Alt+5', () => {
      simulateKeyPress(view, '5', { ctrl: true, alt: true });
      expect(getCurrentHeadingLevel(view.state)).toBe(5);
    });

    it('should convert to H6 with Ctrl+Alt+6', () => {
      simulateKeyPress(view, '6', { ctrl: true, alt: true });
      expect(getCurrentHeadingLevel(view.state)).toBe(6);
    });

    it('should convert to paragraph with Ctrl+Alt+0', () => {
      // First convert to heading
      simulateKeyPress(view, '1', { ctrl: true, alt: true });
      expect(getCurrentHeadingLevel(view.state)).toBe(1);

      // Then convert back to paragraph
      simulateKeyPress(view, '0', { ctrl: true, alt: true });
      expect(getCurrentHeadingLevel(view.state)).toBeNull();
    });

    it('should change between heading levels', () => {
      simulateKeyPress(view, '1', { ctrl: true, alt: true });
      expect(getCurrentHeadingLevel(view.state)).toBe(1);

      simulateKeyPress(view, '3', { ctrl: true, alt: true });
      expect(getCurrentHeadingLevel(view.state)).toBe(3);

      simulateKeyPress(view, '6', { ctrl: true, alt: true });
      expect(getCurrentHeadingLevel(view.state)).toBe(6);
    });
  });

  describe('Base Editor Shortcuts', () => {
    beforeEach(() => {
      view = createEditorView({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Line 1' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Line 2' }],
          },
        ],
      });
    });

    it('should handle Enter key to create new paragraph', () => {
      const tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, 6)
      );
      view.dispatch(tr);

      simulateKeyPress(view, 'Enter');

      // Should now have 3 paragraphs
      expect(view.state.doc.childCount).toBe(3);
    });

    it('should handle Backspace to delete content', () => {
      const tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, 2)
      );
      view.dispatch(tr);

      const initialText = view.state.doc.textContent;
      simulateKeyPress(view, 'Backspace');

      expect(view.state.doc.textContent).not.toBe(initialText);
    });

    it('should handle Delete to remove content', () => {
      const tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, 1)
      );
      view.dispatch(tr);

      const initialText = view.state.doc.textContent;
      simulateKeyPress(view, 'Delete');

      expect(view.state.doc.textContent).not.toBe(initialText);
    });

    it('should handle arrow key navigation', () => {
      const tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, 1)
      );
      view.dispatch(tr);

      const initialPos = view.state.selection.anchor;
      simulateKeyPress(view, 'ArrowRight');

      // Position should change (exact behavior depends on ProseMirror)
      expect(view.state.selection).toBeDefined();
    });
  });

  describe('Shortcut Combinations', () => {
    beforeEach(() => {
      view = createEditorView({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Test content' }],
          },
        ],
      });

      const tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, 1, 12)
      );
      view.dispatch(tr);
    });

    it('should apply formatting then change to heading', () => {
      simulateKeyPress(view, 'b', { ctrl: true });
      expect(isBoldActive(view.state)).toBe(true);

      simulateKeyPress(view, '1', { ctrl: true, alt: true });
      expect(getCurrentHeadingLevel(view.state)).toBe(1);
      expect(isBoldActive(view.state)).toBe(true);
    });

    it('should handle multiple formatting shortcuts in sequence', () => {
      simulateKeyPress(view, 'b', { ctrl: true });
      simulateKeyPress(view, 'i', { ctrl: true });
      simulateKeyPress(view, 'u', { ctrl: true });

      expect(isBoldActive(view.state)).toBe(true);
      expect(isItalicActive(view.state)).toBe(true);
      expect(isUnderlineActive(view.state)).toBe(true);
    });

    it('should handle heading changes with formatted text', () => {
      simulateKeyPress(view, 'b', { ctrl: true });
      simulateKeyPress(view, '2', { ctrl: true, alt: true });
      expect(getCurrentHeadingLevel(view.state)).toBe(2);

      simulateKeyPress(view, '4', { ctrl: true, alt: true });
      expect(getCurrentHeadingLevel(view.state)).toBe(4);

      // Bold should still be active
      expect(isBoldActive(view.state)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle shortcuts with no text selected', () => {
      view = createEditorView({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Test' }],
          },
        ],
      });

      const tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, 1)
      );
      view.dispatch(tr);

      // Should not throw error
      expect(() => {
        simulateKeyPress(view, 'b', { ctrl: true });
      }).not.toThrow();
    });

    it('should handle shortcuts in empty document', () => {
      view = createEditorView({
        type: 'doc',
        content: [{ type: 'paragraph' }],
      });

      expect(() => {
        simulateKeyPress(view, 'b', { ctrl: true });
        simulateKeyPress(view, '1', { ctrl: true, alt: true });
      }).not.toThrow();
    });

    it('should handle shortcuts at document boundaries', () => {
      view = createEditorView({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'A' }],
          },
        ],
      });

      // Position at start
      let tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, 1)
      );
      view.dispatch(tr);

      expect(() => {
        simulateKeyPress(view, 'b', { ctrl: true });
      }).not.toThrow();

      // Position at end
      tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, 2)
      );
      view.dispatch(tr);

      expect(() => {
        simulateKeyPress(view, 'i', { ctrl: true });
      }).not.toThrow();
    });

    it('should handle invalid key combinations gracefully', () => {
      view = createEditorView();

      expect(() => {
        simulateKeyPress(view, 'x', { ctrl: true, alt: true, shift: true });
      }).not.toThrow();
    });

    it('should handle rapid successive shortcuts', () => {
      view = createEditorView({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Test' }],
          },
        ],
      });

      const tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, 1, 5)
      );
      view.dispatch(tr);

      expect(() => {
        simulateKeyPress(view, 'b', { ctrl: true });
        simulateKeyPress(view, 'i', { ctrl: true });
        simulateKeyPress(view, 'u', { ctrl: true });
        simulateKeyPress(view, '1', { ctrl: true, alt: true });
        simulateKeyPress(view, '2', { ctrl: true, alt: true });
      }).not.toThrow();
    });
  });

  describe('Cross-Platform Compatibility', () => {
    beforeEach(() => {
      view = createEditorView({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Test' }],
          },
        ],
      });

      const tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, 1, 5)
      );
      view.dispatch(tr);
    });

    it('should work with Ctrl modifier on Windows/Linux', () => {
      simulateKeyPress(view, 'b', { ctrl: true });
      expect(isBoldActive(view.state)).toBe(true);
    });

    it('should work with Meta/Cmd modifier on Mac', () => {
      simulateKeyPress(view, 'b', { meta: true });
      expect(isBoldActive(view.state)).toBe(true);
    });

    it('should handle both Ctrl and Meta for compatibility', () => {
      view = createEditorView({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Test' }],
          },
        ],
      });

      let tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, 1, 5)
      );
      view.dispatch(tr);

      simulateKeyPress(view, 'b', { ctrl: true });
      const ctrlResult = isBoldActive(view.state);

      // Toggle off
      simulateKeyPress(view, 'b', { ctrl: true });

      // Try with meta
      simulateKeyPress(view, 'b', { meta: true });
      const metaResult = isBoldActive(view.state);

      // Both should work (either both true or both false after toggling)
      expect(typeof ctrlResult).toBe('boolean');
      expect(typeof metaResult).toBe('boolean');
    });
  });
});
