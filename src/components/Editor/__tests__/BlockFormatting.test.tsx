/**
 * Block-Level Formatting Tests
 * Tests for heading levels, alignment, lists, and block transformations
 */

import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../../../__tests__/utils';
import { createMockChapterStore } from '../../../__tests__/utils/mockChapterStore';
import { Editor } from '../Editor';
import { TextBlock } from '../../../types/textBlock';
import { Chapter } from '../../../types/chapter';
import {
  typeInBlock,
  clickButton,
  pressKey,
  getBlockCount,
  getAllBlockContents,
} from '../../../__tests__/utils/userInteractions';

describe('Block-Level Formatting', () => {
  // Helper to create test chapters with specific block types
  const createTestChapter = (blocks: Partial<TextBlock>[]): Chapter => {
    const fullBlocks: TextBlock[] = blocks.map((block, index) => ({
      id: `block-${index + 1}`,
      content: block.content || '',
      blockType: block.blockType || 'paragraph',
      level: block.level,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...block,
    }));

    return {
      id: 'test-chapter',
      number: 1,
      title: 'Test Chapter',
      content: fullBlocks,
      createdAt: new Date(),
      updatedAt: new Date(),
      wordCount: 0,
      includeInToc: true,
    };
  };

  describe('Heading Levels (H1-H6)', () => {
    it('should apply H1 heading to a paragraph block', async () => {
      const chapter = createTestChapter([
        { content: 'This is a paragraph', blockType: 'paragraph' },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('This is a paragraph')).toBeInTheDocument();
      });

      // Simulate applying H1 format
      const textarea = screen.getByDisplayValue('This is a paragraph');
      textarea.focus();
      await pressKey('1', { meta: true, alt: true }); // Cmd+Alt+1 for H1

      const state = mockStore.getState();
      const updatedBlock = state.content[0];

      // After formatting is applied, block should be heading with level 1
      expect(updatedBlock.blockType).toBe('heading');
      expect(updatedBlock.level).toBe(1);
    });

    it('should apply all heading levels H1 through H6', async () => {
      const blocks: Partial<TextBlock>[] = [];
      for (let i = 1; i <= 6; i++) {
        blocks.push({ content: `Heading ${i}`, blockType: 'paragraph' });
      }

      const chapter = createTestChapter(blocks);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Heading 1')).toBeInTheDocument();
      });

      // Apply each heading level
      for (let level = 1; level <= 6; level++) {
        const textarea = screen.getByDisplayValue(`Heading ${level}`);
        textarea.focus();
        await pressKey(`${level}`, { meta: true, alt: true }); // Cmd+Alt+[1-6]
      }

      const state = mockStore.getState();

      // Verify all blocks are headings with correct levels
      for (let i = 0; i < 6; i++) {
        expect(state.content[i].blockType).toBe('heading');
        expect(state.content[i].level).toBe(i + 1);
      }
    });

    it('should display heading level indicator in block controls', async () => {
      const chapter = createTestChapter([
        { content: 'Main Title', blockType: 'heading', level: 1 },
        { content: 'Subtitle', blockType: 'heading', level: 2 },
        { content: 'Section', blockType: 'heading', level: 3 },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Main Title')).toBeInTheDocument();
      });

      // Each heading block should show its type
      const blocks = document.querySelectorAll('.editor-block');
      expect(blocks).toHaveLength(3);

      // Block type labels should indicate heading
      const typeLabels = document.querySelectorAll('.block-type');
      expect(typeLabels[0]).toHaveTextContent('heading');
      expect(typeLabels[1]).toHaveTextContent('heading');
      expect(typeLabels[2]).toHaveTextContent('heading');
    });
  });

  describe('Paragraph and Heading Conversion', () => {
    it('should convert heading to paragraph', async () => {
      const chapter = createTestChapter([
        { content: 'This is a heading', blockType: 'heading', level: 2 },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('This is a heading')).toBeInTheDocument();
      });

      // Convert to paragraph with Cmd+Alt+0
      const textarea = screen.getByDisplayValue('This is a heading');
      textarea.focus();
      await pressKey('0', { meta: true, alt: true });

      const state = mockStore.getState();
      expect(state.content[0].blockType).toBe('paragraph');
      expect(state.content[0].level).toBeUndefined();
    });

    it('should convert paragraph to heading and back preserving content', async () => {
      const originalContent = 'Test content that should not change';
      const chapter = createTestChapter([
        { content: originalContent, blockType: 'paragraph' },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue(originalContent)).toBeInTheDocument();
      });

      const textarea = screen.getByDisplayValue(originalContent);
      textarea.focus();

      // Convert to H3
      await pressKey('3', { meta: true, alt: true });
      let state = mockStore.getState();
      expect(state.content[0].blockType).toBe('heading');
      expect(state.content[0].level).toBe(3);
      expect(state.content[0].content).toBe(originalContent);

      // Convert back to paragraph
      await pressKey('0', { meta: true, alt: true });
      state = mockStore.getState();
      expect(state.content[0].blockType).toBe('paragraph');
      expect(state.content[0].content).toBe(originalContent);
    });

    it('should change between different heading levels', async () => {
      const chapter = createTestChapter([
        { content: 'Flexible heading', blockType: 'heading', level: 1 },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Flexible heading')).toBeInTheDocument();
      });

      const textarea = screen.getByDisplayValue('Flexible heading');
      textarea.focus();

      // Change from H1 to H4
      await pressKey('4', { meta: true, alt: true });
      let state = mockStore.getState();
      expect(state.content[0].level).toBe(4);

      // Change from H4 to H2
      await pressKey('2', { meta: true, alt: true });
      state = mockStore.getState();
      expect(state.content[0].level).toBe(2);

      // Content should remain unchanged
      expect(state.content[0].content).toBe('Flexible heading');
    });
  });

  describe('Text Alignment', () => {
    it('should apply left alignment to a block', async () => {
      const chapter = createTestChapter([
        { content: 'Left aligned text', blockType: 'paragraph' },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Left aligned text')).toBeInTheDocument();
      });

      const textarea = screen.getByDisplayValue('Left aligned text');
      textarea.focus();
      await pressKey('l', { meta: true, shift: true }); // Cmd+Shift+L for left align

      const state = mockStore.getState();
      const block = state.content[0];
      expect(block.style?.alignment).toBe('left');
    });

    it('should apply center alignment to a block', async () => {
      const chapter = createTestChapter([
        { content: 'Center aligned text', blockType: 'paragraph' },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Center aligned text')).toBeInTheDocument();
      });

      const textarea = screen.getByDisplayValue('Center aligned text');
      textarea.focus();
      await pressKey('e', { meta: true, shift: true }); // Cmd+Shift+E for center align

      const state = mockStore.getState();
      const block = state.content[0];
      expect(block.style?.alignment).toBe('center');
    });

    it('should apply right alignment to a block', async () => {
      const chapter = createTestChapter([
        { content: 'Right aligned text', blockType: 'paragraph' },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Right aligned text')).toBeInTheDocument();
      });

      const textarea = screen.getByDisplayValue('Right aligned text');
      textarea.focus();
      await pressKey('r', { meta: true, shift: true }); // Cmd+Shift+R for right align

      const state = mockStore.getState();
      const block = state.content[0];
      expect(block.style?.alignment).toBe('right');
    });

    it('should apply justify alignment to a block', async () => {
      const chapter = createTestChapter([
        { content: 'Justified text that should be aligned on both sides', blockType: 'paragraph' },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Justified text that should be aligned on both sides')).toBeInTheDocument();
      });

      const textarea = screen.getByDisplayValue('Justified text that should be aligned on both sides');
      textarea.focus();
      await pressKey('j', { meta: true, shift: true }); // Cmd+Shift+J for justify

      const state = mockStore.getState();
      const block = state.content[0];
      expect(block.style?.alignment).toBe('justify');
    });

    it('should change alignment from one type to another', async () => {
      const chapter = createTestChapter([
        { content: 'Flexible alignment', blockType: 'paragraph' },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Flexible alignment')).toBeInTheDocument();
      });

      const textarea = screen.getByDisplayValue('Flexible alignment');
      textarea.focus();

      // Apply center
      await pressKey('e', { meta: true, shift: true });
      let state = mockStore.getState();
      expect(state.content[0].style?.alignment).toBe('center');

      // Change to right
      await pressKey('r', { meta: true, shift: true });
      state = mockStore.getState();
      expect(state.content[0].style?.alignment).toBe('right');

      // Change to left
      await pressKey('l', { meta: true, shift: true });
      state = mockStore.getState();
      expect(state.content[0].style?.alignment).toBe('left');
    });
  });

  describe('List Formatting', () => {
    it('should convert paragraph to unordered list', async () => {
      const chapter = createTestChapter([
        { content: 'First item', blockType: 'paragraph' },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('First item')).toBeInTheDocument();
      });

      const textarea = screen.getByDisplayValue('First item');
      textarea.focus();
      await pressKey('8', { meta: true, shift: true }); // Cmd+Shift+8 for bullet list

      const state = mockStore.getState();
      const block = state.content[0];
      expect(block.blockType).toBe('list');
      expect(block.listType).toBe('unordered');
    });

    it('should convert paragraph to ordered list', async () => {
      const chapter = createTestChapter([
        { content: 'First item', blockType: 'paragraph' },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('First item')).toBeInTheDocument();
      });

      const textarea = screen.getByDisplayValue('First item');
      textarea.focus();
      await pressKey('7', { meta: true, shift: true }); // Cmd+Shift+7 for numbered list

      const state = mockStore.getState();
      const block = state.content[0];
      expect(block.blockType).toBe('list');
      expect(block.listType).toBe('ordered');
    });

    it('should convert list back to paragraph', async () => {
      const chapter = createTestChapter([
        {
          content: 'List item',
          blockType: 'list' as any,
          listType: 'unordered' as any,
        },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('List item')).toBeInTheDocument();
      });

      const textarea = screen.getByDisplayValue('List item');
      textarea.focus();
      // Toggle list off (same shortcut)
      await pressKey('8', { meta: true, shift: true });

      const state = mockStore.getState();
      expect(state.content[0].blockType).toBe('paragraph');
    });

    it('should convert between ordered and unordered lists', async () => {
      const chapter = createTestChapter([
        {
          content: 'List item',
          blockType: 'list' as any,
          listType: 'unordered' as any,
        },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('List item')).toBeInTheDocument();
      });

      const textarea = screen.getByDisplayValue('List item');
      textarea.focus();

      // Convert to ordered list
      await pressKey('7', { meta: true, shift: true });
      let state = mockStore.getState();
      expect(state.content[0].listType).toBe('ordered');

      // Convert back to unordered
      await pressKey('8', { meta: true, shift: true });
      state = mockStore.getState();
      expect(state.content[0].listType).toBe('unordered');
    });
  });

  describe('Nested Lists', () => {
    it('should increase list indent level with Tab', async () => {
      const chapter = createTestChapter([
        { content: 'Item 1', blockType: 'list' as any, listType: 'unordered' as any },
        { content: 'Item 2', blockType: 'list' as any, listType: 'unordered' as any },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Item 2')).toBeInTheDocument();
      });

      const textarea = screen.getByDisplayValue('Item 2');
      textarea.focus();
      await pressKey('Tab');

      const state = mockStore.getState();
      const block = state.content[1];
      expect(block.indentLevel).toBe(1);
    });

    it('should decrease list indent level with Shift+Tab', async () => {
      const chapter = createTestChapter([
        { content: 'Item 1', blockType: 'list' as any, listType: 'unordered' as any },
        {
          content: 'Item 2',
          blockType: 'list' as any,
          listType: 'unordered' as any,
          indentLevel: 1 as any,
        },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Item 2')).toBeInTheDocument();
      });

      const textarea = screen.getByDisplayValue('Item 2');
      textarea.focus();
      await pressKey('Tab', { shift: true });

      const state = mockStore.getState();
      const block = state.content[1];
      expect(block.indentLevel).toBe(0);
    });

    it('should maintain nested structure with multiple levels', async () => {
      const chapter = createTestChapter([
        { content: 'Level 0', blockType: 'list' as any, listType: 'unordered' as any },
        { content: 'Level 1', blockType: 'list' as any, listType: 'unordered' as any },
        { content: 'Level 2', blockType: 'list' as any, listType: 'unordered' as any },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Level 0')).toBeInTheDocument();
      });

      // Indent Level 1
      const level1 = screen.getByDisplayValue('Level 1');
      level1.focus();
      await pressKey('Tab');

      // Indent Level 2 twice
      const level2 = screen.getByDisplayValue('Level 2');
      level2.focus();
      await pressKey('Tab');
      await pressKey('Tab');

      const state = mockStore.getState();
      expect(state.content[0].indentLevel || 0).toBe(0);
      expect(state.content[1].indentLevel).toBe(1);
      expect(state.content[2].indentLevel).toBe(2);
    });

    it('should not indent beyond maximum nesting level', async () => {
      const chapter = createTestChapter([
        {
          content: 'Deep item',
          blockType: 'list' as any,
          listType: 'unordered' as any,
          indentLevel: 5 as any,
        },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Deep item')).toBeInTheDocument();
      });

      const textarea = screen.getByDisplayValue('Deep item');
      textarea.focus();
      await pressKey('Tab');

      const state = mockStore.getState();
      // Should not exceed maximum nesting (typically 5 or 6 levels)
      expect(state.content[0].indentLevel).toBeLessThanOrEqual(6);
    });
  });

  describe('Block Format Keyboard Shortcuts', () => {
    it('should have consistent keyboard shortcuts for all formats', async () => {
      const chapter = createTestChapter([
        { content: 'Test block', blockType: 'paragraph' },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test block')).toBeInTheDocument();
      });

      const textarea = screen.getByDisplayValue('Test block');

      // Test all shortcuts
      const shortcuts = [
        { key: '1', mod: { meta: true, alt: true }, expected: { blockType: 'heading', level: 1 } },
        { key: '2', mod: { meta: true, alt: true }, expected: { blockType: 'heading', level: 2 } },
        { key: '0', mod: { meta: true, alt: true }, expected: { blockType: 'paragraph' } },
        { key: '8', mod: { meta: true, shift: true }, expected: { blockType: 'list', listType: 'unordered' } },
        { key: '7', mod: { meta: true, shift: true }, expected: { blockType: 'list', listType: 'ordered' } },
      ];

      for (const shortcut of shortcuts) {
        textarea.focus();
        await pressKey(shortcut.key, shortcut.mod);

        const state = mockStore.getState();
        const block = state.content[0];

        expect(block.blockType).toBe(shortcut.expected.blockType);
        if (shortcut.expected.level !== undefined) {
          expect(block.level).toBe(shortcut.expected.level);
        }
        if (shortcut.expected.listType !== undefined) {
          expect(block.listType).toBe(shortcut.expected.listType);
        }
      }
    });

    it('should show keyboard shortcuts in toolbar tooltips', async () => {
      const chapter = createTestChapter([
        { content: 'Test', blockType: 'paragraph' },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
      });

      // Formatting toolbar buttons should have tooltips showing shortcuts
      const formatButtons = screen.queryAllByRole('button', { name: /heading|align|list/i });
      formatButtons.forEach((button) => {
        // Each button should have a title attribute with the keyboard shortcut
        expect(button).toHaveAttribute('title');
      });
    });
  });

  describe('Multiple Block Selection and Formatting', () => {
    it('should apply format to multiple selected blocks', async () => {
      const chapter = createTestChapter([
        { content: 'Block 1', blockType: 'paragraph' },
        { content: 'Block 2', blockType: 'paragraph' },
        { content: 'Block 3', blockType: 'paragraph' },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Block 1')).toBeInTheDocument();
      });

      // Select multiple blocks (simulated with Shift+Click or Cmd+A)
      const block1 = screen.getByDisplayValue('Block 1');
      const block2 = screen.getByDisplayValue('Block 2');
      const block3 = screen.getByDisplayValue('Block 3');

      // Focus first block
      block1.focus();
      // Extend selection to last block (Shift+click simulation)
      await pressKey('a', { meta: true, shift: true }); // Select all blocks

      // Apply H2 format to selection
      await pressKey('2', { meta: true, alt: true });

      const state = mockStore.getState();
      // All selected blocks should be H2
      expect(state.content[0].blockType).toBe('heading');
      expect(state.content[0].level).toBe(2);
      expect(state.content[1].blockType).toBe('heading');
      expect(state.content[1].level).toBe(2);
      expect(state.content[2].blockType).toBe('heading');
      expect(state.content[2].level).toBe(2);
    });

    it('should apply alignment to multiple selected blocks', async () => {
      const chapter = createTestChapter([
        { content: 'Block 1', blockType: 'paragraph' },
        { content: 'Block 2', blockType: 'paragraph' },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Block 1')).toBeInTheDocument();
      });

      // Select both blocks
      const block1 = screen.getByDisplayValue('Block 1');
      block1.focus();
      await pressKey('a', { meta: true, shift: true });

      // Apply center alignment
      await pressKey('e', { meta: true, shift: true });

      const state = mockStore.getState();
      expect(state.content[0].style?.alignment).toBe('center');
      expect(state.content[1].style?.alignment).toBe('center');
    });

    it('should convert multiple blocks to list simultaneously', async () => {
      const chapter = createTestChapter([
        { content: 'Item 1', blockType: 'paragraph' },
        { content: 'Item 2', blockType: 'paragraph' },
        { content: 'Item 3', blockType: 'paragraph' },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Item 1')).toBeInTheDocument();
      });

      // Select all blocks
      const block1 = screen.getByDisplayValue('Item 1');
      block1.focus();
      await pressKey('a', { meta: true, shift: true });

      // Convert to ordered list
      await pressKey('7', { meta: true, shift: true });

      const state = mockStore.getState();
      state.content.forEach((block) => {
        expect(block.blockType).toBe('list');
        expect(block.listType).toBe('ordered');
      });
    });
  });

  describe('Block Type Changes in Editor State', () => {
    it('should update editor state immediately when block type changes', async () => {
      const chapter = createTestChapter([
        { content: 'Test content', blockType: 'paragraph' },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test content')).toBeInTheDocument();
      });

      // Initial state
      let state = mockStore.getState();
      expect(state.content[0].blockType).toBe('paragraph');
      expect(state.isDirty).toBe(false);

      // Change to heading
      const textarea = screen.getByDisplayValue('Test content');
      textarea.focus();
      await pressKey('1', { meta: true, alt: true });

      // State should update
      state = mockStore.getState();
      expect(state.content[0].blockType).toBe('heading');
      expect(state.content[0].level).toBe(1);
      expect(state.isDirty).toBe(true); // Should mark as dirty
    });

    it('should preserve block metadata when changing type', async () => {
      const timestamp = new Date();
      const chapter = createTestChapter([
        {
          id: 'test-block-id',
          content: 'Original content',
          blockType: 'paragraph',
          createdAt: timestamp,
        },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Original content')).toBeInTheDocument();
      });

      const textarea = screen.getByDisplayValue('Original content');
      textarea.focus();
      await pressKey('3', { meta: true, alt: true });

      const state = mockStore.getState();
      const block = state.content[0];

      // Metadata should be preserved
      expect(block.id).toBe('test-block-id');
      expect(block.content).toBe('Original content');
      expect(block.createdAt).toEqual(timestamp);
      // updatedAt should be updated
      expect(block.updatedAt.getTime()).toBeGreaterThanOrEqual(timestamp.getTime());
    });

    it('should support undo/redo for block type changes', async () => {
      const chapter = createTestChapter([
        { content: 'Test block', blockType: 'paragraph' },
      ]);

      const mockStore = createMockChapterStore({
        chapters: [chapter],
        initialState: {
          activeChapterId: 'test-chapter',
          content: chapter.content,
          isLoading: false,
          isDirty: false,
          undoRedoState: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
        },
      });

      renderWithProviders(<Editor store={mockStore} initialChapterId="test-chapter" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test block')).toBeInTheDocument();
      });

      // Change to heading
      const textarea = screen.getByDisplayValue('Test block');
      textarea.focus();
      await pressKey('2', { meta: true, alt: true });

      let state = mockStore.getState();
      expect(state.content[0].blockType).toBe('heading');
      expect(state.undoRedoState.canUndo).toBe(true);

      // Undo the change
      await clickButton(/undo/i);

      state = mockStore.getState();
      expect(state.content[0].blockType).toBe('paragraph');
      expect(state.undoRedoState.canRedo).toBe(true);

      // Redo the change
      await clickButton(/redo/i);

      state = mockStore.getState();
      expect(state.content[0].blockType).toBe('heading');
      expect(state.content[0].level).toBe(2);
    });
  });
});
