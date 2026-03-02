/**
 * Test inline text formatting functionality
 */

import { HtmlConverter } from './src/lib/pdf/bookToHtml';
import { Book } from './src/types/book';
import { Chapter } from './src/types/chapter';
import { TextBlock } from './src/types/textBlock';
import { LinkReference, FootnoteReference } from './src/types/inlineText';

// Create a test book with inline formatting
const testBook: Book = {
  id: 'test-book',
  title: 'Test Book',
  subtitle: 'Testing Inline Formatting',
  authors: [{ id: 'author-1', name: 'Test Author' }],
  frontMatter: [],
  backMatter: [],
  styles: [],
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  chapters: [
    {
      id: 'chapter-1',
      number: 1,
      title: 'Chapter 1',
      content: [
        {
          id: 'para-1',
          blockType: 'paragraph',
          content: 'This is a simple paragraph with bold, italic, and underline.',
          richText: {
            segments: [
              { text: 'This is a simple paragraph with ' },
              { text: 'bold', style: { bold: true } },
              { text: ', ' },
              { text: 'italic', style: { italic: true } },
              { text: ', and ' },
              { text: 'underline', style: { underline: true } },
              { text: '.' },
            ],
            plainText: 'This is a simple paragraph with bold, italic, and underline.',
          },
        } as TextBlock,
        {
          id: 'para-2',
          blockType: 'paragraph',
          content: 'Testing strikethrough, superscript, and subscript.',
          richText: {
            segments: [
              { text: 'Testing ' },
              { text: 'strikethrough', style: { strikethrough: true } },
              { text: ', ' },
              { text: 'superscript', style: { superscript: true } },
              { text: ', and ' },
              { text: 'subscript', style: { subscript: true } },
              { text: '.' },
            ],
            plainText: 'Testing strikethrough, superscript, and subscript.',
          },
        } as TextBlock,
        {
          id: 'para-3',
          blockType: 'paragraph',
          content: 'Nested formatting: bold italic underline text.',
          richText: {
            segments: [
              { text: 'Nested formatting: ' },
              {
                text: 'bold italic underline',
                style: { bold: true, italic: true, underline: true },
              },
              { text: ' text.' },
            ],
            plainText: 'Nested formatting: bold italic underline text.',
          },
        } as TextBlock,
        {
          id: 'para-4',
          blockType: 'paragraph',
          content: 'Visit our website for more information.',
          richText: {
            segments: [
              { text: 'Visit ' },
              {
                type: 'link',
                text: 'our website',
                url: 'https://example.com',
                title: 'Example Website',
                target: '_blank',
              } as LinkReference,
              { text: ' for more information.' },
            ],
            plainText: 'Visit our website for more information.',
          },
        } as TextBlock,
        {
          id: 'para-5',
          blockType: 'paragraph',
          content: 'This has a footnote reference.',
          richText: {
            segments: [
              { text: 'This has a footnote reference' },
              {
                type: 'footnote',
                referenceId: 'fn1',
              } as FootnoteReference,
              { text: '.' },
            ],
            plainText: 'This has a footnote reference.',
          },
        } as TextBlock,
      ],
    } as Chapter,
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Convert to HTML
const converter = new HtmlConverter(testBook);
const html = converter.convert();

console.log('Generated HTML:');
console.log('='.repeat(80));
console.log(html);
console.log('='.repeat(80));
console.log('\nTest completed successfully!');
