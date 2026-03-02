/**
 * Tests for serialization utilities
 */

import {
  serializeToTextBlocks,
  deserializeFromTextBlocks,
  serializeToJSON,
  deserializeFromJSON,
  createEmptyDocument,
  isDocumentEmpty,
} from '../serialization';
import { editorSchema, NodeType, MarkType } from '../schema';
import { TextBlock } from '../../types/textBlock';

describe('Serialization Utilities', () => {
  describe('createEmptyDocument', () => {
    test('should create an empty document', () => {
      const doc = createEmptyDocument();
      expect(doc.type.name).toBe(NodeType.DOC);
      expect(isDocumentEmpty(doc)).toBe(true);
    });
  });

  describe('isDocumentEmpty', () => {
    test('should return true for empty document', () => {
      const doc = createEmptyDocument();
      expect(isDocumentEmpty(doc)).toBe(true);
    });

    test('should return false for document with content', () => {
      const text = editorSchema.text('Hello');
      const paragraph = editorSchema.nodes[NodeType.PARAGRAPH].create(null, [text]);
      const doc = editorSchema.nodes[NodeType.DOC].create(null, [paragraph]);
      expect(isDocumentEmpty(doc)).toBe(false);
    });
  });

  describe('serializeToJSON and deserializeFromJSON', () => {
    test('should serialize and deserialize document', () => {
      const text = editorSchema.text('Hello, world!');
      const paragraph = editorSchema.nodes[NodeType.PARAGRAPH].create(null, [text]);
      const doc = editorSchema.nodes[NodeType.DOC].create(null, [paragraph]);

      const json = serializeToJSON(doc);
      const restoredDoc = deserializeFromJSON(json);

      expect(restoredDoc.textContent).toBe(doc.textContent);
      expect(restoredDoc.type.name).toBe(NodeType.DOC);
    });

    test('should preserve heading levels', () => {
      const text = editorSchema.text('Chapter 1');
      const heading = editorSchema.nodes[NodeType.HEADING].create({ level: 1 }, [text]);
      const doc = editorSchema.nodes[NodeType.DOC].create(null, [heading]);

      const json = serializeToJSON(doc);
      const restoredDoc = deserializeFromJSON(json);

      const restoredHeading = restoredDoc.firstChild!;
      expect(restoredHeading.attrs.level).toBe(1);
    });
  });

  describe('serializeToTextBlocks', () => {
    test('should convert paragraph to TextBlock', () => {
      const text = editorSchema.text('Hello, world!');
      const paragraph = editorSchema.nodes[NodeType.PARAGRAPH].create(null, [text]);
      const doc = editorSchema.nodes[NodeType.DOC].create(null, [paragraph]);

      const blocks = serializeToTextBlocks(doc);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].blockType).toBe('paragraph');
      expect(blocks[0].content).toBe('Hello, world!');
    });

    test('should convert heading to TextBlock with level', () => {
      const text = editorSchema.text('Chapter Title');
      const heading = editorSchema.nodes[NodeType.HEADING].create({ level: 2 }, [text]);
      const doc = editorSchema.nodes[NodeType.DOC].create(null, [heading]);

      const blocks = serializeToTextBlocks(doc);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].blockType).toBe('heading');
      expect(blocks[0].level).toBe(2);
      expect(blocks[0].content).toBe('Chapter Title');
    });

    test('should convert scene break to TextBlock with feature', () => {
      const sceneBreak = editorSchema.nodes[NodeType.SCENE_BREAK].create({
        symbol: '***',
      });
      const doc = editorSchema.nodes[NodeType.DOC].create(null, [sceneBreak]);

      const blocks = serializeToTextBlocks(doc);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].features).toBeDefined();
      expect(blocks[0].features![0].type).toBe('break');
      expect(blocks[0].features![0].breakType).toBe('scene');
    });
  });

  describe('deserializeFromTextBlocks', () => {
    test('should convert TextBlock paragraph to ProseMirror node', () => {
      const textBlock: TextBlock = {
        id: '1',
        content: 'Hello, world!',
        blockType: 'paragraph',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const doc = deserializeFromTextBlocks([textBlock]);

      expect(doc.type.name).toBe(NodeType.DOC);
      expect(doc.textContent).toBe('Hello, world!');
    });

    test('should convert TextBlock heading with level', () => {
      const textBlock: TextBlock = {
        id: '1',
        content: 'Chapter Title',
        blockType: 'heading',
        level: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const doc = deserializeFromTextBlocks([textBlock]);
      const heading = doc.firstChild!;

      expect(heading.type.name).toBe(NodeType.HEADING);
      expect(heading.attrs.level).toBe(3);
      expect(heading.textContent).toBe('Chapter Title');
    });

    test('should round-trip TextBlocks through serialization', () => {
      const originalBlocks: TextBlock[] = [
        {
          id: '1',
          content: 'Introduction',
          blockType: 'heading',
          level: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          content: 'This is the first paragraph.',
          blockType: 'paragraph',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const doc = deserializeFromTextBlocks(originalBlocks);
      const blocks = serializeToTextBlocks(doc);

      expect(blocks).toHaveLength(2);
      expect(blocks[0].blockType).toBe('heading');
      expect(blocks[0].content).toBe('Introduction');
      expect(blocks[1].blockType).toBe('paragraph');
      expect(blocks[1].content).toBe('This is the first paragraph.');
    });
  });
});
