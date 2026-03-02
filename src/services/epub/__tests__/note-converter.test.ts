/**
 * Tests for EPUB 3 Note Converter
 */

import {
  convertNote,
  convertNoteCollection,
  extractAndConvertNotes,
  generateNoteStyles,
  type NoteReference,
  type NoteConversionOptions,
} from '../note-converter';

describe('note-converter', () => {
  describe('convertNote', () => {
    it('should convert a basic footnote with popup style', () => {
      const note: NoteReference = {
        id: 'fn1',
        marker: '1',
        type: 'footnote',
        content: 'This is a footnote.',
      };

      const result = convertNote(note, { style: 'popup' });

      expect(result.noteId).toBe('note-fn1');
      expect(result.refId).toBe('note-ref-fn1');
      expect(result.referenceHtml).toContain('epub:type="noteref"');
      expect(result.referenceHtml).toContain('href="#note-fn1"');
      expect(result.referenceHtml).toContain('<sup>1</sup>');
      expect(result.noteHtml).toContain('<aside');
      expect(result.noteHtml).toContain('epub:type="footnote"');
      expect(result.noteHtml).toContain('This is a footnote.');
    });

    it('should convert an endnote with inline style', () => {
      const note: NoteReference = {
        id: 'en1',
        marker: 'a',
        type: 'endnote',
        content: 'This is an endnote.',
      };

      const result = convertNote(note, { style: 'inline' });

      expect(result.noteId).toBe('note-en1');
      expect(result.referenceHtml).toContain('epub:type="noteref"');
      expect(result.referenceHtml).toContain('<sup>a</sup>');
      expect(result.noteHtml).toContain('<li');
      expect(result.noteHtml).toContain('epub:type="endnote"');
      expect(result.noteHtml).toContain('This is an endnote.');
    });

    it('should include ARIA labels when enabled', () => {
      const note: NoteReference = {
        id: 'fn1',
        marker: '1',
        type: 'footnote',
        content: 'Test note',
      };

      const result = convertNote(note, { includeAriaLabels: true });

      expect(result.referenceHtml).toContain('aria-label="footnote 1"');
      expect(result.referenceHtml).toContain('role="doc-noteref"');
      expect(result.noteHtml).toContain('aria-label="footnote 1"');
      expect(result.noteHtml).toContain('role="doc-footnote"');
    });

    it('should omit ARIA labels when disabled', () => {
      const note: NoteReference = {
        id: 'fn1',
        marker: '1',
        type: 'footnote',
        content: 'Test note',
      };

      const result = convertNote(note, { includeAriaLabels: false });

      expect(result.referenceHtml).not.toContain('aria-label');
      expect(result.referenceHtml).not.toContain('role=');
      expect(result.noteHtml).not.toContain('aria-label');
    });

    it('should use custom ID prefix', () => {
      const note: NoteReference = {
        id: 'fn1',
        marker: '1',
        type: 'footnote',
        content: 'Test note',
      };

      const result = convertNote(note, { idPrefix: 'custom' });

      expect(result.noteId).toBe('custom-fn1');
      expect(result.refId).toBe('custom-ref-fn1');
      expect(result.referenceHtml).toContain('href="#custom-fn1"');
      expect(result.noteHtml).toContain('id="custom-fn1"');
    });

    it('should use custom class prefix', () => {
      const note: NoteReference = {
        id: 'fn1',
        marker: '1',
        type: 'footnote',
        content: 'Test note',
      };

      const result = convertNote(note, { classPrefix: 'book' });

      expect(result.referenceHtml).toContain('class="book-noteref"');
      expect(result.noteHtml).toContain('class="book-footnote"');
      expect(result.noteHtml).toContain('class="book-note-backlink"');
    });

    it('should handle notes without superscript', () => {
      const note: NoteReference = {
        id: 'fn1',
        marker: '1',
        type: 'footnote',
        content: 'Test note',
      };

      const result = convertNote(note, { useSuperscript: false });

      expect(result.referenceHtml).not.toContain('<sup>');
      expect(result.referenceHtml).toContain('>1</a>');
    });

    it('should include custom class name', () => {
      const note: NoteReference = {
        id: 'fn1',
        marker: '1',
        type: 'footnote',
        content: 'Test note',
        className: 'important-note',
      };

      const result = convertNote(note);

      expect(result.referenceHtml).toContain('important-note');
    });

    it('should generate backlink in note content', () => {
      const note: NoteReference = {
        id: 'fn1',
        marker: '1',
        type: 'footnote',
        content: 'Test note',
      };

      const result = convertNote(note);

      expect(result.noteHtml).toContain('epub:type="backlink"');
      expect(result.noteHtml).toContain('href="#note-ref-fn1"');
      expect(result.noteHtml).toContain('role="doc-backlink"');
      expect(result.noteHtml).toContain('↩');
    });

    it('should escape HTML in marker', () => {
      const note: NoteReference = {
        id: 'fn1',
        marker: '<script>alert("xss")</script>',
        type: 'footnote',
        content: 'Test note',
      };

      const result = convertNote(note);

      expect(result.referenceHtml).not.toContain('<script>');
      expect(result.referenceHtml).toContain('&lt;script&gt;');
    });
  });

  describe('convertNoteCollection', () => {
    it('should convert multiple notes', () => {
      const notes: NoteReference[] = [
        {
          id: 'fn1',
          marker: '1',
          type: 'footnote',
          content: 'First footnote',
        },
        {
          id: 'fn2',
          marker: '2',
          type: 'footnote',
          content: 'Second footnote',
        },
        {
          id: 'fn3',
          marker: '3',
          type: 'footnote',
          content: 'Third footnote',
        },
      ];

      const result = convertNoteCollection(notes, { style: 'inline' });

      expect(result.notes).toHaveLength(3);
      expect(result.notes[0].noteId).toBe('note-fn1');
      expect(result.notes[1].noteId).toBe('note-fn2');
      expect(result.notes[2].noteId).toBe('note-fn3');
    });

    it('should generate complete footnotes section', () => {
      const notes: NoteReference[] = [
        {
          id: 'fn1',
          marker: '1',
          type: 'footnote',
          content: 'First footnote',
        },
        {
          id: 'fn2',
          marker: '2',
          type: 'footnote',
          content: 'Second footnote',
        },
      ];

      const result = convertNoteCollection(notes, { style: 'inline' });

      expect(result.notesHtml).toContain('<section epub:type="footnotes"');
      expect(result.notesHtml).toContain('<h2');
      expect(result.notesHtml).toContain('Footnotes');
      expect(result.notesHtml).toContain('<ol');
      expect(result.notesHtml).toContain('First footnote');
      expect(result.notesHtml).toContain('Second footnote');
    });

    it('should generate complete endnotes section', () => {
      const notes: NoteReference[] = [
        {
          id: 'en1',
          marker: 'i',
          type: 'endnote',
          content: 'First endnote',
        },
        {
          id: 'en2',
          marker: 'ii',
          type: 'endnote',
          content: 'Second endnote',
        },
      ];

      const result = convertNoteCollection(notes, { style: 'inline' });

      expect(result.notesHtml).toContain('<section epub:type="endnotes"');
      expect(result.notesHtml).toContain('Endnotes');
      expect(result.notesHtml).toContain('First endnote');
      expect(result.notesHtml).toContain('Second endnote');
    });

    it('should handle empty notes array', () => {
      const result = convertNoteCollection([], { style: 'inline' });

      expect(result.notes).toHaveLength(0);
      expect(result.notesHtml).toBe('');
    });

    it('should apply custom options to all notes', () => {
      const notes: NoteReference[] = [
        {
          id: 'fn1',
          marker: '1',
          type: 'footnote',
          content: 'First footnote',
        },
        {
          id: 'fn2',
          marker: '2',
          type: 'footnote',
          content: 'Second footnote',
        },
      ];

      const options: NoteConversionOptions = {
        idPrefix: 'custom',
        classPrefix: 'book',
        useSuperscript: false,
      };

      const result = convertNoteCollection(notes, options);

      expect(result.notes[0].noteId).toBe('custom-fn1');
      expect(result.notes[1].noteId).toBe('custom-fn2');
      expect(result.notesHtml).toContain('class="book-footnotes"');
    });
  });

  describe('extractAndConvertNotes', () => {
    it('should extract and convert note markers from HTML', () => {
      const html = '<p>Some text[^1] with a footnote[^2].</p>';
      const definitions = new Map([
        ['1', 'First footnote content'],
        ['2', 'Second footnote content'],
      ]);

      const result = extractAndConvertNotes(html, definitions);

      expect(result.notes).toHaveLength(2);
      expect(result.html).not.toContain('[^1]');
      expect(result.html).not.toContain('[^2]');
      expect(result.html).toContain('epub:type="noteref"');
      expect(result.html).toContain('href="#note-1"');
      expect(result.html).toContain('href="#note-2"');
    });

    it('should handle asterisk markers', () => {
      const html = '<p>Text with asterisk footnote[^*].</p>';
      const definitions = new Map([['*', 'Asterisk footnote content']]);

      const result = extractAndConvertNotes(html, definitions);

      expect(result.notes).toHaveLength(1);
      expect(result.html).not.toContain('[^*]');
      expect(result.html).toContain('<sup>*</sup>');
    });

    it('should handle letter markers', () => {
      const html = '<p>Text with letter footnote[^a].</p>';
      const definitions = new Map([['a', 'Letter footnote content']]);

      const result = extractAndConvertNotes(html, definitions);

      expect(result.notes).toHaveLength(1);
      expect(result.html).not.toContain('[^a]');
      expect(result.html).toContain('<sup>a</sup>');
    });

    it('should leave markers without definitions unchanged', () => {
      const html = '<p>Text with undefined[^99] marker.</p>';
      const definitions = new Map([['1', 'Defined note']]);

      const result = extractAndConvertNotes(html, definitions);

      expect(result.notes).toHaveLength(0);
      expect(result.html).toContain('[^99]');
    });

    it('should handle multiple occurrences in same paragraph', () => {
      const html = '<p>First[^1] and second[^2] and third[^3].</p>';
      const definitions = new Map([
        ['1', 'First'],
        ['2', 'Second'],
        ['3', 'Third'],
      ]);

      const result = extractAndConvertNotes(html, definitions);

      expect(result.notes).toHaveLength(3);
      expect(result.html).not.toContain('[^');
    });

    it('should preserve HTML structure', () => {
      const html = '<p>Paragraph 1[^1].</p><p>Paragraph 2[^2].</p>';
      const definitions = new Map([
        ['1', 'Note 1'],
        ['2', 'Note 2'],
      ]);

      const result = extractAndConvertNotes(html, definitions);

      expect(result.html).toContain('<p>Paragraph 1');
      expect(result.html).toContain('<p>Paragraph 2');
      expect(result.notes).toHaveLength(2);
    });

    it('should apply conversion options', () => {
      const html = '<p>Text[^1].</p>';
      const definitions = new Map([['1', 'Note content']]);
      const options: NoteConversionOptions = {
        idPrefix: 'fn',
        classPrefix: 'book',
        useSuperscript: false,
      };

      const result = extractAndConvertNotes(html, definitions, options);

      expect(result.html).toContain('href="#fn-1"');
      expect(result.html).toContain('class="book-noteref"');
      expect(result.html).not.toContain('<sup>');
    });
  });

  describe('generateNoteStyles', () => {
    it('should generate base styles', () => {
      const styles = generateNoteStyles({});

      expect(styles).toContain('.noteref');
      expect(styles).toContain('text-decoration: none');
      expect(styles).toContain('color: #0066cc');
    });

    it('should generate popup styles when style is popup', () => {
      const styles = generateNoteStyles({ style: 'popup' });

      expect(styles).toContain('aside.footnote');
      expect(styles).toContain('position: absolute');
      expect(styles).toContain('display: none');
      expect(styles).toContain(':target');
    });

    it('should generate inline styles when style is inline', () => {
      const styles = generateNoteStyles({ style: 'inline' });

      expect(styles).toContain('section.footnotes');
      expect(styles).toContain('.notes-title');
      expect(styles).toContain('.notes-list');
      expect(styles).toContain('border-top');
    });

    it('should use custom class prefix', () => {
      const styles = generateNoteStyles({ classPrefix: 'book' });

      expect(styles).toContain('.book-noteref');
      expect(styles).toContain('.book-note-backlink');
    });

    it('should use custom font size', () => {
      const styles = generateNoteStyles({ fontSize: '0.8em' });

      expect(styles).toContain('font-size: 0.8em');
    });

    it('should use custom color', () => {
      const styles = generateNoteStyles({ color: '#666', style: 'inline' });

      expect(styles).toContain('color: #666');
    });

    it('should include backlink styles', () => {
      const styles = generateNoteStyles({});

      expect(styles).toContain('.note-backlink');
      expect(styles).toContain('margin-right: 0.5em');
    });
  });

  describe('edge cases and security', () => {
    it('should handle empty content', () => {
      const note: NoteReference = {
        id: 'fn1',
        marker: '1',
        type: 'footnote',
        content: '',
      };

      const result = convertNote(note);

      expect(result.noteHtml).toContain('</p>');
    });

    it('should not double-escape HTML entities', () => {
      const note: NoteReference = {
        id: 'fn1',
        marker: '&amp;',
        type: 'footnote',
        content: 'Test',
      };

      const result = convertNote(note);

      expect(result.referenceHtml).toContain('&amp;amp;');
    });

    it('should handle special characters in ID', () => {
      const note: NoteReference = {
        id: 'fn-1.2.3',
        marker: '1',
        type: 'footnote',
        content: 'Test',
      };

      const result = convertNote(note);

      expect(result.noteId).toBe('note-fn-1.2.3');
      expect(result.referenceHtml).toContain('href="#note-fn-1.2.3"');
    });

    it('should handle long marker text', () => {
      const note: NoteReference = {
        id: 'fn1',
        marker: 'this is a very long marker text',
        type: 'footnote',
        content: 'Test',
      };

      const result = convertNote(note);

      expect(result.referenceHtml).toContain('this is a very long marker text');
    });

    it('should handle HTML content in notes (not escaped)', () => {
      const note: NoteReference = {
        id: 'fn1',
        marker: '1',
        type: 'footnote',
        content: 'See <em>Chapter 3</em> for details.',
      };

      const result = convertNote(note);

      // Content should be preserved as-is (not escaped)
      expect(result.noteHtml).toContain('<em>Chapter 3</em>');
    });
  });
});
