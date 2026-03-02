/**
 * Manual test for TOC generation
 */

import { HtmlConverter, generateTocHtml } from './src/lib/pdf/bookToHtml';
import { Book } from './src/types/book';
import { Chapter } from './src/types/chapter';
import { Element } from './src/types/element';

// Create a test book with chapters and front/back matter
const testBook: Book = {
  id: 'test-book',
  title: 'The Complete Guide to Book Publishing',
  subtitle: 'A Comprehensive Manual',
  authors: [{ id: 'author-1', name: 'John Doe' }],
  frontMatter: [
    {
      id: 'preface',
      type: 'preface',
      matter: 'front',
      title: 'Preface',
      content: [{ blockType: 'paragraph', content: 'This is the preface.' }],
      createdAt: new Date(),
      updatedAt: new Date(),
      includeInToc: true,
    },
    {
      id: 'intro',
      type: 'introduction',
      matter: 'front',
      title: 'Introduction',
      content: [{ blockType: 'paragraph', content: 'Welcome to the book.' }],
      createdAt: new Date(),
      updatedAt: new Date(),
      includeInToc: true,
    },
  ],
  chapters: [
    {
      id: 'ch1',
      number: 1,
      title: 'Getting Started',
      subtitle: 'The Basics',
      content: [
        { blockType: 'paragraph', content: 'First paragraph.' },
        { blockType: 'heading', level: 1, content: 'Understanding the Fundamentals' },
        { blockType: 'paragraph', content: 'Second paragraph.' },
        { blockType: 'heading', level: 2, content: 'Key Concepts' },
        { blockType: 'paragraph', content: 'Third paragraph.' },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      includeInToc: true,
      partNumber: 1,
      partTitle: 'Part One: Foundations',
    },
    {
      id: 'ch2',
      number: 2,
      title: 'Advanced Techniques',
      content: [
        { blockType: 'paragraph', content: 'Advanced content.' },
        { blockType: 'heading', level: 1, content: 'Pro Tips' },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      includeInToc: true,
      partNumber: 1,
      partTitle: 'Part One: Foundations',
    },
    {
      id: 'ch3',
      number: 3,
      title: 'Publishing Your Work',
      content: [{ blockType: 'paragraph', content: 'Publishing guide.' }],
      createdAt: new Date(),
      updatedAt: new Date(),
      includeInToc: true,
      partNumber: 2,
      partTitle: 'Part Two: Production',
    },
  ],
  backMatter: [
    {
      id: 'appendix',
      type: 'appendix',
      matter: 'back',
      title: 'Appendix A: Resources',
      content: [{ blockType: 'paragraph', content: 'Additional resources.' }],
      createdAt: new Date(),
      updatedAt: new Date(),
      includeInToc: true,
    },
    {
      id: 'about',
      type: 'about-author',
      matter: 'back',
      title: 'About the Author',
      content: [{ blockType: 'paragraph', content: 'Author bio.' }],
      createdAt: new Date(),
      updatedAt: new Date(),
      includeInToc: false, // Don't include in TOC
    },
  ],
  styles: [],
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

console.log('Testing TOC Generation\n');
console.log('='.repeat(80));

// Test 1: Basic TOC with chapters only
console.log('\n1. TOC with chapters depth (no subheadings):');
console.log('-'.repeat(80));
const toc1 = generateTocHtml(testBook, {
  includeToc: true,
  tocDepth: 'chapters',
  includeChapterNumbers: true,
});
console.log(toc1.substring(0, 500) + '...\n');

// Test 2: TOC with subheadings
console.log('\n2. TOC with subheadings depth:');
console.log('-'.repeat(80));
const toc2 = generateTocHtml(testBook, {
  includeToc: true,
  tocDepth: 'subheads',
  tocMaxHeadingLevel: 2,
  includeChapterNumbers: true,
});
console.log(toc2.substring(0, 800) + '...\n');

// Test 3: TOC with page numbers
console.log('\n3. TOC with page numbers:');
console.log('-'.repeat(80));
const toc3 = generateTocHtml(testBook, {
  includeToc: true,
  tocDepth: 'chapters',
  tocIncludePageNumbers: true,
  includeChapterNumbers: true,
});
console.log(toc3.substring(0, 500) + '...\n');

// Test 4: Navigation variant TOC
console.log('\n4. Navigation variant TOC:');
console.log('-'.repeat(80));
const toc4 = generateTocHtml(testBook, {
  includeToc: true,
  tocDepth: 'chapters',
  tocVariant: 'navigation',
  includeChapterNumbers: true,
});
console.log(toc4.substring(0, 500) + '...\n');

// Test 5: Full book conversion with TOC
console.log('\n5. Full book conversion with TOC:');
console.log('-'.repeat(80));
const converter = new HtmlConverter(testBook, {
  includeToc: true,
  tocDepth: 'subheads',
  tocMaxHeadingLevel: 2,
  includeChapterNumbers: true,
  tocVariant: 'front-matter',
});
const fullHtml = converter.convert();
console.log('Full HTML length:', fullHtml.length, 'characters');
console.log('Contains TOC nav element:', fullHtml.includes('<nav'));
console.log('Contains chapter links:', fullHtml.includes('href="#chapter-1-heading"'));
console.log('Contains front matter link:', fullHtml.includes('href="#element-preface"'));
console.log('Contains back matter link:', fullHtml.includes('href="#element-appendix"'));
console.log('Does not contain "About the Author" (includeInToc=false):', !fullHtml.includes('href="#element-about"'));

console.log('\n' + '='.repeat(80));
console.log('Manual testing complete!');
