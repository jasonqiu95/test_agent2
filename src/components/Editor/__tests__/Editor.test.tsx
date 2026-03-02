/**
 * Editor Component Tests
 * Basic rendering scenarios and state management
 */

import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import { renderWithProviders } from '../../../__tests__/utils';
import { createMockChapterStore } from '../../../__tests__/utils/mockChapterStore';
import { sampleChapters, complexChapter, emptyChapter } from '../../../__tests__/fixtures';
import { Editor } from '../Editor';

describe('Editor - Basic Rendering Tests', () => {
  describe('Empty State', () => {
    it('renders empty state when no chapter selected', () => {
      const mockStore = createMockChapterStore({
        chapters: sampleChapters,
      });

      renderWithProviders(<Editor store={mockStore} />);

      expect(screen.getByText(/select a chapter to start editing/i)).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('renders empty state with proper structure', () => {
      const mockStore = createMockChapterStore({
        chapters: sampleChapters,
      });

      const { container } = renderWithProviders(<Editor store={mockStore} />);

      const editorContainer = container.querySelector('.editor-container');
      expect(editorContainer).toBeInTheDocument();

      const emptyState = container.querySelector('.editor-empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveTextContent('Select a chapter to start editing');
    });
  });

  describe('Loading State', () => {
    it('shows loading state during content fetch', async () => {
      const mockStore = createMockChapterStore({
        chapters: sampleChapters,
        loadDelay: 100,
      });

      renderWithProviders(
        <Editor store={mockStore} initialChapterId="chapter-1" />
      );

      // Initially should show loading
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).toBeInTheDocument();
      });

      // Then should show content
      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('displays chapter title during loading', async () => {
      const mockStore = createMockChapterStore({
        chapters: sampleChapters,
        loadDelay: 100,
      });

      renderWithProviders(
        <Editor store={mockStore} initialChapterId="chapter-1" />
      );

      await waitFor(() => {
        const loadingOverlay = screen.queryByText(/loading/i);
        expect(loadingOverlay).toBeInTheDocument();
      });
    });

    it('removes loading state after content loads', async () => {
      const mockStore = createMockChapterStore({
        chapters: sampleChapters,
        loadDelay: 50,
      });

      renderWithProviders(
        <Editor store={mockStore} initialChapterId="chapter-1" />
      );

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Chapter Content Rendering', () => {
    it('renders chapter content correctly with proper structure', async () => {
      const mockStore = createMockChapterStore({
        chapters: sampleChapters,
        initialState: {
          activeChapterId: 'chapter-1',
          content: sampleChapters[0].content,
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

      const { container } = renderWithProviders(
        <Editor store={mockStore} initialChapterId="chapter-1" />
      );

      await waitFor(() => {
        const editorContent = container.querySelector('.editor-content');
        expect(editorContent).toBeInTheDocument();
        expect(editorContent).toHaveAttribute('data-chapter-id', 'chapter-1');
      });

      // Verify content blocks are rendered
      const editorBlocks = container.querySelector('.editor-blocks');
      expect(editorBlocks).toBeInTheDocument();

      // Verify text blocks are present
      const textareas = screen.getAllByRole('textbox');
      expect(textareas.length).toBeGreaterThan(0);
    });

    it('renders chapter with multiple text blocks', async () => {
      const mockStore = createMockChapterStore({
        chapters: [complexChapter],
        initialState: {
          activeChapterId: 'chapter-complex',
          content: complexChapter.content,
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

      const { container } = renderWithProviders(
        <Editor store={mockStore} initialChapterId="chapter-complex" />
      );

      await waitFor(() => {
        const editorBlocks = container.querySelectorAll('.editor-block');
        expect(editorBlocks.length).toBe(complexChapter.content.length);
      });
    });

    it('renders different block types correctly', async () => {
      const mockStore = createMockChapterStore({
        chapters: [complexChapter],
        initialState: {
          activeChapterId: 'chapter-complex',
          content: complexChapter.content,
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

      const { container } = renderWithProviders(
        <Editor store={mockStore} initialChapterId="chapter-complex" />
      );

      await waitFor(() => {
        // Check for heading blocks
        const headingBlock = container.querySelector('.block-heading');
        expect(headingBlock).toBeInTheDocument();

        // Check for paragraph blocks
        const paragraphBlock = container.querySelector('.block-paragraph');
        expect(paragraphBlock).toBeInTheDocument();

        // Check for code blocks
        const codeBlock = container.querySelector('.block-code');
        expect(codeBlock).toBeInTheDocument();
      });
    });
  });

  describe('Chapter Title and Metadata', () => {
    it('displays chapter title', async () => {
      const mockStore = createMockChapterStore({
        chapters: sampleChapters,
        initialState: {
          activeChapterId: 'chapter-1',
          content: sampleChapters[0].content,
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

      renderWithProviders(
        <Editor store={mockStore} initialChapterId="chapter-1" />
      );

      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });
    });

    it('displays chapter metadata in editor content', async () => {
      const mockStore = createMockChapterStore({
        chapters: sampleChapters,
        initialState: {
          activeChapterId: 'chapter-2',
          content: sampleChapters[1].content,
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

      const { container } = renderWithProviders(
        <Editor store={mockStore} initialChapterId="chapter-2" />
      );

      await waitFor(() => {
        const chapterHeader = container.querySelector('.editor-chapter-header');
        expect(chapterHeader).toBeInTheDocument();
        expect(chapterHeader).toHaveTextContent('The Middle');
      });
    });

    it('displays editor statistics', async () => {
      const mockStore = createMockChapterStore({
        chapters: sampleChapters,
        initialState: {
          activeChapterId: 'chapter-1',
          content: sampleChapters[0].content,
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

      const { container } = renderWithProviders(
        <Editor store={mockStore} initialChapterId="chapter-1" />
      );

      await waitFor(() => {
        const stats = container.querySelector('.editor-stats');
        expect(stats).toBeInTheDocument();
        expect(stats).toHaveTextContent(/Blocks:/);
        expect(stats).toHaveTextContent(/Words:/);
      });
    });
  });

  describe('Editor Initialization', () => {
    it('properly initializes editor instance', async () => {
      const mockStore = createMockChapterStore({
        chapters: sampleChapters,
      });

      const { container } = renderWithProviders(
        <Editor store={mockStore} />
      );

      // Verify editor container is created
      const editorContainer = container.querySelector('.editor-container');
      expect(editorContainer).toBeInTheDocument();

      // Verify toolbar is rendered
      const toolbar = container.querySelector('.editor-toolbar');
      expect(toolbar).toBeInTheDocument();

      // Verify main editor area is rendered
      const editorMain = container.querySelector('.editor-main');
      expect(editorMain).toBeInTheDocument();
    });

    it('subscribes to store updates on mount', async () => {
      const mockStore = createMockChapterStore({
        chapters: sampleChapters,
      });

      const subscribeSpy = jest.spyOn(mockStore, 'subscribe');

      renderWithProviders(<Editor store={mockStore} />);

      expect(subscribeSpy).toHaveBeenCalled();

      // Verify subscription returns an unsubscribe function
      const unsubscribe = subscribeSpy.mock.results[0].value;
      expect(typeof unsubscribe).toBe('function');
    });

    it('loads initial chapter if provided', async () => {
      const mockStore = createMockChapterStore({
        chapters: sampleChapters,
      });

      const loadChapterSpy = jest.spyOn(mockStore, 'loadChapter');

      renderWithProviders(
        <Editor store={mockStore} initialChapterId="chapter-1" />
      );

      await waitFor(() => {
        expect(loadChapterSpy).toHaveBeenCalledWith('chapter-1');
      });
    });

    it('calls onChapterChange when active chapter changes', async () => {
      const mockStore = createMockChapterStore({
        chapters: sampleChapters,
        initialState: {
          activeChapterId: 'chapter-1',
          content: sampleChapters[0].content,
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

      const onChapterChange = jest.fn();

      renderWithProviders(
        <Editor
          store={mockStore}
          initialChapterId="chapter-1"
          onChapterChange={onChapterChange}
        />
      );

      await waitFor(() => {
        expect(onChapterChange).toHaveBeenCalledWith('chapter-1');
      });
    });
  });

  describe('Null/Undefined Content Handling', () => {
    it('handles empty content array gracefully', async () => {
      const mockStore = createMockChapterStore({
        chapters: [emptyChapter],
        initialState: {
          activeChapterId: 'chapter-empty',
          content: [],
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

      const { container } = renderWithProviders(
        <Editor store={mockStore} initialChapterId="chapter-empty" />
      );

      await waitFor(() => {
        const emptyContent = container.querySelector('.editor-empty-content');
        expect(emptyContent).toBeInTheDocument();
        expect(emptyContent).toHaveTextContent(/This chapter is empty/i);
      });
    });

    it('handles chapter with missing title gracefully', async () => {
      const chapterWithoutTitle = {
        ...sampleChapters[0],
        title: undefined,
      };

      const mockStore = createMockChapterStore({
        chapters: [chapterWithoutTitle as any],
        initialState: {
          activeChapterId: 'chapter-1',
          content: chapterWithoutTitle.content,
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

      const { container } = renderWithProviders(
        <Editor store={mockStore} initialChapterId="chapter-1" />
      );

      await waitFor(() => {
        // Should still render editor content
        const editorContent = container.querySelector('.editor-content');
        expect(editorContent).toBeInTheDocument();
      });
    });

    it('handles store state updates with null activeChapterId', async () => {
      const mockStore = createMockChapterStore({
        chapters: sampleChapters,
        initialState: {
          activeChapterId: null,
          content: [],
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

      renderWithProviders(<Editor store={mockStore} />);

      // Should show empty state
      expect(screen.getByText(/select a chapter to start editing/i)).toBeInTheDocument();
    });

    it('handles content blocks with empty content', async () => {
      const chapterWithEmptyBlocks = {
        ...sampleChapters[0],
        content: [
          {
            id: 'block-1',
            content: '',
            blockType: 'paragraph' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      const mockStore = createMockChapterStore({
        chapters: [chapterWithEmptyBlocks],
        initialState: {
          activeChapterId: 'chapter-1',
          content: chapterWithEmptyBlocks.content,
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

      const { container } = renderWithProviders(
        <Editor store={mockStore} initialChapterId="chapter-1" />
      );

      await waitFor(() => {
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue('');
      });
    });
  });

  describe('Store Integration', () => {
    it('reflects store state changes in UI', async () => {
      const mockStore = createMockChapterStore({
        chapters: sampleChapters,
        initialState: {
          activeChapterId: null,
          content: [],
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

      renderWithProviders(<Editor store={mockStore} />);

      // Initially shows empty state
      expect(screen.getByText(/select a chapter to start editing/i)).toBeInTheDocument();

      // Load a chapter
      await mockStore.loadChapter('chapter-1');

      // Should now show chapter content
      await waitFor(() => {
        expect(screen.queryByText(/select a chapter to start editing/i)).not.toBeInTheDocument();
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });
    });

    it('displays unsaved changes indicator when content is dirty', async () => {
      const mockStore = createMockChapterStore({
        chapters: sampleChapters,
        initialState: {
          activeChapterId: 'chapter-1',
          content: sampleChapters[0].content,
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

      const { container } = renderWithProviders(
        <Editor store={mockStore} initialChapterId="chapter-1" />
      );

      // Make the content dirty by updating it
      await waitFor(() => {
        expect(screen.getByText('The Beginning')).toBeInTheDocument();
      });

      mockStore.updateContent([
        ...sampleChapters[0].content,
        {
          id: 'new-block',
          content: 'New content',
          blockType: 'paragraph',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      await waitFor(() => {
        const statusBar = container.querySelector('.editor-status-bar');
        expect(statusBar).toBeInTheDocument();
        expect(statusBar).toHaveTextContent(/unsaved changes/i);
      });
    });

    it('hides unsaved changes indicator when content is clean', async () => {
      const mockStore = createMockChapterStore({
        chapters: sampleChapters,
        initialState: {
          activeChapterId: 'chapter-1',
          content: sampleChapters[0].content,
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

      const { container } = renderWithProviders(
        <Editor store={mockStore} initialChapterId="chapter-1" />
      );

      await waitFor(() => {
        const statusBar = container.querySelector('.editor-status-bar');
        expect(statusBar).not.toBeInTheDocument();
      });
    });
  });
});
