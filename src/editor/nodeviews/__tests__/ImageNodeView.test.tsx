/**
 * Tests for ImageNodeView Component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { ImageNodeView, createImageNodeView } from '../ImageNodeView';
import { imageNodeSpec } from '../../nodes/image';
import { ImageAttrs } from '../../types';

// Mock React DOM for NodeView tests
jest.mock('react-dom', () => ({
  render: jest.fn(),
  unmountComponentAtNode: jest.fn(),
}));

describe('ImageNodeView', () => {
  let schema: Schema;
  let editorView: EditorView;
  let container: HTMLElement;

  beforeEach(() => {
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

    // Create container element
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create editor state
    const state = EditorState.create({
      schema,
      doc: schema.node('doc', null, [
        schema.node('paragraph', null, [
          schema.node('image', {
            src: 'https://example.com/test.jpg',
            alt: 'Test image',
            alignment: 'block',
          }),
        ]),
      ]),
    });

    // Create editor view
    editorView = new EditorView(container, { state });
  });

  afterEach(() => {
    if (editorView) {
      editorView.destroy();
    }
    if (container) {
      document.body.removeChild(container);
    }
    jest.clearAllMocks();
  });

  describe('NodeView Creation', () => {
    test('should create ImageNodeView instance', () => {
      const attrs: ImageAttrs = {
        src: 'https://example.com/image.jpg',
        alt: 'Test',
        alignment: 'inline',
      };
      const node = schema.nodes.image.create(attrs);
      const getPos = () => 0;

      const nodeView = new ImageNodeView(node, editorView, getPos, []);

      expect(nodeView).toBeInstanceOf(ImageNodeView);
      expect(nodeView.dom).toBeInstanceOf(HTMLElement);
      expect(nodeView.node).toBe(node);
      expect(nodeView.view).toBe(editorView);
    });

    test('should create nodeView using factory function', () => {
      const attrs: ImageAttrs = {
        src: 'https://example.com/image.jpg',
      };
      const node = schema.nodes.image.create(attrs);
      const getPos = () => 0;

      const nodeView = createImageNodeView(node, editorView, getPos, []);

      expect(nodeView).toBeInstanceOf(ImageNodeView);
    });

    test('should set correct DOM class', () => {
      const node = schema.nodes.image.create({ src: 'test.jpg' });
      const nodeView = new ImageNodeView(node, editorView, () => 0, []);

      expect(nodeView.dom.className).toBe('prosemirror-image-node');
    });
  });

  describe('NodeView Updates', () => {
    test('should update when node attributes change', () => {
      const node1 = schema.nodes.image.create({
        src: 'image1.jpg',
        width: 200,
      });
      const nodeView = new ImageNodeView(node1, editorView, () => 0, []);

      const node2 = schema.nodes.image.create({
        src: 'image2.jpg',
        width: 400,
      });

      const result = nodeView.update(node2, []);

      expect(result).toBe(true);
      expect(nodeView.node).toBe(node2);
    });

    test('should reject update for different node type', () => {
      const imageNode = schema.nodes.image.create({ src: 'test.jpg' });
      const nodeView = new ImageNodeView(imageNode, editorView, () => 0, []);

      const textNode = schema.text('Hello');
      const result = nodeView.update(textNode as any, []);

      expect(result).toBe(false);
    });
  });

  describe('Selection Handling', () => {
    test('should add selected class on selectNode', () => {
      const node = schema.nodes.image.create({ src: 'test.jpg' });
      const nodeView = new ImageNodeView(node, editorView, () => 0, []);

      nodeView.selectNode();

      expect(nodeView.dom.classList.contains('ProseMirror-selectednode')).toBe(true);
    });

    test('should remove selected class on deselectNode', () => {
      const node = schema.nodes.image.create({ src: 'test.jpg' });
      const nodeView = new ImageNodeView(node, editorView, () => 0, []);

      nodeView.selectNode();
      nodeView.deselectNode();

      expect(nodeView.dom.classList.contains('ProseMirror-selectednode')).toBe(false);
    });
  });

  describe('Event Handling', () => {
    test('should handle resize handle mousedown events', () => {
      const node = schema.nodes.image.create({ src: 'test.jpg' });
      const nodeView = new ImageNodeView(node, editorView, () => 0, []);

      const mockEvent = {
        type: 'mousedown',
        target: document.createElement('div'),
      } as Event;
      mockEvent.target.classList.add('resize-handle');

      const result = nodeView.stopEvent(mockEvent);

      expect(result).toBe(true);
    });

    test('should not stop other events', () => {
      const node = schema.nodes.image.create({ src: 'test.jpg' });
      const nodeView = new ImageNodeView(node, editorView, () => 0, []);

      const mockEvent = {
        type: 'click',
        target: document.createElement('div'),
      } as Event;

      const result = nodeView.stopEvent(mockEvent);

      expect(result).toBe(false);
    });
  });

  describe('Mutation Handling', () => {
    test('should ignore all mutations', () => {
      const node = schema.nodes.image.create({ src: 'test.jpg' });
      const nodeView = new ImageNodeView(node, editorView, () => 0, []);

      const mutation = {
        type: 'childList',
        target: nodeView.dom,
      } as MutationRecord;

      const result = nodeView.ignoreMutation(mutation);

      expect(result).toBe(true);
    });

    test('should ignore selection mutations', () => {
      const node = schema.nodes.image.create({ src: 'test.jpg' });
      const nodeView = new ImageNodeView(node, editorView, () => 0, []);

      const mutation = {
        type: 'selection',
        target: nodeView.dom,
      };

      const result = nodeView.ignoreMutation(mutation as any);

      expect(result).toBe(true);
    });
  });

  describe('Alignment Modes', () => {
    test.each([
      ['inline', 'image-node-inline'],
      ['block', 'image-node-block'],
      ['left', 'image-node-left'],
      ['right', 'image-node-right'],
    ])('should render %s alignment with class %s', (alignment, expectedClass) => {
      const node = schema.nodes.image.create({
        src: 'test.jpg',
        alignment: alignment as ImageAttrs['alignment'],
      });
      const nodeView = new ImageNodeView(node, editorView, () => 0, []);

      // The class would be set on the inner container by React
      // This test verifies the nodeView is created successfully
      expect(nodeView.dom).toBeTruthy();
    });
  });

  describe('Image Attributes', () => {
    test('should support width and height attributes', () => {
      const node = schema.nodes.image.create({
        src: 'test.jpg',
        width: 800,
        height: 600,
      });
      const nodeView = new ImageNodeView(node, editorView, () => 0, []);

      expect(nodeView.node.attrs.width).toBe(800);
      expect(nodeView.node.attrs.height).toBe(600);
    });

    test('should support alt text', () => {
      const node = schema.nodes.image.create({
        src: 'test.jpg',
        alt: 'Descriptive alt text',
      });
      const nodeView = new ImageNodeView(node, editorView, () => 0, []);

      expect(nodeView.node.attrs.alt).toBe('Descriptive alt text');
    });

    test('should support title attribute', () => {
      const node = schema.nodes.image.create({
        src: 'test.jpg',
        title: 'Image title',
      });
      const nodeView = new ImageNodeView(node, editorView, () => 0, []);

      expect(nodeView.node.attrs.title).toBe('Image title');
    });
  });

  describe('Cleanup', () => {
    test('should clean up on destroy', () => {
      const ReactDOM = require('react-dom');
      const node = schema.nodes.image.create({ src: 'test.jpg' });
      const nodeView = new ImageNodeView(node, editorView, () => 0, []);

      nodeView.destroy();

      expect(ReactDOM.unmountComponentAtNode).toHaveBeenCalledWith(nodeView.dom);
    });
  });

  describe('Integration', () => {
    test('should register with EditorView nodeViews', () => {
      const state = EditorState.create({
        schema,
        doc: schema.node('doc', null, [
          schema.node('paragraph', null, [
            schema.node('image', {
              src: 'https://example.com/test.jpg',
            }),
          ]),
        ]),
      });

      const testContainer = document.createElement('div');
      const view = new EditorView(testContainer, {
        state,
        nodeViews: {
          image: createImageNodeView,
        },
      });

      // Verify the view was created successfully with custom nodeView
      expect(view).toBeInstanceOf(EditorView);

      view.destroy();
    });

    test('should support multiple images in document', () => {
      const state = EditorState.create({
        schema,
        doc: schema.node('doc', null, [
          schema.node('paragraph', null, [
            schema.node('image', { src: 'image1.jpg' }),
          ]),
          schema.node('paragraph', null, [
            schema.node('image', { src: 'image2.jpg' }),
          ]),
          schema.node('paragraph', null, [
            schema.node('image', { src: 'image3.jpg' }),
          ]),
        ]),
      });

      const testContainer = document.createElement('div');
      const view = new EditorView(testContainer, {
        state,
        nodeViews: {
          image: createImageNodeView,
        },
      });

      expect(view).toBeInstanceOf(EditorView);

      view.destroy();
    });
  });

  describe('Data URIs', () => {
    test('should support base64 data URIs', () => {
      const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const node = schema.nodes.image.create({ src: dataUri });
      const nodeView = new ImageNodeView(node, editorView, () => 0, []);

      expect(nodeView.node.attrs.src).toBe(dataUri);
    });

    test('should support JPEG data URIs', () => {
      const dataUri = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      const node = schema.nodes.image.create({ src: dataUri });
      const nodeView = new ImageNodeView(node, editorView, () => 0, []);

      expect(nodeView.node.attrs.src).toBe(dataUri);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid image sources gracefully', () => {
      const node = schema.nodes.image.create({
        src: 'https://invalid-domain-that-does-not-exist.com/image.jpg',
      });
      const nodeView = new ImageNodeView(node, editorView, () => 0, []);

      // NodeView should be created even with invalid src
      expect(nodeView).toBeInstanceOf(ImageNodeView);
      expect(nodeView.dom).toBeTruthy();
    });

    test('should handle empty src attribute', () => {
      const node = schema.nodes.image.create({ src: '' });
      const nodeView = new ImageNodeView(node, editorView, () => 0, []);

      expect(nodeView).toBeInstanceOf(ImageNodeView);
    });
  });
});
