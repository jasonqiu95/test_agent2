/**
 * Tests for editor formatting commands
 */

import { EditorState, TextSelection } from 'prosemirror-state';
import { editorSchema } from '../schema';
import {
  toggleBold,
  toggleItalic,
  toggleUnderline,
  setHeading,
  setParagraph,
  isBoldActive,
  isItalicActive,
  isUnderlineActive,
  isHeadingActive,
  getCurrentHeadingLevel,
} from '../commands';

describe('Formatting Commands', () => {
  describe('toggleBold', () => {
    it('should toggle bold mark on text', () => {
      const doc = editorSchema.nodeFromJSON({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello world' }],
          },
        ],
      });

      let state = EditorState.create({
        doc,
        schema: editorSchema,
      });

      // Select "Hello" (positions 1-6)
      const selection = TextSelection.create(state.doc, 1, 6);
      state = state.apply(state.tr.setSelection(selection));

      // Apply bold
      const result = toggleBold(state, (tr) => {
        state = state.apply(tr);
      });

      expect(result).toBe(true);
      expect(isBoldActive(state)).toBe(true);
    });
  });

  describe('toggleItalic', () => {
    it('should toggle italic mark on text', () => {
      const doc = editorSchema.nodeFromJSON({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello world' }],
          },
        ],
      });

      let state = EditorState.create({
        doc,
        schema: editorSchema,
      });

      const selection = TextSelection.create(state.doc, 1, 6);
      state = state.apply(state.tr.setSelection(selection));

      const result = toggleItalic(state, (tr) => {
        state = state.apply(tr);
      });

      expect(result).toBe(true);
      expect(isItalicActive(state)).toBe(true);
    });
  });

  describe('toggleUnderline', () => {
    it('should toggle underline mark on text', () => {
      const doc = editorSchema.nodeFromJSON({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello world' }],
          },
        ],
      });

      let state = EditorState.create({
        doc,
        schema: editorSchema,
      });

      const selection = TextSelection.create(state.doc, 1, 6);
      state = state.apply(state.tr.setSelection(selection));

      const result = toggleUnderline(state, (tr) => {
        state = state.apply(tr);
      });

      expect(result).toBe(true);
      expect(isUnderlineActive(state)).toBe(true);
    });
  });

  describe('setHeading', () => {
    it('should convert paragraph to heading', () => {
      const doc = editorSchema.nodeFromJSON({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello world' }],
          },
        ],
      });

      let state = EditorState.create({
        doc,
        schema: editorSchema,
      });

      const selection = TextSelection.create(state.doc, 1);
      state = state.apply(state.tr.setSelection(selection));

      const result = setHeading(2)(state, (tr) => {
        state = state.apply(tr);
      });

      expect(result).toBe(true);
      expect(isHeadingActive(state, 2)).toBe(true);
      expect(getCurrentHeadingLevel(state)).toBe(2);
    });

    it('should work with different heading levels', () => {
      const doc = editorSchema.nodeFromJSON({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello world' }],
          },
        ],
      });

      for (let level = 1; level <= 6; level++) {
        let state = EditorState.create({
          doc,
          schema: editorSchema,
        });

        const selection = TextSelection.create(state.doc, 1);
        state = state.apply(state.tr.setSelection(selection));

        const result = setHeading(level as 1 | 2 | 3 | 4 | 5 | 6)(state, (tr) => {
          state = state.apply(tr);
        });

        expect(result).toBe(true);
        expect(getCurrentHeadingLevel(state)).toBe(level);
      }
    });
  });

  describe('setParagraph', () => {
    it('should convert heading to paragraph', () => {
      const doc = editorSchema.nodeFromJSON({
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2 },
            content: [{ type: 'text', text: 'Hello world' }],
          },
        ],
      });

      let state = EditorState.create({
        doc,
        schema: editorSchema,
      });

      const selection = TextSelection.create(state.doc, 1);
      state = state.apply(state.tr.setSelection(selection));

      expect(getCurrentHeadingLevel(state)).toBe(2);

      const result = setParagraph(state, (tr) => {
        state = state.apply(tr);
      });

      expect(result).toBe(true);
      expect(getCurrentHeadingLevel(state)).toBe(null);
    });
  });

  describe('Mark detection', () => {
    it('should detect bold marks correctly', () => {
      const doc = editorSchema.nodeFromJSON({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Hello ', marks: [{ type: 'bold' }] },
              { type: 'text', text: 'world' },
            ],
          },
        ],
      });

      // Selection within bold text
      let state = EditorState.create({
        doc,
        schema: editorSchema,
      });
      let selection = TextSelection.create(state.doc, 1, 4);
      state = state.apply(state.tr.setSelection(selection));
      expect(isBoldActive(state)).toBe(true);

      // Selection in non-bold text
      selection = TextSelection.create(state.doc, 7, 10);
      state = state.apply(state.tr.setSelection(selection));
      expect(isBoldActive(state)).toBe(false);
    });

    it('should detect italic marks correctly', () => {
      const doc = editorSchema.nodeFromJSON({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Hello ', marks: [{ type: 'italic' }] },
              { type: 'text', text: 'world' },
            ],
          },
        ],
      });

      let state = EditorState.create({
        doc,
        schema: editorSchema,
      });
      let selection = TextSelection.create(state.doc, 1, 4);
      state = state.apply(state.tr.setSelection(selection));
      expect(isItalicActive(state)).toBe(true);

      selection = TextSelection.create(state.doc, 7, 10);
      state = state.apply(state.tr.setSelection(selection));
      expect(isItalicActive(state)).toBe(false);
    });

    it('should detect underline marks correctly', () => {
      const doc = editorSchema.nodeFromJSON({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Hello ', marks: [{ type: 'underline' }] },
              { type: 'text', text: 'world' },
            ],
          },
        ],
      });

      let state = EditorState.create({
        doc,
        schema: editorSchema,
      });
      let selection = TextSelection.create(state.doc, 1, 4);
      state = state.apply(state.tr.setSelection(selection));
      expect(isUnderlineActive(state)).toBe(true);

      selection = TextSelection.create(state.doc, 7, 10);
      state = state.apply(state.tr.setSelection(selection));
      expect(isUnderlineActive(state)).toBe(false);
    });
  });
});
