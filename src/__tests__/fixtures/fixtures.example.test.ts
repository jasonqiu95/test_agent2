/**
 * Example tests demonstrating how to use the book content fixtures
 *
 * These are examples only - actual tests should be implemented
 * in component test files.
 */

import {
  sampleBook,
  minimalBook,
  simpleChapter,
  chapterWithSceneBreaks,
  chapterWithBlockQuotes,
  chapterWithVerse,
  chapterWithFootnotes,
  chapterWithHeadings,
  getChapterByNumber,
  getChaptersWithFeatureType,
  getElementByType,
  getElementsByMatter,
  createTextBlock,
  allSampleChapters,
  sampleAuthors,
} from './index';

// Example: Testing with a complete book
describe('Complete Book Fixture', () => {
  it('should have all required book properties', () => {
    expect(sampleBook.id).toBe('book-sample-1');
    expect(sampleBook.title).toBe('The Journey Beyond');
    expect(sampleBook.authors).toHaveLength(2);
    expect(sampleBook.frontMatter).toHaveLength(7);
    expect(sampleBook.chapters).toHaveLength(7);
    expect(sampleBook.backMatter).toHaveLength(5);
  });

  it('should have proper metadata', () => {
    expect(sampleBook.metadata.isbn).toBe('978-0-123456-78-9');
    expect(sampleBook.metadata.publisher).toBe('Narrative Press');
    expect(sampleBook.metadata.genre).toContain('Fiction');
  });
});

// Example: Testing with minimal book
describe('Minimal Book Fixture', () => {
  it('should have minimal content', () => {
    expect(minimalBook.chapters).toHaveLength(1);
    expect(minimalBook.frontMatter).toHaveLength(1);
    expect(minimalBook.backMatter).toHaveLength(0);
    expect(minimalBook.status).toBe('draft');
  });
});

// Example: Testing individual chapters
describe('Chapter Fixtures', () => {
  it('should load simple chapter', () => {
    expect(simpleChapter.number).toBe(1);
    expect(simpleChapter.title).toBe('The Beginning');
    expect(simpleChapter.content).toHaveLength(3);
  });

  it('should have scene breaks in chapter 2', () => {
    const breaks = chapterWithSceneBreaks.content.filter(
      (block) => block.features?.some((f) => f.type === 'break')
    );
    expect(breaks.length).toBeGreaterThan(0);
  });

  it('should have block quotes in chapter 3', () => {
    const quotes = chapterWithBlockQuotes.content.filter(
      (block) => block.features?.some((f) => f.type === 'quote')
    );
    expect(quotes.length).toBeGreaterThan(0);
  });

  it('should have verse in chapter 4', () => {
    const verses = chapterWithVerse.content.filter(
      (block) => block.features?.some((f) => f.type === 'verse')
    );
    expect(verses).toHaveLength(2);
  });

  it('should have footnotes in chapter 5', () => {
    const notes = chapterWithFootnotes.content.filter(
      (block) => block.features?.some((f) => f.type === 'note')
    );
    expect(notes).toHaveLength(3);
  });

  it('should have multiple heading levels', () => {
    const headings = chapterWithHeadings.content.filter(
      (block) => block.blockType === 'heading'
    );
    expect(headings.length).toBeGreaterThan(3);

    const levels = headings.map((h) => h.level).filter(Boolean);
    expect(levels).toContain(1);
    expect(levels).toContain(2);
    expect(levels).toContain(3);
  });
});

// Example: Testing with helper functions
describe('Helper Functions', () => {
  it('should get chapter by number', () => {
    const chapter3 = getChapterByNumber(3);
    expect(chapter3).toBeDefined();
    expect(chapter3?.title).toBe('Words of Wisdom');
  });

  it('should get chapters with verse features', () => {
    const chaptersWithVerse = getChaptersWithFeatureType('verse');
    expect(chaptersWithVerse.length).toBeGreaterThan(0);
    expect(chaptersWithVerse[0].id).toBe('chapter-verse');
  });

  it('should get chapters with notes', () => {
    const chaptersWithNotes = getChaptersWithFeatureType('note');
    expect(chaptersWithNotes.length).toBeGreaterThan(0);
  });

  it('should get element by type', () => {
    const dedication = getElementByType(sampleBook.frontMatter, 'dedication');
    expect(dedication).toBeDefined();
    expect(dedication?.title).toBe('Dedication');
  });

  it('should get front matter elements', () => {
    const frontMatter = getElementsByMatter(sampleBook, 'front');
    expect(frontMatter).toHaveLength(7);
  });

  it('should get back matter elements', () => {
    const backMatter = getElementsByMatter(sampleBook, 'back');
    expect(backMatter).toHaveLength(5);
  });

  it('should create text block', () => {
    const block = createTextBlock('Test content', 'paragraph');
    expect(block.content).toBe('Test content');
    expect(block.blockType).toBe('paragraph');
    expect(block.id).toBeDefined();
    expect(block.createdAt).toBeInstanceOf(Date);
  });
});

