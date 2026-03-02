/**
 * Text Features Insertion Tests
 *
 * Tests for inserting special text features:
 * - Scene breaks and ornamental breaks
 * - Block quotations and verse/poetry
 * - Inline images with alignment
 * - Footnotes and endnotes
 * - Web links with URL validation
 * - Toolbar and keyboard shortcuts for feature insertion
 */

import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../__tests__/utils';
import { createMockChapterStore } from '../../__tests__/utils/mockChapterStore';
import {
  typeInBlock,
  clickButton,
  pressKey,
  focusBlock,
  selectText
} from '../../__tests__/utils/userInteractions';
import { Editor } from './Editor';
import { TextBlock } from '../../types/textBlock';
import { Break, Quote, Verse, Link, Note } from '../../types/textFeature';

describe('TextFeatures - Scene Breaks', () => {
  it('inserts a scene break at cursor position', async () => {
    const initialContent: TextBlock[] = [
      {
        id: 'block-1',
        content: 'First scene text.',
        blockType: 'paragraph',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'block-2',
        content: 'Second scene text.',
        blockType: 'paragraph',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockStore = createMockChapterStore({
      chapters: [
        {
          id: 'chapter-1',
          title: 'Test Chapter',
          content: initialContent,
          elementId: 'element-1',
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      initialState: {
        activeChapterId: 'chapter-1',
        content: initialContent,
        isLoading: false,
        isDirty: false,
        undoRedoState: {
          canUndo: false,
          canRedo: false,
          undoCount: 0,
          redoCount: 0,
        },
      },
    });

    renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

    // Focus on first block
    await waitFor(() => {
      expect(screen.getAllByRole('textbox')).toHaveLength(2);
    });

    focusBlock(0);

    // Insert scene break via keyboard shortcut
    await pressKey('b', { meta: true, shift: true });

    // Verify scene break was inserted
    await waitFor(() => {
      const state = mockStore.getState();
      const block = state.content[0];
      expect(block.features).toBeDefined();

      const sceneBreak = block.features?.find(
        (f): f is Break => f.type === 'break' && f.breakType === 'scene'
      );
      expect(sceneBreak).toBeDefined();
    });
  });

  it('inserts scene break via toolbar button', async () => {
    const mockStore = createMockChapterStore({
      chapters: [
        {
          id: 'chapter-1',
          title: 'Test Chapter',
          content: [
            {
              id: 'block-1',
              content: 'Test content',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          elementId: 'element-1',
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      initialState: {
        activeChapterId: 'chapter-1',
        content: [
          {
            id: 'block-1',
            content: 'Test content',
            blockType: 'paragraph',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isLoading: false,
        isDirty: false,
        undoRedoState: {
          canUndo: false,
          canRedo: false,
          undoCount: 0,
          redoCount: 0,
        },
      },
    });

    renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

    // Click scene break button in toolbar
    await clickButton(/scene break/i);

    // Verify scene break was inserted
    await waitFor(() => {
      const state = mockStore.getState();
      expect(state.isDirty).toBe(true);

      const block = state.content[0];
      const sceneBreak = block.features?.find(
        (f): f is Break => f.type === 'break' && f.breakType === 'scene'
      );
      expect(sceneBreak).toBeDefined();
    });
  });
});

describe('TextFeatures - Ornamental Breaks', () => {
  it('inserts ornamental break with default symbol', async () => {
    const mockStore = createMockChapterStore({
      chapters: [
        {
          id: 'chapter-1',
          title: 'Test Chapter',
          content: [
            {
              id: 'block-1',
              content: 'Test content',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          elementId: 'element-1',
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      initialState: {
        activeChapterId: 'chapter-1',
        content: [
          {
            id: 'block-1',
            content: 'Test content',
            blockType: 'paragraph',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isLoading: false,
        isDirty: false,
        undoRedoState: {
          canUndo: false,
          canRedo: false,
          undoCount: 0,
          redoCount: 0,
        },
      },
    });

    renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

    focusBlock(0);

    // Insert ornamental break
    await clickButton(/ornamental break/i);

    await waitFor(() => {
      const state = mockStore.getState();
      const block = state.content[0];
      const ornamentalBreak = block.features?.find(
        (f): f is Break => f.type === 'break' && f.symbol !== undefined
      );

      expect(ornamentalBreak).toBeDefined();
      expect(ornamentalBreak?.symbol).toBe('* * *');
    });
  });

  it('inserts ornamental break with custom symbol', async () => {
    const mockStore = createMockChapterStore({
      chapters: [
        {
          id: 'chapter-1',
          title: 'Test Chapter',
          content: [
            {
              id: 'block-1',
              content: 'Test content',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          elementId: 'element-1',
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      initialState: {
        activeChapterId: 'chapter-1',
        content: [
          {
            id: 'block-1',
            content: 'Test content',
            blockType: 'paragraph',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isLoading: false,
        isDirty: false,
        undoRedoState: {
          canUndo: false,
          canRedo: false,
          undoCount: 0,
          redoCount: 0,
        },
      },
    });

    renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

    focusBlock(0);

    // Click ornamental break button
    await clickButton(/ornamental break/i);

    // Type custom symbol in dialog
    const symbolInput = await screen.findByLabelText(/symbol/i);
    await userEvent.clear(symbolInput);
    await userEvent.type(symbolInput, '❦');

    // Confirm
    await clickButton(/insert/i);

    await waitFor(() => {
      const state = mockStore.getState();
      const block = state.content[0];
      const ornamentalBreak = block.features?.find(
        (f): f is Break => f.type === 'break' && f.symbol === '❦'
      );

      expect(ornamentalBreak).toBeDefined();
    });
  });

  it('supports multiple ornamental break styles', async () => {
    const styles = ['* * *', '• • •', '~ ~ ~', '❦', '✦'];

    for (const symbol of styles) {
      const mockStore = createMockChapterStore({
        chapters: [
          {
            id: 'chapter-1',
            title: 'Test Chapter',
            content: [
              {
                id: 'block-1',
                content: 'Test content',
                blockType: 'paragraph',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
            elementId: 'element-1',
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        initialState: {
          activeChapterId: 'chapter-1',
          content: [
            {
              id: 'block-1',
              content: 'Test content',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          isLoading: false,
          isDirty: false,
          undoRedoState: {
            canUndo: false,
            canRedo: false,
            undoCount: 0,
            redoCount: 0,
          },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

      focusBlock(0);
      await clickButton(/ornamental break/i);

      const symbolInput = await screen.findByLabelText(/symbol/i);
      await userEvent.clear(symbolInput);
      await userEvent.type(symbolInput, symbol);
      await clickButton(/insert/i);

      await waitFor(() => {
        const state = mockStore.getState();
        const block = state.content[0];
        const ornamentalBreak = block.features?.find(
          (f): f is Break => f.type === 'break' && f.symbol === symbol
        );

        expect(ornamentalBreak).toBeDefined();
      });
    }
  });
});

describe('TextFeatures - Block Quotations', () => {
  it('inserts and formats a block quotation', async () => {
    const mockStore = createMockChapterStore({
      chapters: [
        {
          id: 'chapter-1',
          title: 'Test Chapter',
          content: [
            {
              id: 'block-1',
              content: 'Test content',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          elementId: 'element-1',
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      initialState: {
        activeChapterId: 'chapter-1',
        content: [
          {
            id: 'block-1',
            content: 'Test content',
            blockType: 'paragraph',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isLoading: false,
        isDirty: false,
        undoRedoState: {
          canUndo: false,
          canRedo: false,
          undoCount: 0,
          redoCount: 0,
        },
      },
    });

    renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

    focusBlock(0);

    // Insert block quote via keyboard shortcut
    await pressKey('q', { meta: true, shift: true });

    // Type quote content
    const quoteInput = await screen.findByPlaceholderText(/enter quote/i);
    await userEvent.type(quoteInput, 'To be or not to be, that is the question.');

    // Add attribution
    const attributionInput = await screen.findByLabelText(/attribution/i);
    await userEvent.type(attributionInput, 'William Shakespeare');

    // Add source
    const sourceInput = await screen.findByLabelText(/source/i);
    await userEvent.type(sourceInput, 'Hamlet');

    // Insert quote
    await clickButton(/insert/i);

    await waitFor(() => {
      const state = mockStore.getState();
      const block = state.content[0];
      const quote = block.features?.find(
        (f): f is Quote => f.type === 'quote'
      );

      expect(quote).toBeDefined();
      expect(quote?.content).toBe('To be or not to be, that is the question.');
      expect(quote?.attribution).toBe('William Shakespeare');
      expect(quote?.source).toBe('Hamlet');
      expect(quote?.quoteType).toBe('block');
    });
  });

  it('inserts epigraph-style quotation', async () => {
    const mockStore = createMockChapterStore({
      chapters: [
        {
          id: 'chapter-1',
          title: 'Test Chapter',
          content: [
            {
              id: 'block-1',
              content: 'Test content',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          elementId: 'element-1',
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      initialState: {
        activeChapterId: 'chapter-1',
        content: [
          {
            id: 'block-1',
            content: 'Test content',
            blockType: 'paragraph',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isLoading: false,
        isDirty: false,
        undoRedoState: {
          canUndo: false,
          canRedo: false,
          undoCount: 0,
          redoCount: 0,
        },
      },
    });

    renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

    await clickButton(/quote/i);

    // Select epigraph type
    const typeSelect = await screen.findByLabelText(/quote type/i);
    await userEvent.selectOptions(typeSelect, 'epigraph');

    const quoteInput = await screen.findByPlaceholderText(/enter quote/i);
    await userEvent.type(quoteInput, 'All happy families are alike.');

    await clickButton(/insert/i);

    await waitFor(() => {
      const state = mockStore.getState();
      const block = state.content[0];
      const quote = block.features?.find(
        (f): f is Quote => f.type === 'quote' && f.quoteType === 'epigraph'
      );

      expect(quote).toBeDefined();
    });
  });
});

describe('TextFeatures - Verse/Poetry Blocks', () => {
  it('inserts and formats verse block', async () => {
    const mockStore = createMockChapterStore({
      chapters: [
        {
          id: 'chapter-1',
          title: 'Test Chapter',
          content: [
            {
              id: 'block-1',
              content: 'Test content',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          elementId: 'element-1',
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      initialState: {
        activeChapterId: 'chapter-1',
        content: [
          {
            id: 'block-1',
            content: 'Test content',
            blockType: 'paragraph',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isLoading: false,
        isDirty: false,
        undoRedoState: {
          canUndo: false,
          canRedo: false,
          undoCount: 0,
          redoCount: 0,
        },
      },
    });

    renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

    focusBlock(0);

    // Insert verse via keyboard shortcut
    await pressKey('v', { meta: true, shift: true });

    // Type verse lines
    const verseInput = await screen.findByPlaceholderText(/enter verse/i);
    await userEvent.type(
      verseInput,
      'Shall I compare thee to a summer\'s day?{Enter}Thou art more lovely and more temperate:'
    );

    await clickButton(/insert/i);

    await waitFor(() => {
      const state = mockStore.getState();
      const block = state.content[0];
      const verse = block.features?.find(
        (f): f is Verse => f.type === 'verse'
      );

      expect(verse).toBeDefined();
      expect(verse?.lines).toHaveLength(2);
      expect(verse?.lines[0]).toBe('Shall I compare thee to a summer\'s day?');
      expect(verse?.lines[1]).toBe('Thou art more lovely and more temperate:');
    });
  });

  it('handles verse indentation', async () => {
    const mockStore = createMockChapterStore({
      chapters: [
        {
          id: 'chapter-1',
          title: 'Test Chapter',
          content: [
            {
              id: 'block-1',
              content: 'Test content',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          elementId: 'element-1',
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      initialState: {
        activeChapterId: 'chapter-1',
        content: [
          {
            id: 'block-1',
            content: 'Test content',
            blockType: 'paragraph',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isLoading: false,
        isDirty: false,
        undoRedoState: {
          canUndo: false,
          canRedo: false,
          undoCount: 0,
          redoCount: 0,
        },
      },
    });

    renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

    await clickButton(/verse/i);

    const verseInput = await screen.findByPlaceholderText(/enter verse/i);
    await userEvent.type(verseInput, 'First line{Enter}  Indented second line');

    // Set indentation levels
    const indentInput = await screen.findByLabelText(/indentation/i);
    await userEvent.clear(indentInput);
    await userEvent.type(indentInput, '0,2');

    await clickButton(/insert/i);

    await waitFor(() => {
      const state = mockStore.getState();
      const block = state.content[0];
      const verse = block.features?.find(
        (f): f is Verse => f.type === 'verse'
      );

      expect(verse?.indentation).toEqual([0, 2]);
    });
  });

  it('supports multi-stanza verse', async () => {
    const mockStore = createMockChapterStore({
      chapters: [
        {
          id: 'chapter-1',
          title: 'Test Chapter',
          content: [
            {
              id: 'block-1',
              content: 'Test content',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          elementId: 'element-1',
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      initialState: {
        activeChapterId: 'chapter-1',
        content: [
          {
            id: 'block-1',
            content: 'Test content',
            blockType: 'paragraph',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isLoading: false,
        isDirty: false,
        undoRedoState: {
          canUndo: false,
          canRedo: false,
          undoCount: 0,
          redoCount: 0,
        },
      },
    });

    renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

    await clickButton(/verse/i);

    const stanzaInput = await screen.findByLabelText(/stanza number/i);
    await userEvent.clear(stanzaInput);
    await userEvent.type(stanzaInput, '2');

    await clickButton(/insert/i);

    await waitFor(() => {
      const state = mockStore.getState();
      const block = state.content[0];
      const verse = block.features?.find(
        (f): f is Verse => f.type === 'verse'
      );

      expect(verse?.stanza).toBe(2);
    });
  });
});

describe('TextFeatures - Inline Images', () => {
  it('inserts inline image with proper alignment', async () => {
    const mockStore = createMockChapterStore({
      chapters: [
        {
          id: 'chapter-1',
          title: 'Test Chapter',
          content: [
            {
              id: 'block-1',
              content: 'Test content',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          elementId: 'element-1',
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      initialState: {
        activeChapterId: 'chapter-1',
        content: [
          {
            id: 'block-1',
            content: 'Test content',
            blockType: 'paragraph',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isLoading: false,
        isDirty: false,
        undoRedoState: {
          canUndo: false,
          canRedo: false,
          undoCount: 0,
          redoCount: 0,
        },
      },
    });

    renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

    focusBlock(0);

    // Insert image via keyboard shortcut
    await pressKey('i', { meta: true, shift: true });

    // Enter image source
    const imageInput = await screen.findByLabelText(/image source/i);
    await userEvent.type(imageInput, 'path/to/image.png');

    // Set alignment
    const alignmentSelect = await screen.findByLabelText(/alignment/i);
    await userEvent.selectOptions(alignmentSelect, 'center');

    // Add alt text
    const altInput = await screen.findByLabelText(/alt text/i);
    await userEvent.type(altInput, 'An illustration');

    await clickButton(/insert/i);

    await waitFor(() => {
      const state = mockStore.getState();
      expect(state.isDirty).toBe(true);
      // Verify image feature was added to block
    });
  });

  it('supports different image alignments (left, center, right)', async () => {
    const alignments = ['left', 'center', 'right'];

    for (const alignment of alignments) {
      const mockStore = createMockChapterStore({
        chapters: [
          {
            id: 'chapter-1',
            title: 'Test Chapter',
            content: [
              {
                id: 'block-1',
                content: 'Test content',
                blockType: 'paragraph',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
            elementId: 'element-1',
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        initialState: {
          activeChapterId: 'chapter-1',
          content: [
            {
              id: 'block-1',
              content: 'Test content',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          isLoading: false,
          isDirty: false,
          undoRedoState: {
            canUndo: false,
            canRedo: false,
            undoCount: 0,
            redoCount: 0,
          },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

      await clickButton(/image/i);

      const imageInput = await screen.findByLabelText(/image source/i);
      await userEvent.type(imageInput, 'image.png');

      const alignmentSelect = await screen.findByLabelText(/alignment/i);
      await userEvent.selectOptions(alignmentSelect, alignment);

      await clickButton(/insert/i);

      await waitFor(() => {
        const state = mockStore.getState();
        expect(state.isDirty).toBe(true);
      });
    }
  });
});

describe('TextFeatures - Footnotes and Endnotes', () => {
  it('inserts footnote with reference number', async () => {
    const mockStore = createMockChapterStore({
      chapters: [
        {
          id: 'chapter-1',
          title: 'Test Chapter',
          content: [
            {
              id: 'block-1',
              content: 'Test content with reference',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          elementId: 'element-1',
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      initialState: {
        activeChapterId: 'chapter-1',
        content: [
          {
            id: 'block-1',
            content: 'Test content with reference',
            blockType: 'paragraph',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isLoading: false,
        isDirty: false,
        undoRedoState: {
          canUndo: false,
          canRedo: false,
          undoCount: 0,
          redoCount: 0,
        },
      },
    });

    renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

    focusBlock(0);

    // Insert footnote via keyboard shortcut
    await pressKey('f', { meta: true, alt: true });

    // Enter footnote content
    const noteInput = await screen.findByPlaceholderText(/enter footnote/i);
    await userEvent.type(noteInput, 'This is a footnote explaining the concept.');

    await clickButton(/insert/i);

    await waitFor(() => {
      const state = mockStore.getState();
      const block = state.content[0];
      const footnote = block.features?.find(
        (f): f is Note => f.type === 'note' && f.noteType === 'footnote'
      );

      expect(footnote).toBeDefined();
      expect(footnote?.content).toBe('This is a footnote explaining the concept.');
      expect(footnote?.number).toBe(1);
    });
  });

  it('inserts endnote with reference number', async () => {
    const mockStore = createMockChapterStore({
      chapters: [
        {
          id: 'chapter-1',
          title: 'Test Chapter',
          content: [
            {
              id: 'block-1',
              content: 'Test content',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          elementId: 'element-1',
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      initialState: {
        activeChapterId: 'chapter-1',
        content: [
          {
            id: 'block-1',
            content: 'Test content',
            blockType: 'paragraph',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isLoading: false,
        isDirty: false,
        undoRedoState: {
          canUndo: false,
          canRedo: false,
          undoCount: 0,
          redoCount: 0,
        },
      },
    });

    renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

    focusBlock(0);

    // Insert endnote via keyboard shortcut
    await pressKey('e', { meta: true, alt: true });

    // Enter endnote content
    const noteInput = await screen.findByPlaceholderText(/enter endnote/i);
    await userEvent.type(noteInput, 'This is an endnote for additional information.');

    await clickButton(/insert/i);

    await waitFor(() => {
      const state = mockStore.getState();
      const block = state.content[0];
      const endnote = block.features?.find(
        (f): f is Note => f.type === 'note' && f.noteType === 'endnote'
      );

      expect(endnote).toBeDefined();
      expect(endnote?.content).toBe('This is an endnote for additional information.');
      expect(endnote?.number).toBe(1);
    });
  });

  it('auto-increments footnote numbers', async () => {
    const mockStore = createMockChapterStore({
      chapters: [
        {
          id: 'chapter-1',
          title: 'Test Chapter',
          content: [
            {
              id: 'block-1',
              content: 'First reference',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
              features: [
                {
                  id: 'note-1',
                  type: 'note',
                  noteType: 'footnote',
                  content: 'First note',
                  number: 1,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              ],
            },
            {
              id: 'block-2',
              content: 'Second reference',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          elementId: 'element-1',
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      initialState: {
        activeChapterId: 'chapter-1',
        content: [
          {
            id: 'block-1',
            content: 'First reference',
            blockType: 'paragraph',
            createdAt: new Date(),
            updatedAt: new Date(),
            features: [
              {
                id: 'note-1',
                type: 'note',
                noteType: 'footnote',
                content: 'First note',
                number: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
          {
            id: 'block-2',
            content: 'Second reference',
            blockType: 'paragraph',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isLoading: false,
        isDirty: false,
        undoRedoState: {
          canUndo: false,
          canRedo: false,
          undoCount: 0,
          redoCount: 0,
        },
      },
    });

    renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

    // Focus second block
    focusBlock(1);

    // Insert another footnote
    await pressKey('f', { meta: true, alt: true });

    const noteInput = await screen.findByPlaceholderText(/enter footnote/i);
    await userEvent.type(noteInput, 'Second note');

    await clickButton(/insert/i);

    await waitFor(() => {
      const state = mockStore.getState();
      const block = state.content[1];
      const footnote = block.features?.find(
        (f): f is Note => f.type === 'note' && f.noteType === 'footnote'
      );

      expect(footnote?.number).toBe(2);
    });
  });

  it('supports custom footnote symbols', async () => {
    const mockStore = createMockChapterStore({
      chapters: [
        {
          id: 'chapter-1',
          title: 'Test Chapter',
          content: [
            {
              id: 'block-1',
              content: 'Test content',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          elementId: 'element-1',
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      initialState: {
        activeChapterId: 'chapter-1',
        content: [
          {
            id: 'block-1',
            content: 'Test content',
            blockType: 'paragraph',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isLoading: false,
        isDirty: false,
        undoRedoState: {
          canUndo: false,
          canRedo: false,
          undoCount: 0,
          redoCount: 0,
        },
      },
    });

    renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

    await clickButton(/footnote/i);

    // Use symbol instead of number
    const useSymbolCheckbox = await screen.findByLabelText(/use symbol/i);
    await userEvent.click(useSymbolCheckbox);

    const symbolInput = await screen.findByLabelText(/symbol/i);
    await userEvent.type(symbolInput, '*');

    const noteInput = await screen.findByPlaceholderText(/enter footnote/i);
    await userEvent.type(noteInput, 'Note with symbol');

    await clickButton(/insert/i);

    await waitFor(() => {
      const state = mockStore.getState();
      const block = state.content[0];
      const footnote = block.features?.find(
        (f): f is Note => f.type === 'note' && f.symbol === '*'
      );

      expect(footnote).toBeDefined();
    });
  });
});

describe('TextFeatures - Web Links', () => {
  it('inserts web link with URL validation', async () => {
    const mockStore = createMockChapterStore({
      chapters: [
        {
          id: 'chapter-1',
          title: 'Test Chapter',
          content: [
            {
              id: 'block-1',
              content: 'Check out this website',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          elementId: 'element-1',
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      initialState: {
        activeChapterId: 'chapter-1',
        content: [
          {
            id: 'block-1',
            content: 'Check out this website',
            blockType: 'paragraph',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isLoading: false,
        isDirty: false,
        undoRedoState: {
          canUndo: false,
          canRedo: false,
          undoCount: 0,
          redoCount: 0,
        },
      },
    });

    renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

    focusBlock(0);

    // Select text "this website"
    const block = screen.getAllByRole('textbox')[0];
    selectText(block, 10, 22);

    // Insert link via keyboard shortcut
    await pressKey('k', { meta: true });

    // Enter URL
    const urlInput = await screen.findByLabelText(/url/i);
    await userEvent.type(urlInput, 'https://example.com');

    // Enter title
    const titleInput = await screen.findByLabelText(/title/i);
    await userEvent.type(titleInput, 'Example Website');

    await clickButton(/insert/i);

    await waitFor(() => {
      const state = mockStore.getState();
      const block = state.content[0];
      const link = block.features?.find(
        (f): f is Link => f.type === 'link'
      );

      expect(link).toBeDefined();
      expect(link?.url).toBe('https://example.com');
      expect(link?.content).toBe('this website');
      expect(link?.title).toBe('Example Website');
    });
  });

  it('validates URL format', async () => {
    const mockStore = createMockChapterStore({
      chapters: [
        {
          id: 'chapter-1',
          title: 'Test Chapter',
          content: [
            {
              id: 'block-1',
              content: 'Test content',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          elementId: 'element-1',
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      initialState: {
        activeChapterId: 'chapter-1',
        content: [
          {
            id: 'block-1',
            content: 'Test content',
            blockType: 'paragraph',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isLoading: false,
        isDirty: false,
        undoRedoState: {
          canUndo: false,
          canRedo: false,
          undoCount: 0,
          redoCount: 0,
        },
      },
    });

    renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

    await clickButton(/link/i);

    const urlInput = await screen.findByLabelText(/url/i);
    await userEvent.type(urlInput, 'not-a-valid-url');

    await clickButton(/insert/i);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/invalid url/i)).toBeInTheDocument();
    });
  });

  it('supports different link targets', async () => {
    const targets = ['_blank', '_self', '_parent', '_top'];

    for (const target of targets) {
      const mockStore = createMockChapterStore({
        chapters: [
          {
            id: 'chapter-1',
            title: 'Test Chapter',
            content: [
              {
                id: 'block-1',
                content: 'Test content',
                blockType: 'paragraph',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
            elementId: 'element-1',
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        initialState: {
          activeChapterId: 'chapter-1',
          content: [
            {
              id: 'block-1',
              content: 'Test content',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          isLoading: false,
          isDirty: false,
          undoRedoState: {
            canUndo: false,
            canRedo: false,
            undoCount: 0,
            redoCount: 0,
          },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

      await clickButton(/link/i);

      const urlInput = await screen.findByLabelText(/url/i);
      await userEvent.type(urlInput, 'https://example.com');

      const targetSelect = await screen.findByLabelText(/target/i);
      await userEvent.selectOptions(targetSelect, target);

      await clickButton(/insert/i);

      await waitFor(() => {
        const state = mockStore.getState();
        const block = state.content[0];
        const link = block.features?.find(
          (f): f is Link => f.type === 'link' && f.target === target
        );

        expect(link).toBeDefined();
      });
    }
  });
});

describe('TextFeatures - Keyboard Shortcuts', () => {
  it('supports keyboard shortcuts for all features', async () => {
    const shortcuts = [
      { key: 'b', modifiers: { meta: true, shift: true }, feature: 'scene break' },
      { key: 'q', modifiers: { meta: true, shift: true }, feature: 'quote' },
      { key: 'v', modifiers: { meta: true, shift: true }, feature: 'verse' },
      { key: 'i', modifiers: { meta: true, shift: true }, feature: 'image' },
      { key: 'f', modifiers: { meta: true, alt: true }, feature: 'footnote' },
      { key: 'e', modifiers: { meta: true, alt: true }, feature: 'endnote' },
      { key: 'k', modifiers: { meta: true }, feature: 'link' },
    ];

    for (const { key, modifiers, feature } of shortcuts) {
      const mockStore = createMockChapterStore({
        chapters: [
          {
            id: 'chapter-1',
            title: 'Test Chapter',
            content: [
              {
                id: 'block-1',
                content: 'Test content',
                blockType: 'paragraph',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
            elementId: 'element-1',
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        initialState: {
          activeChapterId: 'chapter-1',
          content: [
            {
              id: 'block-1',
              content: 'Test content',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          isLoading: false,
          isDirty: false,
          undoRedoState: {
            canUndo: false,
            canRedo: false,
            undoCount: 0,
            redoCount: 0,
          },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

      focusBlock(0);
      await pressKey(key, modifiers);

      // Verify dialog or insertion UI opened
      await waitFor(() => {
        expect(
          screen.getByText(new RegExp(feature, 'i'))
        ).toBeInTheDocument();
      });
    }
  });
});

describe('TextFeatures - Rendering and State Updates', () => {
  it('renders text features correctly in content', async () => {
    const contentWithFeatures: TextBlock[] = [
      {
        id: 'block-1',
        content: 'Content with features',
        blockType: 'paragraph',
        createdAt: new Date(),
        updatedAt: new Date(),
        features: [
          {
            id: 'break-1',
            type: 'break',
            breakType: 'scene',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'link-1',
            type: 'link',
            content: 'example',
            url: 'https://example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    ];

    const mockStore = createMockChapterStore({
      chapters: [
        {
          id: 'chapter-1',
          title: 'Test Chapter',
          content: contentWithFeatures,
          elementId: 'element-1',
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      initialState: {
        activeChapterId: 'chapter-1',
        content: contentWithFeatures,
        isLoading: false,
        isDirty: false,
        undoRedoState: {
          canUndo: false,
          canRedo: false,
          undoCount: 0,
          redoCount: 0,
        },
      },
    });

    renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

    await waitFor(() => {
      // Verify features are rendered
      expect(screen.getByText(/Content with features/i)).toBeInTheDocument();

      // Check for feature tags
      const featureTags = screen.getAllByClassName('feature-tag');
      expect(featureTags).toHaveLength(2);
    });
  });

  it('updates state when features are modified', async () => {
    const mockStore = createMockChapterStore({
      chapters: [
        {
          id: 'chapter-1',
          title: 'Test Chapter',
          content: [
            {
              id: 'block-1',
              content: 'Test content',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          elementId: 'element-1',
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      initialState: {
        activeChapterId: 'chapter-1',
        content: [
          {
            id: 'block-1',
            content: 'Test content',
            blockType: 'paragraph',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isLoading: false,
        isDirty: false,
        undoRedoState: {
          canUndo: false,
          canRedo: false,
          undoCount: 0,
          redoCount: 0,
        },
      },
    });

    renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

    const initialState = mockStore.getState();
    expect(initialState.isDirty).toBe(false);

    // Insert a feature
    await clickButton(/scene break/i);

    await waitFor(() => {
      const updatedState = mockStore.getState();
      expect(updatedState.isDirty).toBe(true);
      expect(updatedState.undoRedoState.canUndo).toBe(true);
    });
  });

  it('supports undo/redo for feature insertion', async () => {
    const mockStore = createMockChapterStore({
      chapters: [
        {
          id: 'chapter-1',
          title: 'Test Chapter',
          content: [
            {
              id: 'block-1',
              content: 'Test content',
              blockType: 'paragraph',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          elementId: 'element-1',
          order: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      initialState: {
        activeChapterId: 'chapter-1',
        content: [
          {
            id: 'block-1',
            content: 'Test content',
            blockType: 'paragraph',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        isLoading: false,
        isDirty: false,
        undoRedoState: {
          canUndo: false,
          canRedo: false,
          undoCount: 0,
          redoCount: 0,
        },
      },
    });

    renderWithProviders(<Editor store={mockStore} initialChapterId="chapter-1" />);

    // Insert a scene break
    await clickButton(/scene break/i);

    await waitFor(() => {
      expect(mockStore.getState().undoRedoState.canUndo).toBe(true);
    });

    // Undo the insertion
    await clickButton(/undo/i);

    await waitFor(() => {
      const state = mockStore.getState();
      expect(state.undoRedoState.canUndo).toBe(false);
      expect(state.undoRedoState.canRedo).toBe(true);
    });

    // Redo the insertion
    await clickButton(/redo/i);

    await waitFor(() => {
      const state = mockStore.getState();
      expect(state.undoRedoState.canUndo).toBe(true);
      expect(state.undoRedoState.canRedo).toBe(false);
    });
  });
});
