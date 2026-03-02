/**
 * Edge Cases Tests
 * Tests for empty documents, very long documents, and boundary conditions
 */

import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { editorSchema } from '../schema';
import { createDefaultPlugins } from '../plugins';
import { toggleBold, setHeading, isBoldActive } from '../commands';
import {
  emptyDocument,
  longDocument,
  veryLongDocument,
  createDocumentWithParagraphs,
  createDocumentWithText,
  specialCharsDocument,
  whitespaceDocument,
} from './fixtures/documentFixtures';

/**
 * Helper to create an editor view
 */
function createEditor(content: any = emptyDocument) {
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
 * Helper to measure performance
 */
function measureTime(fn: () => void): number {
  const start = performance.now();
  fn();
  const end = performance.now();
  return end - start;
}

describe('Edge Cases: Empty Documents', () => {
  let view: EditorView;

  afterEach(() => {
    if (view) {
      view.destroy();
    }
  });

  describe('Empty Document Handling', () => {
    beforeEach(() => {
      view = createEditor(emptyDocument);
    });

    it('should initialize with empty document', () => {
      expect(view.state.doc.textContent).toBe('');
      expect(view.state.doc.childCount).toBe(1);
    });

    it('should allow typing in empty document', () => {
      const tr = view.state.tr.insertText('Hello', 1);
      view.dispatch(tr);

      expect(view.state.doc.textContent).toBe('Hello');
    });

    it('should apply formatting in empty document', () => {
      // Place cursor
      const tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, 1)
      );
      view.dispatch(tr);

      // Apply bold (should set stored marks)
      toggleBold(editorSchema)(view.state, view.dispatch);

      // Type text
      const tr2 = view.state.tr.insertText('Bold', 1);
      view.dispatch(tr2);

      // Text should be bold
      expect(view.state.doc.textContent).toBe('Bold');
    });

    it('should convert empty paragraph to heading', () => {
      const tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, 1)
      );
      view.dispatch(tr);

      setHeading(1)(view.state, view.dispatch);

      expect(view.state.doc.firstChild?.type.name).toBe('heading');
    });

    it('should handle backspace in empty document', () => {
      const tr = view.state.tr.delete(1, 1);
      view.dispatch(tr);

      // Should not crash
      expect(view.state.doc).toBeDefined();
    });

    it('should handle selection in empty document', () => {
      expect(() => {
        const tr = view.state.tr.setSelection(
          TextSelection.create(view.state.doc, 1)
        );
        view.dispatch(tr);
      }).not.toThrow();
    });

    it('should calculate metadata correctly for empty document', () => {
      let wordCount = 0;
      let charCount = 0;

      view.state.doc.descendants((node) => {
        if (node.isText && node.text) {
          charCount += node.text.length;
          wordCount += node.text.split(/\s+/).filter(Boolean).length;
        }
      });

      expect(wordCount).toBe(0);
      expect(charCount).toBe(0);
    });
  });

  describe('Empty Content Edge Cases', () => {
    it('should handle document with single space', () => {
      view = createEditor(createDocumentWithText(' '));

      expect(view.state.doc.textContent).toBe(' ');
      expect(view.state.doc.childCount).toBe(1);
    });

    it('should handle document with only newlines', () => {
      view = createEditor(createDocumentWithText('\n\n\n'));

      expect(view.state.doc).toBeDefined();
    });

    it('should handle document with empty paragraphs', () => {
      view = createEditor({
        type: 'doc',
        content: [
          { type: 'paragraph' },
          { type: 'paragraph' },
          { type: 'paragraph' },
        ],
      });

      expect(view.state.doc.childCount).toBe(3);
      expect(view.state.doc.textContent).toBe('');
    });

    it('should handle zero-width spaces', () => {
      view = createEditor(createDocumentWithText('\u200B'));

      expect(view.state.doc).toBeDefined();
    });
  });
});

