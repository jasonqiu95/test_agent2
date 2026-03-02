/**
 * Tests for Image Node Specification
 */

import { Schema } from 'prosemirror-model';
import { imageNodeSpec, isValidImageSrc } from '../image';
import { ImageAttrs } from '../../types';

describe('Image Node Specification', () => {
  let schema: Schema;

  beforeAll(() => {
    // Create a minimal schema for testing
    schema = new Schema({
      nodes: {
        doc: { content: 'block+' },
        paragraph: { content: 'inline*', group: 'block' },
        text: { group: 'inline', inline: true },
        image: imageNodeSpec,
      },
      marks: {},
    });
  });

  describe('Node Creation', () => {
    test('should create image node with required src attribute', () => {
      const attrs: ImageAttrs = { src: 'https://example.com/image.jpg' };
      const imageNode = schema.nodes.image.create(attrs);

      expect(imageNode.type.name).toBe('image');
      expect(imageNode.attrs.src).toBe('https://example.com/image.jpg');
    });

    test('should create image with all attributes', () => {
      const attrs: ImageAttrs = {
        src: 'https://example.com/image.jpg',
        alt: 'Example image',
        title: 'An example',
        width: 800,
        height: 600,
        alignment: 'block',
      };
      const imageNode = schema.nodes.image.create(attrs);

      expect(imageNode.attrs.src).toBe('https://example.com/image.jpg');
      expect(imageNode.attrs.alt).toBe('Example image');
      expect(imageNode.attrs.title).toBe('An example');
      expect(imageNode.attrs.width).toBe(800);
      expect(imageNode.attrs.height).toBe(600);
      expect(imageNode.attrs.alignment).toBe('block');
    });

    test('should default to inline alignment', () => {
      const attrs: ImageAttrs = { src: 'test.jpg' };
      const imageNode = schema.nodes.image.create(attrs);

      expect(imageNode.attrs.alignment).toBe('inline');
    });

    test('should support different alignment values', () => {
      const alignments: Array<'inline' | 'block' | 'left' | 'right'> = [
        'inline',
        'block',
        'left',
        'right',
      ];

      alignments.forEach((alignment) => {
        const imageNode = schema.nodes.image.create({
          src: 'test.jpg',
          alignment,
        });
        expect(imageNode.attrs.alignment).toBe(alignment);
      });
    });
  });

  describe('DOM Serialization', () => {
    test('should serialize inline image to img tag', () => {
      const imageNode = schema.nodes.image.create({
        src: 'test.jpg',
        alt: 'Test',
        alignment: 'inline',
      });

      const domSpec = imageNodeSpec.toDOM!(imageNode);

      expect(Array.isArray(domSpec)).toBe(true);
      if (Array.isArray(domSpec)) {
        expect(domSpec[0]).toBe('img');
        const attrs = domSpec[1] as Record<string, any>;
        expect(attrs.src).toBe('test.jpg');
        expect(attrs.alt).toBe('Test');
        expect(attrs['data-alignment']).toBe('inline');
      }
    });

    test('should wrap block images in div', () => {
      const imageNode = schema.nodes.image.create({
        src: 'test.jpg',
        alignment: 'block',
      });

      const domSpec = imageNodeSpec.toDOM!(imageNode);

      expect(Array.isArray(domSpec)).toBe(true);
      if (Array.isArray(domSpec)) {
        expect(domSpec[0]).toBe('div');
        const attrs = domSpec[1] as Record<string, any>;
        expect(attrs.class).toContain('image-wrapper');
        expect(attrs.class).toContain('image-block');
      }
    });

    test('should wrap left-aligned images in div', () => {
      const imageNode = schema.nodes.image.create({
        src: 'test.jpg',
        alignment: 'left',
      });

      const domSpec = imageNodeSpec.toDOM!(imageNode);

      if (Array.isArray(domSpec)) {
        const attrs = domSpec[1] as Record<string, any>;
        expect(attrs.class).toContain('image-left');
      }
    });

    test('should wrap right-aligned images in div', () => {
      const imageNode = schema.nodes.image.create({
        src: 'test.jpg',
        alignment: 'right',
      });

      const domSpec = imageNodeSpec.toDOM!(imageNode);

      if (Array.isArray(domSpec)) {
        const attrs = domSpec[1] as Record<string, any>;
        expect(attrs.class).toContain('image-right');
      }
    });

    test('should include width and height in DOM attributes', () => {
      const imageNode = schema.nodes.image.create({
        src: 'test.jpg',
        width: 400,
        height: 300,
        alignment: 'inline',
      });

      const domSpec = imageNodeSpec.toDOM!(imageNode);

      if (Array.isArray(domSpec)) {
        const attrs = domSpec[1] as Record<string, any>;
        expect(attrs.width).toBe(400);
        expect(attrs.height).toBe(300);
      }
    });
  });

  describe('Image Source Validation', () => {
    test('should validate HTTP URLs', () => {
      expect(isValidImageSrc('https://example.com/image.jpg')).toBe(true);
      expect(isValidImageSrc('http://example.com/image.jpg')).toBe(true);
    });

    test('should validate data URIs', () => {
      expect(
        isValidImageSrc('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==')
      ).toBe(true);
      expect(isValidImageSrc('data:image/jpeg;base64,/9j/4AAQSkZJRg==')).toBe(true);
    });

    test('should validate relative paths', () => {
      expect(isValidImageSrc('images/test.jpg')).toBe(true);
      expect(isValidImageSrc('../assets/image.png')).toBe(true);
      expect(isValidImageSrc('./image.gif')).toBe(true);
    });

    test('should reject empty strings', () => {
      expect(isValidImageSrc('')).toBe(false);
    });
  });

  describe('Node Properties', () => {
    test('should be an atom node', () => {
      expect(imageNodeSpec.atom).toBe(true);
    });

    test('should be draggable', () => {
      expect(imageNodeSpec.draggable).toBe(true);
    });

    test('should be inline by default', () => {
      expect(imageNodeSpec.inline).toBe(true);
    });

    test('should be in inline group', () => {
      expect(imageNodeSpec.group).toBe('inline');
    });
  });
});
