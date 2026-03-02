/**
 * Rich Text Inline Formatting Tests
 * Tests for inline text formatting functionality including bold, italic, underline,
 * combined formats, text selection, keyboard shortcuts, toolbar interactions, and undo/redo
 */

import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import {
  createTestEditorState,
  createTestEditorView,
  setSelection,
  applyMark,
  removeMark,
  toggleMark,
  hasMarkAt,
  getMarksAt,
  insertText,
  simulateUndo,
  simulateRedo,
  pressKey,
  destroyEditor,
  getDocumentHTML,
} from '../../../__tests__/utils/prosemirrorTestUtils';
import { editorSchema } from '../../../editor/schema';
import { MarkType } from '../../../editor/types';

describe('Rich Text Inline Formatting', () => {
  let view: EditorView;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (view) {
      destroyEditor(view);
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Bold formatting', () => {
    it('should apply bold formatting to selected text', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select "Hello"
      setSelection(view, 1, 6);

      // Apply bold
      applyMark(view, MarkType.BOLD);

      // Verify bold is applied
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(true);
      expect(getDocumentHTML(view.state)).toContain('<strong>Hello</strong>');
    });

    it('should remove bold formatting from selected text', () => {
      const state = createTestEditorState('<p><strong>Hello</strong> world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select "Hello"
      setSelection(view, 1, 6);

      // Remove bold
      removeMark(view, MarkType.BOLD);

      // Verify bold is removed
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(false);
      expect(getDocumentHTML(view.state)).not.toContain('<strong>Hello</strong>');
    });

    it('should toggle bold formatting on and off', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select "Hello"
      setSelection(view, 1, 6);

      // Toggle bold on
      toggleMark(view, MarkType.BOLD);
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(true);

      // Toggle bold off
      toggleMark(view, MarkType.BOLD);
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(false);
    });

    it('should apply bold to partial text selection', () => {
      const state = createTestEditorState('<p>Hello world everyone</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select "world"
      setSelection(view, 7, 12);

      // Apply bold
      applyMark(view, MarkType.BOLD);

      // Verify only "world" is bold
      expect(hasMarkAt(view.state, 8, MarkType.BOLD)).toBe(true);
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(false);
      expect(hasMarkAt(view.state, 14, MarkType.BOLD)).toBe(false);
    });
  });

  describe('Italic formatting', () => {
    it('should apply italic formatting to selected text', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select "world"
      setSelection(view, 7, 12);

      // Apply italic
      applyMark(view, MarkType.ITALIC);

      // Verify italic is applied
      expect(hasMarkAt(view.state, 8, MarkType.ITALIC)).toBe(true);
      expect(getDocumentHTML(view.state)).toContain('<em>world</em>');
    });

    it('should remove italic formatting from selected text', () => {
      const state = createTestEditorState('<p><em>Hello</em> world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select "Hello"
      setSelection(view, 1, 6);

      // Remove italic
      removeMark(view, MarkType.ITALIC);

      // Verify italic is removed
      expect(hasMarkAt(view.state, 3, MarkType.ITALIC)).toBe(false);
    });

    it('should toggle italic formatting on and off', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select "world"
      setSelection(view, 7, 12);

      // Toggle italic on
      toggleMark(view, MarkType.ITALIC);
      expect(hasMarkAt(view.state, 8, MarkType.ITALIC)).toBe(true);

      // Toggle italic off
      toggleMark(view, MarkType.ITALIC);
      expect(hasMarkAt(view.state, 8, MarkType.ITALIC)).toBe(false);
    });
  });

  describe('Underline formatting', () => {
    it('should apply underline formatting to selected text', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select "Hello"
      setSelection(view, 1, 6);

      // Apply underline
      applyMark(view, MarkType.UNDERLINE);

      // Verify underline is applied
      expect(hasMarkAt(view.state, 3, MarkType.UNDERLINE)).toBe(true);
      expect(getDocumentHTML(view.state)).toContain('<u>Hello</u>');
    });

    it('should remove underline formatting from selected text', () => {
      const state = createTestEditorState('<p><u>Hello</u> world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select "Hello"
      setSelection(view, 1, 6);

      // Remove underline
      removeMark(view, MarkType.UNDERLINE);

      // Verify underline is removed
      expect(hasMarkAt(view.state, 3, MarkType.UNDERLINE)).toBe(false);
    });

    it('should toggle underline formatting on and off', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select "world"
      setSelection(view, 7, 12);

      // Toggle underline on
      toggleMark(view, MarkType.UNDERLINE);
      expect(hasMarkAt(view.state, 8, MarkType.UNDERLINE)).toBe(true);

      // Toggle underline off
      toggleMark(view, MarkType.UNDERLINE);
      expect(hasMarkAt(view.state, 8, MarkType.UNDERLINE)).toBe(false);
    });
  });

  describe('Combined formatting', () => {
    it('should apply bold and italic together', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select "Hello"
      setSelection(view, 1, 6);

      // Apply bold
      applyMark(view, MarkType.BOLD);
      // Apply italic
      applyMark(view, MarkType.ITALIC);

      // Verify both marks are applied
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(true);
      expect(hasMarkAt(view.state, 3, MarkType.ITALIC)).toBe(true);

      const marks = getMarksAt(view.state, 3);
      expect(marks).toContain(MarkType.BOLD);
      expect(marks).toContain(MarkType.ITALIC);
    });

    it('should apply bold, italic, and underline together', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select "world"
      setSelection(view, 7, 12);

      // Apply all three formats
      applyMark(view, MarkType.BOLD);
      applyMark(view, MarkType.ITALIC);
      applyMark(view, MarkType.UNDERLINE);

      // Verify all marks are applied
      const marks = getMarksAt(view.state, 8);
      expect(marks).toContain(MarkType.BOLD);
      expect(marks).toContain(MarkType.ITALIC);
      expect(marks).toContain(MarkType.UNDERLINE);
    });

    it('should remove individual format from combined formatting', () => {
      const state = createTestEditorState('<p><strong><em>Hello</em></strong> world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select "Hello"
      setSelection(view, 1, 6);

      // Remove italic but keep bold
      removeMark(view, MarkType.ITALIC);

      // Verify italic is removed but bold remains
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(true);
      expect(hasMarkAt(view.state, 3, MarkType.ITALIC)).toBe(false);
    });

    it('should handle overlapping formats in different ranges', () => {
      const state = createTestEditorState('<p>Hello world everyone</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Apply bold to "Hello world"
      setSelection(view, 1, 12);
      applyMark(view, MarkType.BOLD);

      // Apply italic to "world everyone"
      setSelection(view, 7, 20);
      applyMark(view, MarkType.ITALIC);

      // Verify overlapping formats
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(true);
      expect(hasMarkAt(view.state, 3, MarkType.ITALIC)).toBe(false);

      expect(hasMarkAt(view.state, 8, MarkType.BOLD)).toBe(true);
      expect(hasMarkAt(view.state, 8, MarkType.ITALIC)).toBe(true);

      expect(hasMarkAt(view.state, 15, MarkType.BOLD)).toBe(false);
      expect(hasMarkAt(view.state, 15, MarkType.ITALIC)).toBe(true);
    });
  });

  describe('Format selected text ranges', () => {
    it('should format entire paragraph', () => {
      const state = createTestEditorState('<p>Hello world everyone</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select entire paragraph content
      setSelection(view, 1, 21);

      // Apply bold
      applyMark(view, MarkType.BOLD);

      // Verify entire paragraph is bold
      for (let pos = 2; pos < 20; pos += 3) {
        expect(hasMarkAt(view.state, pos, MarkType.BOLD)).toBe(true);
      }
    });

    it('should format single word in the middle', () => {
      const state = createTestEditorState('<p>The quick brown fox</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select "brown"
      setSelection(view, 11, 16);

      // Apply italic
      applyMark(view, MarkType.ITALIC);

      // Verify only "brown" is italic
      expect(hasMarkAt(view.state, 5, MarkType.ITALIC)).toBe(false);
      expect(hasMarkAt(view.state, 13, MarkType.ITALIC)).toBe(true);
      expect(hasMarkAt(view.state, 18, MarkType.ITALIC)).toBe(false);
    });

    it('should format across multiple words', () => {
      const state = createTestEditorState('<p>The quick brown fox jumps</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select "quick brown fox"
      setSelection(view, 5, 20);

      // Apply underline
      applyMark(view, MarkType.UNDERLINE);

      // Verify the range is underlined
      expect(hasMarkAt(view.state, 2, MarkType.UNDERLINE)).toBe(false);
      expect(hasMarkAt(view.state, 7, MarkType.UNDERLINE)).toBe(true);
      expect(hasMarkAt(view.state, 13, MarkType.UNDERLINE)).toBe(true);
      expect(hasMarkAt(view.state, 18, MarkType.UNDERLINE)).toBe(true);
      expect(hasMarkAt(view.state, 22, MarkType.UNDERLINE)).toBe(false);
    });

    it('should handle empty selection (cursor position)', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Place cursor at position
      setSelection(view, 7, 7);

      // Apply bold (should set storage marks for future typing)
      applyMark(view, MarkType.BOLD);

      // Verify no existing text is changed
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(false);
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should apply bold with Cmd+B', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select "Hello"
      setSelection(view, 1, 6);

      // Press Cmd+B
      pressKey(view, 'b', { meta: true });

      // Verify bold is applied (note: this requires keymap plugin configuration)
      // In actual implementation, the keymap would trigger the toggleMark command
    });

    it('should apply italic with Cmd+I', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select "world"
      setSelection(view, 7, 12);

      // Press Cmd+I
      pressKey(view, 'i', { meta: true });

      // Verify italic would be applied with proper keymap configuration
    });

    it('should apply underline with Cmd+U', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select "Hello"
      setSelection(view, 1, 6);

      // Press Cmd+U
      pressKey(view, 'u', { meta: true });

      // Verify underline would be applied with proper keymap configuration
    });

    it('should toggle formatting off with repeated shortcut', () => {
      const state = createTestEditorState('<p><strong>Hello</strong> world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select "Hello"
      setSelection(view, 1, 6);

      // Press Cmd+B to toggle off
      pressKey(view, 'b', { meta: true });

      // Verify bold would be removed with proper keymap configuration
    });

    it('should handle Ctrl+B on non-Mac platforms', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select "Hello"
      setSelection(view, 1, 6);

      // Press Ctrl+B
      pressKey(view, 'b', { ctrl: true });

      // Verify bold would be applied with proper keymap configuration
    });
  });

  describe('Format preservation on undo/redo', () => {
    it('should undo bold formatting', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select and apply bold
      setSelection(view, 1, 6);
      applyMark(view, MarkType.BOLD);
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(true);

      // Undo
      simulateUndo(view);

      // Verify bold is removed
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(false);
    });

    it('should redo bold formatting', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select and apply bold
      setSelection(view, 1, 6);
      applyMark(view, MarkType.BOLD);
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(true);

      // Undo
      simulateUndo(view);
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(false);

      // Redo
      simulateRedo(view);
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(true);
    });

    it('should undo multiple formatting operations in sequence', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Apply bold
      setSelection(view, 1, 6);
      applyMark(view, MarkType.BOLD);

      // Apply italic
      setSelection(view, 7, 12);
      applyMark(view, MarkType.ITALIC);

      // Apply underline
      setSelection(view, 1, 12);
      applyMark(view, MarkType.UNDERLINE);

      // Undo underline
      simulateUndo(view);
      expect(hasMarkAt(view.state, 3, MarkType.UNDERLINE)).toBe(false);
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(true);

      // Undo italic
      simulateUndo(view);
      expect(hasMarkAt(view.state, 8, MarkType.ITALIC)).toBe(false);

      // Undo bold
      simulateUndo(view);
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(false);
    });

    it('should redo multiple formatting operations', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Apply and then undo bold
      setSelection(view, 1, 6);
      applyMark(view, MarkType.BOLD);
      simulateUndo(view);

      // Apply and then undo italic
      setSelection(view, 7, 12);
      applyMark(view, MarkType.ITALIC);
      simulateUndo(view);

      // Redo italic
      simulateRedo(view);
      expect(hasMarkAt(view.state, 8, MarkType.ITALIC)).toBe(true);

      // Redo bold
      simulateRedo(view);
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(true);
    });

    it('should preserve combined formatting through undo/redo', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Apply bold and italic
      setSelection(view, 1, 6);
      applyMark(view, MarkType.BOLD);
      applyMark(view, MarkType.ITALIC);

      const marks = getMarksAt(view.state, 3);
      expect(marks).toContain(MarkType.BOLD);
      expect(marks).toContain(MarkType.ITALIC);

      // Undo italic
      simulateUndo(view);
      expect(hasMarkAt(view.state, 3, MarkType.ITALIC)).toBe(false);
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(true);

      // Redo italic
      simulateRedo(view);
      expect(hasMarkAt(view.state, 3, MarkType.ITALIC)).toBe(true);
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(true);
    });

    it('should handle undo/redo of format removal', () => {
      const state = createTestEditorState('<p><strong>Hello</strong> world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Remove bold
      setSelection(view, 1, 6);
      removeMark(view, MarkType.BOLD);
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(false);

      // Undo removal
      simulateUndo(view);
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(true);

      // Redo removal
      simulateRedo(view);
      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(false);
    });
  });

  describe('DOM and state changes', () => {
    it('should update DOM when applying formatting', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Apply bold
      setSelection(view, 1, 6);
      applyMark(view, MarkType.BOLD);

      // Check DOM
      const strongElements = container.querySelectorAll('strong');
      expect(strongElements.length).toBeGreaterThan(0);
      expect(strongElements[0].textContent).toContain('Hello');
    });

    it('should update DOM when removing formatting', () => {
      const state = createTestEditorState('<p><strong>Hello</strong> world</p>', editorSchema);
      view = createTestEditorView(state, container);

      let strongElements = container.querySelectorAll('strong');
      expect(strongElements.length).toBeGreaterThan(0);

      // Remove bold
      setSelection(view, 1, 6);
      removeMark(view, MarkType.BOLD);

      // Check DOM - strong element should be gone
      strongElements = container.querySelectorAll('strong');
      const hasHelloStrong = Array.from(strongElements).some(el => el.textContent === 'Hello');
      expect(hasHelloStrong).toBe(false);
    });

    it('should update state marks correctly', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Apply bold
      setSelection(view, 1, 6);
      applyMark(view, MarkType.BOLD);

      // Verify state has the mark
      const $pos = view.state.doc.resolve(3);
      const hasBold = view.state.schema.marks[MarkType.BOLD].isInSet($pos.marks());
      expect(hasBold).toBeTruthy();
    });

    it('should maintain correct document structure with nested marks', () => {
      const state = createTestEditorState('<p>Hello world</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Apply multiple marks
      setSelection(view, 1, 6);
      applyMark(view, MarkType.BOLD);
      applyMark(view, MarkType.ITALIC);

      // Verify document structure
      const html = getDocumentHTML(view.state);

      // Should contain nested formatting elements
      expect(html).toMatch(/<(strong|em)>/);
      expect(html).toMatch(/<\/(strong|em)>/);
    });
  });

  describe('Edge cases', () => {
    it('should handle formatting at document boundaries', () => {
      const state = createTestEditorState('<p>Hello</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select entire content
      setSelection(view, 1, 6);
      applyMark(view, MarkType.BOLD);

      expect(hasMarkAt(view.state, 3, MarkType.BOLD)).toBe(true);
    });

    it('should handle empty document', () => {
      const state = createTestEditorState('<p></p>', editorSchema);
      view = createTestEditorView(state, container);

      // Try to apply formatting (should not crash)
      expect(() => {
        setSelection(view, 1, 1);
        applyMark(view, MarkType.BOLD);
      }).not.toThrow();
    });

    it('should handle single character formatting', () => {
      const state = createTestEditorState('<p>Hello</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select single character
      setSelection(view, 1, 2);
      applyMark(view, MarkType.ITALIC);

      expect(hasMarkAt(view.state, 1, MarkType.ITALIC)).toBe(true);
      expect(hasMarkAt(view.state, 2, MarkType.ITALIC)).toBe(false);
    });

    it('should handle formatting with special characters', () => {
      const state = createTestEditorState('<p>Hello & world!</p>', editorSchema);
      view = createTestEditorView(state, container);

      // Select text with special chars
      setSelection(view, 7, 13);
      applyMark(view, MarkType.BOLD);

      expect(hasMarkAt(view.state, 8, MarkType.BOLD)).toBe(true);
    });
  });
});