// Example: Testing author fixtures
describe('Author Fixtures', () => {
  it('should have sample authors', () => {
    expect(sampleAuthors).toHaveLength(2);
    expect(sampleAuthors[0].name).toBe('Jane Anderson');
    expect(sampleAuthors[0].role).toBe('author');
    expect(sampleAuthors[1].name).toBe('Michael Chen');
    expect(sampleAuthors[1].role).toBe('co-author');
  });
});

// Example: Testing all chapters collection
describe('All Sample Chapters', () => {
  it('should have all chapters', () => {
    expect(allSampleChapters).toHaveLength(7);
  });

  it('should have sequential chapter numbers', () => {
    const numbers = allSampleChapters.map((ch) => ch.number).filter(Boolean);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('all chapters should have content', () => {
    allSampleChapters.forEach((chapter) => {
      expect(chapter.content.length).toBeGreaterThan(0);
    });
  });
});

// Example: Testing front matter
describe('Front Matter Elements', () => {
  it('should have title page', () => {
    const titlePage = getElementByType(sampleBook.frontMatter, 'title-page');
    expect(titlePage).toBeDefined();
    expect(titlePage?.content[0].content).toBe('The Journey Beyond');
  });

  it('should have copyright', () => {
    const copyright = getElementByType(sampleBook.frontMatter, 'copyright');
    expect(copyright).toBeDefined();
  });

  it('should have dedication', () => {
    const dedication = getElementByType(sampleBook.frontMatter, 'dedication');
    expect(dedication).toBeDefined();
  });

  it('should have prologue', () => {
    const prologue = getElementByType(sampleBook.frontMatter, 'prologue');
    expect(prologue).toBeDefined();
    expect(prologue?.includeInToc).toBe(true);
  });
});

// Example: Testing back matter
describe('Back Matter Elements', () => {
  it('should have epilogue', () => {
    const epilogue = getElementByType(sampleBook.backMatter, 'epilogue');
    expect(epilogue).toBeDefined();
  });

  it('should have about author', () => {
    const aboutAuthor = getElementByType(sampleBook.backMatter, 'about-author');
    expect(aboutAuthor).toBeDefined();
  });

  it('should have appendix', () => {
    const appendix = getElementByType(sampleBook.backMatter, 'appendix');
    expect(appendix).toBeDefined();
  });

  it('should have bibliography', () => {
    const bibliography = getElementByType(sampleBook.backMatter, 'bibliography');
    expect(bibliography).toBeDefined();
  });
});

// Example: Testing text features
describe('Text Features', () => {
  it('should have scene breaks with symbols', () => {
    const block = chapterWithSceneBreaks.content[2];
    const breakFeature = block.features?.find((f) => f.type === 'break');
    expect(breakFeature).toBeDefined();
    if (breakFeature?.type === 'break') {
      expect(breakFeature.breakType).toBe('scene');
      expect(breakFeature.symbol).toBe('* * *');
    }
  });

  it('should have quotes with attribution', () => {
    const block = chapterWithBlockQuotes.content.find(
      (b) => b.features?.some((f) => f.type === 'quote')
    );
    const quote = block?.features?.find((f) => f.type === 'quote');
    expect(quote).toBeDefined();
    if (quote?.type === 'quote') {
      expect(quote.attribution).toBe('Master Li');
      expect(quote.source).toBe('The Book of Inner Light');
    }
  });

  it('should have verse with indentation', () => {
    const block = chapterWithVerse.content.find(
      (b) => b.features?.some((f) => f.type === 'verse')
    );
    const verse = block?.features?.find((f) => f.type === 'verse');
    expect(verse).toBeDefined();
    if (verse?.type === 'verse') {
      expect(verse.lines).toHaveLength(4);
      expect(verse.indentation).toBeDefined();
    }
  });

  it('should have footnotes with numbers', () => {
    const block = chapterWithFootnotes.content.find(
      (b) => b.features?.some((f) => f.type === 'note')
    );
    const note = block?.features?.find((f) => f.type === 'note');
    expect(note).toBeDefined();
    if (note?.type === 'note') {
      expect(note.noteType).toBe('footnote');
      expect(note.number).toBeDefined();
    }
  });
});
