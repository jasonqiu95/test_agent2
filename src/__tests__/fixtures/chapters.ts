/**
 * Test fixtures for chapters and chapter content
 */

import { Chapter } from '../../types/chapter';
import { TextBlock } from '../../types/textBlock';

/**
 * Create a mock text block with default values
 */
export function createMockTextBlock(overrides?: Partial<TextBlock>): TextBlock {
  const now = new Date();
  return {
    id: `block-${Math.random().toString(36).substr(2, 9)}`,
    content: 'Sample paragraph content',
    blockType: 'paragraph',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create a mock chapter with default values
 */
export function createMockChapter(overrides?: Partial<Chapter>): Chapter {
  const now = new Date();
  return {
    id: `chapter-${Math.random().toString(36).substr(2, 9)}`,
    title: 'Test Chapter',
    number: 1,
    content: [
      createMockTextBlock({ content: 'First paragraph' }),
      createMockTextBlock({ content: 'Second paragraph' }),
    ],
    includeInToc: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Sample text blocks for testing
 */
export const sampleTextBlocks: TextBlock[] = [
  createMockTextBlock({
    id: 'block-1',
    content: 'This is the first paragraph of the chapter.',
    blockType: 'paragraph',
  }),
  createMockTextBlock({
    id: 'block-2',
    content: 'Chapter One',
    blockType: 'heading',
    level: 1,
  }),
  createMockTextBlock({
    id: 'block-3',
    content: 'This is a longer paragraph with multiple sentences. It contains more text to simulate real content. This helps test word count and rendering.',
    blockType: 'paragraph',
  }),
  createMockTextBlock({
    id: 'block-4',
    content: 'function hello() {\n  console.log("Hello, World!");\n}',
    blockType: 'code',
    language: 'javascript',
  }),
  createMockTextBlock({
    id: 'block-5',
    content: 'A Subsection',
    blockType: 'heading',
    level: 2,
  }),
];

/**
 * Sample chapters for testing
 */
export const sampleChapters: Chapter[] = [
  createMockChapter({
    id: 'chapter-1',
    title: 'The Beginning',
    number: 1,
    content: [
      createMockTextBlock({
        content: 'It was a dark and stormy night...',
        blockType: 'paragraph',
      }),
      createMockTextBlock({
        content: 'The protagonist walked slowly down the street.',
        blockType: 'paragraph',
      }),
    ],
  }),
  createMockChapter({
    id: 'chapter-2',
    title: 'The Middle',
    number: 2,
    subtitle: 'Where things get interesting',
    content: [
      createMockTextBlock({
        content: 'Chapter Two',
        blockType: 'heading',
        level: 1,
      }),
      createMockTextBlock({
        content: 'The plot thickens as our hero discovers a mystery.',
        blockType: 'paragraph',
      }),
    ],
  }),
  createMockChapter({
    id: 'chapter-3',
    title: 'The End',
    number: 3,
    content: [
      createMockTextBlock({
        content: 'And they lived happily ever after.',
        blockType: 'paragraph',
      }),
    ],
  }),
];

/**
 * Empty chapter for testing
 */
export const emptyChapter: Chapter = createMockChapter({
  id: 'chapter-empty',
  title: 'Empty Chapter',
  content: [],
});

/**
 * Chapter with complex content for testing
 */
export const complexChapter: Chapter = createMockChapter({
  id: 'chapter-complex',
  title: 'Complex Chapter',
  subtitle: 'Testing various block types',
  epigraph: 'To be or not to be',
  epigraphAttribution: 'Shakespeare',
  content: [
    createMockTextBlock({
      id: 'complex-1',
      content: 'Introduction',
      blockType: 'heading',
      level: 1,
    }),
    createMockTextBlock({
      id: 'complex-2',
      content: 'This chapter contains multiple types of content blocks.',
      blockType: 'paragraph',
    }),
    createMockTextBlock({
      id: 'complex-3',
      content: 'Section One',
      blockType: 'heading',
      level: 2,
    }),
    createMockTextBlock({
      id: 'complex-4',
      content: 'Regular paragraph with normal text.',
      blockType: 'paragraph',
    }),
    createMockTextBlock({
      id: 'complex-5',
      content: 'const example = "code block";\nconsole.log(example);',
      blockType: 'code',
      language: 'typescript',
    }),
    createMockTextBlock({
      id: 'complex-6',
      content: 'Section Two',
      blockType: 'heading',
      level: 2,
    }),
    createMockTextBlock({
      id: 'complex-7',
      content: '    Preformatted text\n    with preserved    spacing',
      blockType: 'preformatted',
    }),
  ],
});

/**
 * Create multiple chapters for navigation testing
 */
export function createChapterSequence(count: number): Chapter[] {
  return Array.from({ length: count }, (_, i) =>
    createMockChapter({
      id: `chapter-${i + 1}`,
      title: `Chapter ${i + 1}`,
      number: i + 1,
      content: [
        createMockTextBlock({
          content: `Content for chapter ${i + 1}`,
        }),
      ],
    })
  );
}

/**
 * Create a chapter with specific word count
 */
export function createChapterWithWordCount(wordCount: number): Chapter {
  const words = Array.from({ length: wordCount }, (_, i) => `word${i}`);
  const content = words.join(' ');

  return createMockChapter({
    title: `Chapter with ${wordCount} words`,
    content: [
      createMockTextBlock({
        content,
        blockType: 'paragraph',
      }),
    ],
    wordCount,
  });
}