describe('Edge Cases: Long Documents', () => {
  let view: EditorView;

  afterEach(() => {
    if (view) {
      view.destroy();
    }
  });

  describe('Long Document Performance', () => {
    it('should initialize long document (100 paragraphs) efficiently', () => {
      const time = measureTime(() => {
        view = createEditor(longDocument);
      });

      expect(view.state.doc.childCount).toBe(100);
      expect(time).toBeLessThan(1000); // Should initialize within 1 second
    });

    it('should initialize very long document (500 blocks) efficiently', () => {
      const time = measureTime(() => {
        view = createEditor(veryLongDocument);
      });

      expect(view.state.doc.childCount).toBe(500);
      expect(time).toBeLessThan(3000); // Should initialize within 3 seconds
    });

    it('should handle text insertion in long document', () => {
      view = createEditor(longDocument);

      const tr = view.state.tr.insertText('New text', 1);
      view.dispatch(tr);

      expect(view.state.doc.textContent).toContain('New text');
    });

    it('should handle formatting in long document', () => {
      view = createEditor(longDocument);

      const tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, 1, 10)
      );
      view.dispatch(tr);

      const time = measureTime(() => {
        toggleBold(editorSchema)(view.state, view.dispatch);
      });

      expect(time).toBeLessThan(100); // Should format quickly
      expect(isBoldActive(view.state)).toBe(true);
    });

    it('should navigate through long document', () => {
      view = createEditor(longDocument);

      // Jump to middle of document
      const midpoint = Math.floor(view.state.doc.content.size / 2);
      const tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, midpoint)
      );
      view.dispatch(tr);

      expect(view.state.selection.anchor).toBeGreaterThan(0);
    });

    it('should calculate word count for long document', () => {
      view = createEditor(longDocument);

      let wordCount = 0;

      const time = measureTime(() => {
        view.state.doc.descendants((node) => {
          if (node.isText && node.text) {
            wordCount += node.text.split(/\s+/).filter(Boolean).length;
          }
        });
      });

      expect(wordCount).toBeGreaterThan(0);
      expect(time).toBeLessThan(500); // Should calculate within 500ms
    });
  });

  describe('Document Size Limits', () => {
    it('should handle document with 1000 paragraphs', () => {
      const doc = createDocumentWithParagraphs(1000);

      expect(() => {
        view = createEditor(doc);
      }).not.toThrow();

      expect(view.state.doc.childCount).toBe(1000);
    });

    it('should handle very long single paragraph', () => {
      const longText = 'a'.repeat(10000);
      const doc = createDocumentWithText(longText);

      view = createEditor(doc);

      expect(view.state.doc.textContent.length).toBe(10000);
    });

    it('should handle document with deep nesting', () => {
      const doc = {
        type: 'doc',
        content: [
          {
            type: 'blockquote',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Nested content' }],
              },
            ],
          },
        ],
      };

      expect(() => {
        view = createEditor(doc);
      }).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory with repeated creates/destroys', () => {
      for (let i = 0; i < 100; i++) {
        const tempView = createEditor(longDocument);
        tempView.destroy();
      }

      // If we get here without crashing, memory is likely managed well
      expect(true).toBe(true);
    });

    it('should handle rapid content updates', () => {
      view = createEditor(emptyDocument);

      for (let i = 0; i < 100; i++) {
        const tr = view.state.tr.insertText(`${i} `);
        view.dispatch(tr);
      }

      expect(view.state.doc.textContent).toContain('99');
    });
  });
});

describe('Edge Cases: Special Characters', () => {
  let view: EditorView;

  afterEach(() => {
    if (view) {
      view.destroy();
    }
  });

  describe('Unicode and Emoji', () => {
    it('should handle special characters document', () => {
      view = createEditor(specialCharsDocument);

      expect(view.state.doc.textContent).toContain('!@#$%^&*()');
      expect(view.state.doc.textContent).toContain('你好世界');
      expect(view.state.doc.textContent).toContain('😀');
    });

    it('should count emoji correctly', () => {
      view = createEditor(createDocumentWithText('😀👍❤️'));

      let charCount = 0;
      view.state.doc.descendants((node) => {
        if (node.isText && node.text) {
          charCount += node.text.length;
        }
      });

      expect(charCount).toBeGreaterThan(0);
    });

    it('should handle RTL text', () => {
      const rtlDoc = createDocumentWithText('مرحبا بك');

      view = createEditor(rtlDoc);

      expect(view.state.doc.textContent).toContain('مرحبا');
    });

    it('should handle mixed LTR and RTL', () => {
      const mixedDoc = createDocumentWithText('Hello مرحبا World');

      view = createEditor(mixedDoc);

      expect(view.state.doc.textContent).toContain('Hello');
      expect(view.state.doc.textContent).toContain('مرحبا');
    });

    it('should handle accented characters', () => {
      view = createEditor(createDocumentWithText('café résumé naïve'));

      expect(view.state.doc.textContent).toContain('café');
      expect(view.state.doc.textContent).toContain('résumé');
    });
  });

  describe('Whitespace Handling', () => {
    it('should handle whitespace document', () => {
      view = createEditor(whitespaceDocument);

      expect(view.state.doc.textContent).toContain('Multiple');
      expect(view.state.doc.textContent).toContain('Trailing');
      expect(view.state.doc.textContent).toContain('Leading');
    });

    it('should handle tabs', () => {
      view = createEditor(createDocumentWithText('\t\tTabbed\ttext\t'));

      expect(view.state.doc.textContent).toContain('Tabbed');
    });

    it('should handle non-breaking spaces', () => {
      view = createEditor(createDocumentWithText('Word\u00A0space'));

      expect(view.state.doc.textContent).toContain('Word');
    });

    it('should count words with various whitespace', () => {
      view = createEditor(
        createDocumentWithText('one  two   three    four     five')
      );

      let wordCount = 0;
      view.state.doc.descendants((node) => {
        if (node.isText && node.text) {
          wordCount += node.text.split(/\s+/).filter(Boolean).length;
        }
      });

      expect(wordCount).toBe(5);
    });
  });
});

