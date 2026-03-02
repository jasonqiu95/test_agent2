/**
 * Test fixtures for editor documents
 * Provides sample content for testing editor functionality
 */

/**
 * Empty document fixture
 */
export const emptyDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [],
    },
  ],
};

/**
 * Simple document with basic text
 */
export const simpleDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Hello world' },
      ],
    },
  ],
};

/**
 * Document with formatted text
 */
export const formattedDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'This is ' },
        { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
        { type: 'text', text: ' and ' },
        { type: 'text', text: 'italic', marks: [{ type: 'italic' }] },
        { type: 'text', text: ' text.' },
      ],
    },
  ],
};

/**
 * Document with multiple paragraphs
 */
export const multiParagraphDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'First paragraph.' },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Second paragraph.' },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Third paragraph.' },
      ],
    },
  ],
};

/**
 * Document with headings
 */
export const headingDocument = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [
        { type: 'text', text: 'Main Title' },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Introduction paragraph.' },
      ],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [
        { type: 'text', text: 'Subsection' },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Subsection content.' },
      ],
    },
  ],
};

/**
 * Document with all heading levels
 */
export const allHeadingsDocument = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Heading 1' }],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Heading 2' }],
    },
    {
      type: 'heading',
      attrs: { level: 3 },
      content: [{ type: 'text', text: 'Heading 3' }],
    },
    {
      type: 'heading',
      attrs: { level: 4 },
      content: [{ type: 'text', text: 'Heading 4' }],
    },
    {
      type: 'heading',
      attrs: { level: 5 },
      content: [{ type: 'text', text: 'Heading 5' }],
    },
    {
      type: 'heading',
      attrs: { level: 6 },
      content: [{ type: 'text', text: 'Heading 6' }],
    },
  ],
};

/**
 * Document with all text formatting marks
 */
export const allMarksDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Normal text. ' },
        { type: 'text', text: 'Bold text. ', marks: [{ type: 'bold' }] },
        { type: 'text', text: 'Italic text. ', marks: [{ type: 'italic' }] },
        { type: 'text', text: 'Underline text. ', marks: [{ type: 'underline' }] },
        {
          type: 'text',
          text: 'Bold and italic. ',
          marks: [{ type: 'bold' }, { type: 'italic' }],
        },
      ],
    },
  ],
};

/**
 * Long document for performance testing
 */
export const longDocument = {
  type: 'doc',
  content: Array.from({ length: 100 }, (_, i) => ({
    type: 'paragraph',
    content: [
      {
        type: 'text',
        text: `This is paragraph ${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
      },
    ],
  })),
};

/**
 * Very long document with mixed content
 */
export const veryLongDocument = {
  type: 'doc',
  content: Array.from({ length: 500 }, (_, i) => {
    const type = i % 5 === 0 ? 'heading' : 'paragraph';
    if (type === 'heading') {
      return {
        type: 'heading',
        attrs: { level: Math.min(6, Math.floor(i / 100) + 1) },
        content: [{ type: 'text', text: `Section ${Math.floor(i / 5) + 1}` }],
      };
    }
    return {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: `Paragraph ${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.`,
        },
      ],
    };
  }),
};

/**
 * Document with complex nested content
 */
export const complexDocument = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Complex Document Test' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'This document contains ' },
        { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
        { type: 'text', text: ', ' },
        { type: 'text', text: 'italic', marks: [{ type: 'italic' }] },
        { type: 'text', text: ', and ' },
        { type: 'text', text: 'underlined', marks: [{ type: 'underline' }] },
        { type: 'text', text: ' text.' },
      ],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'Subsection with Formatting' }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Multiple marks combined: ',
        },
        {
          type: 'text',
          text: 'bold and italic',
          marks: [{ type: 'bold' }, { type: 'italic' }],
        },
        {
          type: 'text',
          text: ', and ',
        },
        {
          type: 'text',
          text: 'bold and underlined',
          marks: [{ type: 'bold' }, { type: 'underline' }],
        },
        { type: 'text', text: '.' },
      ],
    },
    {
      type: 'paragraph',
      content: [],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Empty paragraph above.' },
      ],
    },
  ],
};

/**
 * Document for testing word count
 */
export const wordCountDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'One two three four five.' }, // 5 words
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Six seven eight.' }, // 3 words
      ],
    },
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [
        { type: 'text', text: 'Nine ten' }, // 2 words
      ],
    },
  ],
  // Total: 10 words
};

/**
 * Document with special characters
 */
export const specialCharsDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Special characters: !@#$%^&*()_+-=[]{}|;:\'",.<>?/' },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Unicode: 你好世界 🌍 café résumé' },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Emoji test: 😀 👍 ❤️ 🎉' },
      ],
    },
  ],
};

/**
 * Document with whitespace variations
 */
export const whitespaceDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Multiple  spaces  between   words' },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Trailing spaces    ' },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '    Leading spaces' },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Newlines\nand\ntabs\there' },
      ],
    },
  ],
};

/**
 * Create a custom document with specified number of paragraphs
 */
export function createDocumentWithParagraphs(count: number) {
  return {
    type: 'doc',
    content: Array.from({ length: count }, (_, i) => ({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: `Paragraph ${i + 1}`,
        },
      ],
    })),
  };
}

/**
 * Create a document with specified text content
 */
export function createDocumentWithText(text: string) {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text,
          },
        ],
      },
    ],
  };
}

/**
 * Create a document with a heading and text
 */
export function createDocumentWithHeading(level: 1 | 2 | 3 | 4 | 5 | 6, text: string) {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level },
        content: [
          {
            type: 'text',
            text,
          },
        ],
      },
    ],
  };
}
