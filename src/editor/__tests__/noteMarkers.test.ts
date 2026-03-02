/**
 * Tests for footnote and endnote marker functionality
 */

import { EditorState } from 'prosemirror-state';
import { Schema } from 'prosemirror-model';
import { editorSchema } from '../schema';
import {
  insertFootnoteMarker,
  insertEndnoteMarker,
  findHighestMarkerNumber,
  renumberMarkers,
} from '../commands';
import { NodeType } from '../types';

describe('Note Markers', () => {
  let schema: Schema;

  beforeEach(() => {
    schema = editorSchema;
  });

  describe('insertFootnoteMarker', () => {
    it('should insert a footnote marker with number 1 when no markers exist', () => {
      const state = EditorState.create({
        schema,
        doc: schema.node('doc', null, [
          schema.node('paragraph', null, [schema.text('Hello world')]),
        ]),
      });

      const command = insertFootnoteMarker();
      let newState = state;

      command(state, (tr) => {
        newState = state.apply(tr);
      });

      // Check that a footnote marker was inserted
      let foundMarker = false;
      newState.doc.descendants((node) => {
        if (node.type.name === NodeType.FOOTNOTE_MARKER) {
          expect(node.attrs.number).toBe(1);
          expect(node.attrs.noteId).toMatch(/^fn-/);
          foundMarker = true;
        }
      });

      expect(foundMarker).toBe(true);
    });

    it('should insert a footnote marker with incremented number', () => {
      // Create a document with an existing footnote marker
      const existingMarker = schema.nodes[NodeType.FOOTNOTE_MARKER].create({
        number: 1,
        noteId: 'fn-test-1',
      });

      const state = EditorState.create({
        schema,
        doc: schema.node('doc', null, [
          schema.node('paragraph', null, [
            schema.text('Test '),
            existingMarker,
            schema.text(' more text'),
          ]),
        ]),
      });

      const command = insertFootnoteMarker();
      let newState = state;

      command(state, (tr) => {
        newState = state.apply(tr);
      });

      // Check that the new marker has number 2
      let markerNumbers: number[] = [];
      newState.doc.descendants((node) => {
        if (node.type.name === NodeType.FOOTNOTE_MARKER) {
          markerNumbers.push(node.attrs.number as number);
        }
      });

      expect(markerNumbers).toContain(1);
      expect(markerNumbers).toContain(2);
    });
  });

  describe('insertEndnoteMarker', () => {
    it('should insert an endnote marker with number 1 when no markers exist', () => {
      const state = EditorState.create({
        schema,
        doc: schema.node('doc', null, [
          schema.node('paragraph', null, [schema.text('Hello world')]),
        ]),
      });

      const command = insertEndnoteMarker();
      let newState = state;

      command(state, (tr) => {
        newState = state.apply(tr);
      });

      // Check that an endnote marker was inserted
      let foundMarker = false;
      newState.doc.descendants((node) => {
        if (node.type.name === NodeType.ENDNOTE_MARKER) {
          expect(node.attrs.number).toBe(1);
          expect(node.attrs.noteId).toMatch(/^en-/);
          foundMarker = true;
        }
      });

      expect(foundMarker).toBe(true);
    });
  });

  describe('findHighestMarkerNumber', () => {
    it('should return 0 when no markers exist', () => {
      const state = EditorState.create({
        schema,
        doc: schema.node('doc', null, [
          schema.node('paragraph', null, [schema.text('Hello world')]),
        ]),
      });

      const highest = findHighestMarkerNumber(state, NodeType.FOOTNOTE_MARKER);
      expect(highest).toBe(0);
    });

    it('should return the highest marker number', () => {
      const marker1 = schema.nodes[NodeType.FOOTNOTE_MARKER].create({
        number: 1,
        noteId: 'fn-1',
      });
      const marker2 = schema.nodes[NodeType.FOOTNOTE_MARKER].create({
        number: 3,
        noteId: 'fn-3',
      });
      const marker3 = schema.nodes[NodeType.FOOTNOTE_MARKER].create({
        number: 2,
        noteId: 'fn-2',
      });

      const state = EditorState.create({
        schema,
        doc: schema.node('doc', null, [
          schema.node('paragraph', null, [
            schema.text('Test '),
            marker1,
            schema.text(' text '),
            marker2,
            schema.text(' more '),
            marker3,
          ]),
        ]),
      });

      const highest = findHighestMarkerNumber(state, NodeType.FOOTNOTE_MARKER);
      expect(highest).toBe(3);
    });

    it('should only count markers of the specified type', () => {
      const footnoteMarker = schema.nodes[NodeType.FOOTNOTE_MARKER].create({
        number: 5,
        noteId: 'fn-5',
      });
      const endnoteMarker = schema.nodes[NodeType.ENDNOTE_MARKER].create({
        number: 10,
        noteId: 'en-10',
      });

      const state = EditorState.create({
        schema,
        doc: schema.node('doc', null, [
          schema.node('paragraph', null, [
            schema.text('Test '),
            footnoteMarker,
            schema.text(' text '),
            endnoteMarker,
          ]),
        ]),
      });

      const highestFootnote = findHighestMarkerNumber(state, NodeType.FOOTNOTE_MARKER);
      const highestEndnote = findHighestMarkerNumber(state, NodeType.ENDNOTE_MARKER);

      expect(highestFootnote).toBe(5);
      expect(highestEndnote).toBe(10);
    });
  });

  describe('renumberMarkers', () => {
    it('should renumber markers sequentially', () => {
      const marker1 = schema.nodes[NodeType.FOOTNOTE_MARKER].create({
        number: 5,
        noteId: 'fn-1',
      });
      const marker2 = schema.nodes[NodeType.FOOTNOTE_MARKER].create({
        number: 10,
        noteId: 'fn-2',
      });
      const marker3 = schema.nodes[NodeType.FOOTNOTE_MARKER].create({
        number: 3,
        noteId: 'fn-3',
      });

      const state = EditorState.create({
        schema,
        doc: schema.node('doc', null, [
          schema.node('paragraph', null, [
            marker1,
            schema.text(' '),
            marker2,
            schema.text(' '),
            marker3,
          ]),
        ]),
      });

      const command = renumberMarkers(NodeType.FOOTNOTE_MARKER);
      let newState = state;

      command(state, (tr) => {
        newState = state.apply(tr);
      });

      // Check that markers are numbered 1, 2, 3 in order
      const markerNumbers: number[] = [];
      newState.doc.descendants((node) => {
        if (node.type.name === NodeType.FOOTNOTE_MARKER) {
          markerNumbers.push(node.attrs.number as number);
        }
      });

      expect(markerNumbers).toEqual([1, 2, 3]);
    });
  });

  describe('Schema Integration', () => {
    it('should have footnote_marker node type in schema', () => {
      expect(schema.nodes[NodeType.FOOTNOTE_MARKER]).toBeDefined();
    });

    it('should have endnote_marker node type in schema', () => {
      expect(schema.nodes[NodeType.ENDNOTE_MARKER]).toBeDefined();
    });

    it('footnote_marker should have correct attributes', () => {
      const footnoteMarkerType = schema.nodes[NodeType.FOOTNOTE_MARKER];
      const marker = footnoteMarkerType.create({ number: 1, noteId: 'test' });

      expect(marker.attrs.number).toBe(1);
      expect(marker.attrs.noteId).toBe('test');
    });

    it('endnote_marker should have correct attributes', () => {
      const endnoteMarkerType = schema.nodes[NodeType.ENDNOTE_MARKER];
      const marker = endnoteMarkerType.create({ number: 1, noteId: 'test' });

      expect(marker.attrs.number).toBe(1);
      expect(marker.attrs.noteId).toBe('test');
    });

    it('markers should be inline nodes', () => {
      const footnoteMarkerType = schema.nodes[NodeType.FOOTNOTE_MARKER];
      const endnoteMarkerType = schema.nodes[NodeType.ENDNOTE_MARKER];

      expect(footnoteMarkerType.spec.inline).toBe(true);
      expect(endnoteMarkerType.spec.inline).toBe(true);
    });
  });
});
