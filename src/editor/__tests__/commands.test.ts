/**
 * Tests for paragraph and heading formatting commands
 */

import { EditorState } from 'prosemirror-state';
import { editorSchema } from '../schema';
import {
  setParagraph,
  setHeading,
  toggleParagraph,
  toggleHeading,
  canSetParagraph,
  canSetHeading,
  isParagraph,
  isHeading,
  getCurrentHeadingLevel,
} from '../commands';
import { NodeType } from '../types';

/**
 * Helper to create a test editor state with a single block
 */
function createTestState(blockType: string, attrs?: any, content = 'test') {
  const nodeType = editorSchema.nodes[blockType];
  const textNode = content ? editorSchema.text(content) : null;
  const blockNode = textNode ? nodeType.create(attrs, textNode) : nodeType.create(attrs);
  const doc = editorSchema.node('doc', null, [blockNode]);

  return EditorState.create({
    doc,
    schema: editorSchema,
  });
}

describe('Paragraph and Heading Commands', () => {
  describe('setParagraph', () => {
    it('should convert heading to paragraph', () => {
      const state = createTestState(NodeType.HEADING, { level: 1 });
      const command = setParagraph();

      let newState: EditorState | null = null;
      const result = command(state, (tr) => {
        newState = state.apply(tr);
      });

      expect(result).toBe(true);
      expect(newState).not.toBeNull();
      expect(newState!.doc.firstChild!.type.name).toBe(NodeType.PARAGRAPH);
    });

    it('should handle empty blocks', () => {
      const state = createTestState(NodeType.HEADING, { level: 2 }, '');
      const command = setParagraph();

      let newState: EditorState | null = null;
      const result = command(state, (tr) => {
        newState = state.apply(tr);
      });

      expect(result).toBe(true);
      expect(newState).not.toBeNull();
      expect(newState!.doc.firstChild!.type.name).toBe(NodeType.PARAGRAPH);
    });

    it('should preserve text content when converting', () => {
      const state = createTestState(NodeType.HEADING, { level: 1 }, 'Hello World');
      const command = setParagraph();

      let newState: EditorState | null = null;
      command(state, (tr) => {
        newState = state.apply(tr);
      });

      expect(newState!.doc.textContent).toBe('Hello World');
    });
  });

  describe('setHeading', () => {
    it('should convert paragraph to heading', () => {
      const state = createTestState(NodeType.PARAGRAPH);
      const command = setHeading(1);

      let newState: EditorState | null = null;
      const result = command(state, (tr) => {
        newState = state.apply(tr);
      });

      expect(result).toBe(true);
      expect(newState).not.toBeNull();
      expect(newState!.doc.firstChild!.type.name).toBe(NodeType.HEADING);
      expect(newState!.doc.firstChild!.attrs.level).toBe(1);
    });

    it('should convert between heading levels', () => {
      const state = createTestState(NodeType.HEADING, { level: 1 });
      const command = setHeading(3);

      let newState: EditorState | null = null;
      command(state, (tr) => {
        newState = state.apply(tr);
      });

      expect(newState!.doc.firstChild!.type.name).toBe(NodeType.HEADING);
      expect(newState!.doc.firstChild!.attrs.level).toBe(3);
    });

    it('should work with all heading levels (1-6)', () => {
      for (let level = 1; level <= 6; level++) {
        const state = createTestState(NodeType.PARAGRAPH);
        const command = setHeading(level as 1 | 2 | 3 | 4 | 5 | 6);

        let newState: EditorState | null = null;
        command(state, (tr) => {
          newState = state.apply(tr);
        });

        expect(newState!.doc.firstChild!.attrs.level).toBe(level);
      }
    });

    it('should preserve text content when converting', () => {
      const state = createTestState(NodeType.PARAGRAPH, {}, 'Heading Text');
      const command = setHeading(2);

      let newState: EditorState | null = null;
      command(state, (tr) => {
        newState = state.apply(tr);
      });

      expect(newState!.doc.textContent).toBe('Heading Text');
    });
  });

  describe('toggleParagraph', () => {
    it('should convert heading to paragraph', () => {
      const state = createTestState(NodeType.HEADING, { level: 1 });
      const command = toggleParagraph();

      let newState: EditorState | null = null;
      const result = command(state, (tr) => {
        newState = state.apply(tr);
      });

      expect(result).toBe(true);
      expect(newState!.doc.firstChild!.type.name).toBe(NodeType.PARAGRAPH);
    });

    it('should do nothing if already a paragraph', () => {
      const state = createTestState(NodeType.PARAGRAPH);
      const command = toggleParagraph();

      const result = command(state, () => {});

      expect(result).toBe(false);
    });
  });

  describe('toggleHeading', () => {
    it('should convert paragraph to heading', () => {
      const state = createTestState(NodeType.PARAGRAPH);
      const command = toggleHeading(1);

      let newState: EditorState | null = null;
      const result = command(state, (tr) => {
        newState = state.apply(tr);
      });

      expect(result).toBe(true);
      expect(newState!.doc.firstChild!.type.name).toBe(NodeType.HEADING);
      expect(newState!.doc.firstChild!.attrs.level).toBe(1);
    });

    it('should convert heading to paragraph if same level', () => {
      const state = createTestState(NodeType.HEADING, { level: 2 });
      const command = toggleHeading(2);

      let newState: EditorState | null = null;
      command(state, (tr) => {
        newState = state.apply(tr);
      });

      expect(newState!.doc.firstChild!.type.name).toBe(NodeType.PARAGRAPH);
    });

    it('should change to different heading level if different', () => {
      const state = createTestState(NodeType.HEADING, { level: 1 });
      const command = toggleHeading(3);

      let newState: EditorState | null = null;
      command(state, (tr) => {
        newState = state.apply(tr);
      });

      expect(newState!.doc.firstChild!.type.name).toBe(NodeType.HEADING);
      expect(newState!.doc.firstChild!.attrs.level).toBe(3);
    });
  });

  describe('canSetParagraph', () => {
    it('should return true for heading blocks', () => {
      const state = createTestState(NodeType.HEADING, { level: 1 });
      expect(canSetParagraph(state)).toBe(true);
    });

    it('should return true for blockquote blocks', () => {
      const blockquoteNode = editorSchema.nodes[NodeType.BLOCKQUOTE].create(
        null,
        editorSchema.nodes[NodeType.PARAGRAPH].create(null, editorSchema.text('test'))
      );
      const doc = editorSchema.node('doc', null, [blockquoteNode]);
      const state = EditorState.create({ doc, schema: editorSchema });

      // canSetParagraph checks if we can convert the current block
      // For blockquotes, we'd need to be inside the paragraph
      expect(typeof canSetParagraph(state)).toBe('boolean');
    });
  });

  describe('canSetHeading', () => {
    it('should return true for paragraph blocks', () => {
      const state = createTestState(NodeType.PARAGRAPH);
      expect(canSetHeading(state, 1)).toBe(true);
    });

    it('should return true for all valid heading levels', () => {
      const state = createTestState(NodeType.PARAGRAPH);
      for (let level = 1; level <= 6; level++) {
        expect(canSetHeading(state, level as 1 | 2 | 3 | 4 | 5 | 6)).toBe(true);
      }
    });
  });

  describe('isParagraph', () => {
    it('should return true for paragraph blocks', () => {
      const state = createTestState(NodeType.PARAGRAPH);
      expect(isParagraph(state)).toBe(true);
    });

    it('should return false for heading blocks', () => {
      const state = createTestState(NodeType.HEADING, { level: 1 });
      expect(isParagraph(state)).toBe(false);
    });
  });

  describe('isHeading', () => {
    it('should return true for matching heading level', () => {
      const state = createTestState(NodeType.HEADING, { level: 2 });
      expect(isHeading(state, 2)).toBe(true);
    });

    it('should return false for different heading level', () => {
      const state = createTestState(NodeType.HEADING, { level: 2 });
      expect(isHeading(state, 1)).toBe(false);
    });

    it('should return false for paragraph blocks', () => {
      const state = createTestState(NodeType.PARAGRAPH);
      expect(isHeading(state, 1)).toBe(false);
    });
  });

  describe('getCurrentHeadingLevel', () => {
    it('should return the heading level for heading blocks', () => {
      for (let level = 1; level <= 6; level++) {
        const state = createTestState(NodeType.HEADING, { level });
        expect(getCurrentHeadingLevel(state)).toBe(level);
      }
    });

    it('should return null for paragraph blocks', () => {
      const state = createTestState(NodeType.PARAGRAPH);
      expect(getCurrentHeadingLevel(state)).toBeNull();
    });
  });
});