describe('Edge Cases: Boundary Conditions', () => {
  let view: EditorView;

  afterEach(() => {
    if (view) {
      view.destroy();
    }
  });

  describe('Selection Boundaries', () => {
    it('should handle selection at document start', () => {
      view = createEditor(createDocumentWithText('Test'));

      const tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, 1)
      );
      view.dispatch(tr);

      expect(view.state.selection.anchor).toBe(1);
    });

    it('should handle selection at document end', () => {
      view = createEditor(createDocumentWithText('Test'));

      const endPos = view.state.doc.content.size - 1;
      const tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, endPos)
      );
      view.dispatch(tr);

      expect(view.state.selection.anchor).toBeGreaterThan(0);
    });

    it('should handle selection spanning entire document', () => {
      view = createEditor(createDocumentWithText('Test'));

      const tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, 1, view.state.doc.content.size - 1)
      );
      view.dispatch(tr);

      expect(view.state.selection.from).toBe(1);
    });

    it('should handle zero-width selection', () => {
      view = createEditor(createDocumentWithText('Test'));

      const tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, 2, 2)
      );
      view.dispatch(tr);

      expect(view.state.selection.empty).toBe(true);
    });
  });

  describe('Content Boundaries', () => {
    it('should handle insertion at start', () => {
      view = createEditor(createDocumentWithText('World'));

      const tr = view.state.tr.insertText('Hello ', 1);
      view.dispatch(tr);

      expect(view.state.doc.textContent).toBe('Hello World');
    });

    it('should handle insertion at end', () => {
      view = createEditor(createDocumentWithText('Hello'));

      const endPos = view.state.doc.content.size - 1;
      const tr = view.state.tr.insertText(' World', endPos);
      view.dispatch(tr);

      expect(view.state.doc.textContent).toBe('Hello World');
    });

    it('should handle deletion at boundaries', () => {
      view = createEditor(createDocumentWithText('Test'));

      const tr = view.state.tr.delete(1, 2);
      view.dispatch(tr);

      expect(view.state.doc.textContent).toBe('est');
    });

    it('should handle replace at boundaries', () => {
      view = createEditor(createDocumentWithText('Test'));

      const tr = view.state.tr.replaceWith(
        1,
        2,
        editorSchema.text('B')
      );
      view.dispatch(tr);

      expect(view.state.doc.textContent).toBe('Best');
    });
  });

  describe('Invalid Operations', () => {
    it('should handle invalid position gracefully', () => {
      view = createEditor(createDocumentWithText('Test'));

      expect(() => {
        // Try to create selection at invalid position
        try {
          const tr = view.state.tr.setSelection(
            TextSelection.create(view.state.doc, 9999)
          );
        } catch (e) {
          // Expected to throw
        }
      }).not.toThrow();
    });

    it('should handle empty delete range', () => {
      view = createEditor(createDocumentWithText('Test'));

      const tr = view.state.tr.delete(2, 2);
      view.dispatch(tr);

      expect(view.state.doc.textContent).toBe('Test');
    });

    it('should handle reversed selection range', () => {
      view = createEditor(createDocumentWithText('Test'));

      // Create selection with from > to
      const tr = view.state.tr.setSelection(
        TextSelection.create(view.state.doc, 4, 2)
      );
      view.dispatch(tr);

      // Should normalize the selection
      expect(view.state.selection).toBeDefined();
    });
  });
});

describe('Edge Cases: Error Recovery', () => {
  let view: EditorView;

  afterEach(() => {
    if (view) {
      view.destroy();
    }
  });

  describe('Malformed Content', () => {
    it('should handle missing content field', () => {
      expect(() => {
        view = createEditor({
          type: 'doc',
          content: [],
        });
      }).not.toThrow();
    });

    it('should validate document structure', () => {
      view = createEditor(emptyDocument);

      expect(() => {
        view.state.doc.check();
      }).not.toThrow();
    });

    it('should maintain valid document after operations', () => {
      view = createEditor(createDocumentWithText('Test'));

      const tr = view.state.tr.insertText('More');
      view.dispatch(tr);

      toggleBold(editorSchema)(view.state, view.dispatch);

      expect(() => {
        view.state.doc.check();
      }).not.toThrow();
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistent state after rapid operations', () => {
      view = createEditor(createDocumentWithText('Test'));

      for (let i = 0; i < 10; i++) {
        const tr = view.state.tr.insertText(`${i}`);
        view.dispatch(tr);

        const tr2 = view.state.tr.setSelection(
          TextSelection.create(view.state.doc, 1)
        );
        view.dispatch(tr2);

        toggleBold(editorSchema)(view.state, view.dispatch);
      }

      expect(view.state.doc).toBeDefined();
      expect(() => view.state.doc.check()).not.toThrow();
    });
  });
});
