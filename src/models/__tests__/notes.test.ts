/**
 * Tests for footnote and endnote factory functions
 */

import {
  createFootnote,
  createEndnote,
  createFootnoteMarker,
  createNumberedFootnote,
  createNumberedEndnote,
  createSymbolFootnote,
  createSymbolEndnote,
  getNextNoteSymbol,
  autoNumberFootnotes,
  autoNumberEndnotes,
} from '../factories';
import { Footnote, Endnote } from '../../types';

describe('Footnote and Endnote Factories', () => {
  describe('createFootnote', () => {
    it('should create a basic footnote with required fields', () => {
      const footnote = createFootnote({
        content: 'This is a footnote',
        sourceElementId: 'element-123',
      });

      expect(footnote.noteType).toBe('footnote');
      expect(footnote.content).toBe('This is a footnote');
      expect(footnote.sourceElementId).toBe('element-123');
      expect(footnote.markerType).toBe('number');
      expect(footnote.displayOnSamePage).toBe(true);
      expect(footnote.id).toBeDefined();
    });

    it('should create a footnote with manual number', () => {
      const footnote = createFootnote({
        content: 'Numbered footnote',
        sourceElementId: 'element-123',
        markerType: 'number',
        number: 5,
      });

      expect(footnote.markerType).toBe('number');
      expect(footnote.number).toBe(5);
    });

    it('should create a footnote with symbol', () => {
      const footnote = createFootnote({
        content: 'Symbol footnote',
        sourceElementId: 'element-123',
        markerType: 'symbol',
        symbol: '*',
      });

      expect(footnote.markerType).toBe('symbol');
      expect(footnote.symbol).toBe('*');
    });
  });

  describe('createEndnote', () => {
    it('should create a basic endnote', () => {
      const endnote = createEndnote({
        content: 'This is an endnote',
        sourceElementId: 'element-456',
      });

      expect(endnote.noteType).toBe('endnote');
      expect(endnote.content).toBe('This is an endnote');
      expect(endnote.sourceElementId).toBe('element-456');
      expect(endnote.markerType).toBe('number');
      expect(endnote.groupByChapter).toBe(false);
    });

    it('should create an endnote with chapter grouping', () => {
      const endnote = createEndnote({
        content: 'Chapter endnote',
        sourceElementId: 'element-456',
        chapterId: 'chapter-1',
        groupByChapter: true,
      });

      expect(endnote.chapterId).toBe('chapter-1');
      expect(endnote.groupByChapter).toBe(true);
    });
  });

  describe('Convenience factory functions', () => {
    it('should create numbered footnote', () => {
      const footnote = createNumberedFootnote(
        'Numbered footnote',
        'element-123',
        42
      );

      expect(footnote.markerType).toBe('number');
      expect(footnote.number).toBe(42);
    });

    it('should create numbered endnote', () => {
      const endnote = createNumberedEndnote(
        'Numbered endnote',
        'element-456',
        99,
        'chapter-1'
      );

      expect(endnote.markerType).toBe('number');
      expect(endnote.number).toBe(99);
      expect(endnote.chapterId).toBe('chapter-1');
    });

    it('should create symbol footnote', () => {
      const footnote = createSymbolFootnote(
        'Symbol footnote',
        'element-123',
        '†'
      );

      expect(footnote.markerType).toBe('symbol');
      expect(footnote.symbol).toBe('†');
    });

    it('should create symbol endnote', () => {
      const endnote = createSymbolEndnote(
        'Symbol endnote',
        'element-456',
        '‡',
        'chapter-1'
      );

      expect(endnote.markerType).toBe('symbol');
      expect(endnote.symbol).toBe('‡');
      expect(endnote.chapterId).toBe('chapter-1');
    });
  });

  describe('createFootnoteMarker', () => {
    it('should create a footnote marker', () => {
      const marker = createFootnoteMarker('note-123', '1', 'number');

      expect(marker.type).toBe('footnote-marker');
      expect(marker.noteId).toBe('note-123');
      expect(marker.marker).toBe('1');
      expect(marker.markerType).toBe('number');
      expect(marker.superscript).toBe(true);
    });

    it('should create an endnote marker', () => {
      const marker = createFootnoteMarker('note-456', 'i', 'number', true);

      expect(marker.type).toBe('endnote-marker');
      expect(marker.noteId).toBe('note-456');
    });
  });

  describe('getNextNoteSymbol', () => {
    it('should return basic symbols in order', () => {
      expect(getNextNoteSymbol(0)).toBe('*');
      expect(getNextNoteSymbol(1)).toBe('†');
      expect(getNextNoteSymbol(2)).toBe('‡');
      expect(getNextNoteSymbol(3)).toBe('§');
      expect(getNextNoteSymbol(4)).toBe('¶');
    });

    it('should return doubled symbols after basic set', () => {
      expect(getNextNoteSymbol(5)).toBe('**');
      expect(getNextNoteSymbol(6)).toBe('††');
      expect(getNextNoteSymbol(7)).toBe('‡‡');
    });

    it('should return tripled symbols after doubled set', () => {
      expect(getNextNoteSymbol(10)).toBe('***');
      expect(getNextNoteSymbol(11)).toBe('†††');
    });
  });

  describe('autoNumberFootnotes', () => {
    it('should auto-number footnotes without numbers', () => {
      const footnotes: Footnote[] = [
        createFootnote({
          content: 'First',
          sourceElementId: 'el-1',
          markerType: 'number',
        }),
        createFootnote({
          content: 'Second',
          sourceElementId: 'el-2',
          markerType: 'number',
        }),
        createFootnote({
          content: 'Third',
          sourceElementId: 'el-3',
          markerType: 'number',
        }),
      ];

      const numbered = autoNumberFootnotes(footnotes);

      expect(numbered[0].number).toBe(1);
      expect(numbered[1].number).toBe(2);
      expect(numbered[2].number).toBe(3);
    });

    it('should respect manually numbered footnotes', () => {
      const footnotes: Footnote[] = [
        createFootnote({
          content: 'First',
          sourceElementId: 'el-1',
          markerType: 'number',
        }),
        createFootnote({
          content: 'Manual',
          sourceElementId: 'el-2',
          markerType: 'number',
          number: 99,
        }),
        createFootnote({
          content: 'Third',
          sourceElementId: 'el-3',
          markerType: 'number',
        }),
      ];

      const numbered = autoNumberFootnotes(footnotes);

      expect(numbered[0].number).toBe(1);
      expect(numbered[1].number).toBe(99); // Should keep manual number
      expect(numbered[2].number).toBe(2);
    });

    it('should start numbering from custom start number', () => {
      const footnotes: Footnote[] = [
        createFootnote({
          content: 'First',
          sourceElementId: 'el-1',
          markerType: 'number',
        }),
        createFootnote({
          content: 'Second',
          sourceElementId: 'el-2',
          markerType: 'number',
        }),
      ];

      const numbered = autoNumberFootnotes(footnotes, 10);

      expect(numbered[0].number).toBe(10);
      expect(numbered[1].number).toBe(11);
    });
  });

  describe('autoNumberEndnotes', () => {
    it('should auto-number endnotes without numbers', () => {
      const endnotes: Endnote[] = [
        createEndnote({
          content: 'First',
          sourceElementId: 'el-1',
          markerType: 'number',
        }),
        createEndnote({
          content: 'Second',
          sourceElementId: 'el-2',
          markerType: 'number',
        }),
      ];

      const numbered = autoNumberEndnotes(endnotes);

      expect(numbered[0].number).toBe(1);
      expect(numbered[1].number).toBe(2);
    });
  });
});
