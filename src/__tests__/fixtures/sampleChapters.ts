/**
 * Sample chapter fixtures with various formatting for testing
 */

import { Chapter } from '../../types/chapter';
import { TextBlock } from '../../types/textBlock';
import { TextFeature } from '../../types/textFeature';

/**
 * Simple chapter with basic paragraphs
 */
export const simpleChapter: Chapter = {
  id: 'chapter-simple',
  number: 1,
  title: 'The Beginning',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: [
    {
      id: 'block-1',
      blockType: 'heading',
      content: 'Chapter One',
      level: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-2',
      blockType: 'paragraph',
      content: 'It was a bright cold day in April, and the clocks were striking thirteen. The windows were shut and the curtains drawn, and yet there was a chill in the air that seemed to penetrate everything.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-3',
      blockType: 'paragraph',
      content: 'Sarah walked down the empty corridor, her footsteps echoing against the marble floors. She had been summoned here, though she didn\'t know why. The mysterious letter had arrived three days ago, unsigned and cryptic.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
  wordCount: 89,
  includeInToc: true,
};

/**
 * Chapter with scene breaks
 */
export const chapterWithSceneBreaks: Chapter = {
  id: 'chapter-scene-breaks',
  number: 2,
  title: 'Parallel Lives',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: [
    {
      id: 'block-1',
      blockType: 'heading',
      content: 'Chapter Two: Parallel Lives',
      level: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-2',
      blockType: 'paragraph',
      content: 'Marcus opened his laptop in the coffee shop, the familiar smell of espresso filling his nostrils. He had three hours to finish the proposal before the meeting.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-3',
      blockType: 'paragraph',
      content: 'His fingers danced across the keyboard, words flowing effortlessly as he outlined his vision for the project.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      features: [
        {
          id: 'break-1',
          type: 'break',
          breakType: 'scene',
          symbol: '* * *',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
    },
    {
      id: 'block-4',
      blockType: 'paragraph',
      content: 'Across town, Elena sat in the park, watching children play. The sun was warm on her face, and for a moment, she forgot about the troubles that had brought her here.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-5',
      blockType: 'paragraph',
      content: 'She pulled out her notebook and began to sketch the fountain in the center of the plaza.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      features: [
        {
          id: 'break-2',
          type: 'break',
          breakType: 'scene',
          symbol: '***',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
    },
    {
      id: 'block-6',
      blockType: 'paragraph',
      content: 'They would meet that evening, though neither knew it yet. The city had its own plans for them.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
  wordCount: 145,
  includeInToc: true,
};

/**
 * Chapter with block quotes
 */
export const chapterWithBlockQuotes: Chapter = {
  id: 'chapter-quotes',
  number: 3,
  title: 'Words of Wisdom',
  epigraph: 'The unexamined life is not worth living.',
  epigraphAttribution: 'Socrates',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: [
    {
      id: 'block-1',
      blockType: 'heading',
      content: 'Chapter Three: Words of Wisdom',
      level: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-2',
      blockType: 'paragraph',
      content: 'Professor Chen stood before the class, holding up a worn copy of the ancient text. "This passage," he said, "has been debated for centuries."',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-3',
      blockType: 'paragraph',
      content: '',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      features: [
        {
          id: 'quote-1',
          type: 'quote',
          quoteType: 'block',
          content: 'To know oneself is the beginning of wisdom. But to know others, that is the path to enlightenment. We must balance both, for in isolation we lose our humanity, and in crowds we lose ourselves.',
          attribution: 'Master Li',
          source: 'The Book of Inner Light',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
    },
    {
      id: 'block-4',
      blockType: 'paragraph',
      content: 'The students sat in silence, contemplating the words. Sarah raised her hand. "But isn\'t that contradictory? How can we balance both?"',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-5',
      blockType: 'paragraph',
      content: 'Professor Chen smiled. "That, my dear student, is exactly the right question."',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
  wordCount: 112,
  includeInToc: true,
};

/**
 * Chapter with verse/poetry
 */
export const chapterWithVerse: Chapter = {
  id: 'chapter-verse',
  number: 4,
  title: 'Songs in the Night',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: [
    {
      id: 'block-1',
      blockType: 'heading',
      content: 'Chapter Four: Songs in the Night',
      level: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-2',
      blockType: 'paragraph',
      content: 'The old bard sat by the fire and began to sing:',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-3',
      blockType: 'paragraph',
      content: '',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      features: [
        {
          id: 'verse-1',
          type: 'verse',
          lines: [
            'In moonlit halls where shadows play,',
            'The ancient ones still hold their sway,',
            'With whispered words and gentle grace,',
            'They watch us from their timeless place.',
          ],
          stanza: 1,
          indentation: [0, 0, 0, 0],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
    },
    {
      id: 'block-4',
      blockType: 'paragraph',
      content: '',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      features: [
        {
          id: 'verse-2',
          type: 'verse',
          lines: [
            'Through storm and strife we journey on,',
            '  Toward the breaking of the dawn,',
            'With hope as light and love as guide,',
            '  We walk with courage by our side.',
          ],
          stanza: 2,
          indentation: [0, 2, 0, 2],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
    },
    {
      id: 'block-5',
      blockType: 'paragraph',
      content: 'The travelers listened in silence, moved by the melody and the words that spoke to their own journey.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
  wordCount: 98,
  includeInToc: true,
};

/**
 * Chapter with footnotes
 */
export const chapterWithFootnotes: Chapter = {
  id: 'chapter-footnotes',
  number: 5,
  title: 'Historical Context',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: [
    {
      id: 'block-1',
      blockType: 'heading',
      content: 'Chapter Five: Historical Context',
      level: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-2',
      blockType: 'paragraph',
      content: 'The Treaty of Westphalia, signed in 1648, marked the end of the Thirty Years\' War.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      features: [
        {
          id: 'note-1',
          type: 'note',
          noteType: 'footnote',
          content: 'The treaty actually consisted of two separate peace agreements: the Treaty of Münster and the Treaty of Osnabrück.',
          number: 1,
          referenceId: 'ref-1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
    },
    {
      id: 'block-3',
      blockType: 'paragraph',
      content: 'This settlement established the principle of cuius regio, eius religio, allowing rulers to determine the religion of their territories.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      features: [
        {
          id: 'note-2',
          type: 'note',
          noteType: 'footnote',
          content: 'Latin for "whose realm, his religion." This principle was first established at the Peace of Augsburg in 1555 but was reaffirmed and expanded in 1648.',
          number: 2,
          referenceId: 'ref-2',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
    },
    {
      id: 'block-4',
      blockType: 'paragraph',
      content: 'The long-term impact of these agreements shaped European politics for centuries to come, establishing the modern concept of state sovereignty.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      features: [
        {
          id: 'note-3',
          type: 'note',
          noteType: 'footnote',
          content: 'See Chapter 12 for a detailed analysis of how these principles influenced the development of international law.',
          number: 3,
          referenceId: 'ref-3',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ],
    },
  ],
  wordCount: 78,
  includeInToc: true,
};

/**
 * Chapter with multiple heading levels and subheadings
 */
export const chapterWithHeadings: Chapter = {
  id: 'chapter-headings',
  number: 6,
  title: 'A Structured Approach',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: [
    {
      id: 'block-1',
      blockType: 'heading',
      content: 'Chapter Six: A Structured Approach',
      level: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-2',
      blockType: 'paragraph',
      content: 'Understanding complex systems requires a methodical approach. Let us break this down into manageable sections.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-3',
      blockType: 'heading',
      content: 'First Principles',
      level: 2,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-4',
      blockType: 'paragraph',
      content: 'Before diving into specifics, we must establish our foundational assumptions. These will guide our entire analysis.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-5',
      blockType: 'heading',
      content: 'Core Assumptions',
      level: 3,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-6',
      blockType: 'paragraph',
      content: 'We assume that the system operates under normal conditions and that all participants act rationally within their constraints.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-7',
      blockType: 'heading',
      content: 'Practical Applications',
      level: 2,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-8',
      blockType: 'paragraph',
      content: 'With our principles established, we can now examine how these concepts apply in real-world scenarios.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-9',
      blockType: 'heading',
      content: 'Case Study: The Market Disruption',
      level: 3,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-10',
      blockType: 'paragraph',
      content: 'In 2019, an unexpected technological breakthrough changed everything. Companies that had dominated for decades found themselves scrambling to adapt.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
  wordCount: 119,
  includeInToc: true,
};

/**
 * Chapter part of a larger part (e.g., Part II of a book)
 */
export const chapterInPart: Chapter = {
  id: 'chapter-part',
  number: 7,
  title: 'New Beginnings',
  subtitle: 'A Fresh Start',
  partNumber: 2,
  partTitle: 'The Journey Continues',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  content: [
    {
      id: 'block-1',
      blockType: 'heading',
      content: 'Part II: The Journey Continues',
      level: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-2',
      blockType: 'heading',
      content: 'Chapter Seven: New Beginnings',
      level: 2,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-3',
      blockType: 'heading',
      content: 'A Fresh Start',
      level: 3,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-4',
      blockType: 'paragraph',
      content: 'After months of preparation, the day had finally arrived. Emma stood at the airport terminal, her bags packed and her heart full of anticipation.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'block-5',
      blockType: 'paragraph',
      content: 'This was it. The new chapter she had been waiting for. Everything that came before was prologue.',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
  wordCount: 56,
  includeInToc: true,
};

/**
 * Collection of all sample chapters
 */
export const allSampleChapters: Chapter[] = [
  simpleChapter,
  chapterWithSceneBreaks,
  chapterWithBlockQuotes,
  chapterWithVerse,
  chapterWithFootnotes,
  chapterWithHeadings,
  chapterInPart,
];

/**
 * Helper to get a chapter by number
 */
export function getChapterByNumber(number: number): Chapter | undefined {
  return allSampleChapters.find((chapter) => chapter.number === number);
}

/**
 * Helper to get chapters by type of content
 */
export function getChaptersWithFeatureType(
  featureType: TextFeature['type']
): Chapter[] {
  return allSampleChapters.filter((chapter) =>
    chapter.content.some(
      (block) =>
        block.features && block.features.some((f) => f.type === featureType)
    )
  );
}
