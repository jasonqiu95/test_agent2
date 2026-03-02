/**
 * Editor Component Tests
 * Example test demonstrating usage of test utilities
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../__tests__/utils';
import { createMockChapterStore } from '../../../__tests__/utils/mockChapterStore';
import { sampleChapters } from '../../../__tests__/fixtures';
import { Editor } from '../Editor';

describe('Editor', () => {
  it('renders without crashing', () => {
    const mockStore = createMockChapterStore({
      chapters: sampleChapters,
    });

    renderWithProviders(<Editor store={mockStore} />);

    expect(screen.getByText(/select a chapter to start editing/i)).toBeInTheDocument();
  });

  it('loads and displays chapter content', async () => {
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

  it('shows loading state while loading chapter', async () => {
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
    });
  });

  it('mock store utilities work correctly', async () => {
    // Test that our mock store utilities function properly
    const mockStore = createMockChapterStore({
      chapters: sampleChapters,
    });

    // Load a chapter
    await mockStore.loadChapter('chapter-1');
    expect(mockStore.getState().activeChapterId).toBe('chapter-1');

    // Update content and verify dirty state
    const newContent = [
      ...sampleChapters[0].content,
      { id: 'new-block', content: 'New content', blockType: 'paragraph' as const, createdAt: new Date(), updatedAt: new Date() },
    ];
    mockStore.updateContent(newContent);
    expect(mockStore.getState().isDirty).toBe(true);

    // Save and verify clean state
    await mockStore.saveCurrentChapter();
    expect(mockStore.getState().isDirty).toBe(false);
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
