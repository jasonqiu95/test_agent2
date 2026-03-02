/**
 * Chapter Converter Tests
 */

import {
  convertChapterToXhtml,
  convertChaptersToXhtml,
  validateChapter,
  type ChapterConverterOptions,
} from '../chapter-converter';
import { Chapter } from '../../types/chapter';
import { TextBlock } from '../../types/textBlock';
import { Footnote, Endnote } from '../../types/notes';

describe('Chapter Converter', () => {
  describe('convertChapterToXhtml', () => {
    it('should convert a simple chapter', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'The Beginning',
        content: [
          {
            id: 'p1',
            blockType: 'paragraph',
            content: 'This is the first paragraph.',
          } as TextBlock,
        ],
      };

      const result = convertChapterToXhtml(chapter);

      expect(result.filename).toBe('chapter-1.xhtml');
      expect(result.title).toBe('Chapter 1: The Beginning');
      expect(result.xhtml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result.xhtml).toContain('<!DOCTYPE html>');
      expect(result.xhtml).toContain('<h1>Chapter 1: The Beginning</h1>');
      expect(result.xhtml).toContain('This is the first paragraph.');
      expect(result.metadata.chapterId).toBe('ch1');
      expect(result.metadata.chapterNumber).toBe(1);
    });

    it('should handle chapter without number', () => {
      const chapter: Chapter = {
        id: 'prologue',
        title: 'Prologue',
        content: [
          {
            id: 'p1',
            blockType: 'paragraph',
            content: 'The story begins...',
          } as TextBlock,
        ],
      };

      const result = convertChapterToXhtml(chapter);

      expect(result.filename).toBe('chapter-prologue.xhtml');
      expect(result.title).toBe('Prologue');
      expect(result.xhtml).toContain('<h1>Prologue</h1>');
    });

    it('should include chapter subtitle', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'The Beginning',
        subtitle: 'A New Dawn',
        content: [
          {
            id: 'p1',
            blockType: 'paragraph',
            content: 'Content here.',
          } as TextBlock,
        ],
      };

      const result = convertChapterToXhtml(chapter);

      expect(result.xhtml).toContain('class="chapter-subtitle"');
      expect(result.xhtml).toContain('A New Dawn');
    });

    it('should include epigraph', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'Chapter One',
        epigraph: 'To infinity and beyond!',
        epigraphAttribution: 'Buzz Lightyear',
        content: [
          {
            id: 'p1',
            blockType: 'paragraph',
            content: 'Content here.',
          } as TextBlock,
        ],
      };

      const result = convertChapterToXhtml(chapter);

      expect(result.xhtml).toContain('class="epigraph"');
      expect(result.xhtml).toContain('To infinity and beyond!');
      expect(result.xhtml).toContain('Buzz Lightyear');
    });

    it('should handle different block types', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'Mixed Content',
        content: [
          {
            id: 'h1',
            blockType: 'heading',
            level: 2,
            content: 'Section Title',
          } as TextBlock,
          {
            id: 'p1',
            blockType: 'paragraph',
            content: 'Regular paragraph.',
          } as TextBlock,
          {
            id: 'c1',
            blockType: 'code',
            content: 'const x = 42;',
            language: 'javascript',
          } as TextBlock,
        ],
      };

      const result = convertChapterToXhtml(chapter);

      expect(result.xhtml).toContain('<h2>Section Title</h2>');
      expect(result.xhtml).toContain('<p>Regular paragraph.</p>');
      expect(result.xhtml).toContain('<pre><code class="language-javascript">const x = 42;</code></pre>');
    });

    it('should handle list blocks', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'Lists',
        content: [
          {
            id: 'l1',
            blockType: 'list',
            listType: 'unordered',
            content: 'Item 1\nItem 2\nItem 3',
          } as TextBlock,
        ],
      };

      const result = convertChapterToXhtml(chapter);

      expect(result.xhtml).toContain('<ul>');
      expect(result.xhtml).toContain('<li>Item 1</li>');
      expect(result.xhtml).toContain('<li>Item 2</li>');
      expect(result.xhtml).toContain('<li>Item 3</li>');
      expect(result.xhtml).toContain('</ul>');
    });

    it('should handle scene breaks in features', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'With Breaks',
        content: [
          {
            id: 'p1',
            blockType: 'paragraph',
            content: 'First section.',
            features: [
              {
                type: 'break',
                breakType: 'scene',
                symbol: '* * *',
              },
            ],
          } as TextBlock,
          {
            id: 'p2',
            blockType: 'paragraph',
            content: 'Second section.',
          } as TextBlock,
        ],
      };

      const result = convertChapterToXhtml(chapter);

      expect(result.xhtml).toContain('<hr');
      expect(result.xhtml).toContain('epub-scene-break');
    });

    it('should handle quotes in features', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'With Quotes',
        content: [
          {
            id: 'p1',
            blockType: 'paragraph',
            content: 'Some text.',
            features: [
              {
                type: 'quote',
                content: 'To be or not to be',
                attribution: 'Shakespeare',
                source: 'Hamlet',
              },
            ],
          } as TextBlock,
        ],
      };

      const result = convertChapterToXhtml(chapter);

      expect(result.xhtml).toContain('<blockquote>');
      expect(result.xhtml).toContain('To be or not to be');
      expect(result.xhtml).toContain('Shakespeare');
      expect(result.xhtml).toContain('<cite>Hamlet</cite>');
    });

    it('should handle verse in features', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'With Verse',
        content: [
          {
            id: 'p1',
            blockType: 'paragraph',
            content: 'A poem follows:',
            features: [
              {
                type: 'verse',
                lines: ['Roses are red', 'Violets are blue', 'Sugar is sweet', 'And so are you'],
              },
            ],
          } as TextBlock,
        ],
      };

      const result = convertChapterToXhtml(chapter);

      expect(result.xhtml).toContain('class="verse"');
      expect(result.xhtml).toContain('Roses are red');
      expect(result.xhtml).toContain('Violets are blue');
      expect(result.xhtml).toContain('<br/>');
    });

    it('should include footnotes section when requested', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'With Footnotes',
        content: [
          {
            id: 'p1',
            blockType: 'paragraph',
            content: 'Some text with a footnote.',
          } as TextBlock,
        ],
        footnotes: [
          {
            id: 'fn1',
            noteType: 'footnote',
            content: 'This is a footnote.',
            sourceElementId: 'p1',
            markerType: 'number',
            number: 1,
          } as Footnote,
        ],
      };

      const result = convertChapterToXhtml(chapter, {
        includeFootnotesAtEnd: true,
      });

      expect(result.xhtml).toContain('epub:type="footnotes"');
      expect(result.xhtml).toContain('<h2>Footnotes</h2>');
      expect(result.xhtml).toContain('This is a footnote.');
      expect(result.xhtml).toContain('id="fn1"');
      expect(result.metadata.hasFootnotes).toBe(true);
    });

    it('should include endnotes section when requested', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'With Endnotes',
        content: [
          {
            id: 'p1',
            blockType: 'paragraph',
            content: 'Some text with an endnote.',
          } as TextBlock,
        ],
        endnotes: [
          {
            id: 'en1',
            noteType: 'endnote',
            content: 'This is an endnote.',
            sourceElementId: 'p1',
            markerType: 'number',
            number: 1,
          } as Endnote,
        ],
      };

      const result = convertChapterToXhtml(chapter, {
        includeEndnotesAtEnd: true,
      });

      expect(result.xhtml).toContain('epub:type="endnotes"');
      expect(result.xhtml).toContain('<h2>Notes</h2>');
      expect(result.xhtml).toContain('This is an endnote.');
      expect(result.xhtml).toContain('id="en1"');
      expect(result.metadata.hasEndnotes).toBe(true);
    });

    it('should apply custom options', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'Custom Options',
        content: [
          {
            id: 'p1',
            blockType: 'paragraph',
            content: 'Content here.',
          } as TextBlock,
        ],
      };

      const options: ChapterConverterOptions = {
        stylesheets: ['../styles/main.css', '../styles/chapter.css'],
        lang: 'es',
        dir: 'ltr',
        includeChapterNumber: false,
        chapterPrefix: 'Capítulo',
        classPrefix: 'book',
      };

      const result = convertChapterToXhtml(chapter, options);

      expect(result.xhtml).toContain('href="../styles/main.css"');
      expect(result.xhtml).toContain('href="../styles/chapter.css"');
      expect(result.xhtml).toContain('lang="es"');
      expect(result.xhtml).toContain('xml:lang="es"');
      expect(result.title).toBe('Custom Options'); // No number prefix
    });

    it('should handle rich text content', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'Rich Text',
        content: [
          {
            id: 'p1',
            blockType: 'paragraph',
            content: 'Plain fallback',
            richText: {
              plainText: 'This is bold text.',
              segments: [
                { text: 'This is ' },
                { text: 'bold', style: { bold: true } },
                { text: ' text.' },
              ],
            },
          } as TextBlock,
        ],
      };

      const result = convertChapterToXhtml(chapter);

      expect(result.xhtml).toContain('<strong>bold</strong>');
      expect(result.xhtml).toContain('This is <strong>bold</strong> text.');
    });

    it('should escape HTML in plain content by default', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'XSS Test',
        content: [
          {
            id: 'p1',
            blockType: 'paragraph',
            content: '<script>alert("xss")</script>',
          } as TextBlock,
        ],
      };

      const result = convertChapterToXhtml(chapter);

      expect(result.xhtml).toContain('&lt;script&gt;');
      expect(result.xhtml).not.toContain('<script>alert');
    });

    it('should handle empty content array', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'Empty Chapter',
        content: [],
      };

      const result = convertChapterToXhtml(chapter);

      expect(result.xhtml).toContain('<h1>Chapter 1: Empty Chapter</h1>');
      expect(result.xhtml).toContain('epub:type="chapter"');
    });
  });

  describe('convertChaptersToXhtml', () => {
    it('should convert multiple chapters', () => {
      const chapters: Chapter[] = [
        {
          id: 'ch1',
          number: 1,
          title: 'First Chapter',
          content: [
            {
              id: 'p1',
              blockType: 'paragraph',
              content: 'First chapter content.',
            } as TextBlock,
          ],
        },
        {
          id: 'ch2',
          number: 2,
          title: 'Second Chapter',
          content: [
            {
              id: 'p2',
              blockType: 'paragraph',
              content: 'Second chapter content.',
            } as TextBlock,
          ],
        },
      ];

      const results = convertChaptersToXhtml(chapters);

      expect(results).toHaveLength(2);
      expect(results[0].filename).toBe('chapter-1.xhtml');
      expect(results[1].filename).toBe('chapter-2.xhtml');
      expect(results[0].xhtml).toContain('First chapter content.');
      expect(results[1].xhtml).toContain('Second chapter content.');
    });

    it('should apply options to all chapters', () => {
      const chapters: Chapter[] = [
        {
          id: 'ch1',
          number: 1,
          title: 'First',
          content: [
            {
              id: 'p1',
              blockType: 'paragraph',
              content: 'Content 1.',
            } as TextBlock,
          ],
        },
        {
          id: 'ch2',
          number: 2,
          title: 'Second',
          content: [
            {
              id: 'p2',
              blockType: 'paragraph',
              content: 'Content 2.',
            } as TextBlock,
          ],
        },
      ];

      const options: ChapterConverterOptions = {
        stylesheets: ['../styles/common.css'],
        lang: 'fr',
      };

      const results = convertChaptersToXhtml(chapters, options);

      expect(results[0].xhtml).toContain('lang="fr"');
      expect(results[1].xhtml).toContain('lang="fr"');
      expect(results[0].xhtml).toContain('href="../styles/common.css"');
      expect(results[1].xhtml).toContain('href="../styles/common.css"');
    });
  });

  describe('validateChapter', () => {
    it('should validate a valid chapter', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'Valid Chapter',
        content: [
          {
            id: 'p1',
            blockType: 'paragraph',
            content: 'Valid content.',
          } as TextBlock,
        ],
      };

      const result = validateChapter(chapter);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing title', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: '',
        content: [
          {
            id: 'p1',
            blockType: 'paragraph',
            content: 'Content here.',
          } as TextBlock,
        ],
      };

      const result = validateChapter(chapter);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Chapter title is required');
    });

    it('should detect empty content', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'Empty',
        content: [],
      };

      const result = validateChapter(chapter);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Chapter content is empty');
    });

    it('should detect missing blockType', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'Invalid Block',
        content: [
          {
            id: 'p1',
            content: 'Content here.',
          } as any,
        ],
      };

      const result = validateChapter(chapter);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content block 0 missing blockType');
    });

    it('should detect missing content in block', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'Invalid Block',
        content: [
          {
            id: 'p1',
            blockType: 'paragraph',
          } as any,
        ],
      };

      const result = validateChapter(chapter);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Content block 0 has no content');
    });
  });

  describe('filename generation', () => {
    it('should generate numbered filename', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'Test',
        content: [
          {
            id: 'p1',
            blockType: 'paragraph',
            content: 'Content.',
          } as TextBlock,
        ],
      };

      const result = convertChapterToXhtml(chapter);
      expect(result.filename).toBe('chapter-1.xhtml');
    });

    it('should sanitize title for filename when no number', () => {
      const chapter: Chapter = {
        id: 'ch-prologue',
        title: 'The Prologue: A Beginning!',
        content: [
          {
            id: 'p1',
            blockType: 'paragraph',
            content: 'Content.',
          } as TextBlock,
        ],
      };

      const result = convertChapterToXhtml(chapter);
      expect(result.filename).toBe('chapter-the-prologue-a-beginning.xhtml');
    });

    it('should use ID for filename when no title or number', () => {
      const chapter: Chapter = {
        id: 'epilogue',
        title: '',
        content: [
          {
            id: 'p1',
            blockType: 'paragraph',
            content: 'Content.',
          } as TextBlock,
        ],
      };

      const result = convertChapterToXhtml(chapter);
      expect(result.filename).toBe('chapter-epilogue.xhtml');
    });
  });

  describe('XHTML structure validation', () => {
    it('should generate valid XHTML with proper namespaces', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'Test',
        content: [
          {
            id: 'p1',
            blockType: 'paragraph',
            content: 'Content.',
          } as TextBlock,
        ],
      };

      const result = convertChapterToXhtml(chapter);

      expect(result.xhtml).toContain('xmlns="http://www.w3.org/1999/xhtml"');
      expect(result.xhtml).toContain('xmlns:epub="http://www.idpf.org/2007/ops"');
      expect(result.xhtml).toContain('epub:type="chapter"');
    });

    it('should include required XHTML elements', () => {
      const chapter: Chapter = {
        id: 'ch1',
        number: 1,
        title: 'Test',
        content: [
          {
            id: 'p1',
            blockType: 'paragraph',
            content: 'Content.',
          } as TextBlock,
        ],
      };

      const result = convertChapterToXhtml(chapter);

      expect(result.xhtml).toContain('<html');
      expect(result.xhtml).toContain('<head>');
      expect(result.xhtml).toContain('<meta charset="UTF-8"');
      expect(result.xhtml).toContain('<title>');
      expect(result.xhtml).toContain('</head>');
      expect(result.xhtml).toContain('<body');
      expect(result.xhtml).toContain('</body>');
      expect(result.xhtml).toContain('</html>');
    });
  });
});
