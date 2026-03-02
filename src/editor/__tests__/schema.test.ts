/**
 * Tests for editor schema
 */

import { editorSchema, NodeType, MarkType } from '../schema';

describe('Editor Schema', () => {
  describe('Node Types', () => {
    test('schema should have all required node types', () => {
      expect(editorSchema.nodes[NodeType.DOC]).toBeDefined();
      expect(editorSchema.nodes[NodeType.PARAGRAPH]).toBeDefined();
      expect(editorSchema.nodes[NodeType.HEADING]).toBeDefined();
      expect(editorSchema.nodes[NodeType.BLOCKQUOTE]).toBeDefined();
      expect(editorSchema.nodes[NodeType.ORDERED_LIST]).toBeDefined();
      expect(editorSchema.nodes[NodeType.BULLET_LIST]).toBeDefined();
      expect(editorSchema.nodes[NodeType.LIST_ITEM]).toBeDefined();
      expect(editorSchema.nodes[NodeType.SCENE_BREAK]).toBeDefined();
      expect(editorSchema.nodes[NodeType.TEXT]).toBeDefined();
    });

    test('should create a paragraph node', () => {
      const paragraph = editorSchema.nodes[NodeType.PARAGRAPH].create();
      expect(paragraph.type.name).toBe(NodeType.PARAGRAPH);
    });

    test('should create a heading with level', () => {
      const heading = editorSchema.nodes[NodeType.HEADING].create({ level: 2 });
      expect(heading.type.name).toBe(NodeType.HEADING);
      expect(heading.attrs.level).toBe(2);
    });

    test('should create a scene break with symbol', () => {
      const sceneBreak = editorSchema.nodes[NodeType.SCENE_BREAK].create({
        symbol: '***',
      });
      expect(sceneBreak.type.name).toBe(NodeType.SCENE_BREAK);
      expect(sceneBreak.attrs.symbol).toBe('***');
    });
  });

  describe('Mark Types', () => {
    test('schema should have all required mark types', () => {
      expect(editorSchema.marks[MarkType.BOLD]).toBeDefined();
      expect(editorSchema.marks[MarkType.ITALIC]).toBeDefined();
      expect(editorSchema.marks[MarkType.UNDERLINE]).toBeDefined();
      expect(editorSchema.marks[MarkType.STRIKETHROUGH]).toBeDefined();
      expect(editorSchema.marks[MarkType.SUBSCRIPT]).toBeDefined();
      expect(editorSchema.marks[MarkType.SUPERSCRIPT]).toBeDefined();
      expect(editorSchema.marks[MarkType.CODE]).toBeDefined();
      expect(editorSchema.marks[MarkType.LINK]).toBeDefined();
    });

    test('should create bold mark', () => {
      const bold = editorSchema.marks[MarkType.BOLD].create();
      expect(bold.type.name).toBe(MarkType.BOLD);
    });

    test('should create link mark with href', () => {
      const link = editorSchema.marks[MarkType.LINK].create({
        href: 'https://example.com',
      });
      expect(link.type.name).toBe(MarkType.LINK);
      expect(link.attrs.href).toBe('https://example.com');
    });
  });

  describe('Document Creation', () => {
    test('should create a valid document', () => {
      const paragraph = editorSchema.nodes[NodeType.PARAGRAPH].create();
      const doc = editorSchema.nodes[NodeType.DOC].create(null, [paragraph]);
      expect(doc.type.name).toBe(NodeType.DOC);
      expect(doc.childCount).toBe(1);
    });

    test('should create document with text', () => {
      const text = editorSchema.text('Hello, world!');
      const paragraph = editorSchema.nodes[NodeType.PARAGRAPH].create(null, [text]);
      const doc = editorSchema.nodes[NodeType.DOC].create(null, [paragraph]);

      expect(doc.textContent).toBe('Hello, world!');
    });

    test('should create document with formatted text', () => {
      const boldMark = editorSchema.marks[MarkType.BOLD].create();
      const text = editorSchema.text('Bold text').mark([boldMark]);
      const paragraph = editorSchema.nodes[NodeType.PARAGRAPH].create(null, [text]);

      expect(paragraph.textContent).toBe('Bold text');
      expect(text.marks[0].type.name).toBe(MarkType.BOLD);
    });
  });
});
